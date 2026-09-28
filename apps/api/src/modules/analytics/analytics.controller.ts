import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('day')
  getDayProgress() {
    return this.analyticsService.getDayProgress();
  }

  @Get('horizon')
  getHorizonAnalytics(@Query('horizon') horizon: 'DAY' | 'WEEK' | 'MONTH' = 'DAY') {
    return this.analyticsService.getMultiHorizonAnalytics(horizon);
  }
}
