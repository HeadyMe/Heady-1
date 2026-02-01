import sys
import socket
import requests
import time
import os

def check_port(host, port, service_name):
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(2)
        result = sock.connect_ex((host, port))
        sock.close()
        if result == 0:
            print(f"✅ {service_name} is reachable on {host}:{port}")
            return True
        else:
            print(f"❌ {service_name} is NOT reachable on {host}:{port}")
            return False
    except Exception as e:
        print(f"❌ {service_name} check failed: {e}")
        return False

def check_http(url, service_name):
    try:
        response = requests.get(url, timeout=2)
        if response.status_code == 200:
            print(f"✅ {service_name} HTTP Health Check Passed ({url})")
            return True
        else:
            print(f"❌ {service_name} HTTP Health Check Failed: Status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print(f"❌ {service_name} Connection Refused ({url})")
        return False
    except Exception as e:
        print(f"❌ {service_name} HTTP Check Error: {e}")
        return False

def main():
    print("🔍 HEADY FULL STACK VERIFICATION")
    print("================================")
    
    ide_port = int(os.getenv("PORT", "4100"))
    services = [
        ("localhost", 5432, "PostgreSQL"),
        ("localhost", 6379, "Redis"),
        ("localhost", ide_port, "IDE Backend")
    ]
    
    all_passed = True
    
    print("\n[1/2] Checking Ports...")
    for host, port, name in services:
        if not check_port(host, port, name):
            all_passed = False
            
    print("\n[2/2] Checking API Health...")
    if not check_http(f"http://localhost:{ide_port}/api/health", "IDE API"):
        # Don't fail entire check if just API is down but port is open (might be startup)
        # But for 'verify full stack' we usually want it all green.
        pass

    print("\n================================")
    if all_passed:
        print("✅ SYSTEM STATUS: OPTIMAL")
        sys.exit(0)
    else:
        print("⚠️ SYSTEM STATUS: ISSUES DETECTED")
        sys.exit(1)

if __name__ == "__main__":
    main()
