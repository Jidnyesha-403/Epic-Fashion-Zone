import os
from fastapi import FastAPI
from fastapi.responses import JSONResponse

app = FastAPI()

@app.get("/api/files")
def list_files():
    files_tree = []
    # Start searching from current directory or parent directory
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    for root, dirs, files in os.walk(base_dir):
        # Skip .venv, node_modules, .git
        if any(x in root for x in [".venv", "node_modules", ".git", "__pycache__", "venv"]):
            continue
        for file in files:
            files_tree.append(os.path.relpath(os.path.join(root, file), base_dir))
    return JSONResponse(content={"base_dir": base_dir, "files": sorted(files_tree)})
