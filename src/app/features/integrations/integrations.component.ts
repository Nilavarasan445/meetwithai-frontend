import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { IntegrationService, IntegrationStatus, Recording } from '../../core/services/integration.service';
import { MeetingService } from '../../core/services/meeting.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-integrations',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Integrations</h1>
          <p class="subtitle">Connect your meeting platforms to import recordings automatically</p>
        </div>
      </div>

      <!-- Provider cards -->
      <div class="provider-grid">

        <!-- Google Meet -->
        <div class="provider-card" [class.connected]="status()?.google?.connected">
          <div class="provider-header">
            <div class="provider-icon google-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </div>
            <div class="provider-info">
              <div class="provider-name">Google Meet</div>
              <div class="provider-desc">Import recordings from Google Drive</div>
            </div>
            <div class="provider-status">
              <span *ngIf="status()?.google?.connected" class="badge-on">● Connected</span>
              <span *ngIf="!status()?.google?.connected" class="badge-off">○ Not connected</span>
            </div>
          </div>

          <div *ngIf="status()?.google?.connected" class="connected-email">
            <span class="email-icon">✉</span> {{ status()?.google?.email }}
          </div>

          <div class="provider-actions">
            <button *ngIf="!status()?.google?.connected"
                    class="btn-connect google" (click)="connectGoogle()">
              Connect Google Account →
            </button>
            <ng-container *ngIf="status()?.google?.connected">
              <button class="btn-secondary" (click)="toggleGooglePanel()">
                {{ showGooglePanel() ? '▲ Hide Recordings' : '▼ Browse Recordings' }}
              </button>
              <button class="btn-disconnect" (click)="disconnect('google')">Disconnect</button>
            </ng-container>
          </div>

          <!-- Google recordings panel -->
          <div class="recordings-panel" *ngIf="showGooglePanel() && status()?.google?.connected">
            <div class="panel-header">
              <div class="panel-title">Google Meet Recordings</div>
              <button class="btn-refresh" (click)="loadGoogleRecordings()" [disabled]="loadingGoogle()">
                {{ loadingGoogle() ? '⟳ Loading...' : '↻ Refresh' }}
              </button>
            </div>

            <div *ngIf="googleRecordings().length === 0 && !loadingGoogle()" class="empty-panel">
              No recordings found. Make sure Google Meet recordings are enabled and saved to Drive.
            </div>

            <div class="recordings-list">
              <div *ngFor="let rec of googleRecordings()" class="recording-row">
                <div class="rec-left">
                  <div class="rec-icon">▶</div>
                  <div>
                    <div class="rec-name">{{ rec.name }}</div>
                    <div class="rec-meta">{{ formatDate(rec.createdTime) }} · {{ formatSize(rec.size) }}</div>
                  </div>
                </div>
                <div class="rec-right">
                  <input class="rec-title-input" [(ngModel)]="importTitles[rec.id]"
                         [placeholder]="cleanName(rec.name)" />
                  <button class="btn-import" (click)="importGoogle(rec)"
                          [disabled]="importing() === rec.id">
                    {{ importing() === rec.id ? '⟳' : 'Import →' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Microsoft Teams -->
        <div class="provider-card" [class.connected]="status()?.microsoft?.connected">
          <div class="provider-header">
            <div class="provider-icon ms-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <rect x="1" y="1" width="10" height="10" rx="1.5" fill="#F25022"/>
                <rect x="13" y="1" width="10" height="10" rx="1.5" fill="#7FBA00"/>
                <rect x="1" y="13" width="10" height="10" rx="1.5" fill="#00A4EF"/>
                <rect x="13" y="13" width="10" height="10" rx="1.5" fill="#FFB900"/>
              </svg>
            </div>
            <div class="provider-info">
              <div class="provider-name">Microsoft Teams</div>
              <div class="provider-desc">Import recordings from OneDrive</div>
            </div>
            <div class="provider-status">
              <span *ngIf="status()?.microsoft?.connected" class="badge-on">● Connected</span>
              <span *ngIf="!status()?.microsoft?.connected" class="badge-off">○ Not connected</span>
            </div>
          </div>

          <div *ngIf="status()?.microsoft?.connected" class="connected-email">
            <span class="email-icon">✉</span> {{ status()?.microsoft?.email }}
          </div>

          <div class="provider-actions">
            <button *ngIf="!status()?.microsoft?.connected"
                    class="btn-connect ms" (click)="connectMicrosoft()">
              Connect Microsoft Account →
            </button>
            <ng-container *ngIf="status()?.microsoft?.connected">
              <button class="btn-secondary" (click)="toggleMsPanel()">
                {{ showMsPanel() ? '▲ Hide Recordings' : '▼ Browse Recordings' }}
              </button>
              <button class="btn-disconnect" (click)="disconnect('microsoft')">Disconnect</button>
            </ng-container>
          </div>

          <!-- Microsoft recordings panel -->
          <div class="recordings-panel" *ngIf="showMsPanel() && status()?.microsoft?.connected">
            <div class="panel-header">
              <div class="panel-title">Teams Recordings</div>
              <button class="btn-refresh" (click)="loadMsRecordings()" [disabled]="loadingMs()">
                {{ loadingMs() ? '⟳ Loading...' : '↻ Refresh' }}
              </button>
            </div>

            <div *ngIf="msRecordings().length === 0 && !loadingMs()" class="empty-panel">
              No recordings found. Teams recordings appear in OneDrive after meetings end.
            </div>

            <div class="recordings-list">
              <div *ngFor="let rec of msRecordings()" class="recording-row">
                <div class="rec-left">
                  <div class="rec-icon">▶</div>
                  <div>
                    <div class="rec-name">{{ rec.name }}</div>
                    <div class="rec-meta">{{ formatDate(rec.createdTime) }} · {{ formatSize(rec.size) }}</div>
                  </div>
                </div>
                <div class="rec-right">
                  <input class="rec-title-input" [(ngModel)]="importTitles[rec.id]"
                         [placeholder]="cleanName(rec.name)" />
                  <button class="btn-import" (click)="importMs(rec)"
                          [disabled]="importing() === rec.id">
                    {{ importing() === rec.id ? '⟳' : 'Import →' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- Error -->
      <div *ngIf="error()" class="error-msg">{{ error() }}</div>

      <!-- How it works -->
      <div class="how-it-works">
        <h2>How it works</h2>
        <div class="steps-grid">
          <div class="step-box">
            <div class="step-num">01</div>
            <div class="step-title">Connect</div>
            <div class="step-desc">Authorize MeetAI to access your Google or Microsoft account via OAuth.</div>
          </div>
          <div class="step-box">
            <div class="step-num">02</div>
            <div class="step-title">Browse</div>
            <div class="step-desc">Your meeting recordings from Google Drive or OneDrive appear automatically.</div>
          </div>
          <div class="step-box">
            <div class="step-num">03</div>
            <div class="step-title">Import</div>
            <div class="step-desc">Select a recording to import. MeetAI downloads and queues it for processing.</div>
          </div>
          <div class="step-box">
            <div class="step-num">04</div>
            <div class="step-title">Analyze</div>
            <div class="step-desc">Whisper transcribes the audio; GPT extracts summaries, decisions, and tasks.</div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&family=Syne:wght@700;800&display=swap');

    .page { font-family:'IBM Plex Mono',monospace; color:#e8e8f0; }
    .page-header { margin-bottom:36px; }
    h1 { font-family:'Syne',sans-serif; font-size:30px; font-weight:800; color:#e8e8f0; letter-spacing:-0.5px; }
    .subtitle { color:#4a5070; font-size:13px; margin-top:6px; }

    /* Provider grid */
    .provider-grid { display:flex; flex-direction:column; gap:20px; margin-bottom:48px; }

    .provider-card {
      background:#0f1120; border:1px solid #1a1d30;
      border-radius:16px; padding:28px 32px;
      transition:border-color 0.2s;
    }
    .provider-card.connected { border-color:#2a2a50; }

    .provider-header { display:flex; align-items:center; gap:18px; margin-bottom:16px; }
    .provider-icon { width:52px; height:52px; border-radius:12px; background:#0d0f1a; border:1px solid #1a1d30; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .provider-info { flex:1; }
    .provider-name { color:#d0d0e8; font-size:16px; font-weight:700; font-family:'Syne',sans-serif; }
    .provider-desc { color:#3d4160; font-size:12px; margin-top:3px; }
    .provider-status { flex-shrink:0; }

    .badge-on { color:#6ddf8a; font-size:11px; font-weight:700; }
    .badge-off { color:#2e3350; font-size:11px; }

    .connected-email { color:#3d4160; font-size:12px; margin-bottom:16px; display:flex; align-items:center; gap:8px; }
    .email-icon { color:#4a5070; }

    .provider-actions { display:flex; gap:10px; align-items:center; flex-wrap:wrap; }

    /* Buttons */
    .btn-connect { border:none; border-radius:10px; padding:10px 22px; font-family:'IBM Plex Mono',monospace; font-size:12px; font-weight:700; cursor:pointer; letter-spacing:0.5px; transition:opacity 0.2s; }
    .btn-connect:hover { opacity:0.85; }
    .btn-connect.google { background:#EA4335; color:#fff; }
    .btn-connect.ms { background:#5059C9; color:#fff; }
    .btn-secondary { background:#141628; border:1px solid #1e2130; color:#7070a0; border-radius:8px; padding:8px 16px; font-family:'IBM Plex Mono',monospace; font-size:11px; cursor:pointer; transition:all 0.15s; }
    .btn-secondary:hover { border-color:#7c6fff44; color:#a090ff; }
    .btn-disconnect { background:transparent; border:1px solid #2a1828; color:#5a3048; border-radius:8px; padding:8px 14px; font-family:'IBM Plex Mono',monospace; font-size:11px; cursor:pointer; transition:all 0.15s; }
    .btn-disconnect:hover { border-color:#6a2838; color:#ff7090; }
    .btn-refresh { background:#1a1d30; border:1px solid #1e2130; color:#5a607c; border-radius:6px; padding:6px 12px; font-family:'IBM Plex Mono',monospace; font-size:11px; cursor:pointer; }
    .btn-refresh:disabled { opacity:0.5; }
    .btn-import { background:#1e2a1e; border:1px solid #2e4a2e; color:#6ddf8a; border-radius:6px; padding:8px 14px; font-family:'IBM Plex Mono',monospace; font-size:11px; font-weight:700; cursor:pointer; white-space:nowrap; transition:all 0.15s; flex-shrink:0; }
    .btn-import:hover { background:#2a3a2a; }
    .btn-import:disabled { opacity:0.5; cursor:not-allowed; }

    /* Recordings panel */
    .recordings-panel { margin-top:24px; border-top:1px solid #1a1d30; padding-top:24px; }
    .panel-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
    .panel-title { color:#5a607c; font-size:11px; letter-spacing:1px; }
    .empty-panel { color:#2e3350; font-size:12px; padding:28px; text-align:center; border:1px dashed #1a1d30; border-radius:10px; line-height:1.7; }
    .recordings-list { display:flex; flex-direction:column; gap:10px; }
    .recording-row { background:#0d0f1a; border:1px solid #1a1d30; border-radius:10px; padding:14px 18px; display:flex; align-items:center; gap:16px; }
    .rec-left { display:flex; align-items:center; gap:12px; flex:1; min-width:0; }
    .rec-icon { color:#3d4160; font-size:14px; flex-shrink:0; }
    .rec-name { color:#c0c0d8; font-size:13px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .rec-meta { color:#3d4160; font-size:11px; margin-top:3px; }
    .rec-right { display:flex; align-items:center; gap:10px; flex-shrink:0; }
    .rec-title-input { background:#12141f; border:1px solid #1e2130; border-radius:6px; padding:7px 10px; color:#c8c8e0; font-family:'IBM Plex Mono',monospace; font-size:11px; outline:none; width:200px; }
    .rec-title-input:focus { border-color:#7c6fff; }

    /* Error */
    .error-msg { background:#1e0e18; border:1px solid #4a2030; color:#ff7090; border-radius:10px; padding:14px 18px; font-size:12px; margin-bottom:24px; }

    /* How it works */
    .how-it-works { border-top:1px solid #1a1d30; padding-top:40px; }
    h2 { font-family:'Syne',sans-serif; font-size:18px; font-weight:700; color:#6060a0; margin-bottom:24px; }
    .steps-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; }
    .step-box { background:#0d0f1a; border:1px solid #1a1d30; border-radius:12px; padding:24px 20px; }
    .step-num { color:#252840; font-size:28px; font-weight:700; font-family:'Syne',sans-serif; margin-bottom:12px; }
    .step-title { color:#8080b0; font-size:13px; font-weight:700; margin-bottom:8px; }
    .step-desc { color:#383e58; font-size:12px; line-height:1.7; }
  `],
})
export class IntegrationsComponent implements OnInit {
  status = signal<IntegrationStatus | null>(null);
  googleRecordings = signal<Recording[]>([]);
  msRecordings = signal<Recording[]>([]);
  loadingGoogle = signal(false);
  loadingMs = signal(false);
  importing = signal<string | false>(false);
  showGooglePanel = signal(false);
  showMsPanel = signal(false);
  error = signal('');
  importTitles: Record<string, string> = {};

  constructor(
    private integrationService: IntegrationService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.integrationService.getStatus().subscribe({
      next: (s: IntegrationStatus) => this.status.set(s),
    });
  }

  // ── Google ─────────────────────────────────────────────────────────────────

  connectGoogle() {
    this.integrationService.getGoogleAuthUrl().subscribe({
      next: ({ url }: { url: string }) => window.location.href = url,
      error: () => this.error.set('Could not get Google auth URL. Check GOOGLE_CLIENT_ID in your .env file.'),
    });
  }

  toggleGooglePanel() {
    const next = !this.showGooglePanel();
    this.showGooglePanel.set(next);
    if (next && this.googleRecordings().length === 0) {
      this.loadGoogleRecordings();
    }
  }

  loadGoogleRecordings() {
    this.loadingGoogle.set(true);
    this.integrationService.getGoogleRecordings().subscribe({
      next: ({ recordings }: { recordings: Recording[] }) => { this.googleRecordings.set(recordings); this.loadingGoogle.set(false); },
      error: (err: any) => { this.loadingGoogle.set(false); this.error.set(err?.error?.detail || 'Failed to load Google recordings.'); },
    });
  }

  importGoogle(rec: Recording) {
    const title = this.importTitles[rec.id] || this.cleanName(rec.name);
    this.importing.set(rec.id);
    this.error.set('');
    this.integrationService.importGoogleRecording(rec.id, rec.name, title).subscribe({
      next: ({ meeting_id }: { meeting_id: number }) => { this.importing.set(false); this.router.navigate(['/meetings', meeting_id]); },
      error: (err: any) => { this.importing.set(false); this.error.set(err?.error?.detail || 'Import failed.'); },
    });
  }

  // ── Microsoft ──────────────────────────────────────────────────────────────

  connectMicrosoft() {
    this.integrationService.getMicrosoftAuthUrl().subscribe({
      next: ({ url }: { url: string }) => window.location.href = url,
      error: () => this.error.set('Could not get Microsoft auth URL. Check MICROSOFT_CLIENT_ID in your .env file.'),
    });
  }

  toggleMsPanel() {
    const next = !this.showMsPanel();
    this.showMsPanel.set(next);
    if (next && this.msRecordings().length === 0) {
      this.loadMsRecordings();
    }
  }

  loadMsRecordings() {
    this.loadingMs.set(true);
    this.integrationService.getMicrosoftRecordings().subscribe({
      next: ({ recordings }: { recordings: Recording[] }) => { this.msRecordings.set(recordings); this.loadingMs.set(false); },
      error: (err: any) => { this.loadingMs.set(false); this.error.set(err?.error?.detail || 'Failed to load Teams recordings.'); },
    });
  }

  importMs(rec: Recording) {
    const title = this.importTitles[rec.id] || this.cleanName(rec.name);
    this.importing.set(rec.id);
    this.error.set('');
    this.integrationService.importMicrosoftRecording(rec.id, rec.name, title).subscribe({
      next: ({ meeting_id }: { meeting_id: number }) => { this.importing.set(false); this.router.navigate(['/meetings', meeting_id]); },
      error: (err: any) => { this.importing.set(false); this.error.set(err?.error?.detail || 'Import failed.'); },
    });
  }

  // ── Shared ─────────────────────────────────────────────────────────────────

  disconnect(provider: 'google' | 'microsoft') {
    this.integrationService.disconnect(provider).subscribe({
      next: () => {
        this.integrationService.getStatus().subscribe((s: IntegrationStatus) => this.status.set(s));
        if (provider === 'google') { this.googleRecordings.set([]); this.showGooglePanel.set(false); }
        else { this.msRecordings.set([]); this.showMsPanel.set(false); }
      },
    });
  }

  cleanName(name: string) {
    return name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ');
  }

  formatDate(d: string) {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  formatSize(bytes?: number) {
    if (!bytes) return '';
    if (bytes > 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
    return `${(bytes / 1024 / 1024).toFixed(0)} MB`;
  }
}
