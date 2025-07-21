from flask import Flask, jsonify
import psutil
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # enable CORS

@app.route("/pc/memory", methods=["GET"])
def get_memory():
    mem = psutil.virtual_memory()
    return jsonify({
        "total": mem.total,
        "available": mem.available,
        "used": mem.used,
        "percent": mem.percent
    })

if __name__ == "__main__":
    app.run(port=5000)
