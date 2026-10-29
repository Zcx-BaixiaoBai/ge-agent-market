// 数据管理中心工作台 —— 客户端样式
//
// 设计语言跟随金鹰桌面：白底、暖灰发丝线、单一金黄品牌色，
// 风险只用低饱和的陶土红/赭石黄少量点缀，避免整页红字。
// 所有样式收敛在 .dc 前缀与 --dc-* 变量内，不污染宿主。

const CSS = `
.dcRoot{
  container-type:inline-size;
  container-name:datacenter-panel;

  /* 暖中性色板：与金黄品牌色同一色相家族 */
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

/* 暖色暗色主题：宿主切换暗色时跟随 */
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

/* ---- 顶栏（宿主紧凑标题栏） ---------------------------------- */
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

/* ---- 分类标签栏 ---------------------------------------------- */
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

/* ---- 内容区 --------------------------------------------------- */
.dcContent{flex:1 1 auto;min-height:0;min-width:0;display:flex;flex-direction:column;overflow:hidden}
.dcSplit{flex:1 1 auto;min-height:0;min-width:0;display:flex;align-items:stretch}
.dcSplit>.dcContent{flex:1 1 auto;min-width:0}
.dcChat{
  flex:0 0 400px;max-width:44%;min-width:300px;display:flex;flex-direction:column;
  border-left:1px solid var(--dc-line);overflow:hidden;min-height:0;
}
.dcWorkspace{
  /* 与根容器同名：内容区被 AI 对话挤窄时，卡片按内容宽度重排，而不是按整窗宽度。 */
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

/* ---- 骨架屏 --------------------------------------------------- */
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

/* ---- 总览 ----------------------------------------------------- */
.dcOverview{display:flex;flex-direction:column;gap:26px;min-width:0}
.dcSectionHead{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin:0 0 12px}
.dcSection__title{margin:0;font-size:15px;line-height:22px;font-weight:600;letter-spacing:.01em;overflow-wrap:anywhere}
.dcSection__note{margin:3px 0 0;font-size:12px;line-height:18px;color:var(--dc-ink-2);overflow-wrap:anywhere}
.dcPanel{min-width:0}

/* 风险摘要：整页唯一的暖金提示条 */
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

/* 四个核心指标：一块面板内用发丝线分隔，不用四张卡 */
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

/* 图表卡：12 栅格上做宽窄交替，避免四等分的模板感 */
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

/* 排名：名次 + 名称 + 条形 + 计数 + 故障率 */
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

/* 图例与堆叠条 */
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

/* 图表用色：全部走变量，暗色主题自动跟随 */
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

/* 环形图 */
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

/* 覆盖率 */
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

/* 集团口径：作为附录，视觉权重低于所选项目 */
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

/* 同步信息：页脚一行，不再占一张卡 */
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

/* ---- 表格 ----------------------------------------------------- */
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

/* 状态点 */
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

/* ---- 明细页 --------------------------------------------------- */
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

/* 明细页图表：三块并排，共用一块面板 */
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

/* ---- 项目选择 ------------------------------------------------- */
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

/* ---- 容器查询 ------------------------------------------------- */
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
`

export default CSS