import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SchedulesModule } from './modules/schedules/schedules.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AgentModule } from './modules/agent/agent.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    NotificationsModule,
    SchedulesModule,
    AnalyticsModule,
    AgentModule,
  ],
})
export class AppModule {}
