export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  plan: 'free' | 'pro' | 'team';
  meetings_this_month: number;
  created_at: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export type MeetingStatus = 'pending' | 'transcribing' | 'analyzing' | 'done' | 'failed';

export interface Meeting {
  id: number;
  title: string;
  status: MeetingStatus;
  duration_display: string | null;
  duration_seconds: number | null;
  created_at: string;
  updated_at: string;
  error_message: string;
  summary?: MeetingSummary;
  transcript?: Transcript;
  decisions?: Decision[];
  tasks?: Task[];
  summary_text?: string;
  task_count?: number;
  decision_count?: number;
  facility?: number;
}

export interface MeetingSummary {
  summary_text: string;
  next_steps: string;
  created_at: string;
}

export interface Transcript {
  text: string;
  word_count: number;
  created_at: string;
}

export interface Decision {
  id: number;
  decision_text: string;
  order: number;
}

export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface Task {
  id: number;
  meeting: number | null;
  meeting_title: string | null;
  title: string;
  description: string;
  assigned_to: string;
  due_date: string | null;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
  facility?: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
