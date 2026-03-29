# 📱 PC Remote Controller

A lightweight, completely private self-hosted remote control for your Windows PC. 

This repository provides an invisible Python backend that binds to your private [Tailscale](https://tailscale.com) network, and a static universal dashboard you can host on GitHub Pages to control any number of your own PCs securely from an iPhone or Android device!

### Features
* 🔴 **Remote Shutdown, Sleep, and Lock**
* 📹 **Live Screen View** (Smooth MJPEG streaming direct from your PC)
* 🖱️ **Trackpad & Remote Keyboard** (Swipe to move your PC mouse, click, and type from your iPhone)
* 🎵 **Media Controls & App Launchers** (Play/Pause, Skip, Volume, Windows Key)
* 📈 **Live System Dashboard** (Monitors CPU and RAM usage in real-time)
* 📁 **Two-Way File Sharing** (Upload/Download directly to your default `Documents/Phone Uploads` folder)
* 🔐 **100% Private & Secure** (API relies entirely on Tailscale MagicDNS and HTTPS certificates; physically impossible for outsiders to access)

---

## 🚀 How to Install & Use Your Own

If you want to use this to control your own PC, follow these steps:

### Option A: Automatic Setup (Recommended)
1. Clone or download this repository to your Windows PC.
2. Right-click **`setup.bat`** and select **Run as Administrator**.
   *(This uses `winget` to automatically download and install Python 3, Tailscale, and the required Python packages).*
3. When setup finishes, click the **Tailscale icon** in your Windows taskbar and **Sign In**.
4. Go to the [Tailscale Admin DNS settings](https://login.tailscale.com/admin/dns), scroll down to **HTTPS Certificates**, and click **Enable**.
5. Finally, double-click **`start_server.bat`**.
   *(The script will automatically detect your Tailscale Domain, generate secure HTTPS certificates securely, and boot your isolated API).*

### Option B: Manual Setup (If Automatic Fails)
If you are on an older version of Windows or prefer to install things manually:
1. **[Install Python 3](https://www.python.org/downloads/)** from the official website (Make sure to check "Add Python to PATH" during installation).
2. **[Install Tailscale](https://tailscale.com/download)**, sign in with your account, and enable HTTPS Certificates in the [Admin DNS Panel](https://login.tailscale.com/admin/dns).
3. Open a Command Prompt as Administrator and manually open port 8000 by running:
   `netsh advfirewall firewall add rule name="PC Remote (Port 8000)" dir=in action=allow protocol=TCP localport=8000`
4. Open the `pc_remote` folder in the Command Prompt and install the dependencies:
   `pip install -r requirements.txt`
5. Double-click **`start_server.bat`** to boot the backend.

---

### 2. Phone Dashboard Setup
Because this project relies completely on local storage within the browser, there is **one universal app switcher dashboard** hosted publicly on GitHub Pages that anyone can use securely:

👉 **[Open the Universal Dashboard](https://catsarepro21.github.io/phone_controller)**

1. Install the Tailscale app on your phone and log in.
2. Open the GitHub Pages link above on your phone (and add it to your Home Screen!).
3. Tap **+ Add Device**.
4. Give it a name, and paste the exact *Tailscale Domain Name URL* that your PC terminal spit out when you launched the server. (e.g., `https://my-pc-name.tailxxxx.ts.net:8000`).
5. Save it, tap it, and boom! You now have a permanent remote control dedicated uniquely to your devices. 

---

### 🚀 Running Silently on Startup
The `setup.bat` script automatically creates a shortcut in your Windows Startup folder so that the `start_server_silent.bat` script launches automatically. This means the server will run completely invisibly in the background whenever your PC is turned on!

---

### 💡 Troubleshooting
If your phone says **"Offline"** or fails to connect even though Tailscale is connected, your Windows Firewall might be blocking port 8000!
To fix this manually:
1. Search Windows for **Command Prompt**, right-click it, and select **Run as Administrator**.
2. Paste this exact command and hit Enter:
   `netsh advfirewall firewall add rule name="PC Remote (Port 8000)" dir=in action=allow protocol=TCP localport=8000`
