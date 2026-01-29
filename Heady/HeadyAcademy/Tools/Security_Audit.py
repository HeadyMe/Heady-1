"""
Security_Audit.py - MURPHY Tool
Scans code for security vulnerabilities and bad practices.
"""
import sys
import os
import re
from pathlib import Path
from datetime import datetime

OUTPUT_DIR = Path(__file__).parent.parent / "Logs" / "Security_Reports"

SECURITY_PATTERNS = [
    {
        "name": "Hardcoded Secret",
        "pattern": r"(?i)(password|secret|api_key|apikey|token)\s*=\s*['\"][^'\"]+['\"]",
        "severity": "HIGH",
        "fix": "Use environment variables or secrets manager"
    },
    {
        "name": "SQL Injection Risk",
        "pattern": r"(?i)(execute|query)\s*\([^)]*%s|f['\"].*SELECT.*{",
        "severity": "HIGH",
        "fix": "Use parameterized queries"
    },
    {
        "name": "Eval Usage",
        "pattern": r"\beval\s*\(",
        "severity": "HIGH",
        "fix": "Avoid eval(), use safer alternatives"
    },
    {
        "name": "Shell Injection Risk",
        "pattern": r"(?i)(subprocess|os\.system|os\.popen)\s*\([^)]*\+|shell\s*=\s*True",
        "severity": "MEDIUM",
        "fix": "Sanitize inputs, avoid shell=True"
    },
    {
        "name": "Insecure HTTP",
        "pattern": r"http://(?!localhost|127\.0\.0\.1)",
        "severity": "MEDIUM",
        "fix": "Use HTTPS for external connections"
    },
    {
        "name": "Debug Mode",
        "pattern": r"(?i)debug\s*=\s*True",
        "severity": "LOW",
        "fix": "Disable debug mode in production"
    },
    {
        "name": "Pickle Usage",
        "pattern": r"\bpickle\.(load|loads)\s*\(",
        "severity": "MEDIUM",
        "fix": "Pickle can execute arbitrary code, use JSON if possible"
    }
]

def scan_file(file_path):
    """Scan a file for security issues."""
    findings = []
    
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            lines = f.readlines()
        
        for i, line in enumerate(lines, 1):
            for pattern in SECURITY_PATTERNS:
                if re.search(pattern["pattern"], line):
                    findings.append({
                        "line": i,
                        "name": pattern["name"],
                        "severity": pattern["severity"],
                        "fix": pattern["fix"],
                        "snippet": line.strip()[:80]
                    })
    except Exception as e:
        findings.append({"line": 0, "name": "Scan Error", "severity": "INFO", "fix": str(e), "snippet": ""})
    
    return findings

def audit(target):
    """Run security audit on target."""
    target_path = Path(target)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    all_findings = []
    scanned = 0
    
    extensions = {'.py', '.js', '.ts', '.sh', '.ps1', '.yaml', '.yml', '.json'}
    
    if target_path.is_file():
        if target_path.suffix in extensions:
            all_findings.extend([(target_path, f) for f in scan_file(target_path)])
            scanned = 1
    elif target_path.is_dir():
        for ext in extensions:
            for file_path in target_path.rglob(f"*{ext}"):
                if '.git' not in str(file_path) and 'node_modules' not in str(file_path):
                    findings = scan_file(file_path)
                    all_findings.extend([(file_path, f) for f in findings])
                    scanned += 1
    
    high = sum(1 for _, f in all_findings if f["severity"] == "HIGH")
    medium = sum(1 for _, f in all_findings if f["severity"] == "MEDIUM")
    low = sum(1 for _, f in all_findings if f["severity"] == "LOW")
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    report_file = OUTPUT_DIR / f"security_audit_{timestamp}.md"
    
    report = [
        f"# Security Audit Report",
        f"Target: {target_path}",
        f"Generated: {datetime.now().isoformat()}",
        f"Files Scanned: {scanned}",
        "",
        f"## Summary",
        f"- 🔴 HIGH: {high}",
        f"- 🟡 MEDIUM: {medium}",
        f"- 🟢 LOW: {low}",
        ""
    ]
    
    if all_findings:
        report.append("## Findings")
        for file_path, finding in all_findings:
            severity_icon = {"HIGH": "🔴", "MEDIUM": "🟡", "LOW": "🟢"}.get(finding["severity"], "ℹ️")
            report.append(f"\n### {severity_icon} {finding['name']} ({finding['severity']})")
            report.append(f"- **File**: {file_path.name}:{finding['line']}")
            report.append(f"- **Fix**: {finding['fix']}")
            if finding['snippet']:
                report.append(f"- **Code**: `{finding['snippet']}`")
    else:
        report.append("## ✅ No security issues found!")
    
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write('\n'.join(report))
    
    print(f"[MURPHY] Security audit complete")
    print(f"  Scanned: {scanned} files")
    print(f"  Findings: {len(all_findings)} (HIGH: {high}, MEDIUM: {medium}, LOW: {low})")
    print(f"  Report: {report_file}")
    return str(report_file)

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "."
    audit(target)
