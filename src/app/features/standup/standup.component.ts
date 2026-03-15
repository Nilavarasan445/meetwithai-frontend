import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { StandupService, Standup, GitHubStatus } from '../../core/services/standup.service';

@Component({
  selector: 'app-standup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h1>Standup Generator</h1>
          <p class="subtitle">AI-generated daily standups from your commits, tasks & meetings</p>
        </div>
        <div class="header-actions">
          <input type="date" [(ngModel)]="selectedDate" class="date-input" [max]="today" />
          <button
            class="btn-primary"
            (click)="generate()"
            [disabled]="generating()"
          >
            <span *ngIf="generating()" class="btn-spinner"></span>
            {{ generating() ? 'Generating…' : '⚡ Generate Standup' }}
          </button>
        </div>
      </div>

      <!-- GitHub Connect Banner -->
      <div class="github-banner" *ngIf="!githubStatus()?.connected">
        <div class="banner-left">
          <svg class="gh-icon" viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
          </svg>
          <div>
            <div class="banner-title">Connect GitHub for better standups</div>
            <div class="banner-desc">Pull real commit messages and PR activity into your standup automatically.</div>
          </div>
        </div>
        <button class="btn-github" (click)="connectGitHub()" [disabled]="connectingGitHub()">
          {{ connectingGitHub() ? 'Redirecting…' : 'Connect GitHub' }}
        </button>
      </div>

      <!-- GitHub Connected Strip -->
      <div class="github-strip" *ngIf="githubStatus()?.connected">
        <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" style="color:var(--green)">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
        </svg>
        <span class="strip-user">{{ githubStatus()?.github_username }}</span>
        <span class="strip-label">connected</span>
        <div class="strip-commits" *ngIf="recentCommits().length > 0">
          · {{ recentCommits().length }} commit{{ recentCommits().length !== 1 ? 's' : '' }} today
        </div>
        <button class="strip-disconnect" (click)="disconnectGitHub()">Disconnect</button>
      </div>

      <!-- Main content: 2-col layout -->
      <div class="content-grid">

        <!-- Left: Today's standup / generator -->
        <div class="main-col">

          <!-- Error -->
          <div class="error-banner" *ngIf="generateError()">
            ⚠ {{ generateError() }}
          </div>

          <!-- Active standup editor -->
          <div class="standup-editor" *ngIf="activeStandup()">
            <div class="editor-header">
              <div>
                <div class="editor-date">{{ formatDate(activeStandup()!.date) }}</div>
                <div class="editor-label">Daily Standup</div>
              </div>
              <div class="editor-actions">
                <button class="btn-icon" (click)="copyStandup()" title="Copy to clipboard">
                  {{ copied() ? '✓' : '⎘' }}
                </button>
                <button class="btn-icon danger" (click)="deleteStandup(activeStandup()!.id)" title="Delete">🗑</button>
              </div>
            </div>

            <textarea
              class="standup-textarea"
              [(ngModel)]="editContent"
              (ngModelChange)="onEditChange()"
              rows="14"
            ></textarea>

            <div class="editor-footer">
              <span class="save-hint" [class.saving]="saving()">
                {{ saving() ? 'Saving…' : 'Auto-saved' }}
              </span>
              <button class="btn-regenerate" (click)="generate()" [disabled]="generating()">
                ↻ Regenerate
              </button>
            </div>
          </div>

          <!-- Empty state: no standup yet -->
          <div class="empty-editor" *ngIf="!activeStandup() && !generating()">
            <div class="empty-icon">⚡</div>
            <p>No standup for {{ formatDate(selectedDate) }} yet.</p>
            <p class="empty-sub">Click "Generate Standup" to create one using your recent activity.</p>
          </div>

          <!-- Generating skeleton -->
          <div class="generating-state" *ngIf="generating()">
            <div class="gen-icon">
              <span class="gen-spinner"></span>
            </div>
            <p>Gathering your commits, tasks and meetings…</p>
            <div class="gen-steps">
              <div class="gen-step" [class.done]="genStep >= 1">
                <span class="step-dot"></span> Fetching GitHub activity
              </div>
              <div class="gen-step" [class.done]="genStep >= 2">
                <span class="step-dot"></span> Loading tasks & meetings
              </div>
              <div class="gen-step" [class.done]="genStep >= 3">
                <span class="step-dot"></span> Writing standup with AI
              </div>
            </div>
          </div>

        </div>

        <!-- Right: Activity preview + history -->
        <div class="side-col">

          <!-- Recent Commits -->
          <div class="side-card" *ngIf="githubStatus()?.connected">
            <div class="side-card-header">
              <span class="side-card-title">Recent Commits</span>
              <button class="refresh-btn" (click)="loadCommits()" [disabled]="loadingCommits()">
                {{ loadingCommits() ? '…' : '↻' }}
              </button>
            </div>
            <div *ngIf="recentCommits().length === 0 && !loadingCommits()" class="no-activity">
              No commits in the last 24h
            </div>
            <div class="commit-list">
              <div *ngFor="let c of recentCommits()" class="commit-item">
                <span class="commit-dot">●</span>
                <span class="commit-msg">{{ c }}</span>
              </div>
            </div>
          </div>

          <!-- Standup History -->
          <div class="side-card">
            <div class="side-card-header">
              <span class="side-card-title">History</span>
            </div>
            <div *ngIf="standups().length === 0" class="no-activity">No previous standups</div>
            <div class="history-list">
              <div
                *ngFor="let s of standups()"
                class="history-item"
                [class.active]="activeStandup()?.id === s.id"
                (click)="loadStandup(s)"
              >
                <div class="history-date">{{ formatDate(s.date) }}</div>
                <div class="history-preview">{{ s.content | slice:0:80 }}…</div>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  `,
  styles: [`
    .page { font-family:var(--sans); }

    /* Header */
    .page-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; }
    h1 { font-family:var(--mono); font-size:26px; font-weight:700; color:var(--text); }
    .subtitle { color:var(--muted); font-size:12px; margin-top:4px; }
    .header-actions { display:flex; gap:10px; align-items:center; }

    .date-input { background:var(--surface); border:1px solid var(--border); border-radius:8px; padding:9px 12px; color:var(--text); font-family:var(--sans); font-size:12px; outline:none; cursor:pointer; }
    .date-input:focus { border-color:var(--accent); }

    .btn-primary { background:var(--accent); color:#fff; border:none; border-radius:9px; padding:10px 18px; font-family:var(--sans); font-size:12px; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:8px; transition:all 0.15s; white-space:nowrap; }
    .btn-primary:hover { background:#ff1f42; }
    .btn-primary:disabled { opacity:0.5; cursor:not-allowed; }
    .btn-spinner { width:12px; height:12px; border:2px solid rgba(255,255,255,0.3); border-top-color:#fff; border-radius:50%; animation:spin 0.7s linear infinite; flex-shrink:0; }
    @keyframes spin { to { transform:rotate(360deg); } }

    /* GitHub banner */
    .github-banner {
      display:flex; align-items:center; justify-content:space-between; gap:16px;
      background:var(--surface); border:1px solid var(--border);
      border-radius:12px; padding:16px 20px; margin-bottom:20px;
    }
    .banner-left { display:flex; align-items:center; gap:14px; }
    .gh-icon { color:var(--text); flex-shrink:0; }
    .banner-title { font-size:13px; font-weight:600; color:var(--text); margin-bottom:3px; }
    .banner-desc { font-size:11px; color:var(--muted); }
    .btn-github { background:#24292f; color:#fff; border:none; border-radius:9px; padding:10px 18px; font-family:var(--sans); font-size:12px; font-weight:600; cursor:pointer; transition:opacity 0.15s; white-space:nowrap; flex-shrink:0; }
    .btn-github:hover { opacity:0.85; }
    .btn-github:disabled { opacity:0.5; cursor:not-allowed; }

    /* GitHub strip */
    .github-strip {
      display:flex; align-items:center; gap:10px;
      background:rgba(34,197,94,0.07); border:1px solid rgba(34,197,94,0.2);
      border-radius:9px; padding:9px 14px; margin-bottom:20px;
      font-size:12px;
    }
    .strip-user { color:var(--green); font-weight:600; font-family:var(--mono); }
    .strip-label { color:var(--muted); }
    .strip-commits { color:var(--muted); }
    .strip-disconnect { margin-left:auto; background:transparent; border:1px solid rgba(34,197,94,0.25); color:var(--muted); border-radius:6px; padding:3px 10px; font-size:11px; cursor:pointer; font-family:var(--sans); transition:all 0.15s; }
    .strip-disconnect:hover { border-color:var(--accent); color:var(--accent); }

    /* Error */
    .error-banner { background:var(--accent-dim); border:1px solid rgba(255,59,92,0.3); color:var(--accent); border-radius:9px; padding:12px 16px; font-size:12px; margin-bottom:16px; }

    /* 2-col layout */
    .content-grid { display:grid; grid-template-columns:1fr 320px; gap:20px; align-items:start; }

    /* Editor */
    .standup-editor { background:var(--surface); border:1px solid var(--border); border-radius:14px; overflow:hidden; }
    .editor-header { display:flex; align-items:flex-start; justify-content:space-between; padding:18px 20px 14px; border-bottom:1px solid var(--border); }
    .editor-date { font-size:11px; color:var(--muted); font-family:var(--mono); margin-bottom:3px; }
    .editor-label { font-size:15px; font-weight:600; color:var(--text); }
    .editor-actions { display:flex; gap:8px; }

    .btn-icon { background:var(--bg); border:1px solid var(--border); border-radius:7px; width:32px; height:32px; display:flex; align-items:center; justify-content:center; font-size:14px; cursor:pointer; color:var(--muted); transition:all 0.15s; }
    .btn-icon:hover { border-color:var(--accent); color:var(--text); }
    .btn-icon.danger:hover { border-color:var(--accent); color:var(--accent); }

    .standup-textarea { width:100%; border:none; outline:none; background:transparent; resize:none; padding:20px; color:var(--text); font-family:var(--sans); font-size:14px; line-height:1.8; display:block; }

    .editor-footer { display:flex; align-items:center; justify-content:space-between; padding:12px 20px; border-top:1px solid var(--border); }
    .save-hint { font-size:11px; color:var(--muted); font-family:var(--mono); }
    .save-hint.saving { color:var(--accent); }
    .btn-regenerate { background:transparent; border:1px solid var(--border); color:var(--muted); border-radius:7px; padding:6px 14px; font-family:var(--sans); font-size:11px; font-weight:600; cursor:pointer; transition:all 0.15s; }
    .btn-regenerate:hover { border-color:var(--accent); color:var(--accent); }
    .btn-regenerate:disabled { opacity:0.4; cursor:not-allowed; }

    /* Empty state */
    .empty-editor { background:var(--surface); border:1px dashed var(--border); border-radius:14px; padding:60px 20px; text-align:center; }
    .empty-icon { font-size:40px; margin-bottom:14px; opacity:0.3; }
    .empty-editor p { color:var(--muted); font-size:14px; }
    .empty-sub { font-size:12px; margin-top:6px; opacity:0.7; }

    /* Generating skeleton */
    .generating-state { background:var(--surface); border:1px solid var(--border); border-radius:14px; padding:48px 24px; text-align:center; }
    .gen-icon { margin-bottom:20px; }
    .gen-spinner { display:inline-block; width:36px; height:36px; border:3px solid var(--border); border-top-color:var(--accent); border-radius:50%; animation:spin 0.8s linear infinite; }
    .generating-state p { color:var(--muted); font-size:13px; margin-bottom:24px; }
    .gen-steps { display:flex; flex-direction:column; gap:10px; max-width:240px; margin:0 auto; text-align:left; }
    .gen-step { display:flex; align-items:center; gap:10px; font-size:12px; color:var(--muted); opacity:0.4; transition:opacity 0.3s; }
    .gen-step.done { opacity:1; color:var(--green); }
    .step-dot { width:6px; height:6px; border-radius:50%; background:currentColor; flex-shrink:0; }

    /* Side column */
    .side-col { display:flex; flex-direction:column; gap:14px; }

    .side-card { background:var(--surface); border:1px solid var(--border); border-radius:12px; overflow:hidden; }
    .side-card-header { display:flex; align-items:center; justify-content:space-between; padding:13px 16px; border-bottom:1px solid var(--border); }
    .side-card-title { font-size:11px; font-weight:700; color:var(--muted); letter-spacing:1px; text-transform:uppercase; font-family:var(--mono); }
    .refresh-btn { background:transparent; border:none; color:var(--muted); font-size:14px; cursor:pointer; padding:2px 6px; border-radius:4px; transition:color 0.15s; }
    .refresh-btn:hover { color:var(--accent); }

    .no-activity { padding:20px 16px; font-size:12px; color:var(--muted); text-align:center; opacity:0.6; }

    /* Commits */
    .commit-list { padding:8px 0; max-height:200px; overflow-y:auto; }
    .commit-item { display:flex; gap:8px; align-items:flex-start; padding:6px 16px; }
    .commit-dot { color:var(--accent); font-size:8px; margin-top:4px; flex-shrink:0; }
    .commit-msg { font-size:11px; color:var(--muted); line-height:1.4; font-family:var(--mono); }

    /* History */
    .history-list { max-height:400px; overflow-y:auto; }
    .history-item { padding:12px 16px; cursor:pointer; border-bottom:1px solid var(--border); transition:background 0.15s; }
    .history-item:last-child { border-bottom:none; }
    .history-item:hover { background:var(--bg); }
    .history-item.active { background:var(--accent-dim); border-left:2px solid var(--accent); }
    .history-date { font-size:11px; font-weight:600; color:var(--text); font-family:var(--mono); margin-bottom:4px; }
    .history-preview { font-size:11px; color:var(--muted); line-height:1.4; }
  `],
})
export class StandupComponent implements OnInit {
  githubStatus = signal<GitHubStatus | null>(null);
  recentCommits = signal<string[]>([]);
  standups = signal<Standup[]>([]);
  activeStandup = signal<Standup | null>(null);
  generating = signal(false);
  connectingGitHub = signal(false);
  loadingCommits = signal(false);
  saving = signal(false);
  copied = signal(false);
  generateError = signal('');
  editContent = '';
  selectedDate = new Date().toISOString().split('T')[0];
  today = new Date().toISOString().split('T')[0];
  genStep = 0;
  private saveTimer: any;

  constructor(
    private standupService: StandupService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.loadGitHubStatus();
    this.loadStandups();

    // Handle redirect back from GitHub OAuth
    this.route.queryParamMap.subscribe(params => {
      if (params.get('github') === 'connected') {
        this.loadGitHubStatus();
      }
    });
  }

  // ── GitHub ──────────────────────────────────────────────────

  loadGitHubStatus() {
    this.standupService.getGitHubStatus().subscribe({
      next: (s) => {
        this.githubStatus.set(s);
        if (s.connected) this.loadCommits();
      },
    });
  }

  connectGitHub() {
    this.connectingGitHub.set(true);
    this.standupService.getGitHubAuthUrl().subscribe({
      next: ({ url }) => { window.location.href = url; },
      error: () => this.connectingGitHub.set(false),
    });
  }

  disconnectGitHub() {
    this.standupService.disconnectGitHub().subscribe({
      next: (s) => { this.githubStatus.set(s); this.recentCommits.set([]); },
    });
  }

  loadCommits() {
    this.loadingCommits.set(true);
    this.standupService.getRecentCommits(1).subscribe({
      next: ({ commits }) => { this.recentCommits.set(commits); this.loadingCommits.set(false); },
      error: () => this.loadingCommits.set(false),
    });
  }

  // ── Standup ─────────────────────────────────────────────────

  loadStandups() {
    this.standupService.list().subscribe({
      next: ({ results }) => {
        this.standups.set(results);
        // Auto-load today's standup if it exists
        const todayStandup = results.find(s => s.date === this.selectedDate);
        if (todayStandup) this.loadStandup(todayStandup);
      },
    });
  }

  loadStandup(s: Standup) {
    this.activeStandup.set(s);
    this.editContent = s.content;
    this.selectedDate = s.date;
  }

  generate() {
    this.generating.set(true);
    this.generateError.set('');
    this.activeStandup.set(null);
    this.genStep = 0;

    // Animate steps
    const stepTimer1 = setTimeout(() => this.genStep = 1, 600);
    const stepTimer2 = setTimeout(() => this.genStep = 2, 1400);
    const stepTimer3 = setTimeout(() => this.genStep = 3, 2400);

    this.standupService.generate(this.selectedDate).subscribe({
      next: (standup) => {
        clearTimeout(stepTimer1); clearTimeout(stepTimer2); clearTimeout(stepTimer3);
        this.genStep = 3;
        setTimeout(() => {
          this.generating.set(false);
          this.activeStandup.set(standup);
          this.editContent = standup.content;
          // Update history list
          const existing = this.standups().find(s => s.id === standup.id);
          if (existing) {
            this.standups.update(ss => ss.map(s => s.id === standup.id ? standup : s));
          } else {
            this.standups.update(ss => [standup, ...ss]);
          }
          if (this.githubStatus()?.connected) this.loadCommits();
        }, 400);
      },
      error: (err) => {
        clearTimeout(stepTimer1); clearTimeout(stepTimer2); clearTimeout(stepTimer3);
        this.generating.set(false);
        this.generateError.set(err?.error?.detail || 'Failed to generate standup. Please try again.');
      },
    });
  }

  onEditChange() {
    clearTimeout(this.saveTimer);
    this.saving.set(true);
    this.saveTimer = setTimeout(() => this.saveEdit(), 800);
  }

  saveEdit() {
    const s = this.activeStandup();
    if (!s) return;
    this.standupService.update(s.id, this.editContent).subscribe({
      next: (updated) => {
        this.activeStandup.set(updated);
        this.standups.update(ss => ss.map(st => st.id === updated.id ? updated : st));
        this.saving.set(false);
      },
      error: () => this.saving.set(false),
    });
  }

  deleteStandup(id: number) {
    this.standupService.delete(id).subscribe({
      next: () => {
        this.standups.update(ss => ss.filter(s => s.id !== id));
        this.activeStandup.set(null);
        this.editContent = '';
      },
    });
  }

  copyStandup() {
    const s = this.activeStandup();
    if (!s) return;
    navigator.clipboard.writeText(this.editContent).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
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
}
