import os
import logging
import secrets
import asyncio
from typing import List, Optional
from fastapi import FastAPI, HTTPException, WebSocket, Depends, Header, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from .utils import get_logger
from .audit import full_audit
from .consolidated_builder import run_consolidated_build
from .nlp_service import nlp_service

logger = get_logger(__name__)
app = FastAPI(title="Heady Admin Console")

# Log Queue for Streaming
log_queue = asyncio.Queue()

class QueueHandler(logging.Handler):
    def emit(self, record):
        entry = self.format(record)
        try:
            log_queue.put_nowait(entry)
        except asyncio.QueueFull:
            pass

queue_handler = QueueHandler()
queue_handler.setFormatter(logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s"))
logging.getLogger().addHandler(queue_handler)

# Security
ADMIN_TOKEN = os.getenv("ADMIN_TOKEN", "default_insecure_token")

async def verify_token(x_admin_token: str = Header(...)):
    if not secrets.compare_digest(x_admin_token, ADMIN_TOKEN):
        raise HTTPException(status_code=401, detail="Invalid Admin Token")
    return x_admin_token

# Models
class FileContent(BaseModel):
    path: str
    content: str

class ActionRequest(BaseModel):
    action: str
    params: Optional[dict] = {}

class AIAssistRequest(BaseModel):
    context: str
    prompt: str

class SummarizeRequest(BaseModel):
    text: str

# API Endpoints
def validate_path(path: str):
    """Ensures path is within the project root."""
    root_dir = os.path.abspath(".")
    requested_path = os.path.abspath(path)
    if not os.path.commonpath([root_dir, requested_path]) == root_dir:
        raise HTTPException(status_code=403, detail="Access denied: Path outside project root")
    return requested_path

@app.get("/api/files", dependencies=[Depends(verify_token)])
async def list_files(path: str = "."):
    """Lists files in the repository."""
    try:
        validated_path = validate_path(path)
    except HTTPException:
        # For listing, if path is invalid/outside, just list root or error
        validated_path = os.path.abspath(".")

    file_list = []
    for root, dirs, files in os.walk(validated_path):
        if ".git" in root or "__pycache__" in root or "node_modules" in root:
            continue
        for name in files:
            rel_path = os.path.relpath(os.path.join(root, name), ".")
            file_list.append(rel_path)
    return {"files": file_list}

@app.get("/api/files/{file_path:path}", dependencies=[Depends(verify_token)])
async def read_file(file_path: str):
    """Reads content of a file."""
    validated_path = validate_path(file_path)
    if not os.path.exists(validated_path):
        raise HTTPException(status_code=404, detail="File not found")
    try:
        with open(validated_path, "r") as f:
            return {"content": f.read()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/files", dependencies=[Depends(verify_token)])
async def save_file(file_data: FileContent):
    """Saves content to a file."""
    validated_path = validate_path(file_data.path)
    try:
        with open(validated_path, "w") as f:
            f.write(file_data.content)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/action", dependencies=[Depends(verify_token)])
async def trigger_action(request: ActionRequest):
    """Triggers a build or audit action."""
    logger.info(f"Triggering action: {request.action}")
    if request.action == "full_audit":
        full_audit()
        return {"status": "audit_initiated"}
    elif request.action == "builder_build":
        run_consolidated_build("latest") # Simplified
        return {"status": "build_initiated"}
    else:
        raise HTTPException(status_code=400, detail="Unknown action")

@app.post("/api/ai_assist", dependencies=[Depends(verify_token)])
async def ai_assist(request: AIAssistRequest):
    """AI assistant endpoint using Hugging Face models."""
    logger.info(f"AI Assistant Request: {request.prompt}")
    # Combine context and prompt (truncate context if needed)
    full_prompt = f"Context: {request.context[:500]}\nUser: {request.prompt}\nAssistant:"
    response = nlp_service.generate_response(full_prompt)
    # Strip the prompt from the response if the model echoes it (common with CausalLM)
    suggestion = response.replace(full_prompt, "").strip()
    if not suggestion:
        suggestion = response # Fallback
    return {"suggestion": suggestion}

@app.post("/api/summarize", dependencies=[Depends(verify_token)])
async def summarize_text(request: SummarizeRequest):
    """Summarizes the provided text."""
    logger.info("Summarization Request received")
    summary = nlp_service.summarize_text(request.text)
    return {"summary": summary}

@app.websocket("/api/logs")
async def websocket_endpoint(websocket: WebSocket, token: Optional[str] = None):
    # For websockets, we can't easily use headers in browser API, so we check query param
    if not token or not secrets.compare_digest(token, ADMIN_TOKEN):
        await websocket.close(code=1008)
        return

    await websocket.accept()
    logger.info("Websocket connected")
    try:
        while True:
            log_entry = await log_queue.get()
            await websocket.send_text(log_entry)
    except Exception as e:
        logger.error(f"Websocket error: {e}")

# Serve Frontend
if os.path.exists("frontend/build"):
    app.mount("/", StaticFiles(directory="frontend/build", html=True), name="static")
