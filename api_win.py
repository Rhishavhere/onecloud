import os
import psutil
import datetime
import io
import platform
import socket
import json
import threading
import time
from collections import defaultdict, deque
from flask import Flask, jsonify, send_file, request
from flask_cors import CORS
import pyautogui
import google.generativeai as genai
from dotenv import load_dotenv

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
    model = genai.GenerativeModel('gemini-2.0-flash')
except Exception as e:
    print(f"Error configuring Gemini: {e}")
    model = None

# --- HELPER FUNCTIONS ---

def get_uptime():
    """Returns the system uptime in a human-readable format."""
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

def get_cpu_info():
    """Get comprehensive CPU information."""
    try:
        cpu_freq = psutil.cpu_freq()
        cpu_times = psutil.cpu_times()
        
        return {
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
            },
            'load_average': os.getloadavg() if hasattr(os, 'getloadavg') else None
        }
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
                    'usage_percent': round((usage.used / usage.total) * 100, 2)
                })
            except PermissionError:
                continue
        
        # Get disk I/O statistics
        try:
            disk_io = psutil.disk_io_counters()
            io_stats = {
                'read_count': disk_io.read_count,
                'write_count': disk_io.write_count,
                'read_bytes': disk_io.read_bytes,
                'write_bytes': disk_io.write_bytes,
                'read_time': disk_io.read_time,
                'write_time': disk_io.write_time
            }
        except:
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
        # Network I/O statistics
        net_io = psutil.net_io_counters()
        
        # Network interfaces
        interfaces = {}
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
                stats = psutil.net_if_stats()[interface]
                interface_info['stats'] = {
                    'isup': stats.isup,
                    'duplex': str(stats.duplex),
                    'speed': stats.speed,
                    'mtu': stats.mtu
                }
            except:
                pass
                
            interfaces[interface] = interface_info
        
        # Network connections
        connections = []
        try:
            for conn in psutil.net_connections()[:20]:  # Limit to 20 connections
                connections.append({
                    'fd': conn.fd,
                    'family': str(conn.family),
                    'type': str(conn.type),
                    'laddr': f"{conn.laddr.ip}:{conn.laddr.port}" if conn.laddr else None,
                    'raddr': f"{conn.raddr.ip}:{conn.raddr.port}" if conn.raddr else None,
                    'status': str(conn.status),
                    'pid': conn.pid
                })
        except:
            connections = []
        
        return {
            'io_counters': {
                'bytes_sent': net_io.bytes_sent,
                'bytes_recv': net_io.bytes_recv,
                'packets_sent': net_io.packets_sent,
                'packets_recv': net_io.packets_recv,
                'errin': net_io.errin,
                'errout': net_io.errout,
                'dropin': net_io.dropin,
                'dropout': net_io.dropout
            },
            'interfaces': interfaces,
            'connections': connections[:10]  # Limit for API response
        }
    except Exception as e:
        return {'error': str(e)}

def get_battery_info():
    """Get battery information if available."""
    try:
        battery = psutil.sensors_battery()
        if battery:
            return {
                'percent': battery.percent,
                'power_plugged': battery.power_plugged,
                'time_left': battery.secsleft if battery.secsleft != psutil.POWER_TIME_UNLIMITED else None,
                'time_left_formatted': str(datetime.timedelta(seconds=battery.secsleft)) if battery.secsleft not in [psutil.POWER_TIME_UNLIMITED, psutil.POWER_TIME_UNKNOWN] else None
            }
        return None
    except Exception as e:
        return {'error': str(e)}

def get_temperature_info():
    """Get temperature sensors information."""
    try:
        temps = psutil.sensors_temperatures()
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
    except Exception as e:
        return {'error': str(e)}

def get_users_info():
    """Get information about logged-in users."""
    try:
        users = []
        for user in psutil.users():
            users.append({
                'name': user.name,
                'terminal': user.terminal,
                'host': user.host,
                'started': datetime.datetime.fromtimestamp(user.started).strftime("%Y-%m-%d %H:%M:%S"),
                'pid': user.pid
            })
        return users
    except Exception as e:
        return {'error': str(e)}

def get_services_info():
    """Get Windows services information."""
    try:
        if platform.system() == 'Windows':
            import win32service
            import win32serviceutil
            
            services = []
            # This is a basic implementation - you might want to use WMI for more detailed info
            try:
                scm = win32service.OpenSCManager(None, None, win32service.SC_MANAGER_ENUMERATE_SERVICE)
                service_list = win32service.EnumServicesStatus(scm)
                
                for service in service_list[:50]:  # Limit to 50 services
                    services.append({
                        'name': service[0],
                        'display_name': service[1],
                        'status': service[2][1]  # SERVICE_RUNNING, etc.
                    })
                
                win32service.CloseServiceHandle(scm)
            except ImportError:
                # pywin32 not installed
                pass
            
            return services
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
            system_metrics_history['network'].append({
                'bytes_sent': net_io.bytes_sent,
                'bytes_recv': net_io.bytes_recv
            })
            
            time.sleep(5)  # Collect every 5 seconds
        except Exception as e:
            print(f"Error collecting metrics: {e}")
            time.sleep(10)

# Start background metrics collection
metrics_thread = threading.Thread(target=collect_metrics, daemon=True)
metrics_thread.start()

# --- API ENDPOINTS ---

@app.route('/desktop/status', methods=['GET'])
def get_status():
    """Provides a quick overview of the desktop's status."""
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

@app.route('/desktop/system/overview', methods=['GET'])
def get_system_overview():
    """Get a comprehensive system overview."""
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

@app.route('/desktop/system/cpu', methods=['GET'])
def get_cpu_detailed():
    """Get detailed CPU information."""
    return jsonify(get_cpu_info())

@app.route('/desktop/system/memory', methods=['GET'])
def get_memory_detailed():
    """Get detailed memory information."""
    return jsonify(get_memory_info())

@app.route('/desktop/system/disk', methods=['GET'])
def get_disk_detailed():
    """Get detailed disk information."""
    return jsonify(get_disk_info())

@app.route('/desktop/system/network', methods=['GET'])
def get_network_detailed():
    """Get detailed network information."""
    return jsonify(get_network_info())

@app.route('/desktop/system/battery', methods=['GET'])
def get_battery_detailed():
    """Get battery information."""
    battery_info = get_battery_info()
    if battery_info is None:
        return jsonify({'message': 'No battery detected or battery information unavailable'}), 404
    return jsonify(battery_info)

@app.route('/desktop/system/temperature', methods=['GET'])
def get_temperature_detailed():
    """Get temperature sensors information."""
    temp_info = get_temperature_info()
    if temp_info is None:
        return jsonify({'message': 'No temperature sensors detected or information unavailable'}), 404
    return jsonify(temp_info)

@app.route('/desktop/system/processes', methods=['GET'])
def get_processes():
    """Returns a list of running processes with detailed information."""
    try:
        limit = request.args.get('limit', 20, type=int)
        sort_by = request.args.get('sort', 'memory', type=str)  # memory, cpu, name, pid
        
        processes = []
        for proc in psutil.process_iter(['pid', 'name', 'username', 'cpu_percent', 'memory_info', 'create_time', 'status', 'cmdline']):
            try:
                pinfo = proc.as_dict()
                pinfo['memory_mb'] = round(pinfo['memory_info'].rss / (1024 * 1024), 2)
                pinfo['memory_percent'] = proc.memory_percent()
                pinfo['create_time_formatted'] = datetime.datetime.fromtimestamp(pinfo['create_time']).strftime("%Y-%m-%d %H:%M:%S")
                pinfo['cmdline'] = ' '.join(pinfo['cmdline'][:3]) if pinfo['cmdline'] else ''  # Limit command line
                processes.append(pinfo)
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                pass
        
  
        # Sort processes
        if sort_by == 'memory':
            processes.sort(key=lambda p: p['memory_mb'], reverse=True)
        elif sort_by == 'cpu':
            processes.sort(key=lambda p: p['cpu_percent'] or 0, reverse=True)
        elif sort_by == 'name':
            processes.sort(key=lambda p: p['name'].lower())
        elif sort_by == 'pid':
            processes.sort(key=lambda p: p['pid'])
        
        return jsonify({
            'processes': processes[:limit],
            'total_processes': len(processes),
            'sorted_by': sort_by
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/desktop/system/users', methods=['GET'])
def get_users_detailed():
    """Get information about logged-in users."""
    return jsonify(get_users_info())

@app.route('/desktop/system/services', methods=['GET'])
def get_services_detailed():
    """Get system services information (Windows only)."""
    services = get_services_info()
    if services is None:
        return jsonify({'message': 'Services information not available on this platform'}), 404
    return jsonify({'services': services})

@app.route('/desktop/system/metrics/history', methods=['GET'])
def get_metrics_history():
    """Get historical system metrics."""
    return jsonify({
        'timestamps': list(system_metrics_history['timestamps']),
        'cpu': list(system_metrics_history['cpu']),
        'memory': list(system_metrics_history['memory']),
        'network': list(system_metrics_history['network']),
        'data_points': len(system_metrics_history['timestamps'])
    })

@app.route('/desktop/system/screenshot', methods=['GET'])
def get_screenshot():
    """Captures the current screen and returns it as a PNG image."""
    try:
        # Get optional parameters
        quality = request.args.get('quality', 95, type=int)
        width = request.args.get('width', type=int)
        height = request.args.get('height', type=int)
        
        screenshot = pyautogui.screenshot()
        
        # Resize if requested
        if width and height:
            screenshot = screenshot.resize((width, height))
        
        img_buffer = io.BytesIO()
        screenshot.save(img_buffer, format='PNG', quality=quality)
        img_buffer.seek(0)
        
        return send_file(
            img_buffer,
            mimetype='image/png',
            as_attachment=False,
            download_name=f'screenshot_{datetime.datetime.now().strftime("%Y%m%d_%H%M%S")}.png'
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/desktop/system/control/shutdown', methods=['POST'])
def shutdown_computer():
    """Shuts down the computer. Requires authentication token."""
    try:
        # Simple token-based authentication
        token = request.headers.get('Authorization')
        if not token or token != f"Bearer {os.getenv('CONTROL_TOKEN', 'default-token')}":
            return jsonify({'error': 'Unauthorized'}), 401
            
        delay = request.json.get('delay', 10) if request.json else 10
        
        if platform.system() == 'Windows':
            os.system(f"shutdown /s /t {delay}")
        else:
            os.system(f"shutdown -h +{delay//60}")
            
        return jsonify({
            'status': 'success', 
            'message': f'Shutdown scheduled in {delay} seconds'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/desktop/system/control/reboot', methods=['POST'])
def reboot_computer():
    """Reboots the computer. Requires authentication token."""
    try:
        token = request.headers.get('Authorization')
        if not token or token != f"Bearer {os.getenv('CONTROL_TOKEN', 'default-token')}":
            return jsonify({'error': 'Unauthorized'}), 401
            
        delay = request.json.get('delay', 10) if request.json else 10
        
        if platform.system() == 'Windows':
            os.system(f"shutdown /r /t {delay}")
        else:
            os.system(f"shutdown -r +{delay//60}")
            
        return jsonify({
            'status': 'success', 
            'message': f'Reboot scheduled in {delay} seconds'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/desktop/system/control/cancel-shutdown', methods=['POST'])
def cancel_shutdown():
    """Cancel a scheduled shutdown/reboot."""
    try:
        token = request.headers.get('Authorization')
        if not token or token != f"Bearer {os.getenv('CONTROL_TOKEN', 'default-token')}":
            return jsonify({'error': 'Unauthorized'}), 401
            
        if platform.system() == 'Windows':
            os.system("shutdown /a")
        else:
            os.system("shutdown -c")
            
        return jsonify({
            'status': 'success', 
            'message': 'Shutdown/reboot cancelled'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/desktop/ai/chat', methods=['POST'])
def chat_with_system():
    """Enhanced AI chat with comprehensive system context."""
    try:
        data = request.get_json()
        user_query = data.get('query')
        include_screenshot = data.get('include_screenshot', False)
        
        if not user_query:
            return jsonify({'error': 'Query not provided'}), 400
        
        if not model:
            return jsonify({'error': 'AI model not configured'}), 500

        # Gather comprehensive system context
        cpu_info = get_cpu_info()
        memory_info = get_memory_info()
        disk_info = get_disk_info()
        network_info = get_network_info()
        battery_info = get_battery_info()
        uptime_info = get_uptime()
        
        # Get top processes
        top_processes = []
        for proc in sorted(psutil.process_iter(['name', 'cpu_percent', 'memory_percent']), 
                          key=lambda p: p.info['memory_percent'], reverse=True)[:10]:
            top_processes.append(f"{proc.info['name']} ({proc.info['memory_percent']:.1f}% RAM)")

        # Create detailed system context
        system_context = f"""
        SYSTEM STATUS REPORT:
        - OS: {platform.system()} {platform.version()}
        - Hostname: {platform.node()}
        - Uptime: {uptime_info['formatted']}
        - CPU: {cpu_info.get('usage_percent', 'N/A')}% usage, {cpu_info.get('total_cores', 'N/A')} cores
        - Memory: {memory_info.get('virtual', {}).get('usage_percent', 'N/A')}% used ({memory_info.get('virtual', {}).get('used_gb', 'N/A')}GB/{memory_info.get('virtual', {}).get('total_gb', 'N/A')}GB)
        - Top Memory Processes: {', '.join(top_processes[:5])}
        - Battery: {'N/A' if not battery_info else f"{battery_info.get('percent', 'N/A')}% {'(Plugged)' if battery_info.get('power_plugged') else '(Unplugged)'}"}
        - Network: {network_info.get('io_counters', {}).get('bytes_recv', 0) / (1024**3):.2f}GB received, {network_info.get('io_counters', {}).get('bytes_sent', 0) / (1024**3):.2f}GB sent
        """

        prompt = f"""
        You are RhishDesk, an intelligent system administrator AI for this computer.
        You have real-time access to system data and can provide detailed insights.
        
        {system_context}
        
        User Question: "{user_query}"
        
        Provide a helpful, accurate response based on the current system data. Be chill and friendly instead of providing a lot of information and techincal facts.
        Have a cool and friendly tone, sometimes adding humour and sarcasm.
        Don't use text formating and keep responses fairly brief.
        If the user asks about performance issues, suggest specific solutions based on the data.

        """

        # Handle screenshot inclusion
        contents = [prompt]

        # The corrected block for your Flask app

        if include_screenshot:
            try:
                # Let's add a print statement to confirm this block is running
                print("Screenshot toggle is ON. Capturing screen...")

                screenshot = pyautogui.screenshot()
                img_buffer = io.BytesIO()
                screenshot.save(img_buffer, format='PNG')
                img_buffer.seek(0)
                
                # This is the corrected structure: a list with the prompt string and the image Part
                contents = [
                    prompt, 
                    {
                        'mime_type': 'image/png',
                        'data': img_buffer.read()
                    }
                ]
            except Exception as e:
                # Add a print statement to see the exact error
                print(f"!!! ERROR capturing or processing screenshot: {str(e)}")
                contents.append(f"[Screenshot capture failed: {str(e)}]")

        response = model.generate_content(contents)
        ai_response = response.text

        return jsonify({
            'user_query': user_query,
            'ai_response': ai_response,
            'system_summary': {
                'cpu_usage': cpu_info.get('usage_percent'),
                'memory_usage': memory_info.get('virtual', {}).get('usage_percent'),
                'uptime': uptime_info['formatted'],
                'battery_percent': battery_info.get('percent') if battery_info else None
            },
            'timestamp': datetime.datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({'error': f'AI processing error: {str(e)}'}), 500

@app.route('/desktop/health', methods=['GET'])
def health_check():
    """Health check endpoint for monitoring."""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.datetime.now().isoformat(),
        'uptime': get_uptime(),
        'api_version': '2.0',
        'endpoints_available': len([rule.rule for rule in app.url_map.iter_rules()])
    })

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    print("🚀 Enhanced System Management API starting...")
    print("📊 Background metrics collection enabled")
    print("🔌 Available endpoints:")
    for rule in app.url_map.iter_rules():
        print(f"   {rule.methods} {rule.rule}")
    
    app.run(port=5000, debug=True, threaded=True)