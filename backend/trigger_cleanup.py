import requests
print(requests.get("http://localhost:8000/api/cleanup-students").json())
