import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { StandupService, DailyReport } from '../../core/services/standup.service';

type TimelineEvent = DailyReport['timeline'][0];

@Component({
  selector: 'app-daily-report',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h1>Daily Activity Report</h1>
          <p class="subtitle">Your complete developer activity — commits, PRs, tasks & meetings in one place</p>
        </div>
        <div class="header-actions">
          <input type="date" [(ngModel)]="selectedDate" class="date-input" [max]="today" />
          <button class="btn-primary" (click)="generate()" [disabled]="generating()">
            <span *ngIf="generating()" class="btn-spinner"></span>
            {{ generating() ? 'Generating…' : '📊 Generate Report' }}
          </button>
        </div>
      </div>

      <!-- Error -->
      <div class="error-banner" *ngIf="error()">⚠ {{ error() }}</div>

      <!-- Generating -->
      <div class="generating-state" *ngIf="generating()">
        <div class="gen-spinner-wrap"><span class="gen-spinner"></span></div>
        <p>Collecting your activity across all sources…</p>
        <div class="gen-steps">
          <div class="gen-step" [class.done]="genStep >= 1"><span class="step-dot"></span> GitHub commits & PRs</div>
          <div class="gen-step" [class.done]="genStep >= 2"><span class="step-dot"></span> Tasks & meetings</div>
          <div class="gen-step" [class.done]="genStep >= 3"><span class="step-dot"></span> Building timeline</div>
          <div class="gen-step" [class.done]="genStep >= 4"><span class="step-dot"></span> Writing AI summary</div>
        </div>
      </div>

      <!-- Report -->
      <ng-container *ngIf="report() && !generating()">

        <!-- Stat cards -->
        <div class="stats-grid">
          <div class="stat-card commits">
            <div class="stat-icon">⌥</div>
            <div class="stat-value">{{ report()!.total_commits }}</div>
            <div class="stat-label">COMMITS</div>
          </div>
          <div class="stat-card prs">
            <div class="stat-icon">🔀</div>
            <div class="stat-value">{{ report()!.total_prs }}</div>
            <div class="stat-label">PR ACTIONS</div>
          </div>
          <div class="stat-card tasks">
            <div class="stat-icon">✓</div>
            <div class="stat-value">{{ report()!.total_tasks_done }}</div>
            <div class="stat-label">TASKS DONE</div>
          </div>
          <div class="stat-card meetings">
            <div class="stat-icon">◈</div>
            <div class="stat-value">{{ report()!.total_meetings }}</div>
            <div class="stat-label">MEETINGS</div>
            <div class="stat-sub" *ngIf="report()!.total_meeting_minutes > 0">
              {{ report()!.total_meeting_minutes }} min total
            </div>
          </div>
        </div>

        <!-- 2-col layout -->
        <div class="report-grid">

          <!-- Left: AI summary + activity sections -->
          <div class="report-main">

            <!-- AI Summary -->
            <div class="report-card" *ngIf="report()!.ai_summary">
              <div class="card-header">
                <span class="card-title">✨ AI Summary</span>
                <div class="card-date">{{ formatDate(report()!.date) }}</div>
              </div>
              <p class="ai-summary">{{ report()!.ai_summary }}</p>
            </div>

            <!-- Commits -->
            <div class="report-card" *ngIf="report()!.commits.length > 0">
              <div class="card-header">
                <span class="card-title">⌥ Commits</span>
                <span class="card-count">{{ report()!.commits.length }}</span>
              </div>
              <div class="activity-list">
                <div *ngFor="let c of report()!.commits" class="activity-item commit-item">
                  <div class="activity-left">
                    <span class="activity-dot commit-dot"></span>
                    <div>
                      <div class="activity-title">{{ c.message }}</div>
                      <div class="activity-meta">
                        <span class="repo-tag">{{ c.repo }}</span>
                        <span class="sha-tag" *ngIf="c.sha">{{ c.sha }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="activity-time">{{ formatTime(c.time) }}</div>
                </div>
              </div>
            </div>

            <!-- Pull Requests -->
            <div class="report-card" *ngIf="report()!.pull_requests.length > 0">
              <div class="card-header">
                <span class="card-title">🔀 Pull Requests</span>
                <span class="card-count">{{ report()!.pull_requests.length }}</span>
              </div>
              <div class="activity-list">
                <div *ngFor="let pr of report()!.pull_requests" class="activity-item">
                  <div class="activity-left">
                    <span class="pr-action-dot" [class]="'pr-' + pr.action"></span>
                    <div>
                      <div class="activity-title">{{ pr.title }}</div>
                      <div class="activity-meta">
                        <span class="repo-tag">{{ pr.repo }}</span>
                        <span class="pr-badge" [class]="'pr-badge-' + pr.action">{{ pr.action }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="activity-time">{{ formatTime(pr.time) }}</div>
                </div>
              </div>
            </div>

            <!-- Tasks -->
            <div class="report-card" *ngIf="report()!.tasks_completed.length > 0 || report()!.tasks_in_progress.length > 0">
              <div class="card-header">
                <span class="card-title">▦ Tasks</span>
                <span class="card-count">{{ report()!.tasks_completed.length + report()!.tasks_in_progress.length }}</span>
              </div>
              <div class="activity-list">
                <div *ngFor="let t of report()!.tasks_completed" class="activity-item">
                  <div class="activity-left">
                    <span class="activity-dot done-dot"></span>
                    <div>
                      <div class="activity-title">{{ t.title }}</div>
                      <div class="activity-meta"><span class="status-chip done">done</span></div>
                    </div>
                  </div>
                </div>
                <div *ngFor="let t of report()!.tasks_in_progress" class="activity-item">
                  <div class="activity-left">
                    <span class="activity-dot wip-dot"></span>
                    <div>
                      <div class="activity-title">{{ t.title }}</div>
                      <div class="activity-meta"><span class="status-chip wip">in progress</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Meetings -->
            <div class="report-card" *ngIf="report()!.meetings.length > 0">
              <div class="card-header">
                <span class="card-title">◈ Meetings</span>
                <span class="card-count">{{ report()!.meetings.length }}</span>
              </div>
              <div class="activity-list">
                <div *ngFor="let m of report()!.meetings" class="activity-item">
                  <div class="activity-left">
                    <span class="activity-dot meeting-dot"></span>
                    <div>
                      <div class="activity-title">{{ m.title }}</div>
                      <div class="activity-meta">
                        <span class="duration-chip">{{ m.duration_display }}</span>
                        <span *ngIf="m.task_count > 0" class="task-count-chip">{{ m.task_count }} tasks</span>
                      </div>
                    </div>
                  </div>
                  <div class="activity-time">{{ formatTime(m.time) }}</div>
                </div>
              </div>
            </div>

          </div>

          <!-- Right: Timeline + History -->
          <div class="report-side">

            <!-- Timeline -->
            <div class="side-card" *ngIf="report()!.timeline.length > 0">
              <div class="side-card-header">
                <span class="side-card-title">Timeline</span>
                <span class="timeline-date">{{ formatDate(report()!.date) }}</span>
              </div>
              <div class="timeline">
                <div *ngFor="let e of report()!.timeline; let last = last" class="timeline-item">
                  <div class="tl-icon-col">
                    <div class="tl-icon" [class]="'tl-' + e.type">{{ e.icon }}</div>
                    <div class="tl-line" *ngIf="!last"></div>
                  </div>
                  <div class="tl-content">
                    <div class="tl-title">{{ e.title }}</div>
                    <div class="tl-meta">
                      <span *ngIf="e.meta" class="tl-meta-tag">{{ e.meta }}</span>
                      <span class="tl-time">{{ formatTime(e.time) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Report History -->
            <div class="side-card">
              <div class="side-card-header">
                <span class="side-card-title">History</span>
              </div>
              <div *ngIf="reports().length === 0" class="no-history">No previous reports</div>
              <div class="history-list">
                <div
                  *ngFor="let r of reports()"
                  class="history-item"
                  [class.active]="report()?.id === r.id"
                  (click)="loadReport(r)"
                >
                  <div class="history-date">{{ formatDate(r.date) }}</div>
                  <div class="history-chips">
                    <span class="hchip commits">{{ r.total_commits }}c</span>
                    <span class="hchip prs">{{ r.total_prs }}pr</span>
                    <span class="hchip tasks">{{ r.total_tasks_done }}t</span>
                    <span class="hchip meetings">{{ r.total_meetings }}m</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </ng-container>

      <!-- Empty state -->
      <div class="empty-state" *ngIf="!report() && !generating()">
        <div class="empty-icon">📊</div>
        <p>No report for {{ formatDate(selectedDate) }} yet.</p>
        <p class="empty-sub">Generate a report to see your complete developer activity for the day.</p>
        <button class="btn-primary" style="margin:20px auto 0;display:flex" (click)="generate()">
          📊 Generate Today's Report
        </button>
      </div>

    </div>
  `,
  styles: [`
    .page { font-family:var(--sans); }
    .page-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; }
    h1 { font-family:var(--mono); font-size:24px; font-weight:700; color:var(--text); }
    .subtitle { color:var(--muted); font-size:12px; margin-top:4px; }
    .header-actions { display:flex; gap:10px; align-items:center; }
    .date-input { background:var(--surface); border:1px solid var(--border); border-radius:8px; padding:9px 12px; color:var(--text); font-family:var(--sans); font-size:12px; outline:none; }
    .date-input:focus { border-color:var(--accent); }
    .btn-primary { background:var(--accent); color:#fff; border:none; border-radius:9px; padding:10px 18px; font-family:var(--sans); font-size:12px; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:8px; transition:background 0.15s; white-space:nowrap; }
    .btn-primary:hover { background:#ff1f42; }
    .btn-primary:disabled { opacity:0.5; cursor:not-allowed; }
    .btn-spinner { width:12px; height:12px; border:2px solid rgba(255,255,255,0.3); border-top-color:#fff; border-radius:50%; animation:spin 0.7s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }

    .error-banner { background:var(--accent-dim); border:1px solid rgba(255,59,92,0.3); color:var(--accent); border-radius:9px; padding:12px 16px; font-size:12px; margin-bottom:16px; }

    /* Generating */
    .generating-state { background:var(--surface); border:1px solid var(--border); border-radius:14px; padding:52px 24px; text-align:center; margin-bottom:24px; }
    .gen-spinner-wrap { margin-bottom:20px; }
    .gen-spinner { display:inline-block; width:36px; height:36px; border:3px solid var(--border); border-top-color:var(--accent); border-radius:50%; animation:spin 0.8s linear infinite; }
    .generating-state p { color:var(--muted); font-size:13px; margin-bottom:24px; }
    .gen-steps { display:flex; flex-direction:column; gap:10px; max-width:240px; margin:0 auto; text-align:left; }
    .gen-step { display:flex; align-items:center; gap:10px; font-size:12px; color:var(--muted); opacity:0.35; transition:opacity 0.3s; }
    .gen-step.done { opacity:1; color:var(--green); }
    .step-dot { width:6px; height:6px; border-radius:50%; background:currentColor; flex-shrink:0; }

    /* Stats */
    .stats-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:24px; }
    .stat-card { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:18px 20px; }
    .stat-card.commits { border-color:rgba(99,102,241,0.3); }
    .stat-card.prs     { border-color:rgba(236,72,153,0.3); }
    .stat-card.tasks   { border-color:rgba(34,197,94,0.3); }
    .stat-card.meetings{ border-color:rgba(59,130,246,0.3); }
    .stat-icon { font-size:16px; margin-bottom:8px; }
    .stat-value { font-family:var(--mono); font-size:32px; font-weight:700; color:var(--text); line-height:1; }
    .stat-label { color:var(--muted); font-size:9px; letter-spacing:2px; margin-top:6px; font-family:var(--mono); }
    .stat-sub { color:var(--muted); font-size:10px; margin-top:3px; font-family:var(--mono); opacity:0.7; }

    /* Layout */
    .report-grid { display:grid; grid-template-columns:1fr 300px; gap:18px; align-items:start; }
    .report-main { display:flex; flex-direction:column; gap:14px; }

    /* Cards */
    .report-card { background:var(--surface); border:1px solid var(--border); border-radius:12px; overflow:hidden; }
    .card-header { display:flex; align-items:center; justify-content:space-between; padding:13px 16px; border-bottom:1px solid var(--border); }
    .card-title { font-size:12px; font-weight:700; color:var(--text); }
    .card-count { font-size:11px; font-family:var(--mono); background:var(--bg); border:1px solid var(--border); color:var(--muted); border-radius:20px; padding:2px 8px; }
    .card-date { font-size:11px; color:var(--muted); font-family:var(--mono); }

    .ai-summary { padding:16px; font-size:13px; color:var(--text); line-height:1.8; white-space:pre-wrap; }

    /* Activity list */
    .activity-list { padding:8px 0; }
    .activity-item { display:flex; align-items:flex-start; justify-content:space-between; padding:10px 16px; gap:12px; border-bottom:1px solid var(--border); }
    .activity-item:last-child { border-bottom:none; }
    .activity-left { display:flex; align-items:flex-start; gap:10px; flex:1; min-width:0; }
    .activity-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; margin-top:5px; }
    .commit-dot  { background:#6366f1; }
    .done-dot    { background:var(--green); }
    .wip-dot     { background:#f0b429; }
    .meeting-dot { background:#3b82f6; }
    .pr-action-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; margin-top:5px; }
    .pr-opened   { background:#ec4899; }
    .pr-merged   { background:var(--green); }
    .pr-closed   { background:var(--muted); }
    .pr-reopened { background:#f0b429; }

    .activity-title { font-size:12px; color:var(--text); line-height:1.4; margin-bottom:4px; }
    .activity-meta { display:flex; gap:6px; flex-wrap:wrap; align-items:center; }
    .activity-time { font-size:10px; color:var(--muted); font-family:var(--mono); white-space:nowrap; flex-shrink:0; }

    .repo-tag { font-size:10px; background:rgba(99,102,241,0.1); border:1px solid rgba(99,102,241,0.2); color:#818cf8; border-radius:4px; padding:1px 7px; font-family:var(--mono); }
    .sha-tag { font-size:10px; background:var(--bg); border:1px solid var(--border); color:var(--muted); border-radius:4px; padding:1px 6px; font-family:var(--mono); }
    .pr-badge { font-size:10px; border-radius:4px; padding:1px 7px; font-family:var(--mono); font-weight:700; text-transform:uppercase; }
    .pr-badge-opened  { background:rgba(236,72,153,0.1); color:#ec4899; }
    .pr-badge-merged  { background:var(--green-dim); color:var(--green); }
    .pr-badge-closed  { background:var(--border); color:var(--muted); }
    .pr-badge-reopened{ background:rgba(240,180,41,0.1); color:#f0b429; }
    .status-chip { font-size:10px; border-radius:4px; padding:1px 7px; font-family:var(--mono); }
    .status-chip.done { background:var(--green-dim); color:var(--green); }
    .status-chip.wip  { background:rgba(240,180,41,0.1); color:#f0b429; }
    .duration-chip { font-size:10px; background:rgba(59,130,246,0.1); border:1px solid rgba(59,130,246,0.2); color:#60a5fa; border-radius:4px; padding:1px 7px; font-family:var(--mono); }
    .task-count-chip { font-size:10px; background:var(--bg); border:1px solid var(--border); color:var(--muted); border-radius:4px; padding:1px 7px; font-family:var(--mono); }

    /* Side */
    .report-side { display:flex; flex-direction:column; gap:14px; }
    .side-card { background:var(--surface); border:1px solid var(--border); border-radius:12px; overflow:hidden; }
    .side-card-header { display:flex; align-items:center; justify-content:space-between; padding:12px 14px; border-bottom:1px solid var(--border); }
    .side-card-title { font-size:11px; font-weight:700; color:var(--muted); letter-spacing:1px; text-transform:uppercase; font-family:var(--mono); }
    .timeline-date { font-size:10px; color:var(--muted); font-family:var(--mono); }

    /* Timeline */
    .timeline { padding:14px; max-height:600px; overflow-y:auto; }
    .timeline-item { display:flex; gap:10px; }
    .tl-icon-col { display:flex; flex-direction:column; align-items:center; flex-shrink:0; }
    .tl-icon { width:26px; height:26px; border-radius:50%; background:var(--bg); border:1px solid var(--border); display:flex; align-items:center; justify-content:center; font-size:11px; flex-shrink:0; }
    .tl-commit  { background:rgba(99,102,241,0.1);  border-color:rgba(99,102,241,0.3); }
    .tl-pr      { background:rgba(236,72,153,0.1);  border-color:rgba(236,72,153,0.3); }
    .tl-task    { background:var(--green-dim);       border-color:rgba(34,197,94,0.3); }
    .tl-meeting { background:rgba(59,130,246,0.1);   border-color:rgba(59,130,246,0.3); }
    .tl-line { width:2px; flex:1; background:var(--border); margin:3px 0; min-height:16px; }
    .tl-content { padding-bottom:14px; flex:1; min-width:0; }
    .tl-title { font-size:11px; color:var(--text); line-height:1.4; margin-bottom:3px; }
    .tl-meta { display:flex; gap:6px; align-items:center; flex-wrap:wrap; }
    .tl-meta-tag { font-size:10px; color:var(--muted); font-family:var(--mono); background:var(--bg); border:1px solid var(--border); border-radius:3px; padding:1px 5px; }
    .tl-time { font-size:10px; color:var(--muted); font-family:var(--mono); }

    /* History */
    .no-history { padding:20px 16px; font-size:12px; color:var(--muted); text-align:center; opacity:0.6; }
    .history-list { max-height:300px; overflow-y:auto; }
    .history-item { padding:10px 14px; cursor:pointer; border-bottom:1px solid var(--border); transition:background 0.15s; }
    .history-item:last-child { border-bottom:none; }
    .history-item:hover { background:var(--bg); }
    .history-item.active { background:var(--accent-dim); border-left:2px solid var(--accent); }
    .history-date { font-size:11px; font-weight:600; color:var(--text); font-family:var(--mono); margin-bottom:5px; }
    .history-chips { display:flex; gap:5px; flex-wrap:wrap; }
    .hchip { font-size:10px; border-radius:4px; padding:2px 7px; font-family:var(--mono); font-weight:700; }
    .hchip.commits  { background:rgba(99,102,241,0.1); color:#818cf8; }
    .hchip.prs      { background:rgba(236,72,153,0.1); color:#ec4899; }
    .hchip.tasks    { background:var(--green-dim); color:var(--green); }
    .hchip.meetings { background:rgba(59,130,246,0.1); color:#60a5fa; }

    /* Empty */
    .empty-state { text-align:center; padding:80px 0; }
    .empty-icon { font-size:48px; margin-bottom:16px; opacity:0.3; }
    .empty-state p { color:var(--muted); font-size:14px; }
    .empty-sub { font-size:12px; margin-top:6px; opacity:0.7; }
  `],
})
export class DailyReportComponent implements OnInit {
  report = signal<DailyReport | null>(null);
  reports = signal<DailyReport[]>([]);
  generating = signal(false);
  error = signal('');
  selectedDate = new Date().toISOString().split('T')[0];
  today = new Date().toISOString().split('T')[0];
  genStep = 0;

  constructor(private standupService: StandupService) {}

  ngOnInit() {
    this.loadReports();
  }

  loadReports() {
    this.standupService.listReports().subscribe({
      next: ({ results }) => {
        this.reports.set(results);
        const todayReport = results.find(r => r.date === this.selectedDate);
        if (todayReport) this.report.set(todayReport);
      },
    });
  }

  loadReport(r: DailyReport) {
    this.report.set(r);
    this.selectedDate = r.date;
  }

  generate() {
    this.generating.set(true);
    this.error.set('');
    this.report.set(null);
    this.genStep = 0;

    const t1 = setTimeout(() => this.genStep = 1, 500);
    const t2 = setTimeout(() => this.genStep = 2, 1200);
    const t3 = setTimeout(() => this.genStep = 3, 2000);
    const t4 = setTimeout(() => this.genStep = 4, 3000);

    this.standupService.generateReport(this.selectedDate).subscribe({
      next: (r) => {
        [t1, t2, t3, t4].forEach(clearTimeout);
        this.genStep = 4;
        setTimeout(() => {
          this.generating.set(false);
          this.report.set(r);
          const existing = this.reports().find(rep => rep.id === r.id);
          if (existing) {
            this.reports.update(rs => rs.map(rep => rep.id === r.id ? r : rep));
          } else {
            this.reports.update(rs => [r, ...rs]);
          }
        }, 300);
      },
      error: (err) => {
        [t1, t2, t3, t4].forEach(clearTimeout);
        this.generating.set(false);
        this.error.set(err?.error?.detail || 'Failed to generate report. Please try again.');
      },
    });
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  formatTime(iso: string): string {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch { return ''; }
  }
}
