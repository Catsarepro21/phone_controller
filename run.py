import subprocess
import json
import os
import sys

def main():
    print("Initializing PC Remote...")
    domain = None
    
    # Try to auto-detect Tailscale domain for THIS specific computer
    try:
        print("Checking Tailscale status...")
        result = subprocess.run(["tailscale", "status", "--json"], capture_output=True, text=True, check=True)
        status = json.loads(result.stdout)
        cert_domains = status.get("CertDomains", [])
        if cert_domains:
            domain = cert_domains[0]
            print(f"Found Tailscale Domain: {domain}")
    except Exception as e:
        print("Tailscale is not running or not installed. Falling back to HTTP.")

    ssl_args = []
    
    # Gen certificates if we have a domain
    if domain:
        key_file = f"{domain}.key"
        crt_file = f"{domain}.crt"
        
        # If the keys don't exist for this exact computer, generate them automatically!
        if not os.path.exists(key_file) or not os.path.exists(crt_file):
            print(f"Generating SSL certificates for {domain}...")
            subprocess.run(["tailscale", "cert", domain])
            
        if os.path.exists(key_file) and os.path.exists(crt_file):
            print("Running securely over HTTPS!")
            ssl_args = ["--ssl-keyfile", key_file, "--ssl-certfile", crt_file]
        else:
            print("WARNING: Could not generate certificates. Make sure HTTPS is enabled in the Tailscale Admin panel.")
            print("Falling back to HTTP.")

    # Start Uvicorn dynamically
    cmd = [sys.executable, "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"] + ssl_args
    print(f"Executing: {' '.join(cmd)}")
    subprocess.run(cmd)

if __name__ == "__main__":
    main()
