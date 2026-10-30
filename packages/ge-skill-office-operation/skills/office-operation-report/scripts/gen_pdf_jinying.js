const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const puppeteer = require('puppeteer-core');

const INPUT = process.argv[2] || process.env.PDF_INPUT;
const OUTPUT = process.argv[3] || process.env.PDF_OUTPUT;
if (!INPUT || !OUTPUT) {
  console.error('用法: node gen_pdf_jinying.js <input.html> <output.pdf>（或设置 PDF_INPUT / PDF_OUTPUT）');
  process.exit(1);
}
const HTML = pathToFileURL(path.resolve(INPUT)).href;
const PDF = path.resolve(OUTPUT);

function findChrome() {
  if (process.env.CHROME_BIN) return process.env.CHROME_BIN;
  const candidates = process.platform === 'darwin'
    ? [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Applications/Chromium.app/Contents/MacOS/Chromium',
        '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'
      ]
    : process.platform === 'win32'
      ? [
          'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
          'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
          'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
        ]
      : ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  console.error('未找到 Chrome/Chromium，请设置 CHROME_BIN 指向浏览器可执行文件');
  process.exit(1);
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: findChrome(),
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();

  // A4 = 210x297mm; minus 5mm margins each side -> content box = 200x287mm = 756x1085 CSS px.
  await page.setViewport({ width: 756, height: 1085, deviceScaleFactor: 2 });

  // Screen media: keep all on-screen styles (gradients, card colors, chart colors)
  await page.emulateMediaType('screen');

  await page.goto(HTML, { waitUntil: 'networkidle0', timeout: 30000 });

  await page.waitForFunction(
    () => window.Chart && document.querySelectorAll('canvas').length >= 7,
    { timeout: 20000 }
  );

  // Print-optimized overrides (injected at render time only; the HTML file is untouched)
  await page.addStyleTag({ content: `
    .topbar{display:none!important}
    .module-rail{display:none!important}
    .page-wrap{max-width:none!important;padding:0!important}
    body{background:#fff!important}
    .cover-page{
      min-height:100vh!important;
      break-after:always;
      page-break-after:always;
      border:none!important;
      border-radius:0!important;
      padding:60px 50px!important;
      margin-bottom:0!important;
    }
    .section{
      padding:24px 30px!important;
      break-inside:auto!important;
      page-break-inside:auto!important;
      border:none!important;
      box-shadow:none!important;
      margin-bottom:16px!important;
    }
    /* KPI summary row: force exactly 4 equal columns, never wrap */
    .metric-strip{grid-template-columns:repeat(4,1fr)!important;gap:0!important}
    .metric-card{min-width:0!important;padding:14px 12px!important}
    .metric-card .mc-label{font-size:10px!important}
    .metric-card .mc-value{font-size:20px!important}
    .metric-card .mc-desc{font-size:10px!important}
    /* 2-column metric strip */
    .metric-strip[style*="1fr 1fr"]{grid-template-columns:1fr 1fr!important}
    /* Chart rows: split space evenly */
    .chart-row{grid-template-columns:1fr 1fr!important;gap:16px!important}
    .chart-row .chart-box{height:260px!important;min-width:0!important}
    /* Single chart: fill full width */
    .section>.chart-box{height:380px!important;margin:14px 0!important}
    .chart-box{min-width:0!important}
    .chart-box canvas{width:100%!important;height:100%!important;display:block}
    /* Avoid breaking inside key elements */
    .chart-box,.table-wrap,.metric-strip,.brief-analysis,.conclusion,.alert,.risk-item,.insight-block{break-inside:avoid}
    .section-heading,.section-subhead,.topic-heading{break-after:avoid}
    .page-footer{break-inside:avoid}
    /* Table adjustments */
    table{font-size:11px!important}
    thead th{font-size:10px!important;padding:7px 8px!important}
    tbody td{padding:6px 8px!important}
    /* Cover page TOC */
    .cover-toc{grid-template-columns:1fr 1fr!important;gap:4px 30px!important}
    .cover-toc a{font-size:11px!important;padding:4px 0!important}
    /* Cover title size */
    .cover-title{font-size:32px!important}
    .cover-subtitle{font-size:18px!important}
    /* Risk items */
    .risk-item{padding:12px 16px!important;margin-bottom:8px!important}
    /* Action list */
    .action-list li{padding:6px 0 6px 18px!important;font-size:12px!important}
    /* Brief analysis */
    .brief-analysis{padding:12px 16px!important;font-size:12.5px!important}
    .conclusion{padding:12px 16px!important;font-size:12.5px!important}
    /* Alert */
    .alert{padding:12px 16px!important;font-size:12px!important}
  `});

  // Freeze charts: disable animation and re-render at the final paper size
  await page.evaluate(() => {
    Object.keys(Chart.instances).forEach(id => {
      const c = Chart.instances[id];
      c.options.animation = false;
      c.resize();
      c.update('none');
    });
  });

  await new Promise(r => setTimeout(r, 800));

  fs.mkdirSync(path.dirname(PDF), { recursive: true });

  // A4 portrait PDF with backgrounds
  await page.pdf({
    path: PDF,
    format: 'A4',
    printBackground: true,
    margin: { top: '5mm', right: '5mm', bottom: '5mm', left: '5mm' }
  });

  console.log('PDF generated successfully');
  await browser.close();
})();
