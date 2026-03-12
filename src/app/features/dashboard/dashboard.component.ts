import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MeetingService } from '../../core/services/meeting.service';
import { TaskService } from '../../core/services/task.service';
import { IntegrationService, IntegrationStatus } from '../../core/services/integration.service';
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
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&family=Syne:wght@700;800&display=swap');
    .page { font-family:'IBM Plex Mono',monospace; color:#e8e8f0; }
    .page-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:28px; }
    h1 { font-family:'Syne',sans-serif; font-size:32px; font-weight:800; color:#e8e8f0; letter-spacing:-1px; }
    .subtitle { color:#4a5070; font-size:13px; margin-top:4px; }

    .header-actions { display:flex; gap:10px; align-items:center; }
    .btn-primary { background:#7c6fff; color:#fff; border:none; border-radius:8px; padding:10px 20px; font-family:'IBM Plex Mono',monospace; font-size:12px; font-weight:700; cursor:pointer; text-decoration:none; letter-spacing:1px; }
    .btn-primary.sm { font-size:11px; padding:8px 16px; }
    .btn-secondary { background:#141628; border:1px solid #1e2130; color:#7070a0; border-radius:8px; padding:10px 18px; font-family:'IBM Plex Mono',monospace; font-size:12px; font-weight:600; cursor:pointer; text-decoration:none; }
    .btn-secondary.sm { font-size:11px; padding:8px 14px; }

    /* Banner */
    .integration-banner { background:#0e1020; border:1px solid #2a2a50; border-radius:12px; padding:18px 24px; display:flex; align-items:center; justify-content:space-between; gap:16px; margin-bottom:28px; }
    .banner-left { display:flex; align-items:center; gap:14px; }
    .banner-icon { color:#7c6fff; font-size:20px; }
    .banner-title { color:#c0c0d8; font-size:13px; font-weight:600; margin-bottom:3px; }
    .banner-desc { color:#3d4160; font-size:11px; }
    .btn-banner { background:#7c6fff; color:#fff; border:none; border-radius:8px; padding:9px 18px; font-family:'IBM Plex Mono',monospace; font-size:11px; font-weight:700; cursor:pointer; text-decoration:none; white-space:nowrap; }

    /* Strip */
    .integration-strip { background:#0d0f1a; border:1px solid #1a1d30; border-radius:10px; padding:12px 20px; display:flex; align-items:center; gap:14px; margin-bottom:28px; }
    .strip-label { color:#2e3350; font-size:10px; letter-spacing:2px; flex-shrink:0; }
    .strip-badges { display:flex; gap:8px; flex:1; }
    .strip-badge { display:flex; align-items:center; gap:6px; background:#12141f; border:1px solid #1e2130; border-radius:20px; padding:4px 12px; font-size:11px; color:#7070a0; }
    .strip-badge.google { border-color:#2a3060; }
    .strip-badge.ms { border-color:#2a2860; }
    .strip-manage { color:#4a5070; font-size:11px; text-decoration:none; flex-shrink:0; }
    .strip-manage:hover { color:#7c6fff; }

    /* Stats */
    .stats-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:40px; }
    .stat-card { background:#0f1120; border:1px solid #1a1d30; border-radius:14px; padding:22px 24px; }
    .stat-icon { color:#7c6fff; font-size:18px; margin-bottom:10px; opacity:0.7; }
    .stat-value { font-family:'Syne',sans-serif; font-size:34px; font-weight:800; color:#e8e8f0; line-height:1; }
    .stat-label { color:#2e3350; font-size:9px; letter-spacing:2px; margin-top:6px; }

    /* Section */
    .section-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
    h2 { font-family:'Syne',sans-serif; font-size:16px; font-weight:700; color:#8080a0; }
    .link { color:#7c6fff; font-size:12px; text-decoration:none; }
    .link:hover { color:#a090ff; }

    /* Meetings */
    .meetings-list { display:flex; flex-direction:column; gap:10px; }
    .meeting-card { background:#0f1120; border:1px solid #1a1d30; border-radius:12px; padding:20px 24px; cursor:pointer; display:flex; justify-content:space-between; align-items:flex-start; transition:border-color 0.15s, background 0.15s; text-decoration:none; color:inherit; }
    .meeting-card:hover { border-color:#7c6fff44; background:#12142a; }
    .meeting-title { font-family:'Syne',sans-serif; font-size:15px; font-weight:700; color:#d8d8ef; margin-bottom:4px; }
    .meeting-meta { color:#2e3350; font-size:11px; margin-bottom:8px; }
    .meeting-summary { color:#484e68; font-size:12px; max-width:480px; line-height:1.6; }
    .meeting-right { display:flex; flex-direction:column; align-items:flex-end; gap:8px; flex-shrink:0; }
    .meeting-counts { color:#2e3350; font-size:11px; }

    .status-badge { font-size:10px; font-weight:700; padding:3px 10px; border-radius:20px; text-transform:uppercase; letter-spacing:1px; }
    .status-done { background:#1a2a1a; color:#6ddf8a; }
    .status-pending,.status-transcribing,.status-analyzing { background:#1a1a2a; color:#7c6fff; }
    .status-failed { background:#2a1020; color:#ff7090; }

    /* Empty */
    .empty-state { text-align:center; padding:60px; color:#3d4160; }
    .empty-icon { font-size:40px; margin-bottom:12px; color:#2a2a40; }
    .empty-actions { display:flex; gap:10px; justify-content:center; margin-top:16px; }

    /* Loading */
    .loading { display:flex; justify-content:center; padding:60px; }
    .loading-dots { display:flex; gap:6px; align-items:center; }
    .loading-dots span { width:6px; height:6px; border-radius:50%; background:#2e3350; animation:pulse 1.2s ease-in-out infinite; }
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
  }
}
