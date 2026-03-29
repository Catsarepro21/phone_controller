# Using Tailscale for your PC Remote

Tailscale creates a secure, private network (a "mesh VPN") between your devices. This means your PC Remote server will be accessible *only* to devices logged into your Tailscale account, keeping it completely hidden from the public internet.

## Setup Steps

### 1. Install Tailscale on your PC
1. Go to [tailscale.com/download](https://tailscale.com/download) and download the Windows installer.
2. Install and launch it. 
3. Click the Tailscale icon in your Windows system tray (near the clock) and log in with your GitHub, Google, or Microsoft account.

### 2. Install Tailscale on your Phone
1. Download the **Tailscale app** from the iOS App Store or Google Play Store.
2. Open it and log in with the **exact same account** you used on your PC.
3. Accept the prompt to allow Tailscale to add VPN configurations to your phone.

### 3. Get your PC's Private IP Address
1. On your PC, click the Tailscale icon in the system tray.
2. You will see an IP address at the top of the menu (it usually starts with `100.x.x.x`). Click it to copy it.
   - *Alternatively, open the Tailscale app on your phone, and you will see your PC listed there with its IP address next to it.*

### 4. Connect to your Dashboard
1. Ensure your FastAPI server is running (`start_server_silent.bat` or `start_server.bat`).
2. Disconnect your phone from Wi-Fi (to prove it works over cellular!) and make sure the VPN icon appears at the top of your phone screen.
3. Open your phone's browser and go to `http://100.x.x.x:8000` (replace with your PC's copied Tailscale IP).
4. **Done!** You can now add this URL permanently to your PC Remote dashboard as a new PC!

## Managing Multiple PCs
To add another PC:
1. Install Tailscale on the second PC and log in.
2. Copy its unique `100.x.x.x` IP address.
3. Run the server using `start_server_silent.bat` on the new PC.
4. On your phone's dashboard, click "+ Add PC" and enter the new URL: `http://100.y.y.y:8000`.
