import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MeetingService } from '../../core/services/meeting.service';
import { TaskService } from '../../core/services/task.service';
import { IntegrationService, IntegrationStatus } from '../../core/services/integration.service';
import { StandupService, DailyReport } from '../../core/services/standup.service';
import { Meeting, Task } from '../../core/models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Meeting Intelligence</h1>
          <p class="subtitle">Transform conversations into actionable work</p>
        </div>
        <div class="header-actions">
          <a routerLink="/integrations" class="btn-secondary">⊕ Integrations</a>
          <a routerLink="/meetings/upload" class="btn-primary">+ Upload Meeting</a>
        </div>
      </div>

      <!-- Integration quick-connect banner (shown if nothing connected) -->
      <div class="integration-banner" *ngIf="showIntegrationBanner()">
        <div class="banner-left">
          <span class="banner-icon">⊕</span>
          <div>
            <div class="banner-title">Connect Google Meet or Microsoft Teams</div>
            <div class="banner-desc">Import recordings directly instead of uploading files manually.</div>
          </div>
        </div>
        <a routerLink="/integrations" class="btn-banner">Connect →</a>
      </div>

      <!-- Integration status strip (shown when connected) -->
      <div class="integration-strip" *ngIf="!showIntegrationBanner() && integrationStatus()">
        <div class="strip-label">CONNECTED PLATFORMS</div>
        <div class="strip-badges">
          <div class="strip-badge google" *ngIf="integrationStatus()?.google?.connected">
            <svg width="12" height="12" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Google Meet
          </div>
          <div class="strip-badge ms" *ngIf="integrationStatus()?.microsoft?.connected">
            <svg width="12" height="12" viewBox="0 0 24 24"><rect x="1" y="1" width="10" height="10" rx="1.5" fill="#F25022"/><rect x="13" y="1" width="10" height="10" rx="1.5" fill="#7FBA00"/><rect x="1" y="13" width="10" height="10" rx="1.5" fill="#00A4EF"/><rect x="13" y="13" width="10" height="10" rx="1.5" fill="#FFB900"/></svg>
            Teams
          </div>
        </div>
        <a routerLink="/integrations" class="strip-manage">Manage →</a>
      </div>

      <!-- Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">◈</div>
          <div class="stat-value">{{ meetings().length }}</div>
          <div class="stat-label">TOTAL MEETINGS</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">▦</div>
          <div class="stat-value">{{ totalTasks() }}</div>
          <div class="stat-label">TASKS GENERATED</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">✓</div>
          <div class="stat-value">{{ doneTasks() }}</div>
          <div class="stat-label">COMPLETED</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⟳</div>
          <div class="stat-value">{{ inProgressTasks() }}</div>
          <div class="stat-label">IN PROGRESS</div>
        </div>
      </div>

      <!-- Today's Activity Strip -->
      <div class="today-strip" *ngIf="todayReport()">
        <div class="today-header">
          <span class="today-label">📊 Today's Activity</span>
          <a routerLink="/report" class="link">Full Report →</a>
        </div>
        <div class="today-stats">
          <div class="today-stat">
            <span class="ts-value">{{ todayReport()!.total_commits }}</span>
            <span class="ts-label">commits</span>
          </div>
          <div class="ts-divider"></div>
          <div class="today-stat">
            <span class="ts-value">{{ todayReport()!.total_prs }}</span>
            <span class="ts-label">PRs</span>
          </div>
          <div class="ts-divider"></div>
          <div class="today-stat">
            <span class="ts-value">{{ todayReport()!.total_tasks_done }}</span>
            <span class="ts-label">tasks done</span>
          </div>
          <div class="ts-divider"></div>
          <div class="today-stat">
            <span class="ts-value">{{ todayReport()!.total_meetings }}</span>
            <span class="ts-label">meetings</span>
          </div>
          <div class="today-summary" *ngIf="todayReport()!.ai_summary">
            {{ todayReport()!.ai_summary | slice:0:160 }}…
          </div>
        </div>
      </div>

      <!-- Recent Meetings -->
      <div class="section-header">
        <h2>Recent Meetings</h2>
        <a routerLink="/meetings" class="link">View all →</a>
      </div>

      <div *ngIf="loading()" class="loading">
        <div class="loading-dots">
          <span></span><span></span><span></span>
        </div>
      </div>

      <div class="meetings-list" *ngIf="!loading()">
        <a *ngFor="let m of meetings().slice(0,5)" [routerLink]="['/meetings', m.id]" class="meeting-card">
          <div class="meeting-main">
            <div class="meeting-title">{{ m.title }}</div>
            <div class="meeting-meta">{{ m.created_at | date:'mediumDate' }} · {{ m.duration_display || '—' }}</div>
            <div class="meeting-summary">{{ m.summary_text || 'Processing...' }}</div>
          </div>
          <div class="meeting-right">
            <span class="status-badge" [class]="'status-' + m.status">{{ m.status }}</span>
            <div class="meeting-counts">
              {{ m.task_count }} tasks · {{ m.decision_count }} decisions
            </div>
          </div>
        </a>
        <div *ngIf="meetings().length === 0" class="empty-state">
          <div class="empty-icon">◈</div>
          <p>No meetings yet.</p>
          <div class="empty-actions">
            <a routerLink="/meetings/upload" class="btn-primary sm">Upload Recording</a>
            <a routerLink="/integrations" class="btn-secondary sm">Connect Platform</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { font-family:var(--sans); color:var(--text); }
    .page-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:28px; }
    h1 { font-family:var(--mono); font-size:28px; font-weight:700; color:var(--text); letter-spacing:-1px; }
    .subtitle { color:var(--muted); font-size:13px; margin-top:4px; }

    .header-actions { display:flex; gap:10px; align-items:center; }
    .btn-primary { background:var(--accent); color:#fff; border:none; border-radius:9px; padding:10px 20px; font-family:var(--sans); font-size:12px; font-weight:600; cursor:pointer; text-decoration:none; letter-spacing:0.3px; transition:background 0.15s; }
    .btn-primary:hover { background:#ff1f42; }
    .btn-primary.sm { font-size:11px; padding:8px 16px; }
    .btn-secondary { background:var(--surface); border:1px solid var(--border); color:var(--muted); border-radius:9px; padding:10px 18px; font-family:var(--sans); font-size:12px; font-weight:500; cursor:pointer; text-decoration:none; transition:all 0.15s; }
    .btn-secondary:hover { border-color:var(--accent); color:var(--text); }
    .btn-secondary.sm { font-size:11px; padding:8px 14px; }

    /* Banner */
    .integration-banner { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:18px 24px; display:flex; align-items:center; justify-content:space-between; gap:16px; margin-bottom:28px; }
    .banner-left { display:flex; align-items:center; gap:14px; }
    .banner-icon { color:var(--accent); font-size:20px; }
    .banner-title { color:var(--text); font-size:13px; font-weight:600; margin-bottom:3px; }
    .banner-desc { color:var(--muted); font-size:11px; }
    .btn-banner { background:var(--accent); color:#fff; border:none; border-radius:8px; padding:9px 18px; font-family:var(--sans); font-size:11px; font-weight:600; cursor:pointer; text-decoration:none; white-space:nowrap; }

    /* Strip */
    .integration-strip { background:var(--surface); border:1px solid var(--border); border-radius:10px; padding:12px 20px; display:flex; align-items:center; gap:14px; margin-bottom:28px; }
    .strip-label { color:var(--muted); font-size:10px; letter-spacing:2px; flex-shrink:0; font-family:var(--mono); }
    .strip-badges { display:flex; gap:8px; flex:1; }
    .strip-badge { display:flex; align-items:center; gap:6px; background:var(--bg); border:1px solid var(--border); border-radius:20px; padding:4px 12px; font-size:11px; color:var(--muted); }
    .strip-manage { color:var(--muted); font-size:11px; text-decoration:none; flex-shrink:0; }
    .strip-manage:hover { color:var(--accent); }

    /* Stats */
    .stats-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:40px; }
    .stat-card { background:var(--surface); border:1px solid var(--border); border-radius:14px; padding:22px 24px; }
    .stat-icon { color:var(--accent); font-size:18px; margin-bottom:10px; opacity:0.7; }
    .stat-value { font-family:var(--mono); font-size:34px; font-weight:700; color:var(--text); line-height:1; }
    .stat-label { color:var(--muted); font-size:9px; letter-spacing:2px; margin-top:6px; font-family:var(--mono); }

    /* Section */
    .section-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
    h2 { font-family:var(--mono); font-size:14px; font-weight:700; color:var(--muted); }
    .link { color:var(--accent); font-size:12px; text-decoration:none; }
    .link:hover { opacity:0.8; }

    /* Meetings */
    .meetings-list { display:flex; flex-direction:column; gap:10px; }
    .meeting-card { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:20px 24px; cursor:pointer; display:flex; justify-content:space-between; align-items:flex-start; transition:border-color 0.15s; text-decoration:none; color:inherit; }
    .meeting-card:hover { border-color:rgba(255,59,92,0.4); }
    .meeting-title { font-family:var(--mono); font-size:14px; font-weight:700; color:var(--text); margin-bottom:4px; }
    .meeting-meta { color:var(--muted); font-size:11px; margin-bottom:8px; font-family:var(--mono); }
    .meeting-summary { color:var(--muted); font-size:13px; max-width:480px; line-height:1.6; }
    .meeting-right { display:flex; flex-direction:column; align-items:flex-end; gap:8px; flex-shrink:0; }
    .meeting-counts { color:var(--muted); font-size:11px; font-family:var(--mono); }

    .status-badge { font-size:10px; font-weight:700; padding:3px 10px; border-radius:20px; text-transform:uppercase; letter-spacing:1px; font-family:var(--mono); }
    .status-done { background:var(--green-dim); color:var(--green); }
    .status-pending,.status-transcribing,.status-analyzing { background:var(--accent-dim); color:var(--accent); }
    .status-failed { background:rgba(255,59,92,0.1); color:var(--accent); }

    /* Empty */
    .empty-state { text-align:center; padding:60px; color:var(--muted); }
    .empty-icon { font-size:40px; margin-bottom:12px; opacity:0.3; }
    .empty-actions { display:flex; gap:10px; justify-content:center; margin-top:16px; }

    /* Today strip */
    .today-strip { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:16px 20px; margin-bottom:28px; }
    .today-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; }
    .today-label { font-size:13px; font-weight:600; color:var(--text); }
    .today-stats { display:flex; align-items:center; gap:0; flex-wrap:wrap; }
    .today-stat { display:flex; flex-direction:column; align-items:center; padding:0 20px; }
    .today-stat:first-child { padding-left:0; }
    .ts-value { font-family:var(--mono); font-size:24px; font-weight:700; color:var(--text); line-height:1; }
    .ts-label { font-size:10px; color:var(--muted); margin-top:4px; font-family:var(--mono); letter-spacing:1px; }
    .ts-divider { width:1px; height:36px; background:var(--border); flex-shrink:0; }
    .today-summary { flex-basis:100%; margin-top:14px; padding-top:14px; border-top:1px solid var(--border); font-size:12px; color:var(--muted); line-height:1.6; }

    /* Loading */
    .loading { display:flex; justify-content:center; padding:60px; }
    .loading-dots { display:flex; gap:6px; align-items:center; }
    .loading-dots span { width:6px; height:6px; border-radius:50%; background:var(--border); animation:pulse 1.2s ease-in-out infinite; }
    .loading-dots span:nth-child(2) { animation-delay:0.2s; }
    .loading-dots span:nth-child(3) { animation-delay:0.4s; }
    @keyframes pulse { 0%,100%{opacity:0.3;transform:scale(0.8)} 50%{opacity:1;transform:scale(1)} }
  `],
})
export class DashboardComponent implements OnInit {
  meetings = signal<Meeting[]>([]);
  tasks = signal<Task[]>([]);
  loading = signal(true);
  integrationStatus = signal<IntegrationStatus | null>(null);
  todayReport = signal<DailyReport | null>(null);

  totalTasks = () => this.tasks().length;
  doneTasks = () => this.tasks().filter(t => t.status === 'done').length;
  inProgressTasks = () => this.tasks().filter(t => t.status === 'in_progress').length;
  showIntegrationBanner = () => {
    const s = this.integrationStatus();
    if (!s) return false;
    return !s.google?.connected && !s.microsoft?.connected;
  };

  constructor(
    private meetingService: MeetingService,
    private taskService: TaskService,
    private integrationService: IntegrationService,
    private standupService: StandupService,
  ) {}

  ngOnInit() {
    this.meetingService.getMeetings().subscribe({
      next: (res: any) => { this.meetings.set(res.results); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
    this.taskService.getTasks().subscribe({
      next: (res: any) => this.tasks.set(res.results),
    });
    this.integrationService.getStatus().subscribe({
      next: (s: IntegrationStatus) => this.integrationStatus.set(s),
    });
    // Load today's report if it exists
    const today = new Date().toISOString().split('T')[0];
    this.standupService.listReports().subscribe({
      next: ({ results }) => {
        const todayRep = results.find(r => r.date === today);
        if (todayRep) this.todayReport.set(todayRep);
      },
    });
  }
}
