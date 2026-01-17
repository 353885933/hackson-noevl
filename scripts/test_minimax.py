import requests
import json

API_KEY = "sk-api-5F9clT5l7pBYFJpGL_5vP3fEGmVhFwCZj3oKHDrnT9NoaRZFtbI15SOlK7eaDK2nPkHm6rG4mXujjVJoTMV4lZ3goxytqUiiLFXkMuWLQjCA63QuStQqufg"
URL = "https://api.minimaxi.com/v1/image_generation"

def test_minimax():
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "prompt": "A cyberpunk city",
        "model": "image-01",
        "n": 1
    }
    
    print("Testing Minimax...")
    resp = requests.post(URL, headers=headers, json=payload)
    print(f"Status: {resp.status_code}")
    print("Response:", resp.text[:200])

if __name__ == "__main__":
    test_minimax()
