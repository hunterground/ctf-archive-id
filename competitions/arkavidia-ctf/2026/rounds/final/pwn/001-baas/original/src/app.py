from flask import Flask, request, render_template_string
import os
import subprocess

app = Flask(__name__)
WORK_DIR = '/app' 

HTML_PAGE = """
<!DOCTYPE html>
<html>
<head>
    <title>BIOS as a Service (BaaS)</title>
    <style>
        body { font-family: monospace; background: #1e1e1e; color: #d4d4d4; padding: 20px; }
        pre { background: #000; padding: 15px; border: 1px solid #333; overflow-x: auto; color: #00ff00; }
        .header { display: flex; align-items: center; gap: 10px; border-bottom: 1px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
        input[type="submit"] { background: #007acc; color: white; border: none; padding: 8px 15px; cursor: pointer; font-weight: bold; }
        input[type="submit"]:hover { background: #005f9e; }
        .warning { color: #ff5555; font-size: 0.8em; margin-top: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h2>☁️ BIOS as a Service (BaaS)</h2>
    </div>
    <p>Upload your <code>.bin</code> firmware. We will spin up a bare-metal RISC-V instance in the cloud and execute it for you.</p>
    <form method="POST" enctype="multipart/form-data">
        <input type="file" name="file" accept=".bin" required>
        <input type="submit" value="Deploy to QEMU">
    </form>
    
    {% if output %}
        <h3>Terminal Output:</h3>
        <pre>{{ output }}</pre>
    {% endif %}
</body>
</html>
"""

@app.route('/', methods=['GET', 'POST'])
def index():
    output = ""
    if request.method == 'POST':
        if 'file' not in request.files:
            return 'No file part'
        
        file = request.files['file']
        if file.filename == '':
            return 'No selected file'
            
        if file:
            filepath = os.path.join(WORK_DIR, 'bios.bin')
            file.save(filepath)
            
            cmd = [
                "./qemu-system-riscv64", 
                "-icount", "shift=5",
                "-machine", "gatekeeper", 
                "-bios", "bios.bin",
            ]
            
            try:
                result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
                output = result.stdout + "\n" + result.stderr
            except subprocess.TimeoutExpired:
                output = "[!] Execution timed out after 10 seconds. Check for infinite loops."
            except Exception as e:
                output = f"[!] Error executing QEMU: {str(e)}"
                
    return render_template_string(HTML_PAGE, output=output)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8875)
