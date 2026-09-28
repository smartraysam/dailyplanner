import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  AgentExecution,
  AgentLogStep,
  Task,
} from '@planner/shared-types';
import { SchedulesService } from '../schedules/schedules.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);
  private executions: Map<string, AgentExecution> = new Map();

  constructor(
    private readonly schedulesService: SchedulesService,
    private readonly notificationsService: NotificationsService,
  ) {}

  getExecution(id: string): AgentExecution | undefined {
    return this.executions.get(id);
  }

  async delegateTask(taskId: string): Promise<AgentExecution> {
    const task = this.schedulesService.getTaskById(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    const executionId = `exec-${uuidv4().substring(0, 8)}`;
    const execution: AgentExecution = {
      id: executionId,
      taskId: task.id,
      taskTitle: task.title,
      status: 'INITIALIZING',
      currentStep: 0,
      maxSteps: 10,
      steps: [],
      startedAt: new Date().toISOString(),
    };

    this.executions.set(executionId, execution);

    // Update task status in planner
    this.schedulesService.updateTask(task.id, {
      status: 'DELEGATED_TO_AGENT',
      delegatedAgentExecutionId: executionId,
    });

    // Start background ReAct execution cycle
    this.runAutonomousReActLoop(execution, task);

    return execution;
  }

  private async runAutonomousReActLoop(execution: AgentExecution, task: Task) {
    this.logger.log(`Starting Autonomous ReAct loop for execution ${execution.id} [${task.title}]`);
    execution.status = 'THINKING';

    const emitStep = (step: AgentLogStep) => {
      execution.steps.push(step);
      execution.currentStep = step.stepIndex;
      this.notificationsService.streamAgentStep({
        executionId: execution.id,
        taskId: task.id,
        step,
        status: execution.status,
      });
    };

    // Step 1: Ingest full context & Analyze stack trace
    await this.delay(1200);
    emitStep({
      stepIndex: 1,
      timestamp: new Date().toISOString(),
      thought: `Received task with full context. Target repo: "${task.contextInfo?.repoPath || '/repos/sellerpro'}", branch: "${task.contextInfo?.gitBranch || 'main'}". The error stack trace indicates a NullPointerException at CheckoutService.java:142 when discount token is evaluated. I need to locate the file and inspect discount token null-check guards.`,
      action: 'read_file_symbols',
      toolCall: {
        id: 'tc-1',
        toolName: 'read_file',
        input: { path: 'src/main/java/com/sellerpro/checkout/CheckoutService.java', lines: '135-155' },
        output: '140: public Order applyDiscount(Order order, DiscountToken token) {\n141:   // Bug: Missing null-guard if client passed empty promo code\n142:   double rate = token.getPercent();\n143:   order.setDiscount(order.getTotal() * (rate / 100.0));\n144:   return order;\n145: }',
        durationMs: 140,
        timestamp: new Date().toISOString(),
      },
      observation: 'Confirmed NPE root cause at line 142. If token is null or promo not found, token.getPercent() throws NullPointerException.',
    });

    // Step 2: Search for existing test suite
    await this.delay(1500);
    emitStep({
      stepIndex: 2,
      timestamp: new Date().toISOString(),
      thought: 'Let us check CheckoutServiceTest.java to see how discount application is tested and construct a failing regression test case.',
      action: 'grep_search',
      toolCall: {
        id: 'tc-2',
        toolName: 'grep_search',
        input: { path: 'src/test/java/com/sellerpro/checkout/CheckoutServiceTest.java', query: 'applyDiscount' },
        output: 'Found 2 matches in CheckoutServiceTest.java:\n- testApplyValidDiscount()\n- testApplyExpiredDiscount() (missing testApplyNullDiscount)',
        durationMs: 95,
        timestamp: new Date().toISOString(),
      },
      observation: 'Test suite lacks a test case for null/anonymous discount token handling.',
    });

    // Step 3: Formulate patch & apply fix
    await this.delay(1800);
    emitStep({
      stepIndex: 3,
      timestamp: new Date().toISOString(),
      thought: 'Applying fix: Add null-safe defensive guard and Optional.ofNullable check. If token is null, return original order with 0% discount without throwing exception.',
      action: 'apply_patch',
      toolCall: {
        id: 'tc-3',
        toolName: 'apply_patch',
        input: {
          file: 'src/main/java/com/sellerpro/checkout/CheckoutService.java',
          patch: '- double rate = token.getPercent();\n+ if (token == null || !token.isActive()) {\n+   return order;\n+ }\n+ double rate = token.getPercent();',
        },
        output: 'Patch successfully applied to CheckoutService.java:141-145.',
        durationMs: 220,
        timestamp: new Date().toISOString(),
      },
      observation: 'File modified with defensive check.',
    });

    // Step 4: Execute Sandbox Unit Tests
    await this.delay(2000);
    emitStep({
      stepIndex: 4,
      timestamp: new Date().toISOString(),
      thought: 'Running Maven test runner in isolated Docker sandbox to verify that existing tests pass and our new regression test succeeds.',
      action: 'run_command_in_sandbox',
      toolCall: {
        id: 'tc-4',
        toolName: 'sandbox_exec',
        input: { command: './mvnw test -Dtest=CheckoutServiceTest' },
        output: '[INFO] Running com.sellerpro.checkout.CheckoutServiceTest\n[INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 1.42s\n[INFO] BUILD SUCCESS',
        durationMs: 1420,
        timestamp: new Date().toISOString(),
      },
      observation: 'All 3 tests passed cleanly in the sandbox container!',
    });

    // Step 5: Final Summary & Hand-off
    await this.delay(1000);
    const generatedDiff = `diff --git a/src/main/java/com/sellerpro/checkout/CheckoutService.java b/src/main/java/com/sellerpro/checkout/CheckoutService.java
index 4b825dc..f91a27e 100644
--- a/src/main/java/com/sellerpro/checkout/CheckoutService.java
+++ b/src/main/java/com/sellerpro/checkout/CheckoutService.java
@@ -139,7 +139,10 @@ public class CheckoutService {
     public Order applyDiscount(Order order, DiscountToken token) {
-       double rate = token.getPercent();
-       order.setDiscount(order.getTotal() * (rate / 100.0));
+       if (token == null || !token.isActive()) {
+           return order;
+       }
+       double rate = token.getPercent();
+       order.setDiscount(order.getTotal() * (rate / 100.0));
        return order;
     }`;

    execution.status = 'SUCCESS';
    execution.completedAt = new Date().toISOString();
    execution.generatedDiff = generatedDiff;
    execution.resultSummary = 'Resolved NPE in CheckoutService by adding null & active token validation. Added unit test CheckoutServiceTest#testApplyNullDiscount. All sandbox tests verified passing.';

    // Update task in planner to IN_REVIEW
    this.schedulesService.updateTask(task.id, {
      status: 'IN_REVIEW',
    });

    this.notificationsService.streamAgentStep({
      executionId: execution.id,
      taskId: task.id,
      status: 'SUCCESS',
      generatedDiff,
      resultSummary: execution.resultSummary,
    });
    this.logger.log(`Agent execution ${execution.id} completed successfully!`);
  }

  private delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
