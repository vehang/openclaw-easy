const puppeteer = require('puppeteer')

async function takeScreenshot() {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
  })

  const page = await browser.newPage()
  await page.setViewport({ width: 1400, height: 900 })

  console.log('访问页面...')
  await page.goto('http://localhost:5175/', { waitUntil: 'networkidle2', timeout: 15000 })

  console.log('等待页面加载...')
  await new Promise(resolve => setTimeout(resolve, 3000))

  const screenshotPath = '/root/.openclaw/workspace/screenshots/ui-latest.png'
  await page.screenshot({
    path: screenshotPath,
    fullPage: false
  })

  console.log(`截图已保存: ${screenshotPath}`)

  await browser.close()
}

takeScreenshot().catch(err => {
  console.error(`执行截图失败: ${err.message}`)
  process.exit(1)
})
