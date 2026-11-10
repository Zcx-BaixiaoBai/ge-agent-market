import { createHash, randomBytes, randomUUID } from 'node:crypto'
import {
  chmod, copyFile, lstat, mkdir, readFile, readdir, realpath, rename, stat, unlink, writeFile,
} from 'node:fs/promises'
import { createReadStream } from 'node:fs'
import { basename, dirname, extname, isAbsolute, join, relative, sep } from 'node:path'

const ALLOWED_EXT = new Set(['.xlsx', '.xls', '.csv', '.ods', '.docx', '.doc', '.odt', '.pptx', '.ppt', '.odp', '.pdf'])
const MAX_FILE_BYTES = 150 * 1024 * 1024
const MAX_SCAN_DEPTH = 3
const MAX_SCAN_FILES = 300
const MAX_SCAN_ENTRIES = 5000
const SCAN_TIME_MS = 4000
const RECENT_LIMIT = 20
const BACKUP_LIMIT = 8

const MIME = {
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.xls': 'application/vnd.ms-excel',
  '.csv': 'text/csv; charset=utf-8',
  '.ods': 'application/vnd.oasis.opendocument.spreadsheet',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.doc': 'application/msword',
  '.odt': 'application/vnd.oasis.opendocument.text',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.odp': 'application/vnd.oasis.opendocument.presentation',
  '.pdf': 'application/pdf',
}

function fail(message, status = 400) {
  const error = new Error(message)
  error.status = status
  return error
}

function isInside(root, target) {
  const rel = relative(root, target)
  return rel !== '' && rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel)
}

async function hashFile(file) {
  const hash = createHash('sha256')
  await new Promise((resolve, reject) => {
    const stream = createReadStream(file)
    stream.on('data', (chunk) => hash.update(chunk))
    stream.on('error', reject)
    stream.on('end', resolve)
  })
  return hash.digest('hex')
}

export function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex')
}

function backupKeyFor(file) {
  return sha256(Buffer.from(file)).slice(0, 16)
}

export class FileStore {
  constructor(root) {
    this.root = root
    this.folders = new Map()
    this.files = new Map()
    this.selections = new Map()
  }

  async init() {
    await mkdir(this.root, { recursive: true, mode: 0o700 })
    await mkdir(join(this.root, 'backups'), { recursive: true, mode: 0o700 })
  }

  get(fileId, token) {
    const meta = this.files.get(fileId)
    if (!meta) throw fail('文件未打开或已关闭', 404)
    if (token !== undefined && token !== meta.token) throw fail('文件访问令牌无效', 403)
    return meta
  }

  getByPluginToken(fileId, pluginToken) {
    const meta = this.files.get(fileId)
    if (!meta) throw fail('文件未打开或已关闭', 404)
    if (pluginToken !== meta.pluginToken) throw fail('编辑器令牌无效', 403)
    return meta
  }

  publicMeta(meta) {
    return {
      fileId: meta.fileId,
      name: meta.name,
      ext: meta.ext,
      folderPath: meta.folderPath,
      relativePath: meta.relativePath,
      version: meta.version,
      size: meta.size,
      sha256: meta.sha256,
      token: meta.token,
      pluginToken: meta.pluginToken,
      openedAt: meta.openedAt,
      lastSaveAt: meta.lastSaveAt ?? null,
    }
  }

  async openFolder(inputPath) {
    if (typeof inputPath !== 'string' || !inputPath.trim() || !isAbsolute(inputPath)) {
      throw fail('请选择绝对路径的文件夹')
    }
    let info
    try {
      info = await lstat(inputPath)
    } catch {
      throw fail('文件夹不存在或无法访问')
    }
    if (info.isSymbolicLink()) throw fail('不能选择符号链接目录')
    if (!info.isDirectory()) throw fail('所选路径不是文件夹')
    const folderPath = await realpath(inputPath)
    const meta = {}
    const files = await this.listFiles(folderPath, undefined, meta)
    const folderId = randomUUID()
    this.folders.set(folderId, folderPath)
    return { folderId, path: folderPath, files, truncated: meta.truncated === true }
  }

  async listFiles(folderPath, depthLimit = MAX_SCAN_DEPTH, meta = null) {
    const files = []
    let entriesSeen = 0
    let stopped = false
    const deadline = Date.now() + SCAN_TIME_MS
    const stop = () => {
      if (!stopped) {
        stopped = true
        if (meta) meta.truncated = true
      }
    }
    const walk = async (directory, depth) => {
      if (stopped) return
      if (files.length >= MAX_SCAN_FILES || entriesSeen >= MAX_SCAN_ENTRIES || Date.now() > deadline) {
        stop()
        return
      }
      let entries
      try {
        entries = await readdir(directory, { withFileTypes: true })
      } catch {
        return
      }
      entriesSeen += entries.length
      for (const entry of entries) {
        if (stopped) return
        if (files.length >= MAX_SCAN_FILES || entriesSeen >= MAX_SCAN_ENTRIES || Date.now() > deadline) {
          stop()
          return
        }
        if (entry.name.startsWith('.') || entry.name === 'node_modules') continue
        const absolute = join(directory, entry.name)
        if (entry.isSymbolicLink()) continue
        if (entry.isDirectory()) {
          if (depth < depthLimit) await walk(absolute, depth + 1)
          continue
        }
        if (!entry.isFile()) continue
        const ext = extname(entry.name).toLowerCase()
        if (!ALLOWED_EXT.has(ext)) continue
        let entryStat
        try {
          entryStat = await stat(absolute)
        } catch {
          continue
        }
        if (entryStat.size > MAX_FILE_BYTES) continue
        files.push({
          relativePath: relative(folderPath, absolute).split(sep).join('/'),
          name: entry.name,
          ext,
          size: entryStat.size,
          mtimeMs: entryStat.mtimeMs,
        })
      }
    }
    await walk(folderPath, 0)
    files.sort((left, right) => right.mtimeMs - left.mtimeMs)
    return files
  }

  async register(folderPath, relativePath) {
    const root = await realpath(folderPath)
    if (typeof relativePath !== 'string' || !relativePath || isAbsolute(relativePath)) {
      throw fail('文件相对路径无效')
    }
    const direct = join(root, relativePath)
    let info
    try {
      info = await lstat(direct)
    } catch {
      throw fail('文件不存在或无法访问', 404)
    }
    if (info.isSymbolicLink() || !info.isFile()) throw fail('只能打开普通文件')
    const target = await realpath(direct)
    if (!isInside(root, target)) throw fail('文件不在所选文件夹内', 403)
    const ext = extname(target).toLowerCase()
    if (!ALLOWED_EXT.has(ext)) throw fail('仅支持 Office 文档（docx/doc/xlsx/xls/csv/pptx/ppt 等）')
    if (info.size > MAX_FILE_BYTES) throw fail('文件超过 150MB，暂不支持')
    const digest = await hashFile(target)
    const fileId = randomUUID()
    const meta = {
      fileId,
      path: target,
      folderPath: root,
      relativePath: relative(root, target).split(sep).join('/'),
      name: basename(target),
      ext,
      size: info.size,
      version: 1,
      sha256: digest,
      token: randomBytes(24).toString('hex'),
      pluginToken: randomBytes(18).toString('hex'),
      backupKey: backupKeyFor(target),
      openedAt: Date.now(),
      lastSaveAt: null,
      backups: [],
    }
    this.files.set(fileId, meta)
    await this.loadBackups(meta)
    await this.remember(meta)
    return this.publicMeta(meta)
  }

  async openRecent(folderPath, relativePath) {
    if (typeof folderPath !== 'string' || !isAbsolute(folderPath)) throw fail('最近文件目录无效')
    if (typeof relativePath !== 'string' || !relativePath) throw fail('最近文件路径无效')
    const root = await realpath(folderPath)
    const recent = await this.recent()
    if (!recent.some((item) => item.folderPath === root && item.relativePath === relativePath)) {
      throw fail('这条最近文件记录已失效，请重新选择文件夹', 403)
    }
    const meta = await this.register(root, relativePath)
    const folderId = randomUUID()
    this.folders.set(folderId, root)
    const files = await this.listFiles(root, 0)
    return { ...this.publicMeta(meta), folderId, folderPath: root, files }
  }

  async registerInFolder(folderId, relativePath) {
    const folderPath = this.folders.get(folderId)
    if (!folderPath) throw fail('文件夹未授权或已失效，请重新选择', 403)
    return this.register(folderPath, relativePath)
  }

  async registerFilePath(inputPath) {
    if (typeof inputPath !== 'string' || !inputPath.trim() || !isAbsolute(inputPath)) {
      throw fail('请选择绝对路径的文件')
    }
    let info
    try {
      info = await lstat(inputPath)
    } catch {
      throw fail('文件不存在或无法访问', 404)
    }
    if (info.isSymbolicLink() || !info.isFile()) throw fail('只能打开普通文件')
    const real = await realpath(inputPath)
    const ext = extname(real).toLowerCase()
    if (!ALLOWED_EXT.has(ext)) throw fail('仅支持 Office 文档（docx/doc/xlsx/xls/csv/pptx/ppt 等）')
    if (info.size > MAX_FILE_BYTES) throw fail('文件超过 150MB，暂不支持')
    const folderPath = dirname(real)
    const meta = await this.register(folderPath, basename(real))
    const folderId = randomUUID()
    this.folders.set(folderId, folderPath)
    const files = await this.listFiles(folderPath, 0)
    if (!files.some((item) => item.relativePath === meta.relativePath)) {
      files.unshift({
        relativePath: meta.relativePath,
        name: meta.name,
        ext: meta.ext,
        size: meta.size,
        mtimeMs: Date.now(),
      })
    }
    return { ...this.publicMeta(meta), folderId, folderPath, files }
  }

  async loadBackups(meta) {
    const directory = join(this.root, 'backups', meta.backupKey)
    let names = []
    try {
      names = await readdir(directory)
    } catch {
      return
    }
    const parsed = []
    for (const name of names) {
      const match = name.match(/^v(\d+)-(\d+)-(agent|manual)\.(xlsx|docx|pptx|xls|doc|ppt|ods|odt|odp|csv|pdf)$/)
      if (!match) continue
      parsed.push({
        name,
        version: Number(match[1]),
        at: Number(match[2]),
        reason: match[3],
      })
    }
    parsed.sort((left, right) => left.at - right.at)
    meta.backups = parsed.slice(-BACKUP_LIMIT)
  }

  contentType(fileId, token) {
    const meta = this.get(fileId, token)
    return MIME[meta.ext] || 'application/octet-stream'
  }

  async readContent(fileId, token) {
    const meta = this.get(fileId, token)
    const info = await stat(meta.path)
    if (info.size > MAX_FILE_BYTES) throw fail('文件超过 150MB，暂不支持')
    return { meta, buffer: await readFile(meta.path) }
  }

  async writeBack(fileId, token, buffer) {
    const meta = this.get(fileId, token)
    if (!Buffer.isBuffer(buffer) || buffer.length < 1) throw fail('保存内容为空', 422)
    if (buffer.length > MAX_FILE_BYTES) throw fail('保存内容超过 150MB，暂不支持', 413)
    const current = await hashFile(meta.path)
    if (current !== meta.sha256) {
      throw fail('文件已被外部修改，已拒绝覆盖。请重新打开文件后再试。', 409)
    }
    const temporary = join(dirname(meta.path), `.${basename(meta.path)}.${randomUUID()}.tmp`)
    await writeFile(temporary, buffer, { mode: 0o600 })
    try {
      const doubleCheck = await hashFile(meta.path)
      if (doubleCheck !== meta.sha256) throw fail('文件在保存期间被外部修改，已拒绝覆盖。', 409)
      await rename(temporary, meta.path)
    } catch (error) {
      await unlink(temporary).catch(() => {})
      throw error
    }
    await chmod(meta.path, 0o600).catch(() => {})
    meta.version += 1
    meta.sha256 = sha256(buffer)
    meta.size = buffer.length
    meta.lastSaveAt = Date.now()
    return this.publicMeta(meta)
  }

  async backup(fileId, token, reason = 'agent') {
    const meta = this.get(fileId, token)
    const safeReason = reason === 'agent' ? 'agent' : 'manual'
    const directory = join(this.root, 'backups', meta.backupKey)
    await mkdir(directory, { recursive: true, mode: 0o700 })
    const name = `v${meta.version}-${Date.now()}-${safeReason}${meta.ext}`
    const target = join(directory, name)
    await copyFile(meta.path, target)
    await chmod(target, 0o600).catch(() => {})
    const record = { name, reason: safeReason, version: meta.version, at: Date.now(), sha256: meta.sha256 }
    meta.backups.push(record)
    while (meta.backups.length > BACKUP_LIMIT) {
      const removed = meta.backups.shift()
      await unlink(join(directory, removed.name)).catch(() => {})
    }
    return record
  }

  async undo(fileId, token) {
    const meta = this.get(fileId, token)
    const backup = [...meta.backups].reverse().find((item) => item.reason === 'agent')
    if (!backup) throw fail('没有可撤销的 Agent 修改', 404)
    const current = await hashFile(meta.path)
    if (current !== meta.sha256) {
      throw fail('文件已被外部修改，无法撤销。请重新打开文件。', 409)
    }
    const source = join(this.root, 'backups', meta.backupKey, backup.name)
    const buffer = await readFile(source)
    const temporary = join(dirname(meta.path), `.${basename(meta.path)}.${randomUUID()}.tmp`)
    await writeFile(temporary, buffer, { mode: 0o600 })
    await rename(temporary, meta.path)
    await chmod(meta.path, 0o600).catch(() => {})
    meta.version += 1
    meta.sha256 = sha256(buffer)
    meta.size = buffer.length
    meta.lastSaveAt = Date.now()
    meta.backups = meta.backups.filter((item) => item !== backup)
    await unlink(source).catch(() => {})
    return this.publicMeta(meta)
  }

  async remember(meta) {
    const file = join(this.root, 'recent.json')
    let recent = []
    try {
      const parsed = JSON.parse(await readFile(file, 'utf8'))
      if (Array.isArray(parsed)) recent = parsed
    } catch {
      recent = []
    }
    recent = recent.filter((item) => !(item.folderPath === meta.folderPath && item.relativePath === meta.relativePath))
    recent.unshift({
      folderPath: meta.folderPath,
      relativePath: meta.relativePath,
      name: meta.name,
      ext: meta.ext,
      openedAt: Date.now(),
    })
    recent = recent.slice(0, RECENT_LIMIT)
    await writeFile(file, `${JSON.stringify(recent, null, 2)}\n`, { mode: 0o600 })
  }

  async recent() {
    try {
      const parsed = JSON.parse(await readFile(join(this.root, 'recent.json'), 'utf8'))
      return Array.isArray(parsed) ? parsed.slice(0, RECENT_LIMIT) : []
    } catch {
      return []
    }
  }

  setSelection(fileId, selection) {
    const meta = this.get(fileId)
    const text = typeof selection?.text === 'string' ? selection.text.slice(0, 4000) : ''
    const formula = typeof selection?.formula === 'string' ? selection.formula.slice(0, 2000) : ''
    const value = typeof selection?.value === 'string' || typeof selection?.value === 'number'
      ? String(selection.value).slice(0, 400)
      : null
    this.selections.set(fileId, {
      fileId,
      kind: selection?.kind === 'word' || selection?.kind === 'slide' ? selection.kind : 'cell',
      address: typeof selection?.address === 'string' ? selection.address.slice(0, 80) : '',
      sheet: typeof selection?.sheet === 'string' ? selection.sheet.slice(0, 80) : '',
      text,
      formula,
      value,
      at: Date.now(),
    })
  }

  selection(fileId) {
    return this.selections.get(fileId) ?? null
  }

  markPluginReady(fileId) {
    const meta = this.get(fileId)
    meta.pluginReadyAt = Date.now()
  }
}