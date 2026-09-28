export type TaskCategory = 'FEATURE' | 'BUG' | 'LEARNING' | 'MEETING' | 'ADMIN';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type TaskStatus = 
  | 'TODO' 
  | 'IN_PROGRESS' 
  | 'DELEGATED_TO_AGENT' 
  | 'IN_REVIEW' 
  | 'COMPLETED';

export interface TaskContextInfo {
  repoPath?: string;
  gitBranch?: string;
  ticketUrl?: string;
  errorTrace?: string;
  filesOfInterest?: string[];
  reproductionSteps?: string;
  notes?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  plannedMinutes: number;
  actualMinutes?: number;
  scheduledStartTime?: string; // ISO string
  scheduledEndTime?: string;   // ISO string
  tags?: string[];
  contextInfo?: TaskContextInfo;
  delegatedAgentExecutionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoutineItem {
  id: string;
  title: string;
  category: TaskCategory;
  defaultDurationMinutes: number;
  preAlertMinutes: number;
  order: number;
  suggestedPrompt?: string;
}

export interface Routine {
  id: string;
  name: string;
  description: string;
  items: RoutineItem[];
  isDefault?: boolean;
}

export interface TimeBlock {
  id: string;
  taskId?: string;
  title: string;
  category: TaskCategory;
  startTime: string; // ISO String
  endTime: string;   // ISO String
  durationMinutes: number;
  isCompleted: boolean;
  contextSnapshot?: string; // Quick note when transitioning
}

export interface DayProgress {
  date: string; // YYYY-MM-DD
  totalPlannedMinutes: number;
  totalActualMinutes: number;
  focusScore: number; // 0 - 100
  contextSwitchCount: number;
  categoryBreakdown: Record<TaskCategory, number>; // in minutes
  completedTaskCount: number;
  delegatedTaskCount: number;
}

export interface MultiHorizonAnalytics {
  horizon: 'DAY' | 'WEEK' | 'MONTH';
  dateRange: { start: string; end: string };
  totalFocusMinutes: number;
  deepWorkPercentage: number;
  learningHours: number;
  completedTasks: number;
  categoryDistribution: { category: TaskCategory; minutes: number; percentage: number }[];
  dailyTrends?: { date: string; focusMinutes: number; completedCount: number }[];
}

export type AgentExecutionStatus = 
  | 'INITIALIZING' 
  | 'THINKING' 
  | 'EXECUTING_TOOL' 
  | 'WAITING_APPROVAL' 
  | 'SUCCESS' 
  | 'FAILED';

export interface AgentToolCall {
  id: string;
  toolName: string;
  input: Record<string, any>;
  output?: string;
  durationMs?: number;
  timestamp: string;
}

export interface AgentLogStep {
  stepIndex: number;
  timestamp: string;
  thought: string;
  action?: string;
  toolCall?: AgentToolCall;
  observation?: string;
}

export interface AgentExecution {
  id: string;
  taskId: string;
  taskTitle: string;
  status: AgentExecutionStatus;
  currentStep: number;
  maxSteps: number;
  steps: AgentLogStep[];
  generatedDiff?: string;
  resultSummary?: string;
  error?: string;
  startedAt: string;
  completedAt?: string;
}

export enum WebSocketEventType {
  TIMEBOX_TICK = 'TIMEBOX_TICK',
  TIMEBOX_WARNING = 'TIMEBOX_WARNING',     // T-5 min or custom pre-alert
  TIMEBOX_SWITCH = 'TIMEBOX_SWITCH',       // Time to switch to next task!
  TASK_UPDATED = 'TASK_UPDATED',
  AGENT_STREAM_UPDATE = 'AGENT_STREAM_UPDATE',
  AGENT_COMPLETED = 'AGENT_COMPLETED'
}

export interface TimeboxAlertPayload {
  currentBlock: TimeBlock;
  nextBlock?: TimeBlock;
  minutesRemaining: number;
  type: 'WARNING' | 'SWITCH_NOW';
  message: string;
}
