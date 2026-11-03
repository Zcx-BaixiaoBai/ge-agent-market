(() => {
  // src/panel.jsx
  function createPanel(React) {
    const h = React.createElement;
    const { useCallback, useEffect, useMemo, useRef, useState } = React;
    const API = "/api/datacenter-workbench";
    const COPY = {
      title: "\u6570\u636E\u7BA1\u7406\u4E2D\u5FC3",
      subtitle: "\u91D1\u9E70\u96C6\u56E2 \xB7 \u8BBE\u5907\u3001\u7535\u8868\u3001\u5B89\u5168\u4E0E\u9884\u7B97",
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
      insight: {
        label: "\u9700\u8981\u5173\u6CE8",
        calmLabel: "\u8FD0\u884C\u5E73\u7A33",
        calm: "\u6240\u9009\u9879\u76EE\u76EE\u524D\u6CA1\u6709\u903E\u671F\u9690\u60A3\u3001\u79BB\u7EBF\u7535\u8868\u6216\u903E\u671F\u503C\u73ED\u4EFB\u52A1\u3002",
        scope: (count) => `\u6240\u9009 ${count} \u4E2A\u9879\u76EE\uFF1A`,
        hazards: "\u9879\u9690\u60A3\u5DF2\u903E\u671F",
        imminent: "\u9879\u5C06\u5728 7 \u5929\u5185\u5230\u671F",
        offline: "\u53EA\u7535\u8868\u79BB\u7EBF",
        duty: "\u9879\u503C\u73ED\u4EFB\u52A1\u903E\u671F",
        action: "\u67E5\u770B\u9690\u60A3"
      },
      sections: {
        focus: "\u6240\u9009\u9879\u76EE",
        focusNote: "\u6309\u5F53\u524D\u6240\u9009\u9879\u76EE\u6C47\u603B\uFF1B\u70B9\u53F3\u4E0A\u89D2\u9879\u76EE\u540D\u53EF\u5207\u6362\u8303\u56F4\u3002",
        analysis: "\u6570\u636E\u5206\u6790",
        analysisNote: "\u96C6\u56E2\u53E3\u5F84\uFF1A\u5168\u90E8\u9879\u76EE\u6A2A\u5411\u6BD4\u8F83\uFF0C\u6761\u5F62\u7528\u4E8E\u6BD4\u8F83\u76F8\u5BF9\u91CF\u7EA7\uFF0C\u53F3\u4FA7\u4E3A\u6545\u969C\u7387\u3002",
        group: "\u6838\u5FC3\u6307\u6807\uFF08\u96C6\u56E2\uFF09",
        groupNote: "\u5168\u90E8\u9879\u76EE\u53E3\u5F84\uFF0C\u4EC5\u4F5C\u5BF9\u7167",
        projects: "\u6240\u9009\u9879\u76EE\u6C47\u603B",
        projectsNote: "\u591A\u4E2A\u9879\u76EE\u5E76\u5217\u65F6\uFF0C\u7528\u4E8E\u6A2A\u5411\u6BD4\u8F83\u6545\u969C\u4E0E\u903E\u671F\u60C5\u51B5\u3002"
      },
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
        metersTopNote: "\u6761\u5F62\u4E3A\u6545\u969C\u53F0\u6570 \xB7 \u53F3\u4FA7\u4E3A\u6545\u969C\u7387",
        commFaultTitle: "\u8BBE\u5907\u901A\u8BAF\u6545\u969C\u5206\u5E03",
        commFaultNote: "\u79BB\u7EBF / \u5F02\u5E38\u9001\u7535 / \u65E0\u7B7E\u5448",
        hazardTitle: "\u5B89\u5168\u9690\u60A3\u5206\u5E03",
        hazardNote: (total) => `\u5171 ${total} \u9879`,
        coverageTitle: "\u677F\u5757\u8986\u76D6\u603B\u89C8",
        coverageNote: "\u9879\u76EE\u8986\u76D6\u4E0E\u5065\u5EB7\u7387",
        hazardTotal: "\u5408\u8BA1",
        hazardOverdue: "\u903E\u671F\u672A\u5B8C\u6210",
        hazardImminent: "\u5373\u5C06\u903E\u671F",
        hazardPending: "\u672A\u5B8C\u6210",
        hazardOverdueShare: "\u903E\u671F\u5360\u6BD4",
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
        emptyFiltered: "\u5F53\u524D\u7B5B\u9009\u6761\u4EF6\u4E0B\u6CA1\u6709\u6570\u636E\uFF0C\u53EF\u8C03\u6574\u6216\u6E05\u9664\u7B5B\u9009\u3002",
        emptyHint: "\u8BD5\u8BD5\u6362\u4E00\u4E2A\u5173\u952E\u8BCD\uFF0C\u6216\u6E05\u9664\u7B5B\u9009\u6761\u4EF6\u3002"
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
        button: "\u751F\u6210 AI \u5206\u6790",
        busy: "\u6B63\u5728\u51C6\u5907\u2026",
        done: "\u62A5\u544A\u5185\u5BB9\u5DF2\u586B\u5165\u5BF9\u8BDD\u8F93\u5165\u6846\uFF0C\u8BF7\u67E5\u770B\u540E\u53D1\u9001\u3002",
        preserved: "\u5BF9\u8BDD\u8F93\u5165\u6846\u5DF2\u6709\u5185\u5BB9\u672A\u6E05\u7A7A\uFF0C\u62A5\u544A\u5DF2\u590D\u5236\u5230\u526A\u8D34\u677F\uFF0C\u53EF\u624B\u52A8\u7C98\u8D34\u3002",
        clipboard: "\u672A\u80FD\u5199\u5165\u5BF9\u8BDD\u8349\u7A3F\uFF0C\u62A5\u544A\u5DF2\u590D\u5236\u5230\u526A\u8D34\u677F\uFF0C\u53EF\u624B\u52A8\u7C98\u8D34\u3002",
        failed: "\u672A\u80FD\u5199\u5165\u5BF9\u8BDD\u8349\u7A3F",
        noSession: "\u672A\u80FD\u521B\u5EFA\u5DE5\u4F5C\u53F0\u4F1A\u8BDD\uFF0C\u8BF7\u91CD\u8BD5\u3002",
        view: "\u67E5\u770B\u5BF9\u8BDD"
      },
      retryHint: "\u68C0\u67E5\u7F51\u7EDC\u540E\u91CD\u8BD5\uFF0C\u6216\u7A0D\u540E\u518D\u5237\u65B0\u3002"
    };
    const num = (value) => {
      if (value === void 0 || value === null || value === "") return "\u2014";
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) return String(value);
      return numeric.toLocaleString("zh-CN");
    };
    const pct = (value) => value === void 0 || value === null || !Number.isFinite(Number(value)) ? "\u2014" : `${(Number(value) * 100).toFixed(1)}%`;
    const rate = (part, whole) => Number(whole) > 0 ? pct(Number(part) / Number(whole)) : "\u2014";
    const duration = (hours) => {
      const value = Number(hours);
      if (!Number.isFinite(value)) return "\u2014";
      if (value >= 72) return `${Math.round(value / 24)} \u5929`;
      return `${value.toFixed(1)} \u5C0F\u65F6`;
    };
    const cell = (value) => value === void 0 || value === null || value === "" ? "\u2014" : String(value);
    function Icon({ children, size = 14, ...rest }) {
      return h("svg", {
        width: size,
        height: size,
        viewBox: "0 0 16 16",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 1.5,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        "aria-hidden": "true",
        focusable: "false",
        ...rest
      }, children);
    }
    const SearchIcon = () => h(
      Icon,
      null,
      h("circle", { cx: 7, cy: 7, r: 4.2 }),
      h("path", { d: "M10.3 10.3 13.5 13.5" })
    );
    const ChevronDown = () => h(Icon, { size: 12 }, h("path", { d: "M4 6.4 8 10.2 12 6.4" }));
    const RefreshIcon = () => h(
      Icon,
      null,
      h("path", { d: "M13.2 8a5.2 5.2 0 1 1-1.7-3.9" }),
      h("path", { d: "M13.2 3.4v3.2H10" })
    );
    const InboxIcon = () => h(
      Icon,
      { size: 16 },
      h("path", { d: "M2.6 9.4h2.9l1 1.6h3l1-1.6h2.9" }),
      h("path", { d: "M3.5 3.3h9l1.3 6.1v3.3H2.2V9.4z" })
    );
    const PenIcon = () => h(
      Icon,
      { size: 13 },
      h("path", { d: "M11.4 2.9l1.7 1.7-7.2 7.2-2.3.6.6-2.3z" }),
      h("path", { d: "M2.8 13.2h10.4" })
    );
    function Status({ tone = "muted", children }) {
      return h(
        "span",
        { className: `dcStatusText dcStatusText--${tone}` },
        h("i", { className: "dcStatusDot", "aria-hidden": "true" }),
        children
      );
    }
    function EmptyState({ text, hint, inline }) {
      return h(
        "div",
        { className: `dcEmpty${inline ? " dcEmpty--inline" : ""}` },
        h("div", { className: "dcEmpty__mark" }, h(InboxIcon)),
        h("div", null, text || COPY.empty),
        hint ? h("div", { className: "dcEmpty__hint" }, hint) : null
      );
    }
    function SectionHead({ title, note, aside }) {
      return h(
        "div",
        { className: "dcSectionHead" },
        h(
          "div",
          { className: "dcSectionHead__text" },
          h("h2", { className: "dcSection__title" }, title),
          note ? h("p", { className: "dcSection__note" }, note) : null
        ),
        aside || null
      );
    }
    function Skeleton({ rows = 6, stats = true }) {
      return h(
        "div",
        { className: "dcSkeleton", "aria-busy": "true" },
        h("div", { className: "dcSkeleton__label" }, COPY.loading),
        stats ? h(
          "div",
          { className: "dcSkeleton__strip" },
          [0, 1, 2, 3].map((key) => h("div", { key, className: "dcSkeleton__block", style: { height: "84px" } }))
        ) : null,
        [0, 1, 2].map((key) => h(
          "div",
          { key, className: "dcSkeleton__row" },
          h("div", { className: "dcSkeleton__block", style: { height: "14px", width: key === 0 ? "38%" : key === 1 ? "52%" : "30%" } })
        )),
        h("div", { className: "dcSkeleton__block", style: { height: `${rows * 34}px` } })
      );
    }
    function Vital({ label, value, unit, hint, empty }) {
      return h(
        "div",
        { className: "dcVital" },
        h(
          "div",
          { className: "dcVital__label" },
          h("span", { className: "dcVital__mark", "aria-hidden": "true" }),
          label
        ),
        h(
          "div",
          { className: `dcVital__value${empty ? " is-empty" : ""}` },
          value,
          unit ? h("span", { className: "dcVital__unit" }, unit) : null
        ),
        h("div", { className: "dcVital__hint" }, hint)
      );
    }
    function MiniMetric({ label, value, hint }) {
      return h(
        "div",
        { className: "dcMini" },
        h("div", { className: "dcMini__label", title: label }, label),
        h("div", { className: "dcMini__value" }, value),
        hint ? h("div", { className: "dcMini__hint", title: hint }, hint) : null
      );
    }
    function DataTable({ columns, rows, emptyText }) {
      if (!rows || rows.length === 0) {
        return h(EmptyState, { text: emptyText || COPY.empty, hint: COPY.filter.emptyHint });
      }
      const cellClass = (column) => [
        column.nowrap ? "dcTable__nowrap" : "",
        column.align === "right" ? "is-num" : "",
        column.className || ""
      ].filter(Boolean).join(" ") || void 0;
      return h(
        "div",
        { className: "dcTableWrap" },
        h(
          "table",
          { className: "dcTable" },
          h("thead", null, h("tr", null, columns.map((column) => h("th", {
            key: column.key,
            scope: "col",
            className: cellClass(column)
          }, column.title)))),
          h("tbody", null, rows.map((row, index) => h(
            "tr",
            { key: index },
            columns.map((column) => h(
              "td",
              { key: column.key, className: cellClass(column) },
              column.render ? column.render(row) : cell(row[column.key])
            ))
          )))
        )
      );
    }
    function StatStrip({ stats }) {
      return h("div", { className: "dcStatStrip" }, stats.map((item) => h(
        "div",
        {
          className: `dcStatChip${item.tone ? ` dcStatChip--${item.tone}` : ""}`,
          key: item.label
        },
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
          h(
            "div",
            { className: "dcSearchWrap" },
            h(SearchIcon),
            h("input", {
              className: "dcInput dcFilterBar__search",
              type: "search",
              value: keyword,
              placeholder: COPY.filter.search,
              "aria-label": COPY.filter.search,
              onChange: (event) => onKeyword(event.target.value)
            })
          ),
          dirty ? h("button", { type: "button", className: "dcFilterBar__reset", onClick: onReset }, COPY.filter.reset) : null,
          onReport ? h("button", {
            type: "button",
            className: "dcBtn dcBtn--report dcFilterBar__report",
            disabled: reportBusy,
            onClick: onReport
          }, h(PenIcon), reportBusy ? COPY.report.busy : COPY.report.button) : null
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
      const max = Math.max(...data.map((item) => Number(item.value) || 0), 1);
      return h(
        "div",
        { className: "dcMiniChart" },
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
              h("span", {
                className: `dcBarFill${item.tone ? ` dcSeg--${item.tone}` : ""}`,
                style: { width: `${(Number(item.value) || 0) > 0 ? Math.max(2, (Number(item.value) || 0) / max * 100) : 0}%` }
              })
            )
          ),
          h("div", { className: "dcChartRow__value" }, num(item.value))
        )))
      );
    }
    function DistDonut({ title, data, foot }) {
      const total = data.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
      if (!total) return null;
      const RADIUS = 46;
      const CIRCUM = 2 * Math.PI * RADIUS;
      let offset = 0;
      const arcs = data.map((item) => {
        const fraction = (Number(item.value) || 0) / total;
        const arc = { ...item, fraction, dash: fraction * CIRCUM, offset };
        offset += fraction * CIRCUM;
        return arc;
      });
      return h(
        "div",
        { className: "dcMiniChart" },
        title ? h("h4", { className: "dcChartTitle" }, title) : null,
        h(
          "div",
          { className: "dcDonut" },
          h(
            "svg",
            { viewBox: "0 0 130 130", className: "dcDonut__svg", role: "img", "aria-label": title },
            h("circle", { cx: 65, cy: 65, r: RADIUS, fill: "none", strokeWidth: 15, className: "dcDonut__track" }),
            arcs.map((arc) => h(
              "circle",
              {
                key: arc.label,
                cx: 65,
                cy: 65,
                r: RADIUS,
                fill: "none",
                strokeWidth: 15,
                strokeDasharray: `${arc.dash} ${CIRCUM - arc.dash}`,
                strokeDashoffset: -arc.offset,
                transform: "rotate(-90 65 65)",
                className: `dcDonut__seg${arc.tone ? ` dcDonut__seg--${arc.tone}` : ""}`
              },
              h("title", null, `${arc.label} ${arc.value}`)
            )),
            h("text", { x: 65, y: 62, textAnchor: "middle", className: "dcDonut__value" }, num(total)),
            h("text", { x: 65, y: 82, textAnchor: "middle", className: "dcDonut__label" }, COPY.chart.hazardTotal)
          ),
          h("div", { className: "dcDonut__legend" }, data.map((item) => h(
            "div",
            { className: "dcDonutLegend__item", key: item.label },
            h("span", { className: `dcLegendDot${item.tone ? ` dcSeg--${item.tone}` : ""}` }),
            h("span", { className: "dcDonutLegend__label" }, item.label),
            h("span", { className: "dcDonutLegend__value" }, num(item.value)),
            h("span", { className: "dcDonutLegend__pct" }, `${((Number(item.value) || 0) / total * 100).toFixed(1)}%`)
          )))
        ),
        foot ? h("p", { className: "dcDonut__foot" }, foot) : null
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
    const normalizeTag = (value) => [...new Set(String(value ?? "").split(/[,，/、]+/).map((item) => item.trim()).filter(Boolean))].join(" / ");
    const faultCategoryOf = (row) => {
      const tag = normalizeTag(String(row.fault_tag ?? "").replace(/[【】]/g, "").trim());
      if (tag) return tag;
      const match = /故障描述【([^】]+)】/.exec(String(row.fault_desc ?? ""));
      if (match) return normalizeTag(match[1]);
      const status = normalizeTag(row.switch_status);
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
    const onlineTone = (value) => value === "\u5728\u7EBF" ? "ok" : value === "\u79BB\u7EBF" ? "risk" : "muted";
    const deviceTone = (value) => value === "\u6B63\u5E38" ? "ok" : value ? "warn" : "muted";
    const hazardStatusTone = (value) => value === "\u5DF2\u6574\u6539" ? "ok" : String(value).includes("\u903E\u671F") ? "risk" : value ? "warn" : "muted";
    const levelTone = (value) => String(value).includes("\u91CD\u5927") ? "risk" : String(value).includes("\u8F83\u5927") ? "warn" : "muted";
    const dutyTone = (value) => value === "\u5DF2\u5B8C\u6210" ? "ok" : String(value).includes("\u903E\u671F") ? "risk" : value ? "warn" : "muted";
    const faultTagTone = (value) => {
      const text = String(value ?? "");
      if (text.includes("\u79BB\u7EBF")) return "risk";
      if (text.includes("\u5F02\u5E38")) return "warn";
      return "muted";
    };
    const offlineHoursTone = (hours) => Number(hours) > 72 ? "risk" : Number(hours) > 24 ? "warn" : void 0;
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
    function ProjectPicker({ projects, selected, onToggle, onConfirm, onCancel, loading }) {
      const [keyword, setKeyword] = useState("");
      const filtered = useMemo(() => {
        const needle = keyword.trim().toLowerCase();
        if (!needle) return projects;
        return projects.filter((project) => project.name.toLowerCase().includes(needle));
      }, [projects, keyword]);
      return h(
        "div",
        { className: "dcPicker" },
        h(
          "div",
          { className: "dcPicker__grid" },
          h(
            "div",
            { className: "dcPicker__intro" },
            h("span", { className: "dcEyebrow" }, "\u91D1\u9E70\u96C6\u56E2 \xB7 \u6570\u636E\u7BA1\u7406\u4E2D\u5FC3"),
            h("h2", { className: "dcPicker__title" }, COPY.chooseProject),
            h("p", { className: "dcPicker__hint" }, COPY.chooseProjectHint),
            h(
              "ul",
              { className: "dcPicker__scope" },
              h("li", null, h("b", null, "\u8BBE\u5907"), "\u901A\u8BAF\u72B6\u6001\u3001\u79BB\u7EBF\u4E0E\u6545\u969C\u5206\u5E03"),
              h("li", null, h("b", null, "\u7535\u8868"), "\u6545\u969C\u7C7B\u578B\u3001\u79BB\u7EBF\u65F6\u957F\u4E0E\u6B20\u8D39"),
              h("li", null, h("b", null, "\u5B89\u5168"), "\u9690\u60A3\u6574\u6539\u4E0E\u503C\u73ED\u5C65\u804C"),
              h("li", null, h("b", null, "\u9884\u7B97"), "\u5E74\u5EA6\u6267\u884C\u8FDB\u5EA6\u4E0E\u79D1\u76EE\u660E\u7EC6")
            )
          ),
          h(
            "div",
            { className: "dcPicker__panel" },
            h(
              "div",
              { className: "dcPicker__toolbar" },
              h(
                "div",
                { className: "dcSearchWrap" },
                h(SearchIcon),
                h("input", {
                  className: "dcInput",
                  type: "search",
                  value: keyword,
                  placeholder: COPY.search,
                  "aria-label": COPY.search,
                  onChange: (event) => setKeyword(event.target.value)
                })
              ),
              h("span", { className: "dcPicker__count" }, `\u5DF2\u9009 ${selected.length} \u4E2A`)
            ),
            filtered.length === 0 ? h(EmptyState, { text: COPY.noProject, hint: "\u6362\u4E2A\u5173\u952E\u8BCD\u8BD5\u8BD5\u3002", inline: true }) : h("ul", { className: "dcPicker__list" }, filtered.map((project) => {
              const active = selected.includes(project.name);
              return h(
                "li",
                { key: project.name, "data-selected": active },
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
              h("span", { className: "dcPicker__hint" }, COPY.confirmHint),
              h(
                "div",
                { className: "dcPicker__actionsBtns" },
                onCancel ? h("button", { className: "dcBtn dcBtn--ghost", type: "button", onClick: onCancel }, "\u53D6\u6D88") : null,
                h("button", {
                  className: "dcBtn dcBtn--primary",
                  type: "button",
                  disabled: loading || selected.length === 0,
                  onClick: onConfirm
                }, loading ? COPY.loading : COPY.confirm)
              )
            )
          )
        )
      );
    }
    function TopFaultChart({ rows }) {
      if (!rows || rows.length === 0) return h(EmptyState, { text: COPY.empty, inline: true });
      const maxFault = Math.max(...rows.map((row) => Number(row.fault) || 0), 1);
      return h("div", { className: "dcRankRows" }, rows.map((row, index) => {
        const total = Number(row.total) || 0;
        const fault = Number(row.fault) || 0;
        return h(
          "div",
          { className: "dcRankRow", key: row.name },
          h("span", { className: "dcRankRow__index" }, String(index + 1).padStart(2, "0")),
          h("span", { className: `dcRankRow__name${index < 3 ? " is-top" : ""}`, title: row.name }, row.name),
          h(
            "span",
            { className: "dcRankRow__track", title: `\u6545\u969C ${fault} \u53F0 / \u5171 ${total} \u53F0` },
            h("span", {
              className: "dcRankRow__fill",
              style: { width: `${fault > 0 ? Math.max(2, fault / maxFault * 100) : 0}%` }
            })
          ),
          h("span", { className: "dcRankRow__value" }, num(fault), h("small", null, " / ", num(total))),
          h("span", { className: "dcRankRow__rate" }, total ? pct(fault / total) : "\u2014")
        );
      }));
    }
    function CommFaultChart({ rows }) {
      if (!rows || rows.length === 0) return h(EmptyState, { text: COPY.empty, inline: true });
      const SEGMENTS = [
        { key: "offline", label: COPY.chart.offline, tone: "risk" },
        { key: "abnormal", label: COPY.chart.abnormal, tone: "warn" },
        { key: "unpaid", label: COPY.chart.unpaid, tone: "info" }
      ];
      const totals = rows.map((row) => SEGMENTS.reduce((sum, seg) => sum + (Number(row[seg.key]) || 0), 0));
      const max = Math.max(...totals, 1);
      return h(
        "div",
        { className: "dcChartBlock" },
        h("div", { className: "dcChartLegend" }, SEGMENTS.map((seg) => h(
          "span",
          { className: "dcLegendItem", key: seg.key },
          h("span", { className: `dcLegendDot dcSeg--${seg.tone}` }),
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
                  className: `dcBarFill dcSeg--${seg.tone}`,
                  style: { width: total ? `${(Number(row[seg.key]) || 0) / max * 100}%` : "0%" },
                  title: `${seg.label} ${Number(row[seg.key]) || 0}`
                }))
              )
            ),
            h("div", { className: "dcChartRow__value" }, num(total))
          );
        }))
      );
    }
    function HazardDonut({ status }) {
      if (!status) return h(EmptyState, { text: COPY.empty, inline: true });
      const ITEMS = [
        { key: "overdue", label: COPY.chart.hazardOverdue, tone: "risk", value: Number(status.overdue) || 0 },
        { key: "imminent", label: COPY.chart.hazardImminent, tone: "warn", value: Number(status.imminent) || 0 },
        { key: "pending", label: COPY.chart.hazardPending, tone: "info", value: Number(status.pending) || 0 }
      ];
      const total = ITEMS.reduce((sum, item) => sum + item.value, 0);
      if (!total) return h(EmptyState, { text: COPY.empty, inline: true });
      const RADIUS = 52;
      const CIRCUM = 2 * Math.PI * RADIUS;
      let offset = 0;
      const arcs = ITEMS.map((item) => {
        const arc = { ...item, dash: item.value / total * CIRCUM, offset };
        offset += item.value / total * CIRCUM;
        return arc;
      });
      const overdueShare = total ? Math.round(ITEMS[0].value / total * 100) : 0;
      return h(
        "div",
        null,
        h(
          "div",
          { className: "dcDonut" },
          h(
            "svg",
            { viewBox: "0 0 140 140", className: "dcDonut__svg", role: "img", "aria-label": COPY.chart.hazardTitle },
            h("circle", { cx: 70, cy: 70, r: RADIUS, fill: "none", strokeWidth: 16, className: "dcDonut__track" }),
            arcs.map((arc) => h(
              "circle",
              {
                key: arc.key,
                cx: 70,
                cy: 70,
                r: RADIUS,
                fill: "none",
                strokeWidth: 16,
                strokeDasharray: `${arc.dash} ${CIRCUM - arc.dash}`,
                strokeDashoffset: -arc.offset,
                transform: "rotate(-90 70 70)",
                className: `dcDonut__seg dcDonut__seg--${arc.tone}`
              },
              h("title", null, `${arc.label} ${arc.value}`)
            )),
            h("text", { x: 70, y: 67, textAnchor: "middle", className: "dcDonut__value" }, num(total)),
            h("text", { x: 70, y: 87, textAnchor: "middle", className: "dcDonut__label" }, COPY.chart.hazardTotal)
          ),
          h("div", { className: "dcDonut__legend" }, ITEMS.map((item) => h(
            "div",
            { className: "dcDonutLegend__item", key: item.key },
            h("span", { className: `dcLegendDot dcSeg--${item.tone}` }),
            h("span", { className: "dcDonutLegend__label" }, item.label),
            h("span", { className: "dcDonutLegend__value" }, num(item.value)),
            h("span", { className: "dcDonutLegend__pct" }, `${total ? Math.round(item.value / total * 100) : 0}%`)
          )))
        ),
        h("p", { className: "dcDonut__foot" }, `${COPY.chart.hazardOverdueShare} `, h("b", null, `${overdueShare}%`))
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
      if (!rows.length) return h(EmptyState, { text: COPY.empty, inline: true });
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
        h("span", { className: "dcSync__dot", "aria-hidden": "true" }),
        h(
          "div",
          { className: "dcSync__meta" },
          h("span", null, `${COPY.chart.lastSync} ${status?.last_sync ?? info?.last_sync ?? "\u2014"}`),
          info?.source_file ? h("span", { className: "dcSync__source" }, `${COPY.chart.source} ${info.source_file}`) : null
        ),
        entries.length ? h("div", { className: "dcSync__tables" }, entries.map(([name, count]) => h(
          "span",
          { className: "dcSync__table", key: name, title: name },
          h("b", null, num(count ?? 0)),
          " ",
          name
        ))) : null
      );
    }
    function Insight({ totals, projects, group, onOpenSafety }) {
      const safety = totals.safety ?? {};
      const meters = totals.meters ?? {};
      const hazardOverdue = Number(safety.hazard_overdue) || 0;
      const hazardImminent = Number(safety.hazard_imminent) || 0;
      const offline = Number(meters.offline) || 0;
      const groupRate = Number(group?.meters?.fault_rate) || 0;
      const ranked = (projects ?? []).filter((project) => Number(project.meters?.total) > 0 && Number(project.meters?.fault_rate) > 0).sort((a, b) => Number(b.meters.fault_rate) - Number(a.meters.fault_rate));
      const worst = ranked[0];
      const ratio = worst && groupRate > 0 ? Number(worst.meters.fault_rate) / groupRate : 0;
      const notable = worst && ratio >= 1.25;
      const parts = [];
      if (notable) {
        parts.push(h(
          "span",
          { key: "worst" },
          h("b", null, worst.name),
          " \u7535\u8868\u6545\u969C\u7387 ",
          h("b", { className: "is-risk" }, pct(worst.meters.fault_rate)),
          `\uFF0C\u662F\u96C6\u56E2\u53E3\u5F84\u7684 ${ratio.toFixed(1)} \u500D`
        ));
      }
      if (hazardOverdue > 0) {
        parts.push(h("span", { key: "hazard" }, h("b", { className: "is-risk" }, num(hazardOverdue)), ` ${COPY.insight.hazards}`));
      }
      if (hazardImminent > 0) {
        parts.push(h("span", { key: "imminent" }, h("b", { className: "is-warn" }, num(hazardImminent)), ` ${COPY.insight.imminent}`));
      }
      if (!parts.length && offline > 0) {
        parts.push(h("span", { key: "offline" }, h("b", null, num(offline)), ` ${COPY.insight.offline}`));
      }
      const calm = parts.length === 0;
      const text = calm ? COPY.insight.calm : parts.reduce((acc, node, index) => index === 0 ? [node] : [...acc, "\uFF0C", node], [COPY.insight.scope((projects ?? []).length || 1)]);
      return h(
        "div",
        { className: `dcInsight${calm ? " dcInsight--calm" : ""}` },
        h(
          "span",
          { className: "dcInsight__label" },
          h("span", { className: "dcInsight__dot", "aria-hidden": "true" }),
          calm ? COPY.insight.calmLabel : COPY.insight.label
        ),
        h("p", { className: "dcInsight__text" }, text),
        !calm && onOpenSafety ? h(
          "button",
          { className: "dcInsight__action", type: "button", onClick: onOpenSafety },
          COPY.insight.action,
          h("span", { "aria-hidden": "true" }, "\u2192")
        ) : null
      );
    }
    function Overview({ data, projects, onOpenSafety }) {
      const group = data?.group ?? {};
      const charts = data?.charts ?? {};
      const totals = data?.totals ?? {};
      const equipment = totals.equipment;
      const meters = totals.meters;
      const safety = totals.safety;
      const groupCard = ({ label, module, field, compute, hint }) => h(MiniMetric, {
        label,
        value: module ? compute ? compute(module) : num(module[field]) : COPY.noData,
        hint: module ? hint(module) : COPY.noDataHint
      });
      return h(
        "div",
        { className: "dcOverview" },
        h(Insight, { totals, projects, group, onOpenSafety }),
        h(
          "section",
          null,
          h(SectionHead, { title: COPY.sections.focus, note: COPY.sections.focusNote }),
          h(
            "div",
            { className: "dcVitals" },
            h(Vital, {
              label: "\u8BBE\u5907\u603B\u6570",
              value: equipment ? num(equipment.total) : COPY.noData,
              unit: equipment ? "\u53F0" : null,
              empty: !equipment,
              hint: equipment ? [h("span", { key: "a" }, "\u6545\u969C ", h("b", null, num(equipment.fault)), " \xB7 \u6545\u969C\u7387 ", h("b", null, pct(equipment.fault_rate)))] : COPY.noDataHint
            }),
            h(Vital, {
              label: "\u7535\u8868\u603B\u6570",
              value: meters ? num(meters.total) : COPY.noData,
              unit: meters ? "\u53EA" : null,
              empty: !meters,
              hint: meters ? [h("span", { key: "a" }, "\u6545\u969C ", h("b", null, num(meters.fault)), " \xB7 \u79BB\u7EBF ", h("b", { className: Number(meters.offline) > 0 ? "is-risk" : void 0 }, num(meters.offline)))] : COPY.noDataHint
            }),
            h(Vital, {
              // 上游的「在册数」与「逾期任务数」来自两张表，口径不一致，
              // 这里只呈现可对齐的逾期数，避免出现小数比大数还大的误导。
              label: "\u9690\u60A3\u903E\u671F",
              value: safety ? num(safety.hazard_overdue) : COPY.noData,
              unit: safety ? "\u9879" : null,
              empty: !safety,
              hint: safety ? [h("span", { key: "a" }, "\u4E34\u671F ", h("b", { className: Number(safety.hazard_imminent) > 0 ? "is-warn" : void 0 }, num(safety.hazard_imminent)), " \u9879")] : COPY.noDataHint
            }),
            h(Vital, {
              label: "\u503C\u73ED\u4EFB\u52A1",
              value: safety ? num(safety.duty_total) : COPY.noData,
              unit: safety ? "\u9879" : null,
              empty: !safety,
              hint: safety ? [h("span", { key: "a" }, "\u903E\u671F ", h("b", { className: Number(safety.duty_overdue) > 0 ? "is-risk" : void 0 }, num(safety.duty_overdue))), safety.duty_completed !== void 0 ? h("span", { key: "b" }, "\xB7 \u5DF2\u5B8C\u6210 ", h("b", null, num(safety.duty_completed))) : null] : COPY.noDataHint
            })
          )
        ),
        h(
          "section",
          null,
          h(SectionHead, { title: COPY.sections.analysis, note: COPY.sections.analysisNote }),
          h(
            "div",
            { className: "dcChartGrid" },
            h(
              "section",
              { className: "dcCard dcCard--wide" },
              h(
                "div",
                { className: "dcCard__head" },
                h("h3", { className: "dcChartTitle" }, COPY.chart.metersTopTitle),
                h("span", { className: "dcCard__note" }, COPY.chart.metersTopNote)
              ),
              h(TopFaultChart, { rows: charts.metersTop })
            ),
            h(
              "section",
              { className: "dcCard dcCard--narrow" },
              h(
                "div",
                { className: "dcCard__head" },
                h("h3", { className: "dcChartTitle" }, COPY.chart.commFaultTitle),
                h("span", { className: "dcCard__note" }, COPY.chart.commFaultNote)
              ),
              h(CommFaultChart, { rows: charts.commFaults })
            ),
            h(
              "section",
              { className: "dcCard dcCard--narrow" },
              h(
                "div",
                { className: "dcCard__head" },
                h("h3", { className: "dcChartTitle" }, COPY.chart.hazardTitle),
                h("span", { className: "dcCard__note" }, COPY.chart.hazardNote(num(
                  (Number(charts.hazardStatus?.overdue) || 0) + (Number(charts.hazardStatus?.imminent) || 0) + (Number(charts.hazardStatus?.pending) || 0)
                )))
              ),
              h(HazardDonut, { status: charts.hazardStatus })
            ),
            h(
              "section",
              { className: "dcCard dcCard--wide" },
              h(
                "div",
                { className: "dcCard__head" },
                h("h3", { className: "dcChartTitle" }, COPY.chart.coverageTitle),
                h("span", { className: "dcCard__note" }, COPY.chart.coverageNote)
              ),
              h(CoveragePanel, { group })
            )
          )
        ),
        h(
          "section",
          { className: "dcAppendix" },
          h(
            "div",
            { className: "dcAppendix__head" },
            h("span", { className: "dcAppendix__title" }, COPY.sections.group),
            h("span", { className: "dcAppendix__note" }, COPY.sections.groupNote)
          ),
          h(
            "div",
            { className: "dcAppendix__grid" },
            groupCard({ label: COPY.chart.kpiMeters, module: group.meters, field: "total", hint: (value) => `\u6545\u969C ${num(value.fault)} \xB7 \u79BB\u7EBF ${num(value.offline)}` }),
            groupCard({ label: COPY.chart.kpiMeterRate, module: group.meters, compute: (value) => pct(value.fault_rate), hint: (value) => `${num(value.project_count)} \u4E2A\u9879\u76EE` }),
            groupCard({ label: COPY.chart.kpiHazard, module: group.safety, field: "hazard_total", hint: (value) => `\u903E\u671F ${num(value.hazard_overdue)}` }),
            groupCard({ label: COPY.chart.kpiDuty, module: group.safety, field: "duty_total", hint: (value) => `\u903E\u671F ${num(value.duty_overdue)}` }),
            groupCard({ label: COPY.chart.kpiWater, module: group.safety, compute: (value) => num((value.wp_low || 0) + (value.wp_high || 0)), hint: (value) => `\u5931\u538B ${num(value.wp_low)}` }),
            groupCard({ label: COPY.chart.kpiEquipment, module: group.equipment, field: "total", hint: (value) => `\u6545\u969C ${num(value.fault)} \xB7 ${pct(value.fault_rate)}` })
          )
        ),
        projects.length > 1 ? h(
          "section",
          null,
          h(SectionHead, { title: COPY.sections.projects, note: COPY.sections.projectsNote }),
          h(
            "div",
            { className: "dcTableWrap" },
            h(
              "table",
              { className: "dcTable" },
              h("thead", null, h(
                "tr",
                null,
                h("th", { scope: "col" }, COPY.project),
                h("th", { scope: "col", className: "is-num" }, "\u8BBE\u5907\u6545\u969C\u7387"),
                h("th", { scope: "col", className: "is-num" }, "\u7535\u8868\u6545\u969C\u7387"),
                h("th", { scope: "col", className: "is-num" }, "\u7535\u8868\u6B20\u8D39"),
                h("th", { scope: "col", className: "is-num" }, "\u503C\u73ED\u903E\u671F"),
                h("th", { scope: "col", className: "is-num" }, "\u9690\u60A3\u903E\u671F")
              )),
              h("tbody", null, projects.map((project) => h(
                "tr",
                { key: project.name },
                h("td", null, project.name),
                h("td", { className: "is-num" }, pct(project.equipment?.fault_rate)),
                h("td", { className: "is-num" }, pct(project.meters?.fault_rate)),
                h("td", { className: "is-num" }, num(project.meters?.unpaid)),
                h("td", { className: "is-num" }, Number(project.safety?.duty_overdue) > 0 ? h("span", { className: "dcCellRisk" }, num(project.safety?.duty_overdue)) : num(project.safety?.duty_overdue)),
                h("td", { className: "is-num" }, Number(project.safety?.hazard_overdue) > 0 ? h("span", { className: "dcCellRisk" }, num(project.safety?.hazard_overdue)) : num(project.safety?.hazard_overdue))
              )))
            )
          )
        ) : null,
        data?.sync ? h(SyncPanel, { sync: data.sync }) : null
      );
    }
    function BudgetTable({ rows }) {
      return h(DataTable, {
        columns: [
          { key: "subject", title: COPY.budgetColumns[0] },
          { key: "current_usage", title: COPY.budgetColumns[1], align: "right", render: (row) => typeof row.current_usage === "number" ? row.current_usage.toLocaleString("zh-CN") : "\u2014" },
          { key: "current_rate", title: COPY.budgetColumns[2], align: "right" },
          { key: "yearly_usage", title: COPY.budgetColumns[3], align: "right", render: (row) => typeof row.yearly_usage === "number" ? row.yearly_usage.toLocaleString("zh-CN") : "\u2014" },
          { key: "yearly_rate", title: COPY.budgetColumns[4], align: "right" }
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
      const ordered = useMemo(() => [...filtered].sort((a, b) => {
        const offline = (row) => row.online_status === "\u79BB\u7EBF" ? 0 : 1;
        const abnormal = (row) => row.device_status && row.device_status !== "\u6B63\u5E38" ? 0 : 1;
        return offline(a) - offline(b) || abnormal(a) - abnormal(b) || (Number(b.comm_delay) || 0) - (Number(a.comm_delay) || 0);
      }), [filtered]);
      const onlineDist = countBy(filtered, "online_status");
      const statusDist = countBy(filtered, "device_status");
      const typeTop = topN(countBy(filtered, "device_type"), 5);
      const offlineCount = filtered.filter((row) => row.online_status === "\u79BB\u7EBF").length;
      const abnormalCount = filtered.filter((row) => row.device_status && row.device_status !== "\u6B63\u5E38").length;
      return h(
        "div",
        { className: "dcDetailPage" },
        h(StatStrip, { stats: [
          { label: COPY.stat.total, value: num(filtered.length) },
          { label: COPY.stat.online, value: num(filtered.length - offlineCount) },
          { label: COPY.stat.offline, value: num(offlineCount), tone: offlineCount > 0 ? "alert" : void 0 },
          { label: COPY.stat.abnormal, value: num(abnormalCount), tone: abnormalCount > 0 ? "warn" : void 0 },
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
          h(DistDonut, { title: "\u5728\u7EBF\u72B6\u6001\u5206\u5E03", data: onlineDist.map((item) => ({ ...item, tone: item.label === "\u79BB\u7EBF" ? "risk" : "ok" })) }),
          h(MiniBars, { title: "\u8BBE\u5907\u72B6\u6001\u5206\u5E03", data: statusDist.map((item) => ({ ...item, tone: item.label === "\u6B63\u5E38" ? "ok" : "warn" })) }),
          h(MiniBars, { title: "\u8BBE\u5907\u7C7B\u578B TOP5", data: typeTop.map((item) => ({ ...item, tone: "gold" })) })
        ),
        h(DataTable, { rows: ordered, columns: [
          { key: "device_name", title: COPY.equipmentColumns[0], className: "dcCellMain" },
          { key: "device_type", title: COPY.equipmentColumns[1] },
          { key: "device_status", title: COPY.equipmentColumns[2], nowrap: true, render: (row) => row.device_status ? h(Status, { tone: deviceTone(row.device_status) }, row.device_status) : "\u2014" },
          { key: "online_status", title: COPY.equipmentColumns[3], nowrap: true, render: (row) => row.online_status ? h(Status, { tone: onlineTone(row.online_status) }, row.online_status) : "\u2014" },
          { key: "last_comm", title: COPY.equipmentColumns[4], nowrap: true },
          { key: "comm_delay", title: COPY.equipmentColumns[5], align: "right", render: (row) => {
            if (typeof row.comm_delay !== "number") return "\u2014";
            const tone = row.comm_delay > 60 ? "dcCellRisk" : row.comm_delay > 10 ? "dcCellWarn" : void 0;
            return h("span", { className: tone }, row.comm_delay.toFixed(1));
          } }
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
      const ordered = useMemo(() => [...filtered].sort((a, b) => (Number(b.offline_hours) || 0) - (Number(a.offline_hours) || 0)), [filtered]);
      const categoryDist = countBy(filtered, "__category");
      const categoryHead = categoryDist.slice(0, 4);
      const categoryRest = categoryDist.slice(4);
      const categoryChart = categoryRest.length ? [...categoryHead, { label: `\u5176\u4ED6 ${categoryRest.length} \u7C7B`, value: categoryRest.reduce((sum, item) => sum + item.value, 0), tone: "info" }] : categoryHead;
      const bucketDist = countBy(filtered.map((row) => ({ ...row, __bucket: offlineBucketOf(row) })), "__bucket");
      const bucketOrder = [COPY.stat.within24h, COPY.stat.oneTo3d, COPY.stat.over3d, "\u672A\u8BB0\u5F55"];
      const bucketSorted = bucketOrder.map((label) => bucketDist.find((item) => item.label === label)).filter(Boolean);
      const longest = filtered.reduce((max, row) => Math.max(max, Number(row.offline_hours ?? 0) || 0), 0);
      return h(
        "div",
        { className: "dcDetailPage" },
        h(StatStrip, { stats: [
          { label: COPY.stat.total, value: num(filtered.length) },
          { label: COPY.stat.longestOffline, value: duration(longest), tone: longest > 72 ? "alert" : longest > 24 ? "warn" : void 0 },
          { label: COPY.stat.over3d, value: num(bucketDist.find((item) => item.label === COPY.stat.over3d)?.value ?? 0), tone: (bucketDist.find((item) => item.label === COPY.stat.over3d)?.value ?? 0) > 0 ? "alert" : void 0 },
          { label: COPY.stat.oneTo3d, value: num(bucketDist.find((item) => item.label === COPY.stat.oneTo3d)?.value ?? 0) },
          { label: COPY.stat.within24h, value: num(bucketDist.find((item) => item.label === COPY.stat.within24h)?.value ?? 0) }
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
          h(DistDonut, {
            title: "\u6545\u969C\u7C7B\u578B\u5206\u5E03",
            data: categoryChart.map((item, index) => ({ ...item, tone: item.tone || ["risk", "warn", "info", "ok", "gold"][index] }))
          }),
          h(MiniBars, {
            title: COPY.stat.offlineDuration,
            data: bucketSorted.map((item, index) => ({ ...item, tone: ["ok", "warn", "risk", "info"][index] }))
          })
        ),
        h(DataTable, { rows: ordered, columns: [
          { key: "building", title: COPY.metersColumns[0], render: (row) => h("span", { className: "dcTable__ellipsis", title: cell(row.building) }, cell(row.building)) },
          { key: "location", title: COPY.metersColumns[1], render: (row) => h("span", { className: "dcTable__ellipsis", title: cell(row.location) }, cell(row.location)) },
          { key: "fault_desc", title: COPY.metersColumns[2], render: (row) => h("span", { className: "dcTable__clamp", title: cell(row.fault_desc) }, cell(row.fault_desc)) },
          { key: "fault_tag", title: COPY.metersColumns[3], nowrap: true, render: (row) => row.fault_tag || row.fault_desc ? h("span", { className: `dcTag dcTag--${faultTagTone(row.__category)}` }, row.__category) : "\u2014" },
          { key: "data_time", title: COPY.metersColumns[4], nowrap: true },
          { key: "offline_hours", title: COPY.metersColumns[5], align: "right", render: (row) => {
            if (typeof row.offline_hours !== "number") return "\u2014";
            const tone = offlineHoursTone(row.offline_hours);
            return h("span", { className: tone === "risk" ? "dcCellRisk" : tone === "warn" ? "dcCellWarn" : void 0 }, row.offline_hours.toFixed(1));
          } }
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
      const ordered = useMemo(() => [...filtered].sort((a, b) => {
        const rank = (row) => row.hazard_status === "\u5DF2\u6574\u6539" ? 2 : Number(row.remaining_days) < 0 ? 0 : 1;
        return rank(a) - rank(b) || (Number(a.remaining_days) || 0) - (Number(b.remaining_days) || 0);
      }), [filtered]);
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
          { label: COPY.stat.total, value: num(filtered.length) },
          { label: COPY.stat.rectified, value: num(rectified) },
          { label: COPY.stat.overdueUnfixed, value: num(overdueCount), tone: overdueCount > 0 ? "alert" : void 0 },
          { label: COPY.stat.imminentDays, value: num(imminent), tone: imminent > 0 ? "warn" : void 0 }
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
          h(MiniBars, { title: "\u9690\u60A3\u7B49\u7EA7\u5206\u5E03", data: levelDist.map((item) => ({ ...item, tone: item.label.includes("\u91CD\u5927") ? "risk" : item.label.includes("\u8F83\u5927") ? "warn" : "info" })) }),
          h(MiniBars, { title: "\u6574\u6539\u72B6\u6001\u5206\u5E03", data: statusDist.map((item) => ({ ...item, tone: item.label === "\u5DF2\u6574\u6539" ? "ok" : item.label.includes("\u903E\u671F") ? "risk" : "info" })) })
        ),
        h(DataTable, { rows: ordered, columns: [
          { key: "description", title: COPY.hazardsColumns[0], className: "dcCellMain" },
          { key: "level", title: COPY.hazardsColumns[1], nowrap: true, render: (row) => row.level ? h(Status, { tone: levelTone(row.level) }, row.level) : "\u2014" },
          { key: "hazard_status", title: COPY.hazardsColumns[2], nowrap: true, render: (row) => row.hazard_status ? h(Status, { tone: hazardStatusTone(row.hazard_status) }, row.hazard_status) : "\u2014" },
          { key: "responsible", title: COPY.hazardsColumns[3], nowrap: true },
          { key: "deadline", title: COPY.hazardsColumns[4], nowrap: true },
          // 已整改的隐患不再显示「剩余天数」：整改完成后该数字没有意义（会显示 -300 这类噪声）。
          { key: "remaining_days", title: COPY.hazardsColumns[5], nowrap: true, align: "right", render: (row) => {
            if (row.hazard_status === "\u5DF2\u6574\u6539") return "\u2014";
            if (typeof row.remaining_days !== "number") return "\u2014";
            const days = Math.round(row.remaining_days);
            if (days < 0) return h("span", { className: "dcCellRisk" }, `\u903E\u671F ${Math.abs(days)} \u5929`);
            return h("span", { className: days <= 7 ? "dcCellWarn" : void 0 }, `${days} \u5929`);
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
      const ordered = useMemo(() => [...filtered].sort((a, b) => {
        const rank = (row) => row.plan_status === "\u5DF2\u5B8C\u6210" ? 2 : Number(row.countdown) < 0 ? 0 : 1;
        return rank(a) - rank(b) || (Number(a.countdown) || 0) - (Number(b.countdown) || 0);
      }), [filtered]);
      const statusDist = countBy(filtered, "plan_status");
      const completed = filtered.filter((row) => row.plan_status === "\u5DF2\u5B8C\u6210").length;
      const overdueCount = filtered.filter(isOverdueRow).length;
      return h(
        "div",
        { className: "dcDetailPage" },
        h(StatStrip, { stats: [
          { label: COPY.stat.total, value: num(filtered.length) },
          { label: COPY.stat.completed, value: num(completed) },
          { label: COPY.stat.overdueUnfinished, value: num(overdueCount), tone: overdueCount > 0 ? "alert" : void 0 },
          { label: COPY.stat.uncompleted, value: num(filtered.length - completed), tone: filtered.length - completed > 0 ? "warn" : void 0 }
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
          h(MiniBars, { title: "\u503C\u73ED\u72B6\u6001\u5206\u5E03", data: statusDist.map((item) => ({ ...item, tone: item.label === "\u5DF2\u5B8C\u6210" ? "ok" : item.label.includes("\u903E\u671F") ? "risk" : "info" })) })
        ),
        h(DataTable, { rows: ordered, columns: [
          { key: "plan_type", title: COPY.dutiesColumns[0] },
          { key: "position", title: COPY.dutiesColumns[1] },
          { key: "responsible", title: COPY.dutiesColumns[2], nowrap: true },
          { key: "start_date", title: COPY.dutiesColumns[3], nowrap: true },
          { key: "end_date", title: COPY.dutiesColumns[4], nowrap: true },
          { key: "plan_status", title: COPY.dutiesColumns[5], nowrap: true, render: (row) => row.plan_status ? h(Status, { tone: dutyTone(row.plan_status) }, row.plan_status) : "\u2014" }
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
      const yearlyTotal = filtered.reduce((sum, row) => sum + (Number(row.yearly_usage) || 0), 0);
      const currentTotal = filtered.reduce((sum, row) => sum + (Number(row.current_usage) || 0), 0);
      const topUsage = topN([...filtered ?? []].sort((a, b) => (Number(b.yearly_usage) || 0) - (Number(a.yearly_usage) || 0)), 10).map((row) => ({ label: row.subject, value: Math.round((Number(row.yearly_usage) || 0) / 1e4), tone: "gold" }));
      return h(
        "div",
        { className: "dcDetailPage" },
        h(StatStrip, { stats: [
          { label: "\u9884\u7B97\u79D1\u76EE", value: num(filtered.length) },
          { label: "\u5E74\u5EA6\u4F7F\u7528\u5408\u8BA1", value: `\xA5${(yearlyTotal / 1e4).toLocaleString("zh-CN", { maximumFractionDigits: 1 })} \u4E07` },
          { label: "\u672C\u671F\u4F7F\u7528\u5408\u8BA1", value: `\xA5${(currentTotal / 1e4).toLocaleString("zh-CN", { maximumFractionDigits: 1 })} \u4E07` }
        ] }),
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
          h(MiniBars, { title: "\u5E74\u5EA6\u4F7F\u7528\u91D1\u989D TOP10\uFF08\u4E07\u5143\uFF09", data: topUsage })
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
    const shortSync = (value) => {
      if (!value) return "";
      const match = /(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/.exec(String(value));
      return match ? `${match[2]}-${match[3]} ${match[4]}:${match[5]}` : String(value);
    };
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
      const workspaceRef = useRef(null);
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
      useEffect(() => {
        workspaceRef.current?.scrollTo?.({ top: 0, behavior: "auto" });
      }, [tab]);
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
        if (loading && !overview) return h("div", { className: "dcWorkspace" }, h("div", { className: "dcInner" }, h(Skeleton)));
        if (error && !overview) {
          return h(
            "div",
            { className: "dcStatus dcStatus--error", role: "alert" },
            h("p", null, `${COPY.loadFailed}\uFF1A${error}`),
            h("p", { className: "dcSection__note" }, COPY.retryHint),
            h("button", { className: "dcBtn", type: "button", onClick: refresh }, COPY.retry)
          );
        }
        if (picking || selected.length === 0) {
          return h(ProjectPicker, {
            projects,
            selected,
            onToggle: toggleProject,
            onConfirm: confirmProjects,
            onCancel: selected.length > 0 ? () => setPicking(false) : null,
            loading
          });
        }
        return null;
      }, [confirmProjects, error, loading, overview, picking, projects, refresh, selected, toggleProject]);
      const reportFor = (kind, rows) => {
        const prompt = buildReportPrompt(kind, selected, rows, overview?.sync?.status?.last_sync, overview?.sync?.sync_info?.last_sync);
        return runReport(prompt);
      };
      const detailBody = useMemo(() => {
        if (tab === "overview") {
          return h(Overview, { data: overview, projects: overview?.projects ?? [], onOpenSafety: () => setTab("safety") });
        }
        if (tab === "budget") return h(BudgetPage, { rows: overview?.budget ?? [], onReport: () => reportFor("budget", overview?.budget ?? []), reportBusy: aiBusy });
        if (tab === "safety") {
          const hazards = detail.hazards;
          const duties = detail.duties;
          const loadingDetail = detailLoading && !hazards && !duties;
          if (loadingDetail) return h(Skeleton, { rows: 8 });
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
        if (detailLoading && !state) return h(Skeleton, { rows: 8 });
        const rows = state?.rows ?? [];
        const page = tab === "equipment" ? h(EquipmentPage, { rows, truncated: state?.truncated, onReport: () => reportFor("equipment", rows), reportBusy: aiBusy }) : h(MetersPage, { rows, truncated: state?.truncated, onReport: () => reportFor("meters", rows), reportBusy: aiBusy });
        return page;
      }, [detail, detailLoading, overview, tab, aiBusy, selected]);
      const projectLabel = selected.length > 1 ? `${selected[0]} \u7B49 ${selected.length} \u4E2A` : selected[0];
      const header = h(
        "header",
        { className: "dcHeader", "data-dsh-workbench-toolbar": "" },
        h(
          "div",
          { className: "dcHeader__lead" },
          h("span", { className: "dcHeader__rule", "aria-hidden": "true" }),
          h(
            "div",
            { className: "dcHeader__titles" },
            h("h1", { className: "dcHeader__title" }, COPY.title),
            h("p", { className: "dcHeader__subtitle" }, COPY.subtitle)
          )
        ),
        h(
          "div",
          { className: "dcHeader__actions" },
          selected.length > 0 && !picking ? h(
            "button",
            {
              className: "dcProjectChip",
              type: "button",
              onClick: () => setPicking(true),
              title: `${COPY.back}\uFF1A${selected.join("\u3001")}`
            },
            h("span", { className: "dcProjectChip__value" }, projectLabel),
            h(ChevronDown)
          ) : null,
          selected.length > 0 && !picking ? h(
            "button",
            { className: "dcBtn dcBtn--ghost", type: "button", onClick: refresh, disabled: loading, "data-spin": loading ? "true" : void 0 },
            h(RefreshIcon),
            h("span", null, COPY.refresh)
          ) : null,
          selected.length > 0 ? h("button", {
            className: "dcBtn dcBtn--primary",
            type: "button",
            onClick: startAssistant,
            disabled: aiBusy,
            title: COPY.aiHelpHint
          }, aiBusy ? COPY.aiWorking : COPY.aiHelp) : null
        )
      );
      const tabsBar = picker ? null : h(
        "div",
        { className: "dcTabbar" },
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
        h("div", { className: "dcTabsMeta" }, loading ? "\u6B63\u5728\u66F4\u65B0\u2026" : `${selected.length} \u4E2A\u9879\u76EE \xB7 \u66F4\u65B0\u4E8E ${shortSync(overview?.sync?.status?.last_sync ?? overview?.sync?.sync_info?.last_sync) || "\u2014"}`)
      );
      const content = h(
        "div",
        { className: "dcContent" },
        picker ?? h(
          "div",
          { className: "dcWorkspace", ref: workspaceRef },
          h(
            "div",
            { className: "dcInner" },
            error ? h("div", { className: "dcNotice", role: "alert" }, `${COPY.loadFailed}\uFF1A${error}`) : null,
            aiError ? h("div", { className: "dcNotice", role: "alert" }, aiError) : null,
            reportNotice ? h("div", { className: "dcNotice", role: "status" }, reportNotice) : null,
            h("section", { className: "dcPanel", role: "tabpanel" }, detailBody)
          )
        )
      );
      if (!chatOpen) return h("div", { className: "dcRoot" }, header, tabsBar, content);
      return h(
        "div",
        { className: "dcRoot dcRoot--chat" },
        header,
        tabsBar,
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

  /* \u6696\u4E2D\u6027\u8272\u677F\uFF1A\u4E0E\u91D1\u9EC4\u54C1\u724C\u8272\u540C\u4E00\u8272\u76F8\u5BB6\u65CF */
  --dc-ink:#211f1a;
  --dc-ink-2:#6b665d;
  --dc-ink-3:#7a7365;
  --dc-line:#e9e4d9;
  --dc-line-2:#f1ede5;
  --dc-surface:#ffffff;
  --dc-surface-2:#faf8f3;
  --dc-surface-3:#f4f0e7;
  --dc-gold:#a8762b;
  --dc-gold-strong:#8a5f20;
  --dc-gold-soft:#f8efdd;
  --dc-gold-line:#e8d4ae;
  --dc-clay:#a8492f;
  --dc-clay-soft:#f9ede8;
  --dc-amber:#97701f;
  --dc-amber-soft:#faf1dd;
  --dc-moss:#56704b;
  --dc-moss-soft:#eef2e9;
  --dc-slate:#5c6874;
  --dc-slate-soft:#eef1f4;
  --dc-radius:14px;
  --dc-ease:cubic-bezier(.22,.61,.36,1);

  display:flex;flex-direction:column;
  flex:1 1 auto;min-height:0;min-width:0;width:100%;
  font-family:inherit;font-size:13px;line-height:20px;
  color:var(--dc-ink);background:var(--dc-surface);
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
}
.dcRoot *{box-sizing:border-box}
.dcRoot button,.dcRoot input,.dcRoot select{font-family:inherit;font-size:13px;line-height:20px;color:inherit}
.dcRoot button{cursor:pointer}
.dcRoot button:disabled{cursor:default;opacity:.55}
.dcRoot :is(button,input,select,summary):focus-visible{outline:2px solid var(--dc-gold);outline-offset:2px}

/* \u6696\u8272\u6697\u8272\u4E3B\u9898\uFF1A\u5BBF\u4E3B\u5207\u6362\u6697\u8272\u65F6\u8DDF\u968F */
body[data-ds-dark-theme] .dcRoot{
  --dc-ink:#f1eee7;
  --dc-ink-2:#a8a294;
  --dc-ink-3:#938c7f;
  --dc-line:#312f2a;
  --dc-line-2:#282621;
  --dc-surface:#1c1b19;
  --dc-surface-2:#22211e;
  --dc-surface-3:#2a2823;
  --dc-gold:#d0a55e;
  --dc-gold-strong:#ddbb7e;
  --dc-gold-soft:#2d2618;
  --dc-gold-line:#4a3a1d;
  --dc-clay:#d98a72;
  --dc-clay-soft:#2e211d;
  --dc-amber:#d3ad63;
  --dc-amber-soft:#2b2417;
  --dc-moss:#a2b795;
  --dc-moss-soft:#20261d;
  --dc-slate:#a3b0bc;
  --dc-slate-soft:#1f2429;
}

/* ---- \u9876\u680F\uFF08\u5BBF\u4E3B\u7D27\u51D1\u6807\u9898\u680F\uFF09 ---------------------------------- */
.dcHeader{
  flex:0 0 auto;display:flex;align-items:center;gap:16px;
  min-height:52px;padding:8px 24px;
  border-bottom:1px solid var(--dc-line);
  background:var(--dc-surface);
}
.dcHeader__lead{display:flex;align-items:center;gap:11px;min-width:0;flex:1 1 auto}
.dcHeader__rule{flex:0 0 auto;width:3px;height:19px;border-radius:2px;background:var(--dc-gold)}
.dcHeader__titles{min-width:0}
.dcHeader__title{
  margin:0;font-size:14px;line-height:20px;font-weight:600;letter-spacing:.01em;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
}
.dcHeader__subtitle{
  margin:1px 0 0;font-size:11px;line-height:15px;color:var(--dc-ink-3);
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
}
.dcHeader__actions{display:flex;align-items:center;gap:8px;flex-wrap:nowrap;min-width:0}

.dcProjectChip{
  display:inline-flex;align-items:center;gap:8px;max-width:280px;height:32px;
  padding:0 10px;border:1px solid var(--dc-line);border-radius:8px;
  background:var(--dc-surface-2);color:var(--dc-ink);
  transition:border-color .16s ease,background .16s ease;
}
.dcProjectChip:hover{border-color:var(--dc-gold-line);background:var(--dc-gold-soft)}
.dcProjectChip__value{
  min-width:0;font-size:12px;font-weight:500;white-space:nowrap;
  overflow:hidden;text-overflow:ellipsis;
}
.dcProjectChip svg{flex:0 0 auto;color:var(--dc-ink-3)}

.dcBtn{
  display:inline-flex;align-items:center;justify-content:center;gap:6px;
  height:32px;padding:0 12px;white-space:nowrap;
  border:1px solid var(--dc-line);border-radius:8px;
  background:var(--dc-surface);color:var(--dc-ink);
  transition:background .16s ease,border-color .16s ease,transform .12s ease;
}
.dcBtn:hover:not(:disabled){background:var(--dc-surface-2);border-color:#ddd6c8}
.dcBtn:active:not(:disabled){transform:translateY(1px)}
.dcBtn svg{flex:0 0 auto}
.dcBtn--ghost{border-color:transparent;background:transparent;color:var(--dc-ink-2)}
.dcBtn--ghost:hover:not(:disabled){background:var(--dc-surface-2);color:var(--dc-ink)}
.dcBtn--primary{
  background:var(--dsw-alias-brand-primary-new-color,#a8762b);
  color:#fff;border-color:transparent;font-weight:500;
}
.dcBtn--primary:hover:not(:disabled){background:#93641f;border-color:transparent}
.dcBtn--primary:active:not(:disabled){background:#7f5519;border-color:transparent}
.dcBtn--primary:focus-visible{outline:2px solid var(--dc-gold);outline-offset:2px}
.dcBtn--primary:disabled{background:#f0e3c8;color:#8a6a34;border-color:transparent;opacity:1}
.dcBtn--report{
  border-color:var(--dc-gold-line);background:var(--dc-gold-soft);
  color:var(--dc-gold-strong);font-weight:500;
}
.dcBtn--report:hover:not(:disabled){background:#f3e6cb;border-color:#dcbf8d}
.dcBtn--sm{height:28px;padding:0 9px;font-size:12px}
.dcBtn--icon{width:32px;padding:0}
.dcBtn--icon.dcBtn--ghost{width:30px}

@keyframes dcSpin{to{transform:rotate(360deg)}}
.dcBtn[data-spin=true] svg{animation:dcSpin 1s linear infinite}

/* ---- \u5206\u7C7B\u6807\u7B7E\u680F ---------------------------------------------- */
.dcTabbar{
  flex:0 0 auto;display:flex;align-items:flex-end;justify-content:space-between;gap:16px;
  padding:0 24px;border-bottom:1px solid var(--dc-line);background:var(--dc-surface);
}
.dcTabs{display:flex;gap:26px;min-width:0;overflow-x:auto;scrollbar-width:none}
.dcTabs::-webkit-scrollbar{display:none}
.dcTab{
  position:relative;flex:0 0 auto;border:0;background:none;
  padding:13px 0 12px;font-size:13px;line-height:20px;color:var(--dc-ink-2);
  transition:color .16s ease;
}
.dcTab::after{
  content:"";position:absolute;left:0;right:0;bottom:-1px;height:2px;border-radius:2px;
  background:var(--dc-gold);transform:scaleX(0);transform-origin:center;
  transition:transform .22s var(--dc-ease);
}
.dcTab:hover{color:var(--dc-ink)}
.dcTab[aria-selected=true]{color:var(--dc-ink);font-weight:600}
.dcTab[aria-selected=true]::after{transform:scaleX(1)}
.dcTabsMeta{
  flex:0 0 auto;padding-bottom:12px;font-size:11px;line-height:16px;color:var(--dc-ink-3);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}

/* ---- \u5185\u5BB9\u533A --------------------------------------------------- */
.dcContent{flex:1 1 auto;min-height:0;min-width:0;display:flex;flex-direction:column;overflow:hidden}
.dcSplit{flex:1 1 auto;min-height:0;min-width:0;display:flex;align-items:stretch}
.dcSplit>.dcContent{flex:1 1 auto;min-width:0}
.dcChat{
  flex:0 0 400px;max-width:44%;min-width:300px;display:flex;flex-direction:column;
  border-left:1px solid var(--dc-line);overflow:hidden;min-height:0;
}
.dcWorkspace{
  /* \u4E0E\u6839\u5BB9\u5668\u540C\u540D\uFF1A\u5185\u5BB9\u533A\u88AB AI \u5BF9\u8BDD\u6324\u7A84\u65F6\uFF0C\u5361\u7247\u6309\u5185\u5BB9\u5BBD\u5EA6\u91CD\u6392\uFF0C\u800C\u4E0D\u662F\u6309\u6574\u7A97\u5BBD\u5EA6\u3002 */
  container-type:inline-size;container-name:datacenter-panel;
  flex:1 1 auto;min-height:0;min-width:0;overflow:auto;
  padding:26px 32px 48px;scroll-behavior:smooth;
}
.dcInner{max-width:1280px;margin:0 auto;min-width:0}
.dcWorkspace::-webkit-scrollbar{width:10px;height:10px}
.dcWorkspace::-webkit-scrollbar-thumb{background:#e4ded1;border-radius:8px;border:3px solid var(--dc-surface)}
.dcWorkspace::-webkit-scrollbar-thumb:hover{background:#d6cfbf}
body[data-ds-dark-theme] .dcWorkspace::-webkit-scrollbar-thumb{background:#3a3833;border-color:var(--dc-surface)}

.dcStatus{padding:48px 24px;color:var(--dc-ink-2);text-align:center;overflow-wrap:anywhere}
.dcStatus--error{color:var(--dc-ink)}
.dcStatus p{margin:0 0 14px;overflow-wrap:anywhere}
.dcNotice{
  margin:0 0 14px;padding:10px 14px;border-radius:9px;font-size:12px;line-height:18px;
  background:var(--dc-amber-soft);color:#7c5d1c;border:1px solid #ecdab4;
  overflow-wrap:anywhere;
}
body[data-ds-dark-theme] .dcNotice{color:#e0c383;border-color:#463a22}
.dcFootnote{margin:2px 0 0;font-size:12px;line-height:18px;color:var(--dc-ink-3);overflow-wrap:anywhere}

.dcEmpty{padding:38px 16px;text-align:center;color:var(--dc-ink-2);font-size:12.5px;overflow-wrap:anywhere}
.dcEmpty__mark{
  display:grid;place-items:center;width:36px;height:36px;margin:0 auto 11px;
  border-radius:50%;background:var(--dc-surface-2);color:var(--dc-ink-3);
}
.dcEmpty__hint{margin-top:6px;font-size:11.5px;line-height:17px;color:var(--dc-ink-3)}
.dcEmpty--inline{padding:24px 8px}

/* ---- \u9AA8\u67B6\u5C4F --------------------------------------------------- */
.dcSkeleton{display:flex;flex-direction:column;gap:14px;padding:6px 0}
.dcSkeleton__row{display:flex;gap:14px;align-items:center}
.dcSkeleton__block{
  border-radius:10px;
  background:linear-gradient(90deg,var(--dc-surface-2) 25%,var(--dc-surface-3) 37%,var(--dc-surface-2) 63%);
  background-size:400% 100%;animation:dcShimmer 1.5s ease infinite;
}
@keyframes dcShimmer{0%{background-position:100% 0}100%{background-position:0 0}}
.dcSkeleton__strip{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
.dcSkeleton__label{
  font-size:12px;color:var(--dc-ink-3);display:flex;align-items:center;gap:8px;
}
.dcSkeleton__label::before{
  content:"";width:6px;height:6px;border-radius:50%;background:var(--dc-gold);
  animation:dcPulse 1.4s ease-in-out infinite;
}
@keyframes dcPulse{50%{opacity:.3}}

/* ---- \u603B\u89C8 ----------------------------------------------------- */
.dcOverview{display:flex;flex-direction:column;gap:26px;min-width:0}
.dcSectionHead{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin:0 0 12px}
.dcSection__title{margin:0;font-size:15px;line-height:22px;font-weight:600;letter-spacing:.01em;overflow-wrap:anywhere}
.dcSection__note{margin:3px 0 0;font-size:12px;line-height:18px;color:var(--dc-ink-2);overflow-wrap:anywhere}
.dcPanel{min-width:0}

/* \u98CE\u9669\u6458\u8981\uFF1A\u6574\u9875\u552F\u4E00\u7684\u6696\u91D1\u63D0\u793A\u6761 */
.dcInsight{
  display:flex;align-items:flex-start;gap:14px;min-width:0;
  padding:15px 18px;border:1px solid var(--dc-gold-line);border-radius:var(--dc-radius);
  background:var(--dc-gold-soft);
}
.dcInsight--calm{border-color:#dbe5d5;background:var(--dc-moss-soft)}
.dcInsight__label{
  flex:0 0 auto;display:inline-flex;align-items:center;gap:6px;padding-top:2px;
  font-size:11px;font-weight:600;letter-spacing:.08em;color:var(--dc-gold-strong);white-space:nowrap;
}
.dcInsight--calm .dcInsight__label{color:var(--dc-moss)}
.dcInsight__dot{width:6px;height:6px;border-radius:50%;background:var(--dc-clay)}
.dcInsight--calm .dcInsight__dot{background:var(--dc-moss)}
.dcInsight__text{flex:1 1 auto;min-width:0;margin:0;font-size:13px;line-height:21px;color:var(--dc-ink);overflow-wrap:anywhere}
.dcInsight__text b{font-weight:600;font-variant-numeric:tabular-nums;letter-spacing:.01em}
.dcInsight__text b.is-risk{color:var(--dc-clay)}
.dcInsight__text b.is-warn{color:var(--dc-amber)}
.dcInsight__action{
  flex:0 0 auto;align-self:center;border:0;background:none;padding:4px 0;
  font-size:12px;color:var(--dc-gold-strong);white-space:nowrap;
  border-bottom:1px solid transparent;transition:border-color .16s ease;
}
.dcInsight__action:hover{border-bottom-color:var(--dc-gold-line)}
.dcInsight__action span{margin-left:4px;transition:transform .16s ease;display:inline-block}
.dcInsight__action:hover span{transform:translateX(2px)}

/* \u56DB\u4E2A\u6838\u5FC3\u6307\u6807\uFF1A\u4E00\u5757\u9762\u677F\u5185\u7528\u53D1\u4E1D\u7EBF\u5206\u9694\uFF0C\u4E0D\u7528\u56DB\u5F20\u5361 */
.dcVitals{
  display:grid;grid-template-columns:repeat(4,minmax(0,1fr));
  border:1px solid var(--dc-line);border-radius:var(--dc-radius);
  background:var(--dc-surface);overflow:hidden;
}
.dcVital{padding:17px 20px 16px;min-width:0;border-left:1px solid var(--dc-line-2)}
.dcVital:first-child{border-left:0}
.dcVital__label{display:flex;align-items:center;gap:7px;font-size:12px;line-height:18px;color:var(--dc-ink-2)}
.dcVital__mark{width:5px;height:5px;border-radius:50%;background:var(--dc-gold);flex:0 0 auto}
.dcVital__value{
  display:block;margin:7px 0 3px;font-size:31px;line-height:36px;font-weight:600;
  letter-spacing:-.02em;font-variant-numeric:tabular-nums;color:var(--dc-ink);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}
.dcVital__value.is-empty{color:var(--dc-ink-3);font-size:24px;line-height:36px}
.dcVital__unit{margin-left:4px;font-size:12px;font-weight:400;color:var(--dc-ink-3);letter-spacing:0}
.dcVital__hint{font-size:12px;line-height:18px;color:var(--dc-ink-2);overflow-wrap:anywhere}
.dcVital__hint b{font-weight:600;font-variant-numeric:tabular-nums;color:var(--dc-ink)}
.dcVital__hint b.is-risk{color:var(--dc-clay)}
.dcVital__hint b.is-warn{color:var(--dc-amber)}

/* \u56FE\u8868\u5361\uFF1A12 \u6805\u683C\u4E0A\u505A\u5BBD\u7A84\u4EA4\u66FF\uFF0C\u907F\u514D\u56DB\u7B49\u5206\u7684\u6A21\u677F\u611F */
.dcChartGrid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:16px;min-width:0}
.dcCard{
  container-type:inline-size;container-name:dcCard;
  min-width:0;border:1px solid var(--dc-line);border-radius:var(--dc-radius);
  background:var(--dc-surface);padding:18px 20px 17px;
}
.dcCard--wide{grid-column:span 7}
.dcCard--narrow{grid-column:span 5}
.dcCard__head{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin:0 0 15px}
.dcChartTitle{margin:0;font-size:13px;line-height:20px;font-weight:600;overflow-wrap:anywhere}
.dcCard__note{flex:0 0 auto;font-size:11px;line-height:16px;color:var(--dc-ink-3);white-space:nowrap}
.dcChartBlock{min-width:0}

/* \u6392\u540D\uFF1A\u540D\u6B21 + \u540D\u79F0 + \u6761\u5F62 + \u8BA1\u6570 + \u6545\u969C\u7387 */
.dcRankRows{display:flex;flex-direction:column;min-width:0}
.dcRankRow{
  display:grid;grid-template-columns:22px minmax(80px,1.15fr) minmax(56px,1fr) 66px 50px;
  gap:12px;align-items:center;min-width:0;
  padding:7px 8px;margin:0 -8px;border-radius:7px;
  transition:background .14s ease;
}
.dcRankRow:hover{background:var(--dc-surface-2)}
.dcRankRow__index{font-size:11px;color:var(--dc-ink-3);font-variant-numeric:tabular-nums;letter-spacing:.04em}
.dcRankRow__name{
  font-size:12.5px;line-height:18px;color:var(--dc-ink);
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
}
.dcRankRow__name.is-top{font-weight:600}
.dcRankRow__track{height:4px;border-radius:2px;background:var(--dc-surface-3);overflow:hidden}
.dcRankRow__fill{
  display:block;height:100%;border-radius:2px;background:var(--dc-gold);
  transition:width .6s var(--dc-ease),background .14s ease;
}
.dcRankRow:hover .dcRankRow__fill{background:var(--dc-gold-strong)}
.dcRankRow__value{font-size:12px;text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap;color:var(--dc-ink)}
.dcRankRow__value small{font-size:11px;color:var(--dc-ink-3)}
.dcRankRow__rate{font-size:12px;text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap;color:var(--dc-ink-2)}

/* \u56FE\u4F8B\u4E0E\u5806\u53E0\u6761 */
.dcChartLegend{display:flex;gap:14px;flex-wrap:wrap;margin:0 0 13px}
.dcLegendItem{display:inline-flex;align-items:center;gap:6px;font-size:11.5px;line-height:16px;color:var(--dc-ink-2)}
.dcLegendDot{display:inline-block;width:7px;height:7px;border-radius:2px;flex:0 0 auto}
.dcChartRows{display:flex;flex-direction:column;gap:4px;min-width:0}
.dcChartRow{
  display:grid;grid-template-columns:minmax(76px,132px) 1fr minmax(34px,auto);gap:12px;align-items:center;
  min-width:0;padding:6px 8px;margin:0 -8px;border-radius:7px;transition:background .14s ease;
}
.dcChartRow:hover{background:var(--dc-surface-2)}
.dcChartRow__label{font-size:12px;line-height:17px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;color:var(--dc-ink-2)}
.dcChartRow__bars{display:flex;flex-direction:column;gap:3px;min-width:0}
.dcChartRow__value{font-size:12px;line-height:17px;text-align:right;color:var(--dc-ink);font-variant-numeric:tabular-nums;white-space:nowrap}
.dcBarTrack{position:relative;display:flex;height:6px;min-width:0;border-radius:3px;background:var(--dc-surface-3);overflow:hidden}
.dcBarTrack--stack{height:9px;border-radius:4px;background:var(--dc-surface-3)}
.dcBarTrack--stack>.dcBarFill{flex:0 0 auto}
.dcBarFill{display:block;height:100%;min-width:0;transition:width .55s var(--dc-ease)}
.dcBarFill.dcSeg--risk{background:color-mix(in srgb, var(--dc-clay) 78%, var(--dc-surface))}
.dcBarFill.dcSeg--warn{background:color-mix(in srgb, var(--dc-amber) 82%, var(--dc-surface))}
.dcBarFill.dcSeg--info{background:color-mix(in srgb, var(--dc-slate) 78%, var(--dc-surface))}
.dcBarFill.dcSeg--ok{background:color-mix(in srgb, var(--dc-moss) 80%, var(--dc-surface))}
.dcBarFill.dcSeg--gold{background:color-mix(in srgb, var(--dc-gold) 85%, var(--dc-surface))}

/* \u56FE\u8868\u7528\u8272\uFF1A\u5168\u90E8\u8D70\u53D8\u91CF\uFF0C\u6697\u8272\u4E3B\u9898\u81EA\u52A8\u8DDF\u968F */
.dcSeg--risk{background:var(--dc-clay)}
.dcSeg--warn{background:var(--dc-amber)}
.dcSeg--ok{background:var(--dc-moss)}
.dcSeg--info{background:var(--dc-slate)}
.dcSeg--gold{background:var(--dc-gold)}
.dcDonut__track{stroke:var(--dc-surface-3)}
.dcDonut__seg{transition:opacity .16s ease}
.dcDonut__seg--risk{stroke:var(--dc-clay)}
.dcDonut__seg--warn{stroke:var(--dc-amber)}
.dcDonut__seg--ok{stroke:var(--dc-moss)}
.dcDonut__seg--info{stroke:var(--dc-slate)}
.dcDonut__seg--gold{stroke:var(--dc-gold)}

/* \u73AF\u5F62\u56FE */
.dcDonut{display:flex;align-items:center;justify-content:flex-start;gap:22px;flex-wrap:wrap;min-width:0}
.dcDonut__svg{width:142px;height:142px;flex:0 0 auto}
.dcDonut__value{font-size:25px;font-weight:600;fill:var(--dc-ink);letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.dcDonut__label{font-size:9.5px;fill:var(--dc-ink-3);letter-spacing:.1em}
.dcDonut__legend{display:flex;flex-direction:column;gap:9px;min-width:0;flex:0 1 252px;max-width:252px}
.dcDonutLegend__item{display:grid;grid-template-columns:7px minmax(0,1fr) auto 38px;gap:9px;align-items:center;min-width:0}
.dcDonutLegend__label{font-size:12px;line-height:18px;color:var(--dc-ink-2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
.dcDonutLegend__value{font-size:12.5px;line-height:18px;font-weight:600;font-variant-numeric:tabular-nums;color:var(--dc-ink)}
.dcDonutLegend__pct{font-size:11px;line-height:18px;text-align:right;color:var(--dc-ink-3);font-variant-numeric:tabular-nums}
.dcDonut__foot{
  width:100%;margin:14px 0 0;padding-top:12px;border-top:1px solid var(--dc-line-2);
  font-size:11.5px;line-height:17px;color:var(--dc-ink-2);
}
.dcDonut__foot b{color:var(--dc-clay);font-weight:600}

@container dcCard (max-width:460px){
  .dcDonut{gap:14px}
  .dcDonut__svg{width:118px;height:118px}
  .dcDonut__legend{flex:1 1 180px;max-width:180px}
  .dcDonut__value{font-size:22px}
  .dcDonut__foot{margin-top:10px;padding-top:10px}
}
@container dcCard (max-width:430px){
  .dcRankRow{grid-template-columns:20px minmax(0,1fr) minmax(46px,.8fr) 60px;gap:9px}
  .dcRankRow__rate{display:none}
}
@container dcCard (max-width:380px){
  .dcDonut{gap:12px}
  .dcDonut__svg{width:104px;height:104px}
  .dcDonut__legend{flex:1 1 158px;max-width:158px}
}
@container dcMini (max-width:400px){
  .dcDonut{gap:12px}
  .dcDonut__svg{width:104px;height:104px}
  .dcDonut__legend{flex:1 1 164px;max-width:164px}
}

/* \u8986\u76D6\u7387 */
.dcCoverage{display:flex;flex-direction:column;gap:3px;min-width:0}
.dcCoverage__row{
  display:grid;grid-template-columns:minmax(88px,124px) 1fr 42px;gap:12px;align-items:center;min-width:0;
  padding:6px 0;
}
.dcCoverage__label{font-size:12px;line-height:17px;color:var(--dc-ink-2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
.dcCoverage__track{position:relative;height:5px;border-radius:3px;background:var(--dc-surface-3);overflow:hidden;min-width:0}
.dcCoverage__fill{display:block;height:100%;border-radius:3px;transition:width .6s var(--dc-ease)}
.dcCoverage__fill--good{background:var(--dc-moss)}
.dcCoverage__fill--mid{background:var(--dc-amber)}
.dcCoverage__fill--low{background:var(--dc-clay)}
.dcCoverage__value{font-size:12px;line-height:17px;text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap;color:var(--dc-ink-2)}
.dcCoverage__value--good{color:var(--dc-moss)}
.dcCoverage__value--mid{color:var(--dc-amber)}
.dcCoverage__value--low{color:var(--dc-clay)}

/* \u96C6\u56E2\u53E3\u5F84\uFF1A\u4F5C\u4E3A\u9644\u5F55\uFF0C\u89C6\u89C9\u6743\u91CD\u4F4E\u4E8E\u6240\u9009\u9879\u76EE */
.dcAppendix{
  border:1px solid var(--dc-line);border-radius:var(--dc-radius);
  background:var(--dc-surface-2);padding:17px 20px 16px;
}
.dcAppendix__head{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;margin:0 0 15px}
.dcAppendix__title{font-size:12px;line-height:18px;font-weight:600;color:var(--dc-ink-2);letter-spacing:.02em}
.dcAppendix__note{font-size:11px;line-height:16px;color:var(--dc-ink-3)}
.dcAppendix__grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));min-width:0}
.dcMini{padding:0 16px;border-left:1px solid var(--dc-line);min-width:0}
.dcMini:first-child{padding-left:0;border-left:0}
.dcMini__label{font-size:11px;line-height:16px;color:var(--dc-ink-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dcMini__value{
  margin-top:4px;font-size:19px;line-height:26px;font-weight:600;letter-spacing:-.01em;
  font-variant-numeric:tabular-nums;color:var(--dc-ink);white-space:nowrap;
}
.dcMini__hint{margin-top:2px;font-size:11px;line-height:16px;color:var(--dc-ink-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

/* \u540C\u6B65\u4FE1\u606F\uFF1A\u9875\u811A\u4E00\u884C\uFF0C\u4E0D\u518D\u5360\u4E00\u5F20\u5361 */
.dcSync{
  display:flex;align-items:center;gap:8px 16px;flex-wrap:wrap;
  padding-top:16px;border-top:1px solid var(--dc-line);min-width:0;
  font-size:11.5px;line-height:18px;color:var(--dc-ink-3);
}
.dcSync__dot{width:5px;height:5px;border-radius:50%;background:var(--dc-moss);flex:0 0 auto}
.dcSync__meta{display:flex;gap:14px;flex-wrap:wrap;min-width:0}
.dcSync__source{min-width:0;overflow-wrap:anywhere}
.dcSync__tables{display:flex;gap:10px;flex-wrap:wrap;min-width:0}
.dcSync__table{
  display:inline-flex;align-items:baseline;gap:4px;max-width:100%;
  padding:1px 0;font-size:11px;line-height:16px;color:var(--dc-ink-3);
}
.dcSync__table b{font-weight:600;color:var(--dc-ink-2);font-variant-numeric:tabular-nums}

/* ---- \u8868\u683C ----------------------------------------------------- */
.dcTableWrap{
  width:100%;max-width:100%;min-width:0;overflow-x:auto;overflow-y:auto;
  border:1px solid var(--dc-line);border-radius:12px;background:var(--dc-surface);
  max-height:min(66vh,760px);
}
.dcTable{width:100%;border-collapse:separate;border-spacing:0;min-width:640px}
.dcTable th,.dcTable td{
  text-align:left;padding:10px 14px;vertical-align:middle;
  border-bottom:1px solid var(--dc-line-2);
  overflow-wrap:anywhere;word-break:break-word;
}
.dcTable th{
  position:sticky;top:0;z-index:1;
  background:var(--dc-surface-2);color:var(--dc-ink-2);
  font-size:11px;line-height:16px;font-weight:600;letter-spacing:.04em;white-space:nowrap;
  border-bottom:1px solid var(--dc-line);
}
.dcTable td{font-size:12.5px;line-height:19px;color:var(--dc-ink)}
.dcTable tbody tr{transition:background .12s ease}
.dcTable tbody tr:hover td{background:var(--dc-surface-2)}
.dcTable tbody tr:last-child td{border-bottom:0}
.dcTable th.is-num,.dcTable td.is-num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.dcTable td:first-child{min-width:170px;color:var(--dc-ink)}
.dcTable__nowrap{white-space:nowrap;overflow-wrap:normal;word-break:normal}
.dcTable__clamp{
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;
  color:var(--dc-ink-2);
}
.dcTable__ellipsis{
  display:block;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
}
.dcCellMain{font-weight:500}
.dcCellRisk{color:var(--dc-clay);font-weight:500;font-variant-numeric:tabular-nums;white-space:nowrap}
.dcCellWarn{color:var(--dc-amber);font-variant-numeric:tabular-nums;white-space:nowrap}

/* \u72B6\u6001\u70B9 */
.dcStatusText{display:inline-flex;align-items:center;gap:6px;white-space:nowrap;font-size:12.5px;line-height:18px}
.dcStatusDot{width:6px;height:6px;border-radius:50%;background:currentColor;flex:0 0 auto;opacity:.92}
.dcStatusText--ok{color:var(--dc-moss)}
.dcStatusText--risk{color:var(--dc-clay)}
.dcStatusText--warn{color:var(--dc-amber)}
.dcStatusText--info{color:var(--dc-slate)}
.dcStatusText--muted{color:var(--dc-ink-3)}
.dcTag{
  display:inline-flex;align-items:center;height:20px;padding:0 7px;border-radius:5px;
  font-size:11px;line-height:20px;white-space:nowrap;
  background:var(--dc-surface-3);color:var(--dc-ink-2);
}
.dcTag--risk{background:var(--dc-clay-soft);color:var(--dc-clay)}
.dcTag--warn{background:var(--dc-amber-soft);color:var(--dc-amber)}
.dcTag--ok{background:var(--dc-moss-soft);color:var(--dc-moss)}

/* ---- \u660E\u7EC6\u9875 --------------------------------------------------- */
.dcSafetyPage{display:flex;flex-direction:column;gap:30px;min-width:0}
.dcSafetySection{min-width:0}
.dcPanel__title{margin:0 0 12px;font-size:15px;line-height:22px;font-weight:600;overflow-wrap:anywhere}
.dcDetailPage{display:flex;flex-direction:column;gap:16px;min-width:0}

.dcStatStrip{
  display:grid;grid-template-columns:repeat(auto-fit,minmax(132px,1fr));
  border:1px solid var(--dc-line);border-radius:12px;background:var(--dc-surface);overflow:hidden;
}
.dcStatChip{
  display:flex;flex-direction:column;gap:2px;min-width:0;
  padding:12px 16px 11px;border-left:1px solid var(--dc-line-2);
}
.dcStatChip:first-child{border-left:0}
.dcStatChip__label{font-size:11px;line-height:16px;color:var(--dc-ink-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dcStatChip__value{
  font-size:19px;line-height:26px;font-weight:600;letter-spacing:-.01em;
  font-variant-numeric:tabular-nums;white-space:nowrap;color:var(--dc-ink);
}
.dcStatChip--alert .dcStatChip__value{color:var(--dc-clay)}
.dcStatChip--warn .dcStatChip__value{color:var(--dc-amber)}

.dcInput{
  width:100%;height:34px;padding:0 12px 0 32px;border-radius:8px;
  border:1px solid var(--dc-line);background:var(--dc-surface);color:var(--dc-ink);
  transition:border-color .16s ease,box-shadow .16s ease;
}
.dcInput::placeholder{color:var(--dc-ink-3)}
.dcInput:hover{border-color:#dcd5c6}
.dcInput:focus-visible{outline:none;border-color:var(--dc-gold);box-shadow:0 0 0 3px rgba(168,118,43,.12)}
.dcPicker__toolbar .dcSearchWrap{max-width:360px}

.dcFilterBar{display:flex;flex-direction:column;gap:10px;min-width:0}
.dcFilterBar__top{display:flex;align-items:center;gap:8px;flex-wrap:wrap;min-width:0}
.dcSearchWrap{position:relative;flex:0 1 320px;min-width:190px;display:flex;align-items:center}
.dcSearchWrap>svg{position:absolute;left:10px;color:var(--dc-ink-3);pointer-events:none}
.dcFilterBar__search{
  width:100%;height:32px;padding:0 12px 0 31px;border-radius:8px;
  border:1px solid var(--dc-line);background:var(--dc-surface);color:var(--dc-ink);
  transition:border-color .16s ease,background .16s ease;
}
.dcFilterBar__search::placeholder{color:var(--dc-ink-3)}
.dcFilterBar__search:hover{border-color:#dcd5c6}
.dcFilterBar__search:focus-visible{outline:none;border-color:var(--dc-gold);box-shadow:0 0 0 3px rgba(168,118,43,.12)}
.dcFilterBar__reset{
  border:0;background:none;padding:5px 4px;font-size:12px;color:var(--dc-ink-2);
  border-bottom:1px solid transparent;transition:color .16s ease,border-color .16s ease;
}
.dcFilterBar__reset:hover{color:var(--dc-ink);border-bottom-color:var(--dc-line)}
.dcFilterBar__report{flex:0 0 auto;margin-left:auto}
.dcFilterBar__groups{display:flex;align-items:center;gap:20px;flex-wrap:wrap;min-width:0}
.dcFilterGroup{display:flex;align-items:center;gap:8px;min-width:0;flex-wrap:wrap}
.dcFilterGroup__label{font-size:11px;line-height:16px;color:var(--dc-ink-3);white-space:nowrap;letter-spacing:.02em}
.dcFilterGroup__chips{display:flex;gap:2px;flex-wrap:wrap;min-width:0}
.dcChip{
  border:1px solid transparent;background:transparent;border-radius:7px;
  padding:3px 9px;font-size:12px;line-height:18px;color:var(--dc-ink-2);white-space:nowrap;
  transition:background .14s ease,color .14s ease,border-color .14s ease;
}
.dcChip:hover{background:var(--dc-surface-2);color:var(--dc-ink)}
.dcChip[aria-pressed=true]{
  background:var(--dc-gold-soft);border-color:var(--dc-gold-line);
  color:var(--dc-gold-strong);font-weight:500;
}
.dcChip:focus-visible{outline:2px solid var(--dc-gold);outline-offset:1px}

/* \u660E\u7EC6\u9875\u56FE\u8868\uFF1A\u4E09\u5757\u5E76\u6392\uFF0C\u5171\u7528\u4E00\u5757\u9762\u677F */
.dcDetailCharts{
  display:grid;grid-template-columns:repeat(auto-fit,minmax(268px,1fr));
  border:1px solid var(--dc-line);border-radius:12px;background:var(--dc-surface);overflow:hidden;
}
.dcMiniChart{
  container-type:inline-size;container-name:dcMini;display:flex;flex-direction:column;
  padding:16px 20px 15px;border-left:1px solid var(--dc-line-2);min-width:0;
}
.dcMiniChart>.dcDonut,.dcMiniChart>.dcChartRows{margin-block:auto}
.dcMiniChart:first-child{border-left:0}
.dcMiniChart .dcChartTitle{margin-bottom:13px}
.dcDetailCharts .dcDonut{gap:16px}
.dcDetailCharts .dcDonut__svg{width:118px;height:118px}
.dcDetailCharts .dcDonut__value{font-size:21px}
.dcDetailCharts .dcChartRow{grid-template-columns:minmax(66px,110px) 1fr 34px;gap:10px}
.dcDetailCharts .dcChartRow__label{font-size:11.5px}

/* ---- \u9879\u76EE\u9009\u62E9 ------------------------------------------------- */
.dcPicker{max-width:1000px;margin:0 auto;padding:56px 28px 48px;min-width:0}
.dcPicker__grid{display:grid;grid-template-columns:minmax(240px,300px) minmax(0,1fr);gap:44px;align-items:start}
.dcPicker__intro{min-width:0;padding-top:2px}
.dcPicker__scope{list-style:none;margin:22px 0 0;padding:0;display:flex;flex-direction:column;gap:0}
.dcPicker__scope li{
  display:flex;align-items:baseline;gap:10px;padding:9px 0;
  border-top:1px solid var(--dc-line-2);font-size:12px;line-height:18px;color:var(--dc-ink-2);
}
.dcPicker__scope li b{
  flex:0 0 34px;font-size:11px;letter-spacing:.06em;color:var(--dc-gold-strong);font-weight:600;
}
.dcEyebrow{
  display:inline-flex;align-items:center;gap:8px;
  font-size:10.5px;line-height:16px;letter-spacing:.16em;color:var(--dc-gold-strong);font-weight:600;
}
.dcEyebrow::before{content:"";width:14px;height:1px;background:var(--dc-gold-line)}
.dcPicker__title{margin:12px 0 8px;font-size:26px;line-height:34px;font-weight:600;letter-spacing:-.01em;overflow-wrap:anywhere}
.dcPicker__hint{margin:0;font-size:13px;line-height:21px;color:var(--dc-ink-2);overflow-wrap:anywhere}
.dcPicker__panel{
  margin-top:0;border:1px solid var(--dc-line);border-radius:var(--dc-radius);
  background:var(--dc-surface);overflow:hidden;
}
.dcPicker__toolbar{
  display:flex;align-items:center;gap:12px;padding:13px 16px;
  border-bottom:1px solid var(--dc-line-2);background:var(--dc-surface-2);
}
.dcPicker__toolbar .dcSearchWrap{flex:1 1 auto;max-width:none}
.dcPicker__count{flex:0 0 auto;font-size:11.5px;color:var(--dc-ink-2);white-space:nowrap}
.dcPicker__list{list-style:none;margin:0;padding:0;max-height:42vh;overflow:auto}
.dcPicker__list li{border-bottom:1px solid var(--dc-line-2)}
.dcPicker__list li:last-child{border-bottom:0}
.dcPicker__item{
  display:grid;grid-template-columns:16px minmax(0,1fr) auto;gap:12px;align-items:center;
  padding:11px 16px;min-width:0;cursor:pointer;transition:background .13s ease;
}
.dcPicker__item:hover{background:var(--dc-surface-2)}
.dcPicker__list li[data-selected=true] .dcPicker__item{background:var(--dc-gold-soft)}
.dcPicker__list li[data-selected=true] .dcPicker__item:hover{background:#f4e8d1}
.dcPicker__item input{
  width:15px;height:15px;margin:0;accent-color:var(--dc-gold);cursor:pointer;
}
.dcPicker__name{min-width:0;font-size:13px;line-height:20px;overflow-wrap:anywhere}
.dcPicker__owner{
  margin-left:auto;font-size:11.5px;line-height:17px;color:var(--dc-ink-3);
  text-align:right;overflow-wrap:anywhere;
}
.dcPicker__actions{
  display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;
  padding:13px 16px;border-top:1px solid var(--dc-line-2);background:var(--dc-surface-2);
}
.dcPicker__actions .dcPicker__hint{font-size:11.5px;line-height:17px;color:var(--dc-ink-3)}
.dcPicker__actionsBtns{display:flex;align-items:center;gap:8px;margin-left:auto}
.dcPicker .dcEmpty{padding:32px 16px}

/* ---- \u5BB9\u5668\u67E5\u8BE2 ------------------------------------------------- */
@container datacenter-panel (max-width:1120px){
  .dcAppendix__grid{grid-template-columns:repeat(3,minmax(0,1fr));row-gap:16px}
  .dcMini{padding:0 14px}
  .dcMini:nth-child(3n+1){padding-left:0;border-left:0}
  .dcMini:nth-child(3n+2){border-left:1px solid var(--dc-line)}
}
@container datacenter-panel (max-width:980px){
  .dcWorkspace{padding:22px 22px 40px}
  .dcHeader{padding:8px 18px}
  .dcTabbar{padding:0 18px}
  .dcCard--wide,.dcCard--narrow{grid-column:span 6}
  .dcChartGrid{gap:14px}
  .dcVital__value{font-size:27px;line-height:34px}
}
@container datacenter-panel (max-width:820px){
  .dcHeader__subtitle{display:none}
  .dcProjectChip{max-width:210px}
  .dcTabsMeta{display:none}
  .dcInsight{flex-wrap:wrap;gap:8px 14px}
  .dcInsight__action{margin-left:auto}
  .dcDetailCharts{grid-template-columns:1fr}
  .dcMiniChart{border-left:0;border-top:1px solid var(--dc-line-2)}
  .dcMiniChart:first-child{border-top:0}
  .dcStatStrip{grid-template-columns:repeat(auto-fit,minmax(118px,1fr))}
  .dcStatChip{padding:11px 13px 10px}
  .dcFilterBar__search{flex:1 1 100%;max-width:none}
}
@container datacenter-panel (max-width:740px){
  .dcCard--wide,.dcCard--narrow{grid-column:span 12}
  .dcVitals{grid-template-columns:repeat(2,minmax(0,1fr))}
  .dcVital:nth-child(3){border-left:0}
  .dcVital:nth-child(n+3){border-top:1px solid var(--dc-line-2)}
}
@container datacenter-panel (max-width:640px){
  .dcWorkspace{padding:18px 14px 36px}
  .dcHeader{padding:8px 12px;gap:10px;flex-wrap:wrap}
  .dcHeader__subtitle{display:none}
  .dcHeader__actions{gap:4px}
  .dcProjectChip{max-width:160px}
  .dcBtn--ai span{display:none}
  .dcTabbar{padding:0 12px}
  .dcTabs{gap:20px}
  .dcPicker{padding:30px 16px 32px}
  .dcPicker__grid{grid-template-columns:1fr;gap:24px}
  .dcPicker__scope{display:none}
  .dcPicker__title{font-size:21px;line-height:29px}
  .dcPicker__owner{display:none}
  .dcPicker__actions{align-items:stretch}
  .dcPicker__actionsBtns{width:100%;margin-left:0}
  .dcPicker__actionsBtns .dcBtn{flex:1 1 auto}
  .dcVitals{grid-template-columns:1fr}
  .dcVital{border-left:0;border-top:1px solid var(--dc-line-2)}
  .dcVital:first-child{border-top:0}
  .dcAppendix__grid{grid-template-columns:repeat(2,minmax(0,1fr))}
  .dcMini:nth-child(3n+1){padding-left:14px;border-left:1px solid var(--dc-line)}
  .dcMini:nth-child(2n+1){padding-left:0;border-left:0}
  .dcRankRow{grid-template-columns:20px minmax(60px,1fr) minmax(40px,.8fr) 58px;gap:8px}
  .dcRankRow__rate{display:none}
  .dcChartRow{grid-template-columns:minmax(60px,100px) 1fr 32px;gap:8px}
  .dcCoverage__row{grid-template-columns:minmax(70px,100px) 1fr 40px;gap:8px}
  .dcSplit{flex-direction:column}
  .dcChat{flex:1 1 auto;max-width:none;min-width:0;border-left:0;border-top:1px solid var(--dc-line);min-height:240px}
}
@container datacenter-panel (max-width:460px){
  .dcHeader__title{font-size:13px}
  .dcFilterBar__groups{gap:10px}
  .dcFilterGroup{flex:1 1 100%}
  .dcStatStrip{grid-template-columns:repeat(2,minmax(0,1fr))}
}

@media (prefers-reduced-motion:reduce){
  .dcRoot *{animation:none!important;transition:none!important;scroll-behavior:auto!important}
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
