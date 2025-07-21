import os
import psutil
import datetime
import io
import platform
from flask import Flask, jsonify, send_file, request
from flask_cors import CORS
import pyautogui

# Initialize the Flask app
app = Flask(__name__)

# --- CONFIGURATION ---
# This allows your web frontend (e.g., myspace.rhishav.com) to make requests to this API.
# For production, you might want to restrict it to your specific domain.
CORS(app) 

# --- HELPERS ---
def get_uptime():
    """Returns the system uptime in a human-readable format."""
    boot_time_timestamp = psutil.boot_time()
    boot_time = datetime.datetime.fromtimestamp(boot_time_timestamp)
    now = datetime.datetime.now()
    delta = now - boot_time
    return str(delta).split('.')[0] # Return as hh:mm:ss

# --- API ENDPOINTS ---

## 1. General Status Endpoint
@app.route('/desktop/status', methods=['GET'])
def get_status():
    """Provides a quick overview of the desktop's status."""
    return jsonify({
        'online': True,
        'hostname': platform.node(),
        'os': platform.system(),
        'os_version': platform.version(),
        'uptime': get_uptime()
    })

## 2. Detailed System Information Endpoint
@app.route('/desktop/system-info', methods=['GET'])
def get_system_info():
    """Returns detailed information about CPU, Memory, and Disk."""
    # CPU Info
    cpu_info = {
        'physical_cores': psutil.cpu_count(logical=False),
        'total_cores': psutil.cpu_count(logical=True),
        'usage_percent': psutil.cpu_percent(interval=1)
    }

    # Memory Info (RAM)
    mem = psutil.virtual_memory()
    mem_info = {
        'total_gb': round(mem.total / (1024**3), 2),
        'available_gb': round(mem.available / (1024**3), 2),
        'used_gb': round(mem.used / (1024**3), 2),
        'usage_percent': mem.percent
    }
    
    # Disk Info
    partitions = psutil.disk_partitions()
    disk_info = []
    for partition in partitions:
        try:
            usage = psutil.disk_usage(partition.mountpoint)
            disk_info.append({
                'device': partition.device,
                'mountpoint': partition.mountpoint,
                'filesystem_type': partition.fstype,
                'total_gb': round(usage.total / (1024**3), 2),
                'used_gb': round(usage.used / (1024**3), 2),
                'free_gb': round(usage.free / (1024**3), 2),
                'usage_percent': usage.percent,
            })
        except PermissionError:
            # Can't access the drive (e.g., CD-ROM with no disk)
            continue

    return jsonify({
        'cpu': cpu_info,
        'memory': mem_info,
        'disk': disk_info
    })

## 3. Running Processes Endpoint
@app.route('/desktop/processes', methods=['GET'])
def get_processes():
    """Returns a list of all running processes."""
    processes = []
    for proc in psutil.process_iter(['pid', 'name', 'username', 'cpu_percent', 'memory_info']):
        try:
            # Get process details as a dictionary
            pinfo = proc.as_dict(attrs=['pid', 'name', 'username', 'cpu_percent'])
            pinfo['memory_mb'] = round(proc.info['memory_info'].rss / (1024 * 1024), 2) # Memory in MB
            processes.append(pinfo)
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass
    
    # Sort processes by memory usage by default
    sorted_processes = sorted(processes, key=lambda p: p['memory_mb'], reverse=True)
    
    return jsonify(sorted_processes)

## 4. Screenshot Endpoint
@app.route('/desktop/screenshot', methods=['GET'])
def get_screenshot():
    """Captures the current screen and returns it as a PNG image."""
    # Capture the screenshot
    screenshot = pyautogui.screenshot()
    
    # Save the screenshot to a memory buffer
    img_buffer = io.BytesIO()
    screenshot.save(img_buffer, format='PNG')
    img_buffer.seek(0)
    
    # Send the image file from the buffer
    return send_file(
        img_buffer,
        mimetype='image/png',
        as_attachment=False,
        download_name='screenshot.png'
    )

## 5. Control Endpoints (Shutdown & Reboot)
# ⚠️ SECURITY WARNING: These endpoints are dangerous. Anyone who can access this API can shut down
# your computer. In a real-world scenario, you MUST secure this with strong authentication.
@app.route('/desktop/control/shutdown', methods=['POST'])
def shutdown_computer():
    """Shuts down the computer. Requires a POST request."""
    # The command for Windows is 'shutdown /s /t 1' (shutdown in 1 sec)
    os.system("shutdown /s /t 1")
    return jsonify({'status': 'success', 'message': 'Shutdown command issued.'})

@app.route('/desktop/control/reboot', methods=['POST'])
def reboot_computer():
    """Reboots the computer. Requires a POST request."""
    # The command for Windows is 'shutdown /r /t 1' (reboot in 1 sec)
    os.system("shutdown /r /t 1")
    return jsonify({'status': 'success', 'message': 'Reboot command issued.'})

## 6. AI Chat Endpoint (Gemini Integration Placeholder)
@app.route('/desktop/chat', methods=['POST'])
def chat_with_system():
    """Analyzes a user query against system data using an AI model."""
    user_query = request.json.get('query')
    if not user_query:
        return jsonify({'error': 'Query not provided'}), 400

    # --- This is where you would call the Gemini API ---
    # 1. Gather relevant context from the system
    running_processes = [p['name'] for p in get_processes().get_json()]
    system_context = f"""
    Current running processes on the Windows desktop: {', '.join(running_processes)}.
    Current CPU Usage: {psutil.cpu_percent()}%
    Current Memory Usage: {psutil.virtual_memory().percent}%
    """

    # 2. Formulate a prompt for the Gemini API
    # prompt_for_gemini = f"Based on this system information: {system_context}. Answer the user's question: '{user_query}'"
    
    # 3. Call Gemini API (This part is a placeholder)
    # gemini_response = call_gemini_api(prompt_for_gemini) 
    
    # For now, we'll just return a mock response demonstrating the concept.
    # Example logic for your specific query: "is any game running on my laptop"
    game_keywords = ['steam.exe', 'epicgameslauncher.exe', 'valorant.exe', 'csgo.exe', 'overwatch.exe']
    found_games = [p for p in running_processes if p.lower() in game_keywords]
    
    if found_games:
        ai_response = f"Yes, it looks like you are running the following game(s): {', '.join(found_games)}."
    else:
        ai_response = "No, I don't see any common games running right now."

    return jsonify({
        'user_query': user_query,
        'ai_response': ai_response,
        'context_used': system_context # For debugging
    })


# --- Main Execution ---
if __name__ == '__main__':
    # Runs the app on your local network. Use 0.0.0.0 to make it accessible 
    # from other devices on your network (like your laptop).
    app.run(port=5000, debug=True)