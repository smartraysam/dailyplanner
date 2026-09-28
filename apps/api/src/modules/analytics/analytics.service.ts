import { Injectable } from '@nestjs/common';
import { MultiHorizonAnalytics, DayProgress } from '@planner/shared-types';

@Injectable()
export class AnalyticsService {
  getDayProgress(): DayProgress {
    return {
      date: new Date().toISOString().split('T')[0],
      totalPlannedMinutes: 390,
      totalActualMinutes: 245,
      focusScore: 92,
      contextSwitchCount: 2,
      completedTaskCount: 3,
      delegatedTaskCount: 1,
      categoryBreakdown: {
        BUG: 90,
        LEARNING: 120,
        FEATURE: 120,
        MEETING: 30,
        ADMIN: 30,
      },
    };
  }

  getMultiHorizonAnalytics(horizon: 'DAY' | 'WEEK' | 'MONTH'): MultiHorizonAnalytics {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (horizon === 'DAY') {
      return {
        horizon: 'DAY',
        dateRange: { start: todayStr, end: todayStr },
        totalFocusMinutes: 245,
        deepWorkPercentage: 86,
        learningHours: 2.0,
        completedTasks: 3,
        categoryDistribution: [
          { category: 'LEARNING', minutes: 120, percentage: 38 },
          { category: 'BUG', minutes: 90, percentage: 28 },
          { category: 'FEATURE', minutes: 80, percentage: 25 },
          { category: 'MEETING', minutes: 30, percentage: 9 },
        ],
        dailyTrends: [
          { date: todayStr, focusMinutes: 245, completedCount: 3 },
        ],
      };
    }

    if (horizon === 'WEEK') {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - 4);
      return {
        horizon: 'WEEK',
        dateRange: {
          start: weekStart.toISOString().split('T')[0],
          end: todayStr,
        },
        totalFocusMinutes: 1420,
        deepWorkPercentage: 82,
        learningHours: 9.5,
        completedTasks: 16,
        categoryDistribution: [
          { category: 'FEATURE', minutes: 640, percentage: 45 },
          { category: 'LEARNING', minutes: 380, percentage: 27 },
          { category: 'BUG', minutes: 280, percentage: 20 },
          { category: 'MEETING', minutes: 120, percentage: 8 },
        ],
        dailyTrends: [
          { date: 'Mon', focusMinutes: 280, completedCount: 3 },
          { date: 'Tue', focusMinutes: 310, completedCount: 4 },
          { date: 'Wed', focusMinutes: 290, completedCount: 3 },
          { date: 'Thu', focusMinutes: 340, completedCount: 4 },
          { date: 'Fri (Today)', focusMinutes: 245, completedCount: 3 },
        ],
      };
    }

    // MONTH
    const monthStart = new Date(today);
    monthStart.setDate(today.getDate() - 29);
    return {
      horizon: 'MONTH',
      dateRange: {
        start: monthStart.toISOString().split('T')[0],
        end: todayStr,
      },
      totalFocusMinutes: 5890,
      deepWorkPercentage: 79,
      learningHours: 38.0,
      completedTasks: 68,
      categoryDistribution: [
        { category: 'FEATURE', minutes: 2700, percentage: 46 },
        { category: 'LEARNING', minutes: 1620, percentage: 27 },
        { category: 'BUG', minutes: 1100, percentage: 19 },
        { category: 'MEETING', minutes: 470, percentage: 8 },
      ],
      dailyTrends: [
        { date: 'Week 1', focusMinutes: 1480, completedCount: 18 },
        { date: 'Week 2', focusMinutes: 1520, completedCount: 17 },
        { date: 'Week 3', focusMinutes: 1470, completedCount: 16 },
        { date: 'Week 4', focusMinutes: 1420, completedCount: 17 },
      ],
    };
  }
}
