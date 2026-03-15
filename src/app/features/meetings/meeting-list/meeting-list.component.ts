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
    .page { font-family:var(--sans); }
    .page-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:32px; }
    h1 { font-family:var(--mono); font-size:28px; font-weight:700; color:var(--text); }
    .subtitle { color:var(--muted); font-size:12px; margin-top:4px; }
    .btn-primary { background:var(--accent); color:#fff; border:none; border-radius:9px; padding:10px 20px; font-family:var(--sans); font-size:12px; font-weight:600; cursor:pointer; text-decoration:none; transition:background 0.15s; }
    .btn-primary:hover { background:#ff1f42; }

    .filters { display:flex; gap:12px; margin-bottom:24px; }
    .search-input, .select-input { background:var(--surface); border:1px solid var(--border); border-radius:8px; padding:10px 14px; color:var(--text); font-family:var(--sans); font-size:12px; outline:none; transition:border-color 0.15s; }
    .search-input:focus, .select-input:focus { border-color:var(--accent); }
    .search-input { flex:1; }
    .select-input { width:180px; }

    .meetings-list { display:flex; flex-direction:column; gap:12px; }
    .meeting-card { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:20px 24px; cursor:pointer; display:flex; justify-content:space-between; align-items:flex-start; transition:border-color 0.15s; text-decoration:none; color:inherit; }
    .meeting-card:hover { border-color:rgba(255,59,92,0.4); }
    .meeting-title { font-family:var(--mono); font-size:14px; font-weight:700; color:var(--text); margin-bottom:4px; }
    .meeting-meta { color:var(--muted); font-size:11px; margin-bottom:8px; font-family:var(--mono); }
    .meeting-summary { color:var(--muted); font-size:13px; max-width:500px; line-height:1.6; }
    .meeting-right { display:flex; flex-direction:column; align-items:flex-end; gap:8px; flex-shrink:0; }
    .meeting-counts { color:var(--muted); font-size:11px; font-family:var(--mono); }
    .status-badge { font-size:10px; font-weight:700; padding:3px 10px; border-radius:20px; text-transform:uppercase; letter-spacing:1px; font-family:var(--mono); }
    .status-done { background:var(--green-dim); color:var(--green); }
    .status-pending,.status-transcribing,.status-analyzing { background:var(--accent-dim); color:var(--accent); }
    .status-failed { background:rgba(255,59,92,0.1); color:var(--accent); }
    .loading, .empty-state { color:var(--muted); text-align:center; padding:60px; font-family:var(--sans); }
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
