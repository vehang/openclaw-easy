#!/usr/bin/env python3
"""
简单测试 GLM-5 API 连接
"""

import json
import urllib.request

API_KEY = "697e4a18cc904043a768c421f6b26f1b.D5DLxHV4lKXSSnjl"
URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions"

def test_glm5():
    """测试 GLM-5 API"""
    
    data = {
        "model": "glm-5",
        "messages": [
            {"role": "user", "content": "你好，请用一句话介绍你自己"}
        ]
    }
    
    req = urllib.request.Request(
        URL,
        data=json.dumps(data).encode('utf-8'),
        headers={
            'Authorization': f'Bearer {API_KEY}',
            'Content-Type': 'application/json'
        }
    )
    
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            result = json.loads(response.read().decode('utf-8'))
            print("✅ GLM-5 API 测试成功")
            print("\n📝 回复：")
            print(result['choices'][0]['message']['content'])
    except Exception as e:
        print(f"❌ 测试失败: {e}")

if __name__ == "__main__":
    print("=" * 60)
    print("🧪 GLM-5 API 连接测试")
    print("=" * 60)
    test_glm5()
