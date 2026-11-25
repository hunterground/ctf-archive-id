#!/usr/bin/env python3
"""
Test chat endpoint dengan tema Roblox
"""
import socket
import json

def send_raw_http(host, port, request):
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(10)
        sock.connect((host, port))
        sock.send(request.encode())
        
        response = b""
        while True:
            try:
                chunk = sock.recv(4096)
                if not chunk:
                    break
                response += chunk
                if b"\r\n\r\n" in response:
                    break
            except socket.timeout:
                break
        
        sock.close()
        return response.decode('utf-8', errors='ignore')
    except Exception as e:
        return f"Error: {e}"

def test_chat_endpoint():
    print("🎮 Testing Roblox-themed chat endpoints...\n")
    
    # Get developer token first
    print("1. Getting developer token...")
    request1 = "GET /api/v1/get_ticket# HTTP/1.1\r\nHost: localhost:3000\r\nConnection: close\r\n\r\n"
    response1 = send_raw_http('localhost', 3000, request1)
    
    if "200 OK" in response1 and '{"developer_pass' in response1:
        json_start = response1.find('{"')
        json_end = response1.find('}', json_start) + 1
        json_response = response1[json_start:json_end]
        data = json.loads(json_response)
        token = data.get('developer_pass: ', data.get('ticket: '))
        print(f"✅ Token acquired: {token[:30]}...")
        
        # Test chat endpoint dengan token
        print("\n2. Testing chat endpoint dengan developer token...")
        request2 = f"GET /api/v1/chat/1 HTTP/1.1\r\nHost: localhost:3000\r\nAuthorization: {token}\r\nConnection: close\r\n\r\n"
        response2 = send_raw_http('localhost', 3000, request2)
        
        if "200 OK" in response2:
            print("✅ Chat endpoint accessible dengan developer token")
            
            # Extract and display chat content
            if '{' in response2:
                json_start = response2.find('{')
                json_part = response2[json_start:]
                try:
                    chat_data = json.loads(json_part.split('\n')[0])
                    print(f"📱 Chat ID: {chat_data.get('chat_id', 'N/A')}")
                    print("💬 Messages preview:")
                    messages = chat_data.get('messages', [])
                    for i, msg in enumerate(messages[:3]):  # Show first 3 messages
                        party = msg.get('party', 'Unknown')
                        content = msg.get('content', 'No content')
                        print(f"   [{party}]: {content}")
                    if len(messages) > 3:
                        print(f"   ... and {len(messages) - 3} more messages")
                except:
                    print("⚠️  Chat data format verification needed")
            
        else:
            print("❌ Chat endpoint failed")
            print(f"Response: {response2[:200]}...")
            
    else:
        print("❌ Failed to get developer token")

if __name__ == "__main__":
    test_chat_endpoint()