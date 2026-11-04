(() => {
  // src/panel.jsx
  var COPY = {
    title: "\u9AD8\u4ED9\u673A\u5668\u4EBA\u52A9\u624B",
    refresh: "\u5237\u65B0",
    refreshing: "\u6B63\u5728\u5237\u65B0\u2026",
    ai: "AI \u534F\u52A9",
    aiBusy: "\u6B63\u5728\u6253\u5F00\u5BF9\u8BDD\u2026",
    overviewTitle: "\u96C6\u56E2\u6E05\u6D01\u673A\u5668\u4EBA\u8FD0\u884C\u603B\u89C8",
    loadFailed: "\u6570\u636E\u8BFB\u53D6\u5931\u8D25",
    emptyTitle: "\u8FD8\u6CA1\u6709\u62FF\u5230\u5E73\u53F0\u6570\u636E"
  };
  function detectDark() {
    if (typeof document === "undefined") return false;
    const root = document.documentElement;
    const attr = root?.getAttribute?.("data-theme") || "";
    if (attr === "dark") return true;
    if (attr === "light") return false;
    return Boolean(root?.classList?.contains?.("dark")) || Boolean(window.matchMedia?.("(prefers-color-scheme: dark)")?.matches);
  }
  function number(value) {
    if (value === null || value === void 0 || Number.isNaN(value)) return "\u2014";
    return new Intl.NumberFormat("zh-CN").format(Math.round(value));
  }
  function area(value) {
    if (value === null || value === void 0 || Number.isNaN(value)) return "\u2014";
    return `${number(value)} \u33A1`;
  }
  function compactArea(value) {
    if (value === null || value === void 0 || Number.isNaN(value)) return "\u2014";
    if (value >= 1e8) return `${(value / 1e8).toFixed(1)} \u4EBF`;
    if (value >= 1e4) return `${(value / 1e4).toFixed(1)} \u4E07`;
    return number(value);
  }
  function pct(value) {
    if (value === null || value === void 0 || Number.isNaN(value)) return "\u2014";
    return `${Math.round(value * 100)}%`;
  }
  function timeText(iso) {
    if (!iso) return "\u5C1A\u672A\u53D6\u6570";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "\u5C1A\u672A\u53D6\u6570";
    return `${date.getMonth() + 1}\u6708${date.getDate()}\u65E5 ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  }
  function clockText(ms) {
    if (!ms) return "\u2014";
    const date = new Date(Number(ms));
    if (Number.isNaN(date.getTime())) return "\u2014";
    return `${date.getMonth() + 1}\u6708${date.getDate()}\u65E5 ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  }
  function rateTone(value, threshold) {
    if (value === null || value === void 0) return "";
    if (value < threshold) return "bad";
    if (value < threshold * 2) return "warn";
    return "good";
  }
  function dayLabel(date) {
    if (typeof date !== "string" || date.length < 10) return date || "";
    return `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}`;
  }
  function statusRank(label) {
    if (label.includes("\u4EFB\u52A1")) return 0;
    if (label.includes("\u5145\u7535")) return 1;
    if (label.includes("\u4F4E\u529F\u8017")) return 2;
    if (label === "\u79BB\u7EBF") return 3;
    return 4;
  }
  function miniStatusGroups(groups) {
    const picks = [
      groups.find((group) => group.label.includes("\u4EFB\u52A1")),
      groups.find((group) => group.label.includes("\u5145\u7535")),
      groups.find((group) => group.label.includes("\u4F4E\u529F\u8017")),
      groups.find((group) => group.label === "\u79BB\u7EBF")
    ].filter(Boolean);
    const rest = groups.filter((group) => !picks.includes(group));
    const filled = [...picks];
    for (const group of rest) {
      if (filled.length >= 4) break;
      filled.push(group);
    }
    return filled.slice(0, 4).sort((left, right) => statusRank(left.label) - statusRank(right.label));
  }
  var RING_RADIUS = 52;
  var RING_LENGTH = 2 * Math.PI * RING_RADIUS;
  function createPanel(ReactImpl) {
    const h = ReactImpl.createElement;
    const { useCallback, useEffect, useMemo, useState } = ReactImpl;
    function useDarkMode() {
      const [dark, setDark] = useState(detectDark);
      useEffect(() => {
        if (typeof MutationObserver === "undefined") return void 0;
        const observer = new MutationObserver(() => setDark(detectDark()));
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme"] });
        const media = window.matchMedia?.("(prefers-color-scheme: dark)");
        const onChange = () => setDark(detectDark());
        media?.addEventListener?.("change", onChange);
        return () => {
          observer.disconnect();
          media?.removeEventListener?.("change", onChange);
        };
      }, []);
      return dark;
    }
    function BusinessPanel({ conversation, host }) {
      const dark = useDarkMode();
      const [data, setData] = useState(null);
      const [loading, setLoading] = useState(true);
      const [error, setError] = useState(null);
      const [notice, setNotice] = useState(null);
      const [view, setView] = useState({ name: "overview" });
      const [device, setDevice] = useState(null);
      const [alertData, setAlertData] = useState(null);
      const [loginBusy, setLoginBusy] = useState(false);
      const [loginHint, setLoginHint] = useState("");
      const [loginTried, setLoginTried] = useState(false);
      const [loginLog, setLoginLog] = useState("");
      const [alertLoading, setAlertLoading] = useState(false);
      const [deviceLoading, setDeviceLoading] = useState(false);
      const [chatOpen, setChatOpen] = useState(false);
      const [aiBusy, setAiBusy] = useState(false);
      const [query, setQuery] = useState("");
      const [onlyLow, setOnlyLow] = useState(false);
      const [sortKey, setSortKey] = useState("completeness");
      const request = useCallback(async (path) => {
        const response = await fetch(path, { credentials: "same-origin", cache: "no-store" });
        let body2 = {};
        try {
          body2 = await response.json();
        } catch {
          body2 = {};
        }
        if (!response.ok) {
          const failure = new Error(body2?.error || `\u8BF7\u6C42\u5931\u8D25\uFF08HTTP ${response.status}\uFF09`);
          failure.code = body2?.code;
          throw failure;
        }
        return body2;
      }, []);
      const load = useCallback(async (force = false) => {
        setLoading(true);
        setError(null);
        try {
          const result = await request(`/api/robot-ops/snapshot${force ? "?refresh=1" : ""}`);
          setData(result.snapshot);
          if (result.error) {
            setNotice({ tone: "warn", text: `\u8FD9\u6B21\u5237\u65B0\u6CA1\u6709\u6210\u529F\uFF0C\u9875\u9762\u663E\u793A\u7684\u662F ${timeText(result.snapshot?.fetchedAt)} \u7684\u6570\u636E\uFF1A${result.error}` });
          } else {
            setNotice(null);
          }
        } catch (failure) {
          setError({ message: failure.message, code: failure.code });
        } finally {
          setLoading(false);
        }
      }, [request]);
      useEffect(() => {
        load(false);
      }, [load]);
      useEffect(() => {
        if (view.name !== "alerts") return void 0;
        let alive = true;
        setAlertLoading(true);
        request("/api/robot-ops/alerts").then((payload) => {
          if (alive) setAlertData(payload);
        }).catch((failure) => {
          if (alive) setNotice({ tone: "error", text: failure.message });
        }).finally(() => {
          if (alive) setAlertLoading(false);
        });
        return () => {
          alive = false;
        };
      }, [view.name, request]);
      useEffect(() => {
        setAlertData(null);
      }, [data?.fetchedAt]);
      const startLogin = useCallback(async () => {
        setLoginBusy(true);
        setLoginHint("");
        try {
          const result = await request("/api/robot-ops/login", { method: "POST" });
          setLoginHint(result.already ? "\u767B\u5F55\u7A97\u53E3\u5DF2\u7ECF\u6253\u5F00\uFF0C\u8BF7\u5728\u90A3\u8FB9\u7684\u6D4F\u89C8\u5668\u91CC\u5B8C\u6210\u767B\u5F55\u3002" : "\u5DF2\u6253\u5F00\u767B\u5F55\u7A97\u53E3\uFF0C\u8BF7\u5728\u5F39\u51FA\u7684\u6D4F\u89C8\u5668\u91CC\u767B\u5F55\uFF1B\u5B8C\u6210\u540E\u8FD9\u91CC\u4F1A\u81EA\u52A8\u5237\u65B0\u3002");
        } catch (failure) {
          setLoginHint(failure.message);
        } finally {
          setLoginBusy(false);
        }
      }, [request]);
      useEffect(() => {
        if (loginTried) return void 0;
        if (error?.code !== "NO_SESSION" && error?.code !== "SESSION_EXPIRED") return void 0;
        setLoginTried(true);
        startLogin();
        return void 0;
      }, [error, loginTried, startLogin]);
      useEffect(() => {
        if (!loginTried) return void 0;
        let ticks = 0;
        const timer = setInterval(async () => {
          ticks += 1;
          if (ticks > 40) {
            clearInterval(timer);
            setLoginHint("\u8FD8\u6CA1\u6709\u68C0\u6D4B\u5230\u767B\u5F55\u5B8C\u6210\u3002\u7A97\u53E3\u53EF\u80FD\u5DF2\u88AB\u5173\u95ED\uFF0C\u53EF\u4EE5\u70B9\u300C\u6253\u5F00\u767B\u5F55\u7A97\u53E3\u300D\u91CD\u65B0\u8BD5\u4E00\u6B21\u3002");
            return;
          }
          try {
            const status = await request("/api/robot-ops/status");
            if (status.hasSession) {
              clearInterval(timer);
              setLoginHint("\u767B\u5F55\u6210\u529F\uFF0C\u6B63\u5728\u8BFB\u53D6\u6570\u636E\u2026");
              load(true);
              return;
            }
            const run = status.login;
            if (run && !run.running && run.exitCode !== null) {
              clearInterval(timer);
              const tail = (run.logTail || "").split("\n").slice(-4).join("\n");
              setLoginLog(tail);
              setLoginHint(run.exitCode === 0 ? "\u767B\u5F55\u7A97\u53E3\u5DF2\u5173\u95ED\uFF0C\u4F46\u6CA1\u6709\u62FF\u5230\u767B\u5F55\u72B6\u6001\u3002\u8BF7\u91CD\u65B0\u6253\u5F00\u7A97\u53E3\uFF0C\u767B\u5F55\u5B8C\u6210\u540E\u4E0D\u8981\u63D0\u524D\u5173\u95ED\u3002" : `\u767B\u5F55\u7A97\u53E3\u6CA1\u80FD\u5B8C\u6210\uFF08\u9000\u51FA\u7801 ${run.exitCode}\uFF09\u3002${run.spawnError || ""}`);
            }
          } catch {
          }
        }, 2500);
        return () => clearInterval(timer);
      }, [loginTried, request, load]);
      const openDevice = useCallback(async (sn) => {
        setView({ name: "device", sn });
        setDevice(null);
        setDeviceLoading(true);
        try {
          const payload = await request(`/api/robot-ops/device?sn=${encodeURIComponent(sn)}`);
          setDevice(payload);
        } catch (failure) {
          setNotice({ tone: "error", text: failure.message });
        } finally {
          setDeviceLoading(false);
        }
      }, [request]);
      const startAi = useCallback(async () => {
        const workbenches = host?.workbenches;
        if (!workbenches?.newSession && !workbenches?.newWorkspaceSession) {
          setChatOpen(true);
          return;
        }
        setAiBusy(true);
        try {
          const workspace = workbenches.defaultWorkspace?.();
          const creation = workspace ? workbenches.newSession(workspace.workspaceId) : workbenches.newWorkspaceSession();
          const sessionId = await creation;
          if (!sessionId) {
            setNotice({ tone: "error", text: "\u5BBF\u4E3B\u6CA1\u6709\u8FD4\u56DE\u4F1A\u8BDD\uFF0C\u8BF7\u5148\u5728\u5DE6\u4FA7\u9009\u62E9\u6216\u65B0\u5EFA\u4E00\u4E2A\u5DE5\u4F5C\u533A\u3002" });
            return;
          }
          setChatOpen(true);
        } catch (failure) {
          setChatOpen(true);
          setNotice({ tone: "error", text: failure instanceof Error ? failure.message : String(failure) });
        } finally {
          setAiBusy(false);
        }
      }, [host]);
      const threshold = data?.thresholds?.completionRate ?? 0.2;
      const promptLines = useCallback(() => {
        if (!data) return [];
        const lines = [
          `${COPY.title} \xB7 \u6C47\u603B\u6570\u636E\uFF08${timeText(data.fetchedAt)}\uFF09`,
          `\u9879\u76EE ${data.totals.projects} \u4E2A\uFF0C\u8BBE\u5907 ${data.totals.robots} \u53F0\uFF1A\u5728\u7EBF ${data.totals.online}\u3001\u4EFB\u52A1\u4E2D ${data.totals.tasking}\u3001\u79BB\u7EBF ${data.totals.offline}\u3002`,
          `\u8FD1 7 \u5929\u6E05\u6D01\u9762\u79EF ${area(data.totals.area7d)}\uFF0C\u4F4E\u4E8E\u5B8C\u6210\u7387 ${pct(threshold)} \u7684\u8BBE\u5907 ${data.totals.nonCompliant} \u53F0\uFF0C\u5F85\u5904\u7406\u544A\u8B66 ${data.totals.alerts} \u6761\u3002`,
          "",
          "\u6309\u9879\u76EE\uFF08\u5B8C\u6210\u7387\u4ECE\u4F4E\u5230\u9AD8\uFF09\uFF1A",
          ...data.projects.slice(0, 10).map((row) => `- ${row.name}\uFF1A\u8BBE\u5907 ${row.devices}\uFF0C\u5728\u7EBF ${row.online}\uFF0C\u5B8C\u6210\u7387 ${pct(row.completeness)}\uFF0C\u672A\u8FBE\u6807 ${row.nonCompliant} \u53F0\uFF0C\u8FD1 7 \u5929 ${area(row.area7d)}`)
        ];
        if (data.trend?.length) {
          lines.push("", "\u8FD1 7 \u5929\u96C6\u56E2\u6E05\u6D01\u9762\u79EF\uFF1A");
          lines.push(...data.trend.map((day) => `- ${day.date}\uFF1A${area(day.area)}\uFF0C\u5B8C\u6210\u7387 ${pct(day.completeness)}`));
        }
        return lines;
      }, [data, threshold]);
      const copyPrompt = useCallback(async () => {
        try {
          await navigator.clipboard.writeText(promptLines().join("\n"));
          setNotice({ tone: "ok", text: "\u5F53\u524D\u6C47\u603B\u5DF2\u590D\u5236\uFF0C\u53EF\u76F4\u63A5\u7C98\u8D34\u7ED9 AI\u3002" });
        } catch {
          setNotice({ tone: "error", text: "\u6D4F\u89C8\u5668\u6CA1\u6709\u5141\u8BB8\u5199\u5165\u526A\u8D34\u677F\uFF0C\u53EF\u4EE5\u624B\u52A8\u9009\u4E2D\u6587\u5B57\u590D\u5236\u3002" });
        }
      }, [promptLines]);
      const advice = useMemo(() => {
        if (!data) return [];
        const items = [];
        const ranked = data.projects.filter((row) => !row.unassigned && typeof row.completeness === "number").sort((left, right) => left.completeness - right.completeness);
        if (ranked[0] && ranked[0].nonCompliant > 0) {
          items.push({
            tone: "bad",
            title: `\u5148\u770B ${ranked[0].name}`,
            text: `${ranked[0].devices} \u53F0\u8BBE\u5907\u5E73\u5747\u5B8C\u6210\u7387 ${pct(ranked[0].completeness)}\uFF0C\u5176\u4E2D ${ranked[0].nonCompliant} \u53F0\u4F4E\u4E8E ${pct(threshold)}\uFF0C\u8FD1 7 \u5929\u5B8C\u6210 ${area(ranked[0].area7d)}\u3002`
          });
        } else if (ranked[0]) {
          items.push({
            tone: "warn",
            title: `${ranked[0].name} \u76F8\u5BF9\u504F\u4F4E`,
            text: `\u5E73\u5747\u5B8C\u6210\u7387 ${pct(ranked[0].completeness)}\uFF0C\u4ECD\u9AD8\u4E8E\u8FBE\u6807\u7EBF\uFF0C\u53EF\u5173\u6CE8\u6392\u73ED\u662F\u5426\u8986\u76D6\u5168\u533A\u57DF\u3002`
          });
        }
        if (data.totals.unassigned > 0) {
          items.push({
            tone: "warn",
            title: "\u6709\u8BBE\u5907\u6CA1\u6709\u5F52\u5C5E\u9879\u76EE",
            text: `${data.totals.unassigned} \u53F0\u8BBE\u5907\u6CA1\u6709\u9879\u76EE\u5F52\u5C5E\uFF0C\u4EFB\u52A1\u548C\u5B8C\u6210\u7387\u4E0D\u4F1A\u8BA1\u5165\u4EFB\u4F55\u9879\u76EE\uFF0C\u5EFA\u8BAE\u5148\u5728\u5E73\u53F0\u8865\u9F50\u5F52\u5C5E\u3002`
          });
        }
        if (data.totals.alerts > 0) {
          const projects = [...new Set(data.devices.filter((entry) => entry.alerts > 0).map((entry) => entry.project))].filter((name) => name && name !== "\u672A\u5F52\u5C5E\u9879\u76EE");
          items.push({
            tone: "bad",
            title: `${data.totals.alerts} \u6761\u5F85\u5904\u7406\u544A\u8B66`,
            text: projects.length ? `\u96C6\u4E2D\u5728 ${projects.slice(0, 3).join("\u3001")}\uFF0C\u5EFA\u8BAE\u5148\u5904\u7406\u544A\u8B66\u6D89\u53CA\u7684\u8BBE\u5907\u3002` : "\u5EFA\u8BAE\u9010\u53F0\u67E5\u770B\u544A\u8B66\u5185\u5BB9\uFF0C\u786E\u8BA4\u662F\u5426\u9700\u8981\u73B0\u573A\u5904\u7406\u3002"
          });
        }
        if (items.length < 3 && data.totals.offline > 0) {
          items.push({
            tone: "warn",
            title: `${data.totals.offline} \u53F0\u8BBE\u5907\u79BB\u7EBF`,
            text: "\u79BB\u7EBF\u8BBE\u5907\u5F53\u5929\u4E0D\u8BA1\u4EFB\u52A1\uFF1B\u5982\u679C\u96C6\u4E2D\u5728\u4E00\u4E2A\u9879\u76EE\uFF0C\u4F1A\u62C9\u4F4E\u8BE5\u9879\u76EE\u6574\u4F53\u5B8C\u6210\u7387\u3002"
          });
        }
        if (!items.length) {
          items.push({ tone: "ok", title: "\u6574\u4F53\u8FD0\u884C\u6B63\u5E38", text: "\u5404\u9879\u76EE\u5B8C\u6210\u7387\u90FD\u5728\u8FBE\u6807\u7EBF\u4EE5\u4E0A\uFF0C\u4E5F\u6CA1\u6709\u5F85\u5904\u7406\u544A\u8B66\u3002" });
        }
        return items.slice(0, 3);
      }, [data, threshold]);
      const riskyProjects = useMemo(() => data ? data.projects.filter((row) => row.nonCompliant > 0).length : 0, [data]);
      const alertProjects = useMemo(() => {
        if (!data) return 0;
        return new Set(data.devices.filter((entry) => entry.alerts > 0).map((entry) => entry.project)).size;
      }, [data]);
      const riskyList = () => {
        const rows = data.projects.filter((row) => !row.unassigned && row.nonCompliant > 0).sort((left, right) => right.nonCompliant - left.nonCompliant).slice(0, 3);
        if (!rows.length) return null;
        return h(
          "div",
          { className: "roMiniList" },
          rows.map((row) => h(
            "div",
            { className: "roMiniRow", key: row.name },
            h("span", { className: "roMiniName", title: row.name }, row.name),
            h("span", { className: "roMiniValue roWarn" }, `${row.nonCompliant} \u53F0`)
          ))
        );
      };
      const alertList = () => {
        const rows = data.devices.filter((entry) => entry.alerts > 0).sort((left, right) => right.alerts - left.alerts).slice(0, 3);
        if (!rows.length) return null;
        return h(
          "div",
          { className: "roMiniList" },
          rows.map((entry) => h(
            "div",
            { className: "roMiniRow", key: entry.sn },
            h("span", { className: "roMiniName", title: `${entry.alias} \xB7 ${entry.project}` }, entry.alias),
            h("span", { className: "roMiniValue roWarn" }, `${entry.alerts} \u6761`)
          ))
        );
      };
      const outputStats = () => {
        const days = data.trend ?? [];
        if (!days.length) return null;
        const total = days.reduce((sum, day) => sum + day.area, 0);
        const average = total / days.length;
        const peak = days.reduce((best, day) => day.area > best.area ? day : best, days[0]);
        return h(
          "div",
          { className: "roOutputStats" },
          h("div", { className: "roOutputStat" }, h("b", null, compactArea(average)), h("span", null, "\u65E5\u5747\u33A1")),
          h("div", { className: "roOutputStat" }, h("b", null, compactArea(peak.area)), h("span", null, `\u5CF0\u503C ${dayLabel(peak.date)}`))
        );
      };
      const projectRows = useMemo(() => {
        if (!data) return [];
        const rows = [...data.projects];
        if (sortKey === "nonCompliant") rows.sort((left, right) => right.nonCompliant - left.nonCompliant || (left.completeness ?? 1) - (right.completeness ?? 1));
        else if (sortKey === "area7d") rows.sort((left, right) => right.area7d - left.area7d);
        else rows.sort((left, right) => (left.completeness ?? -1) - (right.completeness ?? -1));
        return rows;
      }, [data, sortKey]);
      const focusDevices = useMemo(() => {
        if (!data) return [];
        const worked = [...data.devices].filter((entry) => typeof entry.completeness === "number" && entry.area7d > 0).sort((left, right) => left.completeness - right.completeness);
        const idle = [...data.devices].filter((entry) => typeof entry.completeness === "number" && entry.area7d <= 0).sort((left, right) => String(left.status) === "990" ? 1 : -1);
        return [...worked, ...idle].slice(0, 4);
      }, [data]);
      const currentProject = view.name === "project" ? data?.projects?.find((row) => row.name === view.project) : null;
      const projectDevices = useMemo(() => {
        if (!data || view.name !== "project") return [];
        const q = query.trim().toLowerCase();
        return data.devices.filter((entry) => entry.project === view.project).filter((entry) => q ? entry.alias.toLowerCase().includes(q) || entry.sn.toLowerCase().includes(q) : true).filter((entry) => onlyLow ? typeof entry.completeness === "number" && entry.completeness < threshold : true).sort((left, right) => (left.completeness ?? -1) - (right.completeness ?? -1));
      }, [data, view, query, onlyLow, threshold]);
      const alertDevices = useMemo(() => (data?.devices ?? []).filter((entry) => entry.alerts > 0).sort((left, right) => right.alerts - left.alerts), [data]);
      const crumb = view.name === "projects" ? "\u5168\u90E8\u9879\u76EE" : view.name === "alerts" ? "\u5F85\u5904\u7406\u544A\u8B66" : view.name === "project" ? view.project || "\u9879\u76EE" : view.name === "device" ? device?.device?.alias || data?.devices?.find((entry) => entry.sn === view.sn)?.alias || "\u8BBE\u5907" : "";
      const back = useCallback(() => {
        if (view.name === "alerts") {
          setView({ name: "overview" });
          return;
        }
        if (view.name === "device") {
          const found = data?.devices?.find((entry) => entry.sn === view.sn);
          setView(found ? { name: "project", project: found.project } : { name: "overview" });
          return;
        }
        setView({ name: "overview" });
      }, [view, data]);
      const rowKey = (onClick) => ({
        role: "button",
        tabIndex: 0,
        onClick,
        onKeyDown: (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onClick();
          }
        }
      });
      const toolbar = h(
        "header",
        { className: "roBar", "data-dsh-workbench-toolbar": "" },
        h(
          "div",
          { className: "roBarLeft" },
          view.name !== "overview" ? h("button", { type: "button", className: "roBtn roBtn--ghost", onClick: back, title: "\u8FD4\u56DE\u4E0A\u4E00\u7EA7" }, "\u2190 \u8FD4\u56DE") : null,
          h("span", { className: "roTitle" }, h("span", { className: "roTitleMark" }, "\u25C6"), COPY.title),
          crumb ? h("span", { className: "roCrumb", title: crumb }, crumb) : null
        ),
        h(
          "div",
          { className: "roBarRight" },
          h("span", { className: "roStamp" }, data?.fetchedAt ? `${timeText(data.fetchedAt)} \u66F4\u65B0` : "\u5C1A\u672A\u53D6\u6570"),
          h("button", { type: "button", className: "roBtn", onClick: () => load(true), disabled: loading, title: "\u91CD\u65B0\u62C9\u53D6\u5E73\u53F0\u6570\u636E" }, loading ? COPY.refreshing : COPY.refresh),
          h("button", { type: "button", className: "roBtn", onClick: startAi, disabled: aiBusy }, aiBusy ? COPY.aiBusy : COPY.ai),
          chatOpen ? h("button", { type: "button", className: "roBtn roBtn--ghost", onClick: () => setChatOpen(false) }, "\u6536\u8D77\u5BF9\u8BDD") : null
        )
      );
      const notices = h(
        "div",
        null,
        error ? h("div", { className: "roNotice roNotice--error", role: "alert" }, `${COPY.loadFailed}\uFF1A${error.message}`) : null,
        notice ? h("div", { className: `roNotice${notice.tone === "ok" ? " roNotice--ok" : notice.tone === "error" ? " roNotice--error" : " roNotice--warn"}`, role: "status" }, notice.text) : null
      );
      const ringCard = () => {
        const total = data.totals.robots || 0;
        const online = data.totals.online || 0;
        const rate = total > 0 ? online / total : 0;
        const dash = Math.round(RING_LENGTH * rate * 100) / 100;
        return h(
          "section",
          { className: "roCard roCard--hero roSpan2", "aria-label": "\u8BBE\u5907\u5728\u7EBF\u7387" },
          h(
            "div",
            { className: "roCardHead" },
            h("span", { className: "roCardLabel" }, "\u8BBE\u5907\u5728\u7EBF\u7387"),
            h("span", { className: "roCardTag" }, "\u5B9E\u65F6")
          ),
          h(
            "div",
            { className: "roRingWrap" },
            h(
              "svg",
              { viewBox: "0 0 128 128", className: "roRing", role: "img", "aria-label": `\u5728\u7EBF\u7387 ${pct(rate)}` },
              h("circle", { cx: 64, cy: 64, r: RING_RADIUS, className: "roRingTrack" }),
              h("circle", {
                cx: 64,
                cy: 64,
                r: RING_RADIUS,
                className: "roRingValue",
                strokeDasharray: `${dash} ${Math.round((RING_LENGTH - dash) * 100) / 100}`,
                transform: "rotate(-90 64 64)"
              })
            ),
            h(
              "div",
              { className: "roRingCenter" },
              h("div", { className: "roRingNumber" }, pct(rate)),
              h("div", { className: "roRingHint" }, `${number(online)} / ${number(total)} \u53F0\u5728\u7EBF`)
            )
          ),
          h(
            "div",
            { className: "roMiniStats" },
            miniStatusGroups(data.statusGroups ?? []).map((group) => h(
              "div",
              { className: "roMiniStat", key: group.label },
              h("b", { className: group.label === "\u79BB\u7EBF" && group.count > 0 ? "roWarn" : "" }, number(group.count)),
              h("span", { title: group.label }, group.label)
            ))
          )
        );
      };
      const outputCard = () => h(
        "section",
        { className: "roCard roCard--gold roSpan2", "aria-label": "\u4F5C\u4E1A\u4EA7\u51FA" },
        h(
          "div",
          { className: "roCardHead" },
          h("span", { className: "roCardLabel" }, "\u8FD1 7 \u5929\u4F5C\u4E1A\u4EA7\u51FA"),
          h("span", { className: "roCardTag" }, `\u5B8C\u6210\u7387 ${pct(data.totals.completeness)}`)
        ),
        h("div", { className: "roBigNumber" }, compactArea(data.totals.area7d), h("small", null, "\u33A1")),
        h("div", { className: "roBigSub" }, `${number(data.totals.projects)} \u4E2A\u9879\u76EE \xB7 ${number(data.totals.robots)} \u53F0\u8BBE\u5907\u7D2F\u8BA1\u6E05\u6D01\u9762\u79EF`),
        outputStats(),
        h(
          "div",
          { className: "roOutputRow" },
          h(
            "div",
            { className: "roOutputItem" },
            h("span", { className: "roOutputValue" }, number(data.totals.tasking)),
            h("span", { className: "roOutputLabel" }, "\u53F0\u8BBE\u5907\u6B63\u5728\u6267\u884C\u4EFB\u52A1")
          ),
          h(
            "div",
            { className: "roOutputItem" },
            h("span", { className: "roOutputValue" }, number(data.totals.online)),
            h("span", { className: "roOutputLabel" }, "\u53F0\u8BBE\u5907\u5728\u7EBF")
          )
        )
      );
      const riskCard = () => h(
        "section",
        { className: "roCard roCard--alert roSpan1", "aria-label": "\u672A\u8FBE\u6807\u8BBE\u5907" },
        h("div", { className: "roCardLabel" }, "\u4F4E\u4E8E\u8FBE\u6807\u7EBF"),
        h("div", { className: "roStatNumber" }, number(data.totals.nonCompliant)),
        h("div", { className: "roStatHint" }, `\u53F0\u8BBE\u5907\u5B8C\u6210\u7387\u4F4E\u4E8E ${pct(threshold)}`),
        h("div", { className: "roStatHint" }, data.totals.nonCompliant > 0 ? `\u5206\u5E03\u5728 ${number(riskyProjects)} \u4E2A\u9879\u76EE\uFF0C\u6700\u9760\u524D\u7684\uFF1A` : "\u5F53\u524D\u6CA1\u6709\u672A\u8FBE\u6807\u8BBE\u5907"),
        riskyList(),
        h("button", {
          type: "button",
          className: "roLink",
          onClick: () => {
            setOnlyLow(true);
            setView({ name: "projects" });
          }
        }, "\u6309\u9879\u76EE\u67E5\u770B \u2192")
      );
      const alertCard = () => h(
        "section",
        { className: "roCard roSpan1", "aria-label": "\u5F85\u5904\u7406\u544A\u8B66" },
        h("div", { className: "roCardLabel" }, "\u5F85\u5904\u7406\u544A\u8B66"),
        h("div", { className: `roStatNumber${data.totals.alerts > 0 ? " roWarn" : ""}` }, number(data.totals.alerts)),
        h("div", { className: "roStatHint" }, data.totals.alerts > 0 ? "\u6761\u672A\u5904\u7406\u544A\u8B66" : "\u6682\u65E0\u672A\u5904\u7406\u544A\u8B66"),
        data.totals.alerts > 0 ? h("div", { className: "roStatHint" }, `\u6D89\u53CA ${number(alertProjects)} \u4E2A\u9879\u76EE\uFF0C\u6700\u9760\u524D\u7684\uFF1A`) : null,
        alertList(),
        h("button", {
          type: "button",
          className: "roLink",
          onClick: () => setView({ name: "alerts" })
        }, data.totals.alerts > 0 ? `\u67E5\u770B ${number(data.totals.alerts)} \u6761\u544A\u8B66 \u2192` : "\u67E5\u770B\u544A\u8B66\u8BB0\u5F55 \u2192")
      );
      const trendCard = () => {
        const days = data.trend ?? [];
        const max = Math.max(1, ...days.map((day) => day.area));
        const avg = days.length ? days.reduce((sum, day) => sum + (day.completeness ?? 0), 0) / days.length : 0;
        return h(
          "section",
          { className: "roCard roSpan4", "aria-label": "\u8FD1 7 \u5929\u8D8B\u52BF" },
          h(
            "div",
            { className: "roCardHead" },
            h("span", { className: "roCardLabel" }, "\u8FD1 7 \u5929\u6E05\u6D01\u9762\u79EF\u8D8B\u52BF"),
            h("span", { className: "roCardTag" }, days.length ? `\u5E73\u5747\u5B8C\u6210\u7387 ${pct(avg)}` : "\u6682\u65E0\u8D8B\u52BF\u6570\u636E")
          ),
          days.length ? h(
            "div",
            { className: "roTrend" },
            days.map((day) => h(
              "div",
              { className: "roTrendCol", key: day.date },
              h(
                "div",
                { className: "roTrendBarWrap" },
                h("div", {
                  className: `roTrendBar${day.compliant === false ? " roTrendBar--bad" : ""}`,
                  style: { height: `${Math.max(4, Math.round(day.area / max * 100))}%` },
                  title: `${day.date}\uFF1A${area(day.area)}\uFF0C\u5B8C\u6210\u7387 ${pct(day.completeness)}`
                })
              ),
              h("div", { className: "roTrendValue" }, compactArea(day.area)),
              h("div", { className: "roTrendLabel" }, dayLabel(day.date))
            ))
          ) : h("div", { className: "roCardEmpty" }, "\u5E73\u53F0\u6CA1\u6709\u8FD4\u56DE\u8FD1 7 \u5929\u7684\u9010\u65E5\u6570\u636E\uFF0C\u5237\u65B0\u540E\u518D\u770B\u3002")
        );
      };
      const statusTone = (label) => {
        if (label.includes("\u5145\u7535")) return "amber";
        if (label.includes("\u4EFB\u52A1") || label.includes("\u4F5C\u4E1A") || label.includes("\u5BFC\u822A")) return "gold";
        if (label.includes("\u4F4E\u529F\u8017") || label.includes("\u4F11\u606F")) return "navy";
        if (label === "\u79BB\u7EBF") return "muted";
        return "soft";
      };
      const statusCard = () => {
        const all = data.statusGroups ?? [];
        const total = data.totals.robots || 1;
        const groups = all.length > 6 ? [...all.slice(0, 5), {
          label: "\u5176\u4ED6\u72B6\u6001",
          count: all.slice(5).reduce((sum, group) => sum + group.count, 0),
          pct: all.slice(5).reduce((sum, group) => sum + group.count, 0) / total
        }] : all;
        return h(
          "section",
          { className: "roCard roSpan2", "aria-label": "\u8BBE\u5907\u72B6\u6001\u5206\u5E03" },
          h(
            "div",
            { className: "roCardHead" },
            h("span", { className: "roCardLabel" }, "\u8BBE\u5907\u72B6\u6001\u5206\u5E03"),
            h("span", { className: "roCardTag" }, `${number(data.totals.robots)} \u53F0`)
          ),
          h(
            "div",
            { className: "roSegBar" },
            groups.map((group) => h("div", {
              key: group.label,
              className: `roSeg roSeg--${statusTone(group.label)}`,
              style: { flexGrow: group.count },
              title: `${group.label} ${group.count} \u53F0`
            }))
          ),
          h(
            "div",
            { className: "roStatusRows" },
            groups.map((group) => h(
              "div",
              { className: "roStatusRow", key: group.label },
              h("span", { className: "roStatusName", title: group.label }, group.label),
              h("span", { className: "roStatusCount" }, number(group.count)),
              h(
                "span",
                { className: "roStatusBar" },
                h("span", { className: `roStatusFill roSeg--${statusTone(group.label)}`, style: { width: `${Math.max(2, Math.round(group.pct * 100))}%` } })
              ),
              h("span", { className: "roStatusPct" }, pct(group.pct))
            ))
          ),
          h("div", { className: "roCardFoot" }, `\u5728\u7EBF ${number(data.totals.online)} \u53F0\uFF0C\u5176\u4E2D\u6B63\u5728\u4F5C\u4E1A ${number(data.totals.tasking)} \u53F0\uFF1B\u79BB\u7EBF\u8BBE\u5907\u5F53\u5929\u4E0D\u8BA1\u4EFB\u52A1\u3002`)
        );
      };
      const rankCard = () => {
        const rows = projectRows.filter((row) => !row.unassigned).slice(0, 7);
        return h(
          "section",
          { className: "roCard roSpan4", "aria-label": "\u9879\u76EE\u5B8C\u6210\u7387" },
          h(
            "div",
            { className: "roCardHead" },
            h("span", { className: "roCardLabel" }, "\u9879\u76EE\u5B8C\u6210\u7387\uFF08\u4ECE\u4F4E\u5230\u9AD8\uFF09"),
            h("button", { type: "button", className: "roLink", onClick: () => setView({ name: "projects" }) }, `\u5168\u90E8 ${number(data.projects.length)} \u4E2A \u2192`)
          ),
          rows.length ? h(
            "div",
            { className: "roRank" },
            rows.map((row) => h(
              "div",
              {
                className: "roRankRow",
                key: row.name,
                ...rowKey(() => setView({ name: "project", project: row.name })),
                "aria-label": `\u67E5\u770B\u9879\u76EE ${row.name}`
              },
              h("span", { className: "roRankName", title: row.name }, row.name),
              h(
                "span",
                { className: "roRankBar" },
                h("span", {
                  className: `roRankFill${rateTone(row.completeness, threshold) === "bad" ? " roRankFill--bad" : rateTone(row.completeness, threshold) === "warn" ? " roRankFill--warn" : ""}`,
                  style: { width: `${Math.max(3, Math.min(100, Math.round((row.completeness ?? 0) * 100)))}%` }
                })
              ),
              h("span", { className: "roRankValue" }, pct(row.completeness)),
              h("span", { className: `roRankFlag${row.nonCompliant > 0 ? " roRankFlag--bad" : ""}` }, row.nonCompliant > 0 ? `${row.nonCompliant} \u53F0\u672A\u8FBE\u6807` : "\u8FBE\u6807")
            ))
          ) : h("div", { className: "roCardEmpty" }, "\u8FD8\u6CA1\u6709\u9879\u76EE\u6570\u636E\u3002"),
          h("div", { className: "roCardFoot" }, `\u5B8C\u6210\u7387\u4F4E\u4E8E ${pct(threshold)} \u7684\u9879\u76EE\u6807\u7EA2\uFF0C\u70B9\u9879\u76EE\u540D\u53EF\u770B\u5B83\u4E0B\u9762\u7684\u6BCF\u53F0\u8BBE\u5907\u3002`)
        );
      };
      const adviceCard = () => h(
        "section",
        { className: "roCard roCard--advice roSpan2", "aria-label": "AI \u5EFA\u8BAE" },
        h(
          "div",
          { className: "roCardHead" },
          h("span", { className: "roCardLabel" }, h("span", { className: "roAdviceMark" }, "\u2726"), " AI \u5EFA\u8BAE"),
          h("span", { className: "roCardTag" }, "\u6309\u5F53\u524D\u6570\u636E\u751F\u6210")
        ),
        h(
          "div",
          { className: "roAdviceList" },
          advice.map((item, index) => h(
            "div",
            { className: `roAdviceItem roAdviceItem--${item.tone}`, key: `${item.title}-${index}` },
            h("div", { className: "roAdviceTitle" }, item.title),
            h("div", { className: "roAdviceText" }, item.text)
          ))
        ),
        h(
          "div",
          { className: "roAdviceFoot" },
          h("button", { type: "button", className: "roBtn roBtn--primary", onClick: startAi, disabled: aiBusy }, aiBusy ? COPY.aiBusy : "\u8BA9 AI \u5C55\u5F00\u5206\u6790"),
          h("button", { type: "button", className: "roBtn", onClick: copyPrompt }, "\u590D\u5236\u6C47\u603B")
        )
      );
      const focusCard = () => {
        if (!focusDevices.length) return null;
        return h(
          "section",
          { className: "roCard roSpan6", "aria-label": "\u9700\u8981\u5173\u6CE8\u7684\u8BBE\u5907" },
          h(
            "div",
            { className: "roCardHead" },
            h("span", { className: "roCardLabel" }, "\u9700\u8981\u5173\u6CE8\u7684\u8BBE\u5907"),
            h("span", { className: "roCardTag" }, "\u8FD1 7 \u5929\u5B8C\u6210\u7387\u6700\u4F4E")
          ),
          h(
            "div",
            { className: "roFocusGrid" },
            focusDevices.map((entry) => h(
              "div",
              {
                className: "roFocusCard",
                key: entry.sn,
                ...rowKey(() => openDevice(entry.sn)),
                "aria-label": `\u67E5\u770B\u8BBE\u5907 ${entry.alias}`
              },
              h(
                "div",
                { className: "roFocusTop" },
                h("span", { className: `roDot${entry.online ? " roDot--on" : ""}` }),
                h("span", { className: "roFocusName", title: entry.alias }, entry.alias)
              ),
              h("div", { className: "roFocusProject", title: entry.project }, entry.project),
              h(
                "div",
                { className: "roFocusBottom" },
                h("span", { className: "roFocusRate" }, entry.area7d > 0 ? pct(entry.completeness) : "\u65E0\u4F5C\u4E1A"),
                h("span", { className: "roFocusMeta" }, entry.area7d > 0 ? `${compactArea(entry.area7d)} \u33A1 \xB7 ${entry.statusText}` : `\u8FD1 7 \u5929 0 \u33A1 \xB7 ${entry.statusText}`),
                entry.alerts > 0 ? h("span", { className: "roBadge roBadge--bad" }, `${entry.alerts} \u6761\u544A\u8B66`) : null
              )
            ))
          )
        );
      };
      const renderOverview = () => {
        if (loading && !data) {
          return h("div", { className: "roEmpty" }, h("div", { className: "roEmptyTitle" }, "\u6B63\u5728\u8BFB\u53D6\u673A\u5668\u4EBA\u8FD0\u884C\u6570\u636E\u2026"));
        }
        if (!data) {
          const missingSession = error?.code === "NO_SESSION" || error?.code === "BAD_SESSION" || error?.code === "SESSION_EXPIRED";
          return h(
            "div",
            { className: "roEmpty" },
            h("div", { className: "roEmptyTitle" }, missingSession ? "\u5148\u767B\u5F55\u9AD8\u4ED9\u673A\u5668\u4EBA\u5E73\u53F0" : COPY.emptyTitle),
            h("div", { className: "roEmptyText" }, missingSession ? "\u4F1A\u6253\u5F00\u4E00\u4E2A\u72EC\u7ACB\u7684\u6D4F\u89C8\u5668\u7A97\u53E3\uFF0C\u7528\u4F60\u7684\u9AD8\u4ED9\u8D26\u53F7\u767B\u5F55\uFF08\u548C MCP \u7528\u7684\u662F\u540C\u4E00\u79CD\u767B\u5F55\u65B9\u5F0F\uFF09\u3002\u8D26\u53F7\u5BC6\u7801\u4E0D\u7ECF\u8FC7\u8FD9\u4E2A\u5DE5\u4F5C\u53F0\uFF0C\u767B\u5F55\u6210\u529F\u540E\u4F1A\u8BDD\u4FDD\u5B58\u5728\u672C\u673A\uFF0C\u8FD9\u91CC\u4F1A\u81EA\u52A8\u5237\u65B0\u3002" : error?.message || "\u8BFB\u53D6\u6570\u636E\u65F6\u51FA\u9519\u4E86\u3002"),
            missingSession ? h("div", { className: "roEmptyCode" }, "\u767B\u5F55\u7A97\u53E3 10 \u5206\u949F\u5185\u6709\u6548\uFF1B\u5982\u679C\u6CA1\u5F39\u51FA\u6765\uFF0C\u70B9\u4E0B\u9762\u7684\u6309\u94AE\u518D\u5F00\u4E00\u6B21\u3002") : null,
            h(
              "div",
              { className: "roEmptyActions" },
              missingSession ? h("button", { type: "button", className: "roBtn roBtn--primary", onClick: startLogin, disabled: loginBusy }, loginBusy ? "\u6B63\u5728\u6253\u5F00\u2026" : "\u6253\u5F00\u767B\u5F55\u7A97\u53E3") : null,
              h("button", { type: "button", className: "roBtn", onClick: () => load(true) }, COPY.refresh)
            ),
            loginHint ? h("div", { className: "roEmptyText", role: "status" }, loginHint) : null,
            loginLog ? h("pre", { className: "roLog" }, loginLog) : null
          );
        }
        return h(
          "div",
          null,
          h(
            "div",
            { className: "roHero" },
            h(
              "div",
              null,
              h("h1", { className: "roH1" }, COPY.overviewTitle),
              h("p", { className: "roSub" }, `${number(data.totals.projects)} \u4E2A\u9879\u76EE \xB7 ${number(data.totals.robots)} \u53F0\u8BBE\u5907 \xB7 \u6570\u636E\u6765\u81EA\u9AD8\u4ED9\u5408\u4F5C\u4F19\u4F34\u5E73\u53F0\uFF0C\u53EA\u8BFB`)
            ),
            h(
              "div",
              { className: "roHeroMeta" },
              h("span", { className: "roChip" }, `\u6570\u636E ${timeText(data.fetchedAt)}`),
              h("span", { className: "roChip" }, `\u8FBE\u6807\u7EBF ${pct(threshold)}`)
            )
          ),
          notices,
          h(
            "div",
            { className: "roBento" },
            ringCard(),
            outputCard(),
            riskCard(),
            alertCard(),
            trendCard(),
            statusCard(),
            rankCard(),
            adviceCard(),
            focusCard()
          ),
          h("div", { className: "roFoot" }, "\u5B8C\u6210\u7387\u53E3\u5F84\uFF1A\u5E73\u53F0\u8FBE\u6807\u7EBF 20%\uFF1B\u9762\u79EF\u4E0E\u5B8C\u6210\u7387\u4E3A\u8FD1 7 \u5929\u7D2F\u8BA1\u3002\u6570\u636E\u53EA\u8BFB\uFF0C\u4E0D\u4F1A\u6539\u52A8\u5E73\u53F0\u8BBE\u7F6E\u3002")
        );
      };
      const renderAlerts = () => {
        if (!data) return null;
        const devices = alertData?.devices ?? [];
        return h(
          "div",
          null,
          h(
            "div",
            { className: "roHead" },
            h(
              "div",
              null,
              h("h1", { className: "roH1" }, "\u5F85\u5904\u7406\u544A\u8B66"),
              h("p", { className: "roSub" }, `${number(data.totals.alerts)} \u6761\u672A\u5904\u7406\u544A\u8B66\uFF0C\u6D89\u53CA ${number(alertProjects)} \u4E2A\u9879\u76EE\u3001${number(alertDevices.length)} \u53F0\u8BBE\u5907\u3002\u70B9\u8BBE\u5907\u5361\u7247\u53EF\u4EE5\u76F4\u63A5\u770B\u5B83\u7684\u4EFB\u52A1\u8D8B\u52BF\u3002`)
            )
          ),
          notices,
          alertLoading && !alertData ? h("div", { className: "roEmpty" }, h("div", { className: "roEmptyTitle" }, "\u6B63\u5728\u8BFB\u53D6\u544A\u8B66\u5185\u5BB9\u2026")) : devices.length ? h(
            "div",
            { className: "roAlertGrid" },
            devices.map((entry) => h(
              "div",
              {
                className: "roAlertCard",
                key: entry.sn,
                ...rowKey(() => openDevice(entry.sn)),
                "aria-label": `\u67E5\u770B\u8BBE\u5907 ${entry.alias}`
              },
              h(
                "div",
                { className: "roAlertHead" },
                h("span", { className: `roDot${entry.online ? " roDot--on" : ""}` }),
                h("span", { className: "roAlertName", title: entry.alias }, entry.alias),
                h("span", { className: "roBadge roBadge--bad" }, `${number(entry.alerts)} \u6761`)
              ),
              h("div", { className: "roAlertMeta" }, `${entry.project} \xB7 ${entry.online ? entry.statusText : "\u79BB\u7EBF"} \xB7 \u5B8C\u6210\u7387 ${pct(entry.completeness)}`),
              entry.items.length ? h(
                "div",
                { className: "roAlertItems" },
                entry.items.slice(0, 3).map((alert, index) => h(
                  "div",
                  { className: "roAlertItem", key: `${alert.startTime}-${index}` },
                  h("span", { className: `roLevel${/^H[0-4]$/.test(alert.level) ? " roLevel--high" : ""}` }, alert.level || "\u544A\u8B66"),
                  h("span", { className: "roAlertTitle", title: alert.title }, alert.title || "\u672A\u547D\u540D\u544A\u8B66"),
                  h("span", { className: "roAlertTime" }, clockText(alert.startTime))
                ))
              ) : h("div", { className: "roAlertEmpty" }, "\u5E73\u53F0\u6CA1\u6709\u8FD4\u56DE\u544A\u8B66\u660E\u7EC6\uFF0C\u53EF\u70B9\u5F00\u8BBE\u5907\u67E5\u770B\u3002")
            ))
          ) : h(
            "div",
            { className: "roEmpty" },
            h("div", { className: "roEmptyTitle" }, "\u5F53\u524D\u6CA1\u6709\u5F85\u5904\u7406\u544A\u8B66"),
            h("div", { className: "roEmptyText" }, "\u5E73\u53F0\u6700\u8FD1\u4E00\u6B21\u540C\u6B65\u91CC\u6CA1\u6709\u672A\u5904\u7406\u544A\u8B66\uFF1B\u6709\u65B0\u7684\u544A\u8B66\u4F1A\u5728\u9996\u9875\u63D0\u793A\u3002")
          )
        );
      };
      const renderProjects = () => {
        if (!data) return null;
        return h(
          "div",
          null,
          h(
            "div",
            { className: "roHead" },
            h(
              "div",
              null,
              h("h1", { className: "roH1" }, "\u5168\u90E8\u9879\u76EE"),
              h("p", { className: "roSub" }, `${number(data.projects.length)} \u4E2A\u9879\u76EE\uFF0C\u6309${sortKey === "area7d" ? "\u9762\u79EF" : sortKey === "nonCompliant" ? "\u672A\u8FBE\u6807\u53F0\u6570" : "\u5B8C\u6210\u7387"}\u6392\u5217`)
            ),
            h(
              "div",
              { className: "roChips" },
              [["completeness", "\u6309\u5B8C\u6210\u7387"], ["nonCompliant", "\u6309\u672A\u8FBE\u6807"], ["area7d", "\u6309\u9762\u79EF"]].map(([key, label]) => h("button", {
                key,
                type: "button",
                className: `roBtn${sortKey === key ? " roBtn--active" : " roBtn--ghost"}`,
                onClick: () => setSortKey(key)
              }, label))
            )
          ),
          notices,
          h(
            "div",
            { className: "roTable" },
            h(
              "div",
              { className: "roPHead" },
              h("span", { className: "roPCell" }, "\u9879\u76EE"),
              h("span", { className: "roPCell roPCell--num" }, "\u8BBE\u5907"),
              h("span", { className: "roPCell roPCell--num" }, "\u5728\u7EBF"),
              h("span", { className: "roPCell roPCell--num" }, "\u4EFB\u52A1\u4E2D"),
              h("span", { className: "roPCell" }, "\u8FD1 7 \u5929\u5B8C\u6210\u7387"),
              h("span", { className: "roPCell roPCell--num" }, "\u672A\u8FBE\u6807"),
              h("span", { className: "roPCell roPCell--num" }, "\u8FD1 7 \u5929\u9762\u79EF"),
              h("span", { className: "roPCell roPCell--num" }, "\u544A\u8B66")
            ),
            projectRows.map((row) => h(
              "div",
              {
                className: "roPRow",
                key: row.name,
                ...rowKey(() => setView({ name: "project", project: row.name })),
                "aria-label": `\u67E5\u770B\u9879\u76EE ${row.name}`
              },
              h("span", { className: "roPCell roPCell--name", "data-label": "\u9879\u76EE", title: row.name }, row.name),
              h("span", { className: "roPCell roPCell--num", "data-label": "\u8BBE\u5907" }, number(row.devices)),
              h("span", { className: "roPCell roPCell--num", "data-label": "\u5728\u7EBF" }, number(row.online)),
              h("span", { className: "roPCell roPCell--num", "data-label": "\u4EFB\u52A1\u4E2D" }, number(row.tasking)),
              h(
                "span",
                { className: "roPCell", "data-label": "\u5B8C\u6210\u7387" },
                h(
                  "span",
                  { className: "roRateCell" },
                  h("span", { className: "roBarTrack roRateTrack" }, h("span", {
                    className: `roBarFill${rateTone(row.completeness, threshold) === "bad" ? " roBarFill--bad" : rateTone(row.completeness, threshold) === "warn" ? " roBarFill--warn" : ""}`,
                    style: { width: `${Math.max(2, Math.min(100, Math.round((row.completeness ?? 0) * 100)))}%` }
                  })),
                  h("span", { className: "roRateNum" }, pct(row.completeness))
                )
              ),
              h("span", { className: `roPCell roPCell--num${row.nonCompliant > 0 ? " roPCell--warn" : ""}`, "data-label": "\u672A\u8FBE\u6807" }, number(row.nonCompliant)),
              h("span", { className: "roPCell roPCell--num", "data-label": "\u9762\u79EF" }, area(row.area7d)),
              h("span", { className: `roPCell roPCell--num${row.alerts > 0 ? " roPCell--warn" : ""}`, "data-label": "\u544A\u8B66" }, number(row.alerts))
            ))
          )
        );
      };
      const renderProject = () => {
        if (!data) return null;
        if (!currentProject) {
          return h(
            "div",
            { className: "roEmpty" },
            h("div", { className: "roEmptyTitle" }, "\u8FD9\u4E2A\u9879\u76EE\u5DF2\u7ECF\u4E0D\u5728\u6700\u65B0\u6570\u636E\u91CC"),
            h("div", { className: "roEmptyText" }, "\u53EF\u80FD\u662F\u5E73\u53F0\u4E0A\u7684\u9879\u76EE\u88AB\u6539\u540D\u6216\u79FB\u9664\uFF0C\u5237\u65B0\u540E\u518D\u770B\u3002"),
            h("div", { className: "roEmptyActions" }, h("button", { type: "button", className: "roBtn", onClick: () => setView({ name: "overview" }) }, "\u56DE\u5230\u603B\u89C8"))
          );
        }
        return h(
          "div",
          null,
          h(
            "div",
            { className: "roHead" },
            h(
              "div",
              null,
              h("h1", { className: "roH1" }, currentProject.name),
              h("p", { className: "roSub" }, currentProject.unassigned ? "\u8FD9\u4E9B\u8BBE\u5907\u5728\u5E73\u53F0\u4E0A\u6CA1\u6709\u5F52\u5C5E\u9879\u76EE\uFF0C\u4EFB\u52A1\u548C\u5B8C\u6210\u7387\u65E0\u6CD5\u8BA1\u5165\u4EFB\u4F55\u9879\u76EE\u3002" : `\u5171 ${number(currentProject.devices)} \u53F0\u8BBE\u5907\uFF0C\u5728\u7EBF ${number(currentProject.online)} \u53F0\u3002`)
            ),
            h(
              "div",
              { className: "roChips" },
              h("span", { className: "roChip" }, `\u8BBE\u5907 ${number(currentProject.devices)}`),
              h("span", { className: "roChip" }, `\u4EFB\u52A1\u4E2D ${number(currentProject.tasking)}`),
              h("span", { className: `roChip${currentProject.nonCompliant > 0 ? " roChip--bad" : " roChip--good"}` }, `\u672A\u8FBE\u6807 ${number(currentProject.nonCompliant)}`),
              h("span", { className: "roChip" }, `\u8FD1 7 \u5929 ${area(currentProject.area7d)}`),
              h("span", { className: "roChip" }, `\u5B8C\u6210\u7387 ${pct(currentProject.completeness)}`)
            )
          ),
          notices,
          h(
            "div",
            { className: "roControls" },
            h("input", {
              className: "roInput",
              type: "search",
              placeholder: "\u641C\u7D22\u8BBE\u5907\u540D\u79F0\u6216\u7F16\u53F7",
              value: query,
              onChange: (event) => setQuery(event.target.value),
              "aria-label": "\u641C\u7D22\u8BBE\u5907"
            }),
            h(
              "label",
              { className: "roCheck" },
              h("input", { type: "checkbox", checked: onlyLow, onChange: (event) => setOnlyLow(event.target.checked) }),
              h("span", null, `\u53EA\u770B\u4F4E\u4E8E ${pct(threshold)}`)
            ),
            h("span", { className: "roHint" }, `\u663E\u793A ${projectDevices.length} \u53F0`)
          ),
          projectDevices.length ? h(
            "div",
            { className: "roTable" },
            h(
              "div",
              { className: "roDHead" },
              h("span", { className: "roDCell" }, "\u8BBE\u5907"),
              h("span", { className: "roDCell" }, "\u72B6\u6001"),
              h("span", { className: "roDCell roDCell--num" }, "\u8FD1 7 \u5929\u9762\u79EF"),
              h("span", { className: "roDCell" }, "\u8FD1 7 \u5929\u5B8C\u6210\u7387"),
              h("span", { className: "roDCell roDCell--num" }, "\u544A\u8B66")
            ),
            projectDevices.map((entry) => h(
              "div",
              {
                className: "roDRow",
                key: entry.sn,
                ...rowKey(() => openDevice(entry.sn)),
                "aria-label": `\u67E5\u770B\u8BBE\u5907 ${entry.alias}`
              },
              h("span", { className: "roDCell roDCell--name", "data-label": "\u8BBE\u5907", title: `${entry.alias}\uFF08${entry.sn}\uFF09` }, entry.alias),
              h("span", { className: "roDCell roDCell--sub", "data-label": "\u72B6\u6001" }, entry.online ? entry.statusText : "\u79BB\u7EBF"),
              h("span", { className: "roDCell roDCell--num", "data-label": "\u9762\u79EF" }, area(entry.area7d)),
              h(
                "span",
                { className: "roDCell", "data-label": "\u5B8C\u6210\u7387" },
                h(
                  "span",
                  { className: "roRateCell" },
                  h("span", { className: "roBarTrack roRateTrack" }, h("span", {
                    className: `roBarFill${rateTone(entry.completeness, threshold) === "bad" ? " roBarFill--bad" : rateTone(entry.completeness, threshold) === "warn" ? " roBarFill--warn" : ""}`,
                    style: { width: `${Math.max(2, Math.min(100, Math.round((entry.completeness ?? 0) * 100)))}%` }
                  })),
                  h("span", { className: "roRateNum" }, pct(entry.completeness))
                )
              ),
              h("span", { className: `roDCell roDCell--num${entry.alerts > 0 ? " roDCell--warn" : ""}`, "data-label": "\u544A\u8B66" }, number(entry.alerts))
            ))
          ) : h("div", { className: "roEmpty" }, h("div", { className: "roEmptyTitle" }, "\u6CA1\u6709\u7B26\u5408\u6761\u4EF6\u7684\u8BBE\u5907"), h("div", { className: "roEmptyText" }, "\u6362\u4E2A\u5173\u952E\u8BCD\uFF0C\u6216\u53D6\u6D88\u201C\u53EA\u770B\u4F4E\u4E8E\u8FBE\u6807\u7EBF\u201D\u7684\u7B5B\u9009\u3002"))
        );
      };
      const renderDevice = () => {
        if (deviceLoading && !device) return h("div", { className: "roEmpty" }, h("div", { className: "roEmptyTitle" }, "\u6B63\u5728\u8BFB\u53D6\u8BBE\u5907\u660E\u7EC6\u2026"));
        if (!device) {
          return h(
            "div",
            { className: "roEmpty" },
            h("div", { className: "roEmptyTitle" }, "\u6CA1\u6709\u62FF\u5230\u8FD9\u53F0\u8BBE\u5907\u7684\u6570\u636E"),
            h("div", { className: "roEmptyText" }, notice?.text || "\u53EF\u80FD\u662F\u7F51\u7EDC\u6216\u767B\u5F55\u95EE\u9898\uFF0C\u8FD4\u56DE\u540E\u91CD\u8BD5\u3002"),
            h("div", { className: "roEmptyActions" }, h("button", { type: "button", className: "roBtn", onClick: () => openDevice(view.sn) }, "\u91CD\u8BD5"))
          );
        }
        const entry = device.device;
        const window2 = device.window;
        const maxArea = Math.max(1, ...window2.days.map((day) => day.area));
        return h(
          "div",
          null,
          h(
            "div",
            { className: "roDeviceHead" },
            h(
              "div",
              null,
              h("h1", { className: "roDeviceName" }, entry.alias),
              h("div", { className: "roDeviceMeta" }, `${entry.sn} \xB7 ${entry.project}${entry.map ? ` \xB7 ${entry.map}` : ""}`)
            ),
            h(
              "div",
              { className: "roChips" },
              h("span", { className: `roChip${entry.online ? " roChip--good" : " roChip--bad"}` }, entry.online ? entry.statusText : "\u79BB\u7EBF"),
              h("span", { className: "roChip" }, `\u5B8C\u6210\u7387 ${pct(entry.completeness)}`),
              h("span", { className: `roChip${entry.alerts > 0 ? " roChip--bad" : ""}` }, `\u672A\u5904\u7406\u544A\u8B66 ${number(entry.alerts)}`)
            )
          ),
          notices,
          h(
            "div",
            { className: "roKpis" },
            h("div", { className: "roKpi" }, h("div", { className: "roKpiLabel" }, "\u8FD1 7 \u5929\u6E05\u6D01\u9762\u79EF"), h("div", { className: "roKpiValue" }, number(window2.overall.area ?? entry.area7d), h("small", null, "\u33A1"))),
            h("div", { className: "roKpi" }, h("div", { className: "roKpiLabel" }, "\u8FD1 7 \u5929\u8986\u76D6\u9762\u79EF"), h("div", { className: "roKpiValue" }, number(window2.overall.coverage ?? entry.coverage7d), h("small", null, "\u33A1"))),
            h("div", { className: "roKpi" }, h("div", { className: "roKpiLabel" }, "\u8FD1 7 \u5929\u5B8C\u6210\u7387"), h("div", { className: "roKpiValue" }, pct(window2.overall.completeness ?? entry.completeness))),
            h("div", { className: "roKpi" }, h("div", { className: "roKpiLabel" }, "\u5E73\u5747\u6548\u7387"), h("div", { className: "roKpiValue" }, number(window2.overall.productivity), h("small", null, "\u33A1/h"))),
            h("div", { className: "roKpi" }, h("div", { className: "roKpiLabel" }, "\u5F85\u5904\u7406\u544A\u8B66"), h("div", { className: `roKpiValue${entry.alerts > 0 ? " roKpiValue--alert" : ""}` }, number(entry.alerts), h("small", null, "\u6761")))
          ),
          h(
            "div",
            { className: "roSection" },
            h(
              "div",
              { className: "roSectionHead" },
              h("h2", { className: "roH2" }, "\u9010\u65E5\u6E05\u6D01\u9762\u79EF"),
              h("span", { className: "roHint" }, `${device.range.startDate} \u81F3 ${device.range.endDate}\uFF0C\u67F1\u9AD8\u6309\u9762\u79EF\uFF0C\u989C\u8272\u8868\u793A\u662F\u5426\u8FBE\u5230 ${pct(threshold)}`)
            ),
            h(
              "div",
              { className: "roChart" },
              h(
                "div",
                { className: "roCols" },
                window2.days.map((day) => h(
                  "div",
                  { className: "roCol", key: day.date },
                  h(
                    "div",
                    { className: "roColBarWrap" },
                    h("div", {
                      className: `roColBar${day.compliant === false ? " roColBar--bad" : day.compliant === true ? " roColBar--good" : ""}`,
                      style: { height: `${Math.max(2, Math.round(day.area / maxArea * 100))}%` },
                      title: `${day.date}\uFF1A${area(day.area)}\uFF0C\u5B8C\u6210\u7387 ${pct(day.completeness)}`
                    })
                  ),
                  h("div", { className: "roColValue" }, number(day.area)),
                  h("div", { className: "roColLabel" }, dayLabel(day.date))
                ))
              )
            )
          ),
          h(
            "div",
            { className: "roSection" },
            h(
              "div",
              { className: "roSectionHead" },
              h("h2", { className: "roH2" }, "\u6700\u8FD1\u4E00\u5468\u544A\u8B66"),
              h("span", { className: "roHint" }, `${device.alerts.length} \u6761`)
            ),
            device.alerts.length ? h(
              "div",
              { className: "roList" },
              device.alerts.map((alert, index) => h(
                "div",
                { className: "roListRow", key: `${alert.startTime}-${index}` },
                h("span", { className: `roLevel${/^H[0-4]$/.test(alert.level) ? " roLevel--high" : ""}` }, alert.level || "\u544A\u8B66"),
                h(
                  "div",
                  { className: "roListMain" },
                  h("div", { className: "roListTitle" }, alert.title || "\u672A\u547D\u540D\u544A\u8B66"),
                  h("div", { className: "roListMeta" }, `${clockText(alert.startTime)} \u5F00\u59CB${alert.endTime ? `\uFF0C${clockText(alert.endTime)} \u7ED3\u675F` : "\uFF0C\u4ECD\u5728\u6301\u7EED"}`)
                )
              ))
            ) : h("div", { className: "roEmpty" }, h("div", { className: "roEmptyTitle" }, "\u8FD1\u4E00\u5468\u6CA1\u6709\u544A\u8B66"), h("div", { className: "roEmptyText" }, "\u8FD9\u53F0\u8BBE\u5907\u6700\u8FD1\u4E00\u5468\u6CA1\u6709\u65B0\u7684\u5E73\u53F0\u544A\u8B66\u8BB0\u5F55\u3002"))
          ),
          h("div", { className: "roFoot" }, "\u8BBE\u5907\u660E\u7EC6\u6765\u81EA\u5E73\u53F0\u4EFB\u52A1\u9762\u677F\u4E0E\u544A\u8B66\u5217\u8868\uFF0C\u53EA\u8BFB\u5C55\u793A\uFF1B\u673A\u5668\u4EBA\u8C03\u5EA6\u4E0E\u4E0B\u53D1\u7559\u5230\u4E8C\u671F\u3002")
        );
      };
      const content = view.name === "overview" ? renderOverview() : view.name === "projects" ? renderProjects() : view.name === "alerts" ? renderAlerts() : view.name === "project" ? renderProject() : renderDevice();
      const body = h("div", { className: "roScroll" }, content);
      const chatArea = chatOpen ? h(
        "aside",
        { className: "roChat", "aria-label": "AI \u534F\u52A9" },
        h(
          "div",
          { className: "roChatHead" },
          h("span", null, "AI \u534F\u52A9 \xB7 \u7ED3\u5408\u5F53\u524D\u6C47\u603B"),
          h("button", { type: "button", className: "roBtn roBtn--ghost", onClick: copyPrompt }, "\u590D\u5236\u6C47\u603B"),
          h("button", { type: "button", className: "roBtn roBtn--ghost", onClick: () => setChatOpen(false) }, "\u6536\u8D77")
        ),
        h("div", { className: "roChatBody" }, conversation)
      ) : null;
      return h(
        "div",
        { className: `roRoot${dark ? " roDark" : ""}` },
        toolbar,
        chatOpen ? h("div", { className: "roSplit" }, h("div", { className: "roSplitMain" }, body), chatArea) : body
      );
    }
    function apply(ctx) {
      const host = {
        sessions: ctx.sessions,
        conversation: ctx.conversation,
        workbenches: ctx.desktopWorkbenches
      };
      const Panel = (props) => h(BusinessPanel, { ...props, host });
      ctx.effect(() => ctx.desktopWorkbenches.register({
        title: COPY.title,
        panelTitle: COPY.title,
        description: "\u6C47\u603B\u5404\u9879\u76EE\u6E05\u6D01\u673A\u5668\u4EBA\u7684\u5728\u7EBF\u3001\u4EFB\u52A1\u3001\u9762\u79EF\u4E0E\u8FBE\u6807\u60C5\u51B5\uFF0C\u53EF\u4E0B\u94BB\u5230\u9879\u76EE\u4E0E\u5355\u53F0\u8BBE\u5907\u7684\u8FD1 7 \u5929\u8D8B\u52BF\u548C\u544A\u8B66\u3002",
        repository: "https://github.com/Zcx-BaixiaoBai/ge-workbench-robot-ops",
        customFrame: true,
        headerLayout: "compact"
      }, Panel), "robot ops workbench registration");
    }
    return { apply, inject: ["desktopWorkbenches", "sessions", "conversation"] };
  }

  // src/styles.js
  var CSS = `
.roRoot {
  --ro-bg: #ffffff;
  --ro-panel: #ffffff;
  --ro-sub: #fafafa;
  --ro-line: #e7e7e7;
  --ro-line-soft: #f2f2f2;
  --ro-text: #101828;
  --ro-muted: #5b6472;
  --ro-faint: #8d95a3;
  --ro-gold: #b58a2b;
  --ro-gold-soft: rgba(181, 138, 43, 0.1);
  --ro-navy: #101828;
  --ro-red: #b23b30;
  --ro-red-soft: rgba(178, 59, 48, 0.08);
  --ro-amber: #9a6a14;
  --ro-green: #1f7a4d;
  --ro-green-soft: rgba(31, 122, 77, 0.08);
  --ro-track: #eef0f3;
  --ro-chip: #f4f5f7;
  --ro-font-ui: -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
  --ro-font-display: var(--ro-font-ui);

  container-type: inline-size;
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  background: var(--ro-bg);
  color: var(--ro-text);
  font-family: var(--ro-font-ui);
  font-size: 14px;
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
}

.roRoot.roDark {
  --ro-bg: #0f0f10;
  --ro-panel: #17181a;
  --ro-sub: #1c1d20;
  --ro-line: #2b2d31;
  --ro-line-soft: #232529;
  --ro-text: #ececea;
  --ro-muted: #a3a7ae;
  --ro-faint: #7c818a;
  --ro-gold: #d3ab5f;
  --ro-gold-soft: rgba(211, 171, 95, 0.14);
  --ro-navy: #ececea;
  --ro-red: #e5877d;
  --ro-red-soft: rgba(229, 135, 125, 0.14);
  --ro-amber: #d8b273;
  --ro-green: #7cc49b;
  --ro-green-soft: rgba(124, 196, 155, 0.12);
  --ro-track: #2a2c30;
  --ro-chip: #202226;
}

.roRoot * { box-sizing: border-box; }

.roBar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 8px 16px;
  min-height: 46px;
  border-bottom: 1px solid var(--ro-line-soft);
  background: var(--ro-bg);
  position: sticky;
  top: 0;
  z-index: 5;
}

.roBarLeft { display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1 1 240px; }
.roBarRight { display: flex; align-items: center; gap: 8px; margin-left: auto; flex-wrap: wrap; }

.roTitle { font-size: 14px; font-weight: 650; letter-spacing: 0.02em; white-space: nowrap; }
.roTitleMark { color: var(--ro-gold); margin-right: 6px; }
.roCrumb { color: var(--ro-muted); font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 40ch; }
.roStamp { color: var(--ro-faint); font-size: 12px; white-space: nowrap; }

.roBtn {
  appearance: none;
  border: 1px solid var(--ro-line);
  background: var(--ro-panel);
  color: var(--ro-text);
  font: inherit;
  font-size: 13px;
  padding: 5px 12px;
  border-radius: 7px;
  cursor: pointer;
  white-space: nowrap;
}
.roBtn:hover { border-color: var(--ro-gold); color: var(--ro-gold); }
.roBtn:focus-visible { outline: 2px solid var(--ro-gold); outline-offset: 2px; }
.roBtn:disabled { opacity: 0.55; cursor: default; }
.roBtn--primary { background: var(--ro-navy); border-color: var(--ro-navy); color: #fff; }
.roBtn--primary:hover { background: #1b2537; border-color: #1b2537; color: #fff; }
.roDark .roBtn--primary { background: var(--ro-gold); border-color: var(--ro-gold); color: #14150f; }
.roDark .roBtn--primary:hover { background: #e0bb75; border-color: #e0bb75; color: #14150f; }
.roBtn--ghost { border-color: transparent; background: transparent; }
.roBtn--ghost:hover { background: var(--ro-chip); }
.roBtn--active { background: var(--ro-navy); border-color: var(--ro-navy); color: #fff; }
.roBtn--active:hover { background: var(--ro-navy); border-color: var(--ro-navy); color: #fff; }
.roDark .roBtn--active { background: var(--ro-gold); border-color: var(--ro-gold); color: #14150f; }
.roDark .roBtn--active:hover { background: var(--ro-gold); border-color: var(--ro-gold); color: #14150f; }

.roSplit { display: flex; flex: 1 1 auto; min-height: 0; }
.roSplitMain { display: flex; flex-direction: column; flex: 1 1 auto; min-width: 0; min-height: 0; }
.roChat {
  width: 380px;
  flex: 0 0 auto;
  border-left: 1px solid var(--ro-line);
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: var(--ro-sub);
}
.roChatHead {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--ro-line-soft);
  font-size: 12px;
  color: var(--ro-muted);
}
.roChatBody { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; }

.roScroll { flex: 1 1 auto; min-height: 0; overflow: auto; padding: 16px 20px 28px; }

.roHead { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 14px; }
.roH1 { font-size: 19px; font-weight: 660; margin: 0; letter-spacing: 0.01em; }
.roSub { color: var(--ro-muted); font-size: 13px; margin: 4px 0 0; }

.roNotice {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  border: 1px solid var(--ro-line);
  border-left: 3px solid var(--ro-gold);
  background: var(--ro-gold-soft);
  color: var(--ro-text);
  padding: 9px 12px;
  border-radius: 8px;
  font-size: 13px;
  margin-bottom: 14px;
}
.roNotice--error { border-left-color: var(--ro-red); background: var(--ro-red-soft); }
.roNotice--warn { border-left-color: var(--ro-amber); }
.roNotice--ok { border-left-color: var(--ro-green); background: var(--ro-green-soft); }

.roKpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(148px, 1fr));
  gap: 10px;
  margin-bottom: 18px;
}
.roKpi {
  border: 1px solid var(--ro-line);
  border-radius: 10px;
  padding: 11px 13px;
  background: var(--ro-panel);
  min-width: 0;
}
.roKpiLabel { color: var(--ro-faint); font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.roKpiValue { font-size: 24px; font-weight: 620; line-height: 1.25; margin-top: 2px; font-variant-numeric: tabular-nums; }
.roKpiValue small { font-size: 12px; font-weight: 400; color: var(--ro-muted); margin-left: 4px; }
.roKpi--alert .roKpiValue { color: var(--ro-red); }
.roKpi--good .roKpiValue { color: var(--ro-green); }
.roKpiValue--alert { color: var(--ro-red); }

.roSection { margin-top: 22px; }
.roSectionHead { display: flex; align-items: baseline; gap: 10px; margin-bottom: 8px; flex-wrap: wrap; }
.roH2 { font-size: 15px; font-weight: 640; margin: 0; }
.roHint { color: var(--ro-faint); font-size: 12px; }

.roTable { border: 1px solid var(--ro-line); border-radius: 10px; overflow: hidden; background: var(--ro-panel); }
.roPHead, .roPRow { display: grid; grid-template-columns: minmax(180px, 2fr) 62px 62px 76px 132px 76px 108px 62px; gap: 10px; align-items: center; padding: 9px 13px; }
.roPHead { font-size: 12px; color: var(--ro-faint); background: var(--ro-sub); border-bottom: 1px solid var(--ro-line); }
.roPRow { border-bottom: 1px solid var(--ro-line-soft); cursor: pointer; min-width: 0; }
.roPRow:last-child { border-bottom: 0; }
.roPRow:hover { background: var(--ro-sub); }
.roPRow:focus-visible { outline: 2px solid var(--ro-gold); outline-offset: -2px; }
.roPCell { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-variant-numeric: tabular-nums; }
.roPCell--name { font-weight: 560; }
.roPCell--warn { color: var(--ro-red); }
.roDCell--warn { color: var(--ro-red); }
.roPCell--num { text-align: right; }
.roDCell--name { overflow-wrap: anywhere; }
.roPHead .roPCell--num { text-align: right; }
.roDCell--name { overflow-wrap: anywhere; }

.roDHead, .roDRow { display: grid; grid-template-columns: minmax(200px, 2.4fr) 104px 118px 138px 76px; gap: 10px; align-items: center; padding: 9px 13px; }
.roDHead { font-size: 12px; color: var(--ro-faint); background: var(--ro-sub); border-bottom: 1px solid var(--ro-line); }
.roDRow { border-bottom: 1px solid var(--ro-line-soft); cursor: pointer; min-width: 0; }
.roDRow:last-child { border-bottom: 0; }
.roDRow:hover { background: var(--ro-sub); }
.roDRow:focus-visible { outline: 2px solid var(--ro-gold); outline-offset: -2px; }
.roDCell { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-variant-numeric: tabular-nums; }
.roDCell--name { font-weight: 560; }
.roDCell--sub { color: var(--ro-muted); font-size: 13px; }
.roDCell--num { text-align: right; }
.roDHead .roDCell--num { text-align: right; }

.roBarTrack { display: block; height: 6px; border-radius: 4px; background: var(--ro-track); overflow: hidden; }
.roBarFill { display: block; height: 100%; border-radius: 4px; background: var(--ro-gold); }
.roBarFill--warn { background: var(--ro-amber); }
.roBarFill--bad { background: var(--ro-red); }
.roRateCell { display: flex; align-items: center; gap: 8px; min-width: 0; }
.roRateNum { font-size: 12px; font-variant-numeric: tabular-nums; color: var(--ro-muted); width: 40px; text-align: right; }
.roRateTrack { flex: 1 1 auto; min-width: 34px; }

.roChips { display: flex; flex-wrap: wrap; gap: 6px; }
.roChip { background: var(--ro-chip); border: 1px solid var(--ro-line-soft); border-radius: 999px; padding: 2px 9px; font-size: 12px; color: var(--ro-muted); white-space: nowrap; }
.roChip--good { color: var(--ro-green); background: var(--ro-green-soft); border-color: transparent; }
.roChip--bad { color: var(--ro-red); background: var(--ro-red-soft); border-color: transparent; }

.roControls { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; margin: 4px 0 10px; }
.roInput {
  font: inherit;
  font-size: 13px;
  padding: 6px 10px;
  border: 1px solid var(--ro-line);
  border-radius: 8px;
  background: var(--ro-panel);
  color: var(--ro-text);
  min-width: 180px;
  flex: 0 1 240px;
}
.roInput:focus-visible { outline: 2px solid var(--ro-gold); outline-offset: 1px; }
.roCheck { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: var(--ro-muted); cursor: pointer; }
.roCheck input { accent-color: var(--ro-gold); }

.roDeviceHead { display: flex; gap: 14px; align-items: flex-start; flex-wrap: wrap; margin-bottom: 14px; }
.roDeviceName { font-size: 17px; font-weight: 640; margin: 0; }
.roDeviceMeta { color: var(--ro-faint); font-size: 12px; margin-top: 3px; word-break: break-all; }

.roChart { border: 1px solid var(--ro-line); border-radius: 10px; padding: 14px 16px 10px; background: var(--ro-panel); }
.roChartHead { display: flex; justify-content: space-between; gap: 10px; align-items: baseline; margin-bottom: 12px; flex-wrap: wrap; }
.roCols { display: flex; align-items: flex-end; gap: 10px; height: 168px; }
.roCol { flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; justify-content: flex-end; height: 100%; gap: 6px; }
.roColBarWrap { flex: 1 1 auto; display: flex; align-items: flex-end; }
.roColBar { width: 100%; border-radius: 5px 5px 2px 2px; background: #c7d0dd; min-height: 2px; }
.roDark .roColBar { background: #3c4a5e; }
.roColBar--warn { background: var(--ro-amber); }
.roColBar--bad { background: var(--ro-red); }
.roColBar--good { background: var(--ro-green); }
.roColLabel { font-size: 11px; color: var(--ro-faint); text-align: center; white-space: nowrap; }
.roColValue { font-size: 11px; color: var(--ro-muted); text-align: center; font-variant-numeric: tabular-nums; }

.roList { border: 1px solid var(--ro-line); border-radius: 10px; background: var(--ro-panel); overflow: hidden; }
.roListRow { display: flex; gap: 12px; align-items: flex-start; padding: 10px 13px; border-bottom: 1px solid var(--ro-line-soft); }
.roListRow:last-child { border-bottom: 0; }
.roLevel { flex: 0 0 auto; font-size: 11px; border-radius: 5px; padding: 1px 7px; background: var(--ro-chip); color: var(--ro-muted); }
.roLevel--high { color: var(--ro-red); background: var(--ro-red-soft); }
.roListMain { min-width: 0; flex: 1 1 auto; }
.roListTitle { font-size: 13px; overflow-wrap: anywhere; }
.roListMeta { font-size: 12px; color: var(--ro-faint); margin-top: 2px; }

.roEmpty { border: 1px dashed var(--ro-line); border-radius: 12px; padding: 30px 24px; text-align: center; color: var(--ro-muted); max-width: 680px; margin: 6vh auto 0; }
.roEmptyTitle { font-size: 15px; font-weight: 600; color: var(--ro-text); margin-bottom: 6px; }
.roEmptyText { font-size: 13px; max-width: 46ch; margin: 0 auto 12px; }
.roEmptyCode { display: inline-block; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; background: var(--ro-chip); border: 1px solid var(--ro-line-soft); border-radius: 6px; padding: 6px 10px; margin: 6px 0; color: var(--ro-text); overflow-wrap: anywhere; }
.roLog {
  text-align: left;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
  line-height: 1.5;
  color: var(--ro-muted);
  background: var(--ro-sub);
  border: 1px solid var(--ro-line-soft);
  border-radius: 8px;
  padding: 8px 10px;
  margin: 10px auto 0;
  max-width: 100%;
  max-height: 120px;
  overflow: auto;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.roEmptyActions { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; margin-top: 8px; }

.roAlertGrid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 12px; }
.roAlertCard {
  border: 1px solid var(--ro-line);
  border-radius: 12px;
  background: var(--ro-panel);
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  cursor: pointer;
  min-width: 0;
}
.roAlertCard:hover { border-color: var(--ro-gold); }
.roAlertCard:focus-visible { outline: 2px solid var(--ro-gold); outline-offset: 1px; }
.roAlertHead { display: flex; align-items: center; gap: 8px; min-width: 0; }
.roAlertName { flex: 1 1 auto; min-width: 0; font-size: 14px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.roAlertMeta { font-size: 12px; color: var(--ro-faint); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.roAlertItems { display: flex; flex-direction: column; gap: 6px; border-top: 1px solid var(--ro-line-soft); padding-top: 8px; }
.roAlertItem { display: grid; grid-template-columns: 30px minmax(0, 1fr) auto; gap: 8px; align-items: baseline; font-size: 12px; }
.roAlertTitle { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.roAlertTime { color: var(--ro-faint); font-size: 11px; white-space: nowrap; }
.roAlertEmpty { font-size: 12px; color: var(--ro-faint); }

.roFoot { color: var(--ro-faint); font-size: 12px; padding: 14px 0 0; }

/* ---------- \u770B\u677F\uFF1A\u767D\u5E95\u91D1\u7EBF\u3001\u5927\u5C0F\u5361 ---------- */

.roHero { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 14px; }
.roHeroMeta { display: flex; gap: 6px; flex-wrap: wrap; }

.roBento {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
}

.roSpan1 { grid-column: span 1; }
.roSpan2 { grid-column: span 2; }
.roSpan3 { grid-column: span 3; }
.roSpan4 { grid-column: span 4; }
.roSpan5 { grid-column: span 5; }
.roSpan6 { grid-column: span 6; }

.roCard {
  border: 1px solid var(--ro-line);
  border-radius: 12px;
  background: var(--ro-panel);
  padding: 14px 16px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
}

.roCard--hero { background: linear-gradient(180deg, #fffdf8 0%, #ffffff 42%); border-color: #ecdfc2; }
.roDark .roCard--hero { background: linear-gradient(180deg, #1b1a16 0%, #17181a 42%); border-color: #3a3426; }

.roCard--gold { border-color: #e6d3a8; }
.roCard--gold::before {
  content: '';
  position: absolute;
  left: 0; top: 10px; bottom: 10px;
  width: 3px;
  border-radius: 0 3px 3px 0;
  background: var(--ro-gold);
}
.roDark .roCard--gold { border-color: #4a3f28; }

.roCard--alert { border-color: #f0d9d5; }
.roDark .roCard--alert { border-color: #4a302d; }

.roCardHead { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
.roCardLabel { font-size: 13px; color: var(--ro-muted); font-weight: 560; }
.roCardTag { font-size: 12px; color: var(--ro-faint); white-space: nowrap; }
.roCardEmpty { color: var(--ro-faint); font-size: 13px; padding: 18px 0; text-align: center; }
.roCard--alert .roStatNumber { font-size: 30px; }

.roMiniList { display: flex; flex-direction: column; gap: 4px; margin-top: 4px; }
.roMiniRow { display: flex; align-items: baseline; gap: 8px; min-width: 0; font-size: 12px; }
.roMiniName { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--ro-muted); }
.roMiniValue { white-space: nowrap; font-variant-numeric: tabular-nums; }

.roStatusRows { display: flex; flex-direction: column; gap: 6px; margin: 2px 0; flex: 1 1 auto; justify-content: space-evenly; }
.roStatusRow { display: grid; grid-template-columns: minmax(72px, 1.3fr) 38px minmax(50px, 1.6fr) 40px; gap: 8px; align-items: center; font-size: 12px; min-width: 0; }
.roStatusName { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--ro-muted); }
.roStatusCount { text-align: right; font-variant-numeric: tabular-nums; font-weight: 600; }
.roStatusBar { height: 6px; border-radius: 4px; background: var(--ro-track); overflow: hidden; }
.roStatusFill { display: block; height: 100%; border-radius: 4px; }
.roStatusPct { text-align: right; color: var(--ro-faint); font-variant-numeric: tabular-nums; }

.roCardFoot { margin-top: auto; padding-top: 10px; border-top: 1px solid var(--ro-line-soft); color: var(--ro-faint); font-size: 11px; }

.roRingWrap { position: relative; width: 148px; height: 148px; align-self: center; margin: auto; }
.roRing { width: 100%; height: 100%; display: block; }
.roRingTrack { fill: none; stroke: var(--ro-track); stroke-width: 11; }
.roRingValue { fill: none; stroke: var(--ro-gold); stroke-width: 11; stroke-linecap: round; }
.roRingCenter { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; }
.roRingNumber { font-size: 27px; font-weight: 640; font-variant-numeric: tabular-nums; letter-spacing: -0.01em; }
.roRingHint { font-size: 11px; color: var(--ro-faint); white-space: nowrap; }

.roMiniStats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px; margin-top: auto; padding-top: 6px; border-top: 1px solid var(--ro-line-soft); }
.roMiniStat { display: flex; flex-direction: column; gap: 1px; align-items: center; min-width: 0; }
.roMiniStat b { font-size: 15px; font-weight: 620; font-variant-numeric: tabular-nums; }
.roMiniStat span { font-size: 11px; color: var(--ro-faint); white-space: nowrap; }
.roWarn { color: var(--ro-red) !important; }

.roBigNumber { font-size: 38px; font-weight: 660; line-height: 1.1; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; color: var(--ro-text); }
.roBigNumber small { font-size: 14px; font-weight: 400; color: var(--ro-muted); margin-left: 6px; }
.roBigSub { font-size: 12px; color: var(--ro-muted); letter-spacing: 0.01em; }
.roOutputStats { display: flex; gap: 22px; padding-top: 4px; }
.roOutputStat { display: flex; flex-direction: column; gap: 1px; }
.roOutputStat b { font-size: 17px; font-weight: 620; font-variant-numeric: tabular-nums; }
.roOutputStat span { font-size: 11px; color: var(--ro-faint); }

.roOutputRow { display: flex; gap: 20px; margin-top: auto; padding-top: 10px; border-top: 1px solid var(--ro-line-soft); flex-wrap: wrap; }
.roOutputItem { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.roOutputValue { font-size: 18px; font-weight: 620; font-variant-numeric: tabular-nums; color: var(--ro-gold); }
.roOutputLabel { font-size: 11px; color: var(--ro-faint); }

.roStatNumber { font-size: 34px; font-weight: 660; line-height: 1.1; font-variant-numeric: tabular-nums; }
.roStatHint { font-size: 11px; color: var(--ro-faint); }

.roLink {
  appearance: none;
  border: 0;
  background: none;
  color: var(--ro-gold-deep, #8a5c0c);
  font: inherit;
  font-size: 12px;
  padding: 0;
  cursor: pointer;
  text-align: left;
  white-space: nowrap;
  align-self: flex-start;
  margin-top: auto;
}
.roLink:hover { text-decoration: underline; }
.roDark .roLink { color: var(--ro-gold); }
.roLink:focus-visible { outline: 2px solid var(--ro-gold); outline-offset: 2px; }

.roTrend { display: flex; align-items: flex-end; gap: 8px; flex: 1 1 auto; min-height: 140px; margin-top: 4px; }
.roTrendCol { flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; justify-content: flex-end; height: 100%; gap: 3px; }
.roTrendBarWrap { flex: 1 1 auto; display: flex; align-items: flex-end; }
.roTrendBar { width: 100%; border-radius: 5px 5px 2px 2px; background: linear-gradient(180deg, #d9bc7d, #b58a2b); min-height: 4px; }
.roTrendBar--bad { background: linear-gradient(180deg, #e3a79f, #b23b30); }
.roTrendValue { font-size: 10px; color: var(--ro-faint); text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.roTrendLabel { font-size: 11px; color: var(--ro-muted); text-align: center; white-space: nowrap; }

.roSegBar { display: flex; height: 14px; border-radius: 7px; overflow: hidden; background: var(--ro-track); margin: 6px 0 10px; }
.roSeg { min-width: 3px; }
.roSeg--gold { background: var(--ro-gold); }
.roSeg--navy { background: #b7c1d1; }
.roSeg--amber { background: #d9b26a; }
.roSeg--muted { background: #aab2bd; }
.roSeg--soft { background: #e9ecf1; }
.roDark .roSeg--soft { background: #34373d; }
.roDark .roSeg--navy { background: #4c5668; }
.roDark .roSeg--muted { background: #565b64; }

.roLegend { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 12px; }
.roLegendItem { display: flex; align-items: center; gap: 6px; font-size: 12px; min-width: 0; }
.roLegendDot { width: 8px; height: 8px; border-radius: 2px; flex: 0 0 auto; }
.roLegendLabel { color: var(--ro-muted); white-space: nowrap; }
.roLegendItem b { font-variant-numeric: tabular-nums; font-weight: 600; }
.roLegendPct { color: var(--ro-faint); font-size: 11px; margin-left: auto; }

.roRank { display: flex; flex-direction: column; gap: 7px; flex: 1 1 auto; justify-content: space-evenly; }
.roRankRow {
  display: grid;
  grid-template-columns: minmax(120px, 1.4fr) minmax(60px, 2fr) 44px 84px;
  gap: 10px;
  align-items: center;
  cursor: pointer;
  border-radius: 6px;
  padding: 2px 4px;
  margin: 0 -4px;
  min-width: 0;
}
.roRankRow:hover { background: var(--ro-sub); }
.roRankRow:focus-visible { outline: 2px solid var(--ro-gold); outline-offset: 1px; }
.roRankName { font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.roRankBar { height: 8px; border-radius: 5px; background: var(--ro-track); overflow: hidden; }
.roRankFill { display: block; height: 100%; border-radius: 5px; background: var(--ro-gold); }
.roRankFill--warn { background: #cfa25a; }
.roRankFill--bad { background: var(--ro-red); }
.roRankValue { font-size: 12px; font-variant-numeric: tabular-nums; text-align: right; color: var(--ro-muted); }
.roRankFlag { font-size: 11px; color: var(--ro-green); white-space: nowrap; text-align: right; }
.roRankFlag--bad { color: var(--ro-red); }

.roCard--advice { background: linear-gradient(180deg, #fffdf7 0%, #ffffff 55%); }
.roDark .roCard--advice { background: linear-gradient(180deg, #1a1915 0%, #17181a 55%); }
.roAdviceMark { color: var(--ro-gold); margin-right: 4px; }
.roAdviceList { display: flex; flex-direction: column; gap: 8px; flex: 1 1 auto; justify-content: space-evenly; }
.roAdviceItem { border-left: 2px solid var(--ro-line); padding: 2px 0 2px 9px; min-width: 0; }
.roAdviceItem--bad { border-left-color: var(--ro-red); }
.roAdviceItem--warn { border-left-color: var(--ro-amber); }
.roAdviceItem--ok { border-left-color: var(--ro-green); }
.roAdviceTitle { font-size: 13px; font-weight: 600; margin-bottom: 1px; overflow-wrap: anywhere; }
.roAdviceText { font-size: 12px; color: var(--ro-muted); line-height: 1.5; overflow-wrap: anywhere; }
.roAdviceFoot { display: flex; gap: 8px; flex-wrap: wrap; margin-top: auto; padding-top: 8px; }

.roFocusGrid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
.roFocusCard {
  border: 1px solid var(--ro-line-soft);
  border-radius: 10px;
  padding: 10px 12px;
  background: var(--ro-sub);
  display: flex;
  flex-direction: column;
  gap: 4px;
  cursor: pointer;
  min-width: 0;
}
.roFocusCard:hover { border-color: var(--ro-gold); }
.roFocusCard:focus-visible { outline: 2px solid var(--ro-gold); outline-offset: 1px; }
.roFocusTop { display: flex; align-items: center; gap: 6px; min-width: 0; }
.roDot { width: 7px; height: 7px; border-radius: 50%; background: #c9ced6; flex: 0 0 auto; }
.roDot--on { background: var(--ro-green); }
.roFocusName { font-size: 13px; font-weight: 560; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.roFocusProject { font-size: 11px; color: var(--ro-faint); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.roFocusBottom { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
.roFocusRate { font-size: 18px; font-weight: 640; font-variant-numeric: tabular-nums; color: var(--ro-red); }
.roFocusRate { max-width: 100%; }
.roFocusMeta { font-size: 11px; color: var(--ro-faint); }
.roBadge { font-size: 10px; border-radius: 4px; padding: 1px 6px; background: var(--ro-chip); color: var(--ro-muted); white-space: nowrap; }
.roBadge--bad { color: var(--ro-red); background: var(--ro-red-soft); }

@container (max-width: 980px) {
  .roSpan1, .roSpan2 { grid-column: span 3; }
  .roSpan4, .roSpan6 { grid-column: span 6; }
  .roFocusGrid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@container (max-width: 720px) {
  .roScroll { padding: 12px 14px 22px; }
  .roBento { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .roSpan1, .roSpan2, .roSpan3, .roSpan4, .roSpan5, .roSpan6, .roSpan7, .roSpan12 { grid-column: span 2; }
  .roRankRow { grid-template-columns: minmax(90px, 1.2fr) minmax(40px, 1.6fr) 40px; }
  .roRankFlag { display: none; }
  .roBigNumber { font-size: 32px; }
  .roTrend { height: 128px; gap: 5px; }
  .roLegend { grid-template-columns: 1fr; }
  .roPHead, .roDHead { display: none; }
  .roPRow { grid-template-columns: 1fr 1fr; row-gap: 4px; padding: 11px 13px; }
  .roDRow { grid-template-columns: 1fr 1fr; row-gap: 4px; padding: 11px 13px; }
  .roPCell, .roDCell { display: flex; justify-content: space-between; gap: 10px; white-space: normal; }
  .roPCell::before, .roDCell::before { content: attr(data-label); color: var(--ro-faint); font-size: 12px; flex: 0 0 auto; }
  .roPCell--name, .roDCell--name { grid-column: 1 / -1; justify-content: flex-start; font-size: 14px; }
  .roPCell--name::before, .roDCell--name::before { content: none; }
  .roPCell--num, .roDCell--num { text-align: right; }
  .roChart { padding: 12px; }
  .roCols { height: 140px; gap: 6px; }
  .roKpis { grid-template-columns: repeat(auto-fit, minmax(132px, 1fr)); }
}

@container (max-width: 860px) {
  .roSplit { flex-direction: column; }
  .roChat { width: auto; height: 46%; border-left: 0; border-top: 1px solid var(--ro-line); }
}

@container (max-width: 460px) {
  .roPRow, .roDRow { grid-template-columns: 1fr; }
  .roFocusGrid { grid-template-columns: 1fr; }
  .roKpis { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .roRankRow { grid-template-columns: minmax(70px, 1fr) 44px; }
  .roRankBar { display: none; }
  .roHero { flex-direction: column; align-items: flex-start; }
  .roKpiValue { font-size: 21px; }
  .roBar { padding: 7px 12px; }
  .roStamp { display: none; }
}
`;
  var styles_default = CSS;

  // src/entry.jsx
  var STYLE_ID = "ge-workbench-robot-ops-style";
  function installStyles() {
    if (typeof document === "undefined") return;
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = styles_default;
    document.head.appendChild(style);
  }
  window.__ModuleLoader__.load({
    id: "ge-workbench-robot-ops",
    factory: (req) => {
      const React = req("react");
      installStyles();
      return createPanel(React);
    }
  });
})();
