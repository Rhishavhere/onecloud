# RhishDesk: Your Personal Cloud Management Dashboard

## Overview

RhishDesk is a sophisticated personal cloud management dashboard designed to provide real-time insights and control over your various devices. It acts as a central hub, allowing you to monitor system metrics, interact with an AI assistant, and manage your personal computing environment from anywhere. The project leverages a robust API and a Cloudflare tunnel to ensure secure and seamless access to your devices, even when they are behind a local network.

### Key Features:

-   **Real-time Device Monitoring**: Keep track of CPU usage, memory, uptime, and battery status for all your connected devices.
-   **AI-Powered Assistant**: Interact with an intelligent AI to query system information, troubleshoot issues, and perform tasks.
-   **Secure Remote Access**: Utilize Cloudflare Tunnel for secure, public-facing access to your local devices without opening firewall ports.
-   **Intuitive User Interface**: A clean and modern dashboard built with React and Tailwind CSS for an optimal user experience.
-   **Cross-Device Compatibility**: Monitor both desktop and laptop devices, with potential for expansion to other device types.

## Architecture

RhishDesk comprises two main components:

1.  **Frontend Application (`App`)**: A React-based web application that serves as the user interface. It fetches data from the backend API and presents it in an intuitive dashboard.
2.  **Backend API (`Api`)**: A Python-based API (e.g., `desktop.py`) running on each monitored device. This API collects system information and exposes it securely. The API is exposed to the internet via a Cloudflare Tunnel.

### Cloudflare Tunnel Integration

Cloudflare Tunnel creates a secure, outbound-only connection from your local network to Cloudflare's edge network. This eliminates the need to open inbound ports on your firewall, significantly enhancing security while providing reliable access to your local APIs from anywhere in the world. The `https://myspace.rhishav.com` endpoint serves as the public entry point for all API communication, routing requests securely to your devices.

## API Endpoints (Backend: `Api/desktop.py`)

The `Api/desktop.py` Flask application provides the following endpoints for system monitoring and control:

-   **`/system/overview`** (`GET`)
    -   **Description**: Retrieves a comprehensive overview of the system, including CPU, memory, disk, network, and process information.
-   **`/system/cpu`** (`GET`)
    -   **Description**: Provides detailed CPU information, such as physical/logical core counts, usage percentage, frequency, and load average.
-   **`/system/memory`** (`GET`)
    -   **Description**: Returns detailed memory (virtual and swap) usage statistics.
-   **`/system/disk`** (`GET`)
    -   **Description**: Fetches information about disk partitions and I/O statistics.
-   **`/system/network`** (`GET`)
    -   **Description**: Provides network interface details, I/O counters, and active connections.
-   **`/system/processes`** (`GET`)
    -   **Description**: Lists running processes with their details (PID, name, CPU/memory usage).
-   **`/system/battery`** (`GET`)
    -   **Description**: Returns battery status information (percentage, power plug status, time remaining).
-   **`/system/screenshot`** (`GET`)
    -   **Description**: Captures and returns a screenshot of the desktop.
-   **`/system/control/shutdown`** (`POST`)
    -   **Description**: Initiates a system shutdown.
-   **`/system/control/reboot`** (`POST`)
    -   **Description**: Initiates a system reboot.
-   **`/system/control/cancel-shutdown`** (`POST`)
    -   **Description**: Cancels a pending shutdown or reboot operation.
-   **`/ai/chat`** (`POST`)
    -   **Description**: Integrates with Google Gemini AI to process natural language queries about the system, optionally including a screenshot for context.
    -   **Request Body**: `{"query": "string", "include_screenshot": boolean}`
    -   **Response**: `{"ai_response": "string", "system_summary": { ... }}`
-   **`/status`** (`GET`)
    -   **Description**: A simple endpoint to check if the API is online and responsive.

## Project Setup

### Prerequisites

- Node.js & npm (recommended to install with [nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- Python 3 (for the backend API)
- Cloudflare account and `cloudflared` daemon (for tunneling)

### Getting Started

#### 1. Backend API Setup (on each device to be monitored)

Navigate to the `Api` directory and set up your Python environment:

```bash
cd Api
python -m venv venv
./venv/Scripts/activate  # On Windows
source venv/bin/activate # On macOS/Linux
pip install -r requirements.txt
```

Configure your `desktop.py` (or similar) script to collect the desired system metrics. Ensure it runs a web server (e.g., Flask, FastAPI) that exposes the system information.

#### 2. Cloudflare Tunnel Configuration

Install `cloudflared` on each device running the backend API. Authenticate `cloudflared` with your Cloudflare account and configure a tunnel to expose your local API server to a public Cloudflare hostname (e.g., `myspace.rhishav.com`).

Example `config.yml` for `cloudflared`:

```yaml
hostname: myspace.rhishav.com
service: http://localhost:5000 # Or whatever port your API runs on
tunnel: <YOUR_TUNNEL_UUID>
credentials-file: /path/to/your/credentials.json
```

Start the Cloudflare Tunnel:

```bash
cloudflared tunnel run <YOUR_TUNNEL_NAME>
```

#### 3. Frontend Application Setup

Navigate to the `App` directory:

```bash
cd App
npm install
npm run dev
```

The frontend application will start a development server, usually at `http://localhost:5173`. Open this URL in your browser.

Update `App/src/constants/devices.js` (or similar) to include the `apiEndpoint` for each of your devices, matching the Cloudflare Tunnel hostnames.

## How to Edit This Code

There are several ways to contribute to or modify RhishDesk:

-   **Use Lovable**: If this project was initiated via Lovable, you can make changes directly through their platform.
-   **Your Preferred IDE**: Clone this repository and use your local development environment. Push changes to your Git repository, and they will be reflected.
    ```sh
    # Step 1: Clone the repository.
    git clone <YOUR_GIT_URL>

    # Step 2: Navigate to the project directory.
    cd App

    # Step 3: Install dependencies.
    npm install

    # Step 4: Start the development server.
    npm run dev
    ```
-   **GitHub Interface**: For minor changes, you can edit files directly on GitHub.
-   **GitHub Codespaces**: Utilize GitHub Codespaces for an in-browser development environment.

## Technologies Used

-   **Frontend**: React, TypeScript, Vite, shadcn-ui, Tailwind CSS
-   **Backend**: Python (Flask), `psutil`, `pyautogui`, `google.generativeai`
-   **Networking**: Cloudflare Tunnel

## Deployment

For deployment, you can host the frontend application on any static site hosting service (e.g., Vercel, Netlify, Cloudflare Pages). The backend APIs will run on your local devices, accessible via the Cloudflare Tunnels.

If this project was created with Lovable, you can use their built-in publishing features.