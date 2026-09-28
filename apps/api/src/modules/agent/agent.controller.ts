import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { AgentService } from './agent.service';

@Controller('agent')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Post('delegate')
  async delegateTask(@Body() body: { taskId: string }) {
    return this.agentService.delegateTask(body.taskId);
  }

  @Get('execution/:id')
  getExecution(@Param('id') id: string) {
    return this.agentService.getExecution(id);
  }
}
