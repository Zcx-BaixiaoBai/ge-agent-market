(() => {
  // src/panel.jsx
  function createPanel(React) {
    const h = React.createElement;
    const { useCallback, useEffect, useMemo, useState } = React;
    const API = "/api/datacenter-workbench";
    const COPY = {
      title: "\u6570\u636E\u7BA1\u7406\u4E2D\u5FC3",
      subtitle: "\u91D1\u9E70\u96C6\u56E2\u8BBE\u5907\u3001\u7535\u8868\u3001\u5B89\u5168\u4E0E\u9884\u7B97\u5168\u666F\u770B\u677F",
      loading: "\u6B63\u5728\u8BFB\u53D6\u6570\u636E\u2026",
      loadFailed: "\u8BFB\u53D6\u6570\u636E\u5931\u8D25",
      retry: "\u91CD\u8BD5",
      chooseProject: "\u5148\u9009\u62E9\u8981\u67E5\u770B\u7684\u9879\u76EE",
      chooseProjectHint: "\u9009\u62E9\u9879\u76EE\u540E\uFF0C\u8FD9\u91CC\u53EA\u663E\u793A\u8BE5\u9879\u76EE\u7684\u8BBE\u5907\u3001\u7535\u8868\u3001\u5B89\u5168\u9690\u60A3\u4E0E\u9884\u7B97\u6267\u884C\u60C5\u51B5\u3002",
      project: "\u9879\u76EE",
      projects: "\u9879\u76EE",
      search: "\u641C\u7D22\u9879\u76EE\u540D\u79F0",
      noProject: "\u6CA1\u6709\u5339\u914D\u7684\u9879\u76EE",
      confirm: "\u786E\u8BA4\u5E76\u67E5\u770B",
      confirmHint: "\u53EF\u591A\u9009\uFF0C\u770B\u677F\u4F1A\u6C47\u603B\u6240\u9009\u9879\u76EE\u3002",
      back: "\u91CD\u65B0\u9009\u62E9\u9879\u76EE",
      refresh: "\u5237\u65B0",
      aiHelp: "\u8BA9 AI \u534F\u52A9\u5206\u6790",
      aiHelpHint: "\u70B9\u51FB\u540E\u4F1A\u4E3A\u672C\u5DE5\u4F5C\u53F0\u5F00\u542F\u4E00\u4E2A\u4F1A\u8BDD\uFF0C\u628A\u5F53\u524D\u9879\u76EE\u6570\u636E\u4EA4\u7ED9 AI \u5206\u6790\u3002",
      aiWorking: "\u6B63\u5728\u51C6\u5907\u4F1A\u8BDD\u2026",
      overview: "\u603B\u89C8",
      equipment: "\u8BBE\u5907",
      meters: "\u7535\u8868",
      safety: "\u5B89\u5168\u9690\u60A3",
      safetyHazardSection: "\u5B89\u5168\u9690\u60A3\u660E\u7EC6",
      safetyDutySection: "\u503C\u73ED\u4EFB\u52A1",
      budget: "\u9884\u7B97\u6267\u884C",
      empty: "\u8BE5\u9879\u76EE\u5728\u8BE5\u5206\u7C7B\u4E0B\u6682\u65E0\u6570\u636E\u3002",
      noData: "\u6682\u65E0\u6570\u636E",
      noDataHint: "\u8BE5\u6A21\u5757\u672A\u8986\u76D6\u6B64\u9879\u76EE",
      truncated: "\u6570\u636E\u91CF\u8F83\u5927\uFF0C\u4EC5\u663E\u793A\u524D 500 \u6761\u3002",
      chart: {
        groupKpi: "\u6838\u5FC3\u6307\u6807\uFF08\u96C6\u56E2\uFF09",
        dataAnalysis: "\u6570\u636E\u5206\u6790",
        selectedProjects: "\u6240\u9009\u9879\u76EE\u6C47\u603B",
        kpiMeters: "\u667A\u80FD\u7535\u8868\u603B\u6570",
        kpiMeterRate: "\u7535\u8868\u6545\u969C\u7387",
        kpiHazard: "\u9690\u60A3\u603B\u6570",
        kpiDuty: "\u5B89\u5168\u5C65\u804C",
        kpiWater: "\u6C34\u538B\u5F02\u5E38",
        kpiEquipment: "\u8BBE\u5907\u603B\u6570",
        metersTopTitle: "\u7535\u8868\u6545\u969C\u6392\u540D TOP10",
        commFaultTitle: "\u8BBE\u5907\u901A\u8BAF\u6545\u969C\u5206\u5E03",
        hazardTitle: "\u5B89\u5168\u9690\u60A3\u5206\u5E03",
        hazardTotal: "\u5408\u8BA1",
        hazardOverdue: "\u903E\u671F\u672A\u5B8C\u6210",
        hazardImminent: "\u5373\u5C06\u903E\u671F",
        hazardPending: "\u672A\u5B8C\u6210",
        coverageTitle: "\u677F\u5757\u8986\u76D6\u603B\u89C8",
        meterCoverage: "\u7535\u8868\u8986\u76D6\u7387",
        safetyCoverage: "\u5B89\u5168\u8986\u76D6\u7387",
        equipmentCoverage: "\u8BBE\u5907\u8986\u76D6\u7387",
        meterHealth: "\u7535\u8868\u5065\u5EB7\u7387",
        equipmentHealth: "\u8BBE\u5907\u5065\u5EB7\u7387",
        offline: "\u79BB\u7EBF",
        abnormal: "\u5F02\u5E38\u9001\u7535",
        unpaid: "\u65E0\u7B7E\u5448",
        total: "\u5408\u8BA1",
        lastSync: "\u6700\u8FD1\u540C\u6B65",
        source: "\u6570\u636E\u6E90"
      },
      units: {
        total: "\u603B\u6570",
        fault: "\u6545\u969C",
        faultRate: "\u6545\u969C\u7387",
        offline: "\u79BB\u7EBF",
        unpaid: "\u6B20\u8D39",
        abnormal: "\u5F02\u5E38",
        duty: "\u503C\u73ED\u4EFB\u52A1",
        dutyOverdue: "\u503C\u73ED\u903E\u671F",
        hazard: "\u9690\u60A3",
        hazardOverdue: "\u9690\u60A3\u903E\u671F",
        imminent: "\u4E34\u671F\u9690\u60A3"
      },
      budgetColumns: ["\u79D1\u76EE", "\u672C\u671F\u4F7F\u7528", "\u672C\u671F\u5360\u6BD4", "\u5E74\u5EA6\u4F7F\u7528", "\u5E74\u5EA6\u5360\u6BD4"],
      equipmentColumns: ["\u8BBE\u5907\u540D\u79F0", "\u8BBE\u5907\u7C7B\u578B", "\u8BBE\u5907\u72B6\u6001", "\u5728\u7EBF\u72B6\u6001", "\u6700\u540E\u901A\u4FE1", "\u901A\u4FE1\u5EF6\u8FDF(\u79D2)"],
      metersColumns: ["\u5B89\u88C5\u4F4D\u7F6E", "\u4F4D\u7F6E", "\u6545\u969C\u63CF\u8FF0", "\u6545\u969C\u6807\u7B7E", "\u6570\u636E\u65F6\u95F4", "\u79BB\u7EBF\u5C0F\u65F6"],
      hazardsColumns: ["\u9690\u60A3\u63CF\u8FF0", "\u7B49\u7EA7", "\u72B6\u6001", "\u8D23\u4EFB\u4EBA", "\u6574\u6539\u622A\u6B62", "\u5269\u4F59\u5929\u6570"],
      dutiesColumns: ["\u503C\u73ED\u7C7B\u578B", "\u5C97\u4F4D", "\u8D23\u4EFB\u4EBA", "\u5F00\u59CB\u65E5\u671F", "\u7ED3\u675F\u65E5\u671F", "\u72B6\u6001"],
      filter: {
        all: "\u5168\u90E8",
        search: "\u641C\u7D22\u5F53\u524D\u5185\u5BB9",
        reset: "\u6E05\u9664\u7B5B\u9009",
        online: "\u5728\u7EBF\u72B6\u6001",
        deviceStatus: "\u8BBE\u5907\u72B6\u6001",
        faultCategory: "\u6545\u969C\u7C7B\u578B",
        level: "\u9690\u60A3\u7B49\u7EA7",
        hazardStatus: "\u9690\u60A3\u72B6\u6001",
        dutyStatus: "\u503C\u73ED\u72B6\u6001",
        overdue: "\u903E\u671F\u60C5\u51B5",
        isOverdue: "\u903E\u671F",
        notOverdue: "\u672A\u903E\u671F",
        filteredOf: "\u6761 / \u5171",
        emptyFiltered: "\u5F53\u524D\u7B5B\u9009\u6761\u4EF6\u4E0B\u6CA1\u6709\u6570\u636E\uFF0C\u53EF\u8C03\u6574\u6216\u6E05\u9664\u7B5B\u9009\u3002"
      },
      stat: {
        total: "\u603B\u6570",
        online: "\u5728\u7EBF",
        offline: "\u79BB\u7EBF",
        fault: "\u6545\u969C",
        faultRate: "\u6545\u969C\u7387",
        abnormal: "\u6570\u636E\u62A5\u8B66",
        longestOffline: "\u6700\u957F\u79BB\u7EBF",
        hours: "\u5C0F\u65F6",
        within24h: "0-24 \u5C0F\u65F6",
        oneTo3d: "1-3 \u5929",
        over3d: "\u8D85\u8FC7 3 \u5929",
        offlineDuration: "\u79BB\u7EBF\u65F6\u957F\u5206\u5E03",
        rectified: "\u5DF2\u6574\u6539",
        pendingRectify: "\u672A\u6574\u6539",
        overdueUnfixed: "\u903E\u671F\u672A\u6574\u6539",
        imminentDays: "7 \u5929\u5185\u5230\u671F",
        completed: "\u5DF2\u5B8C\u6210",
        uncompleted: "\u672A\u5B8C\u6210",
        overdueUnfinished: "\u903E\u671F\u672A\u5B8C\u6210"
      },
      report: {
        button: "\u751F\u6210 AI \u5206\u6790\u62A5\u544A",
        busy: "\u6B63\u5728\u51C6\u5907\u62A5\u544A\u2026",
        done: "\u62A5\u544A\u5185\u5BB9\u5DF2\u586B\u5165\u5BF9\u8BDD\u8F93\u5165\u6846\uFF0C\u8BF7\u67E5\u770B\u540E\u53D1\u9001\u3002",
        preserved: "\u5BF9\u8BDD\u8F93\u5165\u6846\u5DF2\u6709\u5185\u5BB9\u672A\u6E05\u7A7A\uFF0C\u62A5\u544A\u5DF2\u590D\u5236\u5230\u526A\u8D34\u677F\uFF0C\u53EF\u624B\u52A8\u7C98\u8D34\u3002",
        clipboard: "\u672A\u80FD\u5199\u5165\u5BF9\u8BDD\u8349\u7A3F\uFF0C\u62A5\u544A\u5DF2\u590D\u5236\u5230\u526A\u8D34\u677F\uFF0C\u53EF\u624B\u52A8\u7C98\u8D34\u3002",
        failed: "\u672A\u80FD\u5199\u5165\u5BF9\u8BDD\u8349\u7A3F",
        noSession: "\u672A\u80FD\u521B\u5EFA\u5DE5\u4F5C\u53F0\u4F1A\u8BDD\uFF0C\u8BF7\u91CD\u8BD5\u3002",
        view: "\u67E5\u770B\u5BF9\u8BDD"
      }
    };
    const pct = (value) => value === void 0 || value === null ? "\u2014" : `${(Number(value) * 100).toFixed(1)}%`;
    const cell = (value) => value === void 0 || value === null || value === "" ? "\u2014" : String(value);
    function MetricCard({ label, value, hint, tone }) {
      return h(
        "div",
        { className: `dcMetric${tone ? ` dcMetric--${tone}` : ""}` },
        h("div", { className: "dcMetric__label" }, label),
        h("div", { className: "dcMetric__value" }, value),
        hint ? h("div", { className: "dcMetric__hint" }, hint) : null
      );
    }
    function DataTable({ columns, rows, emptyText }) {
      if (!rows || rows.length === 0) {
        return h("div", { className: "dcEmpty" }, emptyText || COPY.empty);
      }
      const cellClass = (column) => column.nowrap ? "dcTable__nowrap" : void 0;
      return h(
        "div",
        { className: "dcTableWrap" },
        h(
          "table",
          { className: "dcTable" },
          h("thead", null, h("tr", null, columns.map((column) => h("th", { key: column.key, scope: "col", className: cellClass(column) }, column.title)))),
          h("tbody", null, rows.map((row, index) => h(
            "tr",
            { key: index },
            columns.map((column) => h("td", { key: column.key, className: cellClass(column) }, column.render ? column.render(row) : cell(row[column.key])))
          )))
        )
      );
    }
    function StatStrip({ stats }) {
      return h("div", { className: "dcStatStrip" }, stats.map((item) => h(
        "div",
        { className: `dcStatChip${item.tone ? ` dcStatChip--${item.tone}` : ""}`, key: item.label },
        h("span", { className: "dcStatChip__label" }, item.label),
        h("span", { className: "dcStatChip__value" }, String(item.value))
      )));
    }
    function FilterBar({ keyword, onKeyword, groups, onReset, onReport, reportBusy }) {
      const dirty = keyword !== "" || groups.some((group) => group.value !== "all");
      return h(
        "div",
        { className: "dcFilterBar" },
        h(
          "div",
          { className: "dcFilterBar__top" },
          h("input", {
            className: "dcInput dcFilterBar__search",
            type: "search",
            value: keyword,
            placeholder: COPY.filter.search,
            "aria-label": COPY.filter.search,
            onChange: (event) => onKeyword(event.target.value)
          }),
          dirty ? h("button", { type: "button", className: "dcBtn dcFilterBar__reset", onClick: onReset }, COPY.filter.reset) : null,
          onReport ? h("button", {
            type: "button",
            className: "dcBtn dcBtn--primary dcFilterBar__report",
            disabled: reportBusy,
            onClick: onReport
          }, reportBusy ? COPY.report.busy : COPY.report.button) : null
        ),
        groups.length > 0 ? h(
          "div",
          { className: "dcFilterBar__groups" },
          groups.map(
            (group) => h(
              "div",
              { className: "dcFilterGroup", key: group.key },
              h("span", { className: "dcFilterGroup__label" }, group.label),
              h(
                "div",
                { className: "dcFilterGroup__chips", role: "group", "aria-label": group.label },
                [{ value: "all", label: COPY.filter.all }, ...group.options].map((option) => h("button", {
                  key: option.value,
                  type: "button",
                  className: "dcChip",
                  "aria-pressed": group.value === option.value,
                  onClick: () => group.onChange(option.value)
                }, option.label))
              )
            )
          )
        ) : null
      );
    }
    function MiniBars({ title, data }) {
      if (!data || data.length === 0) return null;
      const max = Math.max(...data.map((item) => item.value), 1);
      return h(
        "div",
        { className: "dcPanel dcPanel--chart dcMiniChart" },
        title ? h("h4", { className: "dcChartTitle" }, title) : null,
        h("div", { className: "dcChartRows" }, data.map((item) => h(
          "div",
          { className: "dcChartRow", key: item.label },
          h("div", { className: "dcChartRow__label", title: item.label }, item.label),
          h(
            "div",
            { className: "dcChartRow__bars" },
            h(
              "div",
              { className: "dcBarTrack" },
              h("span", { className: "dcBarFill", style: { width: `${item.value / max * 100}%`, background: item.color || "#0969da" } })
            )
          ),
          h("div", { className: "dcChartRow__value" }, String(item.value))
        )))
      );
    }
    function DistDonut({ title, data }) {
      const total = data.reduce((sum, item) => sum + item.value, 0);
      if (!total) return null;
      const RADIUS = 46;
      const CIRCUM = 2 * Math.PI * RADIUS;
      let offset = 0;
      const arcs = data.map((item) => {
        const fraction = item.value / total;
        const arc = { ...item, dash: fraction * CIRCUM, offset };
        offset += fraction * CIRCUM;
        return arc;
      });
      return h(
        "div",
        { className: "dcPanel dcPanel--chart dcMiniChart" },
        title ? h("h4", { className: "dcChartTitle" }, title) : null,
        h(
          "div",
          { className: "dcDonut" },
          h(
            "svg",
            { viewBox: "0 0 130 130", className: "dcDonut__svg", role: "img", "aria-label": title },
            h("circle", { cx: 65, cy: 65, r: RADIUS, fill: "none", stroke: "#d0d7de", strokeWidth: 16 }),
            arcs.map((arc) => h("circle", {
              key: arc.label,
              cx: 65,
              cy: 65,
              r: RADIUS,
              fill: "none",
              stroke: arc.color,
              strokeWidth: 16,
              strokeDasharray: `${arc.dash} ${CIRCUM - arc.dash}`,
              strokeDashoffset: -arc.offset,
              transform: "rotate(-90 65 65)",
              title: `${arc.label} ${arc.value}`
            })),
            h("text", { x: 65, y: 62, textAnchor: "middle", className: "dcDonut__value" }, String(total)),
            h("text", { x: 65, y: 82, textAnchor: "middle", className: "dcDonut__label" }, COPY.chart.hazardTotal)
          ),
          h("div", { className: "dcDonut__legend" }, data.map((item) => h(
            "div",
            { className: "dcDonutLegend__item", key: item.label },
            h("span", { className: "dcLegendDot", style: { background: item.color } }),
            h("span", { className: "dcDonutLegend__label" }, item.label),
            h("span", { className: "dcDonutLegend__value" }, String(item.value))
          )))
        )
      );
    }
    const countBy = (rows, field) => {
      const counter = /* @__PURE__ */ new Map();
      for (const row of rows) {
        const key = String(row[field] ?? "\u2014") || "\u2014";
        counter.set(key, (counter.get(key) ?? 0) + 1);
      }
      return [...counter.entries()].sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }));
    };
    const topN = (entries, limit) => entries.slice(0, limit);
    const faultCategoryOf = (row) => {
      const tag = String(row.fault_tag ?? "").replace(/[【】]/g, "").trim();
      if (tag) return tag;
      const match = /故障描述【([^】]+)】/.exec(String(row.fault_desc ?? ""));
      if (match) return match[1];
      const status = String(row.switch_status ?? "").trim();
      if (status) return status;
      return "\u5176\u4ED6";
    };
    const offlineBucketOf = (row) => {
      const hours = Number(row.offline_hours ?? 0);
      if (!Number.isFinite(hours) || hours <= 0) return "\u672A\u8BB0\u5F55";
      if (hours <= 24) return COPY.stat.within24h;
      if (hours <= 72) return COPY.stat.oneTo3d;
      return COPY.stat.over3d;
    };
    const writeDraft = (host, sessionId, prompt) => {
      try {
        const conversation = host?.conversation;
        const sessions = host?.sessions;
        if (!conversation?.input?.requestDraftInitialization || typeof sessions?.binding !== "function") return "unavailable";
        const binding = sessions.binding(sessionId);
        if (!binding) return "unavailable";
        return conversation.input.requestDraftInitialization(binding, { prompt });
      } catch (draftError) {
        return "unavailable";
      }
    };
    const buildReportPrompt = (kind, selected, rows, lastSync, fallbackSync) => {
      const safeRows = Array.isArray(rows) ? rows : [];
      const scope = selected.length ? selected.join("\u3001") : "\uFF08\u672A\u9009\u62E9\u9879\u76EE\uFF09";
      const sync = lastSync ?? fallbackSync ?? "\u672A\u77E5";
      const lines = [];
      const sections = {
        equipment: "\u8BBE\u5907\u8FD0\u884C",
        meters: "\u745E\u4FE1\u7535\u8868\u6545\u969C",
        hazards: "\u5B89\u5168\u9690\u60A3",
        duties: "\u5B89\u5168\u503C\u73ED\u5C65\u804C",
        budget: "\u9884\u7B97\u6267\u884C"
      };
      lines.push(`\u8BF7\u5206\u6790\u300C${scope}\u300D\u7684${sections[kind] ?? "\u4E1A\u52A1"}\u6570\u636E\uFF0C\u7ED9\u51FA\u8FD0\u7EF4\u5206\u6790\u62A5\u544A\u4E0E\u5904\u7F6E\u5EFA\u8BAE\u3002\u6570\u636E\u6765\u81EA\u91D1\u9E70\u96C6\u56E2\u6570\u636E\u7BA1\u7406\u4E2D\u5FC3\uFF0C\u6700\u8FD1\u540C\u6B65\u65F6\u95F4 ${sync}\u3002`);
      lines.push("");
      if (kind === "equipment") {
        const offline = safeRows.filter((row) => row.online_status === "\u79BB\u7EBF").length;
        const abnormal = safeRows.filter((row) => row.device_status && row.device_status !== "\u6B63\u5E38").length;
        lines.push(`\u6570\u636E\u6982\u51B5\uFF1A\u5171 ${safeRows.length} \u53F0\u8BBE\u5907\uFF0C\u79BB\u7EBF ${offline} \u53F0\uFF0C\u6570\u636E\u62A5\u8B66 ${abnormal} \u53F0\u3002`);
        lines.push("\u8BBE\u5907\u72B6\u6001\u5206\u5E03\uFF1A" + countBy(safeRows, "device_status").map((item) => `${item.label} ${item.value}`).join("\u3001"));
        lines.push("\u8BBE\u5907\u7C7B\u578B\u5206\u5E03\uFF1A" + topN(countBy(safeRows, "device_type"), 5).map((item) => `${item.label} ${item.value}`).join("\u3001"));
        lines.push("");
        lines.push("\u79BB\u7EBF\u8BBE\u5907\u6E05\u5355\uFF08\u6700\u591A 10 \u6761\uFF09\uFF1A");
        safeRows.filter((row) => row.online_status === "\u79BB\u7EBF").slice(0, 10).forEach((row, index) => {
          lines.push(`${index + 1}. ${row.device_name}\uFF08${row.device_type ?? "\u2014"}\uFF09\u6700\u540E\u901A\u4FE1 ${row.last_comm ?? "\u2014"}\uFF0C\u901A\u4FE1\u5EF6\u8FDF ${typeof row.comm_delay === "number" ? row.comm_delay.toFixed(0) + " \u79D2" : "\u2014"}`);
        });
      } else if (kind === "meters") {
        const withCategory = safeRows.map((row) => ({ ...row, __category: faultCategoryOf(row) }));
        lines.push(`\u6570\u636E\u6982\u51B5\uFF1A\u5171 ${withCategory.length} \u6761\u7535\u8868\u5F02\u5E38\u8BB0\u5F55\u3002`);
        lines.push("\u6545\u969C\u7C7B\u578B\u5206\u5E03\uFF1A" + countBy(withCategory, "__category").map((item) => `${item.label} ${item.value}`).join("\u3001"));
        const buckets = countBy(withCategory.map((row) => ({ ...row, __bucket: offlineBucketOf(row) })), "__bucket");
        lines.push("\u79BB\u7EBF\u65F6\u957F\u5206\u5E03\uFF1A" + buckets.map((item) => `${item.label} ${item.value}`).join("\u3001"));
        const longest = safeRows.reduce((max, row) => Math.max(max, Number(row.offline_hours ?? 0) || 0), 0);
        lines.push(`\u6700\u957F\u79BB\u7EBF ${longest.toFixed(1)} \u5C0F\u65F6\u3002`);
        lines.push("");
        lines.push("\u5178\u578B\u5F02\u5E38\u8BB0\u5F55\uFF08\u6700\u591A 10 \u6761\uFF0C\u6309\u79BB\u7EBF\u65F6\u957F\u964D\u5E8F\uFF09\uFF1A");
        [...safeRows].sort((a, b) => (Number(b.offline_hours) || 0) - (Number(a.offline_hours) || 0)).slice(0, 10).forEach((row, index) => {
          lines.push(`${index + 1}. ${row.building ?? "\u2014"} / ${row.location ?? "\u2014"}\uFF1A${faultCategoryOf(row)} ${typeof row.offline_hours === "number" ? row.offline_hours.toFixed(1) + " \u5C0F\u65F6" : ""}\uFF08\u6570\u636E\u65F6\u95F4 ${row.data_time ?? "\u2014"}\uFF09`);
        });
      } else if (kind === "hazards") {
        const isOverdueRow = (row) => row.hazard_status !== "\u5DF2\u6574\u6539" && Number(row.remaining_days ?? 0) < 0;
        const overdue = safeRows.filter(isOverdueRow).length;
        lines.push(`\u6570\u636E\u6982\u51B5\uFF1A\u5171 ${safeRows.length} \u6761\u9690\u60A3\uFF0C\u903E\u671F\u672A\u6574\u6539 ${overdue} \u6761\u3002`);
        lines.push("\u7B49\u7EA7\u5206\u5E03\uFF1A" + countBy(safeRows, "level").map((item) => `${item.label} ${item.value}`).join("\u3001"));
        lines.push("\u72B6\u6001\u5206\u5E03\uFF1A" + countBy(safeRows, "hazard_status").map((item) => `${item.label} ${item.value}`).join("\u3001"));
        lines.push("");
        lines.push("\u903E\u671F\u672A\u6574\u6539\u9690\u60A3\uFF08\u6700\u591A 10 \u6761\uFF0C\u6700\u7D27\u6025\u5728\u524D\uFF09\uFF1A");
        safeRows.filter(isOverdueRow).sort((a, b) => (Number(a.remaining_days) || 0) - (Number(b.remaining_days) || 0)).slice(0, 10).forEach((row, index) => {
          lines.push(`${index + 1}. ${row.description ?? "\u2014"}\uFF08${row.level ?? "\u2014"}\uFF0C\u8D23\u4EFB\u4EBA ${row.responsible ?? "\u2014"}\uFF0C\u622A\u6B62 ${row.deadline ?? "\u2014"}\uFF0C\u8D85\u671F ${Math.abs(Number(row.remaining_days) || 0).toFixed(0)} \u5929\uFF09`);
        });
      } else if (kind === "duties") {
        const isOverdueRow = (row) => row.plan_status !== "\u5DF2\u5B8C\u6210" && Number(row.countdown ?? 0) < 0;
        const completed = safeRows.filter((row) => row.plan_status === "\u5DF2\u5B8C\u6210").length;
        lines.push(`\u6570\u636E\u6982\u51B5\uFF1A\u5171 ${safeRows.length} \u9879\u503C\u73ED\u4EFB\u52A1\uFF0C\u5DF2\u5B8C\u6210 ${completed}\uFF0C\u672A\u5B8C\u6210 ${safeRows.length - completed}\uFF0C\u5176\u4E2D\u903E\u671F\u672A\u5B8C\u6210 ${safeRows.filter(isOverdueRow).length}\u3002`);
        lines.push("\u72B6\u6001\u5206\u5E03\uFF1A" + countBy(safeRows, "plan_status").map((item) => `${item.label} ${item.value}`).join("\u3001"));
        lines.push("");
        lines.push("\u903E\u671F\u672A\u5B8C\u6210\u4EFB\u52A1\uFF08\u6700\u591A 10 \u6761\uFF09\uFF1A");
        safeRows.filter(isOverdueRow).slice(0, 10).forEach((row, index) => {
          lines.push(`${index + 1}. ${row.plan_type ?? "\u2014"} / ${row.position ?? "\u2014"}\uFF08\u8D23\u4EFB\u4EBA ${row.responsible ?? "\u2014"}\uFF0C${row.start_date ?? "\u2014"} \u81F3 ${row.end_date ?? "\u2014"}\uFF0C\u72B6\u6001 ${row.plan_status ?? "\u2014"}\uFF09`);
        });
      } else if (kind === "budget") {
        lines.push(`\u6570\u636E\u6982\u51B5\uFF1A\u5171 ${safeRows.length} \u4E2A\u9884\u7B97\u79D1\u76EE\u3002`);
        const top = [...safeRows].sort((a, b) => (Number(b.yearly_usage) || 0) - (Number(a.yearly_usage) || 0)).slice(0, 10);
        lines.push("\u5E74\u5EA6\u4F7F\u7528\u91D1\u989D TOP10\uFF1A");
        top.forEach((row, index) => {
          lines.push(`${index + 1}. ${row.subject ?? "\u2014"}\uFF1A\u5E74\u5EA6\u4F7F\u7528 ${(Number(row.yearly_usage) || 0).toLocaleString("zh-CN")}\uFF0C\u5E74\u5EA6\u5360\u6BD4 ${row.yearly_rate ?? "\u2014"}\uFF0C\u672C\u671F\u5360\u6BD4 ${row.current_rate ?? "\u2014"}`);
        });
      }
      lines.push("");
      lines.push("\u8BF7\u8F93\u51FA\uFF1A1) \u6309\u4F18\u5148\u7EA7\u6392\u5E8F\u7684\u95EE\u9898\u6E05\u5355\uFF08\u9644\u6570\u636E\u4F9D\u636E\uFF09\uFF1B2) \u6BCF\u4E2A\u95EE\u9898\u7684\u53EF\u80FD\u539F\u56E0\u5206\u6790\uFF1B3) \u5EFA\u8BAE\u7684\u5904\u7F6E\u52A8\u4F5C\u4E0E\u8D23\u4EFB\u5206\u5DE5\uFF1B4) \u9700\u8981\u6301\u7EED\u76D1\u63A7\u7684\u6307\u6807\u3002\u7528\u4E2D\u6587\uFF0C\u5206\u70B9\uFF0C\u7B80\u6D01\u3002");
      return lines.join("\n");
    };
    function ProjectPicker({ projects, selected, onToggle, onConfirm, loading }) {
      const [keyword, setKeyword] = useState("");
      const filtered = useMemo(() => {
        const needle = keyword.trim().toLowerCase();
        if (!needle) return projects;
        return projects.filter((project) => project.name.toLowerCase().includes(needle));
      }, [projects, keyword]);
      return h(
        "div",
        { className: "dcPicker" },
        h("h2", { className: "dcPicker__title" }, COPY.chooseProject),
        h("p", { className: "dcPicker__hint" }, COPY.chooseProjectHint),
        h("input", {
          className: "dcInput",
          type: "search",
          value: keyword,
          placeholder: COPY.search,
          "aria-label": COPY.search,
          onChange: (event) => setKeyword(event.target.value)
        }),
        filtered.length === 0 ? h("div", { className: "dcEmpty" }, COPY.noProject) : h("ul", { className: "dcPicker__list" }, filtered.map((project) => {
          const active = selected.includes(project.name);
          return h(
            "li",
            { key: project.name },
            h(
              "label",
              { className: "dcPicker__item" },
              h("input", {
                type: "checkbox",
                checked: active,
                onChange: () => onToggle(project.name)
              }),
              h("span", { className: "dcPicker__name" }, project.name),
              project.pm_name || project.eng_name ? h("span", { className: "dcPicker__owner" }, [project.pm_name, project.eng_name].filter(Boolean).join(" / ")) : null
            )
          );
        })),
        h(
          "div",
          { className: "dcPicker__actions" },
          h("button", {
            className: "dcBtn dcBtn--primary",
            type: "button",
            disabled: loading || selected.length === 0,
            onClick: onConfirm
          }, loading ? COPY.loading : COPY.confirm),
          h("span", { className: "dcPicker__hint" }, COPY.confirmHint)
        )
      );
    }
    function TopFaultChart({ rows }) {
      if (!rows || rows.length === 0) return h("div", { className: "dcEmpty" }, COPY.empty);
      const maxTotal = Math.max(...rows.map((row) => row.total), 1);
      const maxFault = Math.max(...rows.map((row) => row.fault), 1);
      return h("div", { className: "dcChartRows" }, rows.map((row) => h(
        "div",
        { className: "dcChartRow", key: row.name },
        h("div", { className: "dcChartRow__label", title: row.name }, row.name),
        h(
          "div",
          { className: "dcChartRow__bars" },
          h(
            "div",
            { className: "dcBarTrack", title: `\u603B\u6570 ${row.total}` },
            h("span", { className: "dcBarFill dcBarFill--track", style: { width: `${row.total / maxTotal * 100}%` } })
          ),
          h(
            "div",
            { className: "dcBarTrack", title: `\u6545\u969C ${row.fault}` },
            h("span", { className: "dcBarFill dcBarFill--fault", style: { width: `${row.fault / Math.max(maxFault, maxTotal) * 100}%` } })
          )
        ),
        h("div", { className: "dcChartRow__value" }, `${row.fault}/${row.total}`)
      )));
    }
    function CommFaultChart({ rows }) {
      if (!rows || rows.length === 0) return h("div", { className: "dcEmpty" }, COPY.empty);
      const SEGMENTS = [
        { key: "offline", label: COPY.chart.offline, color: "#cf222e" },
        { key: "abnormal", label: COPY.chart.abnormal, color: "#9a6700" },
        { key: "unpaid", label: COPY.chart.unpaid, color: "#8250df" }
      ];
      const totals = rows.map((row) => SEGMENTS.reduce((sum, seg) => sum + (row[seg.key] || 0), 0));
      const max = Math.max(...totals, 1);
      return h(
        "div",
        { className: "dcChartBlock" },
        h("div", { className: "dcChartLegend" }, SEGMENTS.map((seg) => h(
          "span",
          { className: "dcLegendItem", key: seg.key },
          h("span", { className: "dcLegendDot", style: { background: seg.color } }),
          seg.label
        ))),
        h("div", { className: "dcChartRows" }, rows.map((row, index) => {
          const total = totals[index];
          return h(
            "div",
            { className: "dcChartRow", key: row.name },
            h("div", { className: "dcChartRow__label", title: row.name }, row.name),
            h(
              "div",
              { className: "dcChartRow__bars" },
              h(
                "div",
                { className: "dcBarTrack dcBarTrack--stack", title: `${COPY.chart.total} ${total}` },
                SEGMENTS.map((seg) => h("span", {
                  key: seg.key,
                  className: "dcBarFill",
                  style: { width: total ? `${(row[seg.key] || 0) / max * 100}%` : "0%", background: seg.color },
                  title: `${seg.label} ${row[seg.key] || 0}`
                }))
              )
            ),
            h("div", { className: "dcChartRow__value" }, total)
          );
        }))
      );
    }
    function HazardDonut({ status }) {
      if (!status) return h("div", { className: "dcEmpty" }, COPY.empty);
      const ITEMS = [
        { key: "overdue", label: COPY.chart.hazardOverdue, color: "#cf222e", value: status.overdue },
        { key: "imminent", label: COPY.chart.hazardImminent, color: "#9a6700", value: status.imminent },
        { key: "pending", label: COPY.chart.hazardPending, color: "#0969da", value: status.pending }
      ];
      const total = ITEMS.reduce((sum, item) => sum + item.value, 0);
      const RADIUS = 52;
      const CIRCUM = 2 * Math.PI * RADIUS;
      let offset = 0;
      const arcs = ITEMS.map((item) => {
        const fraction = total ? item.value / total : 0;
        const arc = { ...item, dash: fraction * CIRCUM, offset };
        offset += fraction * CIRCUM;
        return arc;
      });
      return h(
        "div",
        { className: "dcDonut" },
        h(
          "svg",
          { viewBox: "0 0 140 140", className: "dcDonut__svg", role: "img", "aria-label": COPY.chart.hazardTitle },
          h("circle", { cx: 70, cy: 70, r: RADIUS, fill: "none", stroke: "#d0d7de", strokeWidth: 18 }),
          arcs.map((arc) => h("circle", {
            key: arc.key,
            cx: 70,
            cy: 70,
            r: RADIUS,
            fill: "none",
            stroke: arc.color,
            strokeWidth: 18,
            strokeDasharray: `${arc.dash} ${CIRCUM - arc.dash}`,
            strokeDashoffset: -arc.offset,
            transform: "rotate(-90 70 70)",
            title: `${arc.label} ${arc.value}`
          })),
          h("text", { x: 70, y: 66, textAnchor: "middle", className: "dcDonut__value" }, String(total)),
          h("text", { x: 70, y: 88, textAnchor: "middle", className: "dcDonut__label" }, COPY.chart.hazardTotal)
        ),
        h("div", { className: "dcDonut__legend" }, ITEMS.map((item) => h(
          "div",
          { className: "dcDonutLegend__item", key: item.key },
          h("span", { className: "dcLegendDot", style: { background: item.color } }),
          h("span", { className: "dcDonutLegend__label" }, item.label),
          h("span", { className: "dcDonutLegend__value" }, item.value)
        )))
      );
    }
    function CoveragePanel({ group }) {
      const rows = [];
      if (group?.meters) {
        rows.push({ label: COPY.chart.meterCoverage, value: Math.round(group.meters.project_count / 30 * 100) });
        rows.push({ label: COPY.chart.meterHealth, value: Math.round((1 - (group.meters.fault_rate || 0)) * 100) });
      }
      if (group?.safety) {
        rows.push({ label: COPY.chart.safetyCoverage, value: Math.round(group.safety.project_count / 45 * 100) });
      }
      if (group?.equipment) {
        rows.push({ label: COPY.chart.equipmentCoverage, value: Math.round(group.equipment.project_count / 25 * 100) });
        rows.push({ label: COPY.chart.equipmentHealth, value: Math.round((1 - (group.equipment.fault_rate || 0)) * 100) });
      }
      if (!rows.length) return h("div", { className: "dcEmpty" }, COPY.empty);
      return h("div", { className: "dcCoverage" }, rows.map((row) => {
        const tone = row.value >= 80 ? "good" : row.value >= 50 ? "mid" : "low";
        return h(
          "div",
          { className: "dcCoverage__row", key: row.label },
          h("span", { className: "dcCoverage__label" }, row.label),
          h(
            "div",
            { className: "dcCoverage__track", role: "progressbar", "aria-valuenow": row.value, "aria-valuemin": 0, "aria-valuemax": 100, "aria-label": row.label },
            h("span", { className: `dcCoverage__fill dcCoverage__fill--${tone}`, style: { width: `${Math.min(row.value, 100)}%` } })
          ),
          h("span", { className: `dcCoverage__value dcCoverage__value--${tone}` }, `${row.value}%`)
        );
      }));
    }
    function SyncPanel({ sync }) {
      const info = sync?.sync_info;
      const status = sync?.status;
      const counts = status?.table_counts;
      const entries = counts ? Object.entries(counts) : [];
      return h(
        "div",
        { className: "dcSync" },
        h(
          "div",
          { className: "dcSync__meta" },
          h("span", null, `${COPY.chart.lastSync}\uFF1A${status?.last_sync ?? info?.last_sync ?? "\u2014"}`),
          info?.source_file ? h("span", { className: "dcSync__source" }, `${COPY.chart.source}\uFF1A${info.source_file}`) : null
        ),
        entries.length ? h("div", { className: "dcSync__tables" }, entries.map(([name, count]) => h(
          "span",
          { className: "dcSync__table", key: name, title: name },
          h("b", null, (count ?? 0).toLocaleString("zh-CN")),
          " ",
          name
        ))) : null
      );
    }
    function Overview({ data, projects }) {
      const group = data?.group ?? {};
      const charts = data?.charts ?? {};
      const totals = data?.totals ?? {};
      const equipment = totals.equipment;
      const meters = totals.meters;
      const safety = totals.safety;
      const card = ({ label, module, field, compute, hint, tone }) => h(MetricCard, {
        label,
        value: module ? compute ? compute(module) : cell(module[field]) : COPY.noData,
        hint: module ? hint(module) : COPY.noDataHint,
        tone
      });
      return h(
        "div",
        { className: "dcOverview" },
        h("h3", { className: "dcSection__title" }, COPY.chart.groupKpi),
        h(
          "div",
          { className: "dcGrid dcGrid--six" },
          card({ label: COPY.chart.kpiMeters, module: group.meters, field: "total", hint: (value) => `\u6545\u969C ${cell(value.fault)} / \u79BB\u7EBF ${cell(value.offline)}` }),
          card({ label: COPY.chart.kpiMeterRate, module: group.meters, compute: (value) => `${((value.fault_rate || 0) * 100).toFixed(2)}%`, hint: (value) => `${cell(value.project_count)} \u4E2A\u9879\u76EE`, tone: "warn" }),
          card({ label: COPY.chart.kpiHazard, module: group.safety, field: "hazard_total", hint: (value) => `\u903E\u671F ${cell(value.hazard_overdue)}`, tone: group.safety?.hazard_overdue > 0 ? "alert" : void 0 }),
          card({ label: COPY.chart.kpiDuty, module: group.safety, field: "duty_total", hint: (value) => `\u5DF2\u903E\u671F ${cell(value.duty_overdue)}`, tone: group.safety?.duty_overdue > 0 ? "alert" : void 0 }),
          card({ label: COPY.chart.kpiWater, module: group.safety, compute: (value) => cell((value.wp_low || 0) + (value.wp_high || 0)), hint: (value) => `\u5931\u538B ${cell(value.wp_low)}`, tone: "warn" }),
          card({ label: COPY.chart.kpiEquipment, module: group.equipment, field: "total", hint: (value) => `\u6545\u969C ${cell(value.fault)} / ${((value.fault_rate || 0) * 100).toFixed(1)}%` })
        ),
        h("h3", { className: "dcSection__title" }, COPY.chart.dataAnalysis),
        h(
          "div",
          { className: "dcChartGrid" },
          h(
            "div",
            { className: "dcPanel dcPanel--chart" },
            h("h4", { className: "dcChartTitle" }, COPY.chart.metersTopTitle),
            h(TopFaultChart, { rows: charts.metersTop })
          ),
          h(
            "div",
            { className: "dcPanel dcPanel--chart" },
            h("h4", { className: "dcChartTitle" }, COPY.chart.commFaultTitle),
            h(CommFaultChart, { rows: charts.commFaults })
          ),
          h(
            "div",
            { className: "dcPanel dcPanel--chart" },
            h("h4", { className: "dcChartTitle" }, COPY.chart.hazardTitle),
            h(HazardDonut, { status: charts.hazardStatus })
          ),
          h(
            "div",
            { className: "dcPanel dcPanel--chart" },
            h("h4", { className: "dcChartTitle" }, COPY.chart.coverageTitle),
            h(CoveragePanel, { group })
          )
        ),
        projects.length > 0 ? h(
          "div",
          { className: "dcPanel" },
          h("h3", { className: "dcPanel__title" }, COPY.chart.selectedProjects),
          h(
            "div",
            { className: "dcGrid" },
            card({ label: `${COPY.units.total}\u8BBE\u5907`, module: equipment, field: "total", hint: (value) => `\u6545\u969C ${cell(value.fault)} \xB7 ${pct(value.fault_rate)}` }),
            card({ label: `${COPY.units.total}\u7535\u8868`, module: meters, field: "total", hint: (value) => `\u6545\u969C ${cell(value.fault)} \xB7 \u79BB\u7EBF ${cell(value.offline)}`, tone: "warn" }),
            card({ label: `${COPY.units.total}\u503C\u73ED\u4EFB\u52A1`, module: safety, field: "duty_total", hint: (value) => `\u903E\u671F ${cell(value.duty_overdue)}`, tone: safety?.duty_overdue > 0 ? "alert" : void 0 }),
            card({ label: `${COPY.units.total}\u9690\u60A3`, module: safety, field: "hazard_total", hint: (value) => `\u903E\u671F ${cell(value.hazard_overdue)} \xB7 \u4E34\u671F ${cell(value.hazard_imminent)}`, tone: safety?.hazard_overdue > 0 ? "alert" : void 0 })
          ),
          projects.length > 1 ? h(
            "div",
            { className: "dcTableWrap" },
            h(
              "table",
              { className: "dcTable" },
              h("thead", null, h(
                "tr",
                null,
                h("th", { scope: "col" }, COPY.project),
                h("th", { scope: "col" }, "\u8BBE\u5907\u6545\u969C\u7387"),
                h("th", { scope: "col" }, "\u7535\u8868\u6545\u969C\u7387"),
                h("th", { scope: "col" }, "\u7535\u8868\u6B20\u8D39"),
                h("th", { scope: "col" }, "\u503C\u73ED\u903E\u671F"),
                h("th", { scope: "col" }, "\u9690\u60A3\u903E\u671F")
              )),
              h("tbody", null, projects.map((project) => h(
                "tr",
                { key: project.name },
                h("td", null, project.name),
                h("td", null, pct(project.equipment?.fault_rate)),
                h("td", null, pct(project.meters?.fault_rate)),
                h("td", null, cell(project.meters?.unpaid)),
                h("td", null, cell(project.safety?.duty_overdue)),
                h("td", null, cell(project.safety?.hazard_overdue))
              )))
            )
          ) : null
        ) : null,
        data?.sync ? h(SyncPanel, { sync: data.sync }) : null
      );
    }
    function EquipmentDetail({ rows }) {
      return h(DataTable, {
        columns: [
          { key: "device_name", title: COPY.equipmentColumns[0] },
          { key: "device_type", title: COPY.equipmentColumns[1] },
          { key: "device_status", title: COPY.equipmentColumns[2] },
          { key: "online_status", title: COPY.equipmentColumns[3] },
          { key: "last_comm", title: COPY.equipmentColumns[4] },
          { key: "comm_delay", title: COPY.equipmentColumns[5], render: (row) => typeof row.comm_delay === "number" ? row.comm_delay.toFixed(1) : "\u2014" }
        ],
        rows
      });
    }
    function MetersDetail({ rows }) {
      return h(DataTable, {
        columns: [
          { key: "building", title: COPY.metersColumns[0] },
          { key: "location", title: COPY.metersColumns[1] },
          { key: "fault_desc", title: COPY.metersColumns[2] },
          { key: "fault_tag", title: COPY.metersColumns[3] },
          { key: "data_time", title: COPY.metersColumns[4] },
          { key: "offline_hours", title: COPY.metersColumns[5], render: (row) => typeof row.offline_hours === "number" ? row.offline_hours.toFixed(1) : "\u2014" }
        ],
        rows
      });
    }
    function HazardsDetail({ rows }) {
      return h(DataTable, {
        columns: [
          { key: "description", title: COPY.hazardsColumns[0] },
          { key: "level", title: COPY.hazardsColumns[1] },
          { key: "hazard_status", title: COPY.hazardsColumns[2] },
          { key: "responsible", title: COPY.hazardsColumns[3] },
          { key: "deadline", title: COPY.hazardsColumns[4] },
          { key: "remaining_days", title: COPY.hazardsColumns[5], render: (row) => typeof row.remaining_days === "number" ? row.remaining_days.toFixed(0) : "\u2014" }
        ],
        rows
      });
    }
    function DutiesDetail({ rows }) {
      return h(DataTable, {
        columns: [
          { key: "plan_type", title: COPY.dutiesColumns[0] },
          { key: "position", title: COPY.dutiesColumns[1] },
          { key: "responsible", title: COPY.dutiesColumns[2] },
          { key: "start_date", title: COPY.dutiesColumns[3] },
          { key: "end_date", title: COPY.dutiesColumns[4] },
          { key: "plan_status", title: COPY.dutiesColumns[5] }
        ],
        rows
      });
    }
    function BudgetTable({ rows }) {
      return h(DataTable, {
        columns: [
          { key: "subject", title: COPY.budgetColumns[0] },
          { key: "current_usage", title: COPY.budgetColumns[1], render: (row) => typeof row.current_usage === "number" ? row.current_usage.toLocaleString("zh-CN") : "\u2014" },
          { key: "current_rate", title: COPY.budgetColumns[2] },
          { key: "yearly_usage", title: COPY.budgetColumns[3], render: (row) => typeof row.yearly_usage === "number" ? row.yearly_usage.toLocaleString("zh-CN") : "\u2014" },
          { key: "yearly_rate", title: COPY.budgetColumns[4] }
        ],
        rows
      });
    }
    function EquipmentPage({ rows, truncated, onReport, reportBusy }) {
      const [keyword, setKeyword] = useState("");
      const [online, setOnline] = useState("all");
      const [deviceStatus, setDeviceStatus] = useState("all");
      const filtered = useMemo(() => {
        const needle = keyword.trim().toLowerCase();
        return (rows ?? []).filter((row) => {
          if (online !== "all" && row.online_status !== online) return false;
          if (deviceStatus !== "all" && row.device_status !== deviceStatus) return false;
          if (needle && !`${row.device_name ?? ""}${row.device_type ?? ""}`.toLowerCase().includes(needle)) return false;
          return true;
        });
      }, [rows, keyword, online, deviceStatus]);
      const onlineDist = countBy(filtered, "online_status");
      const statusDist = countBy(filtered, "device_status");
      const typeTop = topN(countBy(filtered, "device_type"), 5);
      const offlineCount = filtered.filter((row) => row.online_status === "\u79BB\u7EBF").length;
      const abnormalCount = filtered.filter((row) => row.device_status && row.device_status !== "\u6B63\u5E38").length;
      return h(
        "div",
        { className: "dcDetailPage" },
        h(StatStrip, { stats: [
          { label: COPY.stat.total, value: filtered.length },
          { label: COPY.stat.online, value: filtered.length - offlineCount },
          { label: COPY.stat.offline, value: offlineCount, tone: offlineCount > 0 ? "warn" : void 0 },
          { label: COPY.stat.abnormal, value: abnormalCount, tone: abnormalCount > 0 ? "alert" : void 0 },
          { label: COPY.stat.faultRate, value: filtered.length ? pct(offlineCount / filtered.length) : "\u2014" }
        ] }),
        h(FilterBar, {
          keyword,
          onKeyword: setKeyword,
          groups: [
            { key: "online", label: COPY.filter.online, value: online, onChange: setOnline, options: [{ value: "\u5728\u7EBF", label: "\u5728\u7EBF" }, { value: "\u79BB\u7EBF", label: "\u79BB\u7EBF" }] },
            { key: "status", label: COPY.filter.deviceStatus, value: deviceStatus, onChange: setDeviceStatus, options: [...new Set((rows ?? []).map((row) => row.device_status).filter(Boolean))].map((value) => ({ value, label: value })) }
          ],
          onReset: () => {
            setKeyword("");
            setOnline("all");
            setDeviceStatus("all");
          },
          onReport,
          reportBusy
        }),
        h(
          "div",
          { className: "dcDetailCharts" },
          h(DistDonut, { title: "\u5728\u7EBF\u72B6\u6001\u5206\u5E03", data: onlineDist.map((item) => ({ ...item, color: item.label === "\u79BB\u7EBF" ? "#cf222e" : "#1a7f37" })) }),
          h(MiniBars, { title: "\u8BBE\u5907\u72B6\u6001\u5206\u5E03", data: statusDist.map((item) => ({ ...item, color: item.label === "\u6B63\u5E38" ? "#1a7f37" : "#9a6700" })) }),
          h(MiniBars, { title: "\u8BBE\u5907\u7C7B\u578B TOP5", data: typeTop })
        ),
        h(DataTable, { rows: filtered, columns: [
          { key: "device_name", title: COPY.equipmentColumns[0] },
          { key: "device_type", title: COPY.equipmentColumns[1] },
          { key: "device_status", title: COPY.equipmentColumns[2] },
          { key: "online_status", title: COPY.equipmentColumns[3] },
          { key: "last_comm", title: COPY.equipmentColumns[4] },
          { key: "comm_delay", title: COPY.equipmentColumns[5], render: (row) => typeof row.comm_delay === "number" ? row.comm_delay.toFixed(1) : "\u2014" }
        ], emptyText: COPY.filter.emptyFiltered }),
        truncated ? h("p", { className: "dcFootnote" }, COPY.truncated) : null
      );
    }
    function MetersPage({ rows, truncated, onReport, reportBusy }) {
      const [keyword, setKeyword] = useState("");
      const [category, setCategory] = useState("all");
      const categorized = useMemo(() => (rows ?? []).map((row) => ({ ...row, __category: faultCategoryOf(row) })), [rows]);
      const categories = useMemo(() => [...new Set(categorized.map((row) => row.__category))], [categorized]);
      const filtered = useMemo(() => {
        const needle = keyword.trim().toLowerCase();
        return categorized.filter((row) => {
          if (category !== "all" && row.__category !== category) return false;
          if (needle && !`${row.location ?? ""}${row.building ?? ""}${row.fault_desc ?? ""}`.toLowerCase().includes(needle)) return false;
          return true;
        });
      }, [categorized, keyword, category]);
      const categoryDist = countBy(filtered, "__category");
      const bucketDist = countBy(filtered.map((row) => ({ ...row, __bucket: offlineBucketOf(row) })), "__bucket");
      const bucketOrder = [COPY.stat.within24h, COPY.stat.oneTo3d, COPY.stat.over3d, "\u672A\u8BB0\u5F55"];
      const bucketSorted = bucketOrder.map((label) => bucketDist.find((item) => item.label === label)).filter(Boolean);
      const longest = filtered.reduce((max, row) => Math.max(max, Number(row.offline_hours ?? 0) || 0), 0);
      return h(
        "div",
        { className: "dcDetailPage" },
        h(StatStrip, { stats: [
          { label: COPY.stat.total, value: filtered.length },
          { label: COPY.stat.longestOffline, value: `${longest.toFixed(1)} ${COPY.stat.hours}`, tone: longest > 72 ? "alert" : longest > 24 ? "warn" : void 0 },
          { label: COPY.stat.over3d, value: bucketDist.find((item) => item.label === COPY.stat.over3d)?.value ?? 0, tone: (bucketDist.find((item) => item.label === COPY.stat.over3d)?.value ?? 0) > 0 ? "alert" : void 0 },
          { label: COPY.stat.oneTo3d, value: bucketDist.find((item) => item.label === COPY.stat.oneTo3d)?.value ?? 0 },
          { label: COPY.stat.within24h, value: bucketDist.find((item) => item.label === COPY.stat.within24h)?.value ?? 0 }
        ] }),
        h(FilterBar, {
          keyword,
          onKeyword: setKeyword,
          groups: [
            { key: "category", label: COPY.filter.faultCategory, value: category, onChange: setCategory, options: categories.map((value) => ({ value, label: value })) }
          ],
          onReset: () => {
            setKeyword("");
            setCategory("all");
          },
          onReport,
          reportBusy
        }),
        h(
          "div",
          { className: "dcDetailCharts" },
          h(DistDonut, { title: "\u6545\u969C\u7C7B\u578B\u5206\u5E03", data: categoryDist.slice(0, 5).map((item, index) => ({ ...item, color: ["#cf222e", "#9a6700", "#8250df", "#0969da", "#656d76"][index] })) }),
          h(MiniBars, { title: COPY.stat.offlineDuration, data: bucketSorted })
        ),
        h(DataTable, { rows: filtered, columns: [
          { key: "building", title: COPY.metersColumns[0] },
          { key: "location", title: COPY.metersColumns[1] },
          { key: "fault_desc", title: COPY.metersColumns[2] },
          { key: "__category", title: COPY.metersColumns[3] },
          { key: "data_time", title: COPY.metersColumns[4] },
          { key: "offline_hours", title: COPY.metersColumns[5], render: (row) => typeof row.offline_hours === "number" ? row.offline_hours.toFixed(1) : "\u2014" }
        ], emptyText: COPY.filter.emptyFiltered }),
        truncated ? h("p", { className: "dcFootnote" }, COPY.truncated) : null
      );
    }
    function HazardsPage({ rows, truncated, onReport, reportBusy }) {
      const [keyword, setKeyword] = useState("");
      const [level, setLevel] = useState("all");
      const [status, setStatus] = useState("all");
      const [overdue, setOverdue] = useState("all");
      const isOverdueRow = (row) => row.hazard_status !== "\u5DF2\u6574\u6539" && Number(row.remaining_days ?? 0) < 0;
      const filtered = useMemo(() => {
        const needle = keyword.trim().toLowerCase();
        return (rows ?? []).filter((row) => {
          if (level !== "all" && row.level !== level) return false;
          if (status !== "all" && row.hazard_status !== status) return false;
          if (overdue === "yes" && !isOverdueRow(row)) return false;
          if (overdue === "no" && isOverdueRow(row)) return false;
          if (needle && !`${row.description ?? ""}${row.responsible ?? ""}${row.category ?? ""}`.toLowerCase().includes(needle)) return false;
          return true;
        });
      }, [rows, keyword, level, status, overdue]);
      const levelDist = countBy(filtered, "level");
      const statusDist = countBy(filtered, "hazard_status");
      const overdueCount = filtered.filter(isOverdueRow).length;
      const rectified = filtered.filter((row) => row.hazard_status === "\u5DF2\u6574\u6539").length;
      const imminent = filtered.filter((row) => {
        const days = Number(row.remaining_days ?? Number.NaN);
        return row.hazard_status !== "\u5DF2\u6574\u6539" && Number.isFinite(days) && days >= 0 && days <= 7;
      }).length;
      return h(
        "div",
        { className: "dcDetailPage" },
        h(StatStrip, { stats: [
          { label: COPY.stat.total, value: filtered.length },
          { label: COPY.stat.rectified, value: rectified },
          { label: COPY.stat.overdueUnfixed, value: overdueCount, tone: overdueCount > 0 ? "alert" : void 0 },
          { label: COPY.stat.imminentDays, value: imminent, tone: imminent > 0 ? "warn" : void 0 }
        ] }),
        h(FilterBar, {
          keyword,
          onKeyword: setKeyword,
          groups: [
            { key: "level", label: COPY.filter.level, value: level, onChange: setLevel, options: [...new Set((rows ?? []).map((row) => row.level).filter(Boolean))].map((value) => ({ value, label: value })) },
            { key: "status", label: COPY.filter.hazardStatus, value: status, onChange: setStatus, options: [...new Set((rows ?? []).map((row) => row.hazard_status).filter(Boolean))].map((value) => ({ value, label: value })) },
            { key: "overdue", label: COPY.filter.overdue, value: overdue, onChange: setOverdue, options: [{ value: "yes", label: COPY.filter.isOverdue }, { value: "no", label: COPY.filter.notOverdue }] }
          ],
          onReset: () => {
            setKeyword("");
            setLevel("all");
            setStatus("all");
            setOverdue("all");
          },
          onReport,
          reportBusy
        }),
        h(
          "div",
          { className: "dcDetailCharts" },
          h(MiniBars, { title: "\u9690\u60A3\u7B49\u7EA7\u5206\u5E03", data: levelDist.map((item) => ({ ...item, color: item.label.includes("\u91CD\u5927") ? "#cf222e" : item.label.includes("\u8F83\u5927") ? "#9a6700" : "#0969da" })) }),
          h(MiniBars, { title: "\u6574\u6539\u72B6\u6001\u5206\u5E03", data: statusDist.map((item) => ({ ...item, color: item.label === "\u5DF2\u6574\u6539" ? "#1a7f37" : "#cf222e" })) })
        ),
        h(DataTable, { rows: filtered, columns: [
          { key: "description", title: COPY.hazardsColumns[0] },
          { key: "level", title: COPY.hazardsColumns[1], nowrap: true },
          { key: "hazard_status", title: COPY.hazardsColumns[2], nowrap: true },
          { key: "responsible", title: COPY.hazardsColumns[3], nowrap: true },
          { key: "deadline", title: COPY.hazardsColumns[4], nowrap: true },
          // 已整改的隐患不再显示「剩余天数」：整改完成后该数字没有意义（会显示 -300 这类噪声）。
          { key: "remaining_days", title: COPY.hazardsColumns[5], nowrap: true, render: (row) => {
            if (row.hazard_status === "\u5DF2\u6574\u6539") return "\u2014";
            if (typeof row.remaining_days !== "number") return "\u2014";
            const days = Math.round(row.remaining_days);
            return days < 0 ? `\u903E\u671F ${Math.abs(days)} \u5929` : `${days} \u5929`;
          } }
        ], emptyText: COPY.filter.emptyFiltered }),
        truncated ? h("p", { className: "dcFootnote" }, COPY.truncated) : null
      );
    }
    function DutiesPage({ rows, truncated, onReport, reportBusy }) {
      const [keyword, setKeyword] = useState("");
      const [status, setStatus] = useState("all");
      const [overdue, setOverdue] = useState("all");
      const isOverdueRow = (row) => row.plan_status !== "\u5DF2\u5B8C\u6210" && Number(row.countdown ?? 0) < 0;
      const filtered = useMemo(() => {
        const needle = keyword.trim().toLowerCase();
        return (rows ?? []).filter((row) => {
          if (status !== "all" && row.plan_status !== status) return false;
          if (overdue === "yes" && !isOverdueRow(row)) return false;
          if (overdue === "no" && isOverdueRow(row)) return false;
          if (needle && !`${row.plan_type ?? ""}${row.position ?? ""}${row.responsible ?? ""}`.toLowerCase().includes(needle)) return false;
          return true;
        });
      }, [rows, keyword, status, overdue]);
      const statusDist = countBy(filtered, "plan_status");
      const completed = filtered.filter((row) => row.plan_status === "\u5DF2\u5B8C\u6210").length;
      const overdueCount = filtered.filter(isOverdueRow).length;
      return h(
        "div",
        { className: "dcDetailPage" },
        h(StatStrip, { stats: [
          { label: COPY.stat.total, value: filtered.length },
          { label: COPY.stat.completed, value: completed },
          { label: COPY.stat.overdueUnfinished, value: overdueCount, tone: overdueCount > 0 ? "alert" : void 0 },
          { label: COPY.stat.uncompleted, value: filtered.length - completed, tone: filtered.length - completed > 0 ? "warn" : void 0 }
        ] }),
        h(FilterBar, {
          keyword,
          onKeyword: setKeyword,
          groups: [
            { key: "status", label: COPY.filter.dutyStatus, value: status, onChange: setStatus, options: [...new Set((rows ?? []).map((row) => row.plan_status).filter(Boolean))].map((value) => ({ value, label: value })) },
            { key: "overdue", label: COPY.filter.overdue, value: overdue, onChange: setOverdue, options: [{ value: "yes", label: COPY.filter.isOverdue }, { value: "no", label: COPY.filter.notOverdue }] }
          ],
          onReset: () => {
            setKeyword("");
            setStatus("all");
            setOverdue("all");
          },
          onReport,
          reportBusy
        }),
        h(
          "div",
          { className: "dcDetailCharts" },
          h(MiniBars, { title: "\u503C\u73ED\u72B6\u6001\u5206\u5E03", data: statusDist.map((item) => ({ ...item, color: item.label === "\u5DF2\u5B8C\u6210" ? "#1a7f37" : item.label.includes("\u903E\u671F") ? "#cf222e" : "#0969da" })) })
        ),
        h(DataTable, { rows: filtered, columns: [
          { key: "plan_type", title: COPY.dutiesColumns[0] },
          { key: "position", title: COPY.dutiesColumns[1] },
          { key: "responsible", title: COPY.dutiesColumns[2] },
          { key: "start_date", title: COPY.dutiesColumns[3] },
          { key: "end_date", title: COPY.dutiesColumns[4] },
          { key: "plan_status", title: COPY.dutiesColumns[5] }
        ], emptyText: COPY.filter.emptyFiltered }),
        truncated ? h("p", { className: "dcFootnote" }, COPY.truncated) : null
      );
    }
    function BudgetPage({ rows, onReport, reportBusy }) {
      const [keyword, setKeyword] = useState("");
      const filtered = useMemo(() => {
        const needle = keyword.trim().toLowerCase();
        if (!needle) return rows ?? [];
        return (rows ?? []).filter((row) => String(row.subject ?? "").toLowerCase().includes(needle));
      }, [rows, keyword]);
      const topUsage = topN([...filtered ?? []].sort((a, b) => (Number(b.yearly_usage) || 0) - (Number(a.yearly_usage) || 0)), 10).map((row) => ({ label: row.subject, value: Math.round(Number(row.yearly_usage) || 0) }));
      return h(
        "div",
        { className: "dcDetailPage" },
        h(FilterBar, {
          keyword,
          onKeyword: setKeyword,
          groups: [],
          onReset: () => setKeyword(""),
          onReport,
          reportBusy
        }),
        h(
          "div",
          { className: "dcDetailCharts" },
          h(MiniBars, { title: "\u5E74\u5EA6\u4F7F\u7528\u91D1\u989D TOP10", data: topUsage })
        ),
        h(BudgetTable, { rows: filtered })
      );
    }
    const TABS = [
      { id: "overview", title: COPY.overview },
      { id: "equipment", title: COPY.equipment },
      { id: "meters", title: COPY.meters },
      { id: "safety", title: COPY.safety },
      { id: "budget", title: COPY.budget }
    ];
    function BusinessPanel({ service, entry, active, conversation, host }) {
      const [projects, setProjects] = useState([]);
      const [selected, setSelected] = useState([]);
      const [overview, setOverview] = useState(null);
      const [tab, setTab] = useState("overview");
      const [detail, setDetail] = useState({});
      const [loading, setLoading] = useState(true);
      const [detailLoading, setDetailLoading] = useState(false);
      const [error, setError] = useState("");
      const [picking, setPicking] = useState(false);
      const [aiBusy, setAiBusy] = useState(false);
      const [aiError, setAiError] = useState("");
      const [reportNotice, setReportNotice] = useState("");
      const [chatOpen, setChatOpen] = useState(false);
      const request = useCallback(async (path, options) => {
        const response = await fetch(path, { credentials: "same-origin", cache: "no-store", ...options });
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error || `HTTP ${response.status}`);
        return data;
      }, []);
      const loadProjects = useCallback(async () => {
        const data = await request(`${API}/projects`);
        setProjects(Array.isArray(data.projects) ? data.projects : []);
      }, [request]);
      const loadOverview = useCallback(async (names) => {
        if (!names.length) {
          setOverview(null);
          return;
        }
        const query = names.map((name) => `project=${encodeURIComponent(name)}`).join("&");
        const data = await request(`${API}/overview?${query}`);
        setOverview(data);
      }, [request]);
      const detailKindsFor = (tabId) => tabId === "safety" ? ["hazards", "duties"] : [tabId];
      const loadDetail = useCallback(async (tabId, names) => {
        if (tabId === "overview" || tabId === "budget" || !names.length) return;
        const kinds = detailKindsFor(tabId);
        setDetailLoading(true);
        try {
          const results = await Promise.all(names.flatMap((name) => kinds.map(async (kind) => {
            const data = await request(`${API}/rows?kind=${encodeURIComponent(kind)}&project=${encodeURIComponent(name)}`);
            return { kind, rows: data.rows ?? [], truncated: data.truncated };
          })));
          const next = {};
          for (const kind of kinds) {
            const matched = results.filter((item) => item.kind === kind);
            next[kind] = {
              rows: matched.flatMap((item) => item.rows),
              truncated: matched.some((item) => item.truncated)
            };
          }
          setDetail((previous) => ({ ...previous, ...next }));
        } catch (detailError) {
          setError(detailError instanceof Error ? detailError.message : String(detailError));
        } finally {
          setDetailLoading(false);
        }
      }, [request]);
      useEffect(() => {
        let cancelled = false;
        (async () => {
          setLoading(true);
          setError("");
          try {
            await loadProjects();
            const stored = await request(`${API}/selection`);
            const names = Array.isArray(stored.projects) ? stored.projects : [];
            if (cancelled) return;
            setSelected(names);
            setPicking(names.length === 0);
            await loadOverview(names);
          } catch (loadError) {
            if (!cancelled) setError(loadError instanceof Error ? loadError.message : String(loadError));
          } finally {
            if (!cancelled) setLoading(false);
          }
        })();
        return () => {
          cancelled = true;
        };
      }, [loadOverview, loadProjects, request]);
      useEffect(() => {
        void loadDetail(tab, selected);
      }, [loadDetail, selected, tab]);
      const toggleProject = useCallback((name) => {
        setSelected((previous) => previous.includes(name) ? previous.filter((item) => item !== name) : [...previous, name]);
      }, []);
      const confirmProjects = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
          await request(`${API}/selection`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ projects: selected })
          });
          setPicking(false);
          await loadOverview(selected);
        } catch (saveError) {
          setError(saveError instanceof Error ? saveError.message : String(saveError));
        } finally {
          setLoading(false);
        }
      }, [loadOverview, request, selected]);
      const refresh = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
          await loadProjects();
          await loadOverview(selected);
        } catch (refreshError) {
          setError(refreshError instanceof Error ? refreshError.message : String(refreshError));
        } finally {
          setLoading(false);
        }
      }, [loadOverview, loadProjects, selected]);
      const startAssistant = useCallback(async () => {
        setAiBusy(true);
        setAiError("");
        try {
          const workspace = service?.defaultWorkspace?.();
          const creation = workspace ? service.newSession(workspace.workspaceId) : service.newWorkspaceSession();
          service?.run?.(creation);
          await creation;
          setChatOpen(true);
        } catch (sessionError) {
          setAiError(sessionError instanceof Error ? sessionError.message : String(sessionError));
        } finally {
          setAiBusy(false);
        }
      }, [service]);
      const runReport = useCallback(async (prompt) => {
        setAiBusy(true);
        setAiError("");
        setReportNotice("");
        try {
          let sessionId = null;
          const current = service?.currentSession?.();
          if (current && service?.ownsSession?.(current)) sessionId = current;
          if (!sessionId) {
            const workspace = service?.defaultWorkspace?.();
            const creation = workspace ? service.newSession(workspace.workspaceId) : service.newWorkspaceSession();
            service?.run?.(creation);
            sessionId = await creation;
          }
          if (!sessionId) {
            setAiError(COPY.report.noSession);
            return;
          }
          const applied = writeDraft(host, sessionId, prompt);
          if (applied === "applied") {
            setReportNotice(COPY.report.done);
          } else {
            void navigator?.clipboard?.writeText?.(prompt).catch(() => {
            });
            setReportNotice(applied === "preserved" ? COPY.report.preserved : COPY.report.clipboard);
          }
          setChatOpen(true);
        } catch (sessionError) {
          setAiError(sessionError instanceof Error ? sessionError.message : String(sessionError));
        } finally {
          setAiBusy(false);
        }
      }, [service, host]);
      const picker = useMemo(() => {
        if (loading && !overview) return h("div", { className: "dcStatus" }, COPY.loading);
        if (error && !overview) {
          return h(
            "div",
            { className: "dcStatus dcStatus--error", role: "alert" },
            h("p", null, `${COPY.loadFailed}\uFF1A${error}`),
            h("button", { className: "dcBtn", type: "button", onClick: refresh }, COPY.retry)
          );
        }
        if (picking || selected.length === 0) {
          return h(ProjectPicker, {
            projects,
            selected,
            onToggle: toggleProject,
            onConfirm: confirmProjects,
            loading
          });
        }
        return null;
      }, [confirmProjects, error, loading, overview, picking, projects, refresh, selected, toggleProject]);
      const reportFor = (kind, rows, truncated) => {
        const prompt = buildReportPrompt(kind, selected, rows, overview?.sync?.status?.last_sync, overview?.sync?.sync_info?.last_sync);
        return runReport(prompt);
      };
      const detailBody = useMemo(() => {
        if (tab === "overview") return h(Overview, { data: overview, projects: overview?.projects ?? [] });
        if (tab === "budget") return h(BudgetPage, { rows: overview?.budget ?? [], onReport: () => reportFor("budget", overview?.budget ?? []), reportBusy: aiBusy });
        if (tab === "safety") {
          const hazards = detail.hazards;
          const duties = detail.duties;
          const loading2 = detailLoading && !hazards && !duties;
          if (loading2) return h("div", { className: "dcStatus" }, COPY.loading);
          return h(
            "div",
            { className: "dcSafetyPage" },
            h(
              "div",
              { className: "dcSafetySection" },
              h("h3", { className: "dcPanel__title" }, COPY.safetyHazardSection),
              h(HazardsPage, { rows: hazards?.rows ?? [], truncated: hazards?.truncated, onReport: () => reportFor("hazards", hazards?.rows ?? []), reportBusy: aiBusy })
            ),
            h(
              "div",
              { className: "dcSafetySection" },
              h("h3", { className: "dcPanel__title" }, COPY.safetyDutySection),
              h(DutiesPage, { rows: duties?.rows ?? [], truncated: duties?.truncated, onReport: () => reportFor("duties", duties?.rows ?? []), reportBusy: aiBusy })
            )
          );
        }
        const state = detail[tab];
        if (detailLoading && !state) return h("div", { className: "dcStatus" }, COPY.loading);
        const rows = state?.rows ?? [];
        const page = tab === "equipment" ? h(EquipmentPage, { rows, truncated: state?.truncated, onReport: () => reportFor("equipment", rows), reportBusy: aiBusy }) : h(MetersPage, { rows, truncated: state?.truncated, onReport: () => reportFor("meters", rows), reportBusy: aiBusy });
        return page;
      }, [detail, detailLoading, overview, tab, aiBusy, selected]);
      const header = h(
        "header",
        { className: "dcHeader", "data-dsh-workbench-toolbar": "" },
        h(
          "div",
          { className: "dcHeader__titles" },
          h("h1", { className: "dcHeader__title" }, COPY.title),
          h("p", { className: "dcHeader__subtitle" }, COPY.subtitle)
        ),
        h(
          "div",
          { className: "dcHeader__actions" },
          selected.length > 0 ? h(
            "span",
            { className: "dcHeader__projects", title: selected.join("\u3001") },
            h("span", { className: "dcHeader__projectsLabel" }, `${COPY.projects}\uFF1A`),
            h("span", { className: "dcHeader__projectsValue" }, selected.join("\u3001"))
          ) : null,
          selected.length > 0 ? h("button", { className: "dcBtn", type: "button", onClick: () => setPicking(true) }, COPY.back) : null,
          selected.length > 0 ? h("button", { className: "dcBtn", type: "button", onClick: refresh, disabled: loading }, COPY.refresh) : null,
          selected.length > 0 ? h("button", {
            className: "dcBtn dcBtn--primary",
            type: "button",
            onClick: startAssistant,
            disabled: aiBusy,
            title: COPY.aiHelpHint
          }, aiBusy ? COPY.aiWorking : COPY.aiHelp) : null
        )
      );
      const content = h(
        "div",
        { className: "dcContent" },
        picker ?? h(
          "div",
          { className: "dcWorkspace" },
          h(
            "nav",
            { className: "dcTabs", role: "tablist", "aria-label": "\u6570\u636E\u5206\u7C7B" },
            TABS.map((item) => h("button", {
              key: item.id,
              type: "button",
              role: "tab",
              className: "dcTab",
              "aria-selected": item.id === tab,
              onClick: () => setTab(item.id)
            }, item.title))
          ),
          error ? h("div", { className: "dcNotice", role: "alert" }, `${COPY.loadFailed}\uFF1A${error}`) : null,
          aiError ? h("div", { className: "dcNotice", role: "alert" }, aiError) : null,
          reportNotice ? h("div", { className: "dcNotice", role: "status" }, reportNotice) : null,
          h("section", { className: "dcPanel", role: "tabpanel" }, detailBody)
        )
      );
      if (!chatOpen) return h("div", { className: "dcRoot" }, header, content);
      return h(
        "div",
        { className: "dcRoot dcRoot--chat" },
        header,
        h(
          "div",
          { className: "dcSplit" },
          content,
          h("aside", { className: "dcChat", "aria-label": "AI \u534F\u52A9" }, conversation)
        )
      );
    }
    function apply(ctx) {
      const host = {
        sessions: ctx.sessions,
        conversation: ctx.conversation
      };
      const Panel = (props) => h(BusinessPanel, { ...props, host });
      ctx.effect(() => ctx.desktopWorkbenches.register({
        title: "\u6570\u636E\u7BA1\u7406\u4E2D\u5FC3",
        description: "\u6309\u9879\u76EE\u67E5\u770B\u91D1\u9E70\u96C6\u56E2\u6570\u636E\u7BA1\u7406\u4E2D\u5FC3\u7684\u8BBE\u5907\u3001\u7535\u8868\u3001\u5B89\u5168\u9690\u60A3\u4E0E\u9884\u7B97\u6267\u884C\u60C5\u51B5\uFF0C\u652F\u6301\u7B5B\u9009\u3001\u53EF\u89C6\u5316\u4E0E AI \u5206\u6790\u62A5\u544A\u3002",
        repository: "https://github.com/Zcx-BaixiaoBai/ge-agent-market",
        customFrame: true,
        headerLayout: "compact"
      }, Panel), "datacenter workbench registration");
    }
    return { apply, inject: ["desktopWorkbenches", "sessions", "conversation"] };
  }

  // src/styles.js
  var CSS = `
.dcRoot{
  container-type:inline-size;
  container-name:datacenter-panel;
  display:flex;flex-direction:column;
  flex:1 1 auto;min-height:0;min-width:0;width:100%;
  font-family:inherit;font-size:13px;line-height:20px;
  color:var(--dsw-alias-label-primary,inherit);
  box-sizing:border-box;background:var(--dsw-alias-bg-layer-1,transparent);
}
.dcRoot *{box-sizing:border-box}
.dcRoot button,.dcRoot input{font-family:inherit;font-size:13px;line-height:20px;color:inherit}
.dcRoot button{cursor:pointer}
.dcRoot button:disabled{cursor:default;opacity:.55}

.dcHeader{
  flex:0 0 auto;display:flex;align-items:center;justify-content:space-between;
  gap:16px;flex-wrap:wrap;padding:12px 20px;
  border-bottom:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));
  background:var(--dsw-alias-bg-layer-1,transparent);
}
.dcHeader__titles{min-width:0;flex:1 1 240px}
.dcHeader__title{margin:0;font-size:15px;line-height:22px;font-weight:600;overflow-wrap:anywhere}
.dcHeader__subtitle{margin:2px 0 0;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary,inherit);overflow-wrap:anywhere}
.dcHeader__actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap;min-width:0}
.dcHeader__projects{display:inline-flex;align-items:baseline;gap:6px;min-width:0;max-width:100%;font-size:12px;line-height:18px}
.dcHeader__projectsLabel{color:var(--dsw-alias-label-secondary,inherit);white-space:nowrap}
.dcHeader__projectsValue{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

.dcBtn{
  border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));background:var(--dsw-alias-bg-layer-1,transparent);
  border-radius:6px;padding:6px 12px;white-space:nowrap;line-height:18px;
}
.dcBtn:hover:not(:disabled){background:var(--dsw-alias-bg-layer-2,rgba(0,0,0,.04))}
.dcBtn:focus-visible{outline:2px solid var(--dsw-alias-label-primary,currentColor);outline-offset:2px}
/* \u4E3B\u6309\u94AE\u8DDF\u968F\u91D1\u9E70\u684C\u9762\u54C1\u724C\u8272\uFF08\u91D1\u9EC4 #a8762b\uFF0C\u914D\u767D\u5B57\uFF09\u3002
   \u5BBF\u4E3B\u4E3B\u9898\u628A\u8BE5\u522B\u540D\u8986\u76D6\u4E3A\u91D1\u9EC4\uFF1B\u5176\u5B83\u5BBF\u4E3B\u672A\u5B9A\u4E49\u65F6\u7528\u540C\u4E00\u8272\u515C\u5E95\uFF0C
   \u4E0D\u518D\u4F7F\u7528\u4F1A\u89E3\u6790\u6210\u8FD1\u9ED1\u7684 button-primary \u7CFB\u5217 token\u3002 */
.dcBtn--primary{
  background:var(--dsw-alias-brand-primary-new-color,#a8762b);
  color:#fff;border-color:transparent;font-weight:600;
}
.dcBtn--primary:hover:not(:disabled){background:#8f6222}
.dcBtn--primary:active:not(:disabled){background:#6b4a1b}
.dcBtn--primary:focus-visible{outline:2px solid #a8762b;outline-offset:2px}
.dcBtn--primary:disabled{background:#f5e9d0;color:#8f6222;border-color:#ddbb7e;opacity:1}
.dcBtn:disabled{opacity:.6;cursor:not-allowed}

.dcContent{flex:1 1 auto;min-height:0;min-width:0;display:flex;flex-direction:column;overflow:hidden}
.dcRoot--chat .dcContent{min-width:0}
.dcSplit{flex:1 1 auto;min-height:0;min-width:0;display:flex;align-items:stretch}
.dcSplit>.dcContent{flex:1 1 auto;min-width:0}
.dcChat{
  flex:0 0 380px;max-width:44%;min-width:280px;display:flex;flex-direction:column;
  border-left:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));overflow:hidden;min-height:0;
}

.dcWorkspace{flex:1 1 auto;min-height:0;min-width:0;display:flex;flex-direction:column;padding:16px 20px 20px;overflow:auto}
.dcStatus{padding:24px 20px;color:var(--dsw-alias-label-secondary,inherit);overflow-wrap:anywhere}
.dcStatus--error{color:var(--dsw-alias-label-primary,inherit)}
.dcStatus p{margin:0 0 12px;overflow-wrap:anywhere}
.dcNotice{margin:0 0 12px;padding:10px 14px;border-radius:8px;background:var(--dsw-alias-bg-layer-2,rgba(0,0,0,.04));overflow-wrap:anywhere}
.dcEmpty{padding:20px 4px;color:var(--dsw-alias-label-secondary,inherit);overflow-wrap:anywhere}
.dcFootnote{margin:10px 0 0;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary,inherit);overflow-wrap:anywhere}

.dcTabs{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 14px;min-width:0}
.dcTab{
  border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));background:transparent;
  border-radius:999px;padding:5px 14px;line-height:18px;white-space:nowrap;
}
.dcTab[aria-selected=true]{background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.06));border-color:transparent;font-weight:600}
.dcTab:focus-visible{outline:2px solid var(--dsw-alias-label-primary,currentColor);outline-offset:2px}

.dcPanel{min-width:0}
.dcSafetyPage{display:flex;flex-direction:column;gap:18px;min-width:0}
.dcPanel__title{margin:0 0 10px;font-size:14px;line-height:20px;font-weight:600;overflow-wrap:anywhere}
.dcOverview{display:flex;flex-direction:column;gap:18px;min-width:0}
.dcGrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;min-width:0}
.dcMetric{
  border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));border-radius:10px;
  padding:14px 16px;min-width:0;background:var(--dsw-alias-bg-layer-1,transparent);
}
.dcMetric__label{font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary,inherit);overflow-wrap:anywhere}
.dcMetric__value{font-size:24px;line-height:32px;font-weight:600;margin:2px 0;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}
.dcMetric__hint{font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary,inherit);overflow-wrap:anywhere}
.dcMetric--warn .dcMetric__value{color:var(--dsw-alias-label-primary,inherit)}
.dcMetric--alert .dcMetric__value{color:#c2410c}
.dcMetric--alert{border-color:rgba(194,65,12,.35)}

.dcTableWrap{
  width:100%;max-width:100%;min-width:0;overflow-x:auto;overflow-y:hidden;
  border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));border-radius:10px;
}
.dcTable{width:100%;border-collapse:collapse;min-width:600px}
.dcTable th,.dcTable td{
  text-align:left;padding:9px 12px;border-bottom:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.07));
  vertical-align:top;overflow-wrap:anywhere;word-break:break-word;
}
.dcTable th{font-weight:600;white-space:nowrap;background:var(--dsw-alias-bg-layer-2,rgba(0,0,0,.03));position:sticky;top:0}
.dcTable tbody tr:last-child td{border-bottom:0}
.dcTable td:first-child{min-width:180px}
/* \u77ED\u679A\u4E3E\u5217\uFF08\u7B49\u7EA7/\u72B6\u6001/\u8D23\u4EFB\u4EBA/\u65E5\u671F/\u5929\u6570\uFF09\u4E0D\u6298\u884C\uFF0C\u907F\u514D\u300C\u4E00\u822C\u9690\u60A3\u300D\u88AB\u6324\u6210\u4E24\u884C\u3002 */
.dcTable__nowrap{white-space:nowrap;overflow-wrap:normal;word-break:normal}
.dcTable th.dcTable__nowrap{white-space:nowrap}

/* ---- \u603B\u89C8\u56FE\u8868\u533A ---- */
.dcSection__title{margin:6px 0 0;font-size:14px;line-height:20px;font-weight:600;overflow-wrap:anywhere}
.dcGrid--six{grid-template-columns:repeat(auto-fit,minmax(160px,1fr))}
.dcChartGrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:12px;min-width:0}
.dcPanel--chart{border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));border-radius:10px;padding:14px 16px;background:var(--dsw-alias-bg-layer-1,transparent)}
.dcChartTitle{margin:0 0 12px;font-size:13px;line-height:18px;font-weight:600;overflow-wrap:anywhere}
.dcChartBlock{min-width:0}
.dcChartLegend{display:flex;gap:14px;flex-wrap:wrap;margin:0 0 10px}
.dcLegendItem{display:inline-flex;align-items:center;gap:5px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary,inherit)}
.dcLegendDot{display:inline-block;width:9px;height:9px;border-radius:2px;flex:0 0 auto}
.dcChartRows{display:flex;flex-direction:column;gap:7px;min-width:0}
.dcChartRow{display:grid;grid-template-columns:minmax(72px,140px) 1fr auto;gap:10px;align-items:center;min-width:0}
.dcChartRow__label{font-size:12px;line-height:16px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
.dcChartRow__bars{display:flex;flex-direction:column;gap:3px;min-width:0}
.dcChartRow__value{font-size:12px;line-height:16px;color:var(--dsw-alias-label-secondary,inherit);font-variant-numeric:tabular-nums;white-space:nowrap}
.dcBarTrack{position:relative;height:8px;min-width:0;border-radius:4px;background:var(--dsw-alias-bg-layer-2,rgba(0,0,0,.05));overflow:hidden}
.dcBarTrack--stack{height:12px}
.dcBarFill{display:block;height:100%;min-width:0}
.dcBarFill--track{background:#d0d7de}
.dcBarFill--fault{background:#cf222e;border-radius:4px}
.dcChartRow:hover .dcBarFill--fault{background:#a40e26}
.dcDonut{display:flex;align-items:center;gap:18px;flex-wrap:wrap;min-width:0}
.dcDonut__svg{width:150px;height:150px;flex:0 0 auto}
.dcDonut__value{font-size:20px;font-weight:600;fill:var(--dsw-alias-label-primary,#1f2328)}
.dcDonut__label{font-size:10px;fill:var(--dsw-alias-label-secondary,#656d76)}
.dcDonut__legend{display:flex;flex-direction:column;gap:8px;min-width:0;flex:1 1 120px}
.dcDonutLegend__item{display:grid;grid-template-columns:auto 1fr auto;gap:8px;align-items:center;min-width:0}
.dcDonutLegend__label{font-size:12px;line-height:18px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
.dcDonutLegend__value{font-size:13px;line-height:18px;font-weight:600;font-variant-numeric:tabular-nums}
.dcCoverage{display:flex;flex-direction:column;gap:11px;min-width:0}
.dcCoverage__row{display:grid;grid-template-columns:minmax(88px,120px) 1fr 44px;gap:10px;align-items:center;min-width:0}
.dcCoverage__label{font-size:12px;line-height:16px;color:var(--dsw-alias-label-secondary,inherit);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
.dcCoverage__track{position:relative;height:8px;border-radius:4px;background:var(--dsw-alias-bg-layer-2,rgba(0,0,0,.05));overflow:hidden;min-width:0}
.dcCoverage__fill{display:block;height:100%;border-radius:4px}
.dcCoverage__fill--good{background:#1a7f37}
.dcCoverage__fill--mid{background:#9a6700}
.dcCoverage__fill--low{background:#cf222e}
.dcCoverage__value{font-size:12px;line-height:16px;text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.dcCoverage__value--good{color:#1a7f37}
.dcCoverage__value--mid{color:#9a6700}
.dcCoverage__value--low{color:#cf222e}
.dcSync{border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));border-radius:10px;padding:12px 16px;display:flex;flex-direction:column;gap:10px;min-width:0}
.dcSync__meta{display:flex;gap:16px;flex-wrap:wrap;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary,inherit);overflow-wrap:anywhere}
.dcSync__source{min-width:0}
.dcSync__tables{display:flex;gap:8px;flex-wrap:wrap;min-width:0}
.dcSync__table{display:inline-flex;align-items:baseline;gap:5px;padding:3px 10px;border-radius:999px;background:var(--dsw-alias-bg-layer-2,rgba(0,0,0,.05));font-size:11px;line-height:16px;color:var(--dsw-alias-label-secondary,inherit);max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

/* ---- \u660E\u7EC6\u9875\uFF1A\u7EDF\u8BA1\u6761 / \u7B5B\u9009 / \u8FF7\u4F60\u56FE ---- */
.dcDetailPage{display:flex;flex-direction:column;gap:14px;min-width:0}
.dcStatStrip{display:flex;gap:10px;flex-wrap:wrap;min-width:0}
.dcStatChip{display:inline-flex;align-items:baseline;gap:7px;padding:7px 12px;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));border-radius:8px;background:var(--dsw-alias-bg-layer-1,transparent);min-width:0}
.dcStatChip__label{font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary,inherit);white-space:nowrap}
.dcStatChip__value{font-size:15px;line-height:20px;font-weight:600;font-variant-numeric:tabular-nums;white-space:nowrap}
.dcStatChip--warn{border-color:rgba(154,103,0,.4)}
.dcStatChip--alert{border-color:rgba(194,65,12,.45)}
.dcStatChip--alert .dcStatChip__value{color:#c2410c}
/* \u5DE5\u5177\u6761\u56FA\u5B9A\u4E24\u884C\uFF1A\u4E0A\u884C\u641C\u7D22+\u64CD\u4F5C\uFF0C\u4E0B\u884C\u7B5B\u9009\u6807\u7B7E\uFF1B\u63A7\u4EF6\u4E0D\u968F\u5BBD\u5EA6\u4E71\u8DF3\u3002 */
.dcFilterBar{display:flex;flex-direction:column;gap:10px;min-width:0}
.dcFilterBar__top{display:flex;align-items:center;gap:10px;flex-wrap:wrap;min-width:0}
.dcFilterBar__search{flex:1 1 220px;min-width:180px;max-width:420px}
.dcFilterBar__reset{padding:6px 10px;font-size:12px}
.dcFilterBar__report{flex:0 0 auto}
.dcFilterBar__groups{display:flex;align-items:flex-start;gap:16px;flex-wrap:wrap;min-width:0}
.dcFilterGroup{display:flex;align-items:center;gap:7px;min-width:0;flex-wrap:wrap}
.dcFilterGroup__label{font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary,inherit);white-space:nowrap}
.dcFilterGroup__chips{display:flex;gap:5px;flex-wrap:wrap;min-width:0}
.dcChip{border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.14));background:transparent;border-radius:999px;padding:3px 11px;font-size:12px;line-height:18px;white-space:nowrap;cursor:pointer}
.dcChip[aria-pressed=true]{background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.07));border-color:transparent;font-weight:600}
.dcChip:focus-visible{outline:2px solid var(--dsw-alias-label-primary,currentColor);outline-offset:1px}
.dcDetailCharts{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:12px;min-width:0}
.dcMiniChart{min-width:0}
.dcSync__table b{font-weight:600;color:var(--dsw-alias-label-primary,inherit);font-variant-numeric:tabular-nums}

.dcPicker{padding:20px;max-width:720px;margin:0 auto;min-width:0}
.dcPicker__title{margin:0 0 6px;font-size:18px;line-height:26px;font-weight:600;overflow-wrap:anywhere}
.dcPicker__hint{margin:0 0 14px;font-size:13px;line-height:20px;color:var(--dsw-alias-label-secondary,inherit);overflow-wrap:anywhere}
.dcInput{
  width:100%;min-width:0;padding:8px 10px;border-radius:8px;
  border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.14));background:var(--dsw-alias-bg-layer-1,transparent);
}
.dcInput:focus-visible{outline:2px solid var(--dsw-alias-label-primary,currentColor);outline-offset:1px}
.dcPicker__list{list-style:none;margin:12px 0 0;padding:0;max-height:44vh;overflow:auto;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));border-radius:10px}
.dcPicker__list li{border-bottom:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.06))}
.dcPicker__list li:last-child{border-bottom:0}
.dcPicker__item{display:flex;align-items:baseline;gap:10px;padding:9px 12px;min-width:0;cursor:pointer}
.dcPicker__item:hover{background:var(--dsw-alias-bg-layer-2,rgba(0,0,0,.04))}
.dcPicker__item input{flex:0 0 auto}
.dcPicker__name{min-width:0;overflow-wrap:anywhere}
.dcPicker__owner{margin-left:auto;flex:0 1 auto;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary,inherit);text-align:right;overflow-wrap:anywhere}
.dcPicker__actions{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-top:16px}

@container datacenter-panel (max-width:720px){
  .dcHeader{align-items:flex-start;flex-direction:column;gap:10px;padding:12px 14px}
  .dcHeader__actions{width:100%}
  .dcWorkspace{padding:14px}
  .dcPicker{padding:16px 12px}
  .dcGrid{grid-template-columns:repeat(auto-fit,minmax(150px,1fr))}
  .dcGrid--six{grid-template-columns:repeat(auto-fit,minmax(140px,1fr))}
  .dcChartGrid{grid-template-columns:1fr}
  .dcMetric__value{font-size:20px;line-height:28px}
  .dcChartRow{grid-template-columns:minmax(64px,110px) 1fr auto;gap:8px}
  .dcFilterBar__search{max-width:none}
  .dcFilterBar__groups{gap:10px}
}
@container datacenter-panel (max-width:560px){
  .dcSplit{flex-direction:column}
  .dcChat{flex:1 1 auto;max-width:none;min-width:0;border-left:0;border-top:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));min-height:240px}
  .dcGrid{grid-template-columns:1fr}
  .dcGrid--six{grid-template-columns:repeat(auto-fit,minmax(130px,1fr))}
  .dcPicker__owner{margin-left:0;text-align:left;flex:1 1 100%}
  .dcTabs{gap:4px}
  .dcTab{padding:5px 10px}
  .dcChartRow{grid-template-columns:1fr}
  .dcChartRow__bars{width:100%}
  .dcChartRow__value{text-align:right}
  .dcCoverage__row{grid-template-columns:1fr 44px}
  .dcCoverage__label{grid-column:1 / -1}
  .dcDonut{justify-content:center}
  .dcFilterBar__top{flex-wrap:wrap}
  .dcFilterBar__search{flex:1 1 100%;max-width:none}
  .dcFilterGroup{flex:1 1 100%}
}
`;
  var styles_default = CSS;

  // src/entry.js
  var STYLE_ID = "ge-workbench-datacenter-style";
  function installStyles() {
    if (typeof document === "undefined") return;
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = styles_default;
    document.head.appendChild(style);
  }
  window.__ModuleLoader__.load({
    id: "ge-workbench-datacenter",
    factory: (req) => {
      const React = req("react");
      installStyles();
      return createPanel(React);
    }
  });
})();
