import requests

url = "http://localhost:8000/api/chat"
data = {
    "message": "hi",
    "mode": "short",
    "history": []
}

try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error: {e}")
