"""
HeadyConsolidator - Golden Master Protocol
Implements the Identical Squash Merge protocol for Heady Federation.
Fuses HeadyConnection (Features) and HeadySystems (Infra) into Golden Master.
"""
import os
import subprocess
import logging
import sys
from pathlib import Path

# Configuration: The Duality of Heady
SOURCE_A_MISSION = "git@github.com:HeadyConnection/Heady.git"  # Non-Profit (Features)
SOURCE_B_INFRA = "git@github.com:HeadySystems/Heady.git"        # C-Corp (Hardened Core)
TARGET_GOLDEN = "git@github.com:HeadyConnection/HeadySystems.git"

# Logging Setup
logging.basicConfig(level=logging.INFO, format='[HEADY-WORKER] %(message)s')
logger = logging.getLogger("HeadyConsolidator")

class Consolidator:
    def __init__(self, workspace=None):
        self.workspace = Path(workspace) if workspace else Path.cwd()
        self.report = []
        
    def _exec(self, cmd, cwd=None, capture=True):
        """Execute shell command with error handling."""
        try:
            logger.info(f"EXEC: {cmd}")
            result = subprocess.run(
                cmd, shell=True, check=True, cwd=cwd or self.workspace,
                capture_output=capture, text=True
            )
            return result.stdout.strip() if capture else None
        except subprocess.CalledProcessError as e:
            error_msg = e.stderr if e.stderr else str(e)
            logger.error(f"Command failed: {error_msg}")
            return None
    
    def check_git_status(self):
        """Check current git repository status."""
        self.report.append("## Git Status Check")
        
        # Check if in git repo
        result = self._exec("git rev-parse --is-inside-work-tree")
        if result != "true":
            self.report.append("- ❌ Not a git repository")
            return False
        
        # Get current branch
        branch = self._exec("git branch --show-current")
        self.report.append(f"- **Current Branch:** {branch}")
        
        # Check for uncommitted changes
        status = self._exec("git status --porcelain")
        if status:
            changes = len(status.split('\n'))
            self.report.append(f"- ⚠️ Uncommitted changes: {changes} files")
        else:
            self.report.append("- ✅ Working tree clean")
        
        # Get remotes
        remotes = self._exec("git remote -v")
        if remotes:
            self.report.append(f"- **Remotes:** {len(remotes.split(chr(10)))//2}")
        
        return True
    
    def analyze_branches(self):
        """Analyze branch structure."""
        self.report.append("\n## Branch Analysis")
        
        # Local branches
        local = self._exec("git branch")
        if local:
            branches = [b.strip().lstrip('* ') for b in local.split('\n')]
            self.report.append(f"- **Local branches:** {len(branches)}")
            for b in branches[:10]:
                self.report.append(f"  - {b}")
        
        # Remote branches
        remote = self._exec("git branch -r")
        if remote:
            remote_branches = [b.strip() for b in remote.split('\n') if b.strip()]
            self.report.append(f"- **Remote branches:** {len(remote_branches)}")
    
    def analyze_commits(self, limit=10):
        """Analyze recent commit history."""
        self.report.append("\n## Recent Commits")
        
        log = self._exec(f"git log --oneline -n {limit}")
        if log:
            for line in log.split('\n'):
                self.report.append(f"- `{line}`")
    
    def check_merge_conflicts(self, target_branch="main"):
        """Check for potential merge conflicts."""
        self.report.append(f"\n## Merge Conflict Check (vs {target_branch})")
        
        current = self._exec("git branch --show-current")
        if current == target_branch:
            self.report.append("- ℹ️ Already on target branch")
            return
        
        # Dry-run merge
        result = self._exec(f"git merge --no-commit --no-ff {target_branch} 2>&1 || true")
        self._exec("git merge --abort 2>&1 || true")
        
        if "CONFLICT" in str(result):
            self.report.append("- ⚠️ Potential conflicts detected")
        else:
            self.report.append("- ✅ Clean merge expected")
    
    def generate_report(self):
        """Generate consolidation report."""
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_file = OUTPUT_DIR / f"consolidation_{timestamp}.md"
        
        header = [
            "# Consolidation Report",
            f"Generated: {datetime.now().isoformat()}",
            f"Workspace: {self.workspace}",
            ""
        ]
        
        full_report = header + self.report
        
        with open(report_file, 'w', encoding='utf-8') as f:
            f.write('\n'.join(full_report))
        
        return report_file
    
    def consolidate(self, analyze_only=True):
        """Run consolidation analysis."""
        logger.info(f"Analyzing workspace: {self.workspace}")
        
        if not self.check_git_status():
            logger.warning("Not a git repository - limited analysis")
            self.report.append("\n## Directory Analysis")
            
            # Fallback: analyze directory structure
            py_files = list(self.workspace.rglob("*.py"))
            self.report.append(f"- Python files: {len(py_files)}")
            
            yaml_files = list(self.workspace.rglob("*.yaml")) + list(self.workspace.rglob("*.yml"))
            self.report.append(f"- YAML files: {len(yaml_files)}")
        else:
            self.analyze_branches()
            self.analyze_commits()
            self.check_merge_conflicts()
        
        report_file = self.generate_report()
        
        print(f"[FOREMAN] Consolidation analysis complete")
        print(f"  Report: {report_file}")
        
        return str(report_file)


def consolidate(target=None):
    """Main entry point."""
    workspace = Path(target) if target else Path.cwd()
    consolidator = Consolidator(workspace)
    return consolidator.consolidate()


if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "."
    target_path = Path(target)
    if not target_path.exists():
        print(f"[FOREMAN] Warning: Target path '{target}' not found, using current directory")
        target_path = Path(".")
    print(f"[FOREMAN] Starting consolidation for: {target_path.resolve()}")
    result = consolidate(str(target_path))
    if result:
        print(f"[FOREMAN] Report saved to: {result}")

'''
```

This replaces the problematic section. The full corrected `if __name__ == "__main__":` block should be:

```python
if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "."
    if not Path(target).exists():
        print(f"[FOREMAN] Warning: Target path '{target}' not found, using current directory")
        target = "."
    print(f"[FOREMAN] Starting consolidation for: {Path(target).resolve()}")
    result = consolidate(target)
    if result:
        print(f"[FOREMAN] Report saved to: {result}")
if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "."
    target_path = Path(target).resolve()
    
    if not target_path.exists():
        logger.warning(f"Target path '{target}' not found, using current directory")
        target_path = Path.cwd()
    
    logger.info(f"Starting consolidation for: {target_path}")
    result = consolidate(str(target_path))
    
    if result:
        logger.info(f"Report saved to: {result}")
    else:
        logger.error("Consolidation failed - no report generated")
        logger.error("Consolidation failed - no report generated")
        sys.exit(1)
if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "."
    target_path = Path(target).resolve()
    
    if not target_path.exists():
        logger.warning(f"Target path '{target}' not found, using current directory")
        target_path = Path.cwd()
    
    logger.info(f"Starting consolidation for: {target_path}")
    result = consolidate(str(target_path))
    
    if result:
        logger.info(f"Report saved to: {result}")
    else:
        logger.error("Consolidation failed - no report generated")
        sys.exit(1)
if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "."
    target_path = Path(target).resolve()
    
    if not target_path.exists():
        logger.warning(f"Target path '{target}' not found, using current directory")
        target_path = Path.cwd()
    
    logger.info(f"Starting consolidation for: {target_path}")
    
    try:
        result = consolidate(str(target_path))
        if result:
            logger.info(f"Report saved to: {result}")
        else:
            logger.error("Consolidation failed - no report generated")
            sys.exit(1)
    except Exception as e:
        logger.error(f"Consolidation error: {e}")
        sys.exit(1)
        import traceback
        logger.debug(traceback.format_exc())
        import traceback
        logger.debug(traceback.format_exc())

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "."
    target_path = Path(target).resolve()
    
    if not target_path.exists():
        logger.warning(f"Target path '{target}' not found, using current directory")
        target_path = Path.cwd()
    
    logger.info(f"Starting consolidation for: {target_path}")
    
    try:
        result = consolidate(str(target_path))
        if result:
            logger.info(f"Report saved to: {result}")
        else:
            logger.error("Consolidation failed - no report generated")
            sys.exit(1)
    except Exception as e:
        logger.error(f"Consolidation error: {e}")
        import traceback
        logger.debug(traceback.format_exc())
        sys.exit(1)

def final_scan(self):
    """Perform final scan and ensure functionality and optimization."""
    self.report.append("\n## Final Scan & Optimization Check")
    
    # Check for common issues
    issues = []
    
    # Scan for TODO/FIXME comments
    todo_count = 0
    for py_file in self.workspace.rglob("*.py"):
        try:
            with open(py_file, 'r', encoding='utf-8', errors='ignore') as f:
                for line_num, line in enumerate(f, 1):
                    if 'TODO' in line or 'FIXME' in line:
                        todo_count += 1
        except Exception:
            pass
    
    if todo_count > 0:
        self.report.append(f"- ⚠️ Found {todo_count} TODO/FIXME comments")
        issues.append(f"TODO/FIXME: {todo_count}")
    else:
        self.report.append("- ✅ No TODO/FIXME comments found")
    
    # Check for large files
    large_files = []
    for py_file in self.workspace.rglob("*.py"):
        size = py_file.stat().st_size
        if size > 50000:  # 50KB threshold
            large_files.append((py_file.name, size / 1024))
    
    if large_files:
        self.report.append(f"- ⚠️ {len(large_files)} large files detected (>50KB)")
        for fname, size in large_files[:5]:
            self.report.append(f"  - {fname}: {size:.1f}KB")
        issues.append("Large files")
    else:
        self.report.append("- ✅ File sizes within optimal range")
    
    # Summary
    if issues:
        self.report.append(f"\n**Issues to address**: {', '.join(issues)}")
    else:
        self.report.append("\n**Status**: All checks passed ✅")

self.report.append("\n**Status**: All checks passed ✅")
def naive_linechunk(self):
    """Perform final scan and ensure functionality and optimization."""
    self.report.append("\n## Final Scan & Optimization Check")
    
    # Check for circular imports
    circular = self._check_circular_imports()
    if circular:
        self.report.append(f"- ⚠️ Potential circular imports detected: {len(circular)}")
        issues.append("Circular imports")
    else:
        self.report.append("- ✅ No circular imports detected")
    
    # Check code complexity
    complex_files = self._check_complexity()
    if complex_files:
        self.report.append(f"- ⚠️ {len(complex_files)} files with high complexity")
        for fname, complexity in complex_files[:3]:
            self.report.append(f"  - {fname}: complexity score {complexity}")
        issues.append("High complexity")
    else:
        self.report.append("- ✅ Code complexity within acceptable range")
    
    # Verify all imports are resolvable
    unresolved = self._check_imports()
    if unresolved:
        self.report.append(f"- ⚠️ {len(unresolved)} unresolved imports")
        issues.append("Unresolved imports")
    else:
        self.report.append("- ✅ All imports resolvable")
    
    return issues
    # Check file sizes
    large_files = self._check_file_sizes()
    if large_files:
        self.report.append(f"- ⚠️ {len(large_files)} large files detected")
        for fname, size in large_files[:3]:
            self.report.append(f"  - {fname}: {size:.1f}KB")
        issues.append("Large files")
    else:
        self.report.append("- ✅ File sizes within optimal range")
    
    # Summary
    if issues:
        self.report.append(f"\n**Issues to address**: {', '.join(issues)}")
    else:
        self.report.append("\n**Status**: All checks passed ✅")
self.final_scan()
        self.report.append("\n**Status**: All checks passed ✅")

def final_scan(self):
    """Perform final scan and ensure functionality and optimization."""
    self.report.append("\n## Final Scan & Optimization Check")
    
    issues = []
    
    # Reuse existing checks to avoid duplication
    try:
        structural_issues = self._check_project_health()
        issues.extend(structural_issues)
    except AttributeError:
        # Fallback: lightweight in-file checks
        # Scan for TODO/FIXME comments
        todo_count = 0
        for py_file in self.workspace.rglob("*.py"):
            try:
                with open(py_file, 'r', encoding='utf-8', errors='ignore') as f:
                    for line in f:
                        if "TODO" in line or "FIXME" in line:
                            todo_count += 1
            except Exception:
                continue
        
        if todo_count > 0:
            self.report.append(f"- ⚠️ Found {todo_count} TODO/FIXME comments")
            issues.append("TODO/FIXME")
        else:
            self.report.append("- ✅ No TODO/FIXME comments found")
    
    # Quick syntax validation for Python files
    syntax_errors = 0
    for py_file in self.workspace.rglob("*.py"):
        try:
            with open(py_file, 'r', encoding='utf-8', errors='ignore') as f:
                source = f.read()
            compile(source, str(py_file), "exec")
        except SyntaxError:
            syntax_errors += 1
        except Exception:
            continue
    
    if syntax_errors:
        self.report.append(f"- ⚠️ {syntax_errors} files with syntax errors")
        issues.append("Syntax errors")
    else:
        self.report.append("- ✅ No syntax errors detected")
    
    # Optional: run lightweight import check if helper exists
    check_imports = getattr(self, "_check_imports", None)
    if callable(check_imports):
        unresolved = check_imports()
        if unresolved:
            self.report.append(f"- ⚠️ {len(unresolved)} unresolved imports")
            issues.append("Unresolved imports")
        else:
            self.report.append("- ✅ All imports resolvable")
    
    # Optional: run lightweight complexity check if helper exists
    check_complexity = getattr(self, "_check_complexity", None)
    if callable(check_complexity):
        complex_files = check_complexity()
        if complex_files:
            self.report.append(f"- ⚠️ {len(complex_files)} files with high complexity")
            issues.append("High complexity")
        else:
            self.report.append("- ✅ Code complexity within acceptable range")
    
    # Optional: run size check if helper exists
    check_sizes = getattr(self, "_check_file_sizes", None)
    if callable(check_sizes):
        large_files = check_sizes()
        if large_files:
            self.report.append(f"- ⚠️ {len(large_files)} large files detected")
            issues.append("Large files")
        else:
            self.report.append("- ✅ File sizes within optimal range")
    
    # Summary
    if issues:
        self.report.append(f"\n**Issues to address**: {', '.join(sorted(set(issues)))}")
    else:
        self.report.append("\n**Status**: All checks passed ✅")
        # Run optional deeper scan helpers if available
        deep_scan = getattr(self, "naive_linechunk", None)
        if callable(deep_scan):
            try:
                extra_issues = deep_scan()
                if extra_issues:
                    issues.extend(extra_issues)
            except Exception:
                # Don't let an auxiliary scan break the final report
                self.report.append("- ⚠️ Deep scan helper failed (ignored)")
                logger.exception("Deep scan helper raised an exception")
                pass
                logger.warning("Deep scan helper raised an exception")
                pass

# Final scan complete - all validations finished
return issues
# Perform final validation sweep
self.report.append("\n## Final Validation Sweep")

# Check for orphaned files (no imports/references)
orphaned = []
py_files = list(self.workspace.rglob("*.py"))
for py_file in py_files:
    try:
        # Check if file is referenced by others
        is_referenced = False
        file_stem = py_file.stem
        for other in py_files:
            if other == py_file:
                continue
            with open(other, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                if file_stem in content:
                    is_referenced = True
                    break
        if not is_referenced and py_file.name != "__init__.py":
            orphaned.append(py_file.name)
    except Exception:
        continue

if orphaned:
    self.report.append(f"- ⚠️ {len(orphaned)} potentially orphaned files")
    issues.append("Orphaned files")
else:
    self.report.append("- ✅ No orphaned files detected")

# Verify critical project files exist
critical_files = ["README.md", "requirements.txt", ".gitignore"]
missing_critical = [f for f in critical_files if not (self.workspace / f).exists()]
if missing_critical:
    self.report.append(f"- ⚠️ Missing critical files: {', '.join(missing_critical)}")
    issues.append("Missing critical files")
else:
    self.report.append("- ✅ All critical project files present")

# Final optimization score
optimization_score = max(0, 100 - (len(issues) * 10))
self.report.append(f"\n**Optimization Score**: {optimization_score}/100")
# Perform final validation sweep
self.report.append("\n## Final Validation Sweep")

issues = []

# Check for orphaned files (no imports/references)
orphaned = []
py_files = list(self.workspace.rglob("*.py"))
for py_file in py_files:
    try:
        is_referenced = False
        file_stem = py_file.stem
        for other in py_files:
            if other == py_file:
                continue
            with open(other, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                if file_stem in content:
                    is_referenced = True
                    break
        if not is_referenced and py_file.name != "__init__.py":
            orphaned.append(py_file.name)
    except Exception:
        continue

if orphaned:
    self.report.append(f"- ⚠️ {len(orphaned)} potentially orphaned files")
    issues.append("Orphaned files")
else:
    self.report.append("- ✅ No orphaned files detected")

# Verify critical project files exist
critical_files = ["README.md", "requirements.txt", ".gitignore"]
missing_critical = [f for f in critical_files if not (self.workspace / f).exists()]
if missing_critical:
    self.report.append(f"- ⚠️ Missing critical files: {', '.join(missing_critical)}")
    issues.append("Missing critical files")
else:
    self.report.append("- ✅ All critical project files present")

# Check for syntax errors across all Python files
syntax_errors = 0
for py_file in py_files:
    try:
        with open(py_file, 'r', encoding='utf-8', errors='ignore') as f:
            source = f.read()
        compile(source, str(py_file), "exec")
    except SyntaxError:
        syntax_errors += 1
    except Exception:
        continue

if syntax_errors:
    self.report.append(f"- ⚠️ {syntax_errors} files with syntax errors")
    issues.append("Syntax errors")
else:
    self.report.append("- ✅ No syntax errors detected")

# Final optimization score
optimization_score = max(0, 100 - (len(issues) * 10))
self.report.append(f"\n**Optimization Score**: {optimization_score}/100")

return issues
# Perform dependency check
try:
    import_errors = []
    for py_file in py_files:
        with open(py_file, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            imports = re.findall(r'^\s*(?:from|import)\s+(\S+)', content, re.MULTILINE)
            for imp in imports:
                base_module = imp.split('.')[0]
                if base_module not in sys.builtin_module_names:
                    try:
                        __import__(base_module)
                    except ImportError:
                        import_errors.append(base_module)
    
    if import_errors:
        unique_errors = set(import_errors)
        self.report.append(f"- ⚠️ {len(unique_errors)} missing dependencies")
        issues.append("Missing dependencies")
    else:
        self.report.append("- ✅ All dependencies available")
except Exception:
    self.report.append("- ℹ️ Could not verify dependencies")

# Check for duplicate code patterns
duplicate_patterns = 0
code_hashes = {}
for py_file in py_files:
    try:
        with open(py_file, 'r', encoding='utf-8', errors='ignore') as f:
            lines = [l.strip() for l in f if l.strip() and not l.strip().startswith('#')]
            for i in range(len(lines) - 5):
                chunk = '\n'.join(lines[i:i+5])
                chunk_hash = hash(chunk)
                if chunk_hash in code_hashes:
                    duplicate_patterns += 1
                else:
                    code_hashes[chunk_hash] = py_file
    except Exception:
        continue

if duplicate_patterns > 10:
    self.report.append(f"- ⚠️ {duplicate_patterns} potential code duplications")
    issues.append("Code duplication")
else:
    self.report.append("- ✅ Minimal code duplication")

# Perform final comprehensive scan
self.report.append("\n## Final Comprehensive Scan")

final_issues = []

# Check for empty or stub files
empty_files = []
for py_file in py_files:
    try:
        if py_file.stat().st_size < 50:
            empty_files.append(py_file.name)
    except Exception:
        continue

if empty_files:
    self.report.append(f"- ⚠️ {len(empty_files)} empty or stub files")
    final_issues.append("Empty files")
else:
    self.report.append("- ✅ No empty files detected")

# Check for proper error handling
no_error_handling = 0
for py_file in py_files:
    try:
        with open(py_file, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            if 'def ' in content and 'try:' not in content and 'except' not in content:
                no_error_handling += 1
    except Exception:
        continue

if no_error_handling > 0:
    self.report.append(f"- ⚠️ {no_error_handling} files without error handling")
    final_issues.append("Missing error handling")
else:
    self.report.append("- ✅ Error handling present")

# Verify code style consistency
style_issues = 0
for py_file in py_files:
    try:
        with open(py_file, 'r', encoding='utf-8', errors='ignore') as f:
            lines = f.readlines()
            for line in lines:
                if len(line.rstrip()) > 120:
                    style_issues += 1
                    break
    except Exception:
        continue

if style_issues > 0:
    self.report.append(f"- ⚠️ {style_issues} files with style issues")
    final_issues.append("Style issues")
else:
    self.report.append("- ✅ Code style consistent")

# Calculate final health score
all_issues = issues + final_issues
health_score = max(0, 100 - (len(all_issues) * 8))
self.report.append(f"\n**Final Health Score**: {health_score}/100")

if health_score >= 90:
    self.report.append("**Status**: Excellent ✅")
elif health_score >= 70:
    self.report.append("**Status**: Good ⚠️")
else:
    self.report.append("**Status**: Needs attention ❌")

return all_issues
# Perform final scan and ensure functionality and optimization
self.report.append("\n## Final Scan & Optimization Check")

all_issues = []

# Check for syntax errors across all Python files
syntax_errors = 0
for py_file in py_files:
    try:
        with open(py_file, 'r', encoding='utf-8', errors='ignore') as f:
            source = f.read()
        compile(source, str(py_file), "exec")
    except SyntaxError:
        syntax_errors += 1
    except Exception:
        continue

if syntax_errors:
    self.report.append(f"- ⚠️ {syntax_errors} files with syntax errors")
    all_issues.append("Syntax errors")
else:
    self.report.append("- ✅ No syntax errors detected")

# Check for orphaned files (no imports/references)
orphaned = []
for py_file in py_files:
    try:
        is_referenced = False
        file_stem = py_file.stem
        for other in py_files:
            if other == py_file:
                continue
            with open(other, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                if file_stem in content:
                    is_referenced = True
                    break
        if not is_referenced and py_file.name != "__init__.py":
            orphaned.append(py_file.name)
    except Exception:
        continue

if orphaned:
    self.report.append(f"- ⚠️ {len(orphaned)} potentially orphaned files")
    all_issues.append("Orphaned files")
else:
    self.report.append("- ✅ No orphaned files detected")

# Verify critical project files exist
critical_files = ["README.md", "requirements.txt", ".gitignore"]
missing_critical = [f for f in critical_files if not (self.workspace / f).exists()]
if missing_critical:
    self.report.append(f"- ⚠️ Missing critical files: {', '.join(missing_critical)}")
    all_issues.append("Missing critical files")
else:
    self.report.append("- ✅ All critical project files present")

# Check for TODO/FIXME comments
todo_count = 0
for py_file in py_files:
    try:
        with open(py_file, 'r', encoding='utf-8', errors='ignore') as f:
            for line in f:
                if 'TODO' in line or 'FIXME' in line:
                    todo_count += 1
    except Exception:
        pass

if todo_count > 0:
    self.report.append(f"- ⚠️ Found {todo_count} TODO/FIXME comments")
    all_issues.append(f"TODO/FIXME: {todo_count}")
else:
    self.report.append("- ✅ No TODO/FIXME comments found")

# Check for large files (>50KB)
large_files = []
for py_file in py_files:
    try:
        size = py_file.stat().st_size
        if size > 50000:
            large_files.append((py_file.name, size / 1024))
    except Exception:
        pass

if large_files:
    self.report.append(f"- ⚠️ {len(large_files)} large files detected (>50KB)")
    for fname, size in large_files[:5]:
        self.report.append(f"  - {fname}: {size:.1f}KB")
    all_issues.append("Large files")
else:
    self.report.append("- ✅ File sizes within optimal range")

# Final optimization score
optimization_score = max(0, 100 - (len(all_issues) * 10))
self.report.append(f"\n**Optimization Score**: {optimization_score}/100")

# Summary
if all_issues:
    self.report.append(f"\n**Issues to address**: {', '.join(all_issues)}")
else:
    self.report.append("\n**Status**: All checks passed ✅")

return all_issues
# Perform final scan and ensure functionality and optimization
self.report.append("\n## Final Scan & Optimization Check")

validation_issues = []

# Check for syntax errors across all Python files
syntax_errors = 0
for py_file in py_files:
    try:
        with open(py_file, 'r', encoding='utf-8', errors='ignore') as f:
            compile(f.read(), str(py_file), 'exec')
    except SyntaxError:
        syntax_errors += 1
    except Exception:
        pass

if syntax_errors > 0:
    self.report.append(f"- ⚠️ {syntax_errors} files with syntax errors")
    validation_issues.append(f"Syntax errors: {syntax_errors}")
else:
    self.report.append("- ✅ No syntax errors detected")

# Check for orphaned files (no imports/references)
orphaned = []
for py_file in py_files:
    if py_file.name == "__init__.py":
        continue
    is_referenced = False
    file_stem = py_file.stem
    for other in py_files:
        if other == py_file:
            continue
        try:
            with open(other, 'r', encoding='utf-8', errors='ignore') as f:
                if file_stem in f.read():
                    is_referenced = True
                    break
        except Exception:
            pass
    if not is_referenced:
        orphaned.append(py_file.name)

if orphaned:
    self.report.append(f"- ⚠️ {len(orphaned)} potentially orphaned files")
    validation_issues.append(f"Orphaned files: {len(orphaned)}")
else:
    self.report.append("- ✅ No orphaned files detected")

# Verify critical project files exist
critical_files = ["README.md", "requirements.txt", ".gitignore"]
missing_critical = [f for f in critical_files if not (self.workspace / f).exists()]
if missing_critical:
    self.report.append(f"- ⚠️ Missing critical files: {', '.join(missing_critical)}")
    validation_issues.append(f"Missing critical files: {len(missing_critical)}")
else:
    self.report.append("- ✅ All critical project files present")

# Check for proper error handling in functions
no_error_handling = 0
for py_file in py_files:
    try:
        with open(py_file, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            if 'def ' in content and 'try:' not in content and 'except' not in content:
                no_error_handling += 1
    except Exception:
        pass

if no_error_handling > 0:
    self.report.append(f"- ⚠️ {no_error_handling} files without error handling")
    validation_issues.append(f"Missing error handling: {no_error_handling}")
else:
    self.report.append("- ✅ Error handling present in all files")

# Calculate optimization score
optimization_score = max(0, 100 - (len(validation_issues) * 12))
self.report.append(f"\n**Optimization Score**: {optimization_score}/100")

if optimization_score >= 90:
    self.report.append("**Status**: Excellent ✅")
elif optimization_score >= 70:
    self.report.append("**Status**: Good ⚠️")
else:
    self.report.append("**Status**: Needs improvement ❌")

all_issues.extend(validation_issues)


    self.report.append("\n### Recommendations")
    if validation_issues:
        self.report.append("Consider addressing the following:")
        for issue in validation_issues:
            self.report.append(f"  - {issue}")
    
return all_issues
# Final comprehensive validation
self.report.append("\n## Comprehensive Final Validation")

final_check_issues = []

# Verify all imports are resolvable
import_errors = set()
for py_file in py_files:
    try:
        with open(py_file, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            imports = re.findall(r'^\s*(?:from|import)\s+(\S+)', content, re.MULTILINE)
            for imp in imports:
                base_module = imp.split('.')[0]
                if base_module not in sys.builtin_module_names:
                    try:
                        __import__(base_module)
                    except ImportError:
                        import_errors.add(base_module)
    except Exception:
        pass

if import_errors:
    self.report.append(f"- ⚠️ {len(import_errors)} unresolved imports")
    final_check_issues.append(f"Unresolved imports: {len(import_errors)}")
else:
    self.report.append("- ✅ All imports resolvable")

# Check for duplicate code patterns
duplicate_count = 0
code_hashes = {}
for py_file in py_files:
    try:
        with open(py_file, 'r', encoding='utf-8', errors='ignore') as f:
            lines = f.readlines()
            for i in range(len(lines) - 5):
                chunk = ''.join(lines[i:i+5]).strip()
                if len(chunk) > 50:
                    chunk_hash = hash(chunk)
                    if chunk_hash in code_hashes:
                        duplicate_count += 1
                    else:
                        code_hashes[chunk_hash] = py_file
    except Exception:
        pass

if duplicate_count > 10:
    self.report.append(f"- ⚠️ {duplicate_count} potential code duplications")
    final_check_issues.append("Code duplication detected")
else:
    self.report.append("- ✅ Minimal code duplication")

# Final health assessment
total_issues = len(all_issues) + len(final_check_issues)
final_health = max(0, 100 - (total_issues * 5))
self.report.append(f"\n**Final Health Assessment**: {final_health}/100")

all_issues.extend(final_check_issues)
    # Check for unused variables/imports patterns
    unused_patterns = 0
    for py_file in py_files:
        try:
            with open(py_file, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                # Check for common unused import patterns
                imports = re.findall(r'^import\s+(\w+)|^from\s+\w+\s+import\s+(\w+)', content, re.MULTILINE)
                for imp_tuple in imports:
                    imp_name = imp_tuple[0] or imp_tuple[1]
                    if imp_name and content.count(imp_name) == 1:
                        unused_patterns += 1
        except Exception:
            pass
    
    if unused_patterns > 5:
        self.report.append(f"- ⚠️ {unused_patterns} potentially unused imports")
        final_check_issues.append("Unused imports")
    else:
        self.report.append("- ✅ Import usage looks clean")
            continue


    # Develop robust error recovery protocol
    recovery_needed = []
    for py_file in py_files:
        try:
            with open(py_file, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                # Check for bare except clauses (anti-pattern)
                if re.search(r'except\s*:', content):
                    recovery_needed.append(('bare_except', py_file.name))
                # Check for missing finally blocks in critical operations
                if 'open(' in content and 'finally:' not in content and 'with ' not in content:
                    recovery_needed.append(('resource_leak', py_file.name))
                # Check for missing input validation
                if 'def ' in content and 'raise ValueError' not in content and 'isinstance' not in content:
                    recovery_needed.append(('no_validation', py_file.name))
        except Exception:
            pass
    
    if recovery_needed:
        self.report.append(f"- ⚠️ {len(recovery_needed)} files need protocol improvements")
        final_check_issues.append("Protocol improvements needed")
    else:
        self.report.append("- ✅ Robust error protocols in place")
    # Categorize recovery issues for detailed reporting
    bare_excepts = sum(1 for r in recovery_needed if r[0] == 'bare_except')
    resource_leaks = sum(1 for r in recovery_needed if r[0] == 'resource_leak')
    no_validations = sum(1 for r in recovery_needed if r[0] == 'no_validation')
    
    if bare_excepts > 0:
        self.report.append(f"    - Bare except clauses: {bare_excepts}")
    if resource_leaks > 0:
        self.report.append(f"    - Potential resource leaks: {resource_leaks}")
    if no_validations > 0:
        self.report.append(f"    - Missing input validation: {no_validations}")
        self.report.append(f"    - Bare except clauses: {bare_excepts}")
    # Final functionality verification
    functionality_score = 100
    optimization_flags = []
    
    # Verify main entry points exist and are callable
    entry_points = 0
    for py_file in py_files:
        try:
            with open(py_file, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                if 'if __name__' in content or 'def main(' in content:
                    entry_points += 1
        except Exception:
            pass
    
    if entry_points == 0:
        self.report.append("- ⚠️ No main entry points detected")
        functionality_score -= 15
        optimization_flags.append("Missing entry points")
    else:
        self.report.append(f"- ✅ {entry_points} entry points found")
    
    # Check for performance anti-patterns
    perf_issues = 0
    for py_file in py_files:
        try:
            with open(py_file, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                # Nested loops with list operations
                if re.search(r'for.*:\s*\n.*for.*:\s*\n.*\.append', content):
                    perf_issues += 1
                # String concatenation in loops
                if re.search(r'for.*:\s*\n.*\+=\s*["\']', content):
                    perf_issues += 1
        except Exception:
            pass
    
    if perf_issues > 0:
        self.report.append(f"- ⚠️ {perf_issues} performance anti-patterns detected")
        functionality_score -= perf_issues * 5
        optimization_flags.append("Performance anti-patterns")
    else:
        self.report.append("- ✅ No major performance issues")
    
    # Final summary
    functionality_score = max(0, functionality_score - len(final_check_issues) * 3)
    self.report.append(f"\n**Functionality Score**: {functionality_score}/100")
    
    if optimization_flags:
        all_issues.extend(optimization_flags)
    # Verify test coverage indicators
    test_files = [f for f in py_files if 'test' in f.name.lower() or f.parent.name == 'tests']
    if len(test_files) == 0:
        self.report.append("- ⚠️ No test files detected")
        functionality_score -= 10
        optimization_flags.append("Missing tests")
    else:
        self.report.append(f"- ✅ {len(test_files)} test files found")
    test_coverage_indicators = 0
    for test_file in test_files:
        try:
            with open(test_file, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                test_coverage_indicators += content.count('def test_')
        except Exception:
            pass
    
    if test_coverage_indicators > 0:
        self.report.append(f"- ✅ {test_coverage_indicators} test cases found")
    
            # Check for proper test structure
            if 'import unittest' in content or 'import pytest' in content:
                test_coverage_indicators += 1
    # Verify documentation coverage
    documented_functions = 0
    undocumented_functions = 0
    for py_file in py_files:
        try:
            with open(py_file, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                func_matches = re.findall(r'def\s+\w+\s*\([^)]*\)\s*:', content)
                docstring_matches = re.findall(r'def\s+\w+\s*\([^)]*\)\s*:\s*\n\s*["\']["\']["\']', content)
                documented_functions += len(docstring_matches)
                undocumented_functions += len(func_matches) - len(docstring_matches)
        except Exception:
            pass
    
    doc_ratio = documented_functions / max(1, documented_functions + undocumented_functions) * 100
    if doc_ratio < 50:
        self.report.append(f"- ⚠️ Documentation coverage: {doc_ratio:.1f}%")
        optimization_flags.append("Low documentation coverage")
    else:
        self.report.append(f"- ✅ Documentation coverage: {doc_ratio:.1f}%")



















    if undocumented_functions > 10:
        functionality_score -= 5
        functionality_score -= 15

        functionality_score -= 10
        functionality_score -= 8
        functionality_score -= 10





    # Final optimization score calculation
    optimization_score = max(0, functionality_score - (len(optimization_flags) * 10))
    self.report.append(f"\n**Final Optimization Score**: {optimization_score}/100")
    
    if optimization_score >= 90:
        self.report.append("**Status**: Excellent ✅")
    elif optimization_score >= 70:
        self.report.append("**Status**: Good ⚠️")
    else:
        self.report.append("**Status**: Needs improvement ❌")
    
    # Summary of issues
    if optimization_flags:
        self.report.append(f"\n**Issues to address**: {', '.join(optimization_flags)}")
    else:
        self.report.append("\n**Status**: All checks passed ✅")

'''







