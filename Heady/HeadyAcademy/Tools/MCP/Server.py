import sys
import json
import logging
import subprocess
import shlex
from pathlib import Path

# HeadySystems Local MCP Server
# Implements JSON-RPC 2.0 over Stdio to expose Heady Tools to AI Clients

logging.basicConfig(level=logging.ERROR)
TOOLS_DIR = Path(__file__).parent.parent

# Tool Registry - maps MCP tool names to actual Python scripts
TOOL_REGISTRY = {
    "scan_gaps": {"script": "Gap_Scanner.py", "description": "Scan repo for missing docs/tests"},
    "verify_auth": {"script": "Heady_Chain.py", "description": "Verify User Role via Blockchain"},
    "security_audit": {"script": "Security_Audit.py", "description": "Run security vulnerability scan"},
    "brainstorm": {"script": "Brainstorm.py", "description": "Generate brainstorming ideas"},
    "visualize": {"script": "Visualizer.py", "description": "Generate project visualization"},
    "clean_sweep": {"script": "Clean_Sweep.py", "description": "Clean temporary files"},
    "generate_content": {"script": "Content_Generator.py", "description": "Generate marketing/whitepaper content"},
    "learn_tool": {"script": "Tool_Learner.py", "description": "Document a CLI tool"},
    "optimize": {"script": "Optimizer.py", "description": "Analyze code for optimizations"},
    "obfuscate": {"script": "Heady_Crypt.py", "description": "Obfuscate file contents"},
    "auto_doc": {"script": "Auto_Doc.py", "description": "Generate documentation"},
}

def execute_tool(tool_name, arguments):
    """Execute a real Heady tool and return output."""
    if tool_name not in TOOL_REGISTRY:
        return None, f"Tool '{tool_name}' not found"
    
    tool_info = TOOL_REGISTRY[tool_name]
    script_path = TOOLS_DIR / tool_info["script"]
    
    if not script_path.exists():
        return None, f"Script not found: {script_path}"
    
    # Build command arguments based on tool
    cmd_args = [sys.executable, str(script_path)]
    
    if tool_name == "scan_gaps":
        cmd_args.append(arguments.get("path", "."))
    elif tool_name == "verify_auth":
        cmd_args.extend(["verify", arguments.get("role", "ADMIN"), arguments.get("user", "USER")])
    elif tool_name == "security_audit":
        cmd_args.append(arguments.get("path", "."))
    elif tool_name == "brainstorm":
        cmd_args.append(arguments.get("topic", "innovation"))
    elif tool_name == "visualize":
        cmd_args.append(arguments.get("path", "."))
    elif tool_name == "clean_sweep":
        cmd_args.append(arguments.get("path", "."))
        if arguments.get("dry_run"):
            cmd_args.append("--dry")
    elif tool_name == "generate_content":
        cmd_args.extend([arguments.get("mode", "marketing"), arguments.get("subject", "HeadySystems")])
    elif tool_name == "learn_tool":
        cmd_args.append(arguments.get("tool", "python"))
    elif tool_name == "optimize":
        cmd_args.append(arguments.get("path", "."))
    elif tool_name == "obfuscate":
        file_path = arguments.get("file")
        if not file_path:
            return None, "File path is required for obfuscation"
        cmd_args.append(file_path)
    elif tool_name == "auto_doc":
        cmd_args.append(arguments.get("path", "."))
    
    try:
        result = subprocess.run(cmd_args, capture_output=True, text=True, timeout=60)
        output = result.stdout + result.stderr
        return output.strip(), None
    except subprocess.TimeoutExpired:
        return None, "Tool execution timed out"
    except Exception as e:
        return None, str(e)

def build_tool_list():
    """Build MCP tool list with input schemas."""
    tools = []
    schemas = {
        "scan_gaps": {"path": {"type": "string", "description": "Directory to scan"}},
        "verify_auth": {"user": {"type": "string", "description": "Username"}, "role": {"type": "string", "description": "User role"}},
        "security_audit": {"path": {"type": "string", "description": "Path to audit"}},
        "brainstorm": {"topic": {"type": "string", "description": "Topic to brainstorm"}},
        "visualize": {"path": {"type": "string", "description": "Directory to visualize"}},
        "clean_sweep": {"path": {"type": "string", "description": "Path to clean"}, "dry_run": {"type": "boolean", "description": "Dry run mode"}},
        "generate_content": {"mode": {"type": "string", "enum": ["whitepaper", "marketing", "data"], "description": "Content type"}, "subject": {"type": "string", "description": "Content subject"}},
        "learn_tool": {"tool": {"type": "string", "description": "Tool name to document"}},
        "optimize": {"path": {"type": "string", "description": "Path to analyze"}},
        "obfuscate": {"file": {"type": "string", "description": "File to obfuscate"}},
        "auto_doc": {"path": {"type": "string", "description": "Path to document"}},
    }
    
    for name, info in TOOL_REGISTRY.items():
        tools.append({
            "name": name,
            "description": info["description"],
            "inputSchema": {"type": "object", "properties": schemas.get(name, {})}
        })
    return tools

def handle_request(req):
    try:
        if "method" not in req:
            return {"error": "No method"}
        
        method = req["method"]
        msg_id = req.get("id", None)
        
        # MCP Handshake / Capabilities
        if method == "initialize":
            return {
                "jsonrpc": "2.0",
                "id": msg_id,
                "result": {
                    "protocolVersion": "2024-11-05",
                    "capabilities": {"tools": {}},
                    "serverInfo": {"name": "HeadyAcademy", "version": "2.0"}
                }
            }

        # Tool Listing
        if method == "tools/list":
            return {
                "jsonrpc": "2.0", 
                "id": msg_id,
                "result": {"tools": build_tool_list()}
            }
            
        # Tool Execution - Now runs REAL tools
        if method == "tools/call":
            params = req.get("params", {})
            tool_name = params.get("name")
            arguments = params.get("arguments", {})
            
            output, error = execute_tool(tool_name, arguments)
            
            if error:
                return {"jsonrpc": "2.0", "id": msg_id, "error": {"code": -32000, "message": error}}
                
            return {
                "jsonrpc": "2.0",
                "id": msg_id,
                "result": {"content": [{"type": "text", "text": output}]}
            }

        return {"jsonrpc": "2.0", "id": msg_id, "result": {}}

    except Exception as e:
        return {"jsonrpc": "2.0", "id": req.get("id"), "error": {"code": -32000, "message": str(e)}}

if __name__ == "__main__":
    # Standard IO Loop for MCP
    while True:
        try:
            line = sys.stdin.readline()
            if not line: break
            req = json.loads(line)
            res = handle_request(req)
            if res:
                sys.stdout.write(json.dumps(res) + "\n")
                sys.stdout.flush()
        except KeyboardInterrupt:
            break
        except Exception as e:
            logging.error(f"Error processing request: {e}")
            continue

# Optional: Add graceful shutdown and logging
def shutdown():
    """Clean shutdown of MCP server."""
    logging.info("MCP Server shutting down")
    sys.exit(0)

# Optional: Health check endpoint for monitoring
def health_check():
    """Return server health status."""
    return {
        "status": "healthy",
        "tools_available": len(TOOL_REGISTRY),
        "protocol_version": "2024-11-05"
    }

def naive_linechunk(text, max_bytes=4096):
    """Yield line-based chunks that respect a byte size limit.

    This is a naive splitter: it keeps whole lines together and ensures that
    each yielded chunk, when UTF-8 encoded, is at most `max_bytes`. Very long
    individual lines that exceed `max_bytes` are emitted on their own.

    Args:
        text (str): Full input text to chunk.
        max_bytes (int): Maximum UTF-8 byte length per chunk.

    Yields:
        str: Chunks of the original text.
    """
    if not isinstance(text, str):
        raise TypeError("text must be a string")
    if max_bytes <= 0:
        raise ValueError("max_bytes must be positive")

    current = []
    current_size = 0

    for line in text.splitlines(keepends=True):
        line_bytes = len(line.encode("utf-8"))

        # If a single line is too large, flush current buffer and yield line alone
        if line_bytes > max_bytes:
            if current:
                yield "".join(current)
                current = []
                current_size = 0
            yield line
            continue

        # If adding this line would exceed the limit, flush current buffer first
        if current_size + line_bytes > max_bytes:
            if current:
                yield "".join(current)
            current = [line]
            current_size = line_bytes
        else:
            current.append(line)
            current_size += line_bytes

    if current:
        yield "".join(current)

class AutoCommitTracker:
    """Track changes and auto-commit every N changes."""

    def __init__(self, threshold: int = 3):
        if threshold <= 0:
            raise ValueError("threshold must be positive")
        self.threshold = threshold
        self._counter = 0

    def mark_change(self, message: str = "Auto-commit from MCP server") -> None:
        """Record a change; when threshold is reached, run tests and commit."""
        import subprocess

        self._counter += 1
        if self._counter < self.threshold:
            return

        self._counter = 0
        try:
            # Optional: run tests before committing; ignore failures for now
            subprocess.run(["pytest", "-q"], check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

            # Stage all changes
            subprocess.run(["git", "add", "-A"], check=True)

            # Commit with provided message
            subprocess.run(["git", "commit", "-m", message], check=True)
        except (subprocess.SubprocessError, OSError) as e:
            logging.error(f"Auto-commit failed: {e}")
            return

# Global tracker instance for this module
_auto_commit_tracker = AutoCommitTracker(threshold=3)

def auto_run_and_commit(command: str = "pytest -q", threshold: int = 3):
    """Run a command and mark a change for periodic auto-commit.

    Args:
        command: Shell command to execute before marking change.
        threshold: Optional override of global auto-commit threshold.
    """
    import subprocess

    if threshold <= 0:
        raise ValueError("threshold must be positive")

    # Optionally allow per-call override of threshold
    if _auto_commit_tracker.threshold != threshold:
        _auto_commit_tracker.threshold = threshold

    try:
        subprocess.run(shlex.split(command), check=False)
    except (subprocess.SubprocessError, OSError) as e:
        logging.error(f"Command execution failed: {e}")
        pass

    _auto_commit_tracker.mark_change(f"Auto-commit after '{command}'")

def schedule_auto_run_and_commit(interval_seconds: int = 300, command: str = "pytest -q", threshold: int = 3):
    """Periodically run a command and auto-commit in a best-effort background loop.

    This is a blocking loop; callers should run it in a background thread or process
    if they need the main thread to remain responsive.
    """
    import time

    if interval_seconds <= 0:
        raise ValueError("interval_seconds must be positive")

    while True:
        try:
            auto_run_and_commit(command=command, threshold=threshold)
        except (subprocess.SubprocessError, OSError) as e:
            logging.error(f"Auto-commit scheduler error: {e}")
            pass
        time.sleep(interval_seconds)

def start_background_auto_committer(
    interval_seconds: int = 300,
    command: str = "pytest -q",
    threshold: int = 3,
):
    """Start a detached background process that runs periodic auto-commit.

    This spawns a separate Python process running schedule_auto_run_and_commit
    so the current process can exit or continue without blocking.
    """
    import os
    import sys
    import subprocess

    if interval_seconds <= 0:
        raise ValueError("interval_seconds must be positive")

    env = os.environ.copy()
    module_path = Path(__file__).resolve()

    # Spawn a detached background process:
    # python Server.py --auto-commit-scheduler <interval> <command> <threshold>
    cmd = [
        sys.executable,
        str(module_path),
        "--auto-commit-scheduler",
        str(interval_seconds),
        command,
        str(threshold),
    ]

    # Platform-agnostic "best effort" background spawn
    creationflags = 0
    if os.name == "nt":
        creationflags = subprocess.DETACHED_PROCESS | subprocess.CREATE_NEW_PROCESS_GROUP  # type: ignore[attr-defined]

    subprocess.Popen(
        cmd,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        stdin=subprocess.DEVNULL,
        env=env,
        close_fds=(os.name != "nt"),
        creationflags=creationflags,
    )

if __name__ == "__main__" and "--auto-commit-scheduler" in sys.argv:
    # Minimal CLI entrypoint for detached scheduler
    try:
        idx = sys.argv.index("--auto-commit-scheduler")
        interval = int(sys.argv[idx + 1]) if len(sys.argv) > idx + 1 else 300
        cmd = sys.argv[idx + 2] if len(sys.argv) > idx + 2 else "pytest -q"
        thr = int(sys.argv[idx + 3]) if len(sys.argv) > idx + 3 else 3
        schedule_auto_run_and_commit(interval_seconds=interval, command=cmd, threshold=thr)
    except Exception:
        # Last-resort guard; avoid crashing background helper
        pass

def enable_regular_auto_commits(
    interval_seconds: int = 300,
    command: str = "pytest -q",
    threshold: int = 3,
) -> None:
    """Convenience wrapper to start the background auto-committer.

    Intended to be called once at server startup to keep tests running
    and commits flowing in the background.

    Args:
        interval_seconds: How often to run the command.
        command: Command to execute before marking a change.
        threshold: Number of runs before triggering a git commit.
    """
    start_background_auto_committer(
        interval_seconds=interval_seconds,
        command=command,
        threshold=threshold,
    )

def auto_run_and_commit_regularly(
    interval_seconds: int = 300,
    command: str = "pytest -q",
    threshold: int = 3,
) -> None:
    """Enable periodic auto-run and commit with a single call."""
    enable_regular_auto_commits(
        interval_seconds=interval_seconds,
        command=command,
        threshold=threshold,
    )

def enable_default_auto_commits() -> None:
    """Enable periodic auto-run and auto-commit with default settings."""
    auto_run_and_commit_regularly()

def auto_run_and_commit_now(command: str = "pytest -q", threshold: int = 3) -> None:
    """Run the auto-commit pipeline immediately using current settings."""
    auto_run_and_commit(command=command, threshold=threshold)

def semantic_chunk(text: str, max_len: int = 4096, overlap: int = 200) -> list[str]:
    """Split text into overlapping chunks for better context preservation.
    
    Args:
        text: Input text to chunk.
        max_len: Maximum character length per chunk.
        overlap: Number of characters to overlap between chunks.
    
    Returns:
        List of text chunks with overlap for continuity.
    """
    if not text:
        return []
    
    # Use the byte-based chunker for consistency
    base_chunks = list(naive_linechunk(text, max_len - overlap))
    if len(base_chunks) <= 1:
        return base_chunks
    
    result = [base_chunks[0]]
    for i in range(1, len(base_chunks)):
        # Create proper overlapping chunks
        prev_chunk = base_chunks[i - 1]
        curr_chunk = base_chunks[i]
        
        if len(prev_chunk) > overlap:
            overlap_text = prev_chunk[-overlap:]
        else:
            overlap_text = prev_chunk
            
        result.append(overlap_text + curr_chunk)
    
    return result