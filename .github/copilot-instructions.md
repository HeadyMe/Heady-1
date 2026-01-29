# Project Summary
The Heady repo is a Python‑based data‑processing framework. It includes a Render blueprint (render.yaml), Model Context Protocol configuration (mcp_config.json), and Python scripts such as execute_build.py, consolidated_builder.py and admin_console.py. The build script processes a projects.json file to produce heady-manifest.json files and the admin console can build, serve an API and perform audits. The repository currently has only a one‑line README and a placeholder agent description file under .github/agents.

# Languages and Tools
The project is primarily written in Python (version 3.8+), with YAML and JSON configuration files. The build process uses standard Python tooling (pip install, python <script>). The Render blueprint calls pip install -r requirements.txt, so note that a requirements.txt file must be maintained.
Git is used for cloning repositories.
Certain environment variables (DATABASE_URL, OTHER_API_KEY) and secrets (CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID) must be provided.

# Build, Test and Run
1. **Set up a virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
3. **Run the build script**:
   ```bash
   python execute_build.py --repo-url <repo_url> --zip-file <zip_file> --build-script <build_script>
   ```
4. **Run the consolidated builder**:
   ```bash
   python HeadySystems/heady_project/src/consolidated_builder.py
   ```
5. **Run the admin console**:
   ```bash
   python HeadySystems/heady_project/src/admin_console.py --action <builder_build|full_audit|serve_api>
   ```
6. **Run tests**:
   Tests should live in a `tests/` folder and can be run with pytest:
   ```bash
   pytest
   ```

# Important Architecture and Config
- Key source files: `HeadySystems/heady_project/src`, `heady_demo_kit/heady_project/src`
- Render blueprint: `render.yaml`
- MCP configuration: `mcp_config.json` (defines server definitions and secrets)
- Copilot Agent Template: `.github/agents/copilot-insturctions.agent.md`
- Workflow file will be added.

# Non-obvious Dependencies
The build script requires the `zipfile` module (part of Python standard library), external `git` and `zip` tools, and a `projects.json` file in the repository root.
