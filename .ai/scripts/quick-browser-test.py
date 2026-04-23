#!/usr/bin/env python3
"""
browser-use + GLM-5 测试（使用 ChatOpenAI 兼容模式）
"""

import asyncio
import os
from browser_use import Agent
from langchain_openai import ChatOpenAI

# ============ 配置 ============
GLM_API_KEY = "697e4a18cc904043a768c421f6b26f1b.D5DLxHV4lKXSSnjl"
GLM_BASE_URL = "https://open.bigmodel.cn/api/paas/v4"

async def quick_test():
    """快速测试"""
    
    print("=" * 60)
    print("🧪 browser-use + GLM-5 测试")
    print("=" * 60)
    
    # 使用 ChatOpenAI 兼容模式连接 GLM-5
    print("\n📋 初始化 GLM-5...")
    llm = ChatOpenAI(
        model="glm-5",
        openai_api_key=GLM_API_KEY,
        openai_api_base=GLM_BASE_URL,
        temperature=0.7
    )
    print("✅ GLM-5 初始化成功")
    
    # 测试任务
    task = "访问 Bing 搜索引擎，搜索 'OpenClaw AI'，告诉我第一个搜索结果的标题"
    
    print(f"\n🎯 任务: {task}")
    print("-" * 60)
    
    try:
        agent = Agent(
            task=task,
            llm=llm
        )
        
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

if __name__ == "__main__":
    asyncio.run(quick_test())
