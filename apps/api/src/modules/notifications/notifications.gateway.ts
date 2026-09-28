import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { WebSocketEventType, TimeboxAlertPayload } from '@planner/shared-types';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(NotificationsGateway.name);

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  broadcastTimeboxTick(payload: { activeTimeboxId: string; secondsRemaining: number }) {
    this.server?.emit(WebSocketEventType.TIMEBOX_TICK, payload);
  }

  broadcastTimeboxAlert(alert: TimeboxAlertPayload) {
    this.logger.warn(`Emitting Timebox Alert: [${alert.type}] ${alert.message}`);
    const event = alert.type === 'WARNING' 
      ? WebSocketEventType.TIMEBOX_WARNING 
      : WebSocketEventType.TIMEBOX_SWITCH;
    this.server?.emit(event, alert);
  }

  broadcastAgentStep(agentPayload: any) {
    this.server?.emit(WebSocketEventType.AGENT_STREAM_UPDATE, agentPayload);
  }

  @SubscribeMessage('ping')
  handlePing(client: Socket): string {
    return 'pong';
  }
}
