'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Bot,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Calendar,
  Layers,
  Code2,
  Bug,
  BookOpen,
  Users,
  ShieldAlert,
  ChevronRight,
  Terminal,
  FileCode2,
  GitBranch,
  BellRing,
  Volume2,
} from 'lucide-react';
import {
  Task,
  TimeBlock,
  TaskCategory,
  MultiHorizonAnalytics,
  AgentExecution,
  AgentLogStep,
  TimeboxAlertPayload,
} from '@planner/shared-types';

export default function DailyPlannerApp() {
  const [horizon, setHorizon] = useState<'DAY' | 'WEEK' | 'MONTH'>('DAY');
  const [activeTab, setActiveTab] = useState<'SCHEDULE' | 'TASKS' | 'AGENT' | 'ANALYTICS'>('SCHEDULE');

  // Timebox state
  const [secondsRemaining, setSecondsRemaining] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [activeBlockIndex, setActiveBlockIndex] = useState<number>(0);

  // Transition Alert Modal state
  const [activeAlert, setActiveAlert] = useState<TimeboxAlertPayload | null>(null);
  const [contextSnapshotNote, setContextSnapshotNote] = useState<string>('');

  // Agent Execution state
  const [activeExecution, setActiveExecution] = useState<AgentExecution | null>(null);
  const [isAgentDrawerOpen, setIsAgentDrawerOpen] = useState<boolean>(false);
  const [isAgentDelegating, setIsAgentDelegating] = useState<boolean>(false);

  // Initial Sample Tasks
  const [tasks, setTasks] = useState<Task[]>([
    {
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
        repoPath: '/repos/sellerpro',
        gitBranch: 'fix/sp-412-checkout-npe',
        ticketUrl: 'https://linear.app/sellerpro/issue/SP-412',
        errorTrace: 'java.lang.NullPointerException: Cannot invoke DiscountToken.getPercent() because token is null at com.sellerpro.checkout.CheckoutService.applyDiscount(CheckoutService.java:142)',
        notes: 'Reproduced in staging with token promo-FALL2026. Needs unit test coverage.',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
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
        notes: 'Read Ongaro paper sections 5-7. Write down 3 key safety invariant proofs.',
        filesOfInterest: ['https://raft.github.io/raft.pdf'],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-stripe-webhook',
      title: 'Build Idempotent Stripe Webhook Handler',
      description: 'Implement Redis-backed idempotency keys for Stripe charge.succeeded to prevent double processing.',
      category: 'FEATURE',
      priority: 'HIGH',
      status: 'TODO',
      plannedMinutes: 90,
      actualMinutes: 0,
      tags: ['sellerpro', 'stripe', 'redis'],
      contextInfo: {
        repoPath: '/repos/sellerpro',
        gitBranch: 'feat/stripe-webhook-idempotency',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]);

  // Initial Timeblocks
  const [timeblocks, setTimeblocks] = useState<TimeBlock[]>([
    {
      id: 'tb-1',
      taskId: 'task-sellerpro-bug-a',
      title: 'Solve Bug A on SellerPro project',
      category: 'BUG',
      startTime: '09:30',
      endTime: '11:00',
      durationMinutes: 90,
      isCompleted: false,
    },
    {
      id: 'tb-2',
      taskId: 'task-cs-fundamentals',
      title: 'Take 2 hour learning on CS fundamentals',
      category: 'LEARNING',
      startTime: '11:00',
      endTime: '13:00',
      durationMinutes: 120,
      isCompleted: false,
    },
    {
      id: 'tb-3',
      taskId: 'task-stripe-webhook',
      title: 'Build Idempotent Stripe Webhook Handler',
      category: 'FEATURE',
      startTime: '14:00',
      endTime: '15:30',
      durationMinutes: 90,
      isCompleted: false,
    },
  ]);

  const currentBlock = timeblocks[activeBlockIndex] || timeblocks[0];
  const nextBlock = timeblocks[activeBlockIndex + 1];

  // Live timer interval
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            triggerSwitchNowAlert();
            return 0;
          }
          if (prev === 300) {
            triggerWarningAlert();
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, secondsRemaining, activeBlockIndex]);

  const triggerWarningAlert = () => {
    setActiveAlert({
      currentBlock,
      nextBlock,
      minutesRemaining: 5,
      type: 'WARNING',
      message: `5-minute warning! Time to wrap up "${currentBlock.title}". Your next block is ${nextBlock ? `"${nextBlock.title}"` : 'your break'}.`,
    });
  };

  const triggerSwitchNowAlert = () => {
    setActiveAlert({
      currentBlock,
      nextBlock,
      minutesRemaining: 0,
      type: 'SWITCH_NOW',
      message: `Time to switch! Completed block: "${currentBlock.title}". Next up: ${nextBlock ? `"${nextBlock.title}"` : 'scheduled session'}.`,
    });
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const handleSnooze = (minutes: number) => {
    setSecondsRemaining((prev) => prev + minutes * 60);
    setActiveAlert(null);
  };

  const handleCompleteAndSwitch = () => {
    if (activeBlockIndex < timeblocks.length - 1) {
      const updated = [...timeblocks];
      updated[activeBlockIndex].isCompleted = true;
      if (contextSnapshotNote) {
        updated[activeBlockIndex].contextSnapshot = contextSnapshotNote;
      }
      setTimeblocks(updated);

      const nextIndex = activeBlockIndex + 1;
      setActiveBlockIndex(nextIndex);
      setSecondsRemaining(updated[nextIndex].durationMinutes * 60);
      setContextSnapshotNote('');
      setActiveAlert(null);
    } else {
      setActiveAlert(null);
    }
  };

  // Autonomous Agent Delegation Simulation
  const handleDelegateToAgent = async (task: Task) => {
    setIsAgentDelegating(true);
    setIsAgentDrawerOpen(true);

    const initialExec: AgentExecution = {
      id: `exec-${Date.now().toString().slice(-6)}`,
      taskId: task.id,
      taskTitle: task.title,
      status: 'INITIALIZING',
      currentStep: 0,
      maxSteps: 5,
      steps: [],
      startedAt: new Date().toISOString(),
    };
    setActiveExecution(initialExec);

    // Update task status
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: 'DELEGATED_TO_AGENT' } : t))
    );

    // Simulated ReAct step streaming
    const steps: AgentLogStep[] = [
      {
        stepIndex: 1,
        timestamp: new Date().toLocaleTimeString(),
        thought: `Ingesting task '${task.title}'. Inspecting repo '${task.contextInfo?.repoPath}' on branch '${task.contextInfo?.gitBranch}'. Reading stack trace at CheckoutService.java:142...`,
        action: 'read_code',
        toolCall: {
          id: 'tc-1',
          toolName: 'read_code',
          input: { file: 'CheckoutService.java', lines: '138-146' },
          output: '141: double rate = token.getPercent();\n142: order.setDiscount(order.getTotal() * (rate / 100.0));',
          timestamp: new Date().toLocaleTimeString(),
        },
        observation: 'Confirmed NPE. Missing null guard when token is empty or invalid.',
      },
      {
        stepIndex: 2,
        timestamp: new Date().toLocaleTimeString(),
        thought: 'Searching test suite to identify existing coverage and create regression test...',
        action: 'grep_search',
        toolCall: {
          id: 'tc-2',
          toolName: 'grep_search',
          input: { query: 'applyDiscount', path: 'src/test' },
          output: 'Found 2 tests in CheckoutServiceTest.java. Missing testApplyNullDiscount().',
          timestamp: new Date().toLocaleTimeString(),
        },
        observation: 'Regression test needed for null token handling.',
      },
      {
        stepIndex: 3,
        timestamp: new Date().toLocaleTimeString(),
        thought: 'Applying defensive null-check patch to CheckoutService.java: return untouched order if token is null or inactive.',
        action: 'apply_patch',
        toolCall: {
          id: 'tc-3',
          toolName: 'apply_patch',
          input: {
            target: 'double rate = token.getPercent();',
            replacement: 'if (token == null || !token.isActive()) return order;\ndouble rate = token.getPercent();',
          },
          output: 'Patch successfully applied to CheckoutService.java',
          timestamp: new Date().toLocaleTimeString(),
        },
        observation: 'Code updated cleanly.',
      },
      {
        stepIndex: 4,
        timestamp: new Date().toLocaleTimeString(),
        thought: 'Running Maven test runner in isolated Docker sandbox...',
        action: 'run_sandbox_command',
        toolCall: {
          id: 'tc-4',
          toolName: 'sandbox_exec',
          input: { command: './mvnw test -Dtest=CheckoutServiceTest' },
          output: '[INFO] Running com.sellerpro.checkout.CheckoutServiceTest\n[INFO] Tests run: 3, Failures: 0, Errors: 0, Time: 1.14s\n[INFO] BUILD SUCCESS',
          timestamp: new Date().toLocaleTimeString(),
        },
        observation: 'All 3 tests passed successfully in isolated sandbox container.',
      },
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise((r) => setTimeout(r, 1500));
      setActiveExecution((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          status: i === steps.length - 1 ? 'SUCCESS' : 'EXECUTING_TOOL',
          currentStep: i + 1,
          steps: [...prev.steps, steps[i]],
          generatedDiff:
            i === steps.length - 1
              ? `diff --git a/src/main/java/com/sellerpro/checkout/CheckoutService.java b/src/main/java/com/sellerpro/checkout/CheckoutService.java
@@ -140,3 +140,6 @@ public class CheckoutService {
     public Order applyDiscount(Order order, DiscountToken token) {
+        if (token == null || !token.isActive()) {
+            return order;
+        }
         double rate = token.getPercent();
         order.setDiscount(order.getTotal() * (rate / 100.0));
         return order;`
              : undefined,
          resultSummary:
            i === steps.length - 1
              ? 'Successfully guarded against NullPointerException in CheckoutService.java. Added regression test and verified pass in sandbox.'
              : undefined,
        };
      });
    }

    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: 'IN_REVIEW' } : t))
    );
    setIsAgentDelegating(false);
  };

  const getCategoryColor = (cat: TaskCategory) => {
    switch (cat) {
      case 'BUG':
        return 'text-rose-400 bg-rose-950/40 border-rose-800/50';
      case 'LEARNING':
        return 'text-amber-400 bg-amber-950/40 border-amber-800/50';
      case 'FEATURE':
        return 'text-emerald-400 bg-emerald-950/40 border-emerald-800/50';
      case 'MEETING':
        return 'text-purple-400 bg-purple-950/40 border-purple-800/50';
      case 'ADMIN':
        return 'text-blue-400 bg-blue-950/40 border-blue-800/50';
      default:
        return 'text-slate-400 bg-slate-800/40 border-slate-700/50';
    }
  };

  const getCategoryIcon = (cat: TaskCategory) => {
    switch (cat) {
      case 'BUG':
        return <Bug className="w-3.5 h-3.5" />;
      case 'LEARNING':
        return <BookOpen className="w-3.5 h-3.5" />;
      case 'FEATURE':
        return <Code2 className="w-3.5 h-3.5" />;
      case 'MEETING':
        return <Users className="w-3.5 h-3.5" />;
      default:
        return <Layers className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#080c14] text-slate-100">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#0d1320]/80 backdrop-blur-md px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-bold tracking-tight text-white">Daily Planner</h1>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                  Engineering Cadence
                </span>
              </div>
              <p className="text-xs text-slate-400">Zero-Fatigue Task Switching & Autonomous Agent Runtime</p>
            </div>
          </div>

          {/* Horizon Selector */}
          <div className="flex items-center space-x-1 p-1 bg-slate-900/90 rounded-xl border border-slate-800">
            {(['DAY', 'WEEK', 'MONTH'] as const).map((h) => (
              <button
                key={h}
                onClick={() => setHorizon(h)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  horizon === h
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {h === 'DAY' ? 'Today' : h === 'WEEK' ? 'Week View' : 'Month Horizon'}
              </button>
            ))}
          </div>

          {/* Quick Simulation Triggers for User Feedback */}
          <div className="flex items-center space-x-2">
            <button
              onClick={triggerWarningAlert}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-medium transition"
              title="Test the 5-minute pre-alert chime"
            >
              <BellRing className="w-3.5 h-3.5" />
              <span>Test 5m Warning</span>
            </button>
            <button
              onClick={triggerSwitchNowAlert}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-medium transition"
              title="Test the task switch alert"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Test Switch Alert</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Active Timebox & Multi-Horizon Analytics (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Active Timebox Highlight Card */}
          <div className="relative overflow-hidden rounded-2xl glass-panel-glow p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 font-mono">
                    Active Timebox (Block {activeBlockIndex + 1} of {timeblocks.length})
                  </span>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-md border flex items-center space-x-1 ${getCategoryColor(
                      currentBlock.category
                    )}`}
                  >
                    {getCategoryIcon(currentBlock.category)}
                    <span>{currentBlock.category}</span>
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">{currentBlock.title}</h2>
                <p className="text-xs text-slate-400 mt-1 flex items-center space-x-2">
                  <span>Scheduled: {currentBlock.startTime} - {currentBlock.endTime}</span>
                  <span>•</span>
                  <span>Duration: {currentBlock.durationMinutes} mins</span>
                </p>
              </div>

              {/* Countdown Dial */}
              <div className="flex flex-col items-center bg-slate-900/90 border border-slate-700/60 rounded-2xl p-4 shadow-xl">
                <span className="text-3xl font-mono font-bold text-indigo-400 tracking-wider">
                  {formatTime(secondsRemaining)}
                </span>
                <span className="text-[10px] text-slate-400 font-mono uppercase mt-0.5">Time Remaining</span>
                <div className="flex items-center space-x-1.5 mt-2">
                  <button
                    onClick={() => setIsRunning(!isRunning)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  >
                    {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => handleSnooze(5)}
                    className="px-2 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-[11px] font-medium border border-indigo-500/30 transition"
                  >
                    +5m Snooze
                  </button>
                  <button
                    onClick={handleCompleteAndSwitch}
                    className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-medium border border-emerald-500/30 transition"
                  >
                    Switch Now
                  </button>
                </div>
              </div>
            </div>

            {/* Context & Next Up Footer */}
            <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2 text-slate-400">
                <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
                <span>Active Branch: <code className="text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded">fix/sp-412-checkout-npe</code></span>
              </div>
              {nextBlock && (
                <div className="flex items-center space-x-1 text-slate-400">
                  <span>Next up:</span>
                  <span className="text-slate-200 font-medium">{nextBlock.title}</span>
                  <span className="text-[11px] text-indigo-400">({nextBlock.startTime})</span>
                </div>
              )}
            </div>
          </div>

          {/* Multi-Horizon Metrics Display */}
          <div className="rounded-2xl glass-panel p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-semibold text-white">
                  {horizon === 'DAY'
                    ? "Today's Focus & Velocity"
                    : horizon === 'WEEK'
                    ? 'Weekly Progress & Cadence'
                    : 'Monthly Engineering Mastery'}
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {horizon === 'DAY' ? 'Sep 27, 2026' : horizon === 'WEEK' ? 'Week 39 (Sep 21-27)' : 'September 2026'}
              </span>
            </div>

            {horizon === 'DAY' && (
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5">
                  <span className="text-xs text-slate-400">Focus Time</span>
                  <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">4h 05m</p>
                  <span className="text-[10px] text-emerald-500/80 font-mono">Planned: 6h 30m</span>
                </div>
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5">
                  <span className="text-xs text-slate-400">Deep Work Ratio</span>
                  <p className="text-2xl font-bold font-mono text-indigo-400 mt-1">86%</p>
                  <span className="text-[10px] text-slate-500 font-mono">Target: &gt;75%</span>
                </div>
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5">
                  <span className="text-xs text-slate-400">CS Learning</span>
                  <p className="text-2xl font-bold font-mono text-amber-400 mt-1">2.0 hrs</p>
                  <span className="text-[10px] text-amber-500/80 font-mono">Raft Consensus</span>
                </div>
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5">
                  <span className="text-xs text-slate-400">Context Switches</span>
                  <p className="text-2xl font-bold font-mono text-blue-400 mt-1">2</p>
                  <span className="text-[10px] text-blue-500/80 font-mono">Low fatigue</span>
                </div>
              </div>
            )}

            {horizon === 'WEEK' && (
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5">
                    <span className="text-xs text-slate-400">Total Focus</span>
                    <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">23.6 hrs</p>
                    <span className="text-[10px] text-slate-500">Avg 4.7h / day</span>
                  </div>
                  <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5">
                    <span className="text-xs text-slate-400">CS Fundamentals</span>
                    <p className="text-2xl font-bold font-mono text-amber-400 mt-1">9.5 hrs</p>
                    <span className="text-[10px] text-amber-500 font-mono">Distributed Systems</span>
                  </div>
                  <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5">
                    <span className="text-xs text-slate-400">Bugs Resolved</span>
                    <p className="text-2xl font-bold font-mono text-rose-400 mt-1">6</p>
                    <span className="text-[10px] text-slate-500">SellerPro & Core</span>
                  </div>
                  <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5">
                    <span className="text-xs text-slate-400">Agent Hand-offs</span>
                    <p className="text-2xl font-bold font-mono text-purple-400 mt-1">5</p>
                    <span className="text-[10px] text-purple-400 font-mono">100% verified</span>
                  </div>
                </div>

                {/* Week Category Distribution Bar */}
                <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-3 space-y-2">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Focus Distribution:</span>
                    <span>45% Feature • 27% CS Learning • 20% Bugs • 8% Meetings</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
                    <div className="bg-emerald-500 h-full w-[45%]" title="Features" />
                    <div className="bg-amber-500 h-full w-[27%]" title="CS Learning" />
                    <div className="bg-rose-500 h-full w-[20%]" title="Bugs" />
                    <div className="bg-purple-500 h-full w-[8%]" title="Meetings" />
                  </div>
                </div>
              </div>
            )}

            {horizon === 'MONTH' && (
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5">
                    <span className="text-xs text-slate-400">Monthly Focus</span>
                    <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">98.2 hrs</p>
                    <span className="text-[10px] text-slate-500 font-mono">Deep work ratio: 79%</span>
                  </div>
                  <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5">
                    <span className="text-xs text-slate-400">Learning Hours</span>
                    <p className="text-2xl font-bold font-mono text-amber-400 mt-1">38.0 hrs</p>
                    <span className="text-[10px] text-amber-500 font-mono">Raft, Paxos, LSM Trees</span>
                  </div>
                  <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5">
                    <span className="text-xs text-slate-400">Tasks Completed</span>
                    <p className="text-2xl font-bold font-mono text-blue-400 mt-1">68</p>
                    <span className="text-[10px] text-slate-500 font-mono">14 autonomous PRs</span>
                  </div>
                  <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5">
                    <span className="text-xs text-slate-400">Consistency Streak</span>
                    <p className="text-2xl font-bold font-mono text-purple-400 mt-1">22 days</p>
                    <span className="text-[10px] text-purple-400 font-mono">High adherence</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Today's Schedule Timeline */}
          <div className="rounded-2xl glass-panel p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-semibold text-white">Daily Schedule Blocks</h3>
              </div>
              <span className="text-xs text-slate-400">Routine: Full-Stack Engineering & Learning</span>
            </div>

            <div className="space-y-3">
              {timeblocks.map((block, idx) => {
                const isActive = idx === activeBlockIndex;
                return (
                  <div
                    key={block.id}
                    onClick={() => {
                      setActiveBlockIndex(idx);
                      setSecondsRemaining(block.durationMinutes * 60);
                    }}
                    className={`cursor-pointer rounded-xl p-4 transition-all border ${
                      isActive
                        ? 'bg-slate-800/80 border-indigo-500/60 shadow-lg shadow-indigo-500/10'
                        : block.isCompleted
                        ? 'bg-slate-900/40 border-slate-800/60 opacity-60'
                        : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="font-mono text-xs text-slate-400 w-24">
                          {block.startTime} - {block.endTime}
                        </div>
                        <div
                          className={`p-1.5 rounded-lg border flex items-center justify-center ${getCategoryColor(
                            block.category
                          )}`}
                        >
                          {getCategoryIcon(block.category)}
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-white">{block.title}</h4>
                          <span className="text-xs text-slate-400 font-mono">{block.durationMinutes} minutes</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {block.contextSnapshot && (
                          <span className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 font-mono">
                            Context: "{block.contextSnapshot}"
                          </span>
                        )}
                        {block.isCompleted ? (
                          <span className="flex items-center space-x-1 text-xs text-emerald-400 font-medium">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Done</span>
                          </span>
                        ) : isActive ? (
                          <span className="flex items-center space-x-1 text-xs text-indigo-400 font-medium">
                            <span className="h-2 w-2 rounded-full bg-indigo-500 animate-ping" />
                            <span>In Progress</span>
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">Upcoming</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Context-Rich Tasks & AI Agent Delegation (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-2xl glass-panel p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Code2 className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-semibold text-white">Engineering Tasks</h3>
              </div>
              <span className="text-xs text-indigo-400 font-mono">{tasks.length} Active</span>
            </div>

            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-xl bg-slate-900/70 border border-slate-800/80 p-4 space-y-2 hover:border-slate-700 transition"
                >
                  <div className="flex items-start justify-between">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-mono border flex items-center space-x-1 ${getCategoryColor(
                        task.category
                      )}`}
                    >
                      {getCategoryIcon(task.category)}
                      <span>{task.category}</span>
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                        task.status === 'DELEGATED_TO_AGENT'
                          ? 'bg-purple-950/50 text-purple-400 border border-purple-800'
                          : task.status === 'IN_REVIEW'
                          ? 'bg-amber-950/50 text-amber-400 border border-amber-800'
                          : task.status === 'IN_PROGRESS'
                          ? 'bg-indigo-950/50 text-indigo-400 border border-indigo-800'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {task.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <h4 className="text-sm font-semibold text-white leading-snug">{task.title}</h4>
                  {task.description && (
                    <p className="text-xs text-slate-400 line-clamp-2">{task.description}</p>
                  )}

                  {/* Context Info Pills */}
                  {task.contextInfo?.repoPath && (
                    <div className="pt-1 flex items-center space-x-2 text-[11px] text-slate-400 font-mono">
                      <span>Repo:</span>
                      <code className="text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">
                        {task.contextInfo.repoPath}
                      </code>
                    </div>
                  )}

                  {/* Delegation Button */}
                  <div className="pt-2 flex items-center justify-between border-t border-slate-800/60">
                    <span className="text-xs text-slate-500 font-mono">{task.plannedMinutes}m allocated</span>
                    {task.status === 'DELEGATED_TO_AGENT' || task.status === 'IN_REVIEW' ? (
                      <button
                        onClick={() => setIsAgentDrawerOpen(true)}
                        className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs font-medium border border-purple-500/30 transition"
                      >
                        <Bot className="w-3.5 h-3.5" />
                        <span>View Agent Logs</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDelegateToAgent(task)}
                        disabled={isAgentDelegating}
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-medium shadow-md shadow-indigo-600/20 transition disabled:opacity-50"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Delegate to Agent</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Proactive Task-Switch Alert Modal */}
      {activeAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="max-w-md w-full rounded-2xl glass-panel-glow border-indigo-500/50 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-3">
              <div
                className={`p-2.5 rounded-xl ${
                  activeAlert.type === 'SWITCH_NOW'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                }`}
              >
                {activeAlert.type === 'SWITCH_NOW' ? (
                  <Clock className="w-6 h-6 animate-spin" />
                ) : (
                  <BellRing className="w-6 h-6" />
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {activeAlert.type === 'SWITCH_NOW' ? 'Task Switch Time!' : '5-Minute Transition Notice'}
                </h3>
                <p className="text-xs text-slate-400">Zero-Fatigue Context Management</p>
              </div>
            </div>

            <p className="text-sm text-slate-300">{activeAlert.message}</p>

            {/* Context Snapshot Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                <span>Save Context Snapshot (Optional)</span>
                <span className="text-[10px] text-slate-500 font-mono">Avoid mental re-entry lag</span>
              </label>
              <input
                type="text"
                value={contextSnapshotNote}
                onChange={(e) => setContextSnapshotNote(e.target.value)}
                placeholder="e.g. Debugged token getter; ready to write test assertion tomorrow"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => handleSnooze(5)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
              >
                Snooze 5 Mins
              </button>
              <button
                onClick={handleCompleteAndSwitch}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-medium shadow-md shadow-indigo-600/30 transition flex items-center space-x-1.5"
              >
                <span>Switch to Next Block</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Autonomous AI Agent Drawer / Terminal */}
      {isAgentDrawerOpen && activeExecution && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-[#0b101b] border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
          {/* Drawer Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <span>Autonomous AI Agent Core</span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                      activeExecution.status === 'SUCCESS'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-purple-500/20 text-purple-300 border border-purple-500/30 animate-pulse'
                    }`}
                  >
                    {activeExecution.status}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 truncate max-w-sm">{activeExecution.taskTitle}</p>
              </div>
            </div>
            <button
              onClick={() => setIsAgentDrawerOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition text-xs font-mono"
            >
              ✕ Close
            </button>
          </div>

          {/* Drawer Body: ReAct Execution Steps */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 font-sans text-xs">
            <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 font-mono text-[11px] text-slate-400">
              <span className="text-indigo-400">ReAct Loop Architecture:</span> Thought → Action (Sandbox) → Observation → Verify
            </div>

            {activeExecution.steps.map((step) => (
              <div
                key={step.stepIndex}
                className="rounded-xl bg-slate-900/70 border border-slate-800/80 p-4 space-y-2.5"
              >
                <div className="flex items-center justify-between text-slate-400 font-mono text-[11px]">
                  <span className="text-purple-400 font-semibold">Step {step.stepIndex}</span>
                  <span>{step.timestamp}</span>
                </div>

                {/* Thought */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-indigo-400 font-bold">
                    Thought
                  </span>
                  <p className="text-slate-300 leading-relaxed">{step.thought}</p>
                </div>

                {/* Tool Call */}
                {step.toolCall && (
                  <div className="rounded-lg bg-black/50 border border-slate-800 p-2.5 space-y-1 font-mono text-[11px]">
                    <div className="flex items-center space-x-2 text-amber-400">
                      <Terminal className="w-3.5 h-3.5" />
                      <span>tool: {step.toolCall.toolName}</span>
                    </div>
                    <pre className="text-slate-400 whitespace-pre-wrap overflow-x-auto text-[10px]">
                      {JSON.stringify(step.toolCall.input, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Observation */}
                {step.observation && (
                  <div className="space-y-1 bg-emerald-950/20 border border-emerald-800/30 rounded-lg p-2.5 text-emerald-300">
                    <span className="text-[10px] uppercase font-mono tracking-wider font-bold block">
                      Observation
                    </span>
                    <p className="text-[11px]">{step.observation}</p>
                  </div>
                )}
              </div>
            ))}

            {/* Generated Code Diff if Success */}
            {activeExecution.generatedDiff && (
              <div className="rounded-xl bg-slate-900 border border-indigo-500/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-indigo-300 font-semibold">
                    <FileCode2 className="w-4 h-4" />
                    <span>Generated Git Patch</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    Sandbox Verified Pass
                  </span>
                </div>
                <pre className="p-3 bg-black/70 rounded-lg text-[10px] font-mono text-slate-300 overflow-x-auto leading-relaxed border border-slate-800">
                  {activeExecution.generatedDiff}
                </pre>
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-mono">1 file changed, 4 insertions(+)</span>
                  <button
                    onClick={() => {
                      alert('Patch merged! Task status updated to COMPLETED.');
                      setTasks((prev) =>
                        prev.map((t) =>
                          t.id === activeExecution.taskId ? { ...t, status: 'COMPLETED' } : t
                        )
                      );
                      setIsAgentDrawerOpen(false);
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-md shadow-emerald-600/30 transition flex items-center space-x-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve & Merge Diff</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
