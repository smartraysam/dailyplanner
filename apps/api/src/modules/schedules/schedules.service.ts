import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { v4 as uuidv4 } from 'uuid';
import {
  Task,
  Routine,
  TimeBlock,
  TaskCategory,
  TaskStatus,
} from '@planner/shared-types';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SchedulesService {
  private readonly logger = new Logger(SchedulesService.name);

  private tasks: Task[] = [];
  private routines: Routine[] = [];
  private timeblocks: TimeBlock[] = [];
  private activeTimeblockId: string | null = null;
  private secondsRemaining: number = 0;
  private warnedBlocks: Set<string> = new Set();
  private switchedBlocks: Set<string> = new Set();

  constructor(private readonly notificationsService: NotificationsService) {
    this.seedInitialData();
  }

  private seedInitialData() {
    // 1. Initial Routine
    const defaultRoutine: Routine = {
      id: 'routine-eng-standard',
      name: 'Full-Stack Engineering & Learning Cadence',
      description: 'Optimized routine for deep-work coding, continuous CS fundamentals learning, and zero-fatigue context switching.',
      isDefault: true,
      items: [
        {
          id: 'item-1',
          title: 'Daily Standup & Context Triage',
          category: 'MEETING',
          defaultDurationMinutes: 30,
          preAlertMinutes: 5,
          order: 1,
        },
        {
          id: 'item-2',
          title: 'Deep Work: Solve Bug A on SellerPro',
          category: 'BUG',
          defaultDurationMinutes: 90,
          preAlertMinutes: 5,
          order: 2,
        },
        {
          id: 'item-3',
          title: 'CS Fundamentals: Distributed Systems & Raft',
          category: 'LEARNING',
          defaultDurationMinutes: 120,
          preAlertMinutes: 10,
          order: 3,
        },
        {
          id: 'item-4',
          title: 'Deep Work: SellerPro Feature Enhancement',
          category: 'FEATURE',
          defaultDurationMinutes: 90,
          preAlertMinutes: 5,
          order: 4,
        },
        {
          id: 'item-5',
          title: 'Code Reviews & Day Wrap-up',
          category: 'ADMIN',
          defaultDurationMinutes: 30,
          preAlertMinutes: 5,
          order: 5,
        },
      ],
    };
    this.routines.push(defaultRoutine);

    // 2. Initial Context-Rich Tasks
    const now = new Date();
    const task1: Task = {
      id: 'task-sellerpro-bug-a',
      title: 'Solve Bug A on SellerPro project',
      description: 'Investigate and resolve NullPointerException in CheckoutService when anonymous users apply promotional discount codes.',
      category: 'BUG',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      plannedMinutes: 90,
      actualMinutes: 45,
      tags: ['sellerpro', 'backend', 'checkout', 'p1'],
      contextInfo: {
        repoPath: '/Users/developer/repos/sellerpro',
        gitBranch: 'fix/sp-412-checkout-npe',
        ticketUrl: 'https://linear.app/sellerpro/issue/SP-412',
        errorTrace: 'java.lang.NullPointerException: Cannot invoke DiscountToken.getPercent() because token is null\n\tat com.sellerpro.checkout.CheckoutService.applyDiscount(CheckoutService.java:142)\n\tat com.sellerpro.checkout.CheckoutController.processOrder(CheckoutController.java:88)',
        filesOfInterest: [
          'src/main/java/com/sellerpro/checkout/CheckoutService.java',
          'src/test/java/com/sellerpro/checkout/CheckoutServiceTest.java'
        ],
        notes: 'Reproduced in staging with token promo-FALL2026. Needs unit test coverage.'
      },
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: now.toISOString(),
    };

    const task2: Task = {
      id: 'task-cs-fundamentals',
      title: 'Take 2 hour learning on CS fundamentals',
      description: 'Deep dive into Raft consensus algorithm: leader election, log replication, and split-brain resolution invariants.',
      category: 'LEARNING',
      priority: 'MEDIUM',
      status: 'TODO',
      plannedMinutes: 120,
      actualMinutes: 0,
      tags: ['cs-fundamentals', 'distributed-systems', 'raft'],
      contextInfo: {
        notes: 'Read Ongaro paper (In Search of an Understandable Consensus Algorithm) sections 5-7. Write down 3 key safety invariant proofs.',
        filesOfInterest: ['https://raft.github.io/raft.pdf']
      },
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    const task3: Task = {
      id: 'task-sellerpro-feature-stripe',
      title: 'Build Idempotent Stripe Webhook Handler',
      description: 'Implement Redis-backed idempotency keys for Stripe charge.succeeded and invoice.payment_failed webhooks to prevent double billing.',
      category: 'FEATURE',
      priority: 'HIGH',
      status: 'TODO',
      plannedMinutes: 90,
      actualMinutes: 0,
      tags: ['sellerpro', 'stripe', 'redis', 'payments'],
      contextInfo: {
        repoPath: '/Users/developer/repos/sellerpro',
        gitBranch: 'feat/stripe-webhook-idempotency',
        notes: 'Store event.id in Redis with 72h TTL; return 200 immediately if duplicate detected.'
      },
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    this.tasks = [task1, task2, task3];

    // 3. Build today's active timeblocks based on routine
    const startTime = new Date();
    // Round to previous half hour
    startTime.setMinutes(Math.floor(startTime.getMinutes() / 30) * 30, 0, 0);

    let currentTimeCursor = new Date(startTime.getTime());

    const b1: TimeBlock = {
      id: 'block-1',
      taskId: task1.id,
      title: task1.title,
      category: task1.category,
      startTime: currentTimeCursor.toISOString(),
      endTime: new Date(currentTimeCursor.getTime() + 90 * 60000).toISOString(),
      durationMinutes: 90,
      isCompleted: false,
    };
    currentTimeCursor = new Date(currentTimeCursor.getTime() + 90 * 60000);

    const b2: TimeBlock = {
      id: 'block-2',
      taskId: task2.id,
      title: task2.title,
      category: task2.category,
      startTime: currentTimeCursor.toISOString(),
      endTime: new Date(currentTimeCursor.getTime() + 120 * 60000).toISOString(),
      durationMinutes: 120,
      isCompleted: false,
    };
    currentTimeCursor = new Date(currentTimeCursor.getTime() + 120 * 60000);

    const b3: TimeBlock = {
      id: 'block-3',
      taskId: task3.id,
      title: task3.title,
      category: task3.category,
      startTime: currentTimeCursor.toISOString(),
      endTime: new Date(currentTimeCursor.getTime() + 90 * 60000).toISOString(),
      durationMinutes: 90,
      isCompleted: false,
    };

    this.timeblocks = [b1, b2, b3];
    this.activeTimeblockId = b1.id;
    // Set active block timer (default 25 minutes left for demo responsiveness or full duration)
    this.secondsRemaining = 25 * 60; // 25:00 countdown
  }

  @Interval(1000)
  handleTimerInterval() {
    if (!this.activeTimeblockId || this.secondsRemaining <= 0) {
      return;
    }

    this.secondsRemaining -= 1;
    this.notificationsService.sendTick(this.activeTimeblockId, this.secondsRemaining);

    const currentBlock = this.timeblocks.find((b) => b.id === this.activeTimeblockId);
    if (!currentBlock) return;

    const nextBlockIndex = this.timeblocks.findIndex((b) => b.id === this.activeTimeblockId) + 1;
    const nextBlock = this.timeblocks[nextBlockIndex];

    // Pre-alert warning (at 5 minutes = 300s)
    if (this.secondsRemaining === 300 && !this.warnedBlocks.has(currentBlock.id)) {
      this.warnedBlocks.add(currentBlock.id);
      this.notificationsService.triggerTimeboxWarning(currentBlock, nextBlock, 5);
    }

    // Switch alert (at 0s)
    if (this.secondsRemaining === 0 && !this.switchedBlocks.has(currentBlock.id)) {
      this.switchedBlocks.add(currentBlock.id);
      this.notificationsService.triggerTaskSwitchAlert(currentBlock, nextBlock);
    }
  }

  // --- API Methods ---

  getSchedulesOverview() {
    const currentBlock = this.timeblocks.find((b) => b.id === this.activeTimeblockId) || null;
    const nextBlockIndex = this.timeblocks.findIndex((b) => b.id === this.activeTimeblockId) + 1;
    const nextBlock = this.timeblocks[nextBlockIndex] || null;

    return {
      activeTimeblockId: this.activeTimeblockId,
      secondsRemaining: this.secondsRemaining,
      currentBlock,
      nextBlock,
      timeblocks: this.timeblocks,
      tasks: this.tasks,
      routines: this.routines,
    };
  }

  getTasks(): Task[] {
    return this.tasks;
  }

  getTaskById(id: string): Task | undefined {
    return this.tasks.find((t) => t.id === id);
  }

  createTask(dto: Partial<Task>): Task {
    const newTask: Task = {
      id: `task-${uuidv4().substring(0, 8)}`,
      title: dto.title || 'Untitled Task',
      description: dto.description || '',
      category: dto.category || 'FEATURE',
      priority: dto.priority || 'MEDIUM',
      status: 'TODO',
      plannedMinutes: dto.plannedMinutes || 60,
      actualMinutes: 0,
      tags: dto.tags || [],
      contextInfo: dto.contextInfo || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.tasks.push(newTask);
    return newTask;
  }

  updateTask(id: string, updates: Partial<Task>): Task {
    const index = this.tasks.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new Error(`Task with ID ${id} not found`);
    }
    this.tasks[index] = {
      ...this.tasks[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return this.tasks[index];
  }

  getTimeblocks(): TimeBlock[] {
    return this.timeblocks;
  }

  switchActiveBlock(nextBlockId: string, contextSnapshot?: string) {
    const currentBlock = this.timeblocks.find((b) => b.id === this.activeTimeblockId);
    if (currentBlock) {
      currentBlock.isCompleted = true;
      if (contextSnapshot) {
        currentBlock.contextSnapshot = contextSnapshot;
      }
    }

    const nextBlock = this.timeblocks.find((b) => b.id === nextBlockId);
    if (!nextBlock) {
      throw new Error(`Timeblock ${nextBlockId} not found`);
    }

    this.activeTimeblockId = nextBlock.id;
    this.secondsRemaining = nextBlock.durationMinutes * 60;
    this.warnedBlocks.delete(nextBlock.id);
    this.switchedBlocks.delete(nextBlock.id);

    // Update associated task status
    if (nextBlock.taskId) {
      const task = this.tasks.find((t) => t.id === nextBlock.taskId);
      if (task && task.status === 'TODO') {
        task.status = 'IN_PROGRESS';
      }
    }

    return this.getSchedulesOverview();
  }

  snoozeCurrentBlock(minutes: number) {
    this.secondsRemaining += minutes * 60;
    if (this.activeTimeblockId) {
      this.switchedBlocks.delete(this.activeTimeblockId);
    }
    return {
      activeTimeblockId: this.activeTimeblockId,
      secondsRemaining: this.secondsRemaining,
      snoozedByMinutes: minutes,
    };
  }

  // Trigger test transition alert for demonstration / testing
  simulateTransitionAlert(type: 'WARNING' | 'SWITCH_NOW') {
    const currentBlock = this.timeblocks.find((b) => b.id === this.activeTimeblockId);
    if (!currentBlock) return;
    const nextBlockIndex = this.timeblocks.findIndex((b) => b.id === this.activeTimeblockId) + 1;
    const nextBlock = this.timeblocks[nextBlockIndex];

    if (type === 'WARNING') {
      this.notificationsService.triggerTimeboxWarning(currentBlock, nextBlock, 5);
    } else {
      this.notificationsService.triggerTaskSwitchAlert(currentBlock, nextBlock);
    }
    return { status: 'triggered', type };
  }
}
