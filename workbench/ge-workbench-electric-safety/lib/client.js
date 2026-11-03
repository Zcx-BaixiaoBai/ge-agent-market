(() => {
  // src/panel.jsx
  function createPanel(React) {
    const h = React.createElement;
    const { useCallback, useEffect, useMemo, useRef, useState } = React;
    const API = "/api/electric-safety";
    const DEFAULT_BASE_URL = "https://energy.example.com";
    const numberFormatter = new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 1 });
    const integerFormatter = new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 0 });
    function cx(...values) {
      return values.filter(Boolean).join(" ");
    }
    function fmtNumber(value, digits = 1) {
      if (typeof value !== "number" || !Number.isFinite(value)) return "\u2014";
      return value.toLocaleString("zh-CN", { maximumFractionDigits: digits });
    }
    function fmtKwh(value) {
      if (typeof value !== "number" || !Number.isFinite(value)) return "\u2014";
      return `${numberFormatter.format(value)} kWh`;
    }
    function fmtSigned(value) {
      if (typeof value !== "number" || !Number.isFinite(value)) return "\u2014";
      return `${value > 0 ? "+" : ""}${numberFormatter.format(value)}`;
    }
    function fmtPercent(value) {
      if (typeof value !== "number" || !Number.isFinite(value)) return "\u2014";
      return `${Math.round(value * 100)}%`;
    }
    function fmtCount(value) {
      if (typeof value !== "number" || !Number.isFinite(value)) return "\u2014";
      return integerFormatter.format(value);
    }
    function fmtTime(value) {
      if (!value) return "\u2014";
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return "\u2014";
      return new Intl.DateTimeFormat("zh-CN", {
        timeZone: "Asia/Shanghai",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      }).format(date);
    }
    function fmtDateTime(value) {
      if (!value) return "\u2014";
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return "\u2014";
      return new Intl.DateTimeFormat("zh-CN", {
        timeZone: "Asia/Shanghai",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      }).format(date);
    }
    function shortDate(value) {
      const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ""));
      return match ? `${match[2]}-${match[3]}` : value || "\u2014";
    }
    function scoreTone(score) {
      if (typeof score !== "number" || !Number.isFinite(score)) return "";
      if (score >= 3) return "risk";
      if (score >= 1.5) return "warn";
      return "";
    }
    function StatusDot({ tone }) {
      return h("span", { className: cx("esaDot", tone ? `esaDot--${tone}` : ""), "aria-hidden": "true" });
    }
    function Icon({ name, size = 16, className }) {
      const common = {
        width: size,
        height: size,
        className,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 1.75,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        "aria-hidden": "true",
        focusable: "false"
      };
      switch (name) {
        case "bolt":
          return h("svg", common, h("path", { d: "M13 2 4.6 13.4h6.2L10 22l8.4-11.4h-6.2L13 2Z", fill: "currentColor", stroke: "none" }));
        case "shield":
          return h("svg", common, h("path", { d: "M12 3 5 6v5.2c0 4.3 2.9 7.5 7 9.8 4.1-2.3 7-5.5 7-9.8V6l-7-3Z" }), h("path", { d: "m9.2 12.1 1.9 1.9 3.8-4" }));
        case "refresh":
          return h("svg", common, h("path", { d: "M20 6v5h-5" }), h("path", { d: "M4 18v-5h5" }), h("path", { d: "M6.1 9.2A7 7 0 0 1 18.4 7.7L20 11" }), h("path", { d: "M17.9 14.8A7 7 0 0 1 5.6 16.3L4 13" }));
        case "sparkles":
          return h("svg", common, h("path", { d: "m12 3 1.3 4.1L17.5 8.5l-4.2 1.4L12 14l-1.3-4.1-4.2-1.4 4.2-1.4L12 3Z" }), h("path", { d: "m18.5 14 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" }));
        case "settings":
          return h("svg", common, h("path", { d: "M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z" }), h("path", { d: "M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" }));
        case "search":
          return h("svg", common, h("circle", { cx: 11, cy: 11, r: 6.5 }), h("path", { d: "m16 16 4 4" }));
        case "close":
          return h("svg", common, h("path", { d: "m6 6 12 12M18 6 6 18" }));
        case "arrow":
          return h("svg", common, h("path", { d: "M5 12h14M13 6l6 6-6 6" }));
        case "chevron":
          return h("svg", common, h("path", { d: "m6 9 6 6 6-6" }));
        case "chart":
          return h("svg", common, h("path", { d: "M4 19V5M4 19h16" }), h("path", { d: "m7 15 3.2-3.2 2.6 2.1L18 8" }), h("path", { d: "M18 8h-3.2M18 8v3.2" }));
        case "alert":
          return h("svg", common, h("path", { d: "M12 3 2.8 20h18.4L12 3Z" }), h("path", { d: "M12 9v4.5M12 17h.01" }));
        case "info":
          return h("svg", common, h("circle", { cx: 12, cy: 12, r: 9 }), h("path", { d: "M12 11v5M12 8h.01" }));
        case "clock":
          return h("svg", common, h("circle", { cx: 12, cy: 12, r: 9 }), h("path", { d: "M12 7v5l3 2" }));
        case "building":
          return h("svg", common, h("path", { d: "M4 21V4h10v17M14 9h6v12M7 8h4M7 12h4M7 16h4M17 13h.01M17 17h.01" }));
        case "users":
          return h("svg", common, h("circle", { cx: 9, cy: 8, r: 3.2 }), h("path", { d: "M3.5 20c.4-3.2 2.4-5 5.5-5s5.1 1.8 5.5 5" }), h("path", { d: "M16 5.5a3 3 0 0 1 0 5.8M17.5 15c2 .5 3.2 2.1 3.5 4.5" }));
        case "link":
          return h("svg", common, h("path", { d: "M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.2 1.2" }), h("path", { d: "M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.2-1.2" }));
        default:
          return h("svg", common, h("circle", { cx: 12, cy: 12, r: 8 }));
      }
    }
    function Badge({ tone, children }) {
      return h("span", { className: cx("esaBadge", tone ? `esaBadge--${tone}` : "") }, children);
    }
    function TenantBadges({ tenant }) {
      const badges = [];
      if (tenant.heuristicHit) badges.push(h(Badge, { key: "dual", tone: "dual" }, "\u53CC\u547D\u4E2D"));
      if (tenant.prevAbnormal) badges.push(h(Badge, { key: "prev", tone: "prev" }, "\u8FDE\u7EED\u504F\u79BB"));
      if (tenant.negative) badges.push(h(Badge, { key: "negative", tone: "negative" }, "\u8D1F\u5411\u504F\u79BB"));
      if (tenant.model && !tenant.heuristicHit && !tenant.prevAbnormal) {
        badges.push(h(Badge, { key: "model", tone: "model" }, "\u6A21\u578B\u504F\u79BB"));
      }
      return h("div", { className: "esaBadges" }, ...badges);
    }
    function chartSeries(curve) {
      const days = Array.isArray(curve?.days) ? curve.days.slice(-3) : [];
      if (!days.length) return null;
      const count = days.length * 24;
      const actual = new Array(count).fill(null);
      const predicted = new Array(count).fill(null);
      const q10 = new Array(count).fill(null);
      const q90 = new Array(count).fill(null);
      days.forEach((day, dayIndex) => {
        for (const point of Array.isArray(day.hours) ? day.hours : []) {
          const hour = Number(point?.h);
          if (hour < 0 || hour > 23) continue;
          actual[dayIndex * 24 + hour] = typeof point.actual === "number" ? point.actual : null;
        }
        for (const point of Array.isArray(day.pred) ? day.pred : []) {
          const hour = Number(point?.h);
          if (hour < 0 || hour > 23) continue;
          const index = dayIndex * 24 + hour;
          predicted[index] = typeof point.pred === "number" ? point.pred : null;
          q10[index] = typeof point.q10 === "number" ? point.q10 : null;
          q90[index] = typeof point.q90 === "number" ? point.q90 : null;
        }
      });
      const values = [...actual, ...predicted, ...q90].filter((value) => typeof value === "number" && Number.isFinite(value));
      const maxY = Math.max(1, ...values) * 1.08;
      return { days, count, actual, predicted, q10, q90, maxY };
    }
    function pathFromSeries(values, xScale, yScale) {
      let path = "";
      let open = false;
      values.forEach((value, index) => {
        if (typeof value !== "number" || !Number.isFinite(value)) {
          open = false;
          return;
        }
        const command = open ? "L" : "M";
        path += `${command}${xScale(index).toFixed(2)},${yScale(value).toFixed(2)} `;
        open = true;
      });
      return path.trim();
    }
    function Chart({ curve, mode = "compact", tenantName }) {
      const series = chartSeries(curve);
      if (!series) {
        return h("div", { className: "esaChartEmpty" }, "\u6682\u65E0\u66F2\u7EBF\u6570\u636E");
      }
      const detail = mode === "detail";
      const width = detail ? 860 : 600;
      const height = detail ? 300 : 150;
      const pad = detail ? { left: 48, right: 16, top: 14, bottom: 34 } : { left: 4, right: 4, top: 6, bottom: 4 };
      const plotWidth = width - pad.left - pad.right;
      const plotHeight = height - pad.top - pad.bottom;
      const xScale = (index) => pad.left + (series.count <= 1 ? 0 : index / (series.count - 1) * plotWidth);
      const yScale = (value) => pad.top + plotHeight - value / series.maxY * plotHeight;
      const actualPath = pathFromSeries(series.actual, xScale, yScale);
      const predictedPath = pathFromSeries(series.predicted, xScale, yScale);
      const bandPoints = [];
      for (let index = 0; index < series.count; index += 1) {
        if (typeof series.q10[index] === "number" && typeof series.q90[index] === "number") {
          bandPoints.push({ index, low: series.q10[index], high: series.q90[index] });
        }
      }
      let bandPath = "";
      if (bandPoints.length > 1) {
        bandPath = `M${bandPoints.map((point) => `${xScale(point.index).toFixed(2)},${yScale(point.high).toFixed(2)}`).join(" L")} L${[...bandPoints].reverse().map((point) => `${xScale(point.index).toFixed(2)},${yScale(point.low).toFixed(2)}`).join(" L")} Z`;
      }
      const nightRects = series.days.map((day, dayIndex) => {
        const start = xScale(dayIndex * 24);
        const end = xScale(dayIndex * 24 + 6);
        return h("rect", {
          key: `night-${day.date}`,
          x: start,
          y: pad.top,
          width: Math.max(0, end - start),
          height: plotHeight,
          fill: "var(--esa-chart-night)"
        });
      });
      const separators = series.days.slice(1).map((day, index) => {
        const x = xScale((index + 1) * 24);
        return h("line", {
          key: `sep-${day.date}`,
          x1: x,
          x2: x,
          y1: pad.top,
          y2: pad.top + plotHeight,
          stroke: "var(--esa-line)",
          strokeWidth: 1,
          vectorEffect: "non-scaling-stroke"
        });
      });
      const grid = [];
      if (detail) {
        for (let step = 0; step <= 4; step += 1) {
          const value = series.maxY / 4 * step;
          const y = yScale(value);
          grid.push(h("line", {
            key: `grid-${step}`,
            x1: pad.left,
            x2: width - pad.right,
            y1: y,
            y2: y,
            stroke: "var(--esa-line-2)",
            strokeWidth: 1,
            vectorEffect: "non-scaling-stroke"
          }));
          grid.push(h("text", {
            key: `grid-label-${step}`,
            x: pad.left - 8,
            y: y + 4,
            textAnchor: "end",
            fill: "var(--esa-ink-3)",
            fontSize: 10
          }, fmtNumber(value, 0)));
        }
        series.days.forEach((day, dayIndex) => {
          grid.push(h("text", {
            key: `day-label-${day.date}`,
            x: xScale(dayIndex * 24 + 12),
            y: height - 10,
            textAnchor: "middle",
            fill: "var(--esa-ink-3)",
            fontSize: 10
          }, shortDate(day.date)));
        });
      }
      return h(
        "svg",
        {
          className: cx("esaChart", detail && "esaChart--detail"),
          viewBox: `0 0 ${width} ${height}`,
          role: "img",
          "aria-label": `${tenantName || "\u79DF\u6237"} \u5B9E\u9645\u7528\u7535\u4E0E\u6A21\u578B\u9884\u6D4B\u66F2\u7EBF`
        },
        h("rect", { x: 0, y: 0, width, height, fill: "transparent" }),
        ...nightRects,
        ...separators,
        ...grid,
        bandPath ? h("path", { d: bandPath, fill: "var(--esa-chart-band)", stroke: "none" }) : null,
        predictedPath ? h("path", {
          d: predictedPath,
          fill: "none",
          stroke: "var(--esa-chart-pred)",
          strokeWidth: 1.6,
          strokeDasharray: "5 4",
          vectorEffect: "non-scaling-stroke",
          strokeLinejoin: "round",
          strokeLinecap: "round"
        }) : null,
        actualPath ? h("path", {
          d: actualPath,
          fill: "none",
          stroke: "var(--esa-chart-actual)",
          strokeWidth: 2,
          vectorEffect: "non-scaling-stroke",
          strokeLinejoin: "round",
          strokeLinecap: "round"
        }) : null
      );
    }
    function ChartLegend() {
      return h(
        "div",
        { className: "esaChartLegend" },
        h("span", { className: "esaLegendItem" }, h("span", { className: "esaLegendSwatch", style: { background: "var(--esa-chart-actual)" } }), "\u5B9E\u9645\u7528\u7535"),
        h("span", { className: "esaLegendItem" }, h("span", { className: "esaLegendSwatch", style: { background: "var(--esa-chart-pred)" } }), "\u6A21\u578B\u9884\u6D4B"),
        h("span", { className: "esaLegendItem" }, h("span", { className: "esaLegendSwatch esaLegendSwatch--band" }), "80% \u533A\u95F4"),
        h("span", { className: "esaLegendItem" }, h("span", { className: "esaLegendSwatch esaLegendSwatch--night" }), "00\u201306 \u6DF1\u591C\u7A97")
      );
    }
    function ChartArea({ meterId, curveState, onLoad, onRetry, tenantName, detail = false }) {
      const ref = useRef(null);
      useEffect(() => {
        const node = ref.current;
        if (!node || !meterId) return;
        let triggered = false;
        const trigger = () => {
          if (triggered) return;
          triggered = true;
          onLoad(meterId);
        };
        if (typeof IntersectionObserver === "undefined") {
          trigger();
          return;
        }
        const observer = new IntersectionObserver((entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            trigger();
            observer.disconnect();
          }
        }, { rootMargin: detail ? "0px" : "280px 0px" });
        observer.observe(node);
        return () => observer.disconnect();
      }, [detail, meterId, onLoad]);
      let body;
      if (curveState?.data) {
        body = h(Chart, { curve: curveState.data, mode: detail ? "detail" : "compact", tenantName });
      } else if (curveState?.error) {
        body = h(
          "div",
          { className: "esaChartError" },
          h("span", null, "\u66F2\u7EBF\u52A0\u8F7D\u5931\u8D25"),
          h("button", { type: "button", className: "esaTextBtn", onClick: () => onRetry(meterId) }, "\u91CD\u8BD5")
        );
      } else if (curveState?.loading || meterId) {
        body = h("div", { className: "esaChartSkeleton" });
      } else {
        body = h("div", { className: "esaChartEmpty" }, "\u8BE5\u5F02\u5E38\u6CA1\u6709\u53EF\u7528\u7684\u4EEA\u8868\u66F2\u7EBF");
      }
      if (detail) {
        return h(
          "div",
          { ref, className: "esaChartWrap--detail" },
          body,
          h(ChartLegend)
        );
      }
      return h(
        "div",
        { ref, className: "esaChartBox" },
        body,
        h(ChartLegend)
      );
    }
    function TenantCard({ tenant, curveState, onOpen, onAsk, onLoadCurve, onRetryCurve }) {
      const score = scoreTone(tenant.nightScore);
      return h(
        "article",
        { className: "esaCard" },
        h(
          "div",
          { className: "esaCardTop" },
          h(
            "div",
            { className: "esaCardNameWrap" },
            h("h3", { className: "esaCardName", title: tenant.name }, tenant.name),
            h(
              "p",
              { className: "esaCardMeta" },
              [tenant.project || "\u672A\u6807\u6CE8\u9879\u76EE", tenant.floor ? `${tenant.floor}` : null, `\u4EEA\u8868 ${tenant.meterId}`].filter(Boolean).join(" \xB7 ")
            )
          ),
          h(TenantBadges, { tenant })
        ),
        h(
          "div",
          { className: "esaMetrics" },
          h(
            "div",
            { className: "esaMetric" },
            h("div", { className: "esaMetricLabel" }, "\u591C\u5B9E\u9645"),
            h("div", { className: "esaMetricValue" }, fmtNumber(tenant.nightActual))
          ),
          h(
            "div",
            { className: "esaMetric" },
            h("div", { className: "esaMetricLabel" }, "\u591C\u9884\u6D4B"),
            h("div", { className: "esaMetricValue" }, fmtNumber(tenant.nightPred))
          ),
          h(
            "div",
            { className: "esaMetric" },
            h("div", { className: "esaMetricLabel" }, "\u504F\u5DEE kWh"),
            h("div", { className: cx("esaMetricValue", score === "risk" && "esaMetricValue--risk") }, fmtSigned(tenant.nightExcess))
          ),
          h(
            "div",
            { className: "esaMetric" },
            h("div", { className: "esaMetricLabel" }, "\u504F\u79BB\u5206"),
            h("div", { className: cx("esaMetricValue", score === "risk" && "esaMetricValue--risk", score === "warn" && "esaMetricValue--warn") }, fmtNumber(tenant.nightScore))
          )
        ),
        h(ChartArea, {
          meterId: tenant.meterId,
          curveState,
          onLoad: onLoadCurve,
          onRetry: onRetryCurve,
          tenantName: tenant.name
        }),
        h(
          "div",
          { className: "esaCardFoot" },
          h(
            "span",
            { className: "esaCardFootNote" },
            tenant.prevAbnormal ? "\u8FDE\u7EED\u504F\u79BB\uFF0C\u5EFA\u8BAE\u4F18\u5148\u6838\u67E5" : tenant.negative ? "\u8D1F\u5411\u504F\u79BB\uFF0C\u5173\u6CE8\u662F\u5426\u63D0\u524D\u95ED\u5E97" : "\u6A21\u578B\u504F\u79BB\uFF0C\u6309\u5206\u6570\u6392\u5E8F"
          ),
          h(
            "div",
            { className: "esaCardActions" },
            h("button", { type: "button", className: "esaTextBtn esaTextBtn--muted", onClick: () => onAsk(tenant) }, "\u95EE AI"),
            h("button", { type: "button", className: "esaTextBtn", onClick: () => onOpen(tenant) }, "\u8BE6\u60C5", h(Icon, { name: "arrow", size: 13 }))
          )
        )
      );
    }
    function CodeCard({ item, curveState, onOpen, onAsk, onLoadCurve, onRetryCurve }) {
      const isFault = item.category === "meter_fault";
      return h(
        "article",
        { className: "esaCard esaCodeCard" },
        h(
          "div",
          { className: "esaCardTop" },
          h(
            "div",
            { className: "esaCardNameWrap" },
            h("h3", { className: "esaCardName", title: item.name }, item.name),
            h(
              "p",
              { className: "esaCardMeta" },
              [item.project || "\u672A\u6807\u6CE8\u9879\u76EE", item.floor || null, `\u4EEA\u8868 ${item.meterId}`].filter(Boolean).join(" \xB7 ")
            )
          ),
          h(
            "div",
            { className: "esaBadges" },
            h(Badge, { tone: isFault ? "fault" : "code" }, item.categoryLabel),
            item.severity === "high" ? h(Badge, { tone: "dual" }, "\u9AD8\u98CE\u9669") : null
          )
        ),
        h("p", { className: "esaCodeDesc" }, item.description || "\u80FD\u6E90\u7CFB\u7EDF\u672A\u63D0\u4F9B\u63CF\u8FF0"),
        h(
          "div",
          { className: "esaCodeMetrics" },
          typeof item.metrics.nightRatio === "number" ? h("span", { className: "esaCodeMetric" }, "\u591C\u95F4\u5360\u6BD4 ", h("strong", null, fmtPercent(item.metrics.nightRatio))) : null,
          typeof item.metrics.nightDelta === "number" ? h("span", { className: "esaCodeMetric" }, "\u591C\u95F4\u7528\u91CF ", h("strong", null, `${fmtNumber(item.metrics.nightDelta)} kWh`)) : null,
          typeof item.metrics.totalDelta === "number" ? h("span", { className: "esaCodeMetric" }, "\u603B\u589E\u91CF ", h("strong", null, `${fmtNumber(item.metrics.totalDelta)} kWh`)) : null,
          typeof item.metrics.delta === "number" ? h("span", { className: "esaCodeMetric" }, "\u8BFB\u6570\u589E\u91CF ", h("strong", null, fmtNumber(item.metrics.delta))) : null,
          typeof item.metrics.readingsCount === "number" ? h("span", { className: "esaCodeMetric" }, "\u8BFB\u6570 ", h("strong", null, `${fmtNumber(item.metrics.readingsCount, 0)} \u6B21`)) : null
        ),
        h(ChartArea, {
          meterId: item.meterId,
          curveState,
          onLoad: onLoadCurve,
          onRetry: onRetryCurve,
          tenantName: item.name
        }),
        h(
          "div",
          { className: "esaCardFoot" },
          h("span", { className: "esaCardFootNote" }, item.room ? `\u623F\u95F4\uFF1A${item.room}` : "\u4EE3\u7801\u4FA7\u68C0\u6D4B"),
          h(
            "div",
            { className: "esaCardActions" },
            h("button", { type: "button", className: "esaTextBtn esaTextBtn--muted", onClick: () => onAsk(item) }, "\u95EE AI"),
            h("button", { type: "button", className: "esaTextBtn", onClick: () => onOpen(item) }, "\u8BE6\u60C5", h(Icon, { name: "arrow", size: 13 }))
          )
        )
      );
    }
    function ConnectForm({ initial, busy, error, onSubmit, compact = false }) {
      const [baseUrl, setBaseUrl] = useState(initial?.baseUrl || DEFAULT_BASE_URL);
      const [username, setUsername] = useState(initial?.username || "");
      const [password, setPassword] = useState("");
      const [localError, setLocalError] = useState("");
      const submit = (event) => {
        event.preventDefault();
        if (!username.trim()) {
          setLocalError("\u8BF7\u586B\u5199\u80FD\u6E90\u7CFB\u7EDF\u7528\u6237\u540D");
          return;
        }
        if (!password) {
          setLocalError("\u8BF7\u586B\u5199\u80FD\u6E90\u7CFB\u7EDF\u5BC6\u7801");
          return;
        }
        setLocalError("");
        onSubmit({ baseUrl: baseUrl.trim() || DEFAULT_BASE_URL, username: username.trim(), password });
      };
      return h(
        "form",
        { className: cx("esaForm", compact && "esaForm--compact"), onSubmit: submit },
        h(
          "label",
          { className: "esaField esaField--wide" },
          h("span", { className: "esaFieldLabel" }, "\u80FD\u6E90\u7CFB\u7EDF\u5730\u5740"),
          h("input", {
            className: "esaInput",
            type: "url",
            value: baseUrl,
            onChange: (event) => setBaseUrl(event.target.value),
            placeholder: DEFAULT_BASE_URL,
            spellCheck: false,
            autoCapitalize: "off"
          })
        ),
        h(
          "label",
          { className: "esaField" },
          h("span", { className: "esaFieldLabel" }, "\u7528\u6237\u540D"),
          h("input", {
            className: "esaInput",
            type: "text",
            value: username,
            onChange: (event) => setUsername(event.target.value),
            autoComplete: "username",
            spellCheck: false,
            autoCapitalize: "off"
          })
        ),
        h(
          "label",
          { className: "esaField" },
          h("span", { className: "esaFieldLabel" }, "\u5BC6\u7801"),
          h("input", {
            className: "esaInput",
            type: "password",
            value: password,
            onChange: (event) => setPassword(event.target.value),
            autoComplete: "current-password"
          })
        ),
        localError || error ? h("div", { className: "esaNotice esaNotice--risk esaField--wide", role: "alert" }, localError || error) : null,
        h(
          "div",
          { className: "esaFormActions" },
          h(
            "button",
            { type: "submit", className: "esaBtn esaBtn--primary", disabled: busy },
            busy ? h(Icon, { name: "refresh", size: 15 }) : h(Icon, { name: "link", size: 15 }),
            busy ? "\u6B63\u5728\u8FDE\u63A5\u5E76\u540C\u6B65\u2026" : compact ? "\u4FDD\u5B58\u5E76\u91CD\u65B0\u540C\u6B65" : "\u8FDE\u63A5\u5E76\u540C\u6B65"
          ),
          h(
            "span",
            { className: "esaFinePrint" },
            "\u8D26\u53F7\u4FDD\u5B58\u5728\u672C\u673A\u5DE5\u4F5C\u53F0\u6570\u636E\u76EE\u5F55\u7684 connection.env\uFF08\u4EC5\u672C\u4EBA\u53EF\u8BFB\uFF09\uFF1B\u4E0D\u5199\u5165\u5BF9\u8BDD\u8BB0\u5F55\uFF0C\u4E5F\u4E0D\u4F1A\u4E0A\u4F20\u3002"
          )
        )
      );
    }
    function ConnectPanel({ status, busy, error, onConnect }) {
      return h(
        "div",
        { className: "esaConnectWrap" },
        h(
          "div",
          { className: "esaConnectCard" },
          h("span", { className: "esaConnectEyebrow" }, h(Icon, { name: "shield", size: 13 }), "\u672C\u673A\u8FDE\u63A5"),
          h("h2", { className: "esaConnectTitle" }, "\u8FDE\u63A5\u80FD\u6E90\u7CFB\u7EDF\uFF0C\u5F00\u59CB\u6BCF\u65E5\u81EA\u68C0"),
          h(
            "p",
            { className: "esaConnectIntro" },
            "\u586B\u5199\u4E00\u6B21\u80FD\u6E90\u7BA1\u7406\u7CFB\u7EDF\u8D26\u53F7\uFF0C\u5DE5\u4F5C\u53F0\u4F1A\u6BCF\u5929\u8BFB\u53D6 AI \u81EA\u68C0\u62A5\u544A\u3001\u5F02\u5E38\u79DF\u6237\u548C\u7528\u7535\u66F2\u7EBF\u3002\u53EA\u8BFB\u6570\u636E\uFF0C\u4E0D\u4FEE\u6539\u7CFB\u7EDF\u91CC\u7684\u4EFB\u4F55\u914D\u7F6E\u3002"
          ),
          h(ConnectForm, {
            initial: { baseUrl: status?.baseUrl, username: status?.username },
            busy,
            error,
            onSubmit: onConnect
          }),
          h(
            "div",
            { className: "esaConnectAside" },
            h(Icon, { name: "info", size: 15 }),
            h("span", null, "\u7B2C\u4E00\u6B21\u8FDE\u63A5\u4F1A\u7ACB\u5373\u540C\u6B65\u6700\u65B0\u62A5\u544A\u3002\u5982\u679C\u4ECA\u5929\u8FD8\u6CA1\u6709 AI \u81EA\u68C0\u7ED3\u679C\uFF0C\u4F1A\u663E\u793A\u4E0A\u4E00\u4EFD\u53EF\u7528\u62A5\u544A\uFF0C\u5E76\u5728\u9876\u90E8\u6807\u660E\u65F6\u95F4\u3002")
          )
        )
      );
    }
    function AlreadyPanel({ status, busy, error, onSync }) {
      return h(
        "div",
        { className: "esaAlready" },
        h(
          "div",
          { className: "esaAlreadyCard" },
          h(
            "div",
            { className: "esaAlreadyText" },
            h("p", { className: "esaAlreadyTitle" }, "\u5DF2\u8FDE\u63A5\u80FD\u6E90\u7CFB\u7EDF\uFF0C\u7B49\u5F85\u7B2C\u4E00\u4EFD\u62A5\u544A"),
            h(
              "p",
              { className: "esaAlreadyHint" },
              error || "\u672C\u5730\u8FD8\u6CA1\u6709\u62A5\u544A\u7F13\u5B58\u3002\u53EF\u4EE5\u7ACB\u5373\u540C\u6B65\uFF0C\u6216\u7A0D\u540E\u6253\u5F00\u5DE5\u4F5C\u53F0\u81EA\u52A8\u540C\u6B65\u3002"
            )
          ),
          h(
            "button",
            { type: "button", className: "esaBtn esaBtn--primary", disabled: busy, onClick: () => onSync() },
            h(Icon, { name: "refresh", size: 15 }),
            busy ? "\u540C\u6B65\u4E2D\u2026" : "\u7ACB\u5373\u540C\u6B65"
          )
        )
      );
    }
    function Summary({ report, status, filter, onFilter }) {
      const summary = report.summary;
      const items = [
        {
          id: "all",
          label: "\u79DF\u6237\u603B\u6570",
          value: fmtCount(summary.tenantTotal),
          note: `${fmtCount(summary.projects)} \u4E2A\u9879\u76EE`,
          icon: "users",
          tone: ""
        },
        {
          id: "model",
          label: "\u6A21\u578B\u504F\u79BB",
          value: fmtCount(summary.modelTotal),
          note: "\u6309\u504F\u79BB\u5206\u6392\u5E8F",
          icon: "chart",
          tone: summary.modelTotal > 0 ? "warn" : "good"
        },
        {
          id: "dual",
          label: "\u53CC\u547D\u4E2D",
          value: fmtCount(summary.dual),
          note: "\u6A21\u578B\u4E0E\u89C4\u5219\u540C\u65E5\u547D\u4E2D",
          icon: "alert",
          tone: summary.dual > 0 ? "risk" : "good"
        },
        {
          id: "negative",
          label: "\u8D1F\u5411\u504F\u79BB",
          value: fmtCount(summary.negative),
          note: "\u9884\u6D4B\u8BE5\u5F00\u5374\u5168\u5173",
          icon: "clock",
          tone: summary.negative > 0 ? "warn" : ""
        },
        {
          id: "code",
          label: "\u4EE3\u7801\u4FA7\u5F02\u5E38",
          value: fmtCount(summary.codeAnomalies),
          note: summary.codeAnomalies > 0 ? "\u591C\u95F4\u672A\u95ED\u5E97 / \u901A\u8BAF / \u8DF3\u503C" : "\u672A\u53D1\u73B0",
          icon: "shield",
          tone: summary.codeAnomalies > 0 ? "risk" : "good"
        }
      ];
      return h(
        "div",
        { className: "esaSummary", role: "group", "aria-label": "\u4ECA\u65E5\u81EA\u68C0\u6C47\u603B" },
        ...items.map((item) => h(
          "button",
          {
            key: item.id,
            type: "button",
            className: cx("esaStat", item.tone && `esaStatTone--${item.tone}`),
            "aria-pressed": filter === item.id,
            onClick: () => onFilter(item.id)
          },
          h(
            "span",
            { className: "esaStatTop" },
            h("span", { className: "esaStatLabel" }, item.label),
            h("span", { className: "esaStatIcon" }, h(Icon, { name: item.icon, size: 15 }))
          ),
          h("span", { className: "esaStatValue" }, item.value),
          h("span", { className: "esaStatNote" }, item.note)
        ))
      );
    }
    function Insight({ report }) {
      const summary = report.summary;
      const first = report.tenants.find((tenant) => tenant.focus) || report.tenants[0];
      const risk = summary.codeAnomalies > 0 || summary.dual > 0;
      const watch = !risk && (summary.modelTotal > 0 || summary.negative > 0);
      const pieces = [];
      pieces.push(summary.codeAnomalies > 0 ? `\u4EE3\u7801\u4FA7\u53D1\u73B0 ${summary.codeAnomalies} \u4E2A\u5F02\u5E38` : "\u4EE3\u7801\u4FA7\u672A\u53D1\u73B0\u5F02\u5E38");
      pieces.push(`\u6A21\u578B\u504F\u79BB ${summary.modelTotal} \u53EA`);
      if (summary.dual > 0) pieces.push(`\u53CC\u547D\u4E2D ${summary.dual} \u53EA`);
      if (summary.negative > 0) pieces.push(`\u8D1F\u5411\u504F\u79BB ${summary.negative} \u53EA`);
      if (first) pieces.push(`\u4F18\u5148\u6838\u67E5\u300C${first.name}\u300D`);
      return h(
        "div",
        { className: cx("esaInsight", risk && "esaInsight--risk") },
        h("span", { className: "esaInsightMark" }, h(Icon, { name: risk ? "alert" : watch ? "chart" : "shield", size: 16 })),
        h(
          "div",
          { className: "esaInsightText" },
          h("p", { className: "esaInsightTitle" }, risk ? "\u4ECA\u5929\u6709\u9700\u8981\u4F18\u5148\u6838\u67E5\u7684\u5F02\u5E38" : watch ? "\u4ECA\u5929\u6709\u6A21\u578B\u504F\u79BB\uFF0C\u5EFA\u8BAE\u6309\u5206\u6570\u62BD\u67E5" : "\u4ECA\u5929\u6574\u4F53\u5E73\u7A33"),
          h("p", { className: "esaInsightBody" }, `${pieces.join("\uFF1B")}\u3002\u62A5\u544A\u65E5\u671F ${report.date}\uFF0C\u6570\u636E\u5468\u671F ${report.period.from} \u81F3 ${report.period.to}\u3002`)
        )
      );
    }
    function SyncBanner({ status, onSync, busy }) {
      if (!status?.error) return null;
      return h(
        "div",
        { className: "esaSyncError", role: "alert" },
        h("span", null, `\u540C\u6B65\u5931\u8D25\uFF1A${status.error}${status.lastSuccess ? `\u3002\u5F53\u524D\u5C55\u793A ${fmtDateTime(status.lastSuccess)} \u7684\u7F13\u5B58\u3002` : ""}`),
        h("button", { type: "button", className: "esaBtn esaBtn--sm", disabled: busy, onClick: () => onSync() }, "\u91CD\u8BD5")
      );
    }
    function Toolbar({ report, filter, onFilter, query, onQuery, onToggleAll, allShown, counts }) {
      const filters = [
        { id: "focus", label: "\u91CD\u70B9\u5173\u6CE8", count: counts.focus },
        { id: "dual", label: "\u53CC\u547D\u4E2D", count: counts.dual },
        { id: "model", label: "\u6A21\u578B\u504F\u79BB", count: counts.model },
        { id: "negative", label: "\u8D1F\u5411\u504F\u79BB", count: counts.negative },
        { id: "code", label: "\u4EE3\u7801\u4FA7\u5F02\u5E38", count: counts.code },
        { id: "all", label: "\u5168\u90E8\u5F02\u5E38", count: counts.all }
      ];
      return h(
        "div",
        { className: "esaToolbar" },
        h(
          "div",
          { className: "esaTabs", role: "tablist", "aria-label": "\u5F02\u5E38\u5206\u7C7B" },
          ...filters.map((item) => h("button", {
            key: item.id,
            type: "button",
            role: "tab",
            className: "esaTab",
            "aria-selected": filter === item.id,
            onClick: () => onFilter(item.id)
          }, item.label, h("span", { className: "esaTabCount" }, fmtCount(item.count))))
        ),
        h(
          "div",
          { className: "esaFilterTools" },
          filter === "model" && report.summary.modelTotal > 12 ? h(
            "button",
            { type: "button", className: "esaBtn esaBtn--sm", onClick: onToggleAll },
            allShown ? "\u53EA\u770B\u524D 12" : `\u5C55\u5F00\u5168\u90E8 ${fmtCount(report.summary.modelTotal)}`
          ) : null,
          h(
            "label",
            { className: "esaSearch" },
            h(Icon, { name: "search", size: 15 }),
            h("input", {
              type: "search",
              value: query,
              onChange: (event) => onQuery(event.target.value),
              placeholder: "\u641C\u7D22\u79DF\u6237\u3001\u9879\u76EE\u6216\u697C\u680B",
              "aria-label": "\u641C\u7D22\u79DF\u6237\u3001\u9879\u76EE\u6216\u697C\u680B"
            })
          )
        )
      );
    }
    function EmptyState({ title, hint, action }) {
      return h(
        "div",
        { className: "esaEmpty" },
        h("div", { className: "esaEmptyMark" }, h(Icon, { name: "search", size: 19 })),
        h("p", { className: "esaEmptyTitle" }, title),
        h("p", { className: "esaEmptyHint" }, hint),
        action ? h("div", { className: "esaEmptyActions" }, action) : null
      );
    }
    function Overlay({ children, onClose, label, modalClassName }) {
      return h(
        "div",
        {
          className: "esaOverlay",
          role: "presentation",
          onMouseDown: (event) => {
            if (event.target === event.currentTarget) onClose();
          }
        },
        h("div", {
          className: cx("esaModal", modalClassName),
          role: "dialog",
          "aria-modal": "true",
          "aria-label": label,
          onMouseDown: (event) => event.stopPropagation()
        }, children)
      );
    }
    function useEscape(onClose, active = true) {
      useEffect(() => {
        if (!active) return;
        const handle = (event) => {
          if (event.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handle);
        return () => window.removeEventListener("keydown", handle);
      }, [active, onClose]);
    }
    function DetailDialog({ selection, report, curveState, onClose, onAsk, onRetryCurve }) {
      useEscape(onClose);
      const closeRef = useRef(null);
      useEffect(() => {
        closeRef.current?.focus();
      }, []);
      const isCode = selection.kind === "code";
      const item = selection.item;
      const days = curveState?.data?.days ?? [];
      const note = "\u5361\u7247\u6307\u6807\u6765\u81EA AI \u81EA\u68C0\u6C47\u603B\uFF0C\u66F2\u7EBF\u6765\u81EA\u539F\u59CB\u9010\u65F6\u7528\u7535\uFF1B\u4E24\u8005\u53E3\u5F84\u53EF\u80FD\u4E0D\u540C\uFF0C\u8BF7\u7ED3\u5408\u73B0\u573A\u60C5\u51B5\u5224\u65AD\u3002";
      return h(
        "div",
        {
          className: "esaOverlay",
          onMouseDown: (event) => {
            if (event.target === event.currentTarget) onClose();
          }
        },
        h(
          "div",
          {
            className: "esaModal",
            role: "dialog",
            "aria-modal": "true",
            "aria-label": isCode ? "\u5F02\u5E38\u8BE6\u60C5" : "\u79DF\u6237\u7528\u7535\u8BE6\u60C5",
            onMouseDown: (event) => event.stopPropagation()
          },
          h(
            "div",
            { className: "esaModalHead" },
            h(
              "div",
              { className: "esaModalTitleWrap" },
              h("h2", { className: "esaModalTitle" }, item.name),
              h(
                "p",
                { className: "esaModalSub" },
                [item.project || "\u672A\u6807\u6CE8\u9879\u76EE", item.floor || null, `\u4EEA\u8868 ${item.meterId}`].filter(Boolean).join(" \xB7 ")
              )
            ),
            h("button", { ref: closeRef, type: "button", className: "esaBtn esaBtn--icon esaBtn--ghost", onClick: onClose, "aria-label": "\u5173\u95ED" }, h(Icon, { name: "close", size: 17 }))
          ),
          h(
            "div",
            { className: "esaModalBody" },
            isCode ? h(
              "div",
              null,
              h(
                "div",
                { className: "esaBadges", style: { marginBottom: "10px" } },
                h(Badge, { tone: item.category === "meter_fault" ? "fault" : "code" }, item.categoryLabel),
                h(Badge, { tone: "model" }, item.severity === "high" ? "\u9AD8\u98CE\u9669" : item.severity === "low" ? "\u4F4E\u98CE\u9669" : "\u4E2D\u98CE\u9669")
              ),
              h("p", { className: "esaCodeDesc" }, item.description || "\u80FD\u6E90\u7CFB\u7EDF\u672A\u63D0\u4F9B\u63CF\u8FF0"),
              h(
                "div",
                { className: "esaCodeMetrics" },
                typeof item.metrics.nightRatio === "number" ? h("span", { className: "esaCodeMetric" }, "\u591C\u95F4\u5360\u6BD4 ", h("strong", null, fmtPercent(item.metrics.nightRatio))) : null,
                typeof item.metrics.nightDelta === "number" ? h("span", { className: "esaCodeMetric" }, "\u591C\u95F4\u7528\u91CF ", h("strong", null, `${fmtNumber(item.metrics.nightDelta)} kWh`)) : null,
                typeof item.metrics.totalDelta === "number" ? h("span", { className: "esaCodeMetric" }, "\u603B\u589E\u91CF ", h("strong", null, `${fmtNumber(item.metrics.totalDelta)} kWh`)) : null,
                typeof item.metrics.delta === "number" ? h("span", { className: "esaCodeMetric" }, "\u8BFB\u6570\u589E\u91CF ", h("strong", null, fmtNumber(item.metrics.delta))) : null,
                typeof item.metrics.readingsCount === "number" ? h("span", { className: "esaCodeMetric" }, "\u8BFB\u6570 ", h("strong", null, `${fmtNumber(item.metrics.readingsCount, 0)} \u6B21`)) : null
              )
            ) : h(
              "div",
              null,
              h(
                "div",
                { className: "esaDetailStats" },
                h("div", { className: "esaDetailStat" }, h("div", { className: "esaDetailStatLabel" }, "\u591C\u5B9E\u9645"), h("div", { className: "esaDetailStatValue" }, fmtNumber(item.nightActual))),
                h("div", { className: "esaDetailStat" }, h("div", { className: "esaDetailStatLabel" }, "\u591C\u9884\u6D4B"), h("div", { className: "esaDetailStatValue" }, fmtNumber(item.nightPred))),
                h("div", { className: "esaDetailStat" }, h("div", { className: "esaDetailStatLabel" }, "\u504F\u5DEE kWh"), h("div", { className: "esaDetailStatValue" }, fmtSigned(item.nightExcess))),
                h("div", { className: "esaDetailStat" }, h("div", { className: "esaDetailStatLabel" }, "\u504F\u79BB\u5206"), h("div", { className: "esaDetailStatValue" }, fmtNumber(item.nightScore))),
                h("div", { className: "esaDetailStat" }, h("div", { className: "esaDetailStatLabel" }, "q10\u2013q90"), h("div", { className: "esaDetailStatValue" }, `${fmtNumber(item.q10)}\u2013${fmtNumber(item.q90)}`)),
                h("div", { className: "esaDetailStat" }, h("div", { className: "esaDetailStatLabel" }, "\u8FDE\u7EED\u504F\u79BB"), h("div", { className: "esaDetailStatValue" }, item.prevAbnormal ? "\u662F" : "\u5426"))
              ),
              h("div", { className: "esaBadges", style: { marginTop: "9px" } }, h(TenantBadges, { tenant: item }))
            ),
            h(
              "div",
              { className: "esaDetailSection" },
              h("h3", { className: "esaDetailSectionTitle" }, "72 \u5C0F\u65F6\u7528\u7535\u66F2\u7EBF"),
              h(ChartArea, {
                meterId: item.meterId,
                curveState,
                onLoad: () => {
                },
                onRetry: onRetryCurve,
                tenantName: item.name,
                detail: true
              }),
              h("p", { className: "esaFinePrint", style: { marginTop: "7px" } }, note)
            ),
            !isCode && days.length ? h(
              "div",
              { className: "esaDetailSection" },
              h("h3", { className: "esaDetailSectionTitle" }, "\u591C\u95F4\u7A97\u53E3\u6C47\u603B"),
              h(
                "div",
                { className: "esaTableWrap" },
                h(
                  "table",
                  { className: "esaTable" },
                  h(
                    "thead",
                    null,
                    h(
                      "tr",
                      null,
                      h("th", null, "\u65E5\u671F"),
                      h("th", null, "\u591C\u5B9E\u9645 kWh"),
                      h("th", null, "\u591C\u9884\u6D4B kWh"),
                      h("th", null, "\u504F\u5DEE kWh"),
                      h("th", null, "\u504F\u79BB\u5206")
                    )
                  ),
                  h(
                    "tbody",
                    null,
                    ...days.map((day) => h(
                      "tr",
                      { key: day.date },
                      h("td", null, day.date),
                      h("td", null, fmtNumber(day.night?.actual)),
                      h("td", null, fmtNumber(day.night?.pred)),
                      h("td", null, fmtSigned(day.night?.excess)),
                      h("td", null, fmtNumber(day.night?.score))
                    ))
                  )
                )
              )
            ) : null,
            h(
              "div",
              { className: "esaModalActions" },
              h("span", { className: "esaFinePrint" }, "\u9700\u8981\u66F4\u7EC6\u7684\u5224\u65AD\u65F6\uFF0C\u53EF\u4EE5\u8BA9 AI \u7ED3\u5408\u5F53\u524D\u62A5\u544A\u7EE7\u7EED\u5206\u6790\u3002"),
              h(
                "div",
                { className: "esaModalActionsRight" },
                h("button", { type: "button", className: "esaBtn esaBtn--ghost", onClick: onClose }, "\u5173\u95ED"),
                h(
                  "button",
                  { type: "button", className: "esaBtn esaBtn--primary", onClick: () => onAsk(isCode ? { kind: "code", item } : { kind: "tenant", item }) },
                  h(Icon, { name: "sparkles", size: 15 }),
                  "\u8BA9 AI \u5206\u6790"
                )
              )
            )
          )
        )
      );
    }
    function SettingsDialog({ status, report, busy, onClose, onSync, onDisconnect, onReconnect }) {
      useEscape(onClose);
      const [confirming, setConfirming] = useState(false);
      return h(
        Overlay,
        { onClose, label: "\u7528\u7535\u5B89\u5168\u52A9\u624B\u8BBE\u7F6E", modalClassName: "esaModal--settings" },
        h(
          "div",
          { className: "esaModalHead" },
          h(
            "div",
            { className: "esaModalTitleWrap" },
            h("h2", { className: "esaModalTitle" }, "\u8BBE\u7F6E"),
            h("p", { className: "esaModalSub" }, "\u8FDE\u63A5\u72B6\u6001\u3001\u540C\u6B65\u4E0E\u672C\u673A\u8D26\u53F7")
          ),
          h("button", { type: "button", className: "esaBtn esaBtn--icon esaBtn--ghost", onClick: onClose, "aria-label": "\u5173\u95ED" }, h(Icon, { name: "close", size: 17 }))
        ),
        h(
          "div",
          { className: "esaModalBody" },
          h(
            "div",
            { className: "esaSettingsGroup" },
            h(
              "div",
              { className: "esaSettingsRow" },
              h("span", { className: "esaSettingsKey" }, "\u72B6\u6001"),
              h("span", { className: "esaSettingsValue" }, status.configured ? "\u5DF2\u8FDE\u63A5\u80FD\u6E90\u7CFB\u7EDF" : "\u672A\u8FDE\u63A5")
            ),
            status.configured ? h(
              "div",
              { className: "esaSettingsRow" },
              h("span", { className: "esaSettingsKey" }, "\u8D26\u53F7"),
              h("span", { className: "esaSettingsValue" }, status.username || "\u2014", status.displayName ? ` \xB7 ${status.displayName}` : "")
            ) : null,
            h(
              "div",
              { className: "esaSettingsRow" },
              h("span", { className: "esaSettingsKey" }, "\u7CFB\u7EDF\u5730\u5740"),
              h("span", { className: "esaSettingsValue" }, status.baseUrl || DEFAULT_BASE_URL)
            ),
            h(
              "div",
              { className: "esaSettingsRow" },
              h("span", { className: "esaSettingsKey" }, "\u6700\u8FD1\u540C\u6B65"),
              h("span", { className: "esaSettingsValue" }, fmtDateTime(status.lastSuccess || status.lastSync))
            ),
            report ? h(
              "div",
              { className: "esaSettingsRow" },
              h("span", { className: "esaSettingsKey" }, "\u5F53\u524D\u62A5\u544A"),
              h("span", { className: "esaSettingsValue" }, `${report.date}\uFF08\u6570\u636E\u5468\u671F ${report.period.from} \u81F3 ${report.period.to}\uFF09`)
            ) : null,
            h(
              "p",
              { className: "esaSettingsNote" },
              "\u8D26\u53F7\u4FDD\u5B58\u5728\u672C\u673A\u7684 connection.env\uFF08\u6743\u9650 600\uFF09\uFF0C\u4E0D\u5199\u5165\u5BF9\u8BDD\u8BB0\u5F55\uFF0C\u4E5F\u4E0D\u4F1A\u4E0A\u4F20\u3002\u65AD\u5F00\u8FDE\u63A5\u53EA\u5220\u9664\u8D26\u53F7\uFF0C\u5DF2\u540C\u6B65\u7684\u62A5\u544A\u7F13\u5B58\u4ECD\u4FDD\u7559\u3002"
            )
          ),
          h(
            "div",
            { className: "esaSettingsGroup" },
            h(
              "div",
              { className: "esaSettingsActions" },
              h(
                "button",
                { type: "button", className: "esaBtn esaBtn--primary", disabled: busy || !status.configured, onClick: () => onSync() },
                h(Icon, { name: "refresh", size: 15 }),
                busy ? "\u540C\u6B65\u4E2D\u2026" : "\u7ACB\u5373\u540C\u6B65"
              ),
              h(
                "button",
                { type: "button", className: "esaBtn", onClick: onReconnect },
                h(Icon, { name: "settings", size: 15 }),
                status.configured ? "\u66F4\u6362\u8D26\u53F7" : "\u8FDE\u63A5\u80FD\u6E90\u7CFB\u7EDF"
              ),
              status.configured ? h("button", { type: "button", className: "esaBtn esaBtn--danger", onClick: () => setConfirming(true) }, "\u65AD\u5F00\u8FDE\u63A5") : null
            ),
            confirming ? h(
              "div",
              { className: "esaNotice esaNotice--risk", style: { marginTop: "10px" } },
              "\u786E\u5B9A\u65AD\u5F00\u8FDE\u63A5\u5417\uFF1F\u53EA\u4F1A\u5220\u9664\u672C\u673A\u4FDD\u5B58\u7684\u8D26\u53F7\uFF0C\u5DF2\u540C\u6B65\u7684\u62A5\u544A\u4ECD\u4F1A\u4FDD\u7559\u3002",
              h(
                "div",
                { className: "esaSettingsActions", style: { marginTop: "8px" } },
                h("button", { type: "button", className: "esaBtn esaBtn--danger esaBtn--sm", onClick: () => {
                  setConfirming(false);
                  onDisconnect();
                } }, "\u786E\u5B9A\u65AD\u5F00"),
                h("button", { type: "button", className: "esaBtn esaBtn--sm", onClick: () => setConfirming(false) }, "\u53D6\u6D88")
              )
            ) : null
          )
        )
      );
    }
    function ChatDrawer({ conversation, busy, onClose, onCreate }) {
      return h(
        "aside",
        { className: "esaChat", "aria-label": "AI \u534F\u52A9" },
        h(
          "div",
          { className: "esaChatHeader" },
          h(
            "div",
            null,
            h("h2", { className: "esaChatTitle" }, "AI \u534F\u52A9"),
            h("p", { className: "esaChatHint" }, "\u57FA\u4E8E\u5F53\u524D\u62A5\u544A\u7EE7\u7EED\u95EE\uFF0C\u4E0D\u4F1A\u81EA\u52A8\u53D1\u9001")
          ),
          h("button", { type: "button", className: "esaBtn esaBtn--icon esaBtn--ghost", onClick: onClose, "aria-label": "\u5173\u95ED AI \u534F\u52A9" }, h(Icon, { name: "close", size: 17 }))
        ),
        h(
          "div",
          { className: "esaChatBody" },
          busy ? h(
            "div",
            { className: "esaChatEmpty" },
            h(
              "div",
              null,
              h("p", null, "\u6B63\u5728\u51C6\u5907\u672C\u5DE5\u4F5C\u53F0\u4F1A\u8BDD\u2026"),
              h("div", { className: "esaChartSkeleton", style: { width: "180px", height: "6px" } })
            )
          ) : conversation || h(
            "div",
            { className: "esaChatEmpty" },
            h(
              "div",
              null,
              h("p", null, "\u8FD8\u6CA1\u6709\u53EF\u7528\u7684\u5DE5\u4F5C\u53F0\u4F1A\u8BDD\u3002"),
              h("button", { type: "button", className: "esaBtn esaBtn--primary", onClick: onCreate }, "\u521B\u5EFA\u4F1A\u8BDD\u5E76\u5199\u5165\u5206\u6790\u8BF7\u6C42")
            )
          )
        )
      );
    }
    function BusinessPanel({ service, entry, active, conversation, host }) {
      const [status, setStatus] = useState(null);
      const [report, setReport] = useState(null);
      const [loading, setLoading] = useState(true);
      const [busy, setBusy] = useState("");
      const [error, setError] = useState("");
      const [connectError, setConnectError] = useState("");
      const [notice, setNotice] = useState("");
      const [filter, setFilter] = useState("focus");
      const [query, setQuery] = useState("");
      const [showAllModel, setShowAllModel] = useState(false);
      const [visibleCount, setVisibleCount] = useState(24);
      const [curves, setCurves] = useState({});
      const [selection, setSelection] = useState(null);
      const [settingsOpen, setSettingsOpen] = useState(false);
      const [connectOpen, setConnectOpen] = useState(false);
      const [chatOpen, setChatOpen] = useState(false);
      const [aiBusy, setAiBusy] = useState(false);
      const autoSyncRef = useRef(false);
      const curveRequests = useRef(/* @__PURE__ */ new Set());
      const curvesRef = useRef({});
      const autoOpenedChatRef = useRef(false);
      useEscape(() => setConnectOpen(false), connectOpen);
      const request = useCallback(async (path, options) => {
        const response = await fetch(path, {
          credentials: "same-origin",
          cache: "no-store",
          ...options
        });
        let data = null;
        try {
          data = await response.json();
        } catch {
          data = null;
        }
        if (!response.ok) {
          const failure = new Error(data?.error || `HTTP ${response.status}`);
          failure.status = response.status;
          throw failure;
        }
        return data;
      }, []);
      const syncNow = useCallback(async ({ date, silent = false } = {}) => {
        setBusy("sync");
        setError("");
        try {
          const data = await request(`${API}/sync`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(date ? { date } : {})
          });
          if (data?.ok === false) {
            if (data.status) setStatus(data.status);
            setError(data.error || "\u540C\u6B65\u5931\u8D25");
            return null;
          }
          if (data?.status) setStatus(data.status);
          if (data?.report) {
            setReport(data.report);
            setFilter("focus");
            setQuery("");
            setVisibleCount(24);
            setShowAllModel(false);
            setCurves({});
            setSelection(null);
          }
          if (!silent) setNotice("\u5DF2\u540C\u6B65\u6700\u65B0\u62A5\u544A");
          return data?.report || null;
        } catch (syncError) {
          setError(syncError instanceof Error ? syncError.message : String(syncError));
          try {
            const latest = await request(`${API}/status`);
            setStatus(latest);
          } catch {
          }
          return null;
        } finally {
          setBusy("");
        }
      }, [request]);
      useEffect(() => {
        curvesRef.current = curves;
      }, [curves]);
      useEffect(() => {
        let alive = true;
        (async () => {
          setLoading(true);
          try {
            const snapshot = await request(`${API}/status`);
            if (!alive) return;
            setStatus(snapshot);
            let loadedReport = null;
            if (snapshot.configured) {
              try {
                const data = await request(`${API}/report${snapshot.reportDate ? `?date=${encodeURIComponent(snapshot.reportDate)}` : ""}`);
                if (alive && data?.report) {
                  loadedReport = data.report;
                  setReport(data.report);
                  if (data.status) setStatus(data.status);
                }
              } catch (reportError) {
                if (reportError?.status !== 404 && alive) setError(reportError.message);
              }
            }
            if (!alive) return;
            setLoading(false);
            if (snapshot.configured && (snapshot.stale || !loadedReport) && !autoSyncRef.current) {
              autoSyncRef.current = true;
              void syncNow({ silent: true });
            }
          } catch (loadError) {
            if (!alive) return;
            setError(loadError instanceof Error ? loadError.message : String(loadError));
            setLoading(false);
          }
        })();
        return () => {
          alive = false;
        };
      }, [request, syncNow]);
      useEffect(() => {
        if (autoOpenedChatRef.current) return;
        let owned = false;
        try {
          const current = service?.currentSession?.();
          owned = Boolean(current && service?.ownsSession?.(current));
        } catch {
          owned = false;
        }
        if (owned) {
          autoOpenedChatRef.current = true;
          setChatOpen(true);
        }
      }, [conversation, service, status, report]);
      const loadCurve = useCallback(async (meterId) => {
        if (!report || !meterId) return;
        const key = `${report.date}:${meterId}`;
        const existing = curvesRef.current[key];
        if (existing && (existing.loading || existing.data)) return;
        if (curveRequests.current.has(key)) return;
        curveRequests.current.add(key);
        setCurves((previous) => ({ ...previous, [key]: { loading: true } }));
        try {
          const data = await request(`${API}/curve?meter_id=${encodeURIComponent(meterId)}&date=${encodeURIComponent(report.date)}`);
          setCurves((previous) => ({ ...previous, [key]: { loading: false, data: data.curve } }));
        } catch (curveError) {
          setCurves((previous) => ({
            ...previous,
            [key]: { loading: false, error: curveError instanceof Error ? curveError.message : String(curveError) }
          }));
        } finally {
          curveRequests.current.delete(key);
        }
      }, [report, request]);
      const retryCurve = useCallback((meterId) => {
        if (!report || !meterId) return;
        const key = `${report.date}:${meterId}`;
        const next = { ...curvesRef.current };
        delete next[key];
        curvesRef.current = next;
        setCurves(next);
        curveRequests.current.delete(key);
        void loadCurve(meterId);
      }, [loadCurve, report]);
      const curveFor = useCallback((meterId) => {
        if (!report || !meterId) return null;
        return curves[`${report.date}:${meterId}`] || null;
      }, [curves, report]);
      const changeDate = useCallback(async (date) => {
        if (!date || date === report?.date) return;
        setBusy("load");
        setError("");
        try {
          const data = await request(`${API}/report?date=${encodeURIComponent(date)}`);
          if (data?.report) {
            setReport(data.report);
            if (data.status) setStatus(data.status);
            setFilter("focus");
            setQuery("");
            setVisibleCount(24);
            setShowAllModel(false);
            setCurves({});
            setSelection(null);
          }
        } catch (loadError) {
          if (loadError?.status === 404 && status?.configured) {
            const synced = await syncNow({ date, silent: true });
            if (!synced) setError(loadError instanceof Error ? loadError.message : String(loadError));
          } else {
            setError(loadError instanceof Error ? loadError.message : String(loadError));
          }
        } finally {
          setBusy("");
        }
      }, [report, request, status, syncNow]);
      const connect = useCallback(async (form) => {
        setBusy("connect");
        setConnectError("");
        try {
          const data = await request(`${API}/connect`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(form)
          });
          if (data?.status) setStatus(data.status);
          if (data?.report) {
            setReport(data.report);
            setFilter("focus");
            setQuery("");
            setVisibleCount(24);
            setShowAllModel(false);
            setCurves({});
            setSelection(null);
          }
          if (data?.ok === false) {
            setConnectError(data.error || "\u5DF2\u8FDE\u63A5\uFF0C\u4F46\u540C\u6B65\u5931\u8D25");
            return false;
          }
          setConnectOpen(false);
          setSettingsOpen(false);
          setNotice("\u5DF2\u8FDE\u63A5\u80FD\u6E90\u7CFB\u7EDF\u5E76\u540C\u6B65\u62A5\u544A");
          return true;
        } catch (connectFailure) {
          setConnectError(connectFailure instanceof Error ? connectFailure.message : String(connectFailure));
          return false;
        } finally {
          setBusy("");
        }
      }, [request]);
      const disconnect = useCallback(async () => {
        setBusy("disconnect");
        setError("");
        try {
          const data = await request(`${API}/disconnect`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
          if (data?.status) setStatus(data.status);
          setNotice("\u5DF2\u65AD\u5F00\u8FDE\u63A5\uFF1B\u672C\u673A\u62A5\u544A\u7F13\u5B58\u4ECD\u7136\u4FDD\u7559");
        } catch (disconnectError) {
          setError(disconnectError instanceof Error ? disconnectError.message : String(disconnectError));
        } finally {
          setBusy("");
        }
      }, [request]);
      const writeDraft = (sessionId, prompt) => {
        try {
          const conversationApi = host?.conversation;
          const sessions = host?.sessions;
          if (!conversationApi?.input?.requestDraftInitialization || typeof sessions?.binding !== "function") return "unavailable";
          const binding = sessions.binding(sessionId);
          if (!binding) return "unavailable";
          return conversationApi.input.requestDraftInitialization(binding, { prompt });
        } catch {
          return "unavailable";
        }
      };
      const openAi = useCallback(async (prompt) => {
        setAiBusy(true);
        setError("");
        try {
          let sessionId = null;
          const current = service?.currentSession?.();
          let owned = false;
          try {
            owned = Boolean(current && service?.ownsSession?.(current));
          } catch {
            owned = false;
          }
          if (owned) sessionId = current;
          if (!sessionId) {
            const workspace = service?.defaultWorkspace?.();
            const creation = workspace ? service.newSession(workspace.workspaceId) : service.newWorkspaceSession();
            service?.run?.(creation);
            sessionId = await creation;
          }
          if (!sessionId) throw new Error("\u6CA1\u6709\u521B\u5EFA\u53EF\u7528\u7684\u5DE5\u4F5C\u53F0\u4F1A\u8BDD");
          const applied = writeDraft(sessionId, prompt);
          if (applied === "applied") {
            setNotice("\u5DF2\u628A\u5206\u6790\u8BF7\u6C42\u5199\u5165\u5BF9\u8BDD\u8349\u7A3F\uFF0C\u786E\u8BA4\u540E\u53D1\u9001");
          } else if (applied === "preserved") {
            await navigator?.clipboard?.writeText?.(prompt).catch(() => {
            });
            setNotice("\u5BF9\u8BDD\u91CC\u5DF2\u6709\u8349\u7A3F\uFF0C\u5206\u6790\u8BF7\u6C42\u5DF2\u590D\u5236\u5230\u526A\u8D34\u677F");
          } else {
            await navigator?.clipboard?.writeText?.(prompt).catch(() => {
            });
            setNotice("\u5DF2\u590D\u5236\u5206\u6790\u8BF7\u6C42\uFF0C\u7C98\u8D34\u5230\u5BF9\u8BDD\u91CC\u53D1\u9001");
          }
          setChatOpen(true);
        } catch (aiError) {
          setError(aiError instanceof Error ? aiError.message : String(aiError));
        } finally {
          setAiBusy(false);
        }
      }, [host, service]);
      const buildTenantPrompt = (tenant) => {
        if (!report) return "";
        const lines = [
          `\u8BF7\u5206\u6790\u8FD9\u4E2A\u7528\u7535\u5F02\u5E38\u79DF\u6237\uFF1A${tenant.name}\uFF08${tenant.project || "\u672A\u6807\u6CE8\u9879\u76EE"}${tenant.floor ? `\uFF0C${tenant.floor}` : ""}\uFF0C\u4EEA\u8868 ${tenant.meterId}\uFF09\u3002`,
          `\u62A5\u544A\u65E5\u671F ${report.date}\uFF0C\u6570\u636E\u5468\u671F ${report.period.from} \u81F3 ${report.period.to}\u3002`,
          `\u591C\u5B9E\u9645 ${fmtNumber(tenant.nightActual)} kWh\uFF0C\u591C\u9884\u6D4B ${fmtNumber(tenant.nightPred)} kWh\uFF0C\u504F\u5DEE ${fmtSigned(tenant.nightExcess)} kWh\uFF0C\u504F\u79BB\u5206 ${fmtNumber(tenant.nightScore)}\u3002`,
          tenant.heuristicHit ? "\u8BE5\u79DF\u6237\u540C\u65E5\u89C4\u5219\u547D\u4E2D\u3002" : "",
          tenant.prevAbnormal ? "\u8BE5\u79DF\u6237\u8FDE\u7EED\u51FA\u73B0\u504F\u79BB\u3002" : "",
          tenant.negative ? "\u8BE5\u79DF\u6237\u5C5E\u4E8E\u8D1F\u5411\u504F\u79BB\uFF08\u9884\u6D4B\u8BE5\u5F00\u5374\u5168\u5173\uFF09\u3002" : "",
          "",
          "\u8BF7\u5224\u65AD\u66F4\u53EF\u80FD\u662F\u8BA1\u91CF/\u901A\u8BAF\u95EE\u9898\u3001\u8BBE\u5907\u672A\u505C\u673A\u3001\u63D0\u524D\u95ED\u5E97\uFF0C\u8FD8\u662F\u771F\u5B9E\u7528\u7535\u5F02\u5E38\uFF1B\u7ED9\u51FA\u4ECA\u5929\u53EF\u6267\u884C\u7684\u6838\u67E5\u6B65\u9AA4\u3002\u4E0D\u8981\u7F16\u9020\u62A5\u544A\u91CC\u6CA1\u6709\u7684\u6570\u636E\u3002"
        ];
        return lines.filter((line) => line !== "").join("\n");
      };
      const buildCodePrompt = (item) => {
        if (!report) return "";
        return [
          `\u8BF7\u5206\u6790\u8FD9\u6761\u80FD\u6E90\u7CFB\u7EDF\u4EE3\u7801\u4FA7\u5F02\u5E38\uFF1A${item.name}\uFF08${item.project || "\u672A\u6807\u6CE8\u9879\u76EE"}${item.floor ? `\uFF0C${item.floor}` : ""}\uFF0C\u4EEA\u8868 ${item.meterId}\uFF09\u3002`,
          `\u7C7B\u578B\uFF1A${item.categoryLabel}\uFF1B\u4E25\u91CD\u7A0B\u5EA6\uFF1A${item.severity || "medium"}\u3002`,
          `\u63CF\u8FF0\uFF1A${item.description || "\u65E0"}\u3002`,
          `\u62A5\u544A\u65E5\u671F ${report.date}\u3002`,
          "",
          "\u8BF7\u5224\u65AD\u8FD9\u6761\u5F02\u5E38\u66F4\u50CF\u8BA1\u91CF/\u901A\u8BAF\u6545\u969C\u3001\u8BBE\u5907\u672A\u505C\u673A\u3001\u591C\u95F4\u672A\u95ED\u5E97\u8FD8\u662F\u6570\u636E\u8DF3\u503C\uFF0C\u5E76\u7ED9\u51FA\u6838\u67E5\u987A\u5E8F\u3002\u4E0D\u8981\u7F16\u9020\u62A5\u544A\u91CC\u6CA1\u6709\u7684\u6570\u636E\u3002"
        ].join("\n");
      };
      const buildReportPrompt = () => {
        if (!report) return "";
        const lines = [
          `\u8BF7\u5206\u6790\u80FD\u6E90\u7BA1\u7406\u7CFB\u7EDF ${report.date} \u7684 AI \u81EA\u68C0\u62A5\u544A\uFF08\u6570\u636E\u5468\u671F ${report.period.from} \u81F3 ${report.period.to}\uFF09\u3002`,
          `\u6C47\u603B\uFF1A\u79DF\u6237 ${fmtCount(report.summary.tenantTotal)} \u53EA\uFF1B\u6A21\u578B\u504F\u79BB ${fmtCount(report.summary.modelTotal)} \u53EA\uFF1B\u53CC\u547D\u4E2D ${fmtCount(report.summary.dual)} \u53EA\uFF1B\u8D1F\u5411\u504F\u79BB ${fmtCount(report.summary.negative)} \u53EA\uFF1B\u4EE3\u7801\u4FA7\u5F02\u5E38 ${fmtCount(report.summary.codeAnomalies)} \u4E2A\u3002`,
          "",
          "\u91CD\u70B9\u5173\u6CE8\u79DF\u6237\uFF08\u6309\u504F\u79BB\u5206\u6392\u5E8F\uFF0C\u6700\u591A 12 \u6761\uFF09\uFF1A"
        ];
        const focus = report.tenants.filter((tenant) => tenant.focus).slice(0, 12);
        focus.forEach((tenant, index) => {
          const marks = [
            tenant.heuristicHit ? "\u89C4\u5219\u547D\u4E2D" : "",
            tenant.prevAbnormal ? "\u8FDE\u7EED\u504F\u79BB" : "",
            tenant.negative ? "\u8D1F\u5411\u504F\u79BB" : ""
          ].filter(Boolean).join("\u3001");
          lines.push(`${index + 1}. ${tenant.name}\uFF08${tenant.project || "\u672A\u6807\u6CE8\u9879\u76EE"}\uFF09\uFF1A\u591C\u5B9E\u9645 ${fmtNumber(tenant.nightActual)} kWh\uFF0C\u591C\u9884\u6D4B ${fmtNumber(tenant.nightPred)} kWh\uFF0C\u504F\u5DEE ${fmtSigned(tenant.nightExcess)} kWh\uFF0C\u504F\u79BB\u5206 ${fmtNumber(tenant.nightScore)}${marks ? `\uFF0C${marks}` : ""}`);
        });
        if (report.code.length) {
          lines.push("");
          lines.push(`\u4EE3\u7801\u4FA7\u5F02\u5E38 ${report.code.length} \u4E2A\uFF0C\u4F8B\u5982\uFF1A`);
          report.code.slice(0, 8).forEach((item, index) => {
            lines.push(`${index + 1}. ${item.name}\uFF08${item.project || "\u672A\u6807\u6CE8\u9879\u76EE"}\uFF09\uFF1A${item.categoryLabel}\uFF1B${item.description || "\u65E0\u63CF\u8FF0"}`);
          });
        }
        lines.push("");
        lines.push("\u8BF7\u6309\u6838\u67E5\u4F18\u5148\u7EA7\u7ED9\u51FA\u5EFA\u8BAE\uFF1A\u5148\u5224\u65AD\u54EA\u4E9B\u662F\u8BA1\u91CF/\u901A\u8BAF\u95EE\u9898\uFF0C\u54EA\u4E9B\u662F\u771F\u5B9E\u7684\u591C\u95F4\u672A\u95ED\u5E97\u6216\u8BBE\u5907\u672A\u505C\u673A\uFF1B\u518D\u7ED9\u51FA\u4ECA\u5929\u6700\u503C\u5F97\u73B0\u573A\u6838\u67E5\u7684 5 \u4E2A\u79DF\u6237\u548C\u6838\u67E5\u8981\u70B9\u3002\u4E0D\u8981\u7F16\u9020\u62A5\u544A\u91CC\u6CA1\u6709\u7684\u6570\u636E\u3002");
        return lines.join("\n");
      };
      const suggestFor = (target) => {
        if (!target) return openAi(buildReportPrompt());
        if (target.kind === "code") return openAi(buildCodePrompt(target.item));
        return openAi(buildTenantPrompt(target.item));
      };
      const counts = useMemo(() => {
        const tenants = report?.tenants ?? [];
        return {
          all: tenants.length,
          focus: tenants.filter((tenant) => tenant.focus).length,
          dual: tenants.filter((tenant) => tenant.heuristicHit || tenant.prevAbnormal).length,
          model: tenants.filter((tenant) => tenant.model).length,
          negative: tenants.filter((tenant) => tenant.negative).length,
          code: report?.code?.length ?? 0
        };
      }, [report]);
      const matchesQuery = useCallback((item) => {
        if (!query.trim()) return true;
        const needle = query.trim().toLowerCase();
        return [
          item.name,
          item.project,
          item.building,
          item.floor,
          item.room,
          item.categoryLabel,
          item.description,
          item.meterId ? `\u4EEA\u8868 ${item.meterId}` : ""
        ].some((value) => String(value || "").toLowerCase().includes(needle));
      }, [query]);
      const visible = useMemo(() => {
        if (!report) return { tenants: [], code: [] };
        const tenants = report.tenants;
        let list2 = [];
        if (filter === "code") {
          const code = report.code.filter(matchesQuery);
          return { tenants: [], code: code.slice(0, visibleCount) };
        }
        if (filter === "focus") list2 = tenants.filter((tenant) => tenant.focus);
        else if (filter === "dual") list2 = tenants.filter((tenant) => tenant.heuristicHit || tenant.prevAbnormal);
        else if (filter === "negative") list2 = tenants.filter((tenant) => tenant.negative);
        else if (filter === "model") list2 = tenants.filter((tenant) => tenant.model);
        else list2 = tenants;
        list2 = list2.filter(matchesQuery);
        if (filter === "model" && !showAllModel) list2 = list2.slice(0, 12);
        else list2 = list2.slice(0, visibleCount);
        return { tenants: list2, code: [] };
      }, [filter, matchesQuery, report, showAllModel, visibleCount]);
      useEffect(() => {
        setVisibleCount(24);
      }, [filter, query, report?.date]);
      const openDetail = useCallback((item) => {
        const target = item?.kind === "code" ? item : item?.category && item?.metrics ? { kind: "code", item } : { kind: "tenant", item };
        setSelection(target);
        if (target.item?.meterId) void loadCurve(target.item.meterId);
      }, [loadCurve]);
      const openTenant = useCallback((tenant) => {
        setSelection({ kind: "tenant", item: tenant });
        if (tenant.meterId) void loadCurve(tenant.meterId);
      }, [loadCurve]);
      const openCode = useCallback((item) => {
        setSelection({ kind: "code", item });
        if (item.meterId) void loadCurve(item.meterId);
      }, [loadCurve]);
      const askTenant = useCallback((tenant) => {
        const prompt = buildTenantPrompt(tenant);
        void openAi(prompt);
      }, [openAi, report]);
      const askCode = useCallback((item) => {
        const prompt = buildCodePrompt(item);
        void openAi(prompt);
      }, [openAi, report]);
      const askReport = useCallback(() => {
        if (!report) return;
        void openAi(buildReportPrompt());
      }, [openAi, report]);
      const handleFilter = useCallback((next) => {
        setFilter(next);
        setVisibleCount(24);
        setQuery("");
      }, []);
      const hasCachedReport = Boolean(report);
      const configured = Boolean(status?.configured);
      const syncBusy = busy === "sync";
      const dateOptions = report?.availableDates?.length ? report.availableDates : status?.availableDates || [];
      if (loading) {
        return h(
          "div",
          { className: "esaRoot" },
          h(
            "div",
            { className: "esaHeader", "data-dsh-workbench-toolbar": "" },
            h(
              "div",
              { className: "esaBrand" },
              h("div", { className: "esaBrandMark" }, h(Icon, { name: "bolt", size: 17 })),
              h(
                "div",
                { className: "esaBrandText" },
                h("h1", { className: "esaTitle" }, "\u7528\u7535\u5B89\u5168\u52A9\u624B"),
                h("p", { className: "esaSubtitle" }, "\u6BCF\u65E5 AI \u81EA\u68C0 \xB7 \u5F02\u5E38\u79DF\u6237\u7528\u7535\u66F2\u7EBF")
              )
            ),
            h(
              "div",
              { className: "esaHeaderActions" },
              h("span", { className: "esaSyncPill" }, h(StatusDot, { tone: "busy" }), h("span", null, "\u6B63\u5728\u8BFB\u53D6\u2026"))
            )
          ),
          h(
            "div",
            { className: "esaBody" },
            h(
              "div",
              { className: "esaScroll" },
              h(
                "div",
                { className: "esaInner" },
                h(
                  "div",
                  { className: "esaSha" },
                  h(
                    "div",
                    { className: "esaShaRow" },
                    ...Array.from({ length: 5 }, (_, index) => h("div", { key: index, className: "esaShaBlock", style: { height: "82px" } }))
                  ),
                  h("div", { className: "esaShaBlock", style: { height: "44px" } }),
                  h("div", { className: "esaShaBlock", style: { height: "310px" } }),
                  h("div", { className: "esaShaBlock", style: { height: "310px" } })
                )
              )
            )
          )
        );
      }
      const header = h(
        "header",
        { className: "esaHeader", "data-dsh-workbench-toolbar": "" },
        h(
          "div",
          { className: "esaBrand" },
          h("div", { className: "esaBrandMark" }, h(Icon, { name: "bolt", size: 17 })),
          h(
            "div",
            { className: "esaBrandText" },
            h("h1", { className: "esaTitle" }, "\u7528\u7535\u5B89\u5168\u52A9\u624B"),
            h("p", { className: "esaSubtitle" }, "\u6BCF\u65E5 AI \u81EA\u68C0 \xB7 \u5F02\u5E38\u79DF\u6237\u7528\u7535\u66F2\u7EBF")
          )
        ),
        h(
          "div",
          { className: "esaHeaderActions", "data-dsh-no-drag": "" },
          dateOptions.length && report ? h(
            "label",
            { className: "esaDateField" },
            h("span", { className: "esaDateLabel" }, "\u62A5\u544A\u65E5\u671F"),
            h("select", {
              className: "esaSelect",
              value: report.date,
              onChange: (event) => void changeDate(event.target.value),
              "aria-label": "\u9009\u62E9\u62A5\u544A\u65E5\u671F"
            }, ...dateOptions.map((date) => h("option", { key: date, value: date }, date)))
          ) : null,
          h(
            "button",
            {
              type: "button",
              className: "esaSyncPill",
              onClick: () => void syncNow(),
              disabled: syncBusy || !configured,
              title: status?.error || (status?.lastSuccess ? `\u4E0A\u6B21\u540C\u6B65 ${fmtDateTime(status.lastSuccess)}` : "\u5C1A\u672A\u540C\u6B65")
            },
            h(StatusDot, { tone: status?.syncing || syncBusy ? "busy" : status?.error ? "risk" : status?.stale ? "warn" : "ok" }),
            h("span", { className: "esaSyncText" }, status?.syncing || syncBusy ? "\u540C\u6B65\u4E2D\u2026" : status?.error ? "\u540C\u6B65\u5931\u8D25" : status?.stale ? "\u5F85\u540C\u6B65" : status?.lastSuccess ? `\u5DF2\u540C\u6B65 ${fmtTime(status.lastSuccess)}` : "\u5F85\u540C\u6B65")
          ),
          h(
            "button",
            {
              type: "button",
              className: "esaBtn esaBtn--ghost esaBtn--sync",
              onClick: () => void syncNow(),
              disabled: syncBusy || !configured,
              "aria-label": "\u7ACB\u5373\u540C\u6B65",
              title: "\u7ACB\u5373\u540C\u6B65"
            },
            h(Icon, { name: "refresh", size: 15, className: syncBusy ? "esaSpin" : "" }),
            h("span", { className: "esaBtnLabel" }, syncBusy ? "\u540C\u6B65\u4E2D" : "\u7ACB\u5373\u540C\u6B65")
          ),
          h(
            "button",
            {
              type: "button",
              className: "esaBtn esaBtn--primary esaBtn--ai",
              onClick: askReport,
              disabled: aiBusy || !report,
              title: report ? "\u628A\u5F53\u524D\u62A5\u544A\u6458\u8981\u5199\u5165\u5BF9\u8BDD\u8349\u7A3F" : "\u540C\u6B65\u62A5\u544A\u540E\u53EF\u95EE AI"
            },
            h(Icon, { name: "sparkles", size: 15 }),
            h("span", { className: "esaBtnLabel" }, aiBusy ? "\u51C6\u5907\u4E2D\u2026" : "\u95EE AI")
          ),
          h("button", {
            type: "button",
            className: "esaBtn esaBtn--icon esaBtn--ghost",
            onClick: () => setSettingsOpen(true),
            "aria-label": "\u6253\u5F00\u8BBE\u7F6E",
            title: "\u8BBE\u7F6E"
          }, h(Icon, { name: "settings", size: 16 }))
        )
      );
      if (!configured && !hasCachedReport) {
        return h(
          "div",
          { className: "esaRoot" },
          header,
          h(
            "div",
            { className: "esaBody" },
            h(
              "div",
              { className: "esaScroll" },
              h(
                "div",
                { className: "esaInner" },
                h(SyncBanner, { status, onSync: () => void syncNow(), busy: syncBusy }),
                h(ConnectPanel, { status, busy: busy === "connect", error: connectError, onConnect: connect })
              )
            )
          ),
          connectOpen ? h(
            Overlay,
            { onClose: () => setConnectOpen(false), label: "\u8FDE\u63A5\u80FD\u6E90\u7CFB\u7EDF", modalClassName: "esaModal--settings" },
            h(
              "div",
              { className: "esaModalHead" },
              h(
                "div",
                { className: "esaModalTitleWrap" },
                h("h2", { className: "esaModalTitle" }, "\u8FDE\u63A5\u80FD\u6E90\u7CFB\u7EDF"),
                h("p", { className: "esaModalSub" }, "\u8D26\u53F7\u53EA\u4FDD\u5B58\u5728\u672C\u673A\uFF0C\u4E0D\u5199\u5165\u5BF9\u8BDD\u8BB0\u5F55")
              ),
              h("button", { type: "button", className: "esaBtn esaBtn--icon esaBtn--ghost", onClick: () => setConnectOpen(false), "aria-label": "\u5173\u95ED" }, h(Icon, { name: "close", size: 17 }))
            ),
            h(
              "div",
              { className: "esaModalBody" },
              h(ConnectForm, { initial: { baseUrl: status?.baseUrl, username: status?.username }, compact: true, busy: busy === "connect", error: connectError, onSubmit: connect })
            )
          ) : null
        );
      }
      if (!hasCachedReport) {
        return h(
          "div",
          { className: "esaRoot" },
          header,
          h(
            "div",
            { className: "esaBody" },
            h(
              "div",
              { className: "esaScroll" },
              h(
                "div",
                { className: "esaInner" },
                h(SyncBanner, { status, onSync: () => void syncNow(), busy: syncBusy }),
                h(AlreadyPanel, { status, busy: syncBusy, error: status?.error, onSync: () => void syncNow() })
              )
            )
          ),
          settingsOpen ? h(SettingsDialog, {
            status,
            report,
            busy: busy === "sync" || busy === "disconnect",
            onClose: () => setSettingsOpen(false),
            onSync: () => void syncNow(),
            onDisconnect: disconnect,
            onReconnect: () => {
              setSettingsOpen(false);
              setConnectOpen(true);
            }
          }) : null,
          connectOpen ? h(
            Overlay,
            { onClose: () => setConnectOpen(false), label: "\u8FDE\u63A5\u80FD\u6E90\u7CFB\u7EDF", modalClassName: "esaModal--settings" },
            h(
              "div",
              { className: "esaModalHead" },
              h(
                "div",
                { className: "esaModalTitleWrap" },
                h("h2", { className: "esaModalTitle" }, "\u8FDE\u63A5\u80FD\u6E90\u7CFB\u7EDF"),
                h("p", { className: "esaModalSub" }, "\u8D26\u53F7\u53EA\u4FDD\u5B58\u5728\u672C\u673A\uFF0C\u4E0D\u5199\u5165\u5BF9\u8BDD\u8BB0\u5F55")
              ),
              h("button", { type: "button", className: "esaBtn esaBtn--icon esaBtn--ghost", onClick: () => setConnectOpen(false), "aria-label": "\u5173\u95ED" }, h(Icon, { name: "close", size: 17 }))
            ),
            h(
              "div",
              { className: "esaModalBody" },
              h(ConnectForm, { initial: { baseUrl: status?.baseUrl, username: status?.username }, compact: true, busy: busy === "connect", error: connectError, onSubmit: connect })
            )
          ) : null
        );
      }
      const list = visible.tenants;
      const codeList = visible.code;
      const totalForFilter = filter === "code" ? report.code.filter(matchesQuery).length : filter === "model" && !showAllModel ? Math.min(12, report.tenants.filter((tenant) => tenant.model).filter(matchesQuery).length) : filter === "focus" ? report.tenants.filter((tenant) => tenant.focus).filter(matchesQuery).length : filter === "dual" ? report.tenants.filter((tenant) => tenant.heuristicHit || tenant.prevAbnormal).filter(matchesQuery).length : filter === "negative" ? report.tenants.filter((tenant) => tenant.negative).filter(matchesQuery).length : filter === "model" ? report.tenants.filter((tenant) => tenant.model).filter(matchesQuery).length : report.tenants.filter(matchesQuery).length;
      const canLoadMore = filter === "code" ? visibleCount < totalForFilter : filter === "model" && !showAllModel ? false : visibleCount < totalForFilter;
      const mainContent = h(
        "div",
        { className: "esaScroll" },
        h(
          "div",
          { className: "esaInner" },
          !configured ? h(
            "div",
            { className: "esaNotice" },
            "\u5F53\u524D\u672A\u8FDE\u63A5\u80FD\u6E90\u7CFB\u7EDF\uFF0C\u5C55\u793A\u7684\u662F\u4E0A\u6B21\u540C\u6B65\u7684\u7F13\u5B58\u3002",
            h("button", { type: "button", className: "esaBtn esaBtn--sm", style: { marginLeft: "10px" }, onClick: () => setConnectOpen(true) }, "\u91CD\u65B0\u8FDE\u63A5")
          ) : null,
          h(SyncBanner, { status, onSync: () => void syncNow(), busy: syncBusy }),
          error ? h("div", { className: "esaNotice esaNotice--risk", role: "alert" }, error) : null,
          notice ? h("div", { className: "esaNotice esaNotice--ok", role: "status" }, notice, h("button", { type: "button", className: "esaTextBtn", style: { marginLeft: "8px" }, onClick: () => setNotice("") }, "\u77E5\u9053\u4E86")) : null,
          h(Summary, { report, status, filter, onFilter: handleFilter }),
          h(Insight, { report }),
          h(Toolbar, {
            report,
            filter,
            onFilter: handleFilter,
            query,
            onQuery: setQuery,
            onToggleAll: () => setShowAllModel((value) => !value),
            allShown: showAllModel,
            counts
          }),
          filter === "code" ? codeList.length ? h(
            "div",
            { className: "esaGrid" },
            ...codeList.map((item) => h(CodeCard, {
              key: item.id,
              item,
              curveState: curveFor(item.meterId),
              onOpen: openCode,
              onAsk: askCode,
              onLoadCurve: loadCurve,
              onRetryCurve: retryCurve
            }))
          ) : h(EmptyState, { title: "\u6CA1\u6709\u5339\u914D\u7684\u4EE3\u7801\u4FA7\u5F02\u5E38", hint: query ? "\u6362\u4E2A\u5173\u952E\u8BCD\u8BD5\u8BD5\uFF0C\u6216\u6E05\u7A7A\u641C\u7D22\u3002" : "\u8FD9\u4EFD\u62A5\u544A\u6CA1\u6709\u4EE3\u7801\u4FA7\u5F02\u5E38\u3002" }) : list.length ? h(
            "div",
            { className: "esaGrid" },
            ...list.map((tenant) => h(TenantCard, {
              key: tenant.meterId,
              tenant,
              curveState: curveFor(tenant.meterId),
              onOpen: openTenant,
              onAsk: askTenant,
              onLoadCurve: loadCurve,
              onRetryCurve: retryCurve
            }))
          ) : h(EmptyState, {
            title: "\u6CA1\u6709\u5339\u914D\u7684\u5F02\u5E38\u79DF\u6237",
            hint: query ? "\u6362\u4E2A\u5173\u952E\u8BCD\u8BD5\u8BD5\uFF0C\u6216\u6E05\u7A7A\u641C\u7D22\u3002" : "\u5F53\u524D\u5206\u7C7B\u4E0B\u6CA1\u6709\u8BB0\u5F55\u3002",
            action: query ? h("button", { type: "button", className: "esaBtn esaBtn--sm", onClick: () => setQuery("") }, "\u6E05\u7A7A\u641C\u7D22") : null
          }),
          canLoadMore ? h(
            "div",
            { className: "esaLoadMore" },
            h("button", { type: "button", className: "esaBtn", onClick: () => setVisibleCount((count) => count + 24) }, `\u52A0\u8F7D\u66F4\u591A\uFF08\u5DF2\u663E\u793A ${filter === "code" ? codeList.length : list.length} / ${totalForFilter}\uFF09`)
          ) : null,
          h(
            "p",
            { className: "esaFinePrint", style: { marginTop: "18px" } },
            `\u62A5\u544A ${report.date} \xB7 \u6570\u636E\u5468\u671F ${report.period.from} \u81F3 ${report.period.to} \xB7 \u672C\u5730\u540C\u6B65 ${fmtDateTime(report.syncedAt)}`,
            report.warnings?.length ? ` \xB7 ${report.warnings.join(" ")}` : ""
          )
        )
      );
      const body = chatOpen ? h(
        "div",
        { className: "esaSplit" },
        h("div", { className: "esaSplitMain" }, mainContent),
        h(ChatDrawer, {
          conversation,
          busy: aiBusy,
          onClose: () => setChatOpen(false),
          onCreate: askReport
        })
      ) : mainContent;
      return h(
        "div",
        { className: "esaRoot" },
        header,
        h("div", { className: "esaBody" }, body),
        selection ? h(DetailDialog, {
          selection,
          report,
          curveState: curveFor(selection.item.meterId),
          onClose: () => setSelection(null),
          onAsk: (target) => {
            setSelection(null);
            void suggestFor(target);
          },
          onRetryCurve: retryCurve
        }) : null,
        settingsOpen ? h(SettingsDialog, {
          status,
          report,
          busy: busy === "sync" || busy === "disconnect",
          onClose: () => setSettingsOpen(false),
          onSync: () => void syncNow(),
          onDisconnect: disconnect,
          onReconnect: () => {
            setSettingsOpen(false);
            setConnectOpen(true);
          }
        }) : null,
        connectOpen ? h(
          Overlay,
          { onClose: () => setConnectOpen(false), label: "\u8FDE\u63A5\u80FD\u6E90\u7CFB\u7EDF", modalClassName: "esaModal--settings" },
          h(
            "div",
            { className: "esaModalHead" },
            h(
              "div",
              { className: "esaModalTitleWrap" },
              h("h2", { className: "esaModalTitle" }, "\u8FDE\u63A5\u80FD\u6E90\u7CFB\u7EDF"),
              h("p", { className: "esaModalSub" }, "\u8D26\u53F7\u53EA\u4FDD\u5B58\u5728\u672C\u673A\uFF0C\u4E0D\u5199\u5165\u5BF9\u8BDD\u8BB0\u5F55")
            ),
            h("button", { type: "button", className: "esaBtn esaBtn--icon esaBtn--ghost", onClick: () => setConnectOpen(false), "aria-label": "\u5173\u95ED" }, h(Icon, { name: "close", size: 17 }))
          ),
          h(
            "div",
            { className: "esaModalBody" },
            h(ConnectForm, { initial: { baseUrl: status?.baseUrl, username: status?.username }, compact: true, busy: busy === "connect", error: connectError, onSubmit: connect })
          )
        ) : null
      );
    }
    class PanelErrorBoundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = { error: null };
      }
      static getDerivedStateFromError(error) {
        return { error };
      }
      componentDidCatch(error, info) {
        try {
          window.__ESA_LAST_ERROR__ = {
            message: error?.message || String(error),
            stack: error?.stack || "",
            componentStack: info?.componentStack || "",
            at: (/* @__PURE__ */ new Date()).toISOString()
          };
        } catch {
        }
        try {
          console.error("[electric-safety] panel render failed", error, info);
        } catch {
        }
      }
      render() {
        if (this.state.error) {
          return h(
            "div",
            { className: "esaRoot" },
            h(
              "header",
              { className: "esaHeader", "data-dsh-workbench-toolbar": "" },
              h(
                "div",
                { className: "esaBrand" },
                h("div", { className: "esaBrandMark" }, h(Icon, { name: "bolt", size: 17 })),
                h(
                  "div",
                  { className: "esaBrandText" },
                  h("h1", { className: "esaTitle" }, "\u7528\u7535\u5B89\u5168\u52A9\u624B"),
                  h("p", { className: "esaSubtitle" }, "\u754C\u9762\u52A0\u8F7D\u51FA\u9519")
                )
              )
            ),
            h(
              "div",
              { className: "esaBody" },
              h(
                "div",
                { className: "esaScroll" },
                h(
                  "div",
                  { className: "esaInner" },
                  h(
                    "div",
                    { className: "esaNotice esaNotice--risk", role: "alert" },
                    "\u5DE5\u4F5C\u53F0\u754C\u9762\u52A0\u8F7D\u51FA\u9519\uFF1A",
                    String(this.state.error?.message || this.state.error)
                  ),
                  h("button", { type: "button", className: "esaBtn", onClick: () => this.setState({ error: null }) }, "\u91CD\u8BD5")
                )
              )
            )
          );
        }
        return this.props.children;
      }
    }
    function apply(ctx) {
      const host = {
        sessions: ctx.sessions,
        conversation: ctx.conversation
      };
      const Panel = (props) => h(PanelErrorBoundary, null, h(BusinessPanel, { ...props, host }));
      ctx.effect(() => ctx.desktopWorkbenches.register({
        title: "\u7528\u7535\u5B89\u5168\u52A9\u624B",
        description: "\u6BCF\u65E5\u62C9\u53D6\u80FD\u6E90\u7BA1\u7406\u7CFB\u7EDF AI \u81EA\u68C0\u62A5\u544A\uFF0C\u6C47\u603B\u5F02\u5E38\u79DF\u6237\u5E76\u5C55\u793A\u5B9E\u9645/\u9884\u6D4B\u7528\u7535\u66F2\u7EBF\u3002",
        repository: "https://github.com/Zcx-BaixiaoBai/ge-workbench-electric-safety",
        customFrame: true,
        headerLayout: "compact"
      }, Panel), "electric safety workbench registration");
    }
    return { apply, inject: ["desktopWorkbenches", "sessions", "conversation"] };
  }

  // src/styles.js
  var CSS = `
.esaRoot{
  container-type:inline-size;
  container-name:esa;

  --esa-ink:#211f1a;
  --esa-ink-2:#655f55;
  --esa-ink-3:#8a8377;
  --esa-line:#e8e2d6;
  --esa-line-2:#f1ece3;
  --esa-surface:#ffffff;
  --esa-bg:#faf8f3;
  --esa-surface-2:#f7f3ea;
  --esa-surface-3:#f0eade;
  --esa-gold:#a8762b;
  --esa-gold-strong:#8a5f20;
  --esa-gold-soft:#f8efdd;
  --esa-gold-line:#e8d4ae;
  --esa-clay:#a8492f;
  --esa-clay-soft:#f9ede8;
  --esa-amber:#97701f;
  --esa-amber-soft:#faf1dd;
  --esa-moss:#56704b;
  --esa-moss-soft:#eef2e9;
  --esa-slate:#5c6874;
  --esa-slate-soft:#eef1f4;
  --esa-chart-actual:#2f6b5f;
  --esa-chart-pred:#a8762b;
  --esa-chart-band:rgba(168,118,43,.14);
  --esa-chart-night:rgba(92,104,116,.075);
  --esa-shadow:0 1px 2px rgba(33,31,26,.04), 0 12px 30px rgba(33,31,26,.06);
  --esa-radius:14px;
  --esa-ease:cubic-bezier(.22,.61,.36,1);

  position:relative;
  display:flex;
  flex-direction:column;
  flex:1 1 auto;
  min-height:0;
  min-width:0;
  width:100%;
  overflow:hidden;
  background:var(--esa-bg);
  color:var(--esa-ink);
  font-family:inherit;
  font-size:13px;
  line-height:20px;
  box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
}
.esaRoot *{box-sizing:border-box}
.esaRoot button,.esaRoot input,.esaRoot select,.esaRoot textarea{font-family:inherit;font-size:13px;line-height:20px;color:inherit}
.esaRoot button{cursor:pointer}
.esaRoot button:disabled{cursor:default;opacity:.55}
.esaRoot :is(button,input,select,textarea,summary):focus-visible{outline:2px solid var(--esa-gold);outline-offset:2px}

body[data-ds-dark-theme] .esaRoot{
  --esa-ink:#f1eee7;
  --esa-ink-2:#b0a99b;
  --esa-ink-3:#918a7d;
  --esa-line:#312f2a;
  --esa-line-2:#282621;
  --esa-surface:#1c1b19;
  --esa-bg:#171614;
  --esa-surface-2:#22211e;
  --esa-surface-3:#2a2823;
  --esa-gold:#d0a55e;
  --esa-gold-strong:#ddbb7e;
  --esa-gold-soft:#2d2618;
  --esa-gold-line:#4a3a1d;
  --esa-clay:#d98a72;
  --esa-clay-soft:#2e211d;
  --esa-amber:#d3ad63;
  --esa-amber-soft:#2b2417;
  --esa-moss:#a2b795;
  --esa-moss-soft:#20261d;
  --esa-slate:#a3b0bc;
  --esa-slate-soft:#1f2429;
  --esa-chart-actual:#8fc6b6;
  --esa-chart-pred:#d0a55e;
  --esa-chart-band:rgba(208,165,94,.16);
  --esa-chart-night:rgba(163,176,188,.09);
  --esa-shadow:0 1px 2px rgba(0,0,0,.18), 0 14px 34px rgba(0,0,0,.24);
}

/* ---- \u9876\u680F ---------------------------------------------------- */
.esaHeader{
  flex:0 0 auto;
  display:flex;
  align-items:center;
  gap:14px;
  min-height:54px;
  padding:8px 22px;
  border-bottom:1px solid var(--esa-line);
  background:var(--esa-surface);
  position:relative;
  z-index:3;
}
.esaBrand{display:flex;align-items:center;gap:10px;min-width:0;flex:1 1 auto}
.esaBrandMark{
  flex:0 0 auto;width:30px;height:30px;border-radius:9px;
  display:grid;place-items:center;color:#fff;
  background:linear-gradient(145deg,#c08a39 0%,#a8762b 48%,#7f5519 100%);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.28),0 2px 6px rgba(127,85,25,.22);
}
.esaBrandText{min-width:0}
.esaTitle{
  margin:0;font-size:14px;line-height:20px;font-weight:650;letter-spacing:.01em;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
}
.esaSubtitle{
  margin:1px 0 0;font-size:11px;line-height:15px;color:var(--esa-ink-3);
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
}
.esaHeaderActions{display:flex;align-items:center;gap:8px;flex:0 0 auto;min-width:0}
.esaDateField{display:flex;align-items:center;gap:6px;min-width:0}
.esaDateLabel{font-size:11px;color:var(--esa-ink-3);white-space:nowrap}
.esaSelect{
  height:32px;max-width:138px;padding:0 26px 0 10px;
  border:1px solid var(--esa-line);border-radius:8px;
  background:var(--esa-surface-2);color:var(--esa-ink);
  appearance:none;background-image:linear-gradient(45deg,transparent 50%,var(--esa-ink-3) 50%),linear-gradient(135deg,var(--esa-ink-3) 50%,transparent 50%);
  background-position:calc(100% - 14px) 13px,calc(100% - 9px) 13px;
  background-size:5px 5px,5px 5px;background-repeat:no-repeat;
  text-overflow:ellipsis;
}
.esaSyncPill{
  display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 9px;
  border:1px solid transparent;border-radius:8px;color:var(--esa-ink-2);
  font-size:11.5px;white-space:nowrap;background:transparent;
}
.esaSyncPill:hover{border-color:var(--esa-line);background:var(--esa-surface-2)}
.esaDot{width:7px;height:7px;border-radius:50%;background:var(--esa-moss);flex:none}
.esaDot--warn{background:var(--esa-amber)}
.esaDot--risk{background:var(--esa-clay)}
.esaDot--busy{background:var(--esa-gold);animation:esaPulse 1.2s ease-in-out infinite}
@keyframes esaPulse{50%{opacity:.28}}

.esaBtn{
  display:inline-flex;align-items:center;justify-content:center;gap:6px;
  height:32px;padding:0 12px;white-space:nowrap;
  border:1px solid var(--esa-line);border-radius:8px;
  background:var(--esa-surface);color:var(--esa-ink);
  transition:background .16s ease,border-color .16s ease,transform .12s ease;
}
.esaBtn:hover:not(:disabled){background:var(--esa-surface-2);border-color:#d9d0c1}
.esaBtn:active:not(:disabled){transform:translateY(1px)}
.esaBtn svg{flex:0 0 auto}
.esaBtn--ghost{border-color:transparent;background:transparent;color:var(--esa-ink-2)}
.esaBtn--ghost:hover:not(:disabled){background:var(--esa-surface-2);color:var(--esa-ink)}
.esaBtn--primary{
  background:var(--dsw-alias-brand-primary-new-color,#a8762b);
  border-color:transparent;color:#fff;font-weight:500;
}
.esaBtn--primary:hover:not(:disabled){background:#93641f;border-color:transparent}
.esaBtn--primary:active:not(:disabled){background:#7f5519}
.esaBtn--icon{width:32px;padding:0}
.esaBtn--sm{height:28px;padding:0 9px;font-size:12px}
.esaBtn--danger{border-color:#e5c9c0;color:var(--esa-clay);background:var(--esa-clay-soft)}
.esaBtn--danger:hover:not(:disabled){background:#f4ddd5;border-color:#dbb3a7}
.esaSpin{animation:esaSpin .9s linear infinite}
@keyframes esaSpin{to{transform:rotate(360deg)}}

/* ---- \u4E3B\u4F53 ---------------------------------------------------- */
.esaBody{flex:1 1 auto;min-height:0;min-width:0;display:flex;flex-direction:column;overflow:hidden}
.esaScroll{
  container-type:inline-size;
  container-name:esa-content;
  flex:1 1 auto;min-height:0;min-width:0;overflow:auto;
  scroll-behavior:smooth;
}
.esaInner{max-width:1480px;margin:0 auto;padding:22px 26px 48px;min-width:0}
.esaScroll::-webkit-scrollbar{width:10px;height:10px}
.esaScroll::-webkit-scrollbar-thumb{background:#e1d9ca;border-radius:8px;border:3px solid var(--esa-bg)}
.esaScroll::-webkit-scrollbar-thumb:hover{background:#d2c8b6}
body[data-ds-dark-theme] .esaScroll::-webkit-scrollbar-thumb{background:#3a3833;border-color:var(--esa-bg)}

.esaSplit{flex:1 1 auto;min-height:0;min-width:0;display:flex;align-items:stretch;overflow:hidden}
.esaSplitMain{flex:1 1 auto;min-width:0;min-height:0;display:flex;flex-direction:column;overflow:hidden}
.esaChat{
  flex:0 0 420px;max-width:46%;min-width:320px;
  display:flex;flex-direction:column;min-height:0;
  border-left:1px solid var(--esa-line);background:var(--esa-surface);
  overflow:hidden;
}
.esaChatHeader{
  flex:0 0 auto;display:flex;align-items:center;justify-content:space-between;gap:10px;
  padding:10px 12px 10px 16px;border-bottom:1px solid var(--esa-line);
}
.esaChatTitle{margin:0;font-size:13px;line-height:20px;font-weight:600}
.esaChatHint{margin:1px 0 0;font-size:11px;line-height:15px;color:var(--esa-ink-3)}
.esaChatBody{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;overflow:hidden}
.esaChatEmpty{flex:1;display:grid;place-items:center;padding:28px;text-align:center;color:var(--esa-ink-2)}
.esaChatEmpty p{margin:0 0 12px;max-width:280px;overflow-wrap:anywhere}

/* ---- \u6C47\u603B ---------------------------------------------------- */
.esaSummary{display:grid;grid-template-columns:repeat(auto-fit,minmax(158px,1fr));gap:12px;min-width:0}
.esaStat{
  display:flex;flex-direction:column;align-items:flex-start;gap:2px;
  min-width:0;padding:13px 14px 12px;text-align:left;
  border:1px solid var(--esa-line);border-radius:12px;background:var(--esa-surface);
  transition:border-color .16s ease,background .16s ease,transform .12s ease,box-shadow .16s ease;
}
.esaStat:hover{border-color:#d9d0c1;box-shadow:0 6px 18px rgba(33,31,26,.05);transform:translateY(-1px)}
.esaStat[aria-pressed=true]{border-color:var(--esa-gold-line);background:var(--esa-gold-soft);box-shadow:none}
.esaStatTop{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;min-width:0}
.esaStatLabel{font-size:11.5px;line-height:16px;color:var(--esa-ink-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.esaStatIcon{flex:none;color:var(--esa-ink-3)}
.esaStatValue{font-size:26px;line-height:32px;font-weight:650;letter-spacing:-.02em;font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
.esaStatNote{font-size:10.5px;line-height:15px;color:var(--esa-ink-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
.esaStatTone--risk .esaStatValue{color:var(--esa-clay)}
.esaStatTone--warn .esaStatValue{color:var(--esa-amber)}
.esaStatTone--good .esaStatValue{color:var(--esa-moss)}

.esaInsight{
  display:flex;align-items:flex-start;gap:11px;margin:14px 0 0;padding:12px 14px;
  border:1px solid var(--esa-gold-line);border-radius:12px;
  background:linear-gradient(100deg,var(--esa-gold-soft) 0%,var(--esa-surface) 78%);
  min-width:0;
}
.esaInsight--risk{border-color:#e7c9be;background:linear-gradient(100deg,var(--esa-clay-soft) 0%,var(--esa-surface) 78%)}
.esaInsightMark{flex:0 0 auto;width:26px;height:26px;border-radius:8px;display:grid;place-items:center;background:rgba(168,118,43,.12);color:var(--esa-gold-strong)}
.esaInsight--risk .esaInsightMark{background:rgba(168,73,47,.12);color:var(--esa-clay)}
.esaInsightText{min-width:0}
.esaInsightTitle{margin:0;font-size:12px;line-height:18px;font-weight:650;color:var(--esa-ink)}
.esaInsightBody{margin:1px 0 0;font-size:11.5px;line-height:18px;color:var(--esa-ink-2);overflow-wrap:anywhere}

/* ---- \u7B5B\u9009\u680F -------------------------------------------------- */
.esaToolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:18px 0 12px;flex-wrap:wrap;min-width:0}
.esaTabs{display:flex;align-items:center;gap:3px;flex-wrap:wrap;min-width:0}
.esaTab{
  display:inline-flex;align-items:center;gap:5px;height:30px;padding:0 10px;
  border:1px solid transparent;border-radius:8px;background:transparent;
  font-size:12.5px;color:var(--esa-ink-2);white-space:nowrap;
  transition:background .16s ease,border-color .16s ease,color .16s ease;
}
.esaTab:hover{background:var(--esa-surface-2);color:var(--esa-ink)}
.esaTab[aria-selected=true]{background:var(--esa-surface);border-color:var(--esa-line);color:var(--esa-ink);font-weight:600;box-shadow:0 1px 2px rgba(33,31,26,.04)}
.esaTabCount{font-size:10.5px;color:var(--esa-ink-3);font-variant-numeric:tabular-nums}
.esaTab[aria-selected=true] .esaTabCount{color:var(--esa-gold-strong)}
.esaFilterTools{display:flex;align-items:center;gap:8px;min-width:0;flex-wrap:wrap}
.esaSearch{display:flex;align-items:center;gap:6px;height:32px;min-width:196px;padding:0 10px;border:1px solid var(--esa-line);border-radius:8px;background:var(--esa-surface);color:var(--esa-ink-3)}
.esaSearch input{border:0;outline:0;background:transparent;width:100%;min-width:0;color:var(--esa-ink)}
.esaSearch input::placeholder{color:var(--esa-ink-3)}
.esaChip{
  display:inline-flex;align-items:center;gap:6px;height:26px;padding:0 8px;
  border:1px solid var(--esa-gold-line);border-radius:7px;background:var(--esa-gold-soft);
  color:var(--esa-gold-strong);font-size:11px;white-space:nowrap;
}
.esaChip button{border:0;background:transparent;padding:0;height:16px;color:inherit;display:inline-flex;align-items:center}

/* ---- \u79DF\u6237\u5361\u7247 ------------------------------------------------ */
.esaGrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(336px,1fr));gap:14px;min-width:0;align-items:start}
.esaCard{
  display:flex;flex-direction:column;min-width:0;
  border:1px solid var(--esa-line);border-radius:var(--esa-radius);background:var(--esa-surface);
  padding:13px 14px 11px;box-shadow:0 1px 2px rgba(33,31,26,.035);
  transition:border-color .16s ease,box-shadow .18s ease,transform .14s var(--esa-ease);
  content-visibility:auto;contain-intrinsic-size:310px;
}
.esaCard:hover{border-color:#d8cebd;box-shadow:var(--esa-shadow);transform:translateY(-1px)}
.esaCardTop{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;min-width:0}
.esaCardNameWrap{min-width:0;flex:1 1 auto}
.esaCardName{
  margin:0;font-size:15px;line-height:22px;font-weight:650;letter-spacing:.005em;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
}
.esaCardMeta{
  margin:2px 0 0;font-size:11px;line-height:16px;color:var(--esa-ink-3);
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
}
.esaBadges{display:flex;flex-wrap:wrap;gap:4px;min-width:0}
.esaBadge{
  display:inline-flex;align-items:center;gap:3px;height:20px;padding:0 6px;
  border-radius:5px;border:1px solid transparent;font-size:10px;line-height:18px;
  white-space:nowrap;font-weight:500;
}
.esaBadge--dual{background:var(--esa-clay-soft);border-color:#eccfc5;color:var(--esa-clay)}
.esaBadge--prev{background:var(--esa-amber-soft);border-color:#ead6ae;color:var(--esa-amber)}
.esaBadge--negative{background:var(--esa-slate-soft);border-color:#d9e0e5;color:var(--esa-slate)}
.esaBadge--model{background:var(--esa-gold-soft);border-color:var(--esa-gold-line);color:var(--esa-gold-strong)}
.esaBadge--code{background:var(--esa-clay-soft);border-color:#eccfc5;color:var(--esa-clay)}
.esaBadge--fault{background:var(--esa-amber-soft);border-color:#ead6ae;color:var(--esa-amber)}
.esaMetrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin-top:11px;min-width:0}
.esaMetric{min-width:0;padding:6px 7px 5px;border-radius:8px;background:var(--esa-surface-2)}
.esaMetricLabel{font-size:9.5px;line-height:14px;color:var(--esa-ink-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.esaMetricValue{
  margin-top:1px;font-size:12.5px;line-height:18px;font-weight:600;font-variant-numeric:tabular-nums;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}
.esaMetricValue--risk{color:var(--esa-clay)}
.esaMetricValue--warn{color:var(--esa-amber)}
.esaMetricValue--good{color:var(--esa-moss)}
.esaChartBox{margin-top:9px;min-width:0;border-radius:10px;background:var(--esa-surface-2);padding:5px 5px 3px;overflow:hidden}
.esaChartLegend{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:4px 5px 3px;font-size:9.5px;line-height:14px;color:var(--esa-ink-3)}
.esaLegendItem{display:inline-flex;align-items:center;gap:4px;white-space:nowrap}
.esaLegendSwatch{width:9px;height:3px;border-radius:2px;flex:none}
.esaLegendSwatch--band{height:8px;border-radius:2px;background:var(--esa-chart-band)}
.esaLegendSwatch--night{height:8px;border-radius:2px;background:var(--esa-chart-night)}
.esaCardFoot{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:7px;min-width:0}
.esaCardFootNote{font-size:10px;line-height:15px;color:var(--esa-ink-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.esaCardActions{display:flex;align-items:center;gap:2px;flex:none}
.esaTextBtn{
  display:inline-flex;align-items:center;gap:4px;height:26px;padding:0 6px;
  border:0;border-radius:6px;background:transparent;color:var(--esa-gold-strong);
  font-size:11px;white-space:nowrap;
}
.esaTextBtn:hover{background:var(--esa-gold-soft)}
.esaTextBtn--muted{color:var(--esa-ink-2)}
.esaTextBtn--muted:hover{background:var(--esa-surface-2)}

/* ---- \u4EE3\u7801\u4FA7\u5F02\u5E38\u5361\u7247 ------------------------------------------ */
.esaCodeCard .esaCardName{font-size:14px}
.esaCodeDesc{margin:8px 0 0;font-size:11.5px;line-height:18px;color:var(--esa-ink-2);overflow-wrap:anywhere}
.esaCodeMetrics{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.esaCodeMetric{display:inline-flex;align-items:baseline;gap:4px;padding:3px 7px;border-radius:6px;background:var(--esa-surface-2);font-size:10px;color:var(--esa-ink-3)}
.esaCodeMetric strong{font-size:11.5px;color:var(--esa-ink);font-weight:600;font-variant-numeric:tabular-nums}

/* ---- \u7A7A\u72B6\u6001 / \u9AA8\u67B6\u5C4F / \u63D0\u793A --------------------------------- */
.esaEmpty{padding:46px 20px;text-align:center;color:var(--esa-ink-2);overflow-wrap:anywhere}
.esaEmptyMark{width:42px;height:42px;margin:0 auto 12px;border-radius:13px;display:grid;place-items:center;background:var(--esa-surface-2);color:var(--esa-ink-3)}
.esaEmptyTitle{margin:0 0 5px;font-size:14px;line-height:21px;font-weight:600;color:var(--esa-ink)}
.esaEmptyHint{margin:0 auto;max-width:460px;font-size:12px;line-height:19px;color:var(--esa-ink-2)}
.esaEmptyActions{display:flex;justify-content:center;gap:8px;margin-top:14px;flex-wrap:wrap}
.esaSha{display:flex;flex-direction:column;gap:12px}
.esaShaRow{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px}
.esaShaBlock{border-radius:12px;background:linear-gradient(90deg,var(--esa-surface-2) 25%,var(--esa-surface-3) 37%,var(--esa-surface-2) 63%);background-size:400% 100%;animation:esaShimmer 1.5s ease infinite}
@keyframes esaShimmer{0%{background-position:100% 0}100%{background-position:0 0}}
.esaNotice{
  margin:0 0 13px;padding:9px 12px;border-radius:9px;font-size:11.5px;line-height:18px;
  background:var(--esa-amber-soft);border:1px solid #ecdab4;color:#7c5d1c;overflow-wrap:anywhere;
}
.esaNotice--risk{background:var(--esa-clay-soft);border-color:#eccfc5;color:#853a26}
.esaNotice--ok{background:var(--esa-moss-soft);border-color:#d9e2d2;color:#40573a}
body[data-ds-dark-theme] .esaNotice{color:#e0c383;border-color:#463a22}
body[data-ds-dark-theme] .esaNotice--risk{color:#e2a18e;border-color:#4d2e26}
body[data-ds-dark-theme] .esaNotice--ok{color:#b5c9a9;border-color:#33402b}
.esaLoadMore{display:flex;justify-content:center;padding:18px 0 4px}

/* ---- \u8FDE\u63A5\u5F15\u5BFC ------------------------------------------------ */
.esaConnectWrap{max-width:720px;margin:26px auto 0;padding:0 6px}
.esaConnectCard{
  border:1px solid var(--esa-line);border-radius:16px;background:var(--esa-surface);
  padding:26px 28px 24px;box-shadow:var(--esa-shadow);
}
.esaConnectEyebrow{display:inline-flex;align-items:center;gap:6px;margin-bottom:10px;padding:3px 8px;border-radius:6px;background:var(--esa-gold-soft);color:var(--esa-gold-strong);font-size:10.5px;font-weight:500}
.esaConnectTitle{margin:0;font-size:21px;line-height:30px;font-weight:650;letter-spacing:-.01em}
.esaConnectIntro{margin:6px 0 0;font-size:12.5px;line-height:20px;color:var(--esa-ink-2);overflow-wrap:anywhere}
.esaForm{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:20px}
.esaField{display:flex;flex-direction:column;gap:5px;min-width:0}
.esaField--wide{grid-column:1 / -1}
.esaFieldLabel{font-size:11.5px;line-height:16px;color:var(--esa-ink-2);font-weight:500}
.esaInput{
  height:36px;width:100%;padding:0 10px;border:1px solid var(--esa-line);border-radius:8px;
  background:var(--esa-surface);color:var(--esa-ink);outline:0;
}
.esaInput:focus{border-color:var(--esa-gold);box-shadow:0 0 0 3px rgba(168,118,43,.12)}
.esaInput::placeholder{color:var(--esa-ink-3)}
.esaFormActions{grid-column:1 / -1;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:2px}
.esaFinePrint{font-size:10.5px;line-height:16px;color:var(--esa-ink-3);max-width:430px;overflow-wrap:anywhere}
.esaConnectAside{display:flex;align-items:flex-start;gap:9px;margin-top:18px;padding:10px 12px;border-radius:9px;background:var(--esa-surface-2);color:var(--esa-ink-2);font-size:11px;line-height:17px}
.esaConnectAside svg{flex:none;margin-top:1px;color:var(--esa-gold)}
.esaAlready{max-width:720px;margin:26px auto 0;padding:0 6px}
.esaAlreadyCard{border:1px solid var(--esa-line);border-radius:14px;background:var(--esa-surface);padding:18px 20px;display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap}
.esaAlreadyText{min-width:0}
.esaAlreadyTitle{margin:0;font-size:14px;line-height:21px;font-weight:600}
.esaAlreadyHint{margin:2px 0 0;font-size:11.5px;line-height:18px;color:var(--esa-ink-2);overflow-wrap:anywhere}

/* ---- \u56FE\u8868 ---------------------------------------------------- */
.esaChart{display:block;width:100%;height:auto;overflow:visible}
.esaChart--detail{min-width:620px}
.esaChartSkeleton{height:132px;border-radius:9px;background:linear-gradient(90deg,var(--esa-surface-2) 25%,var(--esa-surface-3) 37%,var(--esa-surface-2) 63%);background-size:400% 100%;animation:esaShimmer 1.5s ease infinite}
.esaChartError{display:flex;align-items:center;justify-content:center;gap:8px;min-height:132px;padding:10px;border-radius:9px;background:var(--esa-surface-2);font-size:11px;color:var(--esa-ink-2);text-align:center;flex-wrap:wrap}
.esaChartEmpty{display:grid;place-items:center;min-height:132px;padding:10px;border-radius:9px;background:var(--esa-surface-2);font-size:11px;color:var(--esa-ink-3);text-align:center}
.esaChartWrap--detail{overflow-x:auto;border:1px solid var(--esa-line);border-radius:12px;background:var(--esa-surface-2);padding:10px 8px 6px}
.esaChartWrap--detail::-webkit-scrollbar{height:9px}
.esaChartWrap--detail::-webkit-scrollbar-thumb{background:#d9d0c1;border-radius:8px;border:2px solid var(--esa-surface-2)}

/* ---- \u8BE6\u60C5\u5F39\u5C42 ------------------------------------------------ */
.esaOverlay{
  position:absolute;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;
  padding:24px;background:rgba(33,31,26,.34);backdrop-filter:blur(2px);
}
.esaModal{
  width:min(920px,100%);max-height:calc(100% - 8px);overflow:auto;
  border:1px solid var(--esa-line);border-radius:16px;background:var(--esa-surface);
  box-shadow:0 30px 80px rgba(20,18,14,.28);
  animation:esaModalIn .18s var(--esa-ease);
}
.esaModal--settings{width:min(560px,100%)}
@keyframes esaModalIn{from{opacity:0;transform:translateY(6px) scale(.992)}to{opacity:1;transform:none}}
.esaModalHead{
  position:sticky;top:0;z-index:2;display:flex;align-items:flex-start;justify-content:space-between;gap:12px;
  padding:16px 18px 13px;border-bottom:1px solid var(--esa-line);background:var(--esa-surface);
}
.esaModalTitleWrap{min-width:0}
.esaModalTitle{margin:0;font-size:16px;line-height:24px;font-weight:650;overflow-wrap:anywhere}
.esaModalSub{margin:2px 0 0;font-size:11.5px;line-height:17px;color:var(--esa-ink-3);overflow-wrap:anywhere}
.esaModalBody{padding:16px 18px 20px;min-width:0}
.esaDetailStats{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px;margin-bottom:13px}
.esaDetailStat{min-width:0;padding:8px 9px;border-radius:9px;background:var(--esa-surface-2)}
.esaDetailStatLabel{font-size:10px;line-height:14px;color:var(--esa-ink-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.esaDetailStatValue{margin-top:1px;font-size:13px;line-height:19px;font-weight:600;font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.esaDetailSection{margin-top:14px}
.esaDetailSectionTitle{margin:0 0 7px;font-size:12px;line-height:18px;font-weight:600}
.esaTableWrap{overflow-x:auto;border:1px solid var(--esa-line);border-radius:10px}
.esaTable{width:100%;border-collapse:collapse;font-size:11.5px;min-width:520px}
.esaTable th,.esaTable td{padding:7px 9px;text-align:left;border-bottom:1px solid var(--esa-line-2);white-space:nowrap}
.esaTable th{font-size:10px;color:var(--esa-ink-3);font-weight:500;background:var(--esa-surface-2)}
.esaTable tr:last-child td{border-bottom:0}
.esaTable td:nth-child(n+2){font-variant-numeric:tabular-nums}
.esaModalActions{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-top:16px}
.esaModalActionsRight{display:flex;align-items:center;gap:8px;flex-wrap:wrap}

/* ---- \u8BBE\u7F6E\u5F39\u5C42 ------------------------------------------------ */
.esaSettingsGroup{display:flex;flex-direction:column;gap:10px;padding:12px 0;border-bottom:1px solid var(--esa-line-2)}
.esaSettingsGroup:last-child{border-bottom:0;padding-bottom:0}
.esaSettingsRow{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;font-size:12px;line-height:19px}
.esaSettingsKey{color:var(--esa-ink-3);flex:none}
.esaSettingsValue{color:var(--esa-ink);text-align:right;min-width:0;overflow-wrap:anywhere}
.esaSettingsNote{font-size:11px;line-height:17px;color:var(--esa-ink-3);overflow-wrap:anywhere}
.esaSettingsActions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}

/* ---- \u63D0\u793A\u6761 -------------------------------------------------- */
.esaSyncError{
  display:flex;align-items:flex-start;justify-content:space-between;gap:12px;
  margin:0 0 14px;padding:10px 12px;border-radius:9px;
  background:var(--esa-clay-soft);border:1px solid #eccfc5;color:#853a26;
  font-size:11.5px;line-height:18px;overflow-wrap:anywhere;
}
.esaSyncError button{flex:none}
body[data-ds-dark-theme] .esaSyncError{color:#e2a18e;border-color:#4d2e26}

/* ---- \u54CD\u5E94\u5F0F\uFF1A\u6309\u4E1A\u52A1\u5185\u5BB9\u5BB9\u5668\u5BBD\u5EA6\u91CD\u6392 ------------------------- */
@container esa-content (max-width: 1120px){
  .esaDetailStats{grid-template-columns:repeat(3,minmax(0,1fr))}
}
@container esa-content (max-width: 880px){
  .esaSummary{grid-template-columns:repeat(auto-fit,minmax(148px,1fr))}
  .esaGrid{grid-template-columns:repeat(auto-fill,minmax(310px,1fr))}
  .esaToolbar{align-items:flex-start}
  .esaFilterTools{width:100%}
  .esaSearch{flex:1 1 220px}
}
@container esa-content (max-width: 620px){
  .esaInner{padding:16px 14px 38px}
  .esaSummary{grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}
  .esaStat{padding:11px 11px 10px}
  .esaStatValue{font-size:23px;line-height:29px}
  .esaGrid{grid-template-columns:1fr;gap:11px}
  .esaMetrics{grid-template-columns:repeat(2,minmax(0,1fr))}
  .esaToolbar{margin-top:14px}
  .esaTabs{width:100%;flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;padding-bottom:1px}
  .esaTabs::-webkit-scrollbar{display:none}
  .esaTab{flex:0 0 auto}
  .esaDetailStats{grid-template-columns:repeat(2,minmax(0,1fr))}
  .esaOverlay{padding:8px}
  .esaModal{max-height:calc(100% - 4px);border-radius:13px}
  .esaModalHead{padding:13px 14px 11px}
  .esaModalBody{padding:13px 14px 16px}
  .esaConnectCard{padding:20px 17px 18px}
  .esaConnectTitle{font-size:19px;line-height:27px}
  .esaForm{grid-template-columns:1fr}
  .esaFormActions{align-items:flex-start;flex-direction:column}
  .esaAlreadyCard{padding:15px}
}
@container esa (max-width: 1080px){
  .esaSubtitle{display:none}
  .esaHeader{gap:10px}
}
@container esa (max-width: 860px){
  .esaHeader{padding:8px 14px;flex-wrap:wrap;row-gap:8px}
  .esaBrand{flex:1 1 220px}
  .esaHeaderActions{flex:1 1 auto;justify-content:flex-end}
  .esaDateLabel{display:none}
  .esaSyncPill span.esaSyncText{display:none}
  .esaBtn--sync .esaBtnLabel{display:none}
  .esaBtn--sync{width:32px;padding:0}
}
@container esa (max-width: 560px){
  .esaHeader{padding:8px 11px}
  .esaBrandMark{width:28px;height:28px}
  .esaTitle{font-size:13px}
  .esaDateField{display:none}
  .esaHeaderActions{gap:4px}
  .esaBtn--ai .esaBtnLabel{display:none}
  .esaBtn--ai{width:32px;padding:0}
}
@container esa (max-width: 900px){
  .esaChat{
    position:absolute;inset:0;z-index:30;flex:none;width:100%;max-width:none;min-width:0;
    border-left:0;box-shadow:-12px 0 32px rgba(20,18,14,.16);
  }
  .esaSplit{position:relative}
}

/* ---- \u51CF\u5C11\u52A8\u6548 ------------------------------------------------- */
@media (prefers-reduced-motion: reduce){
  .esaRoot *{animation-duration:.01ms !important;animation-iteration-count:1 !important;transition-duration:.01ms !important;scroll-behavior:auto !important}
}
`;
  var styles_default = CSS;

  // src/entry.jsx
  var STYLE_ID = "ge-workbench-electric-safety-style";
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
        window.__ESA_LAST_ERROR__ = { message: event?.message || String(event?.error || ""), at: (/* @__PURE__ */ new Date()).toISOString() };
        console.error("[electric-safety] window error", event?.error || event?.message);
      } catch {
      }
    });
    window.addEventListener("unhandledrejection", (event) => {
      try {
        window.__ESA_LAST_ERROR__ = { message: String(event?.reason || ""), at: (/* @__PURE__ */ new Date()).toISOString() };
        console.error("[electric-safety] unhandled rejection", event?.reason);
      } catch {
      }
    });
  } catch {
  }
  window.__ModuleLoader__.load({
    id: "ge-workbench-electric-safety",
    factory: (req) => {
      const React = req("react");
      installStyles();
      return createPanel(React);
    }
  });
})();
