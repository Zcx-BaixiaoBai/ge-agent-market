// 数据管理中心工作台 —— 客户端样式
//
// 作用域统一收敛在 .dc 前缀下，不影响宿主与其它工作台。
// 业务区按自身容器宽度重排：容器变窄时卡片与表格自行折行，
// 表格在自己的容器内横向滚动，不让整页出现横向溢出。

const CSS = `
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
/* 主按钮跟随金鹰桌面品牌色（金黄 #a8762b，配白字）。
   宿主主题把该别名覆盖为金黄；其它宿主未定义时用同一色兜底，
   不再使用会解析成近黑的 button-primary 系列 token。 */
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
/* 短枚举列（等级/状态/责任人/日期/天数）不折行，避免「一般隐患」被挤成两行。 */
.dcTable__nowrap{white-space:nowrap;overflow-wrap:normal;word-break:normal}
.dcTable th.dcTable__nowrap{white-space:nowrap}

/* ---- 总览图表区 ---- */
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

/* ---- 明细页：统计条 / 筛选 / 迷你图 ---- */
.dcDetailPage{display:flex;flex-direction:column;gap:14px;min-width:0}
.dcStatStrip{display:flex;gap:10px;flex-wrap:wrap;min-width:0}
.dcStatChip{display:inline-flex;align-items:baseline;gap:7px;padding:7px 12px;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));border-radius:8px;background:var(--dsw-alias-bg-layer-1,transparent);min-width:0}
.dcStatChip__label{font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary,inherit);white-space:nowrap}
.dcStatChip__value{font-size:15px;line-height:20px;font-weight:600;font-variant-numeric:tabular-nums;white-space:nowrap}
.dcStatChip--warn{border-color:rgba(154,103,0,.4)}
.dcStatChip--alert{border-color:rgba(194,65,12,.45)}
.dcStatChip--alert .dcStatChip__value{color:#c2410c}
/* 工具条固定两行：上行搜索+操作，下行筛选标签；控件不随宽度乱跳。 */
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
`

export default CSS
