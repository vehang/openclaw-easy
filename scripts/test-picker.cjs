const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1200, height: 900 });

  // Navigate to the app
  await page.goto('http://localhost:5173');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000); // Wait for React to render

  // Take initial screenshot
  await page.screenshot({ path: '/tmp/01_initial.png', fullPage: true });
  console.log('✅ Initial page loaded');

  // List all buttons to find the code style button
  const buttons = await page.locator('button').all();
  console.log(`\nFound ${buttons.length} buttons:`);
  for (let i = 0; i < buttons.length; i++) {
    const text = await buttons[i].innerText();
    console.log(`  ${i + 1}. "${text}"`);
  }

  // Try to find code style button by various selectors
  let codeStyleButton = null;

  // Try different selectors
  const selectors = [
    'button:has-text("代码样式")',
    'button:has-text("Code Style")',
    'button:has-text("style")',
    '[data-testid="code-style-button"]',
    'button[aria-label*="style"]',
    'button[aria-label*="代码"]'
  ];

  for (const selector of selectors) {
    const btn = page.locator(selector).first();
    if (await btn.count() > 0) {
      codeStyleButton = btn;
      console.log(`\n✅ Found code style button with selector: ${selector}`);
      break;
    }
  }

  if (!codeStyleButton) {
    // Look for buttons with specific icons
    console.log('\nLooking for buttons with code-related icons...');
    const buttonHTMLs = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      return Array.from(buttons).map(btn => ({
        text: btn.innerText,
        html: btn.innerHTML.substring(0, 200)
      }));
    });

    for (const btn of buttonHTMLs) {
      if (btn.html.includes('code') || btn.html.includes('Code')) {
        console.log(`Potential button: "${btn.text}"`);
        console.log(`  HTML: ${btn.html}`);
      }
    }

    // Take screenshot for debugging
    await page.screenshot({ path: '/tmp/02_debug.png', fullPage: true });
    console.log('\n📸 Debug screenshot saved to /tmp/02_debug.png');
  } else {
    await codeStyleButton.click();
    await page.waitForTimeout(500);
    console.log('✅ Clicked code style button');

    // Wait for modal to appear
    await page.waitForSelector('.theme-picker-modal', { timeout: 5000 });
    await page.waitForTimeout(500);

    // Take screenshot of the modal
    await page.screenshot({ path: '/tmp/02_code_style_modal.png', fullPage: true });
    console.log('✅ Code style modal opened');

    // Get all code style cards
    const cards = await page.locator('.theme-card').all();
    console.log(`\n✅ Found ${cards.length} code style cards`);

    // Check each card's preview element
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      const cardName = await card.locator('.theme-card-name').innerText();
      const preview = card.locator('.code-style-preview');

      // Check if shadow root exists and has content
      const shadowInfo = await preview.evaluate(el => {
        if (el.shadowRoot) {
          const style = el.shadowRoot.querySelector('style');
          const pre = el.shadowRoot.querySelector('pre');
          return {
            hasShadowRoot: true,
            hasStyle: !!style,
            hasPre: !!pre,
            styleLength: style ? style.textContent.length : 0,
            preHTML: pre ? pre.innerHTML.substring(0, 100) : ''
          };
        }
        return { hasShadowRoot: false };
      });

      console.log(`\nCard ${i + 1}: ${cardName}`);
      console.log(`  Has Shadow DOM: ${shadowInfo.hasShadowRoot}`);
      if (shadowInfo.hasShadowRoot) {
        console.log(`  Has <style>: ${shadowInfo.hasStyle}`);
        console.log(`  Has <pre>: ${shadowInfo.hasPre}`);
        console.log(`  Style length: ${shadowInfo.styleLength} chars`);
      }
    }

    // Take a focused screenshot of just the modal
    const modal = page.locator('.theme-picker-modal');
    await modal.screenshot({ path: '/tmp/03_modal_focused.png' });
    console.log('\n✅ Saved focused modal screenshot');
  }

  await browser.close();
}

main().then(() => {
  console.log('\n📸 Test completed');
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
