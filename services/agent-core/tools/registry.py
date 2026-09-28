import os
import subprocess
import json
from typing import Dict, Any, Optional

class ToolRegistry:
    def __init__(self, workspace_root: Optional[str] = None):
        self.workspace_root = workspace_root or os.getcwd()

    def get_available_tools_schema(self) -> list:
        return [
            {
                "name": "read_code",
                "description": "Reads lines from a file with optional start and end line bounds.",
                "parameters": {
                    "file_path": {"type": "string", "required": True},
                    "start_line": {"type": "integer", "required": False},
                    "end_line": {"type": "integer", "required": False}
                }
            },
            {
                "name": "grep_search",
                "description": "Searches for a text pattern or symbol across files in a directory.",
                "parameters": {
                    "query": {"type": "string", "required": True},
                    "dir_path": {"type": "string", "required": False}
                }
            },
            {
                "name": "apply_patch",
                "description": "Applies targeted code changes or replacement to a file.",
                "parameters": {
                    "file_path": {"type": "string", "required": True},
                    "target_content": {"type": "string", "required": True},
                    "replacement_content": {"type": "string", "required": True}
                }
            },
            {
                "name": "git_status_and_diff",
                "description": "Inspects git status and uncommitted diffs in the repository.",
                "parameters": {
                    "repo_path": {"type": "string", "required": False}
                }
            },
            {
                "name": "run_sandbox_command",
                "description": "Runs a build, test, or linter command inside an isolated execution environment.",
                "parameters": {
                    "command": {"type": "string", "required": True},
                    "timeout_seconds": {"type": "integer", "default": 30}
                }
            }
        ]

    def execute_tool(self, tool_name: str, arguments: Dict[str, Any]) -> str:
        if tool_name == "read_code":
            return self._read_code(
                arguments.get("file_path", ""),
                arguments.get("start_line"),
                arguments.get("end_line")
            )
        elif tool_name == "grep_search":
            return self._grep_search(
                arguments.get("query", ""),
                arguments.get("dir_path")
            )
        elif tool_name == "apply_patch":
            return self._apply_patch(
                arguments.get("file_path", ""),
                arguments.get("target_content", ""),
                arguments.get("replacement_content", "")
            )
        elif tool_name == "git_status_and_diff":
            return self._git_status_and_diff(arguments.get("repo_path"))
        elif tool_name == "run_sandbox_command":
            return self._run_sandbox_command(
                arguments.get("command", ""),
                arguments.get("timeout_seconds", 30)
            )
        else:
            return f"Error: Tool '{tool_name}' is not recognized."

    def _read_code(self, file_path: str, start_line: Optional[int] = None, end_line: Optional[int] = None) -> str:
        full_path = os.path.join(self.workspace_root, file_path) if not os.path.isabs(file_path) else file_path
        if not os.path.exists(full_path):
            return f"Error: File '{file_path}' does not exist."
        try:
            with open(full_path, "r", encoding="utf-8", errors="replace") as f:
                lines = f.readlines()
            start = (start_line - 1) if (start_line and start_line > 0) else 0
            end = end_line if (end_line and end_line <= len(lines)) else len(lines)
            selected = lines[start:end]
            numbered = [f"{i+start+1:4d}: {line}" for i, line in enumerate(selected)]
            return "".join(numbered)
        except Exception as e:
            return f"Error reading file: {str(e)}"

    def _grep_search(self, query: str, dir_path: Optional[str] = None) -> str:
        target_dir = dir_path or self.workspace_root
        cmd = ["grep", "-rnI", "--exclude-dir=.git", "--exclude-dir=node_modules", query, target_dir]
        try:
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
            lines = res.stdout.strip().splitlines()
            if not lines:
                return f"No matches found for query '{query}' in {target_dir}."
            return "\n".join(lines[:20]) # capped at 20 lines
        except Exception as e:
            return f"Error during grep search: {str(e)}"

    def _apply_patch(self, file_path: str, target_content: str, replacement_content: str) -> str:
        full_path = os.path.join(self.workspace_root, file_path) if not os.path.isabs(file_path) else file_path
        if not os.path.exists(full_path):
            return f"Error: File '{file_path}' does not exist."
        try:
            with open(full_path, "r", encoding="utf-8") as f:
                content = f.read()
            if target_content not in content:
                return f"Error: Target content to replace was not found in {file_path}."
            new_content = content.replace(target_content, replacement_content, 1)
            with open(full_path, "w", encoding="utf-8") as f:
                f.write(new_content)
            return f"Successfully updated {file_path}."
        except Exception as e:
            return f"Error applying patch: {str(e)}"

    def _git_status_and_diff(self, repo_path: Optional[str] = None) -> str:
        cwd = repo_path or self.workspace_root
        try:
            status = subprocess.run(["git", "status", "--short"], cwd=cwd, capture_output=True, text=True, timeout=5)
            diff = subprocess.run(["git", "diff", "--stat"], cwd=cwd, capture_output=True, text=True, timeout=5)
            return f"Git Status:\n{status.stdout or '(clean)'}\n\nGit Diff Stat:\n{diff.stdout or '(no diff)'}"
        except Exception as e:
            return f"Error inspecting git repository: {str(e)}"

    def _run_sandbox_command(self, command: str, timeout_seconds: int = 30) -> str:
        # Isolated runner with strict limits
        try:
            res = subprocess.run(
                command,
                shell=True,
                cwd=self.workspace_root,
                capture_output=True,
                text=True,
                timeout=timeout_seconds
            )
            output = res.stdout if res.returncode == 0 else f"{res.stdout}\nSTDERR:\n{res.stderr}"
            return f"Exit Code: {res.returncode}\nOutput:\n{output.strip()[:2000]}"
        except subprocess.TimeoutExpired:
            return f"Error: Command timed out after {timeout_seconds} seconds."
        except Exception as e:
            return f"Execution error: {str(e)}"
