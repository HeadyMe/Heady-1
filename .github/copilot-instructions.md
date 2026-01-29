# Project Summary
Heady is a Python-based data-processing framework. It consolidates build logic and administrative tools into a single package `src/heady_project`.
Key components:
- `execute_build.py`: Generates `heady-manifest.json` from `projects.json`.
- `admin_console.py`: Manages audits, API serving, and economy simulation.
- `render.yaml`: Configuration for deployment on Render.
- `mcp_config.json`: Configuration for Model Context Protocol servers.

# Languages and Tools
- **Python 3.10+**
- **YAML & JSON** for configuration.
- **Dependencies**: Listed in `requirements.txt` (includes `requests`, `pytest`, `python-dotenv`, `fastapi`, `transformers`, `torch`).

# Build, Test and Run

## Setup
1. `pip install -r requirements.txt`
2. Ensure `projects.json` is present.

## Running Scripts
- Build: `python -m src.heady_project.execute_build --repo-url <url>`
- Admin: `python -m src.heady_project.admin_console --action <action>`

## Testing
- Run `pytest` to execute unit and integration tests in `tests/`.

# Architecture
- Source code is in `src/heady_project/`.
- Utils module handles logging and versioning.
- Shared logic (archive, economy) is modularized.
- **NLP Service**: `src/heady_project/nlp_service.py` provides summarization (T5) and text generation (DistilGPT2) capabilities for the Admin UI.

# Hugging Face Optimization Rules & CLI
(Refer to previous instructions for specific Hugging Face guidelines if applicable, though primarily this is a data processing framework.)
