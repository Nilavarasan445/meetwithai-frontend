import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

const API = environment.apiUrl + '/api';

export interface Standup {
  id: number;
  date: string;
  content: string;
  commits_summary: string;
  tasks_summary: string;
  meetings_summary: string;
  created_at: string;
  updated_at: string;
}

export interface DailyReport {
  id: number;
  date: string;
  commits: { time: string; repo: string; message: string; sha: string; url: string }[];
  pull_requests: { time: string; repo: string; title: string; action: string; url: string; number: number }[];
  tasks_completed: { title: string; time: string; status: string }[];
  tasks_in_progress: { title: string; time: string; status: string }[];
  meetings: { title: string; time: string; duration_display: string; task_count: number }[];
  notes_count: number;
  timeline: { time: string; type: string; icon: string; title: string; meta: string }[];
  ai_summary: string;
  total_commits: number;
  total_prs: number;
  total_tasks_done: number;
  total_meetings: number;
  total_meeting_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface GitHubStatus {
  connected: boolean;
  github_username: string | null;
}

@Injectable({ providedIn: 'root' })
export class StandupService {
  constructor(private http: HttpClient) {}

  // ── GitHub ──────────────────────────────────────────────────

  getGitHubAuthUrl(): Observable<{ url: string }> {
    return this.http.get<{ url: string }>(`${API}/auth/github/url/`);
  }

  exchangeGitHubCode(code: string): Observable<GitHubStatus> {
    return this.http.post<GitHubStatus>(`${API}/auth/github/callback/`, { code });
  }

  getGitHubStatus(): Observable<GitHubStatus> {
    return this.http.get<GitHubStatus>(`${API}/auth/github/status/`);
  }

  disconnectGitHub(): Observable<GitHubStatus> {
    return this.http.post<GitHubStatus>(`${API}/auth/github/disconnect/`, {});
  }

  getRecentCommits(days = 1): Observable<{ commits: string[]; connected: boolean }> {
    return this.http.get<{ commits: string[]; connected: boolean }>(
      `${API}/standup/commits/?days=${days}`
    );
  }

  // ── Standup ─────────────────────────────────────────────────

  generate(date?: string): Observable<Standup> {
    return this.http.post<Standup>(`${API}/standup/generate/`, date ? { date } : {});
  }

  list(): Observable<{ results: Standup[] }> {
    return this.http.get<{ results: Standup[] }>(`${API}/standup/`);
  }

  update(id: number, content: string): Observable<Standup> {
    return this.http.patch<Standup>(`${API}/standup/${id}/`, { content });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${API}/standup/${id}/`);
  }

  // ── Daily Report ────────────────────────────────────

  generateReport(date?: string): Observable<DailyReport> {
    return this.http.post<DailyReport>(`${API}/standup/report/generate/`, date ? { date } : {});
  }

  listReports(): Observable<{ results: DailyReport[] }> {
    return this.http.get<{ results: DailyReport[] }>(`${API}/standup/report/`);
  }

  deleteReport(id: number): Observable<void> {
    return this.http.delete<void>(`${API}/standup/report/${id}/`);
  }
}
