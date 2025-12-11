"""
Desktop Control Module
Provides real-time video streaming and touch input mapping for remote desktop control.
"""

import io
import time
import pyautogui
from flask import Blueprint, Response, request, jsonify
import os

# Create Blueprint for control endpoints
control_bp = Blueprint('control', __name__)

# Disable pyautogui fail-safe for smoother operation (be careful with this!)
pyautogui.FAILSAFE = False

# --- HELPER FUNCTIONS ---

def get_screen_dimensions():
    """Returns the screen width and height."""
    return pyautogui.size()

def map_to_screen(x, y, normalized=True):
    """
    Maps input coordinates to screen pixel coordinates.
    
    Args:
        x: X coordinate (0-1 if normalized, pixels otherwise)
        y: Y coordinate (0-1 if normalized, pixels otherwise)
        normalized: If True, x and y are in 0-1 range
    
    Returns:
        Tuple of (screen_x, screen_y) in pixels
    """
    screen_width, screen_height = get_screen_dimensions()
    
    if normalized:
        screen_x = int(x * screen_width)
        screen_y = int(y * screen_height)
    else:
        screen_x = int(x)
        screen_y = int(y)
    
    # Clamp to screen bounds
    screen_x = max(0, min(screen_x, screen_width - 1))
    screen_y = max(0, min(screen_y, screen_height - 1))
    
    return screen_x, screen_y

def generate_frames(fps=15, quality=70, scale=0.5, cursor_style='crosshair'):
    """
    Generator function that captures screenshots and yields MJPEG frames.
    
    Args:
        fps: Target frames per second
        quality: JPEG quality (1-100)
        scale: Scale factor for resolution (0.1-1.0)
        cursor_style: 'crosshair' (red), 'simple' (white circle), or 'none'
    """
    frame_interval = 1.0 / fps
    
    # Try to use mss for faster capture, fallback to PIL
    try:
        import mss
        import mss.tools
        from PIL import Image, ImageDraw
        sct = mss.mss()
        use_mss = True
        print("Using mss for fast screen capture")
    except ImportError:
        use_mss = False
        from PIL import ImageDraw
        print("Using pyautogui for screen capture (install mss for better performance)")
    
    while True:
        start_time = time.time()
        
        try:
            if use_mss:
                # Capture with mss (faster)
                monitor = sct.monitors[1]  # Primary monitor
                sct_img = sct.grab(monitor)
                screenshot = Image.frombytes('RGB', (sct_img.width, sct_img.height), sct_img.rgb)
            else:
                # Fallback to pyautogui
                screenshot = pyautogui.screenshot()
            
            # Draw cursor indicator based on style
            if cursor_style != 'none':
                try:
                    cursor_x, cursor_y = pyautogui.position()
                    draw = ImageDraw.Draw(screenshot)
                    
                    if cursor_style == 'simple':
                        # Simple white circle cursor
                        size = 10
                        draw.ellipse([
                            cursor_x - size, cursor_y - size,
                            cursor_x + size, cursor_y + size
                        ], fill='white', outline='black', width=2)
                    
                    else:  # 'crosshair' - default
                        # Outer circle (white outline for visibility)
                        outer_size = 15
                        draw.ellipse([
                            cursor_x - outer_size, cursor_y - outer_size,
                            cursor_x + outer_size, cursor_y + outer_size
                        ], outline='white', width=3)
                        
                        # Inner circle (red)
                        inner_size = 12
                        draw.ellipse([
                            cursor_x - inner_size, cursor_y - inner_size,
                            cursor_x + inner_size, cursor_y + inner_size
                        ], outline='red', width=3)
                        
                        # Center dot
                        dot_size = 4
                        draw.ellipse([
                            cursor_x - dot_size, cursor_y - dot_size,
                            cursor_x + dot_size, cursor_y + dot_size
                        ], fill='red')
                        
                        # Crosshair lines
                        line_length = 20
                        draw.line([(cursor_x - line_length, cursor_y), (cursor_x - inner_size - 2, cursor_y)], fill='red', width=2)
                        draw.line([(cursor_x + inner_size + 2, cursor_y), (cursor_x + line_length, cursor_y)], fill='red', width=2)
                        draw.line([(cursor_x, cursor_y - line_length), (cursor_x, cursor_y - inner_size - 2)], fill='red', width=2)
                        draw.line([(cursor_x, cursor_y + inner_size + 2), (cursor_x, cursor_y + line_length)], fill='red', width=2)
                        
                except Exception as e:
                    print(f"Error drawing cursor: {e}")
            
            # Scale down if needed
            if scale < 1.0:
                new_width = int(screenshot.width * scale)
                new_height = int(screenshot.height * scale)
                screenshot = screenshot.resize((new_width, new_height))
            
            # Convert to JPEG
            img_buffer = io.BytesIO()
            screenshot.save(img_buffer, format='JPEG', quality=quality)
            frame_data = img_buffer.getvalue()
            
            # Yield MJPEG frame
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_data + b'\r\n')
            
        except Exception as e:
            print(f"Error capturing frame: {e}")
            continue
        
        # Maintain target FPS
        elapsed = time.time() - start_time
        if elapsed < frame_interval:
            time.sleep(frame_interval - elapsed)

# --- API ENDPOINTS ---

@control_bp.route('/desktop/livestream', methods=['GET'])
def livestream():
    """
    Streams the desktop as Motion JPEG (MJPEG).
    
    Query Parameters:
        fps: Frames per second (default: 15, max: 30)
        quality: JPEG quality 1-100 (default: 70)
        scale: Resolution scale 0.1-1.0 (default: 0.5)
        cursor: Cursor style - 'crosshair', 'simple', or 'none' (default: crosshair)
    """
    fps = min(request.args.get('fps', 15, type=int), 30)
    quality = max(1, min(request.args.get('quality', 70, type=int), 100))
    scale = max(0.1, min(request.args.get('scale', 0.5, type=float), 1.0))
    cursor_style = request.args.get('cursor', 'crosshair', type=str)
    
    # Validate cursor style
    if cursor_style not in ['crosshair', 'simple', 'none']:
        cursor_style = 'crosshair'
    
    return Response(
        generate_frames(fps=fps, quality=quality, scale=scale, cursor_style=cursor_style),
        mimetype='multipart/x-mixed-replace; boundary=frame'
    )

@control_bp.route('/desktop/livestream/info', methods=['GET'])
def livestream_info():
    """Returns information about the livestream and screen dimensions."""
    screen_width, screen_height = get_screen_dimensions()
    return jsonify({
        'screen_width': screen_width,
        'screen_height': screen_height,
        'default_fps': 15,
        'default_quality': 70,
        'default_scale': 0.5,
        'stream_url': '/desktop/livestream'
    })

@control_bp.route('/desktop/mapping', methods=['POST'])
def handle_input():
    """
    Handles touch input for mouse control.
    
    Request Body:
        action: 'move' | 'tap' | 'doubletap' | 'drag_start' | 'drag_move' | 'drag_end' | 'rightclick'
        x: X coordinate (0-1 if normalized, pixels otherwise)
        y: Y coordinate (0-1 if normalized, pixels otherwise)
        normalized: If true, x/y are in 0-1 range (default: true)
    
    Requires Authorization header with CONTROL_TOKEN.
    """
    # Token-based authorization
    token = request.headers.get('Authorization')
    expected_token = f"Bearer {os.getenv('CONTROL_TOKEN', 'default-token')}"
    
    if not token or token != expected_token:
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        action = data.get('action')
        x = data.get('x')
        y = data.get('y')
        dx = data.get('dx')
        dy = data.get('dy')
        normalized = data.get('normalized', True)
        
        if action is None:
            return jsonify({'error': 'Action is required'}), 400
        
        # Calculate screen coordinates if x/y provided
        screen_x, screen_y = None, None
        if x is not None and y is not None:
            screen_x, screen_y = map_to_screen(x, y, normalized)
        
        # Execute the action
        if action == 'move':
            if dx is not None and dy is not None:
                # Relative movement
                screen_width, screen_height = get_screen_dimensions()
                if normalized:
                    move_x = int(dx * screen_width)
                    move_y = int(dy * screen_height)
                else:
                    move_x = int(dx)
                    move_y = int(dy)
                
                # Apply a sensitivity/speed multiplier (optional, can be passed in request or hardcoded)
                sensitivity = data.get('sensitivity', 1.5)
                move_x = int(move_x * sensitivity)
                move_y = int(move_y * sensitivity)
                
                pyautogui.move(move_x, move_y)
                
                return jsonify({
                    'status': 'success',
                    'action': 'move_relative',
                    'delta': {'x': move_x, 'y': move_y}
                })
            elif screen_x is not None and screen_y is not None:
                # Absolute movement
                pyautogui.moveTo(screen_x, screen_y, duration=0)
                return jsonify({
                    'status': 'success',
                    'action': 'move_absolute',
                    'screen_position': {'x': screen_x, 'y': screen_y}
                })
            else:
                return jsonify({'error': 'For move action, provide either (x,y) or (dx,dy)'}), 400
        
        elif action == 'tap':
            if screen_x is not None:
                pyautogui.click(screen_x, screen_y)
            else:
                pyautogui.click()
            return jsonify({'status': 'success', 'action': 'tap'})
        
        elif action == 'doubletap':
            if screen_x is not None:
                pyautogui.doubleClick(screen_x, screen_y)
            else:
                pyautogui.doubleClick()
            return jsonify({'status': 'success', 'action': 'doubletap'})
        
        elif action == 'rightclick':
            if screen_x is not None:
                pyautogui.rightClick(screen_x, screen_y)
            else:
                pyautogui.rightClick()
            return jsonify({'status': 'success', 'action': 'rightclick'})
        
        elif action == 'drag_start':
            if screen_x is not None:
                pyautogui.moveTo(screen_x, screen_y, duration=0)
            pyautogui.mouseDown()
            return jsonify({'status': 'success', 'action': 'drag_start'})
        
        elif action == 'drag_move':
            # Support relative drag if dx/dy provided
            if dx is not None and dy is not None:
                screen_width, screen_height = get_screen_dimensions()
                if normalized:
                    move_x = int(dx * screen_width)
                    move_y = int(dy * screen_height)
                else:
                    move_x = int(dx)
                    move_y = int(dy)
                sensitivity = data.get('sensitivity', 1.5)
                pyautogui.move(int(move_x * sensitivity), int(move_y * sensitivity))
            elif screen_x is not None:
                pyautogui.moveTo(screen_x, screen_y, duration=0)
            return jsonify({'status': 'success', 'action': 'drag_move'})
        
        elif action == 'drag_end':
            # Typically just release, but might move to final spot first
            if screen_x is not None:
                pyautogui.moveTo(screen_x, screen_y, duration=0)
            pyautogui.mouseUp()
            return jsonify({'status': 'success', 'action': 'drag_end'})
        
        elif action == 'scroll':
            # Scroll action - uses 'delta' for scroll amount
            delta = data.get('delta', 0)
            pyautogui.scroll(delta)
            return jsonify({
                'status': 'success',
                'action': 'scroll',
                'delta': delta
            })
        
        else:
            return jsonify({'error': f'Unknown action: {action}'}), 400
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@control_bp.route('/desktop/mapping/actions', methods=['GET'])
def list_actions():
    """Returns a list of available input actions."""
    return jsonify({
        'actions': [
            {
                'name': 'move',
                'description': 'Move mouse to position',
                'requires': ['x', 'y']
            },
            {
                'name': 'tap',
                'description': 'Single click at position',
                'requires': ['x', 'y']
            },
            {
                'name': 'doubletap',
                'description': 'Double click at position',
                'requires': ['x', 'y']
            },
            {
                'name': 'rightclick',
                'description': 'Right click at position',
                'requires': ['x', 'y']
            },
            {
                'name': 'drag_start',
                'description': 'Start dragging from position',
                'requires': ['x', 'y']
            },
            {
                'name': 'drag_move',
                'description': 'Continue dragging to position',
                'requires': ['x', 'y']
            },
            {
                'name': 'drag_end',
                'description': 'End dragging at position',
                'requires': ['x', 'y']
            },
            {
                'name': 'scroll',
                'description': 'Scroll up (positive) or down (negative)',
                'requires': ['delta']
            }
        ],
        'coordinate_format': {
            'normalized': 'x and y values between 0-1 (recommended)',
            'pixel': 'x and y values in screen pixels'
        }
    })
