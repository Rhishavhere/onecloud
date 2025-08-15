# OneCloud: Personal Cloud API and Backend Server

## Overview

RhishDesk is a sophisticated personal cloud management dashboard designed to provide real-time insights and control over your various devices. It acts as a central hub, allowing you to monitor system metrics, interact with an AI assistant, and manage your personal computing environment from anywhere. The project leverages a robust API and a Cloudflare tunnel to ensure secure and seamless access to your devices, even when they are behind a local network.

With RhishDesk, you can monitor multiple devices simultaneously, view detailed system information, capture screenshots remotely, and even perform system operations like shutdown and reboot—all from a single, intuitive interface accessible from anywhere in the world.

### Key Features

- **Real-time Device Monitoring**: Keep track of CPU usage, memory, uptime, disk space, network traffic, and battery status for all your connected devices.
- **AI-Powered Assistant**: Interact with Google Gemini AI to query system information, troubleshoot issues, and perform tasks using natural language.
- **Secure Remote Access**: Utilize Cloudflare Tunnel for secure, public-facing access to your local devices without opening firewall ports or configuring complex VPNs.
- **Remote Control Capabilities**: Capture screenshots, shutdown, or reboot your devices remotely with proper authentication.
- **Historical Performance Tracking**: View performance trends with historical data collection for CPU, memory, and network usage.
- **Intuitive User Interface**: A clean and modern dashboard built with React, TypeScript, and Tailwind CSS for an optimal user experience.
- **Cross-Device Compatibility**: Monitor both desktop and laptop devices, with potential for expansion to other device types.
- **Secure Authentication**: Token-based authentication for sensitive operations ensures your devices remain secure.

## Architecture

RhishDesk comprises two main components working together to provide a seamless monitoring experience:

1. **Frontend Application (`App`)**: A React-based web application that serves as the user interface. It fetches data from the backend API and presents it in an intuitive dashboard. Built with modern technologies like TypeScript, Vite, shadcn-ui, and Tailwind CSS.

2. **Backend API (`Api`)**: A Python-based API (`desktop.py`) running on each monitored device. This API collects system information using libraries like `psutil` and exposes it securely through a Flask web server. The API is exposed to the internet via a Cloudflare Tunnel.

### Cloudflare Tunnel Integration

Cloudflare Tunnel creates a secure, outbound-only connection from your local network to Cloudflare's edge network. This eliminates the need to open inbound ports on your firewall, significantly enhancing security while providing reliable access to your local APIs from anywhere in the world.

The tunnel works by establishing an encrypted connection from your device to Cloudflare's network. When a request is made to your custom domain (e.g., `https://myspace.rhishav.com`), Cloudflare routes it through this secure tunnel to your local API server. This approach offers several advantages:

- **Enhanced Security**: No inbound ports need to be opened on your firewall
- **Simplified Setup**: No need for complex networking configurations or static IPs
- **TLS Encryption**: Automatic HTTPS encryption for all traffic
- **DDoS Protection**: Cloudflare's protection shields your devices from attacks

## Comprehensive API Endpoints

The `Api/desktop.py` Flask application provides the following endpoints for system monitoring and control:

### System Information

- **`/desktop/status`** (`GET`): Quick overview of the desktop's status including OS, hostname, and uptime.
- **`/desktop/system/overview`** (`GET`): Comprehensive overview of the system, including CPU, memory, disk, network, and more.
- **`/desktop/system/cpu`** (`GET`): Detailed CPU information, including physical/logical core counts, usage percentage, frequency, and load average.
- **`/desktop/system/memory`** (`GET`): Detailed memory (virtual and swap) usage statistics.
- **`/desktop/system/disk`** (`GET`): Information about disk partitions and I/O statistics.
- **`/desktop/system/network`** (`GET`): Network interface details, I/O counters, and active connections.
- **`/desktop/system/processes`** (`GET`): List of running processes with their details (PID, name, CPU/memory usage).
- **`/desktop/system/battery`** (`GET`): Battery status information (percentage, power plug status, time remaining).
- **`/desktop/system/temperature`** (`GET`): Temperature sensor readings if available.
- **`/desktop/system/users`** (`GET`): Information about logged-in users.
- **`/desktop/system/services`** (`GET`): Windows services information (Windows only).
- **`/desktop/system/metrics/history`** (`GET`): Historical system metrics for CPU, memory, and network usage.

### System Control

- **`/desktop/system/screenshot`** (`GET`): Captures and returns a screenshot of the desktop.
- **`/desktop/system/control/shutdown`** (`POST`): Initiates a system shutdown with optional delay.
- **`/desktop/system/control/reboot`** (`POST`): Initiates a system reboot with optional delay.
- **`/desktop/system/control/cancel-shutdown`** (`POST`): Cancels a pending shutdown or reboot operation.

### AI Integration

- **`/desktop/ai/chat`** (`POST`): Integrates with Google Gemini AI to process natural language queries about the system, optionally including a screenshot for context.
  - **Request Body**: `{"query": "string", "include_screenshot": boolean}`
  - **Response**: `{"ai_response": "string", "system_summary": { ... }}`

### Health Monitoring

- **`/desktop/health`** (`GET`): Health check endpoint for monitoring the API's status.

## Project Setup

### Prerequisites

- Node.js & npm (recommended to install with [nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- Python 3.8+ (for the backend API)
- Cloudflare account and `cloudflared` daemon (for tunneling)
- Google Gemini API key (for AI assistant functionality)

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

Create a `.env` file in the `Api` directory with your configuration:

```
GEMINI_API_KEY=your_gemini_api_key_here
CONTROL_TOKEN=your_secure_token_for_system_control
```

Start the API server:

```bash
python desktop.py
```

The API will start on port 5000 by default.

#### 2. Cloudflare Tunnel Configuration

Install `cloudflared` on each device running the backend API. Authenticate `cloudflared` with your Cloudflare account and configure a tunnel to expose your local API server to a public Cloudflare hostname.

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

- **Use Lovable**: If this project was initiated via Lovable, you can make changes directly through their platform.
- **Your Preferred IDE**: Clone this repository and use your local development environment. Push changes to your Git repository, and they will be reflected.
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
- **GitHub Interface**: For minor changes, you can edit files directly on GitHub.
- **GitHub Codespaces**: Utilize GitHub Codespaces for an in-browser development environment.

## Technologies Used

### Frontend
- **React**: Core UI library
- **TypeScript**: Type-safe JavaScript
- **Vite**: Fast build tool and development server
- **shadcn-ui**: UI component library
- **Tailwind CSS**: Utility-first CSS framework

### Backend
- **Python**: Core programming language
- **Flask**: Web framework for API endpoints
- **psutil**: System monitoring library
- **pyautogui**: Screen capture functionality
- **google.generativeai**: Google Gemini AI integration

### Networking
- **Cloudflare Tunnel**: Secure remote access to local devices

## Deployment

For deployment, you can host the frontend application on any static site hosting service (e.g., Vercel, Netlify, Cloudflare Pages). The backend APIs will run on your local devices, accessible via the Cloudflare Tunnels.

To deploy the frontend:

1. Build the production version of the frontend:
   ```bash
   cd App
   npm run build
   ```

2. Deploy the contents of the `dist` directory to your preferred hosting service.

3. Ensure your Cloudflare Tunnels are configured to run as services on your devices for persistent access.

If this project was created with Lovable, you can use their built-in publishing features.

## Security Considerations

- Always use strong, unique tokens for the `CONTROL_TOKEN` environment variable
- Consider implementing additional authentication for the frontend application
- Regularly update all dependencies to patch security vulnerabilities
- Use HTTPS for all communications (automatically provided by Cloudflare)

## Future Enhancements

- Mobile application for on-the-go monitoring
- Support for additional device types (IoT, servers, etc.)
- Enhanced AI capabilities with more system control options
- Real-time alerts and notifications for system events
- Multi-user support with role-based access control
