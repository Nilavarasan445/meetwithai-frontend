import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MeetingService } from '../../../core/services/meeting.service';
import { Meeting } from '../../../core/models/models';

@Component({
  selector: 'app-meeting-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Meetings</h1>
          <p class="subtitle">{{ total() }} meetings processed</p>
        </div>
        <a routerLink="/meetings/upload" class="btn-primary">+ Upload</a>
      </div>

      <div class="filters">
        <input type="text" [(ngModel)]="search" (ngModelChange)="onSearch()" placeholder="Search meetings..." class="search-input" />
        <select [(ngModel)]="statusFilter" (ngModelChange)="onFilter()" class="select-input">
          <option value="">All statuses</option>
          <option value="done">Done</option>
          <option value="analyzing">Analyzing</option>
          <option value="transcribing">Transcribing</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <div *ngIf="loading()" class="loading">Loading...</div>

      <div class="meetings-list" *ngIf="!loading()">
        <a *ngFor="let m of meetings()" [routerLink]="['/meetings', m.id]" class="meeting-card">
          <div class="meeting-main">
            <div class="meeting-title">{{ m.title }}</div>
            <div class="meeting-meta">{{ m.created_at | date:'mediumDate' }} · {{ m.duration_display || '—' }}</div>
            <div class="meeting-summary">{{ m.summary_text || 'Processing...' }}</div>
          </div>
          <div class="meeting-right">
            <span class="status-badge" [class]="'status-' + m.status">{{ m.status }}</span>
            <div class="meeting-counts">{{ m.task_count }} tasks · {{ m.decision_count }} decisions</div>
          </div>
        </a>
        <div *ngIf="meetings().length === 0" class="empty-state">
          <div>No meetings found.</div>
          <a routerLink="/meetings/upload" class="btn-primary" style="margin-top:16px;display:inline-block;">Upload your first meeting</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&family=Syne:wght@700;800&display=swap');
    .page { font-family:'IBM Plex Mono',monospace; }
    .page-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:32px; }
    h1 { font-family:'Syne',sans-serif; font-size:28px; font-weight:800; color:#e8e8f0; }
    .subtitle { color:#4a5070; font-size:12px; margin-top:4px; }
    .btn-primary { background:#7c6fff; color:#fff; border:none; border-radius:8px; padding:10px 20px; font-family:'IBM Plex Mono',monospace; font-size:12px; font-weight:700; cursor:pointer; text-decoration:none; letter-spacing:1px; }

    .filters { display:flex; gap:12px; margin-bottom:24px; }
    .search-input, .select-input { background:#0d0f14; border:1px solid #1e2130; border-radius:8px; padding:10px 14px; color:#c8c8e0; font-family:'IBM Plex Mono',monospace; font-size:12px; outline:none; }
    .search-input { flex:1; }
    .select-input { width:180px; }

    .meetings-list { display:flex; flex-direction:column; gap:12px; }
    .meeting-card { background:#12141f; border:1px solid #1e2130; border-radius:12px; padding:20px 24px; cursor:pointer; display:flex; justify-content:space-between; align-items:flex-start; transition:border-color 0.15s; text-decoration:none; color:inherit; }
    .meeting-card:hover { border-color:#7c6fff; }
    .meeting-title { font-family:'Syne',sans-serif; font-size:16px; font-weight:700; color:#d8d8ef; margin-bottom:4px; }
    .meeting-meta { color:#3d4160; font-size:11px; margin-bottom:8px; }
    .meeting-summary { color:#5a607c; font-size:12px; max-width:500px; line-height:1.6; }
    .meeting-right { display:flex; flex-direction:column; align-items:flex-end; gap:8px; flex-shrink:0; }
    .meeting-counts { color:#3d4160; font-size:11px; }
    .status-badge { font-size:10px; font-weight:700; padding:3px 10px; border-radius:20px; text-transform:uppercase; letter-spacing:1px; }
    .status-done { background:#1a2a1a; color:#6ddf8a; }
    .status-pending,.status-transcribing,.status-analyzing { background:#1a1a2a; color:#7c6fff; }
    .status-failed { background:#2a1020; color:#ff7090; }
    .loading, .empty-state { color:#4a5070; text-align:center; padding:60px; }
  `],
})
export class MeetingListComponent implements OnInit {
  meetings = signal<Meeting[]>([]);
  total = signal(0);
  loading = signal(true);
  search = '';
  statusFilter = '';

  constructor(private meetingService: MeetingService) { }

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.meetingService.getMeetings(this.search, this.statusFilter).subscribe({
      next: (res) => { this.meetings.set(res.results); this.total.set(res.count); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  onSearch() { this.load(); }
  onFilter() { this.load(); }
}
