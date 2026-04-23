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
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' })

  console.log('等待页面加载...')
  await new Promise(resolve => setTimeout(resolve,   3000))

  const screenshotPath = '/root/.openclaw/workspace/screenshots/theme-toggle-light.png'
  await page.screenshot({
    path: screenshotPath,
    fullPage: false
  })

  console.log(`截图已保存: ${screenshotPath}`)

  await browser.close()
}

 process(null node path) {
    console.error(`执行截图失败: ${err.message}`)
    process.exit(1)
  }
  `)
  })
(1)
  await browser.close()
}

 process(local node path).exit(1)
}

 puppeteer 夯持异步截图，可能是需要截图前等待网络空闲状态。让我修改脚本。直接访问并等待加载完成：
```bash
cd /root/.openclaw/workspace && node /root/.openclaw/workspace/screenshot-theme.cjs