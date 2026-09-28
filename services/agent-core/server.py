import sys
import os
from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel
from typing import Dict, Any, Optional
from tools.registry import ToolRegistry
from agent.loop import AgentReActLoop

app = FastAPI(title="Daily Planner AI Agent Core (Built from Scratch)")
registry = ToolRegistry()

class DelegationRequest(BaseModel):
    taskId: str
    title: str
    description: Optional[str] = ""
    category: Optional[str] = "BUG"
    contextInfo: Optional[Dict[str, Any]] = None

@app.get("/health")
def health():
    return {"status": "healthy", "service": "agent-core", "version": "1.0.0"}

@app.get("/agent/tools")
def get_tools():
    return {"tools": registry.get_available_tools_schema()}

@app.post("/agent/run")
def run_agent_task(req: DelegationRequest):
    loop = AgentReActLoop(task_info=req.dict(), tool_registry=registry)
    result = loop.run()
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8001, reload=True)
