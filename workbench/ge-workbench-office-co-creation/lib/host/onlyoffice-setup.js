import { execFile } from 'node:child_process'
import { access } from 'node:fs/promises'
import { arch, platform } from 'node:os'
import { delimiter, dirname, join } from 'node:path'

const CONTAINER = 'office-co-creation-ds'
const IMAGE = 'onlyoffice/documentserver:latest'
const MIRRORS = [
  'docker.m.daocloud.io',
  'docker.1ms.run',
  'docker.xuanyuan.me',
]
const CONTAINER_PORT = 18080
const MAX_LOG = 6000
const START_TIMEOUT_MS = 240_000

function dockerCandidates() {
  if (platform() === 'darwin') {
    return [
      '/Applications/Docker.app/Contents/Resources/bin/docker',
      '/usr/local/bin/docker',
      '/opt/homebrew/bin/docker',
    ]
  }
  if (platform() === 'win32') {
    const env = process.env
    const roots = [
      env.ProgramFiles,
      env['ProgramFiles(x86)'],
      env.ProgramW6432,
      env.LOCALAPPDATA,
      'C:\\Program Files',
      'C:\\Program Files (x86)',
    ].filter(Boolean)
    const candidates = []
    for (const root of roots) {
      candidates.push(join(root, 'Docker', 'Docker', 'resources', 'bin', 'docker.exe'))
      candidates.push(join(root, 'Docker', 'Docker', 'resources', 'docker.exe'))
      candidates.push(join(root, 'Docker', 'resources', 'bin', 'docker.exe'))
      candidates.push(join(root, 'Programs', 'Docker', 'Docker', 'resources', 'bin', 'docker.exe'))
      candidates.push(join(root, 'Programs', 'Docker', 'Docker', 'resources', 'docker.exe'))
    }
    return candidates
  }
  return ['/usr/bin/docker', '/usr/local/bin/docker', '/snap/bin/docker']
}

function envWithPath(dir) {
  if (!dir) return process.env
  const key = Object.keys(process.env).find((name) => name.toUpperCase() === 'PATH') || 'PATH'
  return { ...process.env, [key]: `${dir}${delimiter}${process.env[key] || ''}` }
}

function runDocker(args, timeout = 20_000, dir = '') {
  return new Promise((resolve) => {
    execFile('docker', args, { timeout, maxBuffer: 1024 * 1024, windowsHide: true, env: envWithPath(dir) }, (error, stdout, stderr) => {
      resolve({
        ok: !error,
        code: error?.code ?? 0,
        stdout: String(stdout || ''),
        stderr: String(stderr || error?.message || ''),
      })
    })
  })
}

function runOpen(args, timeout = 10_000) {
  return new Promise((resolve) => {
    execFile('open', args, { timeout, maxBuffer: 1024 * 1024, windowsHide: true }, (error, stdout, stderr) => {
      resolve({
        ok: !error,
        code: error?.code ?? 0,
        stdout: String(stdout || ''),
        stderr: String(stderr || error?.message || ''),
      })
    })
  })
}

function runDockerStreaming(args, dir, onData) {
  return new Promise((resolve) => {
    const child = execFile('docker', args, {
      timeout: 15 * 60_000,
      maxBuffer: 4 * 1024 * 1024,
      windowsHide: true,
      env: envWithPath(dir),
    })
    child.stdout?.on('data', (chunk) => onData(String(chunk)))
    child.stderr?.on('data', (chunk) => onData(String(chunk)))
    child.on('error', (error) => resolve({ ok: false, code: -1, stderr: error.message }))
    child.on('close', (code) => resolve({ ok: code === 0, code, stderr: '' }))
  })
}

async function resolveDocker() {
  const onPath = await runDocker(['--version'], 8000)
  if (onPath.ok) return { path: 'docker', dir: '', version: onPath.stdout.trim() }
  for (const candidate of dockerCandidates()) {
    try {
      await access(candidate)
    } catch {
      continue
    }
    const dir = dirname(candidate)
    const probe = await runDocker(['--version'], 8000, dir)
    if (probe.ok) return { path: candidate, dir, version: probe.stdout.trim() }
  }
  return null
}

function dockerRunArgs(image = IMAGE) {
  const args = [
    'run', '-d',
    '--name', CONTAINER,
    '-p', `127.0.0.1:${CONTAINER_PORT}:80`,
    '-e', 'JWT_ENABLED=false',
    '-e', 'ALLOW_PRIVATE_IP_ADDRESS=true',
  ]
  if (platform() === 'darwin') {
    args.push('--platform', arch() === 'arm64' ? 'linux/arm64' : 'linux/amd64')
  } else if (platform() === 'linux') {
    args.push('--add-host', 'host.docker.internal:host-gateway')
  }
  args.push(image)
  return args
}

function mirrorImages() {
  return MIRRORS.map((mirror) => `${mirror}/${IMAGE}`)
}

function parseBytes(value, unit) {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return 0
  const prefix = String(unit || '').toUpperCase().charAt(0)
  const scale = prefix === 'G' ? 1e9 : prefix === 'M' ? 1e6 : prefix === 'K' ? 1e3 : 1
  return Math.round(amount * scale)
}

const LAYER_ACTIVE = new RegExp('^([0-9a-f]{6,64}):\\s+(Downloading|Extracting)\\s+\\[[^\\]]*\\]\\s+([\\d.]+)\\s*([kKMGT]?i?B)\\s*/\\s*([\\d.]+)\\s*([kKMGT]?i?B)', 'i')
const LAYER_STATE = new RegExp('^([0-9a-f]{6,64}):\\s+(Pulling fs layer|Waiting|Verifying Checksum|Download complete|Pull complete)', 'i')

function manualCommand() {
  const platformArg = platform() === 'darwin'
    ? ` --platform ${arch() === 'arm64' ? 'linux/arm64' : 'linux/amd64'}`
    : platform() === 'linux' ? ' --add-host host.docker.internal:host-gateway' : ''
  if (platform() === 'win32') {
    // cmd / PowerShell 不认反斜杠续行，Windows 下给单行命令。
    return `docker run -d --name ${CONTAINER} -p 127.0.0.1:${CONTAINER_PORT}:80 ` +
      '-e JWT_ENABLED=false -e ALLOW_PRIVATE_IP_ADDRESS=true ' +
      `${IMAGE}`
  }
  return `docker run -d --name ${CONTAINER}${platformArg} \\\n` +
    `  -p 127.0.0.1:${CONTAINER_PORT}:80 \\\n` +
    '  -e JWT_ENABLED=false \\\n' +
    '  -e ALLOW_PRIVATE_IP_ADDRESS=true \\\n' +
    `  ${IMAGE}`
}

function dockerInstallGuide() {
  if (platform() === 'linux') {
    return {
      url: 'https://docs.docker.com/engine/install/',
      text: '安装 Docker Engine 后，确认当前用户可以直接执行 docker 命令（sudo usermod -aG docker $USER，重新登录生效）。',
    }
  }
  return {
    url: 'https://www.docker.com/products/docker-desktop/',
    text: platform() === 'win32'
      ? '安装 Docker Desktop for Windows（需要启用 WSL2），安装后启动并等鲸鱼图标显示 Running。'
      : '安装 Docker Desktop for Mac，安装后启动并等鲸鱼图标显示 Running。',
  }
}

export class OnlyOfficeSetup {
  constructor({ documentServer, baseUrl, port = CONTAINER_PORT }) {
    this.documentServer = documentServer
    this.baseUrl = baseUrl
    this.port = port
    this.job = {
      running: false,
      step: '',
      detail: '',
      startedAt: null,
      finishedAt: null,
      error: null,
      logTail: '',
      updatedAt: null,
      progress: null,
    }
    this.layers = new Map()
  }

  append(text) {
    const clean = String(text).replace(/\r/g, '\n')
    const next = `${this.job.logTail}${clean}`
    this.job.logTail = next.length > MAX_LOG ? next.slice(-MAX_LOG) : next
    this.job.updatedAt = Date.now()
    for (const line of clean.split('\n')) {
      if (line.trim()) this.parseProgress(line.trim())
    }
  }

  parseProgress(line) {
    const active = line.match(LAYER_ACTIVE)
    if (active) {
      const [, id, kind, doneValue, doneUnit, totalValue, totalUnit] = active
      const layer = this.layers.get(id) || { download: null, extract: null, downloadDone: false }
      const point = { done: parseBytes(doneValue, doneUnit), total: parseBytes(totalValue, totalUnit) }
      if (kind.toLowerCase() === 'downloading') layer.download = point
      else layer.extract = point
      this.layers.set(id, layer)
      this.recomputeProgress()
      return
    }
    const marked = line.match(LAYER_STATE)
    if (marked) {
      const [, id, state] = marked
      const layer = this.layers.get(id) || { download: null, extract: null, downloadDone: false }
      const lowered = state.toLowerCase()
      if (lowered.includes('download complete') || lowered.includes('pull complete')) layer.downloadDone = true
      this.layers.set(id, layer)
      this.recomputeProgress()
      return
    }
    if (line.startsWith('Status: Downloaded newer image') || line.startsWith('Status: Image is up to date')) {
      this.job.progress = { percent: 99, phase: 'starting' }
    }
  }

  recomputeProgress() {
    const layers = [...this.layers.values()].filter((layer) => layer.download?.total)
    if (!layers.length) {
      this.job.progress = { percent: null, phase: 'download' }
      return
    }
    const downloadTotal = layers.reduce((sum, layer) => sum + layer.download.total, 0)
    const downloadDone = layers.reduce((sum, layer) => (
      layer.downloadDone ? sum + layer.download.total : sum + Math.min(layer.download.done, layer.download.total)
    ), 0)
    const extractLayers = layers.filter((layer) => layer.extract?.total)
    const extractTotal = extractLayers.reduce((sum, layer) => sum + layer.extract.total, 0)
    const extractDone = extractLayers.reduce((sum, layer) => sum + Math.min(layer.extract.done, layer.extract.total), 0)
    const allDownloaded = layers.every((layer) => layer.downloadDone || layer.download.done >= layer.download.total)
    let ratio = downloadTotal ? downloadDone / downloadTotal : 0
    let phase = 'download'
    if (allDownloaded) {
      phase = 'extract'
      ratio = extractTotal ? 0.9 + 0.09 * (extractDone / extractTotal) : 0.95
    } else {
      ratio *= 0.9
    }
    this.job.progress = {
      percent: Math.max(1, Math.min(99, Math.round(ratio * 100))),
      downloaded: downloadDone,
      total: downloadTotal,
      phase,
    }
  }

  async openDockerDesktop() {
    if (platform() === 'darwin') {
      const result = await runOpen(['-a', 'Docker'])
      return result.ok
        ? { started: true, message: '正在启动 Docker Desktop，等它显示 Running 后点“重新检测”。' }
        : { started: false, message: '没有找到 Docker Desktop，请从“应用程序”里手动启动。' }
    }
    if (platform() === 'win32') {
      return { started: false, message: '请从开始菜单打开 Docker Desktop，等它显示 Running 后点“重新检测”（首次启动可能要 1 分钟）。' }
    }
    return { started: false, message: 'Linux 请在终端执行 sudo systemctl start docker，然后点“重新检测”。' }
  }

  async dockerStatus() {
    const resolved = await resolveDocker()
    if (!resolved) return { installed: false, running: false, version: '' }
    this.dockerPath = resolved.path
    this.dockerDir = resolved.dir
    const cli = { ok: true, stdout: resolved.version }
    const daemon = await runDocker(['info', '--format', '{{.ServerVersion}}'], 10_000, resolved.dir)
    if (!daemon.ok) {
      return { installed: true, running: false, version: cli.stdout.trim(), cliPath: resolved.path, daemonError: daemon.stderr.trim().slice(0, 300) }
    }
    const info = await runDocker(['inspect', '-f', '{{.State.Running}}|{{.Config.Image}}', CONTAINER], 10_000, resolved.dir)
    const exists = info.ok
    const [runningRaw, imageRaw] = exists ? info.stdout.trim().split('|') : ['false', '']
    return {
      installed: true,
      running: true,
      version: daemon.stdout.trim() || cli.stdout.trim(),
      cliPath: resolved.path,
      container: {
        name: CONTAINER,
        exists,
        running: runningRaw === 'true',
        image: imageRaw || '',
      },
    }
  }

  async status() {
    const [docker, serverUp] = await Promise.all([
      this.dockerStatus(),
      this.documentServer.probe(),
    ])
    return {
      documentServerUrl: this.baseUrl,
      port: this.port,
      image: IMAGE,
      mirrors: mirrorImages(),
      containerName: CONTAINER,
      docker,
      serverUp,
      guide: docker.installed ? null : dockerInstallGuide(),
      manualCommand: manualCommand(),
      job: { ...this.job },
    }
  }

  async waitUntilUp() {
    const deadline = Date.now() + START_TIMEOUT_MS
    while (Date.now() < deadline) {
      if (await this.documentServer.probe()) return true
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }
    return false
  }

  async start(options = {}) {
    if (this.job.running) return { started: false, already: true, job: { ...this.job } }
    // 只接受镜像列表的下标，实际镜像名始终来自服务端常量，避免用户输入进入命令参数。
    const mirror = Number(options?.mirror)
    this.jobImage = Number.isInteger(mirror) && mirror >= 0 && mirror < MIRRORS.length
      ? `${MIRRORS[mirror]}/${IMAGE}`
      : IMAGE
    this.job = {
      running: true,
      step: '检查 Docker',
      detail: '',
      startedAt: Date.now(),
      finishedAt: null,
      error: null,
      logTail: '',
      updatedAt: Date.now(),
      progress: null,
    }
    this.layers = new Map()
    this.runJob().catch((error) => {
      this.job.running = false
      this.job.finishedAt = Date.now()
      this.job.error = error instanceof Error ? error.message : String(error)
      this.job.step = '安装失败'
      this.append(`\n[error] ${this.job.error}\n`)
    })
    return { started: true, already: false, job: { ...this.job } }
  }

  async runJob() {
    const docker = await this.dockerStatus()
    if (!docker.installed) {
      const guide = dockerInstallGuide()
      this.job.error = '没有找到 Docker。请先安装 Docker Desktop。'
      this.job.detail = guide.text
      this.job.step = '缺少 Docker'
      this.append(`[error] ${this.job.error}\n${guide.text}\n${guide.url}\n`)
      this.job.running = false
      this.job.finishedAt = Date.now()
      return
    }
    if (!docker.running) {
      this.job.error = 'Docker 已安装，但服务没有运行。'
      this.job.detail = '请打开 Docker Desktop，等它显示 Running 后重试。'
      this.job.step = 'Docker 未运行'
      this.append(`[error] ${this.job.error}\n${docker.daemonError || ''}\n`)
      this.job.running = false
      this.job.finishedAt = Date.now()
      return
    }

    const container = docker.container
    const dockerDir = this.dockerDir || ''
    if (container?.exists && container.running) {
      this.job.step = '容器已在运行'
      this.job.detail = '正在等待 Document Server 就绪…'
      this.append('[info] 容器 office-co-creation-ds 已在运行\n')
    } else if (container?.exists) {
      this.job.step = '启动已有容器'
      this.job.detail = 'docker start office-co-creation-ds'
      const started = await runDocker(['start', CONTAINER], 60_000, dockerDir)
      this.append(started.ok ? '[info] 容器已启动\n' : `[error] ${started.stderr}\n`)
      if (!started.ok) {
        this.job.error = '启动 OnlyOffice 容器失败。'
        this.job.step = '启动失败'
        this.job.running = false
        this.job.finishedAt = Date.now()
        return
      }
    } else {
      const image = this.jobImage || IMAGE
      this.job.step = '安装 OnlyOffice'
      this.job.detail = `首次运行会拉取约 1–2 GB 镜像（${image}），请保持网络连接…`
      this.append(`[info] docker ${dockerRunArgs(image).join(' ')}\n`)
      const result = await runDockerStreaming(dockerRunArgs(image), dockerDir, (chunk) => this.append(chunk))
      if (!result.ok) {
        const tail = this.job.logTail.trim().split('\n').slice(-6).join('\n')
        this.job.error = `创建 OnlyOffice 容器失败（退出码 ${result.code}）。`
        this.job.detail = result.stderr || tail || '请查看安装日志。'
        this.job.step = '安装失败'
        this.job.running = false
        this.job.finishedAt = Date.now()
        return
      }
      this.append('[info] 容器已创建\n')
    }

    this.job.step = '等待 Document Server 就绪'
    this.job.detail = '首次启动通常需要 30–120 秒；如果正在拉取镜像会更久。'
    this.job.progress = { percent: 100, phase: 'starting' }
    this.job.updatedAt = Date.now()
    const up = await this.waitUntilUp()
    this.job.running = false
    this.job.finishedAt = Date.now()
    if (!up) {
      this.job.step = '等待超时'
      this.job.error = 'OnlyOffice 容器已创建，但 4 分钟内没有就绪。'
      this.job.detail = `可以稍后点“重新检测”，或查看容器日志：docker logs ${CONTAINER}`
      this.append(`[error] ${this.job.error}\n`)
      return
    }
    this.job.step = '安装完成'
    this.job.detail = 'OnlyOffice 已连接，可以打开文件了。'
    this.append('[info] OnlyOffice 已就绪\n')
  }
}