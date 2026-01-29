# Heady Data Processing Framework

Heady is a Python-based data-processing framework designed to manage project manifests, archives, and audits. It provides a CLI for building manifests from configuration files and an Admin UI for system management.

## Architecture

The project is consolidated under `src/heady_project/` and includes the following modules:
- `api.py`: FastAPI backend for the Admin UI.
- `execute_build.py`: Main script for building manifests from `projects.json`.
- `consolidated_builder.py`: Internal logic for build steps and archiving.
- `admin_console.py`: CLI tool for administrative tasks.
- `nlp_service.py`: Hugging Face transformers integration for AI features.
- `frontend/`: React-based Admin UI.

## Setup

1. **Clone the repository**:
   ```bash
   git clone <repo_url>
   cd Heady
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure Environment**:
   Ensure `projects.json` exists (see `projects.json.example`).
   Set environment variables as needed (e.g., `HEADY_VERSION`).

## Usage

### Admin UI
Start the backend server:
```bash
uvicorn src.heady_project.api:app --reload
```
Access the UI at `http://localhost:8000`. The UI includes AI features for log summarization and code assistance powered by Hugging Face models (T5, DistilGPT2).

### CLI Tools
Build Manifest:
```bash
python -m src.heady_project.execute_build --repo-url "http://example.com" --version "v1.0"
```

Admin Console:
```bash
python -m src.heady_project.admin_console --action full_audit
```

## Testing
Run tests using pytest:
```bash
pytest
```

## GitHub Copilot Customisation

This project is optimized for GitHub Copilot.
- **Instructions**: See `.github/copilot-instructions.md` for project context and guidelines.
- **Workflow**: A setup workflow (`.github/workflows/copilot-setup-steps.yml`) prepares the environment for Copilot.
- **MCP**: Model Context Protocol servers are defined in `mcp_config.json` and `.github/copilot-mcp-config.json`.
