import socket
from ipaddress import ip_address
from urllib.parse import urlparse
import requests
from pprint import pprint
import re


class Analytics:

    def __init__(self, get_response):
        self.get_response = get_response


    def __call__(self, request):
        
        try:
            referer = request.headers.get("Referer")
            
            if referer and self.safe_url(referer):
                r = requests.get(referer, allow_redirects=False, timeout=5)

                if r.status_code == 308 and self.safe_url(r.headers['Location']):
                    r = requests.get(r.headers['Location'], timeout=5)
                    print("\n[LOG] Referer analysis result:")
                    pprint(self.analyze_html(r.text), indent=3)

        except Exception as e:
            print(f"[ERROR] Unknon error occured: {e}")

        return self.get_response(request)


    def safe_url(self, url: str) -> bool:
        try:
            url = urlparse(url)
            ip = socket.gethostbyname(url.hostname)
            return not ip_address(ip).is_private

        except Exception:
            return False

    
    def analyze_html(self, html: str) -> dict:
        tags = re.findall(r"<\s*([a-zA-Z0-9]+)", html)
        scripts = html.lower().count("<script")
        forms = html.lower().count("<form")
        inputs = html.lower().count("<input")
        anchors = html.lower().count("<a")
        seo_score = min(100, len(html) // 150 + forms * 5 + anchors * 15)

        return {
            "length": len(html),
            "tags": len(set(tags)),
            "forms": forms,
            "inputs": inputs,
            "scripts": scripts,
            "seo_score": seo_score,
        }
