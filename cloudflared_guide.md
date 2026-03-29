# Accessing the PC Remote from your Phone Using Cloudflared

To trigger actions from outside your local network, you can use Cloudflare Tunnels (`cloudflared`).

## Setup Steps

1. **Install Cloudflared**:
   Download the windows executable `cloudflared.exe` from the official [Cloudflare repository](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/).

2. **Start your FastAPI Server**:
   Ensure you run the backend on port 8000:
   ```cmd
   cd path\to\pc_remote
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```

3. **Run a Quick Tunnel**:
   Open a new terminal or command prompt in the folder with `cloudflared.exe` and execute:
   ```cmd
   cloudflared tunnel --url http://127.0.0.1:8000
   ```

4. **Access on your Phone**:
   In the terminal output, `cloudflared` will generate a public `.trycloudflare.com` URL. Use your iPhone's browser to visit that URL to safely control your PC!

> [!WARNING]
> Because quick tunnels are public, anyone with the link can shut down your PC! Consider adding Basic Authentication or using a persistent tunnel with Cloudflare Access for a secure, restricted setup in production.
