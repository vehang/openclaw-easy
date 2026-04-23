from playwright.sync_api import sync_playwright
import os

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1920, 'height': 1080})

    # 导航到页面
    page.goto('http://localhost:5173/')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(2000)  # 额外等待确保完全渲染

    # 1. 截取整体页面（白天模式）
    page.screenshot(path='/tmp/screenshot_full_light.png', full_page=False)
    print("截图1: 整体页面（白天模式）已保存")

    # 2. 切换到黑夜模式
    theme_toggle = page.locator('.theme-toggle-btn')
    if theme_toggle.count() > 0:
        theme_toggle.click()
        page.wait_for_timeout(1000)
        page.screenshot(path='/tmp/screenshot_full_dark.png', full_page=False)
        print("截图2: 整体页面（黑夜模式）已保存")

    # 3. 滚动到代码块区域并截图
    code_section = page.locator('.mp-preview').first
    if code_section.count() > 0:
        # 滚动到预览区域
        code_section.scroll_into_view_if_needed()
        page.wait_for_timeout(500)

        # 截取预览区域（包含代码块）
        code_section.screenshot(path='/tmp/screenshot_code_area.png')
        print("截图3: 代码区域已保存")

    # 4. 切换代码主题并截图
    code_style_select = page.locator('select').nth(1)  # 第二个 select 是代码风格
    if code_style_select.count() > 0:
        # 选择 GitHub Light 主题
        code_style_select.select_option('github')
        page.wait_for_timeout(1500)

        # 截取代码块
        if code_section.count() > 0:
            code_section.screenshot(path='/tmp/screenshot_code_github_light.png')
            print("截图4: GitHub Light 代码主题已保存")

        # 选择 Monokai 主题
        code_style_select.select_option('monokai')
        page.wait_for_timeout(1500)

        if code_section.count() > 0:
            code_section.screenshot(path='/tmp/screenshot_code_monokai.png')
            print("截图5: Monokai 代码主题已保存")

    browser.close()
    print("\n所有截图已完成！")
