import os
import requests
import json
import time

# Use the key from .env.local
API_KEY = "sk-1688774835994318b23cbce4026bf1a9"

def test_wanx():
    url = "https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis"
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
        "X-DashScope-Async": "enable"
    }
    
    payload = {
        "model": "wanx-v1",
        "input": {
            "prompt": "A beautiful sunset over a cyberpunk city",
            "negative_prompt": "low quality"
        },
        "parameters": {
            "style": "<auto>",
            "size": "1280*720",
            "n": 1
        }
    }
    
    print(f"Testing Aliyun WanX with Key: {API_KEY[:6]}...")
    
    try:
        # 1. Submit
        resp = requests.post(url, headers=headers, json=payload)
        print(f"Submit Status: {resp.status_code}")
        
        if resp.status_code != 200:
            print("Submit Failed:", resp.text)
            return

        data = resp.json()
        print("Submit Response:", json.dumps(data, indent=2))
        
        task_id = data['output']['task_id']
        print(f"Task ID: {task_id}")
        
        # 2. Poll
        task_url = f"{url}/tasks/{task_id}"
        
        for i in range(10):
            time.sleep(2)
            res = requests.get(task_url, headers=headers)
            task_data = res.json()
            status = task_data['output']['task_status']
            print(f"Polling {i}: {status}")
            
            if status == 'SUCCEEDED':
                print("Image URL:", task_data['output']['results'][0]['url'])
                return
            elif status == 'FAILED':
                print("Task Failed:", task_data['output']['message'])
                return
                
    except Exception as e:
        print("Exception:", e)

if __name__ == "__main__":
    test_wanx()
