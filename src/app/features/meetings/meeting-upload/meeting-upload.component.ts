import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MeetingService } from '../../../core/services/meeting.service';
import { IntegrationService, IntegrationStatus, Recording } from '../../../core/services/integration.service';

type Tab = 'upload' | 'google' | 'microsoft';

@Component({
  selector: 'app-meeting-upload',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Add Meeting</h1>
          <p class="subtitle">Upload a recording or import directly from Google Meet / Teams</p>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button class="tab" [class.active]="activeTab() === 'upload'" (click)="activeTab.set('upload')">
          <span class="tab-icon">↑</span> Upload File
        </button>
        <button class="tab" [class.active]="activeTab() === 'google'" (click)="switchTab('google')">
          <svg width="13" height="13" viewBox="0 0 24 24" style="flex-shrink:0">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google Meet
          <span *ngIf="status()?.google?.connected" class="connected-dot">●</span>
        </button>
        <button class="tab" [class.active]="activeTab() === 'microsoft'" (click)="switchTab('microsoft')">
          <svg width="13" height="13" viewBox="0 0 24 24" style="flex-shrink:0">
            <rect x="1" y="1" width="10" height="10" rx="1.5" fill="#F25022"/>
            <rect x="13" y="1" width="10" height="10" rx="1.5" fill="#7FBA00"/>
            <rect x="1" y="13" width="10" height="10" rx="1.5" fill="#00A4EF"/>
            <rect x="13" y="13" width="10" height="10" rx="1.5" fill="#FFB900"/>
          </svg>
          Teams
          <span *ngIf="status()?.microsoft?.connected" class="connected-dot">●</span>
        </button>
      </div>

      <!-- ── Upload tab ── -->
      <div class="card" *ngIf="activeTab() === 'upload'">
        <div class="dropzone"
             [class.dragover]="dragging()"
             [class.has-file]="!!file()"
             (dragover)="onDragOver($event)"
             (dragleave)="dragging.set(false)"
             (drop)="onDrop($event)"
             (click)="fileInput.click()">
          <input #fileInput type="file" accept=".mp3,.mp4,.wav,.m4a" style="display:none"
                 (change)="onFileChange($event)" />
          <div class="drop-icon" [class.success]="!!file()">{{ file() ? '✓' : '⬆' }}</div>
          <div class="drop-text" [class.success]="!!file()">
            {{ file() ? file()!.name : 'Drop your recording here' }}
          </div>
          <div class="drop-sub">{{ file() ? formatSize(file()!.size) : 'mp3, mp4, wav, m4a · max 500MB' }}</div>
        </div>

        <div class="field">
          <label>MEETING TITLE</label>
          <input type="text" [(ngModel)]="title" placeholder="e.g. Q2 Planning Kickoff" />
        </div>

        <div class="progress-steps" *ngIf="uploading()">
          <div class="step" *ngFor="let s of steps; let i = index"
               [class.active]="i === currentStep()" [class.done]="i < currentStep()">
            <span class="step-icon">{{ i < currentStep() ? '✓' : i === currentStep() ? '⟳' : '○' }}</span>
            {{ s }}
          </div>
        </div>

        <div *ngIf="error()" class="error-msg">{{ error() }}</div>

        <button class="btn-primary" (click)="upload()" [disabled]="uploading() || (!file() && !title)">
          {{ uploading() ? 'Processing...' : 'ANALYZE MEETING →' }}
        </button>
      </div>

      <!-- ── Google Meet tab ── -->
      <div class="card" *ngIf="activeTab() === 'google'">
        <!-- Not connected -->
        <div *ngIf="!status()?.google?.connected" class="connect-prompt">
          <div class="prompt-icon google-icon">
            <svg width="36" height="36" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          </div>
          <h3>Connect Google Meet</h3>
          <p>Access your Google Meet recordings saved in Google Drive and import them directly into MeetAI.</p>
          <div class="prompt-actions">
            <button class="btn-connect google" (click)="connectGoogle()">Connect Google Account →</button>
            <a routerLink="/integrations" class="btn-link">Manage integrations</a>
          </div>
        </div>

        <!-- Connected -->
        <div *ngIf="status()?.google?.connected">
          <div class="connected-header">
            <div class="connected-info">
              <span class="dot-green">●</span>
              <span class="connected-label">Google Meet connected</span>
              <span class="connected-email">{{ status()?.google?.email }}</span>
            </div>
            <button class="btn-secondary" (click)="loadGoogleRecordings()" [disabled]="loadingRecordings()">
              {{ loadingRecordings() ? '⟳' : '↻' }} Refresh
            </button>
          </div>

          <div *ngIf="recordings().length === 0 && !loadingRecordings()" class="empty-panel">
            No Google Meet recordings found in your Drive.<br>
            <small>Recordings appear here after Google Meet sessions end with recording enabled.</small>
          </div>

          <div class="recordings-list">
            <div *ngFor="let rec of recordings()" class="recording-row">
              <div class="rec-left">
                <div class="rec-icon">▶</div>
                <div class="rec-info">
                  <div class="rec-name">{{ rec.name }}</div>
                  <div class="rec-meta">{{ formatDate(rec.createdTime) }} · {{ formatSize(rec.size) }}</div>
                </div>
              </div>
              <div class="rec-actions">
                <input class="rec-title-input" [(ngModel)]="importTitles[rec.id]"
                       [placeholder]="cleanName(rec.name)" />
                <button class="btn-import" (click)="importGoogle(rec)"
                        [disabled]="importing() === rec.id">
                  {{ importing() === rec.id ? '⟳ Importing...' : 'Import →' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div *ngIf="importError()" class="error-msg">{{ importError() }}</div>
      </div>

      <!-- ── Microsoft Teams tab ── -->
      <div class="card" *ngIf="activeTab() === 'microsoft'">
        <!-- Not connected -->
        <div *ngIf="!status()?.microsoft?.connected" class="connect-prompt">
          <div class="prompt-icon ms-icon">
            <svg width="36" height="36" viewBox="0 0 24 24">
              <rect x="1" y="1" width="10" height="10" rx="1.5" fill="#F25022"/>
              <rect x="13" y="1" width="10" height="10" rx="1.5" fill="#7FBA00"/>
              <rect x="1" y="13" width="10" height="10" rx="1.5" fill="#00A4EF"/>
              <rect x="13" y="13" width="10" height="10" rx="1.5" fill="#FFB900"/>
            </svg>
          </div>
          <h3>Connect Microsoft Teams</h3>
          <p>Access Teams meeting recordings stored in your OneDrive or SharePoint and import them directly.</p>
          <div class="prompt-actions">
            <button class="btn-connect ms" (click)="connectMicrosoft()">Connect Microsoft Account →</button>
            <a routerLink="/integrations" class="btn-link">Manage integrations</a>
          </div>
        </div>

        <!-- Connected -->
        <div *ngIf="status()?.microsoft?.connected">
          <div class="connected-header">
            <div class="connected-info">
              <span class="dot-green">●</span>
              <span class="connected-label">Teams connected</span>
              <span class="connected-email">{{ status()?.microsoft?.email }}</span>
            </div>
            <button class="btn-secondary" (click)="loadMicrosoftRecordings()" [disabled]="loadingRecordings()">
              {{ loadingRecordings() ? '⟳' : '↻' }} Refresh
            </button>
          </div>

          <div *ngIf="recordings().length === 0 && !loadingRecordings()" class="empty-panel">
            No Teams recordings found in your OneDrive.<br>
            <small>Teams recordings appear after meetings end with recording enabled.</small>
          </div>

          <div class="recordings-list">
            <div *ngFor="let rec of recordings()" class="recording-row">
              <div class="rec-left">
                <div class="rec-icon">▶</div>
                <div class="rec-info">
                  <div class="rec-name">{{ rec.name }}</div>
                  <div class="rec-meta">{{ formatDate(rec.createdTime) }} · {{ formatSize(rec.size) }}</div>
                </div>
              </div>
              <div class="rec-actions">
                <input class="rec-title-input" [(ngModel)]="importTitles[rec.id]"
                       [placeholder]="cleanName(rec.name)" />
                <button class="btn-import" (click)="importMicrosoft(rec)"
                        [disabled]="importing() === rec.id">
                  {{ importing() === rec.id ? '⟳ Importing...' : 'Import →' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div *ngIf="importError()" class="error-msg">{{ importError() }}</div>
      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&family=Syne:wght@700;800&display=swap');

    .page { font-family:'IBM Plex Mono',monospace; max-width:720px; }
    .page-header { margin-bottom:28px; }
    h1 { font-family:'Syne',sans-serif; font-size:28px; font-weight:800; color:#e8e8f0; }
    .subtitle { color:#4a5070; font-size:12px; margin-top:6px; }

    /* Tabs */
    .tabs { display:flex; gap:8px; margin-bottom:24px; flex-wrap:wrap; }
    .tab { background:#0f1120; border:1px solid #1a1d30; border-radius:10px; padding:10px 18px; font-family:'IBM Plex Mono',monospace; font-size:12px; color:#383e58; cursor:pointer; display:flex; align-items:center; gap:8px; transition:all 0.2s; }
    .tab:hover { border-color:#2e3350; color:#7070a0; }
    .tab.active { border-color:#7c6fff66; color:#c0c0d8; background:#13152a; }
    .tab-icon { font-size:13px; }
    .connected-dot { color:#6ddf8a; font-size:10px; }

    /* Card */
    .card { background:#0f1120; border:1px solid #1a1d30; border-radius:16px; padding:32px; }

    /* Drop zone */
    .dropzone { border:2px dashed #1a1d30; border-radius:12px; padding:52px 32px; text-align:center; cursor:pointer; background:#0a0c14; transition:all 0.2s; margin-bottom:26px; }
    .dropzone.dragover { border-color:#7c6fff; background:#100e20; }
    .dropzone.has-file { border-color:#1e4a2a; }
    .drop-icon { font-size:32px; margin-bottom:12px; color:#2e3350; transition:color 0.2s; }
    .drop-icon.success { color:#6ddf8a; }
    .drop-text { font-size:14px; font-weight:600; color:#3d4160; }
    .drop-text.success { color:#6ddf8a; }
    .drop-sub { font-size:11px; color:#252840; margin-top:6px; }

    .field { margin-bottom:24px; }
    label { display:block; color:#3d4160; font-size:10px; letter-spacing:2px; margin-bottom:8px; }
    input[type=text] { width:100%; background:#0a0c14; border:1px solid #1a1d30; border-radius:8px; padding:12px 14px; color:#c8c8e0; font-family:'IBM Plex Mono',monospace; font-size:13px; outline:none; box-sizing:border-box; }
    input[type=text]:focus { border-color:#7c6fff66; }

    /* Progress */
    .progress-steps { background:#0a0c14; border:1px solid #1a1d30; border-radius:10px; padding:20px 24px; margin-bottom:20px; }
    .step { display:flex; align-items:center; gap:12px; margin-bottom:10px; font-size:12px; color:#252840; }
    .step.active { color:#b0b0d0; }
    .step.done { color:#6ddf8a; }
    .step-icon { width:16px; font-size:13px; }

    /* Connect prompt */
    .connect-prompt { text-align:center; padding:20px 0; }
    .prompt-icon { width:72px; height:72px; border-radius:16px; background:#0a0c14; border:1px solid #1a1d30; display:flex; align-items:center; justify-content:center; margin:0 auto 20px; }
    h3 { color:#d0d0e8; font-size:18px; margin-bottom:10px; font-family:'Syne',sans-serif; }
    .connect-prompt p { color:#3d4160; font-size:13px; line-height:1.7; margin-bottom:24px; max-width:400px; margin-left:auto; margin-right:auto; }
    .prompt-actions { display:flex; align-items:center; gap:14px; justify-content:center; }
    .btn-link { color:#4a5070; font-size:12px; text-decoration:none; }
    .btn-link:hover { color:#7c6fff; }

    /* Connected */
    .connected-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; flex-wrap:wrap; gap:12px; }
    .connected-info { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
    .dot-green { color:#6ddf8a; font-size:10px; }
    .connected-label { color:#c0c0d8; font-size:12px; font-weight:600; }
    .connected-email { color:#3d4160; font-size:11px; }

    /* Recordings */
    .recordings-list { display:flex; flex-direction:column; gap:10px; margin-top:16px; }
    .recording-row { background:#0a0c14; border:1px solid #1a1d30; border-radius:10px; padding:14px 18px; display:flex; align-items:center; gap:14px; }
    .rec-left { display:flex; align-items:center; gap:12px; flex:1; min-width:0; }
    .rec-icon { color:#2e3350; font-size:13px; flex-shrink:0; }
    .rec-info { min-width:0; }
    .rec-name { color:#c0c0d8; font-size:13px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .rec-meta { color:#2e3350; font-size:11px; margin-top:3px; }
    .rec-actions { display:flex; align-items:center; gap:8px; flex-shrink:0; }
    .rec-title-input { background:#12141f; border:1px solid #1a1d30; border-radius:6px; padding:7px 10px; color:#c8c8e0; font-family:'IBM Plex Mono',monospace; font-size:11px; outline:none; width:180px; }
    .rec-title-input:focus { border-color:#7c6fff66; }

    /* Empty */
    .empty-panel { color:#2e3350; font-size:12px; padding:32px; text-align:center; border:1px dashed #1a1d30; border-radius:10px; line-height:1.8; }
    .empty-panel small { display:block; font-size:11px; margin-top:6px; color:#252840; }

    /* Buttons */
    .btn-primary { width:100%; background:#7c6fff; color:#fff; border:none; border-radius:10px; padding:14px; font-family:'IBM Plex Mono',monospace; font-size:13px; font-weight:700; cursor:pointer; letter-spacing:1px; transition:opacity 0.2s; }
    .btn-primary:disabled { opacity:0.4; cursor:not-allowed; }
    .btn-connect { border:none; border-radius:10px; padding:11px 24px; font-family:'IBM Plex Mono',monospace; font-size:12px; font-weight:700; cursor:pointer; letter-spacing:0.5px; }
    .btn-connect.google { background:#EA4335; color:#fff; }
    .btn-connect.ms { background:#5059C9; color:#fff; }
    .btn-secondary { background:#141628; border:1px solid #1e2130; color:#5a607c; border-radius:8px; padding:8px 14px; font-family:'IBM Plex Mono',monospace; font-size:11px; cursor:pointer; }
    .btn-secondary:disabled { opacity:0.5; }
    .btn-import { background:#1a2a1a; border:1px solid #2a4a2a; color:#6ddf8a; border-radius:6px; padding:8px 14px; font-family:'IBM Plex Mono',monospace; font-size:11px; font-weight:700; cursor:pointer; white-space:nowrap; }
    .btn-import:disabled { opacity:0.4; cursor:not-allowed; }

    /* Error */
    .error-msg { background:#1e0e18; border:1px solid #4a2030; color:#ff7090; padding:12px 16px; border-radius:8px; font-size:12px; margin-top:16px; }
  `],
})
export class MeetingUploadComponent implements OnInit {
  // Upload tab
  file = signal<File | null>(null);
  title = '';
  dragging = signal(false);
  uploading = signal(false);
  currentStep = signal(0);
  error = signal('');
  steps = ['Uploading file...', 'Transcribing audio...', 'Running AI analysis...', 'Generating tasks...'];

  // Integration tab
  activeTab = signal<Tab>('upload');
  status = signal<IntegrationStatus | null>(null);
  recordings = signal<Recording[]>([]);
  loadingRecordings = signal(false);
  importing = signal<string | false>(false);
  importError = signal('');
  importTitles: Record<string, string> = {};

  constructor(
    private meetingService: MeetingService,
    private integrationService: IntegrationService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.integrationService.getStatus().subscribe({
      next: (s) => this.status.set(s),
    });
  }

  switchTab(tab: 'google' | 'microsoft') {
    this.activeTab.set(tab);
    this.recordings.set([]);
    this.importError.set('');
    const connected = tab === 'google'
      ? this.status()?.google?.connected
      : this.status()?.microsoft?.connected;
    if (connected) {
      tab === 'google' ? this.loadGoogleRecordings() : this.loadMicrosoftRecordings();
    }
  }

  // ── Upload ─────────────────────────────────────────────────────────────────

  onDragOver(e: DragEvent) { e.preventDefault(); this.dragging.set(true); }
  onDrop(e: DragEvent) { e.preventDefault(); this.dragging.set(false); const f = e.dataTransfer?.files[0]; if (f) this.setFile(f); }
  onFileChange(e: Event) { const f = (e.target as HTMLInputElement).files?.[0]; if (f) this.setFile(f); }
  setFile(f: File) { this.file.set(f); if (!this.title) this.title = this.cleanName(f.name); }

  formatSize(bytes?: number) { if (!bytes) return ''; if (bytes > 1e9) return `${(bytes/1e9).toFixed(1)} GB`; return `${(bytes/1e6).toFixed(0)} MB`; }
  formatDate(d: string) { return d ? new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : ''; }
  cleanName(name: string) { return name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' '); }

  upload() {
    if (!this.file() && !this.title) return;
    this.uploading.set(true); this.error.set(''); this.currentStep.set(0);
    const f = this.file() || new File([''], 'demo.mp3', { type: 'audio/mp3' });
    this.meetingService.uploadMeeting(this.title || 'New Meeting', f).subscribe({
      next: (meeting: any) => {
        this.currentStep.set(1);
        this.meetingService.pollMeetingStatus(meeting.id).subscribe({
          next: (s: any) => {
            if (s.status === 'transcribing') this.currentStep.set(1);
            else if (s.status === 'analyzing') this.currentStep.set(2);
            else if (s.status === 'done') { this.currentStep.set(3); setTimeout(() => this.router.navigate(['/meetings', meeting.id]), 800); }
            else if (s.status === 'failed') { this.error.set(s.error_message || 'Processing failed.'); this.uploading.set(false); }
          },
          error: () => this.router.navigate(['/meetings', meeting.id]),
        });
      },
      error: (err: any) => { this.error.set(err?.error?.recording_file?.[0] || err?.error?.detail || 'Upload failed.'); this.uploading.set(false); },
    });
  }

  // ── Google ─────────────────────────────────────────────────────────────────

  connectGoogle() {
    this.integrationService.getGoogleAuthUrl().subscribe({
      next: ({ url }: { url: string }) => window.location.href = url,
      error: () => this.importError.set('Could not get Google auth URL. Check your .env settings.'),
    });
  }

  loadGoogleRecordings() {
    this.loadingRecordings.set(true);
    this.integrationService.getGoogleRecordings().subscribe({
      next: ({ recordings }: { recordings: Recording[] }) => { this.recordings.set(recordings); this.loadingRecordings.set(false); },
      error: () => { this.loadingRecordings.set(false); this.importError.set('Failed to load recordings.'); },
    });
  }

  importGoogle(rec: Recording) {
    const title = this.importTitles[rec.id] || this.cleanName(rec.name);
    this.importing.set(rec.id); this.importError.set('');
    this.integrationService.importGoogleRecording(rec.id, rec.name, title).subscribe({
      next: ({ meeting_id }: { meeting_id: number }) => { this.importing.set(false); this.router.navigate(['/meetings', meeting_id]); },
      error: (err: any) => { this.importing.set(false); this.importError.set(err?.error?.detail || 'Import failed.'); },
    });
  }

  // ── Microsoft ──────────────────────────────────────────────────────────────

  connectMicrosoft() {
    this.integrationService.getMicrosoftAuthUrl().subscribe({
      next: ({ url }: { url: string }) => window.location.href = url,
      error: () => this.importError.set('Could not get Microsoft auth URL. Check your .env settings.'),
    });
  }

  loadMicrosoftRecordings() {
    this.loadingRecordings.set(true);
    this.integrationService.getMicrosoftRecordings().subscribe({
      next: ({ recordings }: { recordings: Recording[] }) => { this.recordings.set(recordings); this.loadingRecordings.set(false); },
      error: () => { this.loadingRecordings.set(false); this.importError.set('Failed to load recordings.'); },
    });
  }

  importMicrosoft(rec: Recording) {
    const title = this.importTitles[rec.id] || this.cleanName(rec.name);
    this.importing.set(rec.id); this.importError.set('');
    this.integrationService.importMicrosoftRecording(rec.id, rec.name, title).subscribe({
      next: ({ meeting_id }: { meeting_id: number }) => { this.importing.set(false); this.router.navigate(['/meetings', meeting_id]); },
      error: (err: any) => { this.importing.set(false); this.importError.set(err?.error?.detail || 'Import failed.'); },
    });
  }
}
