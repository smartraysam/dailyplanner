import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
} from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { Task } from '@planner/shared-types';

@Controller('schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get('overview')
  getOverview() {
    return this.schedulesService.getSchedulesOverview();
  }

  @Get('tasks')
  getTasks(): Task[] {
    return this.schedulesService.getTasks();
  }

  @Post('tasks')
  createTask(@Body() dto: Partial<Task>): Task {
    return this.schedulesService.createTask(dto);
  }

  @Patch('tasks/:id')
  updateTask(@Param('id') id: string, @Body() updates: Partial<Task>): Task {
    return this.schedulesService.updateTask(id, updates);
  }

  @Get('timeblocks')
  getTimeblocks() {
    return this.schedulesService.getTimeblocks();
  }

  @Post('switch')
  switchBlock(
    @Body() body: { nextBlockId: string; contextSnapshot?: string },
  ) {
    return this.schedulesService.switchActiveBlock(body.nextBlockId, body.contextSnapshot);
  }

  @Post('snooze')
  snoozeBlock(@Body() body: { minutes: number }) {
    return this.schedulesService.snoozeCurrentBlock(body.minutes || 5);
  }

  @Post('simulate-alert')
  simulateAlert(@Body() body: { type: 'WARNING' | 'SWITCH_NOW' }) {
    return this.schedulesService.simulateTransitionAlert(body.type || 'SWITCH_NOW');
  }
}
