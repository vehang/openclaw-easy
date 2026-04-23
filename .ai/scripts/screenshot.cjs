const puppeteer = require('puppeteer')

async function takeScreenshot() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  const page = await browser.newPage()
  await page.setViewport({ width: 1400, height: 900 })

  console.log('访问页面...')
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' })

  console.log('等待页面加载...')
  await new Promise(resolve => setTimeout(resolve, 2000))

  const screenshotPath = '/root/.openclaw/workspace/screenshots/p1-features.png'
  await page.screenshot({
    path: screenshotPath,
    fullPage: false
  })

  console.log(`截图已保存: ${screenshotPath}`)

  await browser.close()
}

takeScreenshot().catch(console.error)
