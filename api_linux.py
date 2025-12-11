import os
import psutil
import datetime
import io
import platform
import socket
import json
import threading
import time
import subprocess
from collections import defaultdict, deque
from flask import Flask, jsonify, send_file, request
from flask_cors import CORS
import pyautogui
import google.generativeai as genai
from dotenv import load_dotenv
import cv2

load_dotenv()

# Initialize the Flask app
app = Flask(__name__)
CORS(app)

# Global variables for monitoring
system_metrics_history = {
    'cpu': deque(maxlen=100),
    'memory': deque(maxlen=100),
    'network': deque(maxlen=100),
    'timestamps': deque(maxlen=100)
}

# --- GEMINI AI CONFIGURATION ---
try:
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    if not gemini_api_key:
        raise ValueError("GEMINI_API_KEY not found in .env file")
    genai.configure(api_key=gemini_api_key)
    model = genai.GenerativeModel('gemini-1.5-flash')
except Exception as e:
    print(f"Error configuring Gemini: {e}")
    model = None

# --- HELPER FUNCTIONS ---

def get_uptime():
    """Returns the system uptime in a human-readable format."""
    try:
        boot_time_timestamp = psutil.boot_time()
        boot_time = datetime.datetime.fromtimestamp(boot_time_timestamp)
        now = datetime.datetime.now()
        delta = now - boot_time
        days = delta.days
        hours, remainder = divmod(delta.seconds, 3600)
        minutes, _ = divmod(remainder, 60)
        return {
            'total_seconds': int(delta.total_seconds()),
            'formatted': f"{days}d {hours}h {minutes}m",
            'boot_time': boot_time.strftime("%Y-%m-%d %H:%M:%S")
        }
    except Exception as e:
        return {'error': str(e)}

def get_cpu_info():
    """Get comprehensive CPU information."""
    try:
        cpu_freq = psutil.cpu_freq()
        cpu_times = psutil.cpu_times()

        cpu_info = {
            'physical_cores': psutil.cpu_count(logical=False),
            'total_cores': psutil.cpu_count(logical=True),
            'usage_percent': psutil.cpu_percent(interval=1),
            'usage_per_core': psutil.cpu_percent(interval=1, percpu=True),
            'frequency': {
                'current': round(cpu_freq.current, 2) if cpu_freq else None,
                'min': round(cpu_freq.min, 2) if cpu_freq else None,
                'max': round(cpu_freq.max, 2) if cpu_freq else None
            },
            'times': {
                'user': cpu_times.user,
                'system': cpu_times.system,
                'idle': cpu_times.idle
            }
        }

        # Add load average if available (Unix-like systems)
        if hasattr(os, 'getloadavg'):
            cpu_info['load_average'] = os.getloadavg()
        else:
            cpu_info['load_average'] = None

        return cpu_info
    except Exception as e:
        return {'error': str(e)}

def get_memory_info():
    """Get comprehensive memory information."""
    try:
        virtual_mem = psutil.virtual_memory()
        swap_mem = psutil.swap_memory()

        return {
            'virtual': {
                'total_gb': round(virtual_mem.total / (1024**3), 2),
                'available_gb': round(virtual_mem.available / (1024**3), 2),
                'used_gb': round(virtual_mem.used / (1024**3), 2),
                'free_gb': round(virtual_mem.free / (1024**3), 2),
                'usage_percent': virtual_mem.percent,
                'buffers_gb': round(getattr(virtual_mem, 'buffers', 0) / (1024**3), 2),
                'cached_gb': round(getattr(virtual_mem, 'cached', 0) / (1024**3), 2)
            },
            'swap': {
                'total_gb': round(swap_mem.total / (1024**3), 2),
                'used_gb': round(swap_mem.used / (1024**3), 2),
                'free_gb': round(swap_mem.free / (1024**3), 2),
                'usage_percent': swap_mem.percent,
                'sin': swap_mem.sin,
                'sout': swap_mem.sout
            }
        }
    except Exception as e:
        return {'error': str(e)}

def get_disk_info():
    """Get comprehensive disk information."""
    try:
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
                    'usage_percent': round((usage.used / usage.total) * 100, 2) if usage.total > 0 else 0
                })
            except (PermissionError, OSError):
                continue

        # Get disk I/O statistics
        try:
            disk_io = psutil.disk_io_counters()
            if disk_io:
                io_stats = {
                    'read_count': disk_io.read_count,
                    'write_count': disk_io.write_count,
                    'read_bytes': disk_io.read_bytes,
                    'write_bytes': disk_io.write_bytes,
                    'read_time': disk_io.read_time,
                    'write_time': disk_io.write_time
                }
            else:
                io_stats = None
        except (RuntimeError, NotImplementedError, AttributeError):
            io_stats = None

        return {
            'partitions': disk_info,
            'io_stats': io_stats
        }
    except Exception as e:
        return {'error': str(e)}

def get_network_info():
    """Get comprehensive network information."""
    try:
        net_io = psutil.net_io_counters()
        interfaces = {}

        # Get interface information
        for interface, addrs in psutil.net_if_addrs().items():
            interface_info = {
                'addresses': [],
                'stats': None
            }

            for addr in addrs:
                interface_info['addresses'].append({
                    'family': str(addr.family),
                    'address': addr.address,
                    'netmask': addr.netmask,
                    'broadcast': addr.broadcast
                })

            # Get interface statistics
            try:
                if_stats = psutil.net_if_stats()
                if interface in if_stats:
                    stats = if_stats[interface]
                    interface_info['stats'] = {
                        'isup': stats.isup,
                        'duplex': str(stats.duplex),
                        'speed': stats.speed,
                        'mtu': stats.mtu
                    }
            except (KeyError, AttributeError):
                pass

            interfaces[interface] = interface_info

        # Get network connections
        connections = []
        try:
            for conn in psutil.net_connections(kind='inet'):
                connections.append({
                    'fd': conn.fd,
                    'family': str(conn.family),
                    'type': str(conn.type),
                    'laddr': f"{conn.laddr.ip}:{conn.laddr.port}" if conn.laddr else None,
                    'raddr': f"{conn.raddr.ip}:{conn.raddr.port}" if conn.raddr else None,
                    'status': str(conn.status),
                    'pid': conn.pid
                })
        except psutil.AccessDenied:
            connections = [{'message': 'Access denied to fetch all connections.'}]
        except Exception:
            connections = [{'message': 'Unable to fetch network connections.'}]

        return {
            'io_counters': {
                'bytes_sent': net_io.bytes_sent if net_io else 0,
                'bytes_recv': net_io.bytes_recv if net_io else 0,
                'packets_sent': net_io.packets_sent if net_io else 0,
                'packets_recv': net_io.packets_recv if net_io else 0,
                'errin': net_io.errin if net_io else 0,
                'errout': net_io.errout if net_io else 0,
                'dropin': net_io.dropin if net_io else 0,
                'dropout': net_io.dropout if net_io else 0
            },
            'interfaces': interfaces,
            'connections': connections[:20]  # Limit for API response
        }
    except Exception as e:
        return {'error': str(e)}

def get_battery_info():
    """Get battery information if available."""
    try:
        if hasattr(psutil, "sensors_battery"):
            battery = psutil.sensors_battery()
            if battery:
                time_left = battery.secsleft
                if time_left == psutil.POWER_TIME_UNLIMITED:
                    time_left_str = 'Unlimited'
                elif time_left == psutil.POWER_TIME_UNKNOWN:
                    time_left_str = 'Unknown'
                else:
                    time_left_str = str(datetime.timedelta(seconds=time_left))

                return {
                    'percent': battery.percent,
                    'power_plugged': battery.power_plugged,
                    'time_left': time_left,
                    'time_left_formatted': time_left_str
                }
        return None
    except Exception as e:
        return {'error': str(e)}

def get_temperature_info():
    """Get temperature sensors information."""
    try:
        if hasattr(psutil, "sensors_temperatures"):
            temps = psutil.sensors_temperatures()
            if temps:
                temperature_data = {}

                for name, entries in temps.items():
                    temperature_data[name] = []
                    for entry in entries:
                        temperature_data[name].append({
                            'label': entry.label or 'N/A',
                            'current': entry.current,
                            'high': entry.high,
                            'critical': entry.critical
                        })

                return temperature_data if temperature_data else None
        return None
    except Exception as e:
        return {'error': str(e)}

def get_users_info():
    """Get information about logged-in users."""
    try:
        users = []
        if hasattr(psutil, "users"):
            for user in psutil.users():
                users.append({
                    'name': user.name,
                    'terminal': user.terminal,
                    'host': user.host,
                    'started': datetime.datetime.fromtimestamp(user.started).strftime("%Y-%m-%d %H:%M:%S"),
                    'pid': user.pid if hasattr(user, 'pid') else None
                })
        return users
    except Exception as e:
        return {'error': str(e)}

def get_services_info():
    """Get system services information."""
    try:
        system = platform.system()

        # Linux (systemd) implementation
        if system == 'Linux':
            try:
                result = subprocess.run(
                    ['systemctl', 'list-units', '--type=service', '--state=running', '--no-pager', '--plain'],
                    capture_output=True, text=True, check=True, timeout=10
                )
                services = []
                lines = result.stdout.strip().split('\n')

                # Skip header line and empty lines
                for line in lines[1:]:
                    if line.strip():
                        parts = line.strip().split(maxsplit=4)
                        if len(parts) >= 5:
                            services.append({
                                'name': parts[0],
                                'load': parts[1],
                                'active': parts[2],
                                'sub': parts[3],
                                'description': parts[4]
                            })
                        if len(services) >= 50:  # Limit results
                            break

                return services
            except (FileNotFoundError, subprocess.CalledProcessError, subprocess.TimeoutExpired) as e:
                return {'message': f'Could not fetch systemd services: {str(e)}'}

        # Windows implementation
        elif system == 'Windows':
            try:
                import win32service
                import win32con

                status_map = {
                    win32service.SERVICE_STOPPED: 'Stopped',
                    win32service.SERVICE_RUNNING: 'Running',
                    win32service.SERVICE_PAUSED: 'Paused',
                    win32service.SERVICE_START_PENDING: 'Starting',
                    win32service.SERVICE_STOP_PENDING: 'Stopping',
                    win32service.SERVICE_CONTINUE_PENDING: 'Continuing',
                    win32service.SERVICE_PAUSE_PENDING: 'Pausing'
                }

                services = []
                scm = win32service.OpenSCManager(None, None, win32service.SC_MANAGER_ENUMERATE_SERVICE)
                try:
                    service_list = win32service.EnumServicesStatus(
                        scm, win32service.SERVICE_WIN32, win32service.SERVICE_STATE_ALL
                    )

                    for service_name, display_name, service_status in service_list[:50]:
                        services.append({
                            'name': service_name,
                            'display_name': display_name,
                            'status': status_map.get(service_status[1], 'Unknown')
                        })
                finally:
                    win32service.CloseServiceHandle(scm)

                return services
            except ImportError:
                return {'message': 'pywin32 is not installed. Cannot fetch Windows services.'}
            except Exception as e:
                return {'message': f'Error fetching Windows services: {str(e)}'}

        # macOS and other systems
        else:
            return None

    except Exception as e:
        return {'error': str(e)}

def collect_metrics():
    """Collect metrics in background for historical data."""
    while True:
        try:
            timestamp = datetime.datetime.now()
            cpu_percent = psutil.cpu_percent(interval=1)
            memory_percent = psutil.virtual_memory().percent
            net_io = psutil.net_io_counters()

            system_metrics_history['timestamps'].append(timestamp.isoformat())
            system_metrics_history['cpu'].append(cpu_percent)
            system_metrics_history['memory'].append(memory_percent)

            if net_io:
                system_metrics_history['network'].append({
                    'bytes_sent': net_io.bytes_sent,
                    'bytes_recv': net_io.bytes_recv
                })
            else:
                system_metrics_history['network'].append({
                    'bytes_sent': 0,
                    'bytes_recv': 0
                })

            time.sleep(5)  # Collect every 5 seconds
        except Exception as e:
            print(f"Error collecting metrics: {e}")
            time.sleep(10)

# Start metrics collection thread
metrics_thread = threading.Thread(target=collect_metrics, daemon=True)
metrics_thread.start()

# --- API ENDPOINTS ---

@app.route('/laptop/status', methods=['GET'])
def get_status():
    """Provides a quick overview of the laptop's status."""
    try:
        return jsonify({
            'online': True,
            'hostname': platform.node(),
            'os': platform.system(),
            'os_version': platform.version(),
            'platform': platform.platform(),
            'architecture': platform.architecture(),
            'processor': platform.processor(),
            'python_version': platform.python_version(),
            'uptime': get_uptime(),
            'timestamp': datetime.datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/laptop/system/overview', methods=['GET'])
def get_system_overview():
    """Get a comprehensive system overview."""
    try:
        return jsonify({
            'cpu': get_cpu_info(),
            'memory': get_memory_info(),
            'disk': get_disk_info(),
            'network': get_network_info(),
            'battery': get_battery_info(),
            'temperature': get_temperature_info(),
            'uptime': get_uptime(),
            'timestamp': datetime.datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/laptop/system/cpu', methods=['GET'])
def get_cpu_detailed():
    """Get detailed CPU information."""
    return jsonify(get_cpu_info())

@app.route('/laptop/system/memory', methods=['GET'])
def get_memory_detailed():
    """Get detailed memory information."""
    return jsonify(get_memory_info())

@app.route('/laptop/system/disk', methods=['GET'])
def get_disk_detailed():
    """Get detailed disk information."""
    return jsonify(get_disk_info())

@app.route('/laptop/system/network', methods=['GET'])
def get_network_detailed():
    """Get detailed network information."""
    return jsonify(get_network_info())

@app.route('/laptop/system/battery', methods=['GET'])
def get_battery_detailed():
    """Get battery information."""
    battery_info = get_battery_info()
    if battery_info is None:
        return jsonify({'message': 'No battery detected or information unavailable'}), 404
    return jsonify(battery_info)

@app.route('/laptop/system/temperature', methods=['GET'])
def get_temperature_detailed():
    """Get temperature sensors information."""
    temp_info = get_temperature_info()
    if temp_info is None:
        return jsonify({'message': 'No temperature sensors detected or info unavailable'}), 404
    return jsonify(temp_info)

@app.route('/laptop/system/processes', methods=['GET'])
def get_processes():
    """Returns a list of running processes with detailed information."""
    try:
        limit = request.args.get('limit', 20, type=int)
        sort_by = request.args.get('sort', 'memory', type=str)  # memory, cpu, name, pid

        processes = []
        for proc in psutil.process_iter(['pid', 'name', 'username', 'cpu_percent', 'memory_info', 'create_time', 'status', 'cmdline']):
            try:
                pinfo = proc.as_dict()
                if pinfo['memory_info']:
                    pinfo['memory_mb'] = round(pinfo['memory_info'].rss / (1024 * 1024), 2)
                    pinfo['memory_percent'] = round(proc.memory_percent(), 2)
                else:
                    pinfo['memory_mb'] = 0
                    pinfo['memory_percent'] = 0

                if pinfo['create_time']:
                    pinfo['create_time_formatted'] = datetime.datetime.fromtimestamp(pinfo['create_time']).strftime("%Y-%m-%d %H:%M:%S")
                else:
                    pinfo['create_time_formatted'] = 'N/A'

                processes.append(pinfo)
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                continue

        # Sort processes
        if sort_by == 'memory':
            processes.sort(key=lambda p: p.get('memory_mb', 0), reverse=True)
        elif sort_by == 'cpu':
            processes.sort(key=lambda p: p.get('cpu_percent', 0), reverse=True)
        elif sort_by == 'name':
            processes.sort(key=lambda p: p.get('name', '').lower())
        elif sort_by == 'pid':
            processes.sort(key=lambda p: p.get('pid', 0))

        return jsonify({
            'processes': processes[:limit],
            'total_processes': len(processes)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/laptop/system/users', methods=['GET'])
def get_users_detailed():
    """Get information about logged-in users."""
    return jsonify(get_users_info())

@app.route('/laptop/system/services', methods=['GET'])
def get_services_detailed():
    """Get system services information."""
    services = get_services_info()
    if services is None:
        return jsonify({'message': 'Services information not available on this platform'}), 404
    return jsonify({'services': services})

@app.route('/laptop/system/metrics/history', methods=['GET'])
def get_metrics_history():
    """Get historical system metrics."""
    return jsonify({k: list(v) for k, v in system_metrics_history.items()})

@app.route('/laptop/system/screenshot', methods=['GET'])
def get_screenshot():
    """Captures the current screen and returns it as a PNG image."""
    try:
        # Disable failsafe for pyautogui
        pyautogui.FAILSAFE = False
        screenshot = pyautogui.screenshot()
        img_buffer = io.BytesIO()
        screenshot.save(img_buffer, format='PNG')
        img_buffer.seek(0)

        return send_file(img_buffer, mimetype='image/png')
    except Exception as e:
        return jsonify({'error': f"Failed to capture screenshot: {str(e)}"}), 500

@app.route('/laptop/camera/capture', methods=['GET'])
def get_camera_capture():
    """Captures a single frame from the default webcam and returns it as a JPEG image."""
    cap = None
    try:
        # Try different backends for better compatibility
        for backend in [cv2.CAP_V4L2, cv2.CAP_DSHOW, cv2.CAP_ANY]:
            cap = cv2.VideoCapture(0, backend)
            if cap.isOpened():
                break
            cap.release()

        if not cap or not cap.isOpened():
            return jsonify({'error': 'Could not open video device. Is a webcam connected and not in use?'}), 500

        # Set camera properties for better capture
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

        # Allow camera to warm up
        for _ in range(5):
            cap.read()

        ret, frame = cap.read()

        if not ret or frame is None:
            return jsonify({'error': 'Failed to capture frame from camera.'}), 500

        # Encode frame as JPEG
        encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), 90]
        is_success, buffer = cv2.imencode(".jpg", frame, encode_param)

        if not is_success:
            return jsonify({'error': 'Failed to encode frame.'}), 500

        return send_file(io.BytesIO(buffer), mimetype='image/jpeg')
    except Exception as e:
        return jsonify({'error': f'Camera error: {str(e)}'}), 500
    finally:
        if cap and cap.isOpened():
            cap.release()

@app.route('/laptop/system/control/shutdown', methods=['POST'])
def shutdown_computer():
    """Shuts down the computer."""
    try:
        data = request.get_json() if request.is_json else {}
        delay = data.get('delay', 10)

        system = platform.system()
        if system == 'Windows':
            subprocess.run(f"shutdown /s /t {delay}", shell=True)
        elif system == 'Linux':
            subprocess.run(f"(sleep {delay} && shutdown -h now) &", shell=True)
        elif system == 'Darwin':  # macOS
            subprocess.run(f"shutdown -h +{delay//60}", shell=True)
        else:
            return jsonify({'error': 'Unsupported operating system'}), 400

        return jsonify({'message': f'Shutdown scheduled in {delay} seconds'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/laptop/system/control/reboot', methods=['POST'])
def reboot_computer():
    """Reboots the computer."""
    try:
        data = request.get_json() if request.is_json else {}
        delay = data.get('delay', 10)

        system = platform.system()
        if system == 'Windows':
            subprocess.run(f"shutdown /r /t {delay}", shell=True)
        elif system == 'Linux':
            subprocess.run(f"(sleep {delay} && shutdown -r now) &", shell=True)
        elif system == 'Darwin':  # macOS
            subprocess.run(f"shutdown -r +{delay//60}", shell=True)
        else:
            return jsonify({'error': 'Unsupported operating system'}), 400

        return jsonify({'message': f'Reboot scheduled in {delay} seconds'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/laptop/system/control/cancel-shutdown', methods=['POST'])
def cancel_shutdown():
    """Cancel a scheduled shutdown/reboot."""
    try:
        system = platform.system()
        if system == 'Windows':
            subprocess.run("shutdown /a", shell=True)
        elif system in ['Linux', 'Darwin']:
            subprocess.run("shutdown -c", shell=True)
        else:
            return jsonify({'error': 'Unsupported operating system'}), 400

        return jsonify({'message': 'Shutdown/reboot cancelled'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/laptop/ai/chat', methods=['POST'])
def chat_with_system():
    """Enhanced AI chat with comprehensive system context."""
    try:
        data = request.get_json()
        if not data or not data.get('query'):
            return jsonify({'error': 'Query not provided'}), 400

        if not model:
            return jsonify({'error': 'AI model not configured. Please set GEMINI_API_KEY in .env file'}), 500

        # Gather system context
        cpu_info = get_cpu_info()
        mem_info = get_memory_info()

        system_context = f"""
        SYSTEM STATUS REPORT:
        - OS: {platform.system()} {platform.release()}
        - CPU Usage: {cpu_info.get('usage_percent', 'N/A')}%
        - Memory Usage: {mem_info.get('virtual', {}).get('usage_percent', 'N/A')}%
        """

        prompt = f"""
        You are RhishDesk, an intelligent system administrator AI for laptops.
        Current system data: {system_context}
        User Question: "{data['query']}"
        Provide a helpful, professional, and friendly response. Keep responses concise but informative.
        """

        contents = [prompt]

        # Include screenshot if requested
        if data.get('include_screenshot'):
            try:
                pyautogui.FAILSAFE = False
                screenshot = pyautogui.screenshot()
                img_buffer = io.BytesIO()
                screenshot.save(img_buffer, format='PNG')
                img_buffer.seek(0)
                contents = [
                    prompt,
                    {
                        'mime_type': 'image/png',
                        'data': img_buffer.read()
                    }
                ]
            except Exception as e:
                contents.append(f"[Screenshot capture failed: {str(e)}]")

        response = model.generate_content(contents)
        return jsonify({'ai_response': response.text})

    except Exception as e:
        return jsonify({'error': f'AI processing error: {str(e)}'}), 500

@app.route('/laptop/health', methods=['GET'])
def health_check():
    """Health check endpoint for monitoring."""
    return jsonify({
        'status': 'healthy',
        'service': 'laptop-api',
        'timestamp': datetime.datetime.now().isoformat(),
        'uptime': get_uptime()
    })

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found', 'available_endpoints': '/laptop/*'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': f'Internal server error: {str(error)}'}), 500

@app.errorhandler(Exception)
def handle_exception(e):
    return jsonify({'error': f'Unexpected error: {str(e)}'}), 500

if __name__ == '__main__':
    print("🚀 Enhanced Laptop Management API starting...")
    print("📊 Background metrics collection enabled.")
    print("🔧 All endpoints now use /laptop/ prefix")
    print("💻 Server running on http://localhost:5000")

    try:
        app.run(port=5000, debug=True, threaded=True)
    except Exception as e:
        print(f"Failed to start server: {e}")
