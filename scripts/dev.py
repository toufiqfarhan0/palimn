"""Single command launcher to start both PALIMN backend (FastAPI) and frontend (Vite) concurrently."""
import os
import sys
import subprocess
import signal
import time

def main():
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    frontend_dir = os.path.join(root_dir, "frontend")
    
    # Locate Python interpreter in .venv or system
    venv_python = os.path.join(root_dir, ".venv", "Scripts", "python.exe") if os.name == "nt" else os.path.join(root_dir, ".venv", "bin", "python")
    python_bin = venv_python if os.path.exists(venv_python) else sys.executable
    
    # Locate npm executable
    npm_cmd = "npm.cmd" if os.name == "nt" else "npm"

    print("=" * 60)
    print("  PALIMN: Starting Backend & Frontend Servers...")
    print("  - Backend:  http://localhost:8000")
    print("  - Frontend: http://localhost:5173")
    print("  Press Ctrl+C to stop both servers.")
    print("=" * 60)

    # Launch Backend (FastAPI via Uvicorn)
    backend_cmd = [
        python_bin,
        "-m",
        "uvicorn",
        "backend.app.main:app",
        "--host",
        "0.0.0.0",
        "--port",
        "8000",
        "--reload",
    ]
    backend_proc = subprocess.Popen(backend_cmd, cwd=root_dir)

    # Launch Frontend (Vite dev server)
    frontend_cmd = [npm_cmd, "run", "dev"]
    frontend_proc = subprocess.Popen(frontend_cmd, cwd=frontend_dir)

    def cleanup(signum=None, frame=None):
        print("\nShutting down PALIMN servers...")
        try:
            frontend_proc.terminate()
            backend_proc.terminate()
        except Exception:
            pass
        sys.exit(0)

    signal.signal(signal.SIGINT, cleanup)
    if hasattr(signal, "SIGTERM"):
        signal.signal(signal.SIGTERM, cleanup)

    try:
        while True:
            time.sleep(0.5)
            if backend_proc.poll() is not None or frontend_proc.poll() is not None:
                break
    except KeyboardInterrupt:
        cleanup()

if __name__ == "__main__":
    main()
