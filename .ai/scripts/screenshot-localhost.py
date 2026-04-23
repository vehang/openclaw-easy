#!/usr/bin/env python3
"""截图 localhost:5173"""

import asyncio
import sys
from playwright.async_api import async_playwright

async def screenshot():
    url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:5173"
    output = sys.argv[2] if len(sys.argv) > 2 else "/tmp/screenshot.png"

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={'width': 1400, 'height': 900})
        await page.goto(url, timeout=15000)
        await page.wait_for_timeout(2000)  # 等待页面加载
        await page.screenshot(path=output, full_page=False)
        print(output)
        await browser.close()

asyncio.run(screenshot())
