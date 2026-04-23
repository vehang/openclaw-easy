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

  await page.screenshot({ path: '/tmp/ui_screenshot.png', fullPage: true });
  console.log('Screenshot saved to /tmp/ui_screenshot.png');

  // Check elements
  const checks = await page.evaluate(() => {
    return {
      header: document.querySelector('header') !== null,
      editor: document.querySelector('.cm-editor') !== null,
      preview: document.querySelector('.mp-preview') !== null,
      copyBtn: document.body.innerText.includes('复制排版'),
      fetchBtn: document.body.innerText.includes('抓取链接'),
    };
  });

  console.log('\n=== UI 元素检查 ===');
  Object.entries(checks).forEach(([key, value]) => {
    console.log(`${value ? '✓' : '✗'} ${key}: ${value}`);
  });

  await browser.close();
})();
