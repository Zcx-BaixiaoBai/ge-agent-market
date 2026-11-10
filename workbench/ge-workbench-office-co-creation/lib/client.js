// 办公套件工作台 —— 客户端入口
//
// 单文件模块：React 取自宿主共享基线，其余界面与逻辑随本文件加载。
// 业务整页为主，AI 在后台修改选区，不占用页面；会话在后台创建/复用。

window.__ModuleLoader__.load({
  id: 'office-co-creation',
  factory: (require) => {
    const React = require('react')
    const h = React.createElement
    const { useCallback, useEffect, useMemo, useRef, useState } = React

    const API = '/api/office-co-creation'
    const PLUGIN_GUID = 'asc.{1b0f7f2e-6d2a-4a8a-9f6e-4c0f5f2a7d11}'
    const STYLE_ID = 'office-co-creation-style'
    const SESSION_PREFIX = 'office-co-creation.session.'

    const CSS = `
      .occ-root { --occ-gold: #c6a15b; --occ-gold-strong: #a9822f; --occ-gold-soft: #fbf6e9;
        --occ-gold-line: #e8d9b5; --occ-ink: #1f2328; --occ-muted: #6b7280; --occ-line: #ececec;
        position: relative; display: flex; flex-direction: column; width: 100%; height: 100%;
        min-height: 0; overflow: hidden; background: #fff; color: var(--occ-ink);
        font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Segoe UI", sans-serif;
        container-type: inline-size; }
      .occ-root * { box-sizing: border-box; }
      .occ-toolbar { display: flex; align-items: center; gap: 10px; width: 100%; min-height: 46px;
        padding: 7px 14px; background: #fff; border-bottom: 1px solid var(--occ-line); flex: 0 0 auto;
        flex-wrap: wrap; row-gap: 6px; }
      .occ-pathbar { flex: 1 0 100%; display: flex; align-items: center; gap: 8px; padding-top: 2px; }
      .occ-pathbar input { flex: 1 1 auto; min-width: 120px; }
      .occ-brand { display: flex; align-items: center; gap: 8px; font-weight: 600; letter-spacing: .2px;
        white-space: nowrap; }
      .occ-mark { width: 10px; height: 10px; border-radius: 2px; background: var(--occ-gold);
        box-shadow: 0 0 0 3px var(--occ-gold-soft); }
      .occ-title { font-size: 14px; }
      .occ-file { display: flex; align-items: baseline; gap: 8px; min-width: 0; max-width: 34vw;
        padding-left: 4px; border-left: 1px solid var(--occ-line); }
      .occ-filename { font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden;
        text-overflow: ellipsis; }
      .occ-folder { font-size: 11px; color: var(--occ-muted); white-space: nowrap; overflow: hidden;
        text-overflow: ellipsis; max-width: 18vw; }
      .occ-actions { display: flex; align-items: center; gap: 6px; margin-left: auto; flex-wrap: wrap; }
      .occ-root button { border: 1px solid var(--occ-gold-line); border-radius: 7px; background: #fff;
        color: var(--occ-ink); padding: 5px 10px; cursor: pointer; font-size: 12px; line-height: 1.4;
        white-space: nowrap; transition: background .15s, border-color .15s, opacity .15s; }
      .occ-root button:hover:not(:disabled) { background: var(--occ-gold-soft); border-color: var(--occ-gold); }
      .occ-root button:disabled { opacity: .45; cursor: default; }
      .occ-root button.occ-primary { background: var(--occ-gold); border-color: var(--occ-gold); color: #fff; }
      .occ-root button.occ-primary:hover:not(:disabled) { background: var(--occ-gold-strong);
        border-color: var(--occ-gold-strong); }
      .occ-root input { border: 1px solid var(--occ-gold-line); border-radius: 7px; padding: 6px 9px;
        font-size: 13px; outline: none; background: #fff; color: var(--occ-ink); min-width: 0; }
      .occ-root input:focus { border-color: var(--occ-gold); box-shadow: 0 0 0 3px var(--occ-gold-soft); }
      .occ-health { display: flex; align-items: center; gap: 5px; font-size: 11px; color: var(--occ-muted);
        white-space: nowrap; }
      .occ-dot { width: 7px; height: 7px; border-radius: 50%; background: #c9ced6; }
      .occ-dot.on { background: #6f9f5f; box-shadow: 0 0 0 2px #edf5e9; }
      .occ-body { display: flex; flex: 1 1 auto; min-height: 0; position: relative; }
      .occ-rail { width: 224px; flex: 0 0 224px; border-right: 1px solid var(--occ-line);
        background: #fff; display: flex; flex-direction: column; min-height: 0; }
      .occ-rail-head { display: flex; align-items: center; justify-content: space-between;
        padding: 10px 12px; font-size: 12px; color: var(--occ-muted); border-bottom: 1px solid #f6f6f6; }
      .occ-rail-list { overflow: auto; padding: 6px; }
      .occ-group { display: flex; flex-direction: column; }
      .occ-rail .occ-folderrow { display: flex; align-items: center; gap: 7px; width: 100%;
        text-align: left; padding: 6px 8px; border: none !important; border-radius: 0 !important;
        background: transparent !important; color: var(--occ-muted); font-size: 12.5px; }
      .occ-rail .occ-folderrow:hover { background: rgba(31,35,40,.045) !important; color: var(--occ-ink); }
      .occ-caret { width: 10px; height: 10px; position: relative; flex: 0 0 auto; opacity: .7; }
      .occ-caret::before { content: ''; position: absolute; left: 2px; top: 1px; width: 5px; height: 5px;
        border-right: 1.4px solid currentColor; border-bottom: 1.4px solid currentColor;
        transform: rotate(-45deg); transition: transform .15s ease; }
      .occ-caret.open::before { transform: rotate(45deg); top: 0; }
      .occ-foldericon { display: inline-flex; flex: 0 0 auto; }
      .occ-foldername { flex: 1 1 auto; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .occ-foldercount { flex: 0 0 auto; font-size: 10.5px; opacity: .75; }
      .occ-fileitem { display: flex; align-items: center; gap: 8px; width: 100%; text-align: left;
        border: 1px solid transparent !important; border-radius: 8px !important; padding: 7px 8px !important;
        background: #fff !important; }
      .occ-fileitem:hover { background: var(--occ-gold-soft) !important; }
      .occ-fileitem.active { background: var(--occ-gold-soft) !important; border-color: var(--occ-gold-line) !important; }
      .occ-ext { width: 22px; height: 22px; flex: 0 0 22px; border-radius: 5px; display: inline-flex;
        align-items: center; justify-content: center; font-size: 10px; font-weight: 700;
        background: var(--occ-gold-soft); color: var(--occ-gold-strong); border: 1px solid var(--occ-gold-line); }
      .occ-item-main { min-width: 0; display: flex; flex-direction: column; gap: 1px; }
      .occ-item-name { font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .occ-item-meta { font-size: 10px; color: var(--occ-muted); }
      .occ-main { flex: 1 1 auto; min-width: 0; min-height: 0; display: flex; flex-direction: column;
        position: relative; background: #fff; }
      .occ-editor-wrap { flex: 1 1 auto; min-height: 0; position: relative; }
      .occ-editor { width: 100%; height: 100%; }
      .occ-editor-loading { position: absolute; top: 10px; left: 50%; transform: translateX(-50%);
        padding: 4px 10px; border-radius: 999px; background: rgba(255,255,255,.92);
        color: var(--occ-muted); font-size: 12px; z-index: 3; pointer-events: none;
        box-shadow: 0 2px 8px rgba(0,0,0,.06); }
      .occ-landing { flex: 1 1 auto; overflow: auto; padding: 18px 22px; display: flex; flex-direction: column; }
      .occ-notice { max-width: 720px; width: 100%; margin: 0 auto; border: 1px solid var(--occ-gold-line);
        border-radius: 10px; padding: 12px 14px; background: #fffdf8; }
      .occ-notice-row { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
      .occ-notice-dot { width: 8px; height: 8px; border-radius: 50%; background: #d9a441; flex: 0 0 8px; }
      .occ-notice-text { font-size: 13px; font-weight: 600; flex: 1; }
      .occ-notice-note { font-size: 11px; color: var(--occ-muted); margin-top: 8px; }
      .occ-setup { max-width: 760px; width: 100%; margin: 0 auto; border: 1px solid var(--occ-gold-line);
        border-radius: 12px; padding: 18px 20px; background: #fffdf8; }
      .occ-setup-title { font-size: 15px; font-weight: 700; margin: 0 0 6px; }
      .occ-setup-desc { font-size: 12px; color: var(--occ-muted); line-height: 1.65; margin: 0 0 14px; }
      .occ-setup-checks { display: grid; gap: 7px; margin-bottom: 14px; }
      .occ-setup-check { display: flex; align-items: center; gap: 8px; font-size: 12px; }
      .occ-setup-check-label { min-width: 104px; color: var(--occ-muted); }
      .occ-setup-check-text { color: var(--occ-ink); }
      .occ-setup-dot { width: 8px; height: 8px; border-radius: 50%; background: #d9a441; flex: 0 0 8px; }
      .occ-setup-dot.on { background: #2f9e62; }
      .occ-setup-dot.off { background: #c9ccd2; }
      .occ-setup-actions { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
      .occ-setup-actions a { display: inline-flex; align-items: center; height: 30px; padding: 0 12px;
        border-radius: 8px; border: 1px solid var(--occ-gold-line); color: var(--occ-gold-strong);
        text-decoration: none; font-size: 12px; background: #fff; }
      .occ-setup-detail { font-size: 12px; line-height: 1.6; margin-top: 10px; }
      .occ-setup-error { color: #b3261e; }
      .occ-setup-log { margin: 10px 0 0; max-height: 170px; overflow: auto; background: #fff;
        border: 1px solid var(--occ-line); border-radius: 8px; padding: 10px;
        font: 11px/1.55 ui-monospace, SFMono-Regular, monospace; white-space: pre-wrap; color: #4b5563; }
      .occ-setup details { margin-top: 12px; font-size: 11px; color: var(--occ-muted); }
      .occ-setup summary { cursor: pointer; }
      .occ-setup-registry { margin-top: 12px; padding-top: 12px; border-top: 1px dashed var(--occ-gold-line); }
      .occ-setup-input { height: 30px; min-width: 240px; flex: 1 1 240px; padding: 0 10px;
        border: 1px solid var(--occ-line); border-radius: 8px; font-size: 12px;
        background: #fff; color: var(--occ-ink); }
      .occ-start { max-width: 860px; width: 100%; margin: 0 auto; }
      .occ-filelist + .occ-filelist { margin-top: 24px; }
      .occ-list-title { display: flex; align-items: baseline; gap: 10px; padding: 0 2px 6px;
        border-bottom: 1px solid var(--occ-line); }
      .occ-list-name { font-size: 12px; font-weight: 600; }
      .occ-list-sub { font-size: 11px; color: var(--occ-muted); overflow: hidden;
        text-overflow: ellipsis; white-space: nowrap; }
      .occ-filerow { display: flex; align-items: center; gap: 10px; width: 100%; text-align: left;
        padding: 9px 10px !important; border: none !important; border-radius: 7px !important;
        background: transparent !important; }
      .occ-filerow:hover { background: var(--occ-gold-soft) !important; }
      .occ-row-name { font-size: 13px; font-weight: 500; flex: 1; min-width: 120px; overflow: hidden;
        text-overflow: ellipsis; white-space: nowrap; }
      .occ-row-sub { font-size: 11px; color: var(--occ-muted); max-width: 34%; overflow: hidden;
        text-overflow: ellipsis; white-space: nowrap; }
      .occ-row-meta { font-size: 11px; color: var(--occ-muted); white-space: nowrap; }
      .occ-quiet { color: var(--occ-muted); font-size: 12px; padding: 14px 2px; }
      .occ-start-empty { flex: 1; display: flex; flex-direction: column; align-items: center;
        justify-content: center; gap: 12px; }
      .occ-empty-hint { font-size: 12px; color: var(--occ-muted); }
      .occ-recent-item { text-align: left; display: flex; gap: 9px; align-items: center;
        border: 1px solid var(--occ-line) !important; border-radius: 9px !important; padding: 9px 10px !important; }
      .occ-recent-item:hover { border-color: var(--occ-gold-line) !important; background: var(--occ-gold-soft) !important; }
      .occ-code { background: #fff; border: 1px solid var(--occ-line); border-radius: 8px;
        padding: 12px; font: 11px/1.6 ui-monospace, SFMono-Regular, monospace; white-space: pre-wrap;
        word-break: break-all; color: #4b5563; }
      .occ-composer { flex: 0 0 auto; display: flex; align-items: center; gap: 10px;
        padding: 6px 12px; background: transparent; }
      .occ-select-info { display: flex; align-items: center; gap: 7px; min-width: 0;
        flex: 0 1 auto; max-width: 27%; }
      .occ-sel-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--occ-gold); flex: 0 0 auto; }
      .occ-quote { font-size: 11.5px; color: var(--occ-muted); white-space: nowrap; overflow: hidden;
        text-overflow: ellipsis; }
      .occ-composer input { flex: 1 1 auto; min-width: 80px; border: none;
        border-bottom: 1px solid var(--occ-line); border-radius: 0; background: transparent;
        padding: 5px 2px; font-size: 13px; }
      .occ-composer input:focus { outline: none; border-bottom-color: var(--occ-gold); box-shadow: none; }
      .occ-composer .occ-send { border: none; background: transparent; color: var(--occ-gold-strong);
        font-weight: 600; font-size: 12.5px; padding: 4px 2px; }
      .occ-composer .occ-send:hover:not(:disabled) { background: transparent; color: var(--occ-gold);
        text-decoration: underline; }
      .occ-composer .occ-read { flex: 0 0 auto; border: none; background: transparent;
        color: var(--occ-gold-strong); font-weight: 600; font-size: 12.5px; padding: 4px 2px; }
      .occ-composer .occ-read::before { content: ''; display: inline-block; width: 6px; height: 6px;
        border-radius: 50%; background: var(--occ-gold); margin-right: 6px; vertical-align: 1px; }
      .occ-composer .occ-read:hover:not(:disabled) { color: var(--occ-gold); text-decoration: underline; }
      .occ-composer .occ-read:disabled { opacity: .45; }
      .occ-root .occ-link { border: none; background: transparent; color: var(--occ-muted);
        font-size: 11.5px; padding: 3px 4px; }
      .occ-root .occ-link:hover:not(:disabled) { background: transparent; color: var(--occ-ink);
        text-decoration: underline; }
      .occ-progress { flex: 0 0 auto; padding: 4px 12px 6px; font-size: 11.5px; color: var(--occ-muted); }
      .occ-progress-main { display: flex; align-items: center; gap: 8px; min-width: 0; }
      .occ-progress-text { color: var(--occ-ink); white-space: nowrap; }
      .occ-progress-error { color: #a33a33; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .occ-progress-steps { padding: 4px 0 2px 14px; }
      .occ-chat-float { position: fixed; right: 16px; bottom: 44px; width: min(560px, calc(100vw - 32px));
        height: min(72vh, 680px); z-index: 30; display: flex; flex-direction: column; overflow: hidden;
        background: #fff; border-radius: 12px; box-shadow: 0 24px 70px rgba(20,22,26,.24); }
      .occ-chat-head { display: flex; align-items: center; justify-content: space-between;
        padding: 6px 8px 6px 14px; font-size: 12px; color: var(--occ-muted); }
      .occ-chat-body { flex: 1; min-height: 0; display: flex; flex-direction: column; }
      .occ-agent { width: 370px; flex: 0 0 370px; border-left: 1px solid var(--occ-line);
        display: flex; flex-direction: column; min-height: 0; background: #fff; }
      .occ-agent-head { display: flex; align-items: center; justify-content: space-between;
        padding: 9px 12px; border-bottom: 1px solid var(--occ-line); font-size: 12px; color: var(--occ-muted); }
      .occ-agent-body { flex: 1 1 auto; min-height: 0; overflow: auto; }
      .occ-agent-foot { padding: 8px 12px; border-top: 1px solid var(--occ-line); font-size: 10px;
        color: var(--occ-muted); line-height: 1.5; }
      .occ-footer { flex: 0 0 auto; display: flex; align-items: center; gap: 10px; padding: 4px 12px;
        border-top: 1px solid var(--occ-line); font-size: 10px; color: var(--occ-muted);
        background: #fff; min-height: 24px; }
      .occ-footer .occ-path { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .occ-toast { position: absolute; right: 14px; top: 12px; z-index: 8; max-width: 360px;
        padding: 10px 12px; border-radius: 9px; font-size: 12px; line-height: 1.55;
        border: 1px solid var(--occ-gold-line); background: var(--occ-gold-soft); color: #5f4a1f;
        box-shadow: 0 8px 24px rgba(31,35,40,.08); }
      .occ-toast.error { border-color: #f0c9c9; background: #fdf1f1; color: #8a2f2f; }
      .occ-muted { color: var(--occ-muted); font-size: 12px; padding: 14px; line-height: 1.7; }
      .occ-recent-pop { position: absolute; right: 14px; top: 50px; z-index: 9; width: 360px;
        max-height: 320px; overflow: auto; background: #fff; border: 1px solid var(--occ-gold-line);
        border-radius: 10px; box-shadow: 0 14px 40px rgba(31,35,40,.12); padding: 6px; }
      .occ-recent-pop .occ-recent-item { width: 100%; }
      @container (max-width: 1080px) {
        .occ-health span.occ-health-text { display: none; }
        .occ-file { max-width: 26vw; }
        .occ-folder { display: none; }
      }
      @container (max-width: 900px) {
        .occ-rail { display: none; }
        .occ-agent { position: absolute; right: 0; top: 0; bottom: 0; z-index: 6;
          width: min(370px, 92%); box-shadow: -12px 0 30px rgba(31,35,40,.12); }
        .occ-file { display: none; }
      }
      /* AI 修改过程：内联在编辑器下方，不做浮层卡片 */
      .occ-ai-step { display: flex; align-items: flex-start; gap: 8px; padding: 3px 0;
        font-size: 12px; line-height: 1.5; }
      .occ-ai-step-dot { width: 6px; height: 6px; margin-top: 5px; border-radius: 50%;
        background: var(--occ-line); flex: 0 0 auto; }
      .occ-ai-step-dot.active { background: var(--occ-gold); animation: occ-pulse 1.2s ease-in-out infinite; }
      .occ-ai-step-dot.done { background: #3f9d63; }
      @keyframes occ-pulse { 0%, 100% { opacity: .3; } 50% { opacity: 1; } }
      /* 云文档模式：覆盖本地编辑器，保持整页工作台 */
      .occ-cloud { position: absolute; inset: 0; z-index: 6; display: flex; flex-direction: column;
        background: #fff; }
      .occ-cloud-scroll { flex: 1 1 auto; min-height: 0; overflow: auto; }
      .occ-cloud-inner { max-width: 760px; width: 100%; margin: 0 auto; padding: 30px 30px 24px; }
      .occ-cloud-head { display: flex; align-items: center; gap: 9px; min-height: 26px; flex-wrap: wrap; }
      .occ-cloud-title { font-size: 15px; font-weight: 600; overflow: hidden; text-overflow: ellipsis;
        white-space: nowrap; }
      .occ-cloud-sub { margin-top: 6px; font-size: 12px; color: var(--occ-muted); line-height: 1.7; }
      .occ-cloud-url { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .occ-cloud-form { display: flex; gap: 10px; align-items: center; margin-top: 18px; }
      .occ-cloud-form input { flex: 1 1 auto; min-width: 0; }
      .occ-cloud-hint { margin-top: 14px; font-size: 12px; color: var(--occ-muted); line-height: 1.75; }
      .occ-cloud-preview { margin-top: 16px; padding: 12px 14px; border-radius: 8px;
        background: var(--occ-gold-soft); font-size: 12px; line-height: 1.75; white-space: pre-wrap;
        word-break: break-word; max-height: 240px; overflow: auto; }
      .occ-cloud-meta { margin-top: 8px; font-size: 11px; color: var(--occ-muted); }
      .occ-cloud-empty { margin-top: 16px; padding: 12px 0; font-size: 12px; color: var(--occ-muted); }
      .occ-cloud-save { display: flex; align-items: center; gap: 7px; margin-top: 12px;
        font-size: 12px; color: var(--occ-muted); }
      .occ-cloud-foot { flex: 0 0 auto; border-top: 1px solid var(--occ-line); background: #fff; }
      .occ-cloud-bar { flex: 0 0 auto; display: flex; align-items: center; gap: 6px; padding: 4px 10px;
        border-bottom: 1px solid var(--occ-line); min-height: 34px; }
      .occ-cloud-bar .occ-cloud-title { flex: 1 1 auto; min-width: 0; font-size: 12.5px; }
      .occ-cloud-browser { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column;
        position: relative; background: #fff; }
      .occ-cloud-webview { flex: 1 1 auto; width: 100%; height: 100%; display: flex; background: #fff; }
      .occ-cloud-error { position: absolute; left: 50%; top: 44px; transform: translateX(-50%); z-index: 8;
        max-width: 80%; padding: 6px 12px; border-radius: 6px; background: #fdf1f1; color: #8a2f2f;
        font-size: 12px; }
      .occ-compare { position: absolute; inset: 0; z-index: 12; display: flex; align-items: center;
        justify-content: center; padding: 24px; background: rgba(20, 22, 26, .55); }
      .occ-compare-panel { width: min(1100px, 96%); max-height: 90%; display: flex; flex-direction: column;
        background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 18px 60px rgba(0, 0, 0, .28); }
      .occ-compare-head { display: flex; align-items: center; justify-content: space-between; gap: 12px;
        padding: 10px 14px; border-bottom: 1px solid var(--occ-line); font-size: 13px; font-weight: 600; }
      .occ-compare-check { display: flex; align-items: center; gap: 7px; padding: 8px 14px;
        border-bottom: 1px solid var(--occ-line); font-size: 12px; color: var(--occ-muted); }
      .occ-compare-check.ok { color: var(--occ-gold-strong); }
      .occ-compare-note { padding: 8px 14px; font-size: 11.5px; color: var(--occ-muted);
        border-bottom: 1px solid var(--occ-line); line-height: 1.6; }
      .occ-compare-body { display: flex; gap: 12px; padding: 12px; min-height: 0; overflow: auto;
        background: #fafafa; }
      .occ-compare-body figure { flex: 1 1 0; min-width: 0; margin: 0; display: flex; flex-direction: column; gap: 6px; }
      .occ-compare-body figcaption { font-size: 11.5px; color: var(--occ-muted); }
      .occ-compare-body img { width: 100%; max-height: 64vh; object-fit: contain; background: #fff;
        border: 1px solid var(--occ-line); }
      .occ-compare-empty { display: flex; align-items: center; justify-content: center; min-height: 160px;
        font-size: 12px; color: var(--occ-muted); background: #fff; border: 1px dashed var(--occ-line); }
      .occ-root.occ-dark .occ-compare-panel { background: #202124; }
      .occ-root.occ-dark .occ-compare-body { background: #1a1c1f; }
      .occ-root.occ-dark .occ-compare-body img, .occ-root.occ-dark .occ-compare-empty { background: #202124; border-color: #34373b; }
      .occ-root.occ-dark .occ-compare-head, .occ-root.occ-dark .occ-compare-check { border-color: #34373b; }
      /* 深色无边框工作台外壳：仅在宿主深色模式下启用 */
      .occ-root.occ-dark { --occ-ink: #e8eaed; --occ-muted: #9aa0a6; --occ-line: transparent;
        --occ-gold-soft: #2a2d31; --occ-gold-line: transparent;
        background: #202124 !important; color: var(--occ-ink); }
      .occ-root.occ-dark .occ-toolbar { background: #202124 !important; border-bottom: none; }
      .occ-root.occ-dark .occ-file { border-left: 1px solid #2a2d31; }
      .occ-root.occ-dark button { border: none; border-radius: 6px; background: transparent; color: var(--occ-ink); }
      .occ-root.occ-dark button:hover:not(:disabled) { background: #2a2d31; border-color: transparent; }
      .occ-root.occ-dark button.occ-primary { background: var(--occ-gold); border: none; color: #202124; }
      .occ-root.occ-dark button.occ-primary:hover:not(:disabled) { background: #d4b06a; border-color: transparent; }
      .occ-root.occ-dark input { border: none; border-radius: 6px; background: #2a2d31; color: var(--occ-ink); }
      .occ-root.occ-dark input:focus { border-color: transparent; box-shadow: 0 0 0 2px rgba(198,161,91,.35); }
      .occ-root.occ-dark .occ-rail { background: #202124 !important; border-right: none; }
      .occ-root.occ-dark .occ-rail-head { border-bottom: none; }
      .occ-root.occ-dark .occ-fileitem { border: none !important; border-radius: 0 !important; background: transparent !important; }
      .occ-root.occ-dark .occ-fileitem:hover { background: #2a2d31 !important; }
      .occ-root.occ-dark .occ-fileitem.active { background: #2a2d31 !important; border-left: 2px solid var(--occ-gold) !important; }
      .occ-root.occ-dark .occ-ext { background: #2a2d31; border: none; color: var(--occ-gold); }
      .occ-root.occ-dark .occ-rail .occ-folderrow:hover { background: #2a2d31 !important; color: var(--occ-ink); }
      .occ-root.occ-dark .occ-foldericon { color: #9aa0a6; }
      .occ-root.occ-dark .occ-main { background: #202124 !important; }
      .occ-root.occ-dark .occ-cloud { background: #202124 !important; }
      .occ-root.occ-dark .occ-cloud-preview { background: #2a2d31; }
      .occ-root.occ-dark .occ-cloud-foot { background: #202124 !important; border-top: none; }
      .occ-root.occ-dark .occ-cloud-bar { border-bottom: none; }
      .occ-root.occ-dark .occ-cloud-browser, .occ-root.occ-dark .occ-cloud-webview { background: #202124; }
      .occ-root.occ-dark .occ-cloud-error { background: #3a2a2a; color: #f4b4b4; }
      .occ-root.occ-dark .occ-editor-loading { background: rgba(42,45,49,.92); color: var(--occ-muted); }
      .occ-root.occ-dark .occ-landing { background: #202124 !important; }
      .occ-root.occ-dark .occ-notice { border: none; border-radius: 8px; background: #2a2d31; }
      .occ-root.occ-dark .occ-list-title { border-bottom: none; }
      .occ-root.occ-dark .occ-filerow { border-radius: 0 !important; }
      .occ-root.occ-dark .occ-filerow:hover { background: #2a2d31 !important; }
      .occ-root.occ-dark .occ-code { background: #1b1c1e; border: none; border-radius: 6px; color: #c5c8cd; }
      .occ-root.occ-dark .occ-setup { background: #24262a; border-color: #3a3d42; }
      .occ-root.occ-dark .occ-setup-log { background: #1b1c1e; border-color: #34373c; color: #c5c8cd; }
      .occ-root.occ-dark .occ-setup-actions a { background: #2a2d31; border-color: #44474d; color: #d4b06a; }
      .occ-root.occ-dark .occ-setup-input { background: #1b1c1e; border-color: #34373c; color: #e5e7eb; }
      .occ-root.occ-dark .occ-composer { background: #202124 !important; }
      .occ-root.occ-dark .occ-chat-float { background: #24262a; box-shadow: 0 24px 70px rgba(0,0,0,.5); }
      .occ-root.occ-dark .occ-composer input { border: none; border-bottom: 1px solid #34373b;
        border-radius: 0; background: transparent; color: var(--occ-ink); }
      .occ-root.occ-dark .occ-composer input:focus { box-shadow: none; border-bottom-color: var(--occ-gold); }
      .occ-root.occ-dark .occ-composer .occ-send { color: var(--occ-gold); }
      .occ-root.occ-dark .occ-composer .occ-read { color: var(--occ-gold); }
      .occ-root.occ-dark .occ-progress-error { color: #f4b4b4; }
      .occ-root.occ-dark .occ-ai-step-dot:not(.active):not(.done) { background: #4a4d52; }
      .occ-root.occ-dark .occ-footer { background: #202124 !important; border-top: none; }
      .occ-root.occ-dark .occ-toast { border: none; background: #2a2d31; color: var(--occ-ink);
        box-shadow: 0 8px 24px rgba(0,0,0,.35); }
      .occ-root.occ-dark .occ-toast.error { background: #3a2a2a; color: #f4b4b4; }
      .occ-root.occ-dark .occ-recent-pop { background: #2a2d31; border: none; box-shadow: 0 14px 40px rgba(0,0,0,.4); }
      .occ-root.occ-dark .occ-recent-item { border: none !important; border-radius: 6px !important; background: transparent !important; }
      .occ-root.occ-dark .occ-recent-item:hover { background: #34373b !important; }
      /* 浅色模式显式兜底，避免宿主通用背景规则盖住 */
      .occ-root.occ-light .occ-toolbar, .occ-root.occ-light .occ-rail, .occ-root.occ-light .occ-main,
      .occ-root.occ-light .occ-footer, .occ-root.occ-light .occ-landing,
      .occ-root.occ-light .occ-composer, .occ-root.occ-light .occ-cloud,
      .occ-root.occ-light .occ-cloud-foot, .occ-root.occ-light .occ-cloud-browser,
      .occ-root.occ-light .occ-cloud-webview { background: #fff !important; }
    `

    function installStyles() {
      if (typeof document === 'undefined') return
      if (document.getElementById(STYLE_ID)) return
      const style = document.createElement('style')
      style.id = STYLE_ID
      style.textContent = CSS
      document.head.appendChild(style)
    }

    async function api(path, options = {}) {
      const response = await fetch(API + path, {
        cache: 'no-store',
        signal: options.signal || AbortSignal.timeout(20_000),
        ...options,
        headers: { 'content-type': 'application/json', ...(options.headers || {}) },
      })
      const data = response.status === 204 ? null : await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data?.error || `请求失败（${response.status}）`)
      return data
    }

    function extractCloudUrl(input) {
      const text = String(input || '')
      const matches = text.match(/https:\/\/[A-Za-z0-9\-._~:/?#\[\]@!$&'()*+,;=%]+/gi) || []
      for (const raw of matches) {
        const trimmed = raw.replace(/[)\]}>，。；;、！!?？）】」』》〉]+$/g, '')
        try {
          const url = new URL(trimmed)
          if (url.protocol !== 'https:') continue
          const host = url.hostname.toLowerCase()
          if (host === 'kdocs.cn' || host.endsWith('.kdocs.cn')
            || host === 'wps.cn' || host.endsWith('.wps.cn')
            || host === 'wps.com' || host.endsWith('.wps.com')) return url.href
        } catch {
          // 继续找下一个链接
        }
      }
      return ''
    }

    function desktopBrowserBridge() {
      const carrier = globalThis.dshDesktop
      return carrier?.protocolVersion === 1 && carrier.browser ? carrier.browser : null
    }

    function cloudIsDocUrl(url) {
      try {
        const host = new URL(String(url || '')).hostname.toLowerCase()
        return host === 'kdocs.cn' || host.endsWith('.kdocs.cn')
          || host === 'wps.cn' || host.endsWith('.wps.cn')
          || host === 'wps.com' || host.endsWith('.wps.com')
      } catch {
        return false
      }
    }

    const CLOUD_SAVE_EXPRESSION = `(() => {
  const saved = document.querySelector('[class*="icon-save_success"]');
  const pending = document.querySelector('[class*="icon-saving"], [class*="icon-save_loading"], [class*="icon-save_fail"]');
  return { saved: Boolean(saved), pending: Boolean(pending) };
})()`

    function cloudPasteExpression(html, text) {
      return `(() => {
  const html = ${JSON.stringify(String(html || ''))};
  const text = ${JSON.stringify(String(text || '').slice(0, 1000))};
  const data = new DataTransfer();
  data.setData('text/html', html);
  data.setData('text/plain', text);
  const event = new ClipboardEvent('paste', {
    clipboardData: data,
    bubbles: true,
    cancelable: true,
    composed: true
  });
  const candidates = [
    document.querySelector('#et_select_grid'),
    document.querySelector('[contenteditable="true"]'),
    document.activeElement,
    document.body
  ];
  const target = candidates.find((item) => item && typeof item.dispatchEvent === 'function');
  if (!target) return { ok: false, error: 'no_target' };
  target.dispatchEvent(event);
  return { ok: event.defaultPrevented, target: target.id || target.className || target.tagName };
})()`
    }

    function extractCloudFragment(html, kind) {
      let text = String(html || '')
      if (!text) return ''
      if (kind !== 'word' && kind !== 'slide') return text
      const start = text.indexOf('<!--StartFragment-->')
      const end = text.indexOf('<!--EndFragment-->')
      if (start >= 0 && end > start) {
        text = text.slice(start + '<!--StartFragment-->'.length, end)
      } else {
        const body = text.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)
        if (body) text = body[1]
      }
      text = text.replace(/<!--[\s\S]*?-->/g, '')
      text = text.replace(/<xml\b[\s\S]*?<\/xml>/gi, '')
      text = text.replace(/<o:p\b[^>]*>[\s\S]*?<\/o:p>/gi, '')
      text = text.replace(/<o:p\b[^>]*\/?>/gi, '')
      text = text.replace(/\s+class\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      text = text.replace(/\s+(?:lang|xmlns(?::\w+)?)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      return text.trim() || String(html || '')
    }

    async function detectCloudKind(webview, html) {
      let type = ''
      try { type = String(await webview.executeJavaScript('String(window.officeType || "")', true)) } catch { type = '' }
      if (type === 'w') return 'word'
      if (type === 's') return 'sheet'
      if (type === 'p') return 'slide'
      const text = String(html || '')
      if (/<table\b|et_select_grid/i.test(text)) return 'sheet'
      if (/MsoNormal|<w:|mso-|ksdocclipboard/i.test(text) && /<p\b|<span\b/i.test(text)) return 'word'
      return ''
    }

    function cloudStyleSummary(html) {
      const text = String(html || '')
      const count = (re) => (text.match(re) || []).length
      return {
        tables: count(/<table\b/gi),
        rows: count(/<tr\b/gi),
        cells: count(/<t[dh]\b/gi),
        merges: count(/(?:rowspan|colspan)\s*=/gi),
        styles: count(/style\s*=/gi),
        fonts: count(/font-family\s*:|font-size\s*:/gi),
        colors: count(/(?:^|[;"\s])color\s*:|background(?:-color)?\s*:/gi),
        borders: count(/border(?:-[a-z]+)?\s*:/gi),
        aligns: count(/text-align\s*:|vertical-align\s*:/gi),
        weights: count(/font-weight\s*:|font-style\s*:/gi),
      }
    }

    function compareCloudStyle(beforeHtml, afterHtml) {
      const before = cloudStyleSummary(beforeHtml)
      const after = cloudStyleSummary(afterHtml)
      const lost = ['styles', 'fonts', 'colors', 'borders', 'aligns', 'weights']
        .filter((key) => before[key] > 0 && after[key] < Math.ceil(before[key] * 0.6))
      const structureLost = ['rows', 'cells', 'merges']
        .filter((key) => before[key] > 0 && after[key] < before[key])
      return { ok: lost.length === 0 && structureLost.length === 0, before, after, lost, structureLost }
    }

    function extLabel(ext) {
      if (ext === '.pdf') return 'P'
      return ['.xlsx', '.xls', '.csv', '.ods'].includes(ext) ? 'X'
        : ['.docx', '.doc', '.odt'].includes(ext) ? 'W'
          : ['.pptx', '.ppt', '.odp'].includes(ext) ? 'P' : '·'
    }

    function documentTypeOf(ext) {
      if (ext === '.pdf') return 'pdf'
      return ['.xlsx', '.xls', '.csv', '.ods'].includes(ext) ? 'cell'
        : ['.docx', '.doc', '.odt'].includes(ext) ? 'word'
          : 'slide'
    }

    function groupFilesByFolder(files, folderPath) {
      const groups = new Map()
      for (const file of files) {
        const slash = file.relativePath.lastIndexOf('/')
        const dir = slash >= 0 ? file.relativePath.slice(0, slash) : ''
        if (!groups.has(dir)) groups.set(dir, [])
        groups.get(dir).push(file)
      }
      return [...groups.keys()].sort((left, right) => left.localeCompare(right)).map((dir) => ({
        dir,
        depth: dir ? dir.split('/').length : 0,
        name: dir ? dir.split('/').pop() : (folderPath.split('/').filter(Boolean).pop() || folderPath),
        path: dir ? `${folderPath}/${dir}` : folderPath,
        files: groups.get(dir),
      }))
    }

    function formatSize(bytes) {
      if (!Number.isFinite(bytes)) return ''
      if (bytes < 1024) return `${bytes} B`
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
      return `${(bytes / 1024 / 1024).toFixed(1)} MB`
    }

    function formatTime(ms) {
      if (!ms) return ''
      try {
        return new Date(ms).toLocaleString('zh-CN', {
          month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
        })
      } catch {
        return ''
      }
    }

    function selectionLabel(selection) {
      if (!selection) return ''
      if (selection.kind === 'cell') {
        if (selection.formula) return selection.formula
        if (selection.text) return selection.text
        if (selection.value != null) return String(selection.value)
        return ''
      }
      return selection.text || selection.value || ''
    }

    let docsApiPromise = null
    let docsApiUrl = ''

    function loadDocsApi(url) {
      if (typeof window === 'undefined') return Promise.reject(new Error('当前不在浏览器环境'))
      if (window.DocsAPI) return Promise.resolve()
      if (docsApiPromise && docsApiUrl === url) return docsApiPromise
      docsApiUrl = url
      docsApiPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script')
        script.src = url
        script.async = true
        script.onload = () => resolve()
        script.onerror = () => reject(new Error('无法加载 OnlyOffice 编辑器脚本，请检查 Document Server 是否可访问'))
        document.head.appendChild(script)
      })
      return docsApiPromise
    }

    function parseRgb(value) {
      const match = String(value || '').match(/^rgba?\(([^)]+)\)$/)
      if (!match) return null
      const parts = match[1].split(/[,\s/]+/).filter(Boolean)
      if (parts.length < 3) return null
      const [r, g, b] = parts.slice(0, 3).map(Number)
      if (![r, g, b].every((item) => Number.isFinite(item))) return null
      const alpha = parts[3] === undefined ? 1 : Number(parts[3])
      return { r, g, b, alpha: Number.isFinite(alpha) ? alpha : 1 }
    }

    function detectHostDark(hostRef) {
      const root = document.documentElement
      const body = document.body
      const marker = `${root?.className || ''} ${body?.className || ''} ${root?.getAttribute('data-theme') || ''} ${body?.getAttribute('data-theme') || ''}`.toLowerCase()
      if (marker.includes('dark')) return true
      if (marker.includes('light')) return false
      let element = hostRef.current?.parentElement
      while (element) {
        const color = parseRgb(getComputedStyle(element).backgroundColor)
        if (color && color.alpha > 0.35) {
          const luminance = 0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b
          return luminance < 120
        }
        element = element.parentElement
      }
      try {
        return window.matchMedia('(prefers-color-scheme: dark)').matches === true
      } catch {
        return false
      }
    }

    function useHostTheme(hostRef) {
      const [dark, setDark] = useState(false)
      useEffect(() => {
        if (typeof document === 'undefined') return
        const update = () => setDark(detectHostDark(hostRef))
        update()
        const observer = new MutationObserver(update)
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme', 'style'] })
        if (document.body) {
          observer.observe(document.body, { attributes: true, attributeFilter: ['class', 'data-theme', 'style'] })
        }
        const timer = setInterval(update, 2000)
        return () => {
          observer.disconnect()
          clearInterval(timer)
        }
      }, [hostRef])
      return dark
    }

    function WorkbenchPanel({ service, entry, conversation }) {
      const [config, setConfig] = useState(null)
      const [health, setHealth] = useState(null)
      const [recent, setRecent] = useState([])
      const [folder, setFolder] = useState(null)
      const [file, setFile] = useState(null)
      const [fileState, setFileState] = useState(null)
      const [selection, setSelection] = useState(null)
      const [instruction, setInstruction] = useState('')
      const [busy, setBusy] = useState(false)
      const [folderBusy, setFolderBusy] = useState(false)
      const [showFolderPathInput, setShowFolderPathInput] = useState(false)
      const [folderPathDraft, setFolderPathDraft] = useState('')
      const [aiOpen, setAiOpen] = useState(false)
      const [aiPending, setAiPending] = useState(false)
      const [chatOpen, setChatOpen] = useState(false)
      const [collapsedDirs, setCollapsedDirs] = useState({})
      const [message, setMessage] = useState(null)
      const [showRecent, setShowRecent] = useState(false)
      const [docReady, setDocReady] = useState(false)
      const [cloudOpen, setCloudOpen] = useState(false)
      const [cloudUrl, setCloudUrl] = useState('')
      const [cloudEmbed, setCloudEmbed] = useState(null)
      const [cloudView, setCloudView] = useState({ ready: false, url: '', title: '', canBack: false, canForward: false, error: '' })
      const [cloudSelection, setCloudSelection] = useState(null)
      const [cloudBusy, setCloudBusy] = useState(false)
      const [cloudPending, setCloudPending] = useState(false)
      const [cloudStage, setCloudStage] = useState('')
      const [cloudSavedAt, setCloudSavedAt] = useState(0)
      const [cloudVerify, setCloudVerify] = useState(null)
      const [cloudCompareOpen, setCloudCompareOpen] = useState(false)
      const [setup, setSetup] = useState(null)
      const [setupBusy, setSetupBusy] = useState(false)
      const [customImage, setCustomImage] = useState('')

      const rootRef = useRef(null)
      const dark = useHostTheme(rootRef)

      const editorHostRef = useRef(null)
      const editorRef = useRef(null)
      const editorSeqRef = useRef(0)
      const documentKeyRef = useRef('')
      const docReadyRef = useRef(false)
      const forceSavedPatchRef = useRef('')
      const failedPatchRef = useRef('')
      const lastSaveAtRef = useRef(0)
      const sendAtRef = useRef(0)
      const currentFileIdRef = useRef('')
      const sessionIdRef = useRef('')
      const fileInputRef = useRef(null)
      const cloudContainerRef = useRef(null)
      const cloudWebviewRef = useRef(null)
      const cloudLeaseRef = useRef('')

      const toast = useCallback((kind, text) => {
        setMessage({ kind, text, at: Date.now() })
      }, [])

      useEffect(() => {
        if (!aiPending) return
        const timer = setTimeout(() => setAiPending(false), 120_000)
        return () => clearTimeout(timer)
      }, [aiPending])

      useEffect(() => {
        if (!message) return
        const timer = setTimeout(() => setMessage(null), message.kind === 'error' ? 9000 : 4500)
        return () => clearTimeout(timer)
      }, [message])

      const readCloudSelection = useCallback(async (options = {}) => {
        const quiet = options?.quiet === true
        const webview = cloudWebviewRef.current
        if (!webview || !cloudView.ready) {
          if (!quiet) toast('info', '云文档还在加载，请稍后再试。')
          return null
        }
        let lastReason = ''
        let lastError = ''
        const readClipboard = async () => {
          try {
            const result = await api('/cloud/clipboard')
            if (result?.ok) {
              const kind = await detectCloudKind(webview, result.html)
              const payload = { ...result, kind, pasteHtml: extractCloudFragment(result.html, kind) || result.html }
              setCloudSelection(payload)
              if (!quiet) toast('success', `已读取云文档选区（${payload.textLength} 字）`)
              return payload
            }
            lastReason = result?.reason || ''
          } catch (error) {
            lastError = error.message
          }
          return null
        }
        try {
          webview.focus()
          await new Promise((resolve) => setTimeout(resolve, 120))
          try {
            webview.sendInputEvent({ type: 'keyDown', keyCode: 'C', modifiers: ['meta'] })
            webview.sendInputEvent({ type: 'keyUp', keyCode: 'C', modifiers: ['meta'] })
          } catch {
            // 老版本 Electron 没有 sendInputEvent 时退回 webview.copy()
          }
          await new Promise((resolve) => setTimeout(resolve, 350))
          const viaKey = await readClipboard()
          if (viaKey) {
            fetch(`${API}/debug`, {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ type: 'cloud-copy-result', via: 'key', htmlLength: viaKey.htmlLength }),
            }).catch(() => {})
            return viaKey
          }
          try { webview.copy() } catch { /* ignore */ }
          await new Promise((resolve) => setTimeout(resolve, 350))
          const viaCopy = await readClipboard()
          if (viaCopy) {
            fetch(`${API}/debug`, {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ type: 'cloud-copy-result', via: 'copy', htmlLength: viaCopy.htmlLength }),
            }).catch(() => {})
            return viaCopy
          }
          fetch(`${API}/debug`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ type: 'cloud-copy-miss', reason: lastReason, error: lastError }),
          }).catch(() => {})
        } catch (error) {
          lastError = error.message
        }
        if (!quiet) {
          toast('error', lastError || (lastReason === 'not-wps'
            ? '剪贴板里不是 WPS 选区。请在内嵌云文档里选中内容并按 ⌘C，再点一次读取。'
            : '剪贴板里还没有 WPS 选区。请在内嵌云文档里选中内容并按 ⌘C，再点一次读取。'))
        }
        return null
      }, [cloudView.ready, toast])

      const openCloudDoc = useCallback(async () => {
        const target = extractCloudUrl(cloudUrl)
        if (!target) {
          toast('error', '没有找到 WPS 云文档链接。可以直接粘贴分享文字，里面包含 https://www.kdocs.cn/l/… 即可。')
          return
        }
        const bridge = desktopBrowserBridge()
        if (!bridge?.acquire) {
          toast('error', '当前宿主不支持内嵌浏览器，请升级金鹰 Agent。')
          return
        }
        setCloudBusy(true)
        try {
          const workspace = service?.defaultWorkspace?.()
          const workspaceKey = workspace?.path ? `cwd:${workspace.path}` : 'session:office-co-creation-cloud'
          const reservation = await bridge.acquire(workspaceKey)
          if (!reservation?.lease || !reservation?.partition) throw new Error('内嵌浏览器租约创建失败')
          if (cloudLeaseRef.current) {
            const previous = cloudLeaseRef.current
            cloudLeaseRef.current = ''
            bridge.release(previous).catch(() => {})
          }
          cloudLeaseRef.current = reservation.lease
          setCloudEmbed({ lease: reservation.lease, partition: reservation.partition, targetUrl: target, workspaceKey })
          setCloudView({ ready: false, url: target, title: '', canBack: false, canForward: false, error: '' })
          setCloudSelection(null)
          setCloudSavedAt(0)
          setCloudVerify(null)
          setCloudCompareOpen(false)
          toast('info', '云文档已在内嵌浏览器打开。首次使用请在这里登录 WPS。')
        } catch (error) {
          toast('error', error.message)
        } finally {
          setCloudBusy(false)
        }
      }, [cloudUrl, service, toast])

      const toggleCloud = useCallback(() => {
        if (cloudOpen) {
          setCloudOpen(false)
          return
        }
        setAiOpen(false)
        setCloudOpen(true)
      }, [cloudOpen])

      const releaseCloudEmbed = useCallback(() => {
        const webview = cloudWebviewRef.current
        if (webview) {
          try { webview.remove() } catch { /* ignore */ }
          cloudWebviewRef.current = null
        }
        const lease = cloudLeaseRef.current
        cloudLeaseRef.current = ''
        const bridge = desktopBrowserBridge()
        if (lease && bridge?.release) bridge.release(lease).catch(() => {})
        setCloudEmbed(null)
        setCloudView({ ready: false, url: '', title: '', canBack: false, canForward: false, error: '' })
        setCloudSelection(null)
        setCloudSavedAt(0)
        setCloudVerify(null)
        setCloudCompareOpen(false)
      }, [])

      const applyCloudPatch = useCallback(async (patch) => {
        const webview = cloudWebviewRef.current
        if (!webview) return { ok: false, error: '内嵌浏览器未就绪' }
        const capture = async () => {
          try {
            const image = await webview.capturePage()
            if (image && typeof image.toDataURL === 'function') return image.toDataURL()
          } catch {
            // 截图失败不影响粘贴
          }
          return ''
        }
        const waitForSave = async () => {
          await new Promise((resolve) => setTimeout(resolve, 600))
          const deadline = Date.now() + 6000
          while (Date.now() < deadline) {
            try {
              const state = await webview.executeJavaScript(CLOUD_SAVE_EXPRESSION, true)
              if (state?.saved) return true
            } catch {
              return false
            }
            await new Promise((resolve) => setTimeout(resolve, 350))
          }
          return false
        }
        const beforeShot = await capture()
        const beforeHtml = cloudSelection?.pasteHtml || cloudSelection?.html
        const styleCheck = patch.html && beforeHtml
          ? compareCloudStyle(beforeHtml, patch.html)
          : null
        const finish = async () => {
          const saved = await waitForSave()
          const afterShot = await capture()
          return { ok: true, saved, styleCheck, beforeShot, afterShot }
        }
        try {
          webview.focus()
          const result = await webview.executeJavaScript(cloudPasteExpression(patch.html, patch.text), true)
          if (result?.ok) return await finish()
        } catch {
          // 合成事件失败时退回原生剪贴板 + webview.paste()
        }
        try {
          await api('/cloud/clipboard', {
            method: 'POST',
            body: JSON.stringify({ html: patch.html, text: patch.text || '' }),
          })
          webview.focus()
          webview.paste()
          return await finish()
        } catch (error) {
          return { ok: false, error: error.message }
        }
      }, [cloudSelection])

      const restoreCloud = useCallback(async () => {
        if (!cloudSelection?.pasteHtml && !cloudSelection?.html) {
          toast('info', '还没有可恢复的云文档选区。')
          return
        }
        setCloudBusy(true)
        setCloudPending(true)
        setCloudVerify(null)
        setCloudCompareOpen(false)
        setCloudStage('正在恢复修改前的选区…')
        try {
          const result = await applyCloudPatch({ html: cloudSelection.pasteHtml || cloudSelection.html, text: cloudSelection.text })
          if (!result.ok) throw new Error(result.error)
          setCloudStage(result.saved ? '已恢复修改前的云文档选区' : '已恢复，等待云端保存')
          setCloudSavedAt(result.saved ? Date.now() : 0)
          toast(result.saved ? 'success' : 'info', result.saved ? '已恢复修改前的云文档选区' : '已恢复，等待云端保存')
        } catch (error) {
          toast('error', `撤销失败：${error.message}`)
        } finally {
          setCloudPending(false)
          setCloudBusy(false)
        }
      }, [cloudSelection, applyCloudPatch, toast])

      useEffect(() => {
        if (!cloudEmbed) return
        const container = cloudContainerRef.current
        if (!container) return
        const bridge = desktopBrowserBridge()
        const lease = cloudEmbed.lease
        const webview = document.createElement('webview')
        webview.className = 'occ-cloud-webview'
        webview.setAttribute('name', lease)
        webview.setAttribute('partition', cloudEmbed.partition)
        webview.setAttribute('allowpopups', '')
        webview.setAttribute('src', `about:blank#${lease}`)
        cloudWebviewRef.current = webview
        let loaded = false
        let disposed = false
        let lastUrl = ''
        const onReady = () => {
          if (disposed) return
          setCloudView((prev) => ({ ...prev, ready: true }))
          if (!loaded) {
            loaded = true
            try {
              webview.loadURL(cloudEmbed.targetUrl)
            } catch (error) {
              setCloudView((prev) => ({ ...prev, error: error.message }))
            }
          }
          try { webview.focus() } catch { /* ignore */ }
        }
        const onNavigate = () => {
          if (disposed) return
          let url = ''
          let canBack = false
          let canForward = false
          try { url = webview.getURL() || '' } catch { /* ignore */ }
          try { canBack = webview.canGoBack() } catch { /* ignore */ }
          try { canForward = webview.canGoForward() } catch { /* ignore */ }
          if (lastUrl && url && lastUrl !== url) {
            setCloudSelection(null)
            setCloudSavedAt(0)
            setCloudVerify(null)
            setCloudCompareOpen(false)
          }
          if (url) lastUrl = url
          setCloudView((prev) => ({ ...prev, url, canBack, canForward }))
        }
        const onTitle = (event) => {
          if (disposed) return
          setCloudView((prev) => ({ ...prev, title: event?.title || prev.title }))
        }
        const onFail = (event) => {
          if (disposed || event?.errorCode === -3) return
          setCloudView((prev) => ({ ...prev, error: event?.errorDescription || '页面加载失败' }))
        }
        webview.addEventListener('dom-ready', onReady)
        webview.addEventListener('did-navigate', onNavigate)
        webview.addEventListener('did-navigate-in-page', onNavigate)
        webview.addEventListener('page-title-updated', onTitle)
        webview.addEventListener('did-fail-load', onFail)
        container.appendChild(webview)
        return () => {
          disposed = true
          try { webview.removeEventListener('dom-ready', onReady) } catch { /* ignore */ }
          try { webview.removeEventListener('did-navigate', onNavigate) } catch { /* ignore */ }
          try { webview.removeEventListener('did-navigate-in-page', onNavigate) } catch { /* ignore */ }
          try { webview.removeEventListener('page-title-updated', onTitle) } catch { /* ignore */ }
          try { webview.removeEventListener('did-fail-load', onFail) } catch { /* ignore */ }
          try { webview.remove() } catch { /* ignore */ }
          if (cloudWebviewRef.current === webview) cloudWebviewRef.current = null
          if (cloudLeaseRef.current === lease) {
            cloudLeaseRef.current = ''
            if (bridge?.release) bridge.release(lease).catch(() => {})
          }
        }
      }, [cloudEmbed])

      useEffect(() => {
        if (!cloudOpen || !cloudEmbed || !cloudView.ready) return
        let alive = true
        let timer
        const tick = async () => {
          try {
            const patch = await api('/cloud/patch')
            if (!alive) return
            if (patch?.id) {
              setCloudPending(true)
              setAiOpen(true)
              setCloudVerify(null)
              setCloudCompareOpen(false)
              setCloudStage('正在粘贴回云文档…')
              const result = await applyCloudPatch(patch)
              await api('/cloud/patch-ack', {
                method: 'POST',
                body: JSON.stringify({ id: patch.id, ok: result.ok, saved: result.saved }),
              }).catch(() => {})
              if (!alive) return
              setCloudPending(false)
              setCloudVerify(result.ok ? {
                at: Date.now(),
                styleCheck: result.styleCheck || null,
                beforeShot: result.beforeShot || '',
                afterShot: result.afterShot || '',
              } : null)
              setCloudCompareOpen(false)
              setCloudStage(result.saved
                ? (result.styleCheck && result.styleCheck.ok === false ? '已保存，格式/样式需要人工确认' : '已粘贴回云文档并保存')
                : result.ok ? '已粘贴回云文档，等待云端保存' : '云文档粘贴失败')
              if (result.ok) {
                setCloudSavedAt(result.saved ? Date.now() : 0)
                if (result.saved && result.styleCheck && result.styleCheck.ok === false) {
                  toast('info', '已保存；格式/样式检查有变化，建议点「对比修改前后」确认')
                } else {
                  toast(result.saved ? 'success' : 'info', result.saved ? '已粘贴回 WPS 云文档，云端已保存' : '已粘贴回 WPS 云文档，等待云端保存')
                }
              } else {
                toast('error', result.error || '云文档粘贴失败')
              }
            }
          } catch {
            // 轮询中的瞬时错误忽略
          }
          if (alive) timer = setTimeout(tick, 900)
        }
        tick()
        return () => {
          alive = false
          clearTimeout(timer)
        }
      }, [cloudOpen, cloudEmbed, cloudView.ready, applyCloudPatch, toast])

      useEffect(() => {
        if (!cloudPending) return
        const timer = setTimeout(() => {
          setCloudPending(false)
          setCloudStage('等待云文档修改超时')
        }, 120_000)
        return () => clearTimeout(timer)
      }, [cloudPending])

      useEffect(() => {
        let alive = true
        ;(async () => {
          try {
            const [nextConfig, nextRecent] = await Promise.all([
              api('/config'),
              api('/recent').catch(() => ({ files: [] })),
            ])
            if (!alive) return
            setConfig(nextConfig)
            setHealth(nextConfig.documentServer === true)
            setRecent(nextRecent.files || [])
          } catch (error) {
            if (alive) toast('error', error.message)
          }
        })()
        return () => { alive = false }
      }, [toast])

      const loadSetup = useCallback(async () => {
        try {
          setSetup(await api('/setup/status'))
        } catch (error) {
          toast('error', error.message)
        }
      }, [toast])

      const startSetup = useCallback(async (image = '') => {
        if (setupBusy) return
        setSetupBusy(true)
        try {
          const started = await api('/setup/install', {
            method: 'POST',
            body: JSON.stringify(image ? { image } : {}),
          })
          setSetup((current) => ({ ...(current || {}), job: started.job }))
          toast('info', image ? `使用镜像 ${image} 安装…` : '开始准备 OnlyOffice，首次需要下载镜像…')
        } catch (error) {
          setSetupBusy(false)
          toast('error', error.message)
        }
      }, [setupBusy, toast])

      const openDocker = useCallback(async () => {
        try {
          const result = await api('/setup/start-docker', { method: 'POST' })
          toast(result.started ? 'info' : 'error', result.message || (result.started ? '正在启动 Docker Desktop…' : '请手动启动 Docker Desktop'))
          if (result.started) setTimeout(() => loadSetup(), 5000)
        } catch (error) {
          toast('error', error.message)
        }
      }, [loadSetup, toast])

      const refreshHealth = useCallback(async () => {
        try {
          const result = await api('/health')
          setHealth(result.ok === true)
          if (result.ok) toast('success', 'OnlyOffice 已连接')
          else toast('error', 'OnlyOffice 仍未启动')
        } catch (error) {
          setHealth(false)
          toast('error', error.message)
        }
      }, [toast])

      useEffect(() => {
        if (health !== false) return
        loadSetup()
      }, [health, loadSetup])

      useEffect(() => {
        if (!setup?.job?.running) return undefined
        const timer = setInterval(async () => {
          try {
            const next = await api('/setup/status')
            setSetup(next)
            if (next.serverUp) {
              setHealth(true)
              setSetupBusy(false)
              toast('success', 'OnlyOffice 已就绪，可以打开文件了')
            } else if (!next.job?.running) {
              setSetupBusy(false)
              if (next.job?.error) toast('error', next.job.error)
            }
          } catch {
            // 安装期间状态轮询失败不打断，下一轮继续
          }
        }, 1500)
        return () => clearInterval(timer)
      }, [setup?.job?.running, toast])

      const applyOpenedFolder = useCallback((opened) => {
        setFolder(opened)
        setFile(null)
        setSelection(null)
        setFileState(null)
        setShowRecent(false)
        if (opened.truncated) toast('info', '文件夹较大，只列出前 300 个 Office 文件。')
        else if (!opened.files?.length) toast('info', '这个文件夹里没有可编辑的 Office 文件。')
      }, [toast])

      const openFolderPath = useCallback(async () => {
        const path = folderPathDraft.trim()
        if (!path) {
          toast('error', '请输入文件夹的绝对路径。')
          return
        }
        if (folderBusy) return
        setFolderBusy(true)
        try {
          toast('info', '正在扫描文件夹…')
          const opened = await api('/open-folder', { method: 'POST', body: JSON.stringify({ path }) })
          applyOpenedFolder(opened)
          setShowFolderPathInput(false)
        } catch (error) {
          toast('error', error?.name === 'TimeoutError'
            ? '打开文件夹超时，请选择更小的目录后重试。'
            : error.message)
        } finally {
          setFolderBusy(false)
        }
      }, [folderPathDraft, folderBusy, applyOpenedFolder, toast])

      const openFolder = useCallback(async () => {
        if (folderBusy) return
        setFolderBusy(true)
        try {
          const picker = window.__DSH_DIRECTORY_PICKER__
          if (!picker || typeof picker.pick !== 'function') {
            throw new Error('当前 Desktop 没有提供文件夹选择器，无法打开本地文件。')
          }
          try { window.focus() } catch { /* ignore */ }
          const path = await picker.pick()
          if (!path) return
          toast('info', '正在扫描文件夹…')
          const opened = await api('/open-folder', { method: 'POST', body: JSON.stringify({ path }) })
          applyOpenedFolder(opened)
        } catch (error) {
          toast('error', error?.name === 'TimeoutError'
            ? '打开文件夹超时，请选择更小的目录后重试。'
            : error.message)
        } finally {
          setFolderBusy(false)
        }
      }, [folderBusy, applyOpenedFolder, toast])

      const openFile = useCallback(async (folderId, relativePath) => {
        try {
          const meta = await api('/open-file', {
            method: 'POST',
            body: JSON.stringify({ folderId, relativePath }),
          })
          setFile(meta)
          setSelection(null)
          setFileState(null)
          setDocReady(false)
          setShowRecent(false)
          forceSavedPatchRef.current = ''
          failedPatchRef.current = ''
          lastSaveAtRef.current = 0
        } catch (error) {
          toast('error', error.message)
        }
      }, [toast])

      const openRecent = useCallback(async (item) => {
        try {
          const meta = await api('/open-recent', {
            method: 'POST',
            body: JSON.stringify({ folderPath: item.folderPath, relativePath: item.relativePath }),
          })
          setFile(meta)
          setFolder({
            folderId: meta.folderId || '',
            path: meta.folderPath || item.folderPath,
            files: meta.files?.length
              ? meta.files
              : [{
                relativePath: item.relativePath,
                name: item.name,
                ext: item.ext,
                size: item.size || 0,
                mtimeMs: item.openedAt || Date.now(),
              }],
          })
          setSelection(null)
          setFileState(null)
          setDocReady(false)
          setShowRecent(false)
        } catch (error) {
          toast('error', error.message)
        }
      }, [toast])

      const openFileDirect = useCallback(async (event) => {
        const picked = event.target.files?.[0]
        event.target.value = ''
        if (!picked) return
        try {
          const bridge = window.__DSH_HOST_PATHS__
          if (!bridge || typeof bridge.pathFor !== 'function') {
            throw new Error('当前 Desktop 不支持直接读取文件路径，请改用“打开文件夹”。')
          }
          const path = bridge.pathFor(picked)
          if (!path) throw new Error('没有拿到文件路径，请改用“打开文件夹”。')
          const meta = await api('/open-file-path', {
            method: 'POST',
            body: JSON.stringify({ path }),
          })
          setFile(meta)
          setFolder({
            folderId: meta.folderId || '',
            path: meta.folderPath,
            files: meta.files?.length
              ? meta.files
              : [{
                relativePath: meta.relativePath,
                name: meta.name,
                ext: meta.ext,
                size: meta.size,
                mtimeMs: Date.now(),
              }],
          })
          setSelection(null)
          setFileState(null)
          setDocReady(false)
          setShowRecent(false)
          forceSavedPatchRef.current = ''
          failedPatchRef.current = ''
          lastSaveAtRef.current = 0
        } catch (error) {
          toast('error', error.message)
        }
      }, [toast])

      useEffect(() => {
        if (!file || !config) return
        const seq = ++editorSeqRef.current
        const host = editorHostRef.current
        if (!host) return
        let disposed = false
        docReadyRef.current = false
        setDocReady(false)

        const destroy = () => {
          try {
            editorRef.current?.destroyEditor?.()
          } catch {
            // 已销毁或宿主已卸载
          }
          editorRef.current = null
          documentKeyRef.current = ''
          docReadyRef.current = false
        }
        destroy()
        host.innerHTML = ''
        const holder = document.createElement('div')
        holder.id = `occ-editor-${seq}`
        holder.className = 'occ-editor'
        host.appendChild(holder)

        const key = `${file.fileId}-v${file.version}-${Date.now()}`
        documentKeyRef.current = key
        const port = config.contentPort || window.location.port || '80'
        const internalBase = `http://${config.dockerHost}:${port}`
        const token = encodeURIComponent(file.token)
        const fileId = encodeURIComponent(file.fileId)
        const isPdf = file.ext === '.pdf'
        const editorConfig = {
          documentType: documentTypeOf(file.ext),
          document: {
            fileType: file.ext.replace('.', ''),
            key,
            title: file.name,
            url: `${internalBase}${API}/content?fileId=${fileId}&token=${token}`,
            permissions: { edit: !isPdf, download: true, print: true },
          },
          editorConfig: {
            mode: isPdf ? 'view' : 'edit',
            lang: 'zh-CN',
            callbackUrl: `${internalBase}${API}/callback?fileId=${fileId}&token=${token}`,
            user: { id: 'local-user', name: '本机用户' },
            customization: {
              autosave: true,
              forcesave: true,
              compactHeader: true,
              hideRightMenu: true,
              about: false,
              feedback: false,
              help: false,
              logo: { visible: false, url: '' },
              goback: { url: '', text: '' },
              features: { tabStyle: 'line', tabBackground: 'toolbar' },
            },
            plugins: {
              autostart: [PLUGIN_GUID],
              pluginsData: [
                `http://127.0.0.1:${config.contentPort || window.location.port}${API}/${fileId}/config.json`,
              ],
              pluginMarketplace: false,
            },
          },
          events: {
            onDocumentReady: () => {
              if (disposed || seq !== editorSeqRef.current) return
              docReadyRef.current = true
              setDocReady(true)
            },
            onDocumentStateChange: (event) => {
              if (event?.data === true) docReadyRef.current = true
            },
            onError: (event) => {
              if (disposed) return
              const text = event?.data?.errorDescription || event?.data?.errorCode || '编辑器打开失败'
              toast('error', `OnlyOffice：${text}`)
            },
          },
        }

        let cancelled = false
        ;(async () => {
          try {
            await loadDocsApi(`${config.documentServerUrl.replace(/\/+$/, '')}/web-apps/apps/api/documents/api.js`)
            if (cancelled || disposed || seq !== editorSeqRef.current) return
            editorRef.current = new window.DocsAPI.DocEditor(holder.id, editorConfig)
          } catch (error) {
            if (!cancelled && !disposed) toast('error', error.message)
          }
        })()

        return () => {
          cancelled = true
          disposed = true
          destroy()
          host.innerHTML = ''
        }
      }, [file?.fileId, file?.version, config?.documentServerUrl, config?.dockerHost, toast])

      useEffect(() => {
        setAiPending(false)
        setChatOpen(false)
      }, [file?.fileId])

      useEffect(() => {
        setCollapsedDirs({})
      }, [folder?.path])

      useEffect(() => {
        currentFileIdRef.current = file?.fileId || ''
        if (!file) {
          setSelection(null)
          return
        }
        let alive = true
        const timer = setInterval(async () => {
          try {
            const next = await api(`/selection?fileId=${encodeURIComponent(file.fileId)}&pluginToken=${encodeURIComponent(file.pluginToken)}`)
            if (!alive || currentFileIdRef.current !== file.fileId) return
            if (next && next.at) setSelection(next)
          } catch {
            // 编辑器尚未就绪时忽略
          }
        }, 800)
        return () => {
          alive = false
          clearInterval(timer)
        }
      }, [file?.fileId, file?.pluginToken])

      const forceSave = useCallback(async (patchId) => {
        if (!file || !documentKeyRef.current) return
        try {
          await api('/force-save', {
            method: 'POST',
            headers: { 'x-office-token': file.token },
            body: JSON.stringify({ fileId: file.fileId, key: documentKeyRef.current }),
          })
          forceSavedPatchRef.current = patchId
          toast('info', '修改已应用，正在写入文件…')
        } catch (error) {
          forceSavedPatchRef.current = `${patchId}:error`
          toast('error', `修改已应用，但保存失败：${error.message}。可点击“重试保存”。`)
        }
      }, [file, toast])

      const retrySave = useCallback(() => {
        const state = fileState
        if (state?.lastPatch?.status === 'applied') {
          forceSavedPatchRef.current = ''
          forceSave(state.lastPatch.id)
        }
      }, [fileState, forceSave])

      useEffect(() => {
        if (!file) return
        let alive = true
        const timer = setInterval(async () => {
          try {
            const state = await api(`/state?fileId=${encodeURIComponent(file.fileId)}`, {
              headers: { 'x-office-token': file.token },
            })
            if (!alive || currentFileIdRef.current !== file.fileId) return
            setFileState(state)
            const patch = state.lastPatch
            if (patch && patch.at && patch.at >= sendAtRef.current - 2000 && ['applied', 'failed', 'timeout'].includes(patch.status)) setAiPending(false)
            if (patch?.status === 'applied' && docReadyRef.current && patch.downloadSaved !== true
              && forceSavedPatchRef.current !== patch.id && forceSavedPatchRef.current !== `${patch.id}:error`) {
              await forceSave(patch.id)
            }
            if (patch?.status === 'failed' && failedPatchRef.current !== patch.id) {
              failedPatchRef.current = patch.id
              toast('error', patch.error || '修改未应用')
            }
            if (state.lastSaveAt && state.lastSaveAt > lastSaveAtRef.current) {
              lastSaveAtRef.current = state.lastSaveAt
              if (patch?.status === 'applied') toast('success', '已应用并保存到文件')
            }
          } catch {
            // 忽略轮询中的瞬时错误
          }
        }, 1000)
        return () => {
          alive = false
          clearInterval(timer)
        }
      }, [file?.fileId, file?.token, forceSave, toast])

      const canSend = Boolean(!cloudOpen && file && selection && (selection.address || selection.text || selection.formula) && instruction.trim() && !busy)
      const cloudConnected = Boolean(cloudView.ready && cloudIsDocUrl(cloudView.url))
      const cloudCanSend = Boolean(cloudOpen && cloudEmbed && cloudConnected && cloudSelection?.html && instruction.trim() && !busy)
      const canUndo = Boolean(file && fileState?.backups?.some((item) => item.reason === 'agent'))
      const cloudCanRestore = Boolean(cloudOpen && cloudEmbed && cloudSelection?.html && cloudSavedAt > 0 && !cloudBusy)

      const sendToAgent = useCallback(async () => {
        if (!file || !selection) {
          toast('error', '请先在文档中选中要修改的内容。')
          return
        }
        if (!instruction.trim()) {
          toast('error', '请先写下要 Agent 怎么改。')
          return
        }
        if (!service?.newSession && !service?.newWorkspaceSession) {
          toast('error', '当前宿主未提供工作台会话能力。')
          return
        }
        // sessions 可能晚于本插件加载；调用时再从插件上下文补取一次。
        if (!globalThis.__officeCoCreationSessions?.manager?.get && globalThis.__officeCoCreationPluginCtx?.sessions) {
          globalThis.__officeCoCreationSessions = globalThis.__officeCoCreationPluginCtx.sessions
        }
        if (!globalThis.__officeCoCreationSessions?.manager?.get) {
          toast('error', '会话服务尚未就绪，请稍后重试。')
          return
        }
        setBusy(true)
        try {
          // 与 task-assistant 相同的会话创建模式：newSession/newWorkspaceSession
          // （ensureSession 内部走 sourcePackage()，宿主自身上下文会抛错，其他工作台不用它）
          let sessionId = ''
          const storageKey = SESSION_PREFIX + (file.folderPath || folder?.path || 'default')
          try { sessionId = localStorage.getItem(storageKey) || '' } catch { sessionId = '' }
          if (sessionId) {
            const existing = globalThis.__officeCoCreationSessions.manager.get(sessionId)
            if (!existing) sessionId = ''
          }
          if (!sessionId) {
            const workspace = service.defaultWorkspace?.()
            sessionId = await (workspace ? service.newSession(workspace.workspaceId) : service.newWorkspaceSession())
            if (!sessionId) {
              toast('info', '已取消选择工作区，未创建会话。')
              return
            }
            try { localStorage.setItem(storageKey, sessionId) } catch { /* 忽略存储失败 */ }
          }
          const session = globalThis.__officeCoCreationSessions.manager.get(sessionId)
          if (!session || typeof session.prompt !== 'function') throw new Error('无法获取工作台会话')
          const quote = selectionLabel(selection) || '（空内容）'
          const address = selection.kind === 'cell' ? `\n单元格地址：${selection.address || '（未提供）'}` : ''
          const formula = selection.formula ? `\n原公式：${selection.formula}` : ''
          const prompt = `你正在金鹰 Agent 的「办公套件」工作台里修改一个本地 Office 文件。

文件：${file.name}
file_id：${file.fileId}
文件类型：${file.ext}
选区类型：${selection.kind === 'cell' ? 'Excel 单元格/区域' : selection.kind === 'word' ? 'Word 文字选区' : 'PPT 文本框选区'}${address}${formula}
用户选中的内容：
"""
${quote}
"""

用户指令：
${instruction.trim()}

要求：
1. 只修改选中的区域，不要重写整篇文档，不要改动其他单元格、段落或幻灯片。
2. 内容修改用 office_apply_patch 的 text 参数（Excel 还要传 address）；格式修改用 ops 参数（formatText / formatTable / formatRange）；text 与 ops 可以同时传。
3. 用户要求美化表格、加粗、换字体、配色、边框、对齐、字号、列宽、填充时，必须用 ops 完成，不要说无法修改样式。Word 表格直接用 formatTable 处理表头、边框、隔行底色和字体；如果选区不在表格里（例如选中的是标题），用 formatTable 的 tableIndex（第一张表为 0）或 matchText（表格内任意单元格文字）定位表格。
4. 如果选中内容不足以完成指令，先在对话里向用户确认，不要猜测，也不要直接改文件。
5. 不要用其他文件工具直接编辑这个文件。`
          const result = await session.prompt([{ type: 'text', text: prompt }], 'queue')
          if (result && result.ok === false) throw new Error(result.error?.message || '消息发送失败')
          setInstruction('')
          sendAtRef.current = Date.now()
          setAiOpen(true)
          setAiPending(true)
          toast('info', '正在修改选区…')
        } catch (error) {
          setAiPending(false)
          try {
            fetch(`${API}/debug`, {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ type: 'send-error', message: String(error?.message || error), stack: String(error?.stack || '').slice(0, 600) }),
            }).catch(() => {})
          } catch { /* 诊断失败不阻断 */ }
          toast('error', error.message)
        } finally {
          setBusy(false)
        }
      }, [file, selection, instruction, service, folder, toast])

      const sendCloudToAgent = useCallback(async () => {
        if (!cloudEmbed) {
          toast('error', '请先在内嵌浏览器里打开 WPS 云文档。')
          return
        }
        if (!cloudView.ready) {
          toast('error', '云文档还在加载，请稍后再试。')
          return
        }
        if (!cloudIsDocUrl(cloudView.url)) {
          toast('error', '请先在内嵌浏览器里登录 WPS 并打开云文档。')
          return
        }
        if (!cloudSelection?.html) {
          toast('error', '请先在 WPS 里选中要修改的内容并按 ⌘C，再回到工作台。')
          return
        }
        if (!instruction.trim()) {
          toast('error', '请先写下要 AI 怎么改。')
          return
        }
        if (!service?.newSession && !service?.newWorkspaceSession) {
          toast('error', '当前宿主未提供工作台会话能力。')
          return
        }
        if (!globalThis.__officeCoCreationSessions?.manager?.get && globalThis.__officeCoCreationPluginCtx?.sessions) {
          globalThis.__officeCoCreationSessions = globalThis.__officeCoCreationPluginCtx.sessions
        }
        if (!globalThis.__officeCoCreationSessions?.manager?.get) {
          toast('error', '会话服务尚未就绪，请稍后重试。')
          return
        }
        setBusy(true)
        try {
          let sessionId = ''
          const storageKey = `${SESSION_PREFIX}cloud.${cloudEmbed.targetUrl || 'default'}`
          try { sessionId = localStorage.getItem(storageKey) || '' } catch { sessionId = '' }
          if (sessionId) {
            const existing = globalThis.__officeCoCreationSessions.manager.get(sessionId)
            if (!existing) sessionId = ''
          }
          if (!sessionId) {
            const workspace = service.defaultWorkspace?.()
            sessionId = await (workspace ? service.newSession(workspace.workspaceId) : service.newWorkspaceSession())
            if (!sessionId) {
              toast('info', '已取消选择工作区，未创建会话。')
              return
            }
            try { localStorage.setItem(storageKey, sessionId) } catch { /* 忽略存储失败 */ }
          }
          const session = globalThis.__officeCoCreationSessions.manager.get(sessionId)
          if (!session || typeof session.prompt !== 'function') throw new Error('无法获取工作台会话')
          const sourceHtml = cloudSelection.pasteHtml || cloudSelection.html
          const html = sourceHtml.slice(0, 40_000)
          const truncated = sourceHtml.length > html.length ? '\n（选区 HTML 较长，以上为前 40000 字符）' : ''
          const kind = cloudSelection.kind || ''
          const kindLabel = kind === 'word' ? 'Word 文字文稿' : kind === 'sheet' ? 'Excel 表格' : kind === 'slide' ? 'PPT 演示文稿' : 'WPS 云文档'
          const htmlRule = kind === 'sheet'
            ? '返回完整的替换 HTML（例如 <table>...</table>），保留原有内联样式和 class；不要返回 Markdown 代码块或解释文字。'
            : '返回简单的替换 HTML（例如 <p>...</p> 或 <span style="...">...</span>），不要返回 <html>、<head>、<xml>、mso 命名空间或整篇文档；字体、字号、颜色、加粗、斜体、下划线、对齐、行距都用内联 style 表达；字号换算：初号42pt、小初36pt、一号26pt、小一24pt、二号22pt、小二18pt、三号16pt、小三15pt、四号14pt、小四12pt、五号10.5pt、小五9pt；不要返回 Markdown 代码块或解释文字。'
          const prompt = `你正在金鹰 Agent 的「办公套件」工作台里修改一个 WPS 云文档选区。

云文档：${cloudView.title || 'WPS 云文档'}
文档类型：${kindLabel}
链接：${cloudView.url || cloudEmbed.targetUrl}

用户选中的内容（HTML）：
"""
${html}
"""
${truncated}

用户选中的纯文本：
"""
${cloudSelection.text.slice(0, 4000)}
"""

用户指令：
${instruction.trim()}

要求：
1. 只修改选中的内容，保持原有段落/表格/文本框结构和样式，不要重写整篇文档。
2. ${htmlRule}
3. 调用 office_cloud_apply 工具：html 是替换片段的完整 HTML，text 是纯文本，note 是一句话说明改了什么。
4. 云文档必须在浏览器里原地修改，不要下载、不要上传、不要用其他工具直接改文件。
5. 如果选区内容不足以完成指令，先在对话里向用户确认，不要猜测。
6. 保留原选区的字体、字号、颜色、底色、边框、对齐、行距、段前段后（表格还要保留行高/列宽和合并单元格）；工作台会对比修改前后的格式/样式并生成页面截图，不要为了省事重写样式。`
          const result = await session.prompt([{ type: 'text', text: prompt }], 'queue')
          if (result && result.ok === false) throw new Error(result.error?.message || '消息发送失败')
          setInstruction('')
          setCloudPending(true)
          setCloudStage('AI 正在修改云文档选区…')
          toast('info', '正在修改云文档选区…')
        } catch (error) {
          setCloudPending(false)
          try {
            fetch(`${API}/debug`, {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ type: 'cloud-send-error', message: String(error?.message || error), stack: String(error?.stack || '').slice(0, 600) }),
            }).catch(() => {})
          } catch { /* 诊断失败不阻断 */ }
          toast('error', error.message)
        } finally {
          setBusy(false)
        }
      }, [cloudEmbed, cloudView, cloudSelection, instruction, service, toast])

      const undo = useCallback(async () => {
        if (!file) return
        try {
          setBusy(true)
          try { editorRef.current?.destroyEditor?.() } catch { /* ignore */ }
          editorRef.current = null
          docReadyRef.current = false
          setDocReady(false)
          await new Promise((resolve) => setTimeout(resolve, 1600))
          const updated = await api('/undo', {
            method: 'POST',
            headers: { 'x-office-token': file.token },
            body: JSON.stringify({ fileId: file.fileId }),
          })
          setFile(updated)
          setSelection(null)
          setFileState(null)
          forceSavedPatchRef.current = ''
          toast('success', '已撤销到修改前版本')
        } catch (error) {
          toast('error', `撤销失败：${error.message}`)
        } finally {
          setBusy(false)
        }
      }, [file, toast])

      const displayFile = file
      const folderName = displayFile?.folderPath || folder?.path || ''
      const selectionText = selectionLabel(selection)

      const fileRow = (item, subtitle, meta, onClick) => h('button', {
        key: `${subtitle}/${item.name}`,
        className: 'occ-filerow',
        onClick,
        title: subtitle,
      },
        h('span', { className: 'occ-ext' }, extLabel(item.ext)),
        h('span', { className: 'occ-row-name' }, item.name),
        h('span', { className: 'occ-row-sub' }, subtitle),
        h('span', { className: 'occ-row-meta' }, meta),
      )

      const lastPatch = fileState?.lastPatch
      const aiStage = aiPending
        ? 'AI 处理中…'
        : lastPatch?.status === 'delivered' ? '正在写入编辑器…'
          : lastPatch?.status === 'applied' ? (lastPatch.downloadSaved ? '已应用并保存' : '已应用，等待保存')
            : lastPatch?.status === 'failed' ? '修改失败'
              : lastPatch?.status === 'timeout' ? '等待编辑器超时' : ''

      const renderComposer = (isCloud) => h('div', { className: 'occ-composer', 'data-dsh-no-drag': '' },
        isCloud && h('button', {
          className: 'occ-read',
          onClick: () => readCloudSelection(),
          disabled: !cloudConnected || cloudBusy || busy || cloudPending,
          title: cloudSelection ? '重新读取 WPS 中当前选中的区域' : '读取 WPS 中当前选中的区域',
        }, cloudSelection ? '重新读取' : '读取选区'),
        h('div', { className: 'occ-select-info' },
          h('span', { className: 'occ-sel-dot' }),
          h('span', {
            className: 'occ-quote',
            title: isCloud ? (cloudSelection?.text || '') : selectionText,
          }, isCloud
            ? (cloudSelection?.text?.slice(0, 120) || '未读取云文档选区')
            : (selectionText || '未选中内容')),
        ),
        h('input', {
          value: instruction,
          onChange: (event) => setInstruction(event.target.value),
          onKeyDown: (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              const ready = isCloud ? cloudCanSend : canSend
              if (ready) (isCloud ? sendCloudToAgent : sendToAgent)()
            }
          },
          placeholder: isCloud ? '描述要 AI 怎么改云文档选区…' : '描述要 AI 怎么改…',
          'aria-label': isCloud ? '云文档修改指令' : '修改指令',
        }),
        h('button', { className: 'occ-link', onClick: () => setAiOpen((open) => !open), title: '查看 AI 处理过程' }, '过程'),
        conversation && h('button', { className: 'occ-link', onClick: () => setChatOpen(true), title: '打开完整 AI 对话' }, '对话'),
        h('button', {
          className: 'occ-send',
          onClick: isCloud ? sendCloudToAgent : sendToAgent,
          disabled: isCloud ? !cloudCanSend : !canSend,
        }, busy ? '发送中' : '应用'),
      )

      const renderSetup = () => {
        const docker = setup?.docker
        const job = setup?.job || {}
        const guide = setup?.guide
        const container = docker?.container
        const installed = Boolean(docker?.installed)
        const dockerRunning = Boolean(docker?.running)
        const serverUp = Boolean(setup?.serverUp)
        const registryBlocked = !job.running && Boolean(job.error && /registry-1\.docker\.io|failed to resolve reference|connectex|No connection could be made|TLS handshake|i\/o timeout|dial tcp/i.test(`${job.error}\n${job.logTail}`))
        const check = (label, state, text) => h('div', { className: 'occ-setup-check' },
          h('span', { className: `occ-setup-dot ${state === true ? 'on' : state === false ? 'off' : ''}` }),
          h('span', { className: 'occ-setup-check-label' }, label),
          h('span', { className: 'occ-setup-check-text' }, text),
        )
        const recheck = h('button', {
          key: 'recheck',
          onClick: async () => {
            await loadSetup()
            await refreshHealth()
          },
          disabled: setupBusy || job.running,
        }, '重新检测')
        let title = '正在检查本机环境…'
        let desc = '正在确认 Docker 与 OnlyOffice Document Server 的状态。'
        let actions = [recheck]
        if (setup) {
          if (!installed) {
            title = '需要先安装 Docker'
            desc = `${guide?.text || 'OnlyOffice 通过 Docker 在本机运行。'} 安装完成后回到这里点“重新检测”。文档与 OnlyOffice 都留在本机，不会上传云端。`
            actions = [
              guide?.url ? h('a', { key: 'guide', href: guide.url, target: '_blank', rel: 'noreferrer' }, '去安装 Docker') : null,
              recheck,
            ].filter(Boolean)
          } else if (!dockerRunning) {
            title = 'Docker 已安装，但服务没有运行'
            desc = '点“打开 Docker Desktop”，等鲸鱼图标稳定显示 Running 后点“重新检测”。Windows 首次启动可能要 1 分钟。'
            actions = [
              h('button', { key: 'open-docker', className: 'occ-primary', onClick: openDocker }, '打开 Docker Desktop'),
              recheck,
            ]
          } else {
            title = serverUp ? 'OnlyOffice 已连接' : '一键安装本机 OnlyOffice'
            desc = serverUp
              ? '本机 Document Server 已就绪，可以直接打开并编辑文件。'
              : '文档编辑依赖本机 OnlyOffice Document Server。首次安装会拉取约 1–2 GB 镜像，之后直接复用；服务只监听 127.0.0.1，文档不上传云端。'
            if (!serverUp) {
              actions = [
                job.running ? null : h('button', {
                  key: 'primary',
                  className: 'occ-primary',
                  onClick: () => startSetup(),
                  disabled: setupBusy,
                }, container?.exists
                  ? (container.running ? '等待 OnlyOffice 就绪' : '启动 OnlyOffice 容器')
                  : '一键安装并启动 OnlyOffice'),
                recheck,
              ].filter(Boolean)
            } else {
              actions = [recheck]
            }
          }
        }
        return h('div', { className: 'occ-setup' },
          h('div', { className: 'occ-setup-title' }, title),
          h('div', { className: 'occ-setup-desc' }, desc),
          h('div', { className: 'occ-setup-checks' },
            check('Docker', installed, installed ? (docker?.version ? `已安装 · ${docker.version.split('\n')[0]}` : '已安装') : '未检测到 docker 命令'),
            check('Docker 服务', dockerRunning, dockerRunning ? '运行中' : installed ? '未运行' : '—'),
            check('OnlyOffice 容器', container?.exists ? container.running : undefined,
              container?.exists ? (container.running ? '运行中' : '已停止') : installed && dockerRunning ? '尚未创建' : '—'),
            check('Document Server', serverUp, serverUp ? `已连接 · 127.0.0.1:${setup?.port || 18080}` : '未连接'),
          ),
          h('div', { className: 'occ-setup-actions' }, actions),
          registryBlocked && h('div', { className: 'occ-setup-registry' },
            h('div', { className: 'occ-setup-detail occ-setup-error' }, 'Docker Hub 连不上（DNS 污染或网络拦截）。可以改用国内镜像重试：'),
            h('div', { className: 'occ-setup-actions' },
              (setup?.mirrors || []).map((image) => h('button', {
                key: image,
                onClick: () => startSetup(image),
                disabled: setupBusy,
              }, image.split('/')[0])),
            ),
            h('div', { className: 'occ-setup-actions' },
              h('input', {
                className: 'occ-setup-input',
                value: customImage,
                onChange: (event) => setCustomImage(event.target.value),
                placeholder: 'registry.cn-hangzhou.aliyuncs.com/命名空间/documentserver:latest',
                'aria-label': '自定义镜像地址',
              }),
              h('button', {
                onClick: () => startSetup(customImage.trim()),
                disabled: setupBusy || !customImage.trim(),
              }, '用这个镜像安装'),
            ),
            h('details', {},
              h('summary', {}, '配置 Docker Desktop 镜像加速（长期生效）'),
              h('div', { className: 'occ-setup-detail' },
                'Docker Desktop → Settings → Docker Engine，在 JSON 里加 ',
                h('code', {}, '"registry-mirrors": ["https://docker.m.daocloud.io"]'),
                '，点 Apply & restart，再回来重新检测。公司有内部镜像仓库时，填内部地址更稳。'),
            ),
          ),
          job.startedAt && h('div', { className: `occ-setup-detail${job.error ? ' occ-setup-error' : ''}` },
            h('div', {}, `步骤：${job.step || '准备中'}${job.detail ? ` · ${job.detail}` : ''}`),
            job.error ? h('div', {}, job.error) : null,
            job.logTail ? h('pre', { className: 'occ-setup-log' }, job.logTail) : null,
          ),
          setup?.manualCommand
            ? h('details', {},
              h('summary', {}, '查看手动安装命令'),
              h('pre', { className: 'occ-code' }, setup.manualCommand),
            )
            : null,
        )
      }

      return h('div', { ref: rootRef, className: `occ-root ${dark ? 'occ-dark' : 'occ-light'}` },
        h('input', {
          type: 'file',
          accept: '.xlsx,.xls,.csv,.ods,.docx,.doc,.odt,.pptx,.ppt,.odp,.pdf',
          ref: fileInputRef,
          style: { display: 'none' },
          onChange: openFileDirect,
          'aria-hidden': 'true',
        }),
        h('header', { className: 'occ-toolbar', 'data-dsh-workbench-toolbar': '' },
          h('div', { className: 'occ-brand' },
            h('span', { className: 'occ-mark' }),
            h('span', { className: 'occ-title' }, '办公套件'),
          ),
          cloudOpen
            ? h('div', { className: 'occ-file' },
              h('span', { className: 'occ-filename', title: cloudView.title || 'WPS 云文档' }, cloudView.title || 'WPS 云文档'),
              h('span', { className: 'occ-folder', title: cloudView.url || '' }, cloudView.url || ''),
            )
            : displayFile && h('div', { className: 'occ-file' },
              h('span', { className: 'occ-filename', title: displayFile.name }, displayFile.name),
              h('span', { className: 'occ-folder', title: folderName }, folderName),
            ),
          h('div', { className: 'occ-actions' },
            !cloudOpen && h('button', { className: 'occ-primary', onClick: () => fileInputRef.current?.click(), title: '直接选择一个 Excel / Word / PPT 文件' }, '打开文件'),
            !cloudOpen && h('button', {
              onClick: openFolder,
              disabled: folderBusy,
              title: '选择一个本地文件夹，再从左侧列表打开文件；如果弹窗没出现，按 Esc 后重试',
            }, folderBusy ? '打开中…' : '打开文件夹'),
            !cloudOpen && h('button', {
              className: 'occ-link',
              onClick: () => {
                setShowFolderPathInput((value) => !value)
                if (!folderPathDraft) setFolderPathDraft(service?.defaultWorkspace?.()?.path || '')
              },
              title: '原生选择器卡住时，直接输入文件夹绝对路径',
            }, '输入路径'),
            !cloudOpen && h('button', { onClick: () => setShowRecent((value) => !value) }, '最近'),
            !cloudOpen && displayFile && h('button', { onClick: undo, disabled: !canUndo || busy, title: '恢复到最近一次修改前' }, '撤销修改'),
            h('button', {
              className: cloudOpen ? 'occ-primary' : '',
              onClick: toggleCloud,
              title: cloudOpen ? '返回本地 Office 文件' : '在工作台内嵌浏览器里原地修改 WPS 云文档',
            }, cloudOpen ? '返回本地' : '云文档'),
            cloudOpen && cloudCanRestore && h('button', { onClick: restoreCloud, disabled: cloudBusy, title: '把云文档选区恢复到这次 AI 修改前' }, '撤销云端修改'),
            cloudOpen
              ? h('span', { className: 'occ-health', title: cloudConnected ? 'WPS 云文档已连接' : 'WPS 云文档未连接' },
                h('span', { className: `occ-dot${cloudConnected ? ' on' : ''}` }),
                h('span', { className: 'occ-health-text' }, cloudConnected ? '云文档已连接' : cloudView.ready ? '等待登录 WPS' : '云文档加载中'),
              )
              : h('span', { className: 'occ-health', title: health ? 'OnlyOffice 已连接' : 'OnlyOffice 未启动' },
                h('span', { className: `occ-dot${health ? ' on' : ''}` }),
                h('span', { className: 'occ-health-text' }, health ? 'OnlyOffice 已连接' : 'OnlyOffice 未启动'),
              ),
          ),
          showFolderPathInput && h('div', { className: 'occ-pathbar', 'data-dsh-no-drag': '' },
            h('input', {
              value: folderPathDraft,
              onChange: (event) => setFolderPathDraft(event.target.value),
              onKeyDown: (event) => {
                if (event.key === 'Enter' && folderPathDraft.trim() && !folderBusy) openFolderPath()
              },
              placeholder: '/Users/…/文件夹',
              'aria-label': '文件夹绝对路径',
            }),
            h('button', {
              className: 'occ-primary',
              onClick: openFolderPath,
              disabled: folderBusy || !folderPathDraft.trim(),
            }, folderBusy ? '打开中…' : '打开'),
            h('button', { className: 'occ-link', onClick: () => setShowFolderPathInput(false) }, '取消'),
          ),
        ),
        h('div', { className: 'occ-body' },
          folder && h('aside', { className: 'occ-rail', 'data-dsh-no-drag': '' },
            h('div', { className: 'occ-rail-head' },
              h('span', {}, '文件夹'),
              h('span', {}, String(folder.files?.length || 0)),
            ),
            h('div', { className: 'occ-rail-list' },
              (folder.files || []).length === 0
                ? h('div', { className: 'occ-muted' }, '没有找到可编辑的 Office 文件。')
                : groupFilesByFolder(folder.files, folder.path).map((group) => {
                  const key = group.dir || '.'
                  const collapsed = collapsedDirs[key] === true
                  return h('div', { key, className: 'occ-group' },
                    h('button', {
                      className: 'occ-folderrow',
                      style: { paddingLeft: `${8 + group.depth * 12}px` },
                      onClick: () => setCollapsedDirs((prev) => ({ ...prev, [key]: !prev[key] })),
                      title: group.path,
                    },
                    h('span', { className: `occ-caret${collapsed ? '' : ' open'}` }),
                    h('span', { className: 'occ-foldericon' },
                      h('svg', {
                        width: 15, height: 15, viewBox: '0 0 24 24', fill: 'none',
                        stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round',
                      }, h('path', { d: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' })),
                    ),
                    h('span', { className: 'occ-foldername' }, group.name),
                    h('span', { className: 'occ-foldercount' }, String(group.files.length)),
                    ),
                    !collapsed && group.files.map((item) => h('button', {
                      key: item.relativePath,
                      className: `occ-fileitem${file?.relativePath === item.relativePath ? ' active' : ''}`,
                      style: { paddingLeft: `${18 + group.depth * 12}px` },
                      onClick: () => openFile(folder.folderId, item.relativePath),
                      title: item.relativePath,
                    },
                    h('span', { className: 'occ-ext' }, extLabel(item.ext)),
                    h('span', { className: 'occ-item-main' },
                      h('span', { className: 'occ-item-name' }, item.name),
                      h('span', { className: 'occ-item-meta' }, `${formatSize(item.size)} · ${formatTime(item.mtimeMs)}`),
                    ))),
                  )
                }),
            ),
          ),
          h('main', { className: 'occ-main' },
            displayFile
              ? h('div', { className: 'occ-editor-wrap', 'data-dsh-no-drag': '' },
                h('div', { className: 'occ-editor', ref: editorHostRef }),
                !docReady && h('div', { className: 'occ-editor-loading' }, '正在打开 OnlyOffice 编辑器…'),
              )
              : h('div', { className: 'occ-landing' },
                health === false
                  ? renderSetup()
                  : (folder || recent.length > 0)
                    ? h('div', { className: 'occ-start' },
                      folder && h('div', { className: 'occ-filelist' },
                        h('div', { className: 'occ-list-title' },
                          h('span', { className: 'occ-list-name' }, '文件夹'),
                          h('span', { className: 'occ-list-sub', title: folder.path }, folder.path),
                        ),
                        (folder.files || []).length === 0
                          ? h('div', { className: 'occ-quiet' }, '此文件夹内没有可编辑的 Office 文件')
                          : folder.files.map((item) => fileRow(item, item.relativePath,
                            `${formatSize(item.size)} · ${formatTime(item.mtimeMs)}`,
                            () => openFile(folder.folderId, item.relativePath))),
                      ),
                      recent.length > 0 && h('div', { className: 'occ-filelist' },
                        h('div', { className: 'occ-list-title' },
                          h('span', { className: 'occ-list-name' }, '最近打开'),
                        ),
                        recent.map((item) => fileRow(item, item.folderPath,
                          formatTime(item.openedAt), () => openRecent(item))),
                      ),
                    )
                    : h('div', { className: 'occ-start-empty' },
                      h('button', { className: 'occ-primary', onClick: () => fileInputRef.current?.click() }, '打开文件'),
                      h('span', { className: 'occ-empty-hint' }, 'docx / xlsx / pptx / csv / doc / pdf 等'),
                    ),
              ),
            displayFile && (aiPending || aiOpen) && h('div', { className: 'occ-progress' },
              h('div', { className: 'occ-progress-main' },
                h('span', { className: `occ-ai-step-dot${aiPending ? ' active' : lastPatch?.downloadSaved ? ' done' : ''}` }),
                h('span', { className: 'occ-progress-text' }, aiStage || 'AI 修改'),
                lastPatch?.error && h('span', { className: 'occ-progress-error', title: lastPatch.error }, lastPatch.error),
                h('button', { className: 'occ-link', onClick: () => setAiOpen(false) }, '收起'),
              ),
              aiOpen && h('div', { className: 'occ-progress-steps' },
                lastPatch || aiPending
                  ? h('div', {},
                    h('div', { className: 'occ-ai-step' },
                      h('span', { className: 'occ-ai-step-dot done' }),
                      h('span', {}, '指令已发送给 AI'),
                    ),
                    h('div', { className: 'occ-ai-step' },
                      h('span', { className: aiPending ? 'occ-ai-step-dot active' : lastPatch ? 'occ-ai-step-dot done' : 'occ-ai-step-dot' }),
                      h('span', {}, aiPending ? 'AI 正在分析选区并生成修改' : lastPatch ? 'AI 已返回修改方案' : '等待 AI 处理'),
                    ),
                    h('div', { className: 'occ-ai-step' },
                      h('span', { className: lastPatch?.status === 'delivered' ? 'occ-ai-step-dot active' : lastPatch?.status === 'applied' ? 'occ-ai-step-dot done' : 'occ-ai-step-dot' }),
                      h('span', {}, lastPatch?.status === 'applied' ? '修改已应用到编辑器' : lastPatch?.status === 'delivered' ? '正在写入编辑器' : '等待写入编辑器'),
                    ),
                    h('div', { className: 'occ-ai-step' },
                      h('span', { className: lastPatch?.downloadSaved ? 'occ-ai-step-dot done' : 'occ-ai-step-dot' }),
                      h('span', {}, lastPatch?.downloadSaved ? '已保存到原文件' : '等待保存到原文件'),
                    ),
                  )
                  : h('div', { className: 'occ-muted' }, '还没有进行中的修改。'),
              ),
            ),
            displayFile && selection && (selection.address || selection.text || selection.formula) && !cloudOpen && renderComposer(false),
            displayFile && h('footer', { className: 'occ-footer' },
              h('span', { className: 'occ-path', title: displayFile.relativePath }, displayFile.relativePath),
              h('span', {}, `v${fileState?.version ?? displayFile.version}`),
              h('span', {}, fileState?.lastSaveAt ? `已保存 ${formatTime(fileState.lastSaveAt)}` : '等待保存'),
              h('span', {}, fileState?.pluginReadyAt ? '选区插件已连接' : displayFile.ext === '.pdf' ? 'PDF 只读' : '选区插件未连接'),
              fileState?.lastPatch?.status && h('span', {}, `最近补丁：${fileState.lastPatch.status}`),
              forceSavedPatchRef.current.endsWith(':error') && h('button', { onClick: retrySave }, '重试保存'),
            ),
          ),
          (cloudOpen || cloudEmbed) && h('section', {
            className: 'occ-cloud',
            'data-dsh-no-drag': '',
            style: { display: cloudOpen ? 'flex' : 'none' },
          },
          h('div', { className: 'occ-cloud-bar' },
            h('button', {
              className: 'occ-link',
              onClick: () => { try { cloudWebviewRef.current?.goBack() } catch { /* ignore */ } },
              disabled: !cloudView.canBack,
              title: '后退',
            }, '←'),
            h('button', {
              className: 'occ-link',
              onClick: () => { try { cloudWebviewRef.current?.goForward() } catch { /* ignore */ } },
              disabled: !cloudView.canForward,
              title: '前进',
            }, '→'),
            h('button', {
              className: 'occ-link',
              onClick: () => { try { cloudWebviewRef.current?.reload() } catch { /* ignore */ } },
              title: '刷新',
            }, '刷新'),
            h('span', { className: `occ-dot${cloudConnected ? ' on' : ''}` }),
            h('span', { className: 'occ-cloud-title', title: cloudView.url || '' }, cloudView.title || 'WPS 云文档'),
            h('button', {
              className: 'occ-link',
              onClick: () => {
                setCloudUrl(cloudView.url || '')
                releaseCloudEmbed()
              },
              title: '关闭当前云文档，换一份',
            }, '换一份'),
            h('button', {
              className: 'occ-link',
              onClick: () => setCloudOpen(false),
              title: '收起云文档，回到本地文件',
            }, '返回本地'),
          ),
          cloudEmbed
            ? h('div', { className: 'occ-cloud-browser', ref: cloudContainerRef })
            : h('div', { className: 'occ-cloud-scroll' },
              h('div', { className: 'occ-cloud-inner' },
                h('div', { className: 'occ-cloud-head' },
                  h('span', { className: 'occ-mark' }),
                  h('span', { className: 'occ-cloud-title' }, 'WPS 云文档'),
                ),
                h('div', { className: 'occ-cloud-sub' }, '把 WPS 分享文字或文档链接粘进来，浏览器就在这个工作台里打开，不另开侧栏。'),
                h('div', { className: 'occ-cloud-form' },
                  h('input', {
                    value: cloudUrl,
                    onChange: (event) => setCloudUrl(event.target.value),
                    onKeyDown: (event) => {
                      if (event.key === 'Enter' && extractCloudUrl(cloudUrl) && !cloudBusy) openCloudDoc()
                    },
                    placeholder: '粘贴分享文字或链接（含 https://www.kdocs.cn/l/…）',
                    'aria-label': 'WPS 云文档分享文字或链接',
                  }),
                  h('button', {
                    className: 'occ-primary',
                    onClick: openCloudDoc,
                    disabled: cloudBusy || !extractCloudUrl(cloudUrl),
                  }, cloudBusy ? '打开中…' : '打开云文档'),
                ),
                h('div', { className: 'occ-cloud-hint' }, '会自动从分享文字里提取 https 链接。首次使用请在内嵌页面里登录 WPS；登录后选中内容，点「读取选区」。'),
              ),
            ),
          cloudEmbed && !cloudConnected && h('div', { className: 'occ-cloud-hint', style: { padding: '6px 12px 0' } },
            cloudView.ready
              ? '正在等待 WPS 登录或文档加载。如果停在了登录页，登录完成后点「刷新」。'
              : '正在加载云文档…',
          ),
          cloudEmbed && cloudView.error && h('div', { className: 'occ-cloud-error' }, cloudView.error),
          cloudEmbed && h('div', { className: 'occ-cloud-foot' },
            (cloudPending || aiOpen || cloudSavedAt > 0 || cloudVerify) && h('div', { className: 'occ-progress' },
              h('div', { className: 'occ-progress-main' },
                h('span', { className: `occ-ai-step-dot${cloudPending ? ' active' : cloudSavedAt > 0 ? ' done' : ''}` }),
                h('span', { className: 'occ-progress-text' },
                  cloudStage || (cloudPending ? 'AI 正在修改云文档选区…' : cloudSavedAt > 0 ? '已粘贴回云文档并保存' : '云文档修改')),
                cloudVerify && (cloudVerify.beforeShot || cloudVerify.afterShot) && h('button', {
                  className: 'occ-link',
                  onClick: () => setCloudCompareOpen(true),
                  title: '查看修改前后的页面截图',
                }, '对比修改前后'),
                h('button', { className: 'occ-link', onClick: () => setAiOpen(false) }, '收起'),
              ),
              aiOpen && h('div', { className: 'occ-progress-steps' },
                h('div', { className: 'occ-ai-step' },
                  h('span', { className: `occ-ai-step-dot${cloudSelection ? ' done' : ''}` }),
                  h('span', {}, cloudSelection ? '已读取 WPS 选区' : '等待读取 WPS 选区'),
                ),
                h('div', { className: 'occ-ai-step' },
                  h('span', { className: cloudPending ? 'occ-ai-step-dot active' : cloudSavedAt > 0 ? 'occ-ai-step-dot done' : 'occ-ai-step-dot' }),
                  h('span', {}, cloudPending ? 'AI 正在生成修改' : cloudSavedAt > 0 ? 'AI 已返回修改方案' : '等待 AI 处理'),
                ),
                h('div', { className: 'occ-ai-step' },
                  h('span', { className: cloudSavedAt > 0 ? 'occ-ai-step-dot done' : 'occ-ai-step-dot' }),
                  h('span', {}, cloudSavedAt > 0 ? '已粘贴回 WPS 云文档' : '等待粘贴回云文档'),
                ),
                h('div', { className: 'occ-ai-step' },
                  h('span', { className: cloudSavedAt > 0 ? 'occ-ai-step-dot done' : 'occ-ai-step-dot' }),
                  h('span', {}, cloudSavedAt > 0 ? '云端已保存' : '等待云端保存'),
                ),
                h('div', { className: 'occ-ai-step' },
                  h('span', { className: cloudVerify ? (!cloudVerify.styleCheck || cloudVerify.styleCheck.ok ? 'occ-ai-step-dot done' : 'occ-ai-step-dot active') : 'occ-ai-step-dot' }),
                  h('span', {}, cloudVerify ? (!cloudVerify.styleCheck ? '已生成修改前后对比' : cloudVerify.styleCheck.ok ? '格式/样式验收通过' : '格式/样式需要人工确认') : '等待格式/样式验收'),
                ),
              ),
            ),
            renderComposer(true),
          ),
        ),
        ),
        cloudCompareOpen && cloudVerify && h('div', { className: 'occ-compare', 'data-dsh-no-drag': '' },
          h('div', { className: 'occ-compare-panel' },
            h('div', { className: 'occ-compare-head' },
              h('span', {}, '修改前后对比'),
              h('button', { className: 'occ-link', onClick: () => setCloudCompareOpen(false) }, '关闭'),
            ),
            cloudVerify.styleCheck && h('div', { className: `occ-compare-check${cloudVerify.styleCheck.ok ? ' ok' : ''}` },
              h('span', { className: `occ-dot${cloudVerify.styleCheck.ok ? ' on' : ''}` }),
              h('span', {}, cloudVerify.styleCheck.ok
                ? `格式/样式验收通过：样式 ${cloudVerify.styleCheck.after.styles}，字体 ${cloudVerify.styleCheck.after.fonts}，颜色 ${cloudVerify.styleCheck.after.colors}，边框 ${cloudVerify.styleCheck.after.borders}`
                : `格式/样式可能变化（${[...cloudVerify.styleCheck.lost, ...cloudVerify.styleCheck.structureLost].join('、') || '结构'} 减少），请人工确认`),
            ),
            h('div', { className: 'occ-compare-note' }, '验收建议：先看左右截图的字体、颜色、边框、对齐、行高和合并单元格；关闭对比后点顶栏「刷新」，确认云端保存后页面效果仍然正确。'),
            h('div', { className: 'occ-compare-body' },
              h('figure', {},
                h('figcaption', {}, '修改前'),
                cloudVerify.beforeShot
                  ? h('img', { src: cloudVerify.beforeShot, alt: '修改前截图' })
                  : h('div', { className: 'occ-compare-empty' }, '未捕获到修改前截图'),
              ),
              h('figure', {},
                h('figcaption', {}, '修改后'),
                cloudVerify.afterShot
                  ? h('img', { src: cloudVerify.afterShot, alt: '修改后截图' })
                  : h('div', { className: 'occ-compare-empty' }, '未捕获到修改后截图'),
              ),
            ),
          ),
        ),
        chatOpen && h('section', { className: 'occ-chat-float', 'data-dsh-no-drag': '' },
          h('div', { className: 'occ-chat-head' },
            h('span', {}, 'AI 对话'),
            h('button', { className: 'occ-link', onClick: () => setChatOpen(false) }, '关闭'),
          ),
          h('div', { className: 'occ-chat-body' },
            conversation || h('div', { className: 'occ-muted' }, '会话尚未就绪。'),
          ),
        ),
        showRecent && h('div', { className: 'occ-recent-pop', 'data-dsh-no-drag': '' },
          recent.length === 0
            ? h('div', { className: 'occ-muted' }, '还没有最近打开的文件。')
            : recent.map((item) => h('button', {
              key: `${item.folderPath}/${item.relativePath}`,
              className: 'occ-recent-item',
              onClick: () => openRecent(item),
              title: `${item.folderPath}/${item.relativePath}`,
            },
            h('span', { className: 'occ-ext' }, extLabel(item.ext)),
            h('span', { className: 'occ-item-main' },
              h('span', { className: 'occ-item-name' }, item.name),
              h('span', { className: 'occ-item-meta' }, item.folderPath),
            ))),
        ),
        message && h('div', { className: `occ-toast${message.kind === 'error' ? ' error' : ''}`, role: 'status' }, message.text),
      )
    }

    function apply(ctx) {
      installStyles()
      // 诊断：把 fiber entry 的实际内容发到服务端日志，定位注册报错来源。
      try {
        fetch(`${API}/debug`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            at: Date.now(),
            hasFiber: typeof ctx.fiber === 'object',
            hasEntry: !!ctx.fiber?.entry,
            entryName: ctx.fiber?.entry?.options?.name ?? null,
            entryOptions: ctx.fiber?.entry ? Object.keys(ctx.fiber.entry.options || {}) : null,
            entryId: ctx.fiber?.entry?.options?.id ?? null,
            registered: !!globalThis.__officeCoCreationRegistered,
          }),
        }).catch(() => {})
      } catch {
        // 诊断失败不阻断
      }
      // 客户端模块可能被重复物化；首次注册后不再重复注册，避免宿主误报。
      if (globalThis.__officeCoCreationRegistered) return
      // 某些刷新路径下 fiber.entry.options.name 会缺失，不能继续调用宿主注册。
      if (!ctx.fiber?.entry?.options?.name) return
      globalThis.__officeCoCreationRegistered = true
      globalThis.__officeCoCreationPluginCtx = ctx
      globalThis.__officeCoCreationSessions = ctx.sessions
      ctx.effect(() => ctx.desktopWorkbenches.register({
        title: '办公套件',
        description: '人机协同办公，框选任意区域让 AI 开始工作。',
        repository: 'https://github.com/Zcx-BaixiaoBai/ge-workbench-office-co-creation',
        customFrame: true,
        headerLayout: 'compact',
      }, WorkbenchPanel), 'office-co-creation workbench registration')
    }

    return { apply, inject: ['desktopWorkbenches', 'sessions'] }
  },
})