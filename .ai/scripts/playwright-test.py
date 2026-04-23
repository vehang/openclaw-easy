#!/usr/bin/env python3
"""
Playwright 浏览器自动化测试（简化版）
"""

import asyncio
import os
from playwright.async_api import async_playwright

async def quick_browser_test():
    """快速浏览器测试"""
    
    # 截图保存路径（workspace 目录）
    screenshot_dir = os.path.expanduser("~/.openclaw/workspace/screenshots")
    os.makedirs(screenshot_dir, exist_ok=True)
    
    print("=" * 60)
    print("🧪 Playwright 浏览器自动化测试")
    print("=" * 60)
    
    async with async_playwright() as p:
        # 启动浏览器（无头模式）
        print("\n🚀 启动浏览器...")
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        # 测试 1：访问 GitHub
        print("\n📋 测试 1：访问 GitHub")
        await page.goto('https://github.com', timeout=15000)
        title = await page.title()
        print(f"✅ 页面标题: {title}")
        
        # 测试 2：访问百度
        print("\n📋 测试 2：访问百度")
        await page.goto('https://www.baidu.com', timeout=15000)
        title = await page.title()
        print(f"✅ 页面标题: {title}")
        
        # 测试 3：访问智谱 AI
        print("\n📋 测试 3：访问智谱 AI")
        await page.goto('https://www.zhipuai.cn', timeout=15000)
        title = await page.title()
        print(f"✅ 页面标题: {title}")
        
        # 测试 4：截图
        print("\n📋 测试 4：截图测试")
        await page.goto('https://github.com', timeout=15000)
        screenshot_path = os.path.join(screenshot_dir, "github-screenshot.png")
        await page.screenshot(path=screenshot_path)
        print(f"✅ 截图已保存: {screenshot_path}")
        
        # 关闭浏览器
        await browser.close()
    
    print("\n" + "=" * 60)
    print("✅ 测试完成")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(quick_browser_test())
