(() => {
  // src/panel.jsx
  var API = "/api/task-assistant";
  var COPY = {
    title: "\u4EFB\u52A1\u52A9\u624B",
    refresh: "\u5237\u65B0",
    refreshing: "\u5237\u65B0\u4E2D\u2026",
    settings: "\u8FDE\u63A5\u8BBE\u7F6E",
    ai: "\u8BA9 AI \u5206\u6790",
    aiBusy: "\u6B63\u5728\u6253\u5F00\u5BF9\u8BDD\u2026",
    overview: "\u603B\u89C8",
    demoBanner: "\u6F14\u793A\u6570\u636E\uFF1A\u7528\u4E8E\u67E5\u770B\u754C\u9762\u4E0E\u56FE\u8868\uFF0C\u8FDE\u63A5\u771F\u5B9E\u7CFB\u7EDF\u540E\u81EA\u52A8\u5207\u6362\u3002",
    demoOff: "\u5173\u95ED\u6F14\u793A\u6570\u636E",
    noDataTitle: "\u8FD8\u6CA1\u6709\u8FDE\u63A5\u4EFB\u4F55\u4EFB\u52A1\u7CFB\u7EDF",
    noDataText: "\u8FDE\u63A5\u91D1\u9E70PLAN\u3001\u5DE1\u68C0\u7EF4\u4FDD\u3001\u91D1\u9E70\u5B89\u5168\u6216\u5DE5\u5355\u4EFB\u52A1\u4E2D\u7684\u4EFB\u610F\u4E00\u4E2A\uFF0C\u9996\u9875\u5C31\u4F1A\u663E\u793A\u672A\u5B8C\u6210\u3001\u5373\u5C06\u5230\u671F\u548C\u5DF2\u8FC7\u671F\u7684\u4EFB\u52A1\u3002\u4E5F\u53EF\u4EE5\u5148\u7528\u6F14\u793A\u6570\u636E\u770B\u4E00\u773C\u3002",
    connect: "\u53BB\u8FDE\u63A5\u7CFB\u7EDF",
    demoOn: "\u5148\u770B\u6F14\u793A\u6570\u636E",
    priorityTitle: "\u9700\u8981\u4F18\u5148\u5904\u7406",
    priorityHint: "\u6309\u8FC7\u671F\u65F6\u957F\u4ECE\u4E45\u5230\u8FD1",
    adviceTitle: "\u5904\u7406\u5EFA\u8BAE",
    categoryTitle: "\u672A\u5B8C\u6210\u5206\u7C7B",
    dueTitle: "\u5230\u671F\u5206\u5E03",
    dueHint: "\u672A\u5B8C\u6210 \xB7 \u6309\u5230\u671F\u65F6\u95F4 \xB7 \u4EC5\u8FD1\u534A\u5E74",
    compareTitle: "\u5404\u7CFB\u7EDF\u4EFB\u52A1\u7ED3\u6784",
    compareHint: "\u672A\u5B8C\u6210\u4E2D\u7684\u8FC7\u671F / \u5373\u5C06\u5230\u671F / \u5176\u4ED6",
    emptyRows: "\u5F53\u524D\u7B5B\u9009\u6761\u4EF6\u4E0B\u6CA1\u6709\u4EFB\u52A1\u3002",
    notConnected: "\u8FD9\u4E2A\u7CFB\u7EDF\u8FD8\u6CA1\u6709\u8FDE\u63A5\uFF0C\u6682\u65F6\u6CA1\u6709\u53EF\u5C55\u793A\u7684\u4EFB\u52A1\u3002",
    loadFailed: "\u8BFB\u53D6\u5931\u8D25",
    searchPlaceholder: "\u641C\u7D22\u4EFB\u52A1\u3001\u8D1F\u8D23\u4EBA\u3001\u5206\u7C7B\u2026",
    reset: "\u91CD\u7F6E",
    kpi: {
      unfinished: "\u672A\u5B8C\u6210",
      dueSoon: "72 \u5C0F\u65F6\u5185\u5230\u671F",
      overdue: "\u5DF2\u8FC7\u671F",
      completedToday: "\u4ECA\u65E5\u5B8C\u6210",
      rate: "\u5B8C\u6210\u7387"
    },
    stat: {
      total: "\u4EFB\u52A1\u603B\u6570",
      unfinished: "\u672A\u5B8C\u6210",
      dueSoon: "\u5373\u5C06\u5230\u671F",
      overdue: "\u5DF2\u8FC7\u671F",
      today: "\u4ECA\u65E5\u5B8C\u6210",
      noDue: "\u65E0\u5230\u671F\u65F6\u95F4"
    },
    status: {
      all: "\u5168\u90E8",
      unfinished: "\u672A\u5B8C\u6210",
      dueSoon: "\u5373\u5C06\u5230\u671F",
      overdue: "\u5DF2\u8FC7\u671F",
      completed: "\u5DF2\u5B8C\u6210",
      noDue: "\u65E0\u65F6\u9650"
    },
    table: { task: "\u4EFB\u52A1", category: "\u5206\u7C7B", owner: "\u8D1F\u8D23\u4EBA", due: "\u5230\u671F", state: "\u72B6\u6001" },
    systemStates: { live: "\u5DF2\u8FDE\u63A5", off: "\u672A\u8FDE\u63A5", demo: "\u6F14\u793A\u6570\u636E", error: "\u53D6\u6570\u5931\u8D25" },
    settingsIntro: "\u56DB\u4E2A\u7CFB\u7EDF\u5404\u586B\u4E00\u6B21\u8D26\u53F7\u5BC6\u7801\uFF0C\u53EA\u4FDD\u5B58\u5728\u672C\u673A\u3002\u5DE5\u4F5C\u53F0\u53EA\u8BFB\u4EFB\u52A1\uFF0C\u4E0D\u4F1A\u6539\u52A8\u539F\u7CFB\u7EDF\u91CC\u7684\u4EFB\u4F55\u6570\u636E\u3002",
    settingsDemo: "\u4F7F\u7528\u6F14\u793A\u6570\u636E\uFF08\u4E0D\u8FDE\u63A5\u771F\u5B9E\u7CFB\u7EDF\uFF09",
    username: "\u8D26\u53F7",
    password: "\u5BC6\u7801",
    modelTitle: "\u9A8C\u8BC1\u7801\u8BC6\u522B\u6A21\u578B",
    modelHint: "\u5DE5\u5355\u7CFB\u7EDF\u767B\u5F55\u65F6\u4F1A\u51FA\u73B0\u7B97\u5F0F\u9A8C\u8BC1\u7801\uFF0C\u7528\u8FD9\u91CC\u7684\u591A\u6A21\u6001\u6A21\u578B\u81EA\u52A8\u8BC6\u522B\u3002\u586B\u4EFB\u610F OpenAI \u517C\u5BB9\u7684\u89C6\u89C9\u63A5\u53E3\u5373\u53EF\uFF0C\u4F8B\u5982 https://dashscope.aliyuncs.com/compatible-mode/v1 \u3002",
    modelBase: "\u63A5\u53E3\u5730\u5740",
    modelKey: "API Key",
    modelName: "\u6A21\u578B\u540D",
    modelSave: "\u4FDD\u5B58\u6A21\u578B\u8BBE\u7F6E",
    modelSaved: "\u6A21\u578B\u8BBE\u7F6E\u5DF2\u4FDD\u5B58",
    modelSaving: "\u4FDD\u5B58\u4E2D\u2026",
    modelMissing: "\u5DE5\u5355\u7CFB\u7EDF\u9700\u8981\u5148\u914D\u7F6E\u8FD9\u4E2A\u6A21\u578B",
    connectBtn: "\u8FDE\u63A5",
    reconnectBtn: "\u91CD\u65B0\u8FDE\u63A5",
    disconnectBtn: "\u65AD\u5F00",
    connecting: "\u8FDE\u63A5\u4E2D\u2026",
    disconnected: "\u5DF2\u65AD\u5F00",
    saved: "\u8FDE\u63A5\u5DF2\u4FDD\u5B58",
    pager: { prev: "\u4E0A\u4E00\u9875", next: "\u4E0B\u4E00\u9875", page: "\u7B2C", of: "/", unit: "\u9875", total: "\u6761" }
  };
  function detectDark() {
    if (typeof document === "undefined") return false;
    const root = document.documentElement;
    const theme = root.getAttribute("data-theme");
    if (theme === "dark") return true;
    if (theme === "light") return false;
    if (root.classList.contains("dark")) return true;
    if (root.classList.contains("light")) return false;
    return typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)")?.matches === true;
  }
  function useDarkMode(ReactImpl) {
    const [dark, setDark] = ReactImpl.useState(detectDark);
    ReactImpl.useEffect(() => {
      const observer = new MutationObserver(() => setDark(detectDark()));
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme"] });
      const media = window.matchMedia?.("(prefers-color-scheme: dark)");
      const onChange = () => setDark(detectDark());
      media?.addEventListener?.("change", onChange);
      return () => {
        observer.disconnect();
        media?.removeEventListener?.("change", onChange);
      };
    }, [ReactImpl]);
    return dark;
  }
  function formatDay(iso) {
    if (!iso) return "\u2014";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "\u2014";
    return `${date.getMonth() + 1}\u6708${date.getDate()}\u65E5`;
  }
  function formatClock(iso) {
    if (!iso) return "\u2014";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "\u2014";
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  }
  function dueText(item) {
    if (!item.dueAt) return "\u672A\u8BBE\u65F6\u9650";
    if (item.status === "completed") return formatDay(item.dueAt);
    if (item.overdue) return `\u5DF2\u8FC7\u671F ${Math.max(1, item.daysLate)} \u5929`;
    if (item.dueInDays === 0) return "\u4ECA\u5929\u5230\u671F";
    if (item.dueInDays === 1) return "\u660E\u5929\u5230\u671F";
    return `${formatDay(item.dueAt)}\u5230\u671F`;
  }
  function dueTone(item) {
    if (item.status !== "unfinished") return "";
    if (item.overdue) return " taRowDue--risk";
    if (item.dueSoon) return " taRowDue--warn";
    return "";
  }
  function stateTone(item) {
    if (item.status === "completed") return "ok";
    if (item.status === "voided") return "muted";
    if (item.overdue) return "risk";
    if (item.dueSoon) return "warn";
    return "muted";
  }
  function stateText(item) {
    if (item.status === "completed") return item.statusLabel || "\u5DF2\u5B8C\u6210";
    if (item.status === "voided") return "\u5DF2\u4F5C\u5E9F";
    if (item.overdue) return "\u5DF2\u8FC7\u671F";
    if (item.dueSoon) return "\u5373\u5C06\u5230\u671F";
    return item.statusLabel || "\u8FDB\u884C\u4E2D";
  }
  function systemTitle(overview, systemId) {
    return overview?.systems?.find((system) => system.id === systemId)?.title || systemId;
  }
  function buildPrompt(overview, viewTitle, rows) {
    if (!overview) return "";
    const lines = [
      "\u8BF7\u5E2E\u6211\u5206\u6790\u300C\u4EFB\u52A1\u52A9\u624B\u300D\u5F53\u524D\u7684\u4EFB\u52A1\u60C5\u51B5\uFF0C\u5E76\u7ED9\u51FA\u4ECA\u5929\u7684\u5904\u7406\u5EFA\u8BAE\u3002",
      "",
      `\u6C47\u603B\uFF1A\u672A\u5B8C\u6210 ${overview.totals.unfinished} \u6761\uFF0C72 \u5C0F\u65F6\u5185\u5230\u671F ${overview.totals.dueSoon} \u6761\uFF0C\u5DF2\u8FC7\u671F ${overview.totals.overdue} \u6761\uFF0C\u4ECA\u65E5\u5B8C\u6210 ${overview.totals.completedToday} \u6761\u3002`
    ];
    if (overview.demo) lines.push("\u6CE8\u610F\uFF1A\u4EE5\u4E0B\u6570\u5B57\u6765\u81EA\u6F14\u793A\u6570\u636E\uFF0C\u4E0D\u662F\u771F\u5B9E\u4E1A\u52A1\u6570\u636E\u3002");
    for (const system of overview.systems) {
      if (!system.connected && !system.error) continue;
      lines.push(`- ${system.title}\uFF1A\u672A\u5B8C\u6210 ${system.metrics.unfinished}\uFF0C\u5373\u5C06\u5230\u671F ${system.metrics.dueSoon}\uFF0C\u5DF2\u8FC7\u671F ${system.metrics.overdue}${system.error ? `\uFF08\u53D6\u6570\u5931\u8D25\uFF1A${system.error}\uFF09` : ""}`);
    }
    if (Array.isArray(rows) && rows.length) {
      lines.push("", `\u6211\u6B63\u5728\u770B\u300C${viewTitle}\u300D\uFF0C\u5176\u4E2D\u8F83\u7D27\u6025\u7684\u4EFB\u52A1\uFF1A`);
      for (const row of rows.slice(0, 8)) {
        lines.push(`- ${row.title}\uFF08${row.subtitle || row.category || "\u672A\u6807\u6CE8"}\uFF0C${dueText(row)}\uFF09`);
      }
    } else if (overview.priority?.length) {
      lines.push("", "\u6700\u7D27\u6025\u7684\u4EFB\u52A1\uFF1A");
      for (const row of overview.priority.slice(0, 8)) {
        lines.push(`- ${row.title}\uFF08${dueText(row)}\uFF0C\u8D1F\u8D23\u4EBA ${row.owner || "\u672A\u6307\u6D3E"}\uFF09`);
      }
    }
    lines.push("", "\u8BF7\u6307\u51FA\u6700\u9700\u8981\u5148\u5904\u7406\u7684\u4E09\u4EF6\u4E8B\u5E76\u8BF4\u660E\u7406\u7531\uFF1B\u5982\u679C\u6709\u660E\u663E\u7684\u79EF\u538B\u6216\u5206\u5DE5\u95EE\u9898\uFF0C\u4E5F\u8BF7\u6307\u51FA\u3002");
    return lines.join("\n");
  }
  function createPanel(ReactImpl) {
    const h = ReactImpl.createElement;
    const { useCallback, useEffect, useMemo, useState } = ReactImpl;
    function BusinessPanel({ service, conversation, host }) {
      const dark = useDarkMode(ReactImpl);
      const [status, setStatus] = useState(null);
      const [overview, setOverview] = useState(null);
      const [view, setView] = useState("overview");
      const [loading, setLoading] = useState(true);
      const [error, setError] = useState("");
      const [notice, setNotice] = useState(null);
      const [busy, setBusy] = useState(false);
      const [aiBusy, setAiBusy] = useState(false);
      const [chatOpen, setChatOpen] = useState(false);
      const [systemData, setSystemData] = useState(null);
      const [systemLoading, setSystemLoading] = useState(false);
      const [filters, setFilters] = useState({ status: "all", category: "", q: "", from: "", to: "", page: 1 });
      const [search, setSearch] = useState("");
      const [forms, setForms] = useState({});
      const [pwdEditing, setPwdEditing] = useState({});
      const [keyEditing, setKeyEditing] = useState(false);
      const [projectOpen, setProjectOpen] = useState(false);
      const [projectQuery, setProjectQuery] = useState("");
      const [projectDraft, setProjectDraft] = useState([]);
      const [scopeVersion, setScopeVersion] = useState(0);
      const [modelForm, setModelForm] = useState({ apiBase: "", apiKey: "", model: "" });
      const [modelBusy, setModelBusy] = useState(false);
      const [formError, setFormError] = useState({});
      const [formBusy, setFormBusy] = useState({});
      const request = useCallback(async (path, options = {}) => {
        const response = await fetch(path, { credentials: "same-origin", cache: "no-store", ...options });
        let data = {};
        try {
          data = await response.json();
        } catch {
          data = {};
        }
        if (!response.ok) throw new Error(data?.error || `\u8BF7\u6C42\u5931\u8D25\uFF08HTTP ${response.status}\uFF09`);
        return data;
      }, []);
      const loadAll = useCallback(async () => {
        setError("");
        const [nextStatus, nextOverview] = await Promise.all([
          request(`${API}/status`),
          request(`${API}/overview`)
        ]);
        setStatus(nextStatus);
        setOverview(nextOverview);
      }, [request]);
      useEffect(() => {
        let cancelled = false;
        setLoading(true);
        loadAll().catch((loadError) => {
          if (!cancelled) setError(loadError instanceof Error ? loadError.message : String(loadError));
        }).finally(() => {
          if (!cancelled) setLoading(false);
        });
        return () => {
          cancelled = true;
        };
      }, [loadAll]);
      useEffect(() => {
        if (!status?.model) return;
        setModelForm((current) => {
          if (current.apiBase || current.apiKey || current.model) return current;
          return { apiBase: status.model.apiBase || "", apiKey: "", model: status.model.model || "" };
        });
      }, [status]);
      useEffect(() => {
        const timer = setTimeout(() => setFilters((current) => ({ ...current, q: search, page: 1 })), 260);
        return () => clearTimeout(timer);
      }, [search]);
      const isSystemView = view !== "overview" && view !== "settings";
      useEffect(() => {
        if (!isSystemView) return void 0;
        let cancelled = false;
        setSystemLoading(true);
        const params = new URLSearchParams({
          system: view,
          status: filters.status,
          category: filters.category,
          q: filters.q,
          from: filters.from,
          to: filters.to,
          page: String(filters.page),
          pageSize: "20"
        });
        request(`${API}/system?${params.toString()}`).then((data) => {
          if (!cancelled) setSystemData(data);
        }).catch((loadError) => {
          if (!cancelled) setError(loadError instanceof Error ? loadError.message : String(loadError));
        }).finally(() => {
          if (!cancelled) setSystemLoading(false);
        });
        return () => {
          cancelled = true;
        };
      }, [view, filters, isSystemView, request, scopeVersion]);
      const goSystem = useCallback((systemId) => {
        setFilters({ status: "all", category: "", q: "", from: "", to: "", page: 1 });
        setSearch("");
        setSystemData(null);
        setView(systemId);
      }, []);
      const refresh = useCallback(async () => {
        setBusy(true);
        setNotice(null);
        try {
          const data = await request(`${API}/refresh`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: "{}"
          });
          if (data.overview) setOverview(data.overview);
          await loadAll();
          if (Array.isArray(data.errors) && data.errors.length) {
            setNotice({ tone: "error", text: `${data.errors.length} \u4E2A\u7CFB\u7EDF\u8FD9\u6B21\u6CA1\u6709\u53D6\u5230\u6570\u636E\uFF1A${data.errors[0].message}` });
          } else {
            setNotice({ tone: "ok", text: "\u5DF2\u5237\u65B0\u4EFB\u52A1\u6570\u636E\u3002" });
          }
        } catch (refreshError) {
          setNotice({ tone: "error", text: refreshError instanceof Error ? refreshError.message : String(refreshError) });
        } finally {
          setBusy(false);
        }
      }, [loadAll, request]);
      const toggleDemo = useCallback(async (enabled) => {
        setBusy(true);
        try {
          await request(`${API}/demo`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ enabled })
          });
          await loadAll();
          setNotice({ tone: "ok", text: enabled ? "\u5DF2\u5207\u6362\u5230\u6F14\u793A\u6570\u636E\u3002" : "\u5DF2\u5173\u95ED\u6F14\u793A\u6570\u636E\u3002" });
        } catch (demoError) {
          setNotice({ tone: "error", text: demoError instanceof Error ? demoError.message : String(demoError) });
        } finally {
          setBusy(false);
        }
      }, [loadAll, request]);
      const saveModel = useCallback(async () => {
        setModelBusy(true);
        setFormError({});
        try {
          await request(`${API}/model`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(modelForm)
          });
          setNotice({ tone: "ok", text: COPY.modelSaved });
          await loadAll();
        } catch (modelError) {
          setNotice({ tone: "error", text: modelError instanceof Error ? modelError.message : String(modelError) });
        } finally {
          setModelBusy(false);
        }
      }, [loadAll, modelForm, request]);
      const openProjectPicker = useCallback(() => {
        setProjectDraft(Array.isArray(overview?.selectedProjects) ? overview.selectedProjects : []);
        setProjectQuery("");
        setProjectOpen(true);
      }, [overview]);
      const saveProjects = useCallback(async (list) => {
        setBusy(true);
        try {
          await request(`${API}/projects`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ projects: list })
          });
          setProjectOpen(false);
          setScopeVersion((value) => value + 1);
          await loadAll();
          setNotice({ tone: "ok", text: list.length ? `\u5DF2\u5207\u6362\u5230 ${list.length} \u4E2A\u9879\u76EE` : "\u5DF2\u6062\u590D\u4E3A\u5168\u90E8\u9879\u76EE" });
        } catch (projectError) {
          setNotice({ tone: "error", text: projectError instanceof Error ? projectError.message : String(projectError) });
        } finally {
          setBusy(false);
        }
      }, [loadAll, request]);
      const updateForm = useCallback((systemId, key, value) => {
        setForms((current) => ({ ...current, [systemId]: { ...current[systemId] || {}, [key]: value } }));
      }, []);
      const connect = useCallback(async (systemId) => {
        const form = forms[systemId] || {};
        const meta = status?.systems?.find((item) => item.id === systemId);
        setFormBusy((current) => ({ ...current, [systemId]: true }));
        setFormError((current) => ({ ...current, [systemId]: "" }));
        try {
          const data = await request(`${API}/connect`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              system: systemId,
              username: form.username || "",
              password: form.password || ""
            })
          });
          if (!data.ok) {
            setFormError((current) => ({ ...current, [systemId]: data.error || "\u8FDE\u63A5\u5931\u8D25" }));
            return;
          }
          setNotice({ tone: "ok", text: `${meta?.title || "\u7CFB\u7EDF"}${COPY.saved}` });
          setForms((current) => ({ ...current, [systemId]: { ...current[systemId] || {}, password: "" } }));
          setPwdEditing((current) => ({ ...current, [systemId]: false }));
          await loadAll();
        } catch (connectError) {
          setFormError((current) => ({ ...current, [systemId]: connectError instanceof Error ? connectError.message : String(connectError) }));
        } finally {
          setFormBusy((current) => ({ ...current, [systemId]: false }));
        }
      }, [forms, loadAll, request, status]);
      const disconnect = useCallback(async (systemId) => {
        setFormBusy((current) => ({ ...current, [systemId]: true }));
        try {
          await request(`${API}/disconnect`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ system: systemId })
          });
          setNotice({ tone: "ok", text: `${COPY.disconnected}\uFF1A${systemTitle(overview, systemId)}` });
          await loadAll();
        } catch (disconnectError) {
          setFormError((current) => ({ ...current, [systemId]: disconnectError instanceof Error ? disconnectError.message : String(disconnectError) }));
        } finally {
          setFormBusy((current) => ({ ...current, [systemId]: false }));
        }
      }, [loadAll, overview, request]);
      const startAi = useCallback(async () => {
        const workbenches = host?.workbenches;
        if (!workbenches?.newSession && !workbenches?.newWorkspaceSession) {
          setChatOpen(true);
          return;
        }
        setAiBusy(true);
        setNotice(null);
        try {
          const workspace = workbenches.defaultWorkspace?.();
          const creation = workspace ? workbenches.newSession(workspace.workspaceId) : workbenches.newWorkspaceSession();
          const sessionId = await creation;
          if (!sessionId) {
            setNotice({ tone: "error", text: "\u5BBF\u4E3B\u6CA1\u6709\u8FD4\u56DE\u4F1A\u8BDD\uFF0C\u8BF7\u5148\u5728\u5DE6\u4FA7\u9009\u62E9\u6216\u65B0\u5EFA\u4E00\u4E2A\u5DE5\u4F5C\u533A\u3002" });
            return;
          }
          setChatOpen(true);
        } catch (aiError) {
          setChatOpen(true);
          setNotice({ tone: "error", text: aiError instanceof Error ? aiError.message : String(aiError) });
        } finally {
          setAiBusy(false);
        }
      }, [host]);
      const copyPrompt = useCallback(async () => {
        const prompt = buildPrompt(
          overview,
          isSystemView ? systemData?.system?.title || "\u4EFB\u52A1" : "\u5168\u90E8\u7CFB\u7EDF",
          isSystemView ? systemData?.rows : null
        );
        try {
          await navigator.clipboard.writeText(prompt);
          setNotice({ tone: "ok", text: "\u5F53\u524D\u6C47\u603B\u5DF2\u590D\u5236\uFF0C\u53EF\u76F4\u63A5\u7C98\u8D34\u7ED9 AI\u3002" });
        } catch {
          setNotice({ tone: "error", text: "\u6D4F\u89C8\u5668\u6CA1\u5141\u8BB8\u5199\u526A\u8D34\u677F\uFF0C\u8BF7\u624B\u52A8\u9009\u62E9\u4F1A\u8BDD\u540E\u8BA9\u6211\u6765\u5206\u6790\u3002" });
        }
      }, [isSystemView, overview, systemData]);
      const tabs = useMemo(() => {
        const items = [{ id: "overview", title: COPY.overview, count: overview?.totals?.unfinished }];
        for (const system of overview?.systems ?? []) {
          items.push({ id: system.id, title: system.title, count: system.metrics?.unfinished });
        }
        items.push({ id: "settings", title: COPY.settings });
        return items;
      }, [overview]);
      const allDisconnected = overview && !overview.demo && overview.systems.every((system) => !system.connected);
      const toolbar = h(
        "div",
        { className: "taBar", "data-dsh-workbench-toolbar": "" },
        h(
          "div",
          { className: "taBrand" },
          h("span", { className: "taBrandMark", "aria-hidden": "true" }),
          h("span", null, COPY.title)
        ),
        h(
          "div",
          { className: "taNav", role: "tablist", "aria-label": "\u4EFB\u52A1\u89C6\u56FE" },
          tabs.map((tab) => h("button", {
            key: tab.id,
            type: "button",
            role: "tab",
            className: "taTab",
            "aria-selected": view === tab.id,
            onClick: () => {
              setProjectOpen(false);
              if (tab.id === "overview" || tab.id === "settings") {
                setView(tab.id);
                setSystemData(null);
                return;
              }
              goSystem(tab.id);
            }
          }, tab.title, typeof tab.count === "number" && tab.count > 0 ? h("span", { className: "taTabCount" }, tab.count) : null))
        ),
        h(
          "div",
          { className: "taBarRight" },
          overview?.projects?.length ? h(
            "div",
            { className: "taScopeWrap" },
            h("button", {
              type: "button",
              className: "taBtn taBtn--sm",
              onClick: () => projectOpen ? setProjectOpen(false) : openProjectPicker(),
              "aria-expanded": projectOpen,
              title: "\u9009\u62E9\u8981\u67E5\u770B\u7684\u9879\u76EE"
            }, `\u9879\u76EE ${Array.isArray(overview.selectedProjects) && overview.selectedProjects.length ? `${overview.selectedProjects.length}/${overview.projects.length}` : "\u5168\u90E8"}`),
            projectOpen ? h(
              "div",
              { className: "taPop", role: "dialog", "aria-label": "\u9009\u62E9\u9879\u76EE" },
              h(
                "div",
                { className: "taPopHead" },
                h("input", {
                  className: "taInput",
                  type: "search",
                  placeholder: "\u641C\u7D22\u9879\u76EE\u540D",
                  value: projectQuery,
                  onChange: (event) => setProjectQuery(event.target.value),
                  autoFocus: true
                })
              ),
              h(
                "div",
                { className: "taPopList" },
                overview.projects.filter((entry) => !projectQuery || entry.name.includes(projectQuery)).map((entry) => h(
                  "label",
                  { className: "taPopRow", key: entry.name },
                  h("input", {
                    type: "checkbox",
                    checked: projectDraft.includes(entry.name),
                    onChange: (event) => setProjectDraft((current) => event.target.checked ? [...current, entry.name] : current.filter((name) => name !== entry.name))
                  }),
                  h("span", { className: "taPopName", title: entry.name }, entry.name),
                  h("span", { className: "taPopCount" }, String(entry.count))
                ))
              ),
              h(
                "div",
                { className: "taPopFoot" },
                h("button", { type: "button", className: "taBtn taBtn--sm taBtn--ghost", onClick: () => setProjectDraft(overview.projects.map((entry) => entry.name)) }, "\u5168\u9009"),
                h("button", { type: "button", className: "taBtn taBtn--sm taBtn--ghost", onClick: () => setProjectDraft([]) }, "\u6E05\u7A7A"),
                h("span", { style: { flex: "1 1 auto" } }),
                h("button", { type: "button", className: "taBtn taBtn--sm taBtn--primary", onClick: () => saveProjects(projectDraft), disabled: busy }, "\u5E94\u7528")
              )
            ) : null
          ) : null,
          h("span", { className: "taStamp" }, overview?.updatedAt ? `${formatDay(overview.updatedAt)} ${formatClock(overview.updatedAt)} \u66F4\u65B0` : "\u5C1A\u672A\u53D6\u6570"),
          h("button", { type: "button", className: "taBtn taBtn--sm", onClick: refresh, disabled: busy, title: "\u91CD\u65B0\u62C9\u53D6\u56DB\u4E2A\u7CFB\u7EDF\u7684\u4EFB\u52A1" }, busy ? COPY.refreshing : COPY.refresh),
          h("button", { type: "button", className: "taBtn taBtn--sm", onClick: startAi, disabled: aiBusy }, aiBusy ? COPY.aiBusy : COPY.ai),
          chatOpen ? h("button", { type: "button", className: "taBtn taBtn--sm taBtn--ghost", onClick: () => setChatOpen(false) }, "\u6536\u8D77\u5BF9\u8BDD") : null
        )
      );
      const notices = h(
        "div",
        null,
        error ? h("div", { className: "taNotice taNotice--error", role: "alert" }, `${COPY.loadFailed}\uFF1A${error}`) : null,
        notice ? h("div", { className: notice.tone === "error" ? "taNotice taNotice--error" : "taNotice", role: "status" }, notice.text) : null
      );
      const renderOverview = () => {
        if (loading && !overview) {
          return h("div", { className: "taEmpty" }, h("div", { className: "taEmptyTitle" }, "\u6B63\u5728\u8BFB\u53D6\u4EFB\u52A1\u2026"));
        }
        if (!overview) {
          return h(
            "div",
            { className: "taEmpty" },
            h("div", { className: "taEmptyTitle" }, COPY.noDataTitle),
            h("div", { className: "taEmptyText" }, COPY.noDataText),
            h(
              "div",
              { className: "taEmptyActions" },
              h("button", { type: "button", className: "taBtn taBtn--primary", onClick: () => setView("settings") }, COPY.connect),
              h("button", { type: "button", className: "taBtn", onClick: () => toggleDemo(true), disabled: busy }, COPY.demoOn)
            )
          );
        }
        const totals = overview.totals;
        const rate = overview.completion?.rate ?? 0;
        const kpis = h(
          "div",
          { className: "taKpis" },
          h(
            "div",
            { className: "taKpi" },
            h("div", { className: "taKpiLabel" }, COPY.kpi.unfinished),
            h("div", { className: "taKpiValue" }, String(totals.unfinished)),
            h("div", { className: "taKpiSub" }, `\u5171 ${totals.total} \u6761\u4EFB\u52A1`)
          ),
          h(
            "div",
            { className: "taKpi" },
            h("div", { className: "taKpiLabel" }, COPY.kpi.dueSoon),
            h("div", { className: `taKpiValue${totals.dueSoon ? " taKpiValue--warn" : ""}` }, String(totals.dueSoon)),
            h("div", { className: "taKpiSub" }, `\u4ECA\u65E5\u5230\u671F ${totals.dueToday} \u6761`)
          ),
          h(
            "div",
            { className: "taKpi" },
            h("div", { className: "taKpiLabel" }, COPY.kpi.overdue),
            h("div", { className: `taKpiValue${totals.overdue ? " taKpiValue--risk" : ""}` }, String(totals.overdue)),
            h("div", { className: "taKpiSub" }, totals.overdue ? "\u9700\u8981\u4ECA\u5929\u5904\u7406" : "\u6CA1\u6709\u8FC7\u671F\u4EFB\u52A1")
          ),
          h(
            "div",
            { className: "taKpi" },
            h("div", { className: "taKpiLabel" }, COPY.kpi.completedToday),
            h("div", { className: "taKpiValue" }, String(totals.completedToday)),
            h("div", { className: "taKpiSub" }, `\u7D2F\u8BA1\u5B8C\u6210 ${totals.completed} \u6761`)
          ),
          h(
            "div",
            { className: "taKpi" },
            h("div", { className: "taKpiLabel" }, COPY.kpi.rate),
            h("div", { className: "taKpiValue" }, `${Math.round(rate * 100)}%`),
            h("div", { className: "taKpiSub" }, `\u672A\u5B8C\u6210 ${totals.unfinished} \u6761`)
          )
        );
        const distribution = overview.dueDistribution ?? [];
        const upcoming = distribution;
        const maxCount = Math.max(1, ...distribution.map((bucket) => bucket.count));
        const bars = h(
          "section",
          { className: "taPanel taPanel--chart", "aria-label": COPY.dueTitle },
          h(
            "div",
            { className: "taPanelHead" },
            h("span", { className: "taPanelTitle" }, COPY.dueTitle),
            h("span", { className: "taPanelHint" }, COPY.dueHint)
          ),
          h(
            "div",
            { className: "taPanelBody taPanelBody--chart" },
            h(
              "div",
              { className: "taBarsNote" },
              h("span", null, "\u67F1\u9AD8\u6309\u5E73\u65B9\u6839\u7F29\u653E\uFF0C\u517C\u987E\u79EF\u538B\u91CF\u548C\u8FD1\u671F\u5230\u671F")
            ),
            h(
              "div",
              { className: "taBars" },
              h(
                "svg",
                {
                  className: "taBarsSvg",
                  viewBox: `0 0 ${Math.max(1, upcoming.length) * 10} 100`,
                  preserveAspectRatio: "none",
                  role: "img",
                  "aria-label": "\u672A\u5B8C\u6210\u4EFB\u52A1\u6309\u5230\u671F\u65F6\u95F4\u7684\u6570\u91CF\u5206\u5E03"
                },
                upcoming.map((bucket, index) => {
                  const pct = bucket.count === 0 ? 0 : Math.max(3, Math.round(Math.sqrt(bucket.count / maxCount) * 100));
                  return h("rect", {
                    key: bucket.key,
                    x: index * 10 + 2.7,
                    y: 100 - pct,
                    width: 4.6,
                    height: pct,
                    className: `taBarRect${bucket.tone === "risk" ? " taBarRect--risk" : bucket.tone === "today" ? " taBarRect--today" : bucket.tone === "warn" ? " taBarRect--warn" : ""}`,
                    style: { opacity: Math.max(0.32, 1 - index * 0.09) }
                  }, h("title", null, `${bucket.label}\uFF1A${bucket.count} \u6761`));
                })
              )
            ),
            h(
              "div",
              { className: "taBarsAxis" },
              upcoming.map((bucket) => h(
                "span",
                { key: bucket.key },
                h("span", { className: "taBarsAxisLabel" }, bucket.label),
                h("span", { className: "taBarsAxisCount" }, String(bucket.count))
              ))
            )
          )
        );
        const compareRows = overview.systems.map((system) => {
          const metrics = system.metrics;
          const open = Math.max(0, metrics.unfinished);
          const overduePct = open ? metrics.overdue / open * 100 : 0;
          const soonPct = open ? metrics.dueSoon / open * 100 : 0;
          return h(
            "button",
            {
              key: system.id,
              type: "button",
              className: "taCompareRow",
              onClick: () => goSystem(system.id),
              "aria-label": `\u6253\u5F00${system.title}\u7684\u4EFB\u52A1\u660E\u7EC6`
            },
            h("span", { className: "taCompareName" }, system.title),
            h(
              "div",
              { className: "taCompareTrack" },
              metrics.overdue ? h("div", { className: "taCompareSeg taCompareSeg--overdue", style: { width: `${overduePct}%` }, title: `\u5DF2\u8FC7\u671F ${metrics.overdue}` }) : null,
              metrics.dueSoon ? h("div", { className: "taCompareSeg taCompareSeg--soon", style: { width: `${soonPct}%` }, title: `\u5373\u5C06\u5230\u671F ${metrics.dueSoon}` }) : null,
              h("div", { className: "taCompareSeg taCompareSeg--open", style: { width: `${Math.max(0, 100 - overduePct - soonPct)}%` }, title: `\u5176\u4ED6\u672A\u5B8C\u6210 ${Math.max(0, open - metrics.overdue - metrics.dueSoon)}` })
            ),
            h(
              "span",
              { className: "taCompareNums" },
              "\u672A\u5B8C\u6210 ",
              h("b", null, String(open)),
              " \xB7 \u8FC7\u671F ",
              h("b", null, String(metrics.overdue)),
              " \xB7 \u5230\u671F ",
              h("b", null, String(metrics.dueSoon))
            )
          );
        });
        const compare = h(
          "section",
          { className: "taPanel", "aria-label": COPY.compareTitle },
          h(
            "div",
            { className: "taPanelHead" },
            h("span", { className: "taPanelTitle" }, COPY.compareTitle),
            h("span", { className: "taPanelHint" }, COPY.compareHint)
          ),
          h(
            "div",
            { className: "taPanelBody" },
            h("div", { className: "taCompare" }, compareRows),
            h(
              "div",
              { className: "taLegend" },
              h("span", null, h("span", { className: "taLegendDot", style: { background: "var(--ta-gold)" } }), "\u5DF2\u8FC7\u671F"),
              h("span", null, h("span", { className: "taLegendDot", style: { background: "var(--ta-gold)", opacity: 0.62 } }), "72 \u5C0F\u65F6\u5185\u5230\u671F"),
              h("span", null, h("span", { className: "taLegendDot", style: { background: "var(--ta-gold)", opacity: 0.28 } }), "\u5176\u4ED6\u672A\u5B8C\u6210")
            )
          )
        );
        const priorityRows = overview.priority.length ? overview.priority.slice(0, 10).map((item) => h(
          "div",
          { className: "taRow", key: item.id },
          h("div", { className: "taRowTag" }, h("span", { className: "taTag" }, systemTitle(overview, item.system))),
          h(
            "div",
            { className: "taRowTitle" },
            h("span", { className: "taRowName", title: item.title }, item.title),
            h("div", { className: "taRowMeta" }, item.subtitle || item.category || "\u2014")
          ),
          h("div", { className: `taRowDue${dueTone(item)}` }, dueText(item)),
          h("div", { className: "taRowOwner" }, item.owner || "\u672A\u6307\u6D3E")
        )) : h("div", { style: { padding: "22px 12px", textAlign: "center", color: "var(--ta-muted)" } }, "\u6CA1\u6709\u5F85\u5904\u7406\u7684\u4EFB\u52A1\u3002");
        const priority = h(
          "section",
          { className: "taPanel", "aria-label": COPY.priorityTitle },
          h(
            "div",
            { className: "taPanelHead" },
            h("span", { className: "taPanelTitle" }, COPY.priorityTitle),
            h("span", { className: "taPanelHint" }, COPY.priorityHint)
          ),
          h("div", { className: "taRows" }, priorityRows)
        );
        const advice = h(
          "section",
          { className: "taPanel", "aria-label": COPY.adviceTitle },
          h(
            "div",
            { className: "taPanelHead" },
            h("span", { className: "taPanelTitle" }, COPY.adviceTitle),
            h("span", { className: "taPanelHint" }, "\u6309\u5F53\u524D\u6570\u636E\u81EA\u52A8\u751F\u6210")
          ),
          h(
            "div",
            { className: "taAdvice" },
            overview.advice.map((entry, index) => h(
              "div",
              {
                key: `advice-${index}`,
                className: `taAdviceItem${entry.tone === "risk" ? " taAdviceItem--risk" : entry.tone === "ok" ? " taAdviceItem--ok" : entry.tone === "info" ? " taAdviceItem--info" : ""}`
              },
              h("div", { className: "taAdviceTitle" }, entry.title),
              h("div", { className: "taAdviceDetail" }, entry.detail)
            ))
          )
        );
        const categories = overview.categoryTop ?? [];
        const maxCategory = Math.max(1, ...categories.map((entry) => entry.count));
        const categoryPanel = categories.length ? h(
          "section",
          { className: "taPanel", "aria-label": COPY.categoryTitle, style: { marginTop: "14px" } },
          h(
            "div",
            { className: "taPanelHead" },
            h("span", { className: "taPanelTitle" }, COPY.categoryTitle),
            h("span", { className: "taPanelHint" }, "\u672A\u5B8C\u6210\uFF0C\u53D6\u524D 6")
          ),
          h(
            "div",
            { className: "taPanelBody" },
            h(
              "div",
              { className: "taRank" },
              categories.map((entry) => h(
                "div",
                { className: "taRankRow", key: entry.label },
                h("span", { className: "taRankLabel", title: entry.label }, entry.label),
                h("div", { className: "taRankBar" }, h("div", { className: "taRankFill", style: { width: `${Math.round(entry.count / maxCategory * 100)}%` } })),
                h("span", { className: "taRankNum" }, String(entry.count))
              ))
            )
          )
        ) : null;
        return h(
          "div",
          null,
          overview.demo ? h(
            "div",
            { className: "taBanner", role: "status" },
            h("span", null, COPY.demoBanner),
            h("button", { type: "button", className: "taBtn taBtn--sm", onClick: () => toggleDemo(false), disabled: busy }, COPY.demoOff)
          ) : null,
          overview.projects?.length > 1 && !(overview.selectedProjects || []).length ? h(
            "div",
            { className: "taBanner", role: "status" },
            h("span", null, `\u4F60\u7684\u8D26\u53F7\u53EF\u4EE5\u67E5\u770B ${overview.projects.length} \u4E2A\u9879\u76EE\uFF0C\u5EFA\u8BAE\u5148\u9009\u5B9A\u8981\u770B\u7684\u9879\u76EE\uFF0C\u518D\u6309\u9879\u76EE\u770B\u4EFB\u52A1\u3002`),
            h("button", { type: "button", className: "taBtn taBtn--sm", onClick: openProjectPicker }, "\u9009\u62E9\u9879\u76EE")
          ) : null,
          allDisconnected ? h(
            "div",
            { className: "taBanner", role: "status" },
            h("span", null, COPY.noDataText),
            h("button", { type: "button", className: "taBtn taBtn--sm", onClick: () => setView("settings") }, COPY.connect)
          ) : null,
          kpis,
          h("div", { className: "taGrid taGrid--charts" }, bars, compare),
          h(
            "div",
            { className: "taGrid taGrid--lists" },
            priority,
            h("div", null, advice, categoryPanel)
          )
        );
      };
      const renderSystem = () => {
        const meta = status?.systems?.find((item) => item.id === view);
        if (systemLoading && !systemData) {
          return h("div", { className: "taEmpty" }, h("div", { className: "taEmptyTitle" }, "\u6B63\u5728\u8BFB\u53D6\u4EFB\u52A1\u2026"));
        }
        if (!systemData) {
          return h("div", { className: "taEmpty" }, h("div", { className: "taEmptyTitle" }, COPY.loadFailed));
        }
        if (!systemData.connected && !systemData.demo) {
          return h(
            "div",
            null,
            h(
              "div",
              { className: "taPageHead" },
              h(
                "div",
                null,
                h("div", { className: "taPageTitle" }, systemData.system.title),
                h("div", { className: "taPageSub" }, systemData.system.source)
              )
            ),
            h(
              "div",
              { className: "taEmpty" },
              h("div", { className: "taEmptyTitle" }, COPY.notConnected),
              h("div", { className: "taEmptyText" }, meta?.hint || ""),
              h(
                "div",
                { className: "taEmptyActions" },
                h("button", { type: "button", className: "taBtn taBtn--primary", onClick: () => setView("settings") }, COPY.connect)
              )
            )
          );
        }
        const metrics = systemData.metrics;
        const stats = [
          { label: COPY.stat.total, value: metrics.total },
          { label: COPY.stat.unfinished, value: metrics.unfinished },
          { label: COPY.stat.dueSoon, value: metrics.dueSoon, tone: metrics.dueSoon ? "var(--ta-amber)" : "" },
          { label: COPY.stat.overdue, value: metrics.overdue, tone: metrics.overdue ? "var(--ta-red)" : "" },
          { label: COPY.stat.today, value: metrics.completedToday },
          { label: COPY.stat.noDue, value: metrics.noDue }
        ];
        const statusChips = ["all", "unfinished", "dueSoon", "overdue", "completed", "noDue"];
        const rows = systemData.rows.length ? systemData.rows.map((item) => h(
          "tr",
          { key: item.id },
          h(
            "td",
            null,
            h("div", { className: "taCellName" }, item.title),
            item.subtitle ? h("div", { className: "taCellSub" }, item.subtitle) : null
          ),
          h("td", { className: "taCellNowrap" }, item.category || "\u2014"),
          h("td", { className: "taCellNowrap" }, item.owner || "\u672A\u6307\u6D3E"),
          h("td", { className: "taCellNowrap" }, dueText(item)),
          h("td", null, h("span", { className: `taState taState--${stateTone(item)}` }, stateText(item)))
        )) : h("tr", null, h("td", { colSpan: 5, style: { padding: "22px 12px", textAlign: "center", color: "var(--ta-muted)" } }, COPY.emptyRows));
        const totalPages = Math.max(1, Math.ceil(systemData.total / systemData.pageSize));
        return h(
          "div",
          null,
          h(
            "div",
            { className: "taPageHead" },
            h(
              "div",
              null,
              h("div", { className: "taPageTitle" }, systemData.system.title),
              h(
                "div",
                { className: "taPageSub" },
                `${systemData.system.source} \xB7 ${systemData.fetchedAt ? `${formatDay(systemData.fetchedAt)} ${formatClock(systemData.fetchedAt)} \u66F4\u65B0` : "\u5C1A\u672A\u53D6\u6570"}`
              )
            ),
            h(
              "div",
              { className: "taBarRight" },
              systemData.error ? h("span", { className: "taBadge taBadge--error" }, systemData.error) : null,
              systemData.demo ? h("span", { className: "taBadge taBadge--demo" }, "\u6F14\u793A\u6570\u636E") : null,
              h("button", { type: "button", className: "taBtn taBtn--sm", onClick: () => setView("settings") }, COPY.settings)
            )
          ),
          h(
            "div",
            { className: "taStats" },
            stats.map((stat) => h(
              "div",
              { className: "taStat", key: stat.label },
              h("div", { className: "taStatLabel" }, stat.label),
              h("div", { className: "taStatValue", style: stat.tone ? { color: stat.tone } : void 0 }, String(stat.value))
            ))
          ),
          h(
            "div",
            { className: "taFilters" },
            h(
              "div",
              { className: "taChips", role: "group", "aria-label": "\u6309\u72B6\u6001\u7B5B\u9009" },
              statusChips.map((key) => h("button", {
                key,
                type: "button",
                className: "taChip",
                "aria-pressed": filters.status === key,
                onClick: () => setFilters((current) => ({ ...current, status: key, page: 1 }))
              }, COPY.status[key]))
            ),
            h(
              "select",
              {
                className: "taSelect",
                "aria-label": "\u6309\u5206\u7C7B\u7B5B\u9009",
                value: filters.category,
                onChange: (event) => setFilters((current) => ({ ...current, category: event.target.value, page: 1 }))
              },
              h("option", { value: "" }, "\u5168\u90E8\u5206\u7C7B"),
              systemData.categories.map((entry) => h("option", { key: entry.label, value: entry.label }, `${entry.label}\uFF08${entry.count}\uFF09`))
            ),
            h("input", {
              className: "taInput taInput--date",
              type: "date",
              "aria-label": "\u5230\u671F\u8D77\u59CB\u65E5\u671F",
              value: filters.from,
              onChange: (event) => setFilters((current) => ({ ...current, from: event.target.value, page: 1 }))
            }),
            h("span", { style: { color: "var(--ta-faint)", fontSize: "11px" } }, "\u81F3"),
            h("input", {
              className: "taInput taInput--date",
              type: "date",
              "aria-label": "\u5230\u671F\u7ED3\u675F\u65E5\u671F",
              value: filters.to,
              onChange: (event) => setFilters((current) => ({ ...current, to: event.target.value, page: 1 }))
            }),
            h("div", { className: "taFiltersSpacer" }),
            h("input", {
              className: "taInput taInput--search",
              type: "search",
              placeholder: COPY.searchPlaceholder,
              "aria-label": COPY.searchPlaceholder,
              value: search,
              onChange: (event) => setSearch(event.target.value)
            }),
            h("button", {
              type: "button",
              className: "taBtn taBtn--sm taBtn--ghost",
              onClick: () => {
                setSearch("");
                setFilters({ status: "all", category: "", q: "", from: "", to: "", page: 1 });
              }
            }, COPY.reset)
          ),
          h(
            "div",
            { className: "taTableWrap" },
            h(
              "table",
              { className: "taTable" },
              h("thead", null, h(
                "tr",
                null,
                h("th", null, COPY.table.task),
                h("th", null, COPY.table.category),
                h("th", null, COPY.table.owner),
                h("th", null, COPY.table.due),
                h("th", null, COPY.table.state)
              )),
              h("tbody", null, rows)
            )
          ),
          h(
            "div",
            { className: "taPager" },
            h("span", null, `\u5171 ${systemData.total} ${COPY.pager.total}`),
            h("button", {
              type: "button",
              className: "taBtn taBtn--sm",
              disabled: filters.page <= 1,
              onClick: () => setFilters((current) => ({ ...current, page: Math.max(1, current.page - 1) }))
            }, COPY.pager.prev),
            h("span", null, `${COPY.pager.page} ${systemData.page} ${COPY.pager.of} ${totalPages} ${COPY.pager.unit}`),
            h("button", {
              type: "button",
              className: "taBtn taBtn--sm",
              disabled: systemData.page >= totalPages,
              onClick: () => setFilters((current) => ({ ...current, page: current.page + 1 }))
            }, COPY.pager.next)
          )
        );
      };
      const renderSettings = () => {
        const systems = status?.systems ?? [];
        const model = status?.model ?? {};
        const modelReady = Boolean(model.configured);
        const modelField = (key, label, extra = {}) => h(
          "div",
          { className: "taField" },
          h("label", { className: "taFieldLabel", htmlFor: `ta-model-${key}` }, label),
          h("input", {
            id: `ta-model-${key}`,
            className: "taInput",
            value: modelForm[key] || "",
            onChange: (event) => setModelForm((current) => ({ ...current, [key]: event.target.value })),
            ...extra
          })
        );
        return h(
          "div",
          null,
          h(
            "div",
            { className: "taPageHead" },
            h(
              "div",
              null,
              h("div", { className: "taPageTitle" }, COPY.settings),
              h("div", { className: "taPageSub" }, COPY.settingsIntro),
              status?.version ? h("div", { className: "taStamp", style: { marginTop: "4px" } }, `\u5DE5\u4F5C\u53F0\u7248\u672C ${status.version}`) : null
            )
          ),
          h(
            "section",
            { className: "taPanel", "aria-label": COPY.modelTitle },
            h(
              "div",
              { className: "taPanelHead" },
              h("span", { className: "taPanelTitle" }, COPY.modelTitle),
              h(
                "span",
                { className: modelReady ? "taBadge taBadge--live" : "taBadge taBadge--off" },
                modelReady ? "\u5DF2\u914D\u7F6E" : "\u672A\u914D\u7F6E"
              )
            ),
            h(
              "div",
              { className: "taPanelBody" },
              h("div", { className: "taSettingHint", style: { marginTop: 0 } }, COPY.modelHint),
              h(
                "div",
                { className: "taModelGrid" },
                modelField("apiBase", COPY.modelBase, { placeholder: "https://\u2026/v1", autoComplete: "off" }),
                modelField("apiKey", COPY.modelKey, {
                  type: "password",
                  placeholder: model.hasKey ? "\u5DF2\u4FDD\u5B58\uFF0C\u7559\u7A7A\u6CBF\u7528" : "sk-\u2026",
                  autoComplete: "new-password",
                  value: keyEditing ? modelForm.apiKey || "" : model.hasKey ? "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" : modelForm.apiKey || "",
                  onFocus: () => setKeyEditing(true)
                }),
                modelField("model", COPY.modelName, { placeholder: "qwen3.8-flash", autoComplete: "off" })
              ),
              h(
                "div",
                { className: "taSettingActions" },
                h("button", {
                  type: "button",
                  className: "taBtn taBtn--primary",
                  onClick: saveModel,
                  disabled: modelBusy
                }, modelBusy ? COPY.modelSaving : COPY.modelSave),
                modelReady ? h("span", { className: "taBadge taBadge--live" }, `\u5F53\u524D\uFF1A${model.model}`) : null
              )
            )
          ),
          h(
            "div",
            { className: "taSettings", style: { marginTop: "14px" } },
            systems.map((system) => {
              const form = forms[system.id] || {};
              const busyHere = Boolean(formBusy[system.id]);
              const errorHere = formError[system.id];
              return h(
                "section",
                { className: "taSettingCard", key: system.id },
                h(
                  "div",
                  { className: "taSettingHead" },
                  h(
                    "div",
                    null,
                    h("div", { className: "taSettingTitle" }, system.title),
                    h("div", { className: "taSettingSource" }, system.source)
                  ),
                  h(
                    "span",
                    { className: system.configured ? "taBadge taBadge--live" : "taBadge taBadge--off" },
                    system.configured ? COPY.systemStates.live : COPY.systemStates.off
                  )
                ),
                h("div", { className: "taSettingHint" }, system.hint),
                h(
                  "div",
                  { className: "taFieldRow" },
                  h(
                    "div",
                    { className: "taField", style: { flex: "1 1 140px" } },
                    h("label", { className: "taFieldLabel", htmlFor: `ta-user-${system.id}` }, COPY.username),
                    h("input", {
                      id: `ta-user-${system.id}`,
                      className: "taInput",
                      value: form.username ?? system.username ?? "",
                      autoComplete: "off",
                      onChange: (event) => updateForm(system.id, "username", event.target.value)
                    })
                  ),
                  h(
                    "div",
                    { className: "taField", style: { flex: "1 1 140px" } },
                    h("label", { className: "taFieldLabel", htmlFor: `ta-pass-${system.id}` }, COPY.password),
                    h("input", {
                      id: `ta-pass-${system.id}`,
                      className: "taInput",
                      type: "password",
                      value: pwdEditing[system.id] ? form.password || "" : system.hasPassword ? "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" : form.password || "",
                      autoComplete: "new-password",
                      onFocus: () => setPwdEditing((current) => ({ ...current, [system.id]: true })),
                      onChange: (event) => updateForm(system.id, "password", event.target.value)
                    })
                  )
                ),
                errorHere ? h("div", { className: "taNotice taNotice--error", role: "alert", style: { marginTop: "9px" } }, errorHere) : null,
                h(
                  "div",
                  { className: "taSettingActions" },
                  h("button", {
                    type: "button",
                    className: "taBtn taBtn--primary",
                    onClick: () => connect(system.id),
                    disabled: busyHere
                  }, busyHere ? COPY.connecting : system.configured ? COPY.reconnectBtn : COPY.connectBtn),
                  system.configured ? h("button", {
                    type: "button",
                    className: "taBtn taBtn--ghost",
                    onClick: () => disconnect(system.id),
                    disabled: busyHere
                  }, COPY.disconnectBtn) : null
                )
              );
            })
          ),
          h(
            "div",
            { className: "taBanner", style: { marginTop: "14px" } },
            h(
              "label",
              { className: "taCheckbox" },
              h("input", {
                type: "checkbox",
                checked: Boolean(status?.demo),
                onChange: (event) => toggleDemo(event.target.checked),
                disabled: busy
              }),
              h("span", null, COPY.settingsDemo)
            )
          )
        );
      };
      const content = view === "overview" ? renderOverview() : view === "settings" ? renderSettings() : renderSystem();
      const body = h("div", { className: "taBody" }, notices, content);
      const chatArea = chatOpen ? h(
        "aside",
        { className: "taChat", "aria-label": "AI \u534F\u52A9" },
        h(
          "div",
          { className: "taChatHead" },
          h("span", null, "AI \u534F\u52A9 \xB7 \u7ED3\u5408\u5F53\u524D\u4EFB\u52A1\u6C47\u603B"),
          h("button", { type: "button", className: "taBtn taBtn--sm taBtn--ghost", onClick: copyPrompt }, "\u590D\u5236\u6C47\u603B"),
          h("button", { type: "button", className: "taBtn taBtn--sm taBtn--ghost", onClick: () => setChatOpen(false) }, "\u6536\u8D77")
        ),
        conversation
      ) : null;
      const closePopover = (event) => {
        if (!projectOpen) return;
        if (event.target?.closest?.(".taScopeWrap")) return;
        setProjectOpen(false);
      };
      return h(
        "div",
        { className: `taRoot${dark ? " taDark" : ""}`, onClick: closePopover },
        toolbar,
        chatOpen ? h("div", { className: "taSplit" }, h("div", { className: "taSplitMain" }, body), chatArea) : body
      );
    }
    function apply(ctx) {
      const host = {
        sessions: ctx.sessions,
        conversation: ctx.conversation,
        // 这个实例绑定在本工作台的插件上下文上，新建会话时宿主才能认出调用方是谁。
        workbenches: ctx.desktopWorkbenches
      };
      const Panel = (props) => h(BusinessPanel, { ...props, host });
      ctx.effect(() => ctx.desktopWorkbenches.register({
        title: "\u4EFB\u52A1\u52A9\u624B",
        description: "\u6C47\u603B\u91D1\u9E70PLAN\u3001\u5DE1\u68C0\u7EF4\u4FDD\u3001\u91D1\u9E70\u5B89\u5168\u4E0E\u5DE5\u5355\u7CFB\u7EDF\u7684\u4EFB\u52A1\uFF0C\u9996\u9875\u7528\u56FE\u8868\u5C55\u793A\u672A\u5B8C\u6210\u3001\u5373\u5C06\u5230\u671F\u548C\u5DF2\u8FC7\u671F\uFF0C\u6BCF\u4E2A\u7CFB\u7EDF\u53EF\u5355\u72EC\u7B5B\u9009\u641C\u7D22\u3002",
        repository: "https://github.com/Zcx-BaixiaoBai/ge-workbench-task-assistant",
        customFrame: true,
        headerLayout: "compact",
        panelTitle: "\u4EFB\u52A1\u52A9\u624B"
      }, Panel), "task assistant workbench registration");
    }
    return { apply, inject: ["desktopWorkbenches", "sessions", "conversation"] };
  }

  // src/styles.js
  var CSS = `
.taRoot {
  --ta-bg: #ffffff;
  --ta-panel: #ffffff;
  --ta-sub: #fafafa;
  --ta-line: #e8e8e8;
  --ta-line-soft: #f1f1f1;
  --ta-text: #111111;
  --ta-muted: #6d6d6d;
  --ta-faint: #9a9a9a;
  --ta-gold: #b58a2b;
  --ta-gold-deep: #8a5c0c;
  --ta-gold-mid: #c9a558;
  --ta-gold-pale: #e3d3ac;
  --ta-gold-soft: rgba(181, 138, 43, 0.1);
  --ta-navy: #101828;
  --ta-red: #c0392b;
  --ta-red-soft: rgba(192, 57, 43, 0.08);
  --ta-amber: #a9761a;
  --ta-green: #1f7a4d;
  --ta-bar: #3b4a63;
  --ta-bar-2: #b9c2d0;

  container-type: inline-size;
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  background: var(--ta-bg);
  color: var(--ta-text);
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
  font-size: 14px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

.taRoot.taDark {
  --ta-bg: #101010;
  --ta-panel: #161616;
  --ta-sub: #1b1b1b;
  --ta-line: #2b2b2b;
  --ta-line-soft: #232323;
  --ta-text: #f0efec;
  --ta-muted: #9d9a94;
  --ta-faint: #75726d;
  --ta-gold: #d5ac5c;
  --ta-gold-deep: #b98523;
  --ta-gold-mid: #c9a558;
  --ta-gold-pale: #5c4a2c;
  --ta-gold-soft: rgba(213, 172, 92, 0.12);
  --ta-navy: #e6e3dc;
  --ta-red: #e8776d;
  --ta-red-soft: rgba(232, 119, 109, 0.12);
  --ta-amber: #d9b06a;
  --ta-green: #7fc39c;
  --ta-bar: #6f7a8c;
  --ta-bar-2: #4b5566;
}

.taRoot, .taRoot * { box-sizing: border-box; }
.taRoot button, .taRoot input, .taRoot select { font: inherit; }

/* ---------- \u5DE5\u5177\u680F\uFF08\u6807\u9898 + \u5BFC\u822A + \u64CD\u4F5C\uFF09---------- */
.taBar {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
  min-height: 46px;
  border-bottom: 1px solid var(--ta-line);
  background: var(--ta-bg);
}
.taBrand {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 13.5px;
  font-weight: 650;
  white-space: nowrap;
  flex: 0 0 auto;
}
.taBrandMark {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  border: 1.5px solid var(--ta-gold);
  position: relative;
}
.taBrandMark::after {
  content: "";
  position: absolute;
  inset: 3px;
  background: var(--ta-gold);
  border-radius: 1px;
}
.taStamp {
  font-size: 11.5px;
  color: var(--ta-faint);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  flex: 0 0 auto;
}
.taNav {
  display: flex;
  align-items: stretch;
  gap: 0;
  overflow-x: auto;
  scrollbar-width: none;
  flex: 1 1 auto;
  min-width: 0;
  height: 46px;
  margin-left: 4px;
}
.taNav::-webkit-scrollbar { display: none; }
.taTab {
  appearance: none;
  border: none;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: var(--ta-muted);
  font-size: 12.5px;
  padding: 0 10px;
  cursor: pointer;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.taTab:hover { color: var(--ta-text); }
.taTab[aria-selected="true"] { color: var(--ta-text); border-bottom-color: var(--ta-gold); font-weight: 600; }
.taTab:focus-visible { outline: 2px solid var(--ta-gold); outline-offset: -3px; }
.taTabCount { font-size: 10.5px; color: var(--ta-faint); font-variant-numeric: tabular-nums; }
.taBarRight { display: flex; align-items: center; gap: 6px; flex: 0 0 auto; }

/* ---------- \u6309\u94AE\u4E0E\u6807\u7B7E ---------- */
.taBtn {
  appearance: none;
  border: 1px solid var(--ta-line);
  background: var(--ta-bg);
  color: var(--ta-text);
  font-size: 12.5px;
  padding: 5px 11px;
  border-radius: 7px;
  cursor: pointer;
  white-space: nowrap;
  transition: border-color 0.14s ease, color 0.14s ease, background 0.14s ease;
}
.taBtn:hover { border-color: var(--ta-gold); color: var(--ta-gold); }
.taBtn:focus-visible { outline: 2px solid var(--ta-gold); outline-offset: 1px; }
.taBtn:disabled { opacity: 0.5; cursor: default; }
.taBtn--primary { background: var(--ta-navy); border-color: var(--ta-navy); color: #fff; }
.taDark .taBtn--primary { color: #14100a; }
.taBtn--primary:hover { background: #22304a; border-color: #22304a; color: #fff; }
.taBtn--ghost { border-color: transparent; background: transparent; color: var(--ta-muted); }
.taBtn--ghost:hover { color: var(--ta-gold); border-color: var(--ta-line); }
.taBtn--sm { padding: 3px 9px; font-size: 12px; }

.taBadge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10.5px;
  padding: 0 6px;
  height: 18px;
  border-radius: 4px;
  border: 1px solid var(--ta-line);
  color: var(--ta-muted);
  white-space: nowrap;
  flex: 0 0 auto;
}
.taBadge--live { color: var(--ta-green); border-color: rgba(31, 122, 77, 0.3); background: rgba(31, 122, 77, 0.07); }
.taBadge--demo { color: var(--ta-gold); border-color: rgba(181, 138, 43, 0.35); background: var(--ta-gold-soft); }
.taBadge--off { color: var(--ta-faint); }
.taBadge--error { color: var(--ta-red); border-color: rgba(192, 57, 43, 0.32); background: var(--ta-red-soft); }

.taState {
  display: inline-block;
  font-size: 11px;
  padding: 0 6px;
  height: 19px;
  line-height: 18px;
  border-radius: 4px;
  white-space: nowrap;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  border: 1px solid transparent;
}
.taState--risk { color: var(--ta-red); background: var(--ta-red-soft); border-color: rgba(192, 57, 43, 0.2); }
.taState--warn { color: var(--ta-amber); background: var(--ta-gold-soft); border-color: rgba(181, 138, 43, 0.24); }
.taState--ok { color: var(--ta-green); background: rgba(31, 122, 77, 0.07); border-color: rgba(31, 122, 77, 0.2); }
.taState--muted { color: var(--ta-muted); background: var(--ta-sub); border-color: var(--ta-line); }

/* ---------- \u9879\u76EE\u9009\u62E9 ---------- */
.taScopeWrap { position: relative; display: inline-flex; }
.taPop {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  width: 320px;
  max-width: min(320px, 80vw);
  background: var(--ta-bg);
  border: 1px solid var(--ta-line);
  border-radius: 10px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.14);
  z-index: 30;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.taPopHead { padding: 8px; border-bottom: 1px solid var(--ta-line-soft); }
.taPopHead .taInput { width: 100%; }
.taPopList { max-height: 260px; overflow: auto; padding: 3px 0; }
.taPopRow { display: flex; align-items: center; gap: 8px; padding: 5px 10px; font-size: 12.5px; cursor: pointer; }
.taPopRow:hover { background: var(--ta-sub); }
.taPopRow input { width: 14px; height: 14px; accent-color: var(--ta-gold); flex: 0 0 auto; }
.taPopName { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.taPopCount { color: var(--ta-faint); font-size: 11px; font-variant-numeric: tabular-nums; }
.taPopFoot { display: flex; gap: 6px; align-items: center; padding: 8px; border-top: 1px solid var(--ta-line-soft); }

/* ---------- \u4E3B\u4F53 ---------- */
.taBody { flex: 1 1 auto; min-height: 0; overflow: auto; padding: 14px 16px 30px; }
.taSplit { display: flex; flex: 1 1 auto; min-height: 0; }
.taSplitMain { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; min-height: 0; }
.taChat {
  flex: 0 0 360px;
  width: 360px;
  border-left: 1px solid var(--ta-line);
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: var(--ta-bg);
}
.taChatHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--ta-line);
  font-size: 11.5px;
  color: var(--ta-muted);
}

/* ---------- KPI \u6A2A\u6761 ---------- */
.taKpis {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  border: 1px solid var(--ta-line);
  border-radius: 10px;
  overflow: hidden;
  background: var(--ta-panel);
  margin-bottom: 14px;
}
.taKpi { padding: 11px 14px; border-right: 1px solid var(--ta-line); min-width: 0; }
.taKpi:last-child { border-right: none; }
.taKpiLabel { font-size: 11.5px; color: var(--ta-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.taKpiValue {
  font-size: 24px;
  font-weight: 620;
  line-height: 1.25;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}
.taKpiValue--risk { color: var(--ta-red); }
.taKpiValue--warn { color: var(--ta-amber); }
.taKpiSub { font-size: 11px; color: var(--ta-faint); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* ---------- \u9762\u677F ---------- */
.taGrid { display: grid; gap: 14px; margin-bottom: 14px; align-items: stretch; }
.taGrid--charts { grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr); }
.taGrid--lists { grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr); }
.taPanel { border: 1px solid var(--ta-line); border-radius: 10px; background: var(--ta-panel); overflow: hidden; min-width: 0; display: flex; flex-direction: column; }
.taPanelHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 9px 12px;
  border-bottom: 1px solid var(--ta-line-soft);
}
.taPanelTitle { font-size: 12.5px; font-weight: 650; white-space: nowrap; }
.taPanelHint { font-size: 11px; color: var(--ta-faint); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.taPanelBody { padding: 12px; }
.taPanelBody--chart { flex: 1 1 auto; display: flex; flex-direction: column; min-height: 0; }
.taGrid--charts .taPanel--chart { height: 360px; }

/* ---------- \u67F1\u72B6\u56FE ---------- */
.taBarsNote { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 11.5px; color: var(--ta-faint); margin-bottom: 10px; }
.taBarsNoteRisk { color: var(--ta-red); font-weight: 600; }
.taBars { position: relative; flex: 1 1 auto; min-height: 0; }
.taBarsSvg { position: absolute; inset: 0; width: 100%; height: 100%; display: block; overflow: visible; }
.taBarRect { fill: var(--ta-gold); }
.taBarCol { flex: 1 1 0; min-width: 0; height: 100%; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; gap: 3px; }
.taBarNum { position: absolute; left: 0; right: 0; text-align: center; font-size: 10.5px; color: var(--ta-muted); font-variant-numeric: tabular-nums; line-height: 1; }
.taBarTrack { position: relative; width: 100%; flex: 1 1 auto; min-height: 0; }
.taBarFill {
  position: absolute;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  width: 78%;
  max-width: 34px;
  border-radius: 2px 2px 0 0;
  background: var(--ta-bar);
  min-height: 2px;
  transition: height 0.25s ease;
}
.taBarFill--risk { background: var(--ta-red); opacity: 1; }
.taBarFill--today { background: var(--ta-gold); opacity: 1; }
.taBarFill--warn { background: var(--ta-gold); opacity: 0.55; }
.taBarLabel { font-size: 10.5px; color: var(--ta-faint); white-space: nowrap; }
.taBarsAxis { display: flex; gap: 6px; margin-top: 10px; }
.taBarsAxis > span { flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; align-items: center; gap: 1px; }
.taBarsAxisLabel { font-size: 10.5px; color: var(--ta-faint); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
.taBarsAxisCount { font-size: 11px; color: var(--ta-muted); font-variant-numeric: tabular-nums; }

/* ---------- \u7CFB\u7EDF\u7ED3\u6784\u5BF9\u6BD4 ---------- */
.taCompare { display: flex; flex-direction: column; justify-content: space-evenly; flex: 1 1 auto; gap: 2px; min-height: 0; }
.taCompareRow {
  display: grid;
  align-content: center;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-areas: "compare-name compare-nums" "compare-bar compare-bar";
  gap: 4px 9px;
  align-items: center;
  padding: 7px 4px;
  border-radius: 6px;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
  color: inherit;
}
.taCompareRow:hover { background: var(--ta-sub); }
.taCompareRow:focus-visible { outline: 2px solid var(--ta-gold); outline-offset: -2px; }
.taCompareName { grid-area: compare-name; font-size: 12px; font-weight: 550; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.taCompareTrack { grid-area: compare-bar; display: flex; height: 16px; border-radius: 3px; overflow: hidden; background: var(--ta-line-soft); }
.taCompareSeg { height: 100%; min-width: 0; }
.taCompareSeg { background: var(--ta-gold); }
.taCompareSeg--overdue { opacity: 1; }
.taCompareSeg--soon { opacity: 0.62; }
.taCompareSeg--open { opacity: 0.28; }
.taCompareNums { grid-area: compare-nums; min-width: 0; font-size: 11px; color: var(--ta-muted); text-align: right; font-variant-numeric: tabular-nums; white-space: normal; overflow-wrap: anywhere; }
.taCompareNums b { color: var(--ta-text); font-weight: 600; }
.taLegend { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 10px; font-size: 10.5px; color: var(--ta-muted); }
.taLegendDot { display: inline-block; width: 7px; height: 7px; border-radius: 1px; margin-right: 4px; vertical-align: 0; }

/* ---------- \u4F18\u5148\u5904\u7406\u5217\u8868 ---------- */
.taRows { display: flex; flex-direction: column; }
.taRow {
  display: grid;
  grid-template-columns: 74px minmax(0, 1fr) 88px 74px;
  gap: 9px;
  align-items: center;
  padding: 7px 12px;
  border-bottom: 1px solid var(--ta-line-soft);
}
.taRow:last-child { border-bottom: none; }
.taRow:hover { background: var(--ta-sub); }
.taRowTitle { min-width: 0; }
.taRowName { font-size: 12.5px; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.taRowMeta { font-size: 10.5px; color: var(--ta-faint); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.taRowDue { font-size: 11.5px; color: var(--ta-muted); text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
.taRowDue--risk { color: var(--ta-red); font-weight: 600; }
.taRowDue--warn { color: var(--ta-amber); font-weight: 600; }
.taRowOwner { font-size: 11.5px; color: var(--ta-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: right; }
.taTag {
  display: inline-block;
  max-width: 100%;
  font-size: 10.5px;
  padding: 0 5px;
  height: 18px;
  line-height: 17px;
  border-radius: 4px;
  color: var(--ta-muted);
  background: var(--ta-sub);
  border: 1px solid var(--ta-line);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ---------- \u5EFA\u8BAE ---------- */
.taAdvice { display: flex; flex-direction: column; gap: 1px; padding: 2px 12px 10px; }
.taAdviceItem { padding: 8px 0 8px 9px; border-left: 2px solid var(--ta-gold); margin-top: 6px; }
.taAdviceItem--risk { border-left-color: var(--ta-red); }
.taAdviceItem--ok { border-left-color: var(--ta-green); }
.taAdviceItem--info { border-left-color: var(--ta-faint); }
.taAdviceTitle { font-size: 12px; font-weight: 600; line-height: 1.45; }
.taAdviceDetail { font-size: 11.5px; color: var(--ta-muted); margin-top: 2px; line-height: 1.55; }

.taRank { display: flex; flex-direction: column; gap: 7px; }
.taRankRow { display: grid; grid-template-columns: minmax(0, 84px) minmax(0, 1fr) 26px; gap: 8px; align-items: center; }
.taRankLabel { font-size: 11.5px; color: var(--ta-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.taRankBar { height: 7px; background: var(--ta-line-soft); border-radius: 2px; overflow: hidden; }
.taRankFill { height: 100%; background: var(--ta-gold); opacity: 0.85; border-radius: 2px; }
.taRankNum { font-size: 11px; color: var(--ta-muted); text-align: right; font-variant-numeric: tabular-nums; }

/* ---------- \u7CFB\u7EDF\u5B50\u9875 ---------- */
.taPageHead { display: flex; align-items: flex-end; justify-content: space-between; gap: 10px; flex-wrap: wrap; margin-bottom: 12px; }
.taPageTitle { font-size: 16px; font-weight: 650; letter-spacing: -0.01em; }
.taPageSub { font-size: 11.5px; color: var(--ta-muted); margin-top: 2px; }
.taStats {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  border: 1px solid var(--ta-line);
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 12px;
}
.taStat { padding: 9px 12px; border-right: 1px solid var(--ta-line); min-width: 0; background: var(--ta-panel); }
.taStat:last-child { border-right: none; }
.taStatLabel { font-size: 11px; color: var(--ta-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.taStatValue { font-size: 18px; font-weight: 620; font-variant-numeric: tabular-nums; line-height: 1.3; }

.taFilters { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-bottom: 10px; }
.taChips { display: flex; flex-wrap: wrap; gap: 3px; }
.taChip {
  appearance: none;
  font-size: 11.5px;
  padding: 3px 9px;
  border-radius: 5px;
  border: 1px solid var(--ta-line);
  background: transparent;
  color: var(--ta-muted);
  cursor: pointer;
  white-space: nowrap;
}
.taChip:hover { color: var(--ta-text); border-color: var(--ta-gold); }
.taChip[aria-pressed="true"] { background: var(--ta-navy); border-color: var(--ta-navy); color: #fff; }
.taDark .taChip[aria-pressed="true"] { background: var(--ta-gold); border-color: var(--ta-gold); color: #14100a; }
.taChip:focus-visible { outline: 2px solid var(--ta-gold); outline-offset: 1px; }

.taInput, .taSelect {
  font-size: 12.5px;
  padding: 5px 8px;
  border: 1px solid var(--ta-line);
  border-radius: 6px;
  background: var(--ta-bg);
  color: var(--ta-text);
  min-width: 0;
  max-width: 100%;
}
.taInput:focus, .taSelect:focus { outline: 2px solid var(--ta-gold-soft); border-color: var(--ta-gold); }
.taInput--search { flex: 1 1 170px; min-width: 120px; }
.taInput--date { width: 136px; }
.taFiltersSpacer { flex: 1 1 auto; }

.taTableWrap { overflow-x: auto; border: 1px solid var(--ta-line); border-radius: 10px; background: var(--ta-panel); }
.taTable { width: 100%; min-width: 680px; border-collapse: collapse; font-size: 12.5px; }
.taTable th {
  text-align: left;
  font-size: 11px;
  font-weight: 600;
  color: var(--ta-muted);
  padding: 8px 12px;
  border-bottom: 1px solid var(--ta-line);
  background: var(--ta-sub);
  white-space: nowrap;
  position: sticky;
  top: 0;
  z-index: 1;
}
.taTable td { padding: 8px 12px; border-bottom: 1px solid var(--ta-line-soft); vertical-align: top; }
.taTable tr:last-child td { border-bottom: none; }
.taTable tbody tr:hover td { background: var(--ta-sub); }
.taCellName { font-weight: 500; word-break: break-word; }
.taCellSub { font-size: 10.5px; color: var(--ta-faint); margin-top: 1px; word-break: break-word; }
.taCellNowrap { white-space: nowrap; font-variant-numeric: tabular-nums; color: var(--ta-muted); font-size: 11.5px; }
.taPager { display: flex; align-items: center; justify-content: flex-end; gap: 8px; margin-top: 10px; font-size: 11.5px; color: var(--ta-muted); }

/* ---------- \u7A7A\u72B6\u6001 / \u63D0\u793A ---------- */
.taEmpty {
  border: 1px dashed var(--ta-line);
  border-radius: 10px;
  padding: 32px 20px;
  text-align: center;
  color: var(--ta-muted);
  background: var(--ta-panel);
}
.taEmptyTitle { font-size: 13.5px; font-weight: 600; color: var(--ta-text); margin-bottom: 5px; }
.taEmptyText { font-size: 12.5px; max-width: 600px; margin: 0 auto 12px; line-height: 1.65; }
.taEmptyActions { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }

.taBanner {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 7px 10px;
  border: 1px solid rgba(181, 138, 43, 0.3);
  background: var(--ta-gold-soft);
  border-radius: 7px;
  font-size: 11.5px;
  color: var(--ta-amber);
  margin-bottom: 12px;
}
.taBanner .taBtn { color: var(--ta-amber); border-color: rgba(181, 138, 43, 0.4); background: transparent; }
.taNotice {
  padding: 7px 10px;
  border: 1px solid var(--ta-line);
  border-left: 2px solid var(--ta-gold);
  border-radius: 5px;
  background: var(--ta-panel);
  font-size: 11.5px;
  margin-bottom: 10px;
}
.taNotice--error { border-left-color: var(--ta-red); color: var(--ta-red); }

/* ---------- \u8FDE\u63A5\u8BBE\u7F6E ---------- */
.taSettings { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.taSettingCard { border: 1px solid var(--ta-line); border-radius: 10px; background: var(--ta-panel); padding: 12px 14px; min-width: 0; }
.taSettingHead { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.taSettingTitle { font-size: 13px; font-weight: 650; }
.taSettingSource { font-size: 11px; color: var(--ta-faint); margin-top: 1px; }
.taSettingHint { font-size: 11.5px; color: var(--ta-muted); margin-top: 6px; line-height: 1.6; }
.taField { display: flex; flex-direction: column; gap: 4px; margin-top: 9px; }
.taFieldLabel { font-size: 11px; color: var(--ta-muted); }
.taCaptcha { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.taCaptchaImg { height: 34px; border-radius: 4px; border: 1px solid var(--ta-line); background: #fff; }
.taSettingActions { display: flex; gap: 6px; margin-top: 11px; flex-wrap: wrap; }
.taFieldRow { display: flex; gap: 10px; align-items: flex-start; flex-wrap: wrap; }
.taModelGrid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
.taCheckbox { display: inline-flex; align-items: center; gap: 7px; font-size: 12.5px; }
.taCheckbox input { width: 14px; height: 14px; accent-color: var(--ta-gold); }

/* ---------- \u6309\u4E1A\u52A1\u533A\u5B9E\u9645\u5BBD\u5EA6\u91CD\u6392 ---------- */
@container (max-width: 980px) {
  .taGrid--charts, .taGrid--lists { grid-template-columns: minmax(0, 1fr); }
  .taGrid--charts .taPanel--chart { height: 280px; }
  .taStats { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .taStat:nth-child(3n) { border-right: none; }
  .taStat:nth-child(n + 4) { border-top: 1px solid var(--ta-line); }
  .taSplit { flex-direction: column; }
  .taChat { flex: 0 0 auto; width: auto; height: 44vh; border-left: none; border-top: 1px solid var(--ta-line); }
}
@container (max-width: 780px) {
  .taSettings { grid-template-columns: minmax(0, 1fr); }
  .taModelGrid { grid-template-columns: minmax(0, 1fr); }
  .taKpi { padding: 9px 10px; }
  .taKpiValue { font-size: 21px; }
  .taKpiLabel { font-size: 11px; }
  .taKpiSub { font-size: 10.5px; }
  .taStamp { display: none; }
  .taBody { padding: 12px 12px 26px; }
  .taRow { grid-template-columns: 64px minmax(0, 1fr) 76px; }
  .taRowOwner { display: none; }
}
@container (max-width: 560px) {
  .taKpi { padding: 8px 8px; }
  .taKpiValue { font-size: 19px; }
  .taKpiSub { display: none; }
  .taKpiLabel { white-space: normal; line-height: 1.25; }
  .taRow { grid-template-columns: minmax(0, 1fr) 76px; }
  .taRowTag { display: none; }
  .taStat { padding: 8px 9px; }
  .taStatValue { font-size: 16px; }
}

@media (prefers-color-scheme: dark) {
  .taRoot:not(.taLight) {
    --ta-bg: #101010;
    --ta-panel: #161616;
    --ta-sub: #1b1b1b;
    --ta-line: #2b2b2b;
    --ta-line-soft: #232323;
    --ta-text: #f0efec;
    --ta-muted: #9d9a94;
    --ta-faint: #75726d;
    --ta-gold: #d5ac5c;
    --ta-gold-soft: rgba(213, 172, 92, 0.12);
    --ta-navy: #e6e3dc;
    --ta-red: #e8776d;
    --ta-red-soft: rgba(232, 119, 109, 0.12);
    --ta-amber: #d9b06a;
    --ta-green: #7fc39c;
  }
}
`;
  var styles_default = CSS;

  // src/entry.jsx
  var STYLE_ID = "ge-workbench-task-assistant-style";
  function installStyles() {
    if (typeof document === "undefined") return;
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = styles_default;
    document.head.appendChild(style);
  }
  try {
    window.addEventListener("error", (event) => {
      try {
        window.__TA_LAST_ERROR__ = { message: event?.message || String(event?.error || ""), at: (/* @__PURE__ */ new Date()).toISOString() };
        console.error("[task-assistant] window error", event?.error || event?.message);
      } catch {
      }
    });
    window.addEventListener("unhandledrejection", (event) => {
      try {
        window.__TA_LAST_ERROR__ = { message: String(event?.reason || ""), at: (/* @__PURE__ */ new Date()).toISOString() };
        console.error("[task-assistant] unhandled rejection", event?.reason);
      } catch {
      }
    });
  } catch {
  }
  window.__ModuleLoader__.load({
    id: "ge-workbench-task-assistant",
    factory: (req) => {
      const React = req("react");
      installStyles();
      return createPanel(React);
    }
  });
})();
