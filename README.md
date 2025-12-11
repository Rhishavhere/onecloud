# OneCloud: Personal Cloud Server and API

![PYTHON](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white) ![FLASK](https://img.shields.io/badge/Flask-671ddf?style=for-the-badge&logo=flask&logoColor=white) ![OS](https://img.shields.io/badge/Windows%20%7C%20Linux-green?style=for-the-badge&logo=linux&logoColor=white) ![CLOUDFLARED](https://img.shields.io/badge/Cloudflare%20Tunnel-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)


**OneCloud** is a personal cloud backend that gives you real-time insights and control over your devices.

`It acts as the central hub for your personal cloud, enabling system monitoring, AI-assisted queries, and remote operations — securely accessible from anywhere.`

`The backend leverages Flask APIs and Cloudflare Tunnel for secure access, even behind NAT or firewalls.`


With **OneCloud**, you can:

- Monitor multiple devices in real time
- View detailed system metrics
- Capture screenshots remotely
- Perform control actions like shutdown/reboot
- Chat with an AI assistant about your system
- Keep your devices safe with token-based authentication

---

## Frontend ( _separate repo_ )

The **OneCloud Backend** works together with the **OneCloud Frontend** to give you a full dashboard experience.
The frontend is a separate project and can be found here:
[**Frontend Repo → github.com/Rhishavhere/mydesk.app**](https://github.com/Rhishavhere/mydesk.app)

---

## Architecture

OneCloud consists of:

1. **Backend API (This Project)**
   Runs on each monitored device, collecting metrics and handling control actions.

2. **Frontend Dashboard**
   A separate React/TypeScript project that consumes this API and displays a beautiful dashboard (see link above).

---

## Cloudflare Tunnel Integration

Cloudflare Tunnel securely connects your devices to the internet without opening ports.

When a request is made to your domain (e.g., `https://your-domain.com`), Cloudflare routes it through a secure outbound-only tunnel to your API.

**Benefits:**
- 🔒 **No open ports** — safer by design
- ⚡ **Simpler setup** — no complex networking configs
- 📜 **TLS by default** — automatic HTTPS
- 🛡 **DDoS Protection** — Cloudflare shields your API

---

## Platform-Specific Note

OneCloud supports both **Windows** and **Linux (Fedora)** environments with separate API scripts:
- **Windows** → `api_win.py` → exposes `/desktop/*` endpoints
- **Linux (Fedora)** → `api_linux.py` → exposes `/laptop/*` endpoints

_Update the exposed endpoints to match your device preferences._

Simply run the script for your OS and tunnel it using Cloudflare Tunnel to your chosen public hostname.
Example:
- Desktop: `https://your-domain.com/desktop/system/overview`
- Laptop: `https://your-domain.com/laptop/system/overview`

---

## API Endpoints

### 🖥 System Information

| Endpoint | Method | Description |
|----------|--------|-------------|
| ![/status](https://img.shields.io/badge/-/status-green) | ![GET](https://img.shields.io/badge/GET-blue) | Quick overview: OS, hostname, uptime |
| ![/system/overview](https://img.shields.io/badge/-/system/overview-blue) | ![GET](https://img.shields.io/badge/GET-blue) | Full CPU, memory, disk, network, battery, temp |
| ![/system/cpu](https://img.shields.io/badge/-/system/cpu-orange) | ![GET](https://img.shields.io/badge/GET-blue) | Detailed CPU stats |
| ![/system/memory](https://img.shields.io/badge/-/system/memory-yellow) | ![GET](https://img.shields.io/badge/GET-blue) | Memory + swap usage |
| ![/system/disk](https://img.shields.io/badge/-/system/disk-lightgrey) | ![GET](https://img.shields.io/badge/GET-blue) | Disk partitions & I/O |
| ![/system/network](https://img.shields.io/badge/-/system/network-purple) | ![GET](https://img.shields.io/badge/GET-blue) | Interfaces, I/O, connections |
| ![/system/processes](https://img.shields.io/badge/-/system/processes-red) | ![GET](https://img.shields.io/badge/GET-blue) | Running processes info |
| ![/system/battery](https://img.shields.io/badge/-/system/battery-brightgreen) | ![GET](https://img.shields.io/badge/GET-blue) | Battery status |
| ![/system/temperature](https://img.shields.io/badge/-/system/temperature-lightblue) | ![GET](https://img.shields.io/badge/GET-blue) | Temperature readings |
| ![/system/users](https://img.shields.io/badge/-/system/users-grey) | ![GET](https://img.shields.io/badge/GET-blue) | Logged-in users |
| ![/system/services](https://img.shields.io/badge/-/system/services-pink) | ![GET](https://img.shields.io/badge/GET-blue) | Windows services |
| ![/system/metrics/history](https://img.shields.io/badge/-/system/metrics/history-9cf) | ![GET](https://img.shields.io/badge/GET-blue) | Historical CPU/mem/network usage |

---

### 🛠 System Control

| Endpoint | Method | Description |
|----------|--------|-------------|
| ![/system/screenshot](https://img.shields.io/badge/-/system/screenshot-blueviolet) | ![GET](https://img.shields.io/badge/GET-blue) | Capture current screen |
| ![/system/control/shutdown](https://img.shields.io/badge/-/system/control/shutdown-red) | ![POST](https://img.shields.io/badge/POST-orange) | Schedule shutdown |
| ![/system/control/reboot](https://img.shields.io/badge/-/system/control/reboot-orange) | ![POST](https://img.shields.io/badge/POST-orange) | Schedule reboot |
| ![/system/control/cancel-shutdown](https://img.shields.io/badge/-/system/control/cancel--shutdown-green) | ![POST](https://img.shields.io/badge/POST-orange) | Cancel shutdown/reboot |
| ![/laptop/camera/capture](https://img.shields.io/badge/-/camera/capture-ff69b4) | ![GET](https://img.shields.io/badge/GET-blue) | Capture image from webcam and return as PNG |

---

### 🎮 Remote Desktop & Input

| Endpoint | Method | Description |
|----------|--------|-------------|
| ![/desktop/livestream](https://img.shields.io/badge/-/desktop/livestream-red) | ![GET](https://img.shields.io/badge/GET-blue) | MJPEG video stream of the desktop |
| ![/desktop/mapping](https://img.shields.io/badge/-/desktop/mapping-blueviolet) | ![POST](https://img.shields.io/badge/POST-orange) | Control mouse/keyboard actions |



---

### 🤖 AI Integration

| Endpoint | Method | Description |
|----------|--------|-------------|
| ![/ai/chat](https://img.shields.io/badge/-/ai/chat-lightgreen) | ![POST](https://img.shields.io/badge/POST-orange) | Chat with your devices using Google Gemini AI |

---

### ❤️ Health Check

| Endpoint | Method | Description |
|----------|--------|-------------|
| ![/health](https://img.shields.io/badge/-/health-success) | ![GET](https://img.shields.io/badge/GET-blue) | API health status |

---

## Endpoint Parameters

### `/system/processes` (GET)
- `limit` *(int)* — number of processes to return (default: 20)
- `sort` *(string)* — sort by `memory`, `cpu`, `name`, or `pid` (default: `memory`)

**Example:**
```bash
GET /desktop/system/processes?limit=10&sort=cpu
```

---

### `/system/screenshot` (GET)
- `width` *(int)* — resize image width before returning
- `height` *(int)* — resize image height before returning
- `quality` *(int)* — image quality (default: 95)

**Example:**
```bash
GET /desktop/system/screenshot?width=800&height=600&quality=80
```

---

### `/ai/chat` (POST)
- `query` *(string)* — natural language question or command
- `include_screenshot` *(bool)* — if true, attaches a screenshot for AI context
**Body:**
{
  "query": "Describe the system status",
  "include_screenshot": true
}
```

---

### `/desktop/livestream` (GET)
- `fps` *(int)* — frames per second (default: 15, max: 30)
- `quality` *(int)* — JPEG quality 1-100 (default: 70)
- `scale` *(float)* — resolution scale 0.1-1.0 (default: 0.5)
- `cursor` *(string)* — `crosshair`, `simple`, or `none`

**Example:**
```bash
https://your-domain.com/desktop/livestream?fps=20&quality=80&scale=0.75
```

---

### `/desktop/mapping` (POST)
Control the mouse remotely. Requires `Authorization` header.

**Body (Move):**
```json
{
  "action": "move",
  "x": 0.5,     // 0.0 to 1.0 (normalized)
  "y": 0.5,
  "normalized": true
}
```

**Body (Click/Tap):**
```json
{
  "action": "tap", // or 'doubletap', 'rightclick'
  "x": 0.5,
  "y": 0.5
}
```

**Body (Scroll):**
```json
{
  "action": "scroll",
  "delta": 200 // positive = up, negative = down
}
```




## Setup

### Prerequisites
- Python 3.8+
- Cloudflare account + `cloudflared` tunnel
- Cloudflare account + `cloudflared` tunnel
- Google Gemini API key
- (`mss` is recommended for faster screen capture, installed via requirements)

### Install & Run
```bash
# Create venv & install deps
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create .env
echo "GEMINI_API_KEY=your_gemini_key" >> .env
echo "CONTROL_TOKEN=your_secure_token" >> .env

# Start API
python api_win.py   # for Windows
# or
python api_linux.py # for Linux (Fedora)

---
```

### Expose API via Cloudflare Tunnel

1. **Install Cloudflare Tunnel CLI** (`cloudflared`):
   [Installation Guide → Cloudflare Docs](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation)

2. **Authenticate with Cloudflare**:
```bash
cloudflared login
```

3. **Create a tunnel** (replace `<YOUR_TUNNEL_NAME>` with a name you choose):
```bash
cloudflared tunnel create <YOUR_TUNNEL_NAME>
```

4. **Configure the tunnel** by creating `~/.cloudflared/config.yml`:
```yaml
tunnel: <YOUR_TUNNEL_UUID>
credentials-file: /home/user/.cloudflared/<YOUR_TUNNEL_UUID>.json

# Change hostname to your Cloudflare domain/subdomain
hostname: your-domain.com
service: http://localhost:5000
```

5. **Run the tunnel**:
```bash
cloudflared tunnel run <YOUR_TUNNEL_NAME>
```

---

Once the tunnel is running, your API will be available at:
- **Desktop**: `https://your-domain.com/desktop/*`
- **Laptop**: `https://your-domain.com/laptop/*`

---

## Security Tips
- Use **strong, unique tokens** in `.env`
- Always access via HTTPS (Cloudflare provides this)
- Keep dependencies updated

---