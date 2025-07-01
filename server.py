#!/usr/bin/env python3
"""
Simple HTTP server for Aphorism Echo
Useful for testing on mobile devices and avoiding CORS issues
"""

import http.server
import socketserver
import webbrowser
import os
from urllib.parse import urlparse

PORT = 3000

class CORSHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

def main():
    # Change to the directory containing this script
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    with socketserver.TCPServer(("", PORT), CORSHTTPRequestHandler) as httpd:
        print(f"🚀 Aphorism Echo server running at:")
        print(f"   Local: http://localhost:{PORT}")
        print(f"   Network: http://{get_local_ip()}:{PORT}")
        print(f"\n📱 To test on mobile devices:")
        print(f"   1. Make sure your phone is on the same WiFi network")
        print(f"   2. Open the Network URL above on your phone")
        print(f"\n🛑 Press Ctrl+C to stop the server")
        
        # Open browser automatically
        webbrowser.open(f'http://localhost:{PORT}')
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print(f"\n👋 Server stopped")

def get_local_ip():
    """Get the local IP address for network access"""
    import socket
    try:
        # Connect to a remote address to determine local IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return "127.0.0.1"

if __name__ == "__main__":
    main() 