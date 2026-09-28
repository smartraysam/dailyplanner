import { Injectable, Logger } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway';
import { TimeboxAlertPayload, TimeBlock } from '@planner/shared-types';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly gateway: NotificationsGateway) {}

  sendTick(activeTimeboxId: string, secondsRemaining: number) {
    this.gateway.broadcastTimeboxTick({ activeTimeboxId, secondsRemaining });
  }

  triggerTimeboxWarning(currentBlock: TimeBlock, nextBlock: TimeBlock | undefined, minutesRemaining: number) {
    const payload: TimeboxAlertPayload = {
      currentBlock,
      nextBlock,
      minutesRemaining,
      type: 'WARNING',
      message: `Heads up! Only ${minutesRemaining} minutes remaining on "${currentBlock.title}". Start wrapping up your current context.`,
    };
    this.gateway.broadcastTimeboxAlert(payload);
  }

  triggerTaskSwitchAlert(currentBlock: TimeBlock, nextBlock: TimeBlock | undefined) {
    const nextTitle = nextBlock ? `"${nextBlock.title}"` : 'your next scheduled session';
    const payload: TimeboxAlertPayload = {
      currentBlock,
      nextBlock,
      minutesRemaining: 0,
      type: 'SWITCH_NOW',
      message: `Time to switch! Completed block: "${currentBlock.title}". Next up: ${nextTitle}. Save your context notes to transition smoothly.`,
    };
    this.gateway.broadcastTimeboxAlert(payload);
  }

  streamAgentStep(stepPayload: any) {
    this.gateway.broadcastAgentStep(stepPayload);
  }
}
