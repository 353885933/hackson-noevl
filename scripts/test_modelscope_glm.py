#!/usr/bin/env python3
"""
ModelScope GLM-4.7 API 测试脚本
使用 OpenAI SDK 调用 ModelScope 的 GLM-4.7 模型
"""

import os
from openai import OpenAI

# 从环境变量读取 API Key，如果不存在则使用默认值
MODELSCOPE_API_KEY = os.getenv("MODELSCOPE_API_KEY", "")

def create_client():
    """创建 ModelScope OpenAI 兼容客户端"""
    if not MODELSCOPE_API_KEY:
        raise ValueError("请设置 MODELSCOPE_API_KEY 环境变量")

    return OpenAI(
        base_url='https://api-inference.modelscope.cn/v1',
        api_key=MODELSCOPE_API_KEY,
    )

def chat_stream(user_message: str, system_prompt: str = "You are a helpful assistant."):
    """流式对话"""
    client = create_client()

    response = client.chat.completions.create(
        model='ZhipuAI/GLM-4.7',
        messages=[
            {'role': 'system', 'content': system_prompt},
            {'role': 'user', 'content': user_message}
        ],
        stream=True
    )

    for chunk in response:
        if chunk.choices:
            content = chunk.choices[0].delta.content
            if content:
                print(content, end='', flush=True)
    print()  # 换行

def chat(user_message: str, system_prompt: str = "You are a helpful assistant.") -> str:
    """非流式对话"""
    client = create_client()

    response = client.chat.completions.create(
        model='ZhipuAI/GLM-4.7',
        messages=[
            {'role': 'system', 'content': system_prompt},
            {'role': 'user', 'content': user_message}
        ],
        stream=False
    )

    return response.choices[0].message.content

if __name__ == "__main__":
    print("=== ModelScope GLM-4.7 API 测试 ===\n")
    print("发送消息: 你好\n")
    print("回复: ", end="")
    chat_stream("你好")
