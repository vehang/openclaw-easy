const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));

  // 点击主题切换按钮切换到浅色模式
  await page.click('.theme-toggle-btn');
  await new Promise(r => setTimeout(r, 1000));

  await page.screenshot({ path: '/tmp/ui_light.png', fullPage: true });
  console.log('Light mode screenshot saved to /tmp/ui_light.png');

  await browser.close();
})();
