#!/usr/bin/env python3
"""
browser-use + GLM-5 测试脚本

安装依赖：
pip install browser-use langchain-community playwright

安装浏览器：
playwright install chromium

运行：
python browser-use-test.py
"""

import asyncio
import os
from browser_use import Agent
from langchain_community.chat_models import ChatZhipuAI

# ============ 配置 ============
GLM_API_KEY = "697e4a18cc904043a768c421f6b26f1b.D5DLxHV4lKXSSnjl"

# ============ 测试任务 ============
TEST_TASKS = [
    # 任务 1：简单搜索
    {
        "name": "Google 搜索测试",
        "task": "访问 Google，搜索 GLM-5，告诉我第一条结果"
    },
    
    # 任务 2：信息提取
    {
        "name": "GitHub 信息提取",
        "task": "访问 GitHub，搜索 OpenClaw，提取星标数最多的项目名称和星标数"
    },
    
    # 任务 3：数据采集
    {
        "name": "新闻采集",
        "task": "访问 Hacker News (news.ycombinator.com)，提取前 5 条新闻的标题"
    },
    
    # 任务 4：表单操作
    {
        "name": "搜索表单",
        "task": "访问 Bing，搜索 browser-use，告诉我第一个结果的标题和链接"
    }
]

async def test_browser_use():
    """测试 browser-use + GLM-5"""
    
    print("=" * 60)
    print("🤖 browser-use + GLM-5 测试")
    print("=" * 60)
    
    # 初始化 GLM-5
    print("\n📋 初始化 GLM-5...")
    llm = ChatZhipuAI(
        model="glm-5",
        api_key=GLM_API_KEY,
        temperature=0.7
    )
    print("✅ GLM-5 初始化成功")
    
    # 选择测试任务
    print("\n可用测试任务：")
    for i, task in enumerate(TEST_TASKS, 1):
        print(f"  {i}. {task['name']}")
    
    # 运行第一个任务
    task_choice = TEST_TASKS[0]
    print(f"\n🎯 执行任务: {task_choice['name']}")
    print(f"📝 任务描述: {task_choice['task']}")
    print("-" * 60)
    
    try:
        # 创建 agent
        agent = Agent(
            task=task_choice['task'],
            llm=llm,
            browser_config={
                "headless": False,  # 显示浏览器窗口
                "disable_security": True
            }
        )
        
        # 执行任务
        print("\n🚀 开始执行...")
        result = await agent.run()
        
        print("\n" + "=" * 60)
        print("✅ 执行完成")
        print("=" * 60)
        print(result)
        
    except Exception as e:
        print(f"\n❌ 执行失败: {e}")
        import traceback
        traceback.print_exc()

async def interactive_mode():
    """交互模式"""
    
    print("=" * 60)
    print("🤖 browser-use + GLM-5 交互模式")
    print("=" * 60)
    
    # 初始化 GLM-5
    llm = ChatZhipuAI(
        model="glm-5",
        api_key=GLM_API_KEY,
        temperature=0.7
    )
    
    while True:
        print("\n请输入任务（输入 'quit' 退出）：")
        task = input(">>> ").strip()
        
        if task.lower() in ['quit', 'exit', 'q']:
            print("👋 再见！")
            break
        
        if not task:
            continue
        
        try:
            print("\n🚀 执行中...")
            agent = Agent(task=task, llm=llm)
            result = await agent.run()
            print("\n✅ 结果：")
            print(result)
        except Exception as e:
            print(f"❌ 错误: {e}")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "--interactive":
        # 交互模式
        asyncio.run(interactive_mode())
    else:
        # 测试模式
        asyncio.run(test_browser_use())
