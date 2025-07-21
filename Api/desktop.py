import os
import psutil
import datetime
import io
import platform
from flask import Flask, jsonify, send_file, request
from flask_cors import CORS
import pyautogui
import google.generativeai as genai
import pyautogui
from dotenv import load_dotenv


load_dotenv()

# Initialize the Flask app
app = Flask(__name__)
CORS(app) 

# --- GEMINI AI CONFIGURATION ---
try:
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    if not gemini_api_key:
        raise ValueError("GEMINI_API_KEY not found in .env file")
    genai.configure(api_key=gemini_api_key)
    model = genai.GenerativeModel('gemini-2.0-flash') # Using the fast and efficient model
except Exception as e:
    print(f"Error configuring Gemini: {e}")
    model = None

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

## AI Chat
@app.route('/desktop/chat', methods=['POST'])
def chat_with_system():
    user_query = request.json.get('query')
    if not user_query:
        return jsonify({'error': 'Query not provided'}), 400
    
    if not model:
        return jsonify({'ai_response': 'Error: Gemini AI model is not configured on the server.'}), 500

    # 1. Gather system context
    running_processes_list = [p.info['name'] for p in psutil.process_iter(['name'])]
    cpu_usage = psutil.cpu_percent(interval=1)
    mem_usage = psutil.virtual_memory().percent

    # 2. Formulate a detailed prompt for Gemini
    prompt = f"""
    You are RhishDesk, an AI assistant providing information about a user's desktop (windows) computer.
    Analyze the user's question based *only* on the real-time system data provided below.
    Be chill and fun to talk to.

    **System Data:**
    - CPU Usage: {cpu_usage:.1f}%
    - Memory (RAM) Usage: {mem_usage:.1f}%
    - Running Processes: {', '.join(sorted(list(set(running_processes_list))))}

    **User's Question:** "{user_query}"

    **Your Answer:**
    """

    # 3. Call the Gemini API and return the response
    try:
        response = model.generate_content(prompt)
        ai_response = response.text
    except Exception as e:
        print(f"Gemini API error: {e}")
        ai_response = "Sorry, I encountered an error while contacting the AI model."

    return jsonify({
        'user_query': user_query,
        'ai_response': ai_response
    })

# --- Main Execution ---
if __name__ == '__main__':
    # Runs the app on your local network. Use 0.0.0.0 to make it accessible 
    # from other devices on your network (like your laptop).
    app.run(port=5000, debug=True)