(() => {
  // src/panel.jsx
  var DEFAULT_BASE = "http://jyplan.zcx-baixiaobai.cn";
  var SLOW_MS = 12e3;
  function createPanel(React) {
    const h = React.createElement;
    const { useCallback, useEffect, useMemo, useRef, useState } = React;
    const API = "/api/engineering-progress";
    const pad = (n) => String(n).padStart(2, "0");
    function fmtTime(value) {
      if (!value) return "";
      const m = String(value).match(/(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
      if (!m) return String(value);
      return `${m[2]}-${m[3]} ${m[4]}:${m[5]}`;
    }
    function relTime(value) {
      if (!value) return "";
      const iso = String(value).replace(" ", "T");
      const at = new Date(iso);
      if (Number.isNaN(at.getTime())) return "";
      const diff = Date.now() - at.getTime();
      if (diff < 6e4) return "\u521A\u521A";
      if (diff < 36e5) return `${Math.floor(diff / 6e4)} \u5206\u949F\u524D`;
      if (diff < 864e5) return `${Math.floor(diff / 36e5)} \u5C0F\u65F6\u524D`;
      return `${Math.floor(diff / 864e5)} \u5929\u524D`;
    }
    function Panel() {
      const [status, setStatus] = useState(null);
      const [statusError, setStatusError] = useState("");
      const [loading, setLoading] = useState(true);
      const [frameKey, setFrameKey] = useState(0);
      const [frameState, setFrameState] = useState("loading");
      const timerRef = useRef(null);
      const baseUrl = status?.baseUrl || DEFAULT_BASE;
      const src = useMemo(() => baseUrl, [baseUrl]);
      const loadStatus = useCallback(async () => {
        setLoading(true);
        try {
          const response = await fetch(`${API}/status`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: "{}"
          });
          const text = await response.text().catch(() => "");
          let payload = {};
          try {
            payload = JSON.parse(text);
          } catch {
          }
          if (!response.ok) {
            throw new Error(payload?.error || `\u72B6\u6001\u63A5\u53E3 HTTP ${response.status}\uFF1A${text.slice(0, 120) || "\u65E0\u8FD4\u56DE\u5185\u5BB9"}`);
          }
          setStatus(payload);
          setStatusError("");
        } catch (error) {
          setStatusError(error.message);
        } finally {
          setLoading(false);
        }
      }, []);
      useEffect(() => {
        loadStatus();
      }, [loadStatus]);
      useEffect(() => {
        setFrameState("loading");
        window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(() => setFrameState((prev) => prev === "loading" ? "slow" : prev), SLOW_MS);
        return () => window.clearTimeout(timerRef.current);
      }, [src, frameKey]);
      const reload = () => {
        setFrameKey((n) => n + 1);
        loadStatus();
      };
      const probe = status?.probe;
      const dotState = statusError ? "bad" : loading && !status ? "wait" : probe?.ok ? "ok" : "warn";
      const chips = [];
      if (status) {
        chips.push({ label: "\u9879\u76EE", value: String(probe.projects || 0) });
        chips.push({ label: "\u8282\u70B9", value: String(probe.nodes || 0) });
        if (probe.changed) chips.push({ label: "\u53D8\u66F4", value: String(probe.changed), tone: "warn" });
        if (probe.finishedAt) chips.push({ label: "\u63A2\u6D4B", value: relTime(probe.finishedAt), title: probe.finishedAt });
        if (status.report?.date) chips.push({ label: "\u65E5\u62A5", value: status.report.date });
      }
      return h(
        "div",
        { className: "epRoot" },
        h(
          "header",
          { className: "epBar", "data-dsh-workbench-toolbar": "" },
          h(
            "div",
            { className: "epBrand" },
            h("span", { className: `epDot ${dotState}` }),
            h("strong", null, "\u5DE5\u7A0B\u8FDB\u5EA6\u8FFD\u8E2A"),
            h("span", { className: "epSub" }, "\u91D1\u9E70 PLAN \xB7 \u7B79\u5EFA/\u7269\u4E1A\u8282\u70B9")
          ),
          h(
            "div",
            { className: "epChips" },
            statusError ? h("span", { className: "epChip bad", title: statusError }, "\u72B6\u6001\u4E0D\u53EF\u7528") : null,
            chips.length ? chips.map((chip) => h("span", {
              className: `epChip ${chip.tone === "warn" ? "warn" : ""}`,
              key: chip.label,
              title: chip.title ?? ""
            }, h("em", null, chip.label), String(chip.value))) : statusError ? null : h("span", { className: "epChip muted" }, loading ? "\u8BFB\u53D6\u72B6\u6001\u2026" : "\u72B6\u6001\u4E0D\u53EF\u7528")
          ),
          h(
            "div",
            { className: "epActions" },
            statusError ? h("button", { className: "epBtn", type: "button", onClick: loadStatus, title: statusError }, "\u91CD\u8BD5") : null,
            h("button", { className: "epBtn", type: "button", onClick: reload, title: "\u91CD\u65B0\u52A0\u8F7D\u9875\u9762\u5E76\u5237\u65B0\u72B6\u6001" }, "\u91CD\u8F7D"),
            h("a", {
              className: "epBtn",
              href: baseUrl,
              target: "_blank",
              rel: "noreferrer",
              title: "\u5728\u6D4F\u89C8\u5668\u65B0\u7A97\u53E3\u6253\u5F00\u539F\u7CFB\u7EDF"
            }, "\u65B0\u7A97\u53E3\u6253\u5F00")
          )
        ),
        h(
          "div",
          { className: "epStage" },
          frameState !== "ready" ? h(
            "div",
            { className: `epLoading ${frameState}` },
            h("div", { className: "epSpinner" }),
            h("strong", null, frameState === "slow" ? "\u9875\u9762\u52A0\u8F7D\u8F83\u6162" : "\u6B63\u5728\u52A0\u8F7D\u5DE5\u7A0B\u8FDB\u5EA6\u7CFB\u7EDF"),
            h(
              "span",
              null,
              frameState === "slow" ? "\u5982\u679C\u4E00\u76F4\u505C\u5728\u8FD9\u91CC\uFF0C\u53EF\u80FD\u662F\u672C\u673A\u65E0\u6CD5\u8BBF\u95EE\u8BE5\u5730\u5740\uFF0C\u6216\u7CFB\u7EDF\u88AB\u6D4F\u89C8\u5668\u62E6\u622A\u3002" : baseUrl
            ),
            frameState === "slow" ? h(
              "div",
              { className: "epLoadingActions" },
              h("button", { className: "epBtn", type: "button", onClick: reload }, "\u91CD\u8BD5"),
              h("a", { className: "epBtn", href: baseUrl, target: "_blank", rel: "noreferrer" }, "\u65B0\u7A97\u53E3\u6253\u5F00")
            ) : null
          ) : null,
          h("iframe", {
            key: `${src}#${frameKey}`,
            className: `epFrame ${frameState === "ready" ? "ready" : ""}`,
            src,
            title: "\u91D1\u9E70\u5DE5\u7A0B\u8FDB\u5EA6\u7CFB\u7EDF",
            onLoad: () => setFrameState("ready"),
            referrerPolicy: "no-referrer-when-downgrade",
            allow: "clipboard-write; clipboard-read"
          })
        ),
        h(
          "footer",
          { className: "epFoot" },
          h("span", null, `\u4E0A\u6E38 ${baseUrl}`),
          status?.fetchedAt ? h("span", null, `\u72B6\u6001\u66F4\u65B0 ${relTime(status.fetchedAt) || ""}${status.cached ? "\uFF08\u7F13\u5B58\uFF09" : ""}`) : null,
          status?.probe?.mode ? h("span", null, `\u6A21\u5F0F ${status.probe.mode}`) : null,
          status?.probe?.error ? h("span", { className: "bad" }, `\u63A2\u6D4B\u5F02\u5E38\uFF1A${status.probe.error}`) : null
        )
      );
    }
    function apply(ctx) {
      ctx.effect(() => ctx.desktopWorkbenches.register({
        title: "\u5DE5\u7A0B\u8FDB\u5EA6\u8FFD\u8E2A",
        description: "\u6574\u9875\u5D4C\u5165\u91D1\u9E70\u5DE5\u7A0B\u8FDB\u5EA6\u7CFB\u7EDF\uFF0C\u9876\u680F\u663E\u793A\u5B9E\u65F6\u9879\u76EE/\u8282\u70B9\u72B6\u6001\u4E0E\u6982\u89C8\u3001\u6E05\u5355\u3001\u7518\u7279\u3001\u65E5\u62A5\u89C6\u56FE\u5207\u6362\u3002",
        repository: "https://github.com/Zcx-BaixiaoBai/ge-workbench-engineering-progress",
        customFrame: true,
        headerLayout: "compact"
      }, Panel), "engineering progress workbench registration");
    }
    return { apply, inject: ["desktopWorkbenches"] };
  }

  // src/styles.js
  var styles_default = `
.epRoot{
  --paper:#ffffff; --surface:#fbfaf7; --line:#e7e3d9; --line2:#d9d3c5;
  --ink:#131a2b; --ink2:#3d4657; --muted:#868d9a;
  --gold:#a8863c; --goldDeep:#7d6122; --goldTint:#f7f1e1; --goldLine:#e3d3ab;
  --red:#ad3a31; --green:#1f6b57;
  container-type:inline-size;
  display:flex; flex-direction:column; height:100%; min-height:0; overflow:hidden;
  background:var(--paper); color:var(--ink);
  font:14px/1.6 -apple-system,BlinkMacSystemFont,"PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;
  -webkit-font-smoothing:antialiased;
}
.epRoot *{box-sizing:border-box}
.epRoot h1,.epRoot h2,.epRoot h3,.epRoot h4,.epRoot p,.epRoot ul,.epRoot ol,.epRoot li{margin:0;padding:0}

/* \u9876\u680F */
.epBar{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:8px 14px;background:rgba(255,255,255,.95);
  border-bottom:1px solid var(--line);backdrop-filter:blur(10px);flex:none}
.epBrand{display:flex;align-items:center;gap:8px;min-width:0}
.epBrand strong{font-size:13.5px;font-weight:600;letter-spacing:.2px;white-space:nowrap}
.epSub{font-size:11px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.epDot{width:7px;height:7px;border-radius:50%;background:var(--muted);flex:none;box-shadow:0 0 0 3px rgba(134,141,154,.12)}
.epDot.ok{background:var(--green);box-shadow:0 0 0 3px rgba(31,107,87,.14)}
.epDot.warn{background:var(--gold);box-shadow:0 0 0 3px rgba(168,134,60,.16)}
.epDot.bad{background:var(--red);box-shadow:0 0 0 3px rgba(173,58,49,.14)}
.epDot.wait{background:var(--muted);animation:epPulse 1.4s ease-in-out infinite}
@keyframes epPulse{0%,100%{opacity:.45}50%{opacity:1}}

.epChips{display:flex;gap:6px;flex-wrap:wrap;min-width:0}
.epChip{display:inline-flex;align-items:center;gap:5px;height:24px;padding:0 9px;border-radius:999px;
  background:var(--surface);border:1px solid var(--line);font-size:11.5px;color:var(--ink2);white-space:nowrap}
.epChip em{font-style:normal;font-size:10.5px;color:var(--muted)}
.epChip.warn{background:var(--goldTint);border-color:var(--goldLine);color:var(--goldDeep)}
.epChip.warn em{color:var(--goldDeep);opacity:.8}
.epChip.muted{color:var(--muted)}
.epChip.bad{background:#fbeeec;border-color:#eccfcb;color:var(--red)}

.epActions{display:flex;gap:6px;flex:none;margin-left:auto}
.epBtn{height:28px;padding:0 11px;border-radius:8px;border:1px solid var(--line2);background:#fff;color:var(--ink);
  font-size:12px;font-family:inherit;cursor:pointer;display:inline-flex;align-items:center;text-decoration:none;white-space:nowrap}
.epBtn:hover{border-color:var(--gold);color:var(--goldDeep)}
.epBtn:active{transform:translateY(1px)}
.epBtn.ghost{background:var(--surface)}

/* \u63D0\u793A\u6761 */
.epNotice{display:flex;align-items:center;gap:10px;padding:7px 14px;background:#fbeeec;border-bottom:1px solid #eccfcb;
  color:var(--red);font-size:11.5px;flex:none}
.epNotice span{flex:1;min-width:0}

/* \u821E\u53F0 */
.epStage{position:relative;flex:1;min-height:0;background:#fff}
.epFrame{position:absolute;inset:0;width:100%;height:100%;border:0;background:#fff;opacity:0;transition:opacity .18s}
.epFrame.ready{opacity:1}

.epLoading{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:8px;background:#fff;text-align:center;padding:24px;z-index:2}
.epLoading strong{font-size:13.5px;font-weight:600}
.epLoading span{font-size:11.5px;color:var(--muted);max-width:52ch;line-height:1.7}
.epLoadingActions{display:flex;gap:8px;margin-top:6px}
.epSpinner{width:22px;height:22px;border-radius:50%;border:2px solid var(--line);border-top-color:var(--gold);
  animation:epSpin .8s linear infinite;margin-bottom:2px}
@keyframes epSpin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.epSpinner{animation:none}.epDot.wait{animation:none}}

/* \u9875\u811A */
.epFoot{display:flex;gap:14px;flex-wrap:wrap;padding:5px 14px;border-top:1px solid var(--line);
  font-size:10.5px;color:var(--muted);flex:none;background:#fff}
.epFoot .bad{color:var(--red)}

/* \u5BB9\u5668\u81EA\u9002\u5E94 */
@container (max-width: 900px){
  .epSub{display:none}
}
@container (max-width: 640px){
  .epBrand strong{font-size:13px}
  .epChip:nth-child(n+4){display:none}
  .epBar{padding:7px 10px;gap:8px}
  .epBtn{padding:0 9px}
}
`;

  // src/entry.jsx
  var STYLE_ID = "ge-workbench-engineering-progress-style";
  function installStyles() {
    if (typeof document === "undefined") return;
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = styles_default;
    document.head.appendChild(style);
  }
  window.__ModuleLoader__.load({
    id: "ge-workbench-engineering-progress",
    factory: (require2) => {
      const React = require2("react");
      installStyles();
      return createPanel(React);
    }
  });
})();
