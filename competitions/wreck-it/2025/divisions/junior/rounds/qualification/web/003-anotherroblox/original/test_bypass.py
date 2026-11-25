#!/usr/bin/env python3
import requests

# Test HAProxy bypass
url = "http://localhost:3000/api/v1/get_ticket#"
print(f"Testing: {url}")

response = requests.get(url)
print(f"Status: {response.status_code}")
print(f"Response: {response.text}")

if response.status_code == 200:
    print("✅ HAProxy bypass WORKS!")
else:
    print("❌ HAProxy bypass failed")

# Test direct endpoint
print("\n" + "="*50)
print("Testing direct endpoint (expected to fail):")
url2 = "http://localhost:3000/api/v1/get_ticket"
response2 = requests.get(url2)
print(f"Status: {response2.status_code}")
print(f"Response: {response2.text[:100]}...")