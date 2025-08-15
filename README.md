# OneCloud: Personal Cloud API & Backend Server

## Overview

**OneCloud** is a powerful personal cloud backend that gives you real-time insights and control over your devices.
It acts as the central hub for your personal cloud, enabling system monitoring, AI-assisted queries, and remote operations — securely accessible from anywhere.

The backend leverages Flask APIs and Cloudflare Tunnel for secure access, even behind NAT or firewalls.

With **OneCloud**, you can:

- Monitor multiple devices in real time
- View detailed system metrics
- Capture screenshots remotely
- Perform control actions like shutdown/reboot
- Chat with an AI assistant about your system
- Keep your devices safe with token-based authentication

---

## Frontend

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

When a request is made to your domain (e.g., `https://myspace.example.com`), Cloudflare routes it through a secure outbound-only tunnel to your API.

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

Simply run the script for your OS and tunnel it using Cloudflare Tunnel to your chosen public hostname.
Example:
- Windows: `https://myspace.example.com/desktop/system/overview`
- Linux: `https://myspace.example.com/laptop/system/overview`

---

## API Endpoints

### 🖥 System Information

| Endpoint | Method | Description |
|----------|--------|-------------|
| ![`/desktop/status`](https://img.shields.io/badge/endpoint-/desktop/status-green) | ![GET](https://img.shields.io/badge/GET-blue) | Quick overview: OS, hostname, uptime |
| ![`/desktop/system/overview`](https://img.shields.io/badge/endpoint-/desktop/system/overview-blue) | ![GET](https://img.shields.io/badge/GET-blue) | Full CPU, memory, disk, network, battery, temp |
| ![`/desktop/system/cpu`](https://img.shields.io/badge/endpoint-/desktop/system/cpu-orange) | ![GET](https://img.shields.io/badge/GET-blue) | Detailed CPU stats |
| ![`/desktop/system/memory`](https://img.shields.io/badge/endpoint-/desktop/system/memory-yellow) | ![GET](https://img.shields.io/badge/GET-blue) | Memory + swap usage |
| ![`/desktop/system/disk`](https://img.shields.io/badge/endpoint-/desktop/system/disk-lightgrey) | ![GET](https://img.shields.io/badge/GET-blue) | Disk partitions & I/O |
| ![`/desktop/system/network`](https://img.shields.io/badge/endpoint-/desktop/system/network-purple) | ![GET](https://img.shields.io/badge/GET-blue) | Interfaces, I/O, connections |
| ![`/desktop/system/processes`](https://img.shields.io/badge/endpoint-/desktop/system/processes-red) | ![GET](https://img.shields.io/badge/GET-blue) | Running processes info |
| ![`/desktop/system/battery`](https://img.shields.io/badge/endpoint-/desktop/system/battery-brightgreen) | ![GET](https://img.shields.io/badge/GET-blue) | Battery status |
| ![`/desktop/system/temperature`](https://img.shields.io/badge/endpoint-/desktop/system/temperature-lightblue) | ![GET](https://img.shields.io/badge/GET-blue) | Temperature readings |
| ![`/desktop/system/users`](https://img.shields.io/badge/endpoint-/desktop/system/users-grey) | ![GET](https://img.shields.io/badge/GET-blue) | Logged-in users |
| ![`/desktop/system/services`](https://img.shields.io/badge/endpoint-/desktop/system/services-pink) | ![GET](https://img.shields.io/badge/GET-blue) | Windows services |
| ![`/desktop/system/metrics/history`](https://img.shields.io/badge/endpoint-/desktop/system/metrics/history-9cf) | ![GET](https://img.shields.io/badge/GET-blue) | Historical CPU/mem/network usage |

---

### 🛠 System Control

| Endpoint | Method | Description |
|----------|--------|-------------|
| ![`/desktop/system/screenshot`](https://img.shields.io/badge/endpoint-/desktop/system/screenshot-blueviolet) | ![GET](https://img.shields.io/badge/GET-blue) | Capture current screen |
| ![`/desktop/system/control/shutdown`](https://img.shields.io/badge/endpoint-/desktop/system/control/shutdown-red) | ![POST](https://img.shields.io/badge/POST-orange) | Schedule shutdown |
| ![`/desktop/system/control/reboot`](https://img.shields.io/badge/endpoint-/desktop/system/control/reboot-orange) | ![POST](https://img.shields.io/badge/POST-orange) | Schedule reboot |
| ![`/desktop/system/control/cancel-shutdown`](https://img.shields.io/badge/endpoint-/desktop/system/control/cancel--shutdown-green) | ![POST](https://img.shields.io/badge/POST-orange) | Cancel shutdown/reboot |

---

### 🤖 AI Integration

| Endpoint | Method | Description |
|----------|--------|-------------|
| ![`/desktop/ai/chat`](https://img.shields.io/badge/endpoint-/desktop/ai/chat-lightgreen) | ![POST](https://img.shields.io/badge/POST-orange) | Chat with Google Gemini AI about your system |

---

### ❤️ Health Check

| Endpoint | Method | Description |
|----------|--------|-------------|
| ![`/desktop/health`](https://img.shields.io/badge/endpoint-/desktop/health-success) | ![GET](https://img.shields.io/badge/GET-blue) | API health status |

---

## Setup

### Prerequisites
- Python 3.8+
- Cloudflare account + `cloudflared` tunnel
- Google Gemini API key

### Install & Run
```bash
# Create venv & install deps
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create .env
echo "GEMINI_API_KEY=your_key" >> .env
echo "CONTROL_TOKEN=your_token" >> .env

# Start API
python api_win.py   # for Windows
# or
python api_linux.py # for Linux (Fedora)
