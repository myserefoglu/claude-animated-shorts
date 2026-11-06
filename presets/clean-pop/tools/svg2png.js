const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ deviceScaleFactor: 1 });
  for (const n of process.argv.slice(2)) {
    const svg = fs.readFileSync(n + '.svg').toString('base64');
    await p.setContent(`<html><body style="margin:0;background:transparent"><img id=i style="height:600px;display:block" src="data:image/svg+xml;base64,${svg}"></body></html>`);
    await p.waitForTimeout(150);
    const el = await p.$('#i'); await el.screenshot({ path: n + '.png', omitBackground: true });
  }
  await b.close();
})();
