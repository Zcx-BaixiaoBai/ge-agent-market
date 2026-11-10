import { execFile } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const MAX_HTML = 300 * 1024
const MAX_TEXT = 1 * 1024 * 1024

const READ_SCRIPT = `ObjC.import('AppKit');
const pb = $.NSPasteboard.generalPasteboard;
const html = pb.stringForType($.NSPasteboardTypeHTML);
const text = pb.stringForType($.NSPasteboardTypeString);
JSON.stringify({
  html: html ? ObjC.unwrap(html) : '',
  text: text ? ObjC.unwrap(text) : ''
});`

const WRITE_SCRIPT = `function run(argv) {
  ObjC.import('AppKit');
  ObjC.import('Foundation');
  const raw = $.NSString.stringWithContentsOfFileEncodingError(argv[0], $.NSUTF8StringEncoding, null);
  if (!raw) throw new Error('clipboard payload not readable');
  const parsed = JSON.parse(ObjC.unwrap(raw));
  const pb = $.NSPasteboard.generalPasteboard;
  pb.clearContents;
  if (parsed.html) pb.setStringForType(parsed.html, $.NSPasteboardTypeHTML);
  if (parsed.text) pb.setStringForType(parsed.text, $.NSPasteboardTypeString);
  return 'ok';
}`

function fail(message, status = 400) {
  const error = new Error(message)
  error.status = status
  return error
}

function assertDarwin() {
  if (process.platform !== 'darwin') throw fail('云文档剪贴板暂只支持 macOS', 501)
}

export async function readSystemClipboard() {
  assertDarwin()
  let stdout
  try {
    const result = await execFileAsync(
      'osascript',
      ['-l', 'JavaScript', '-e', READ_SCRIPT],
      { timeout: 6_000, maxBuffer: 4 * 1024 * 1024 },
    )
    stdout = result.stdout
  } catch (error) {
    throw fail(`读取系统剪贴板失败：${error.message}`, 502)
  }
  let parsed
  try {
    parsed = JSON.parse(String(stdout || '{}'))
  } catch {
    throw fail('系统剪贴板内容无法解析', 502)
  }
  return {
    html: typeof parsed.html === 'string' ? parsed.html : '',
    text: typeof parsed.text === 'string' ? parsed.text : '',
  }
}

export async function writeSystemClipboard(html, text) {
  assertDarwin()
  const safeHtml = typeof html === 'string' ? html : ''
  const safeText = typeof text === 'string' ? text : ''
  if (safeHtml.length > MAX_HTML) throw fail('剪贴板 HTML 超过 300KB 上限', 413)
  if (safeText.length > MAX_TEXT) throw fail('剪贴板文本超过 1MB 上限', 413)
  const directory = await mkdtemp(join(tmpdir(), 'occ-cloud-clipboard-'))
  const file = join(directory, 'payload.json')
  try {
    await writeFile(file, JSON.stringify({ html: safeHtml, text: safeText }), { mode: 0o600 })
    await execFileAsync(
      'osascript',
      ['-l', 'JavaScript', '-e', WRITE_SCRIPT, '--', file],
      { timeout: 6_000, maxBuffer: 1024 * 1024 },
    )
  } catch (error) {
    throw fail(`写入系统剪贴板失败：${error.message}`, 502)
  } finally {
    await rm(directory, { recursive: true, force: true }).catch(() => {})
  }
  return { ok: true }
}

export const cloudClipboardInternals = { READ_SCRIPT, WRITE_SCRIPT }