import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MeetingService } from '../../../core/services/meeting.service';
import { TaskService } from '../../../core/services/task.service';
import { Meeting, Task, TaskStatus } from '../../../core/models/models';

@Component({
   selector: 'app-meeting-detail',
   standalone: true,
   imports: [CommonModule, RouterLink],
   template: `
    <div class="page" *ngIf="meeting()">
      <!-- Breadcrumb -->
      <div class="breadcrumb"><a routerLink="/meetings">Meetings</a> / {{ meeting()!.title }}</div>

      <div class="page-header">
        <div>
          <div class="meta">{{ meeting()!.created_at | date:'mediumDate' }} · {{ meeting()!.duration_display || '—' }}</div>
          <h1>{{ meeting()!.title }}</h1>
        </div>
        <span class="status-badge" [class]="'status-' + meeting()!.status">{{ meeting()!.status }}</span>
      </div>

      <!-- Processing indicator -->
      <div class="processing-banner" *ngIf="isProcessing()">
        <span class="spin">⟳</span> AI is processing your meeting. This usually takes 1-2 minutes...
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button *ngFor="let t of tabs" (click)="activeTab.set(t)" [class.active]="activeTab() === t" class="tab">{{ t }}</button>
      </div>

      <!-- OVERVIEW TAB -->
      <div *ngIf="activeTab() === 'Overview'" class="tab-content">
        <div class="grid-2">
          <div class="card">
            <div class="card-label">SUMMARY</div>
            <p class="body-text">{{ meeting()!.summary?.summary_text || 'Processing...' }}</p>
          </div>
          <div class="card">
            <div class="card-label">KEY DECISIONS</div>
            <div *ngFor="let d of meeting()!.decisions" class="decision-item">
              <span class="bullet">▸</span> {{ d.decision_text }}
            </div>
            <div *ngIf="!meeting()!.decisions?.length" class="empty-text">No decisions extracted yet.</div>
          </div>
        </div>
        <div class="card" style="margin-top:16px">
          <div class="card-label">ACTION ITEMS</div>
          <div class="action-items-grid">
            <div *ngFor="let t of meeting()!.tasks" class="action-item">
              <div class="assignee">
                <div class="avatar" [style.background]="avatarColor(t.assigned_to)">{{ initials(t.assigned_to) }}</div>
                <span class="assignee-name">{{ t.assigned_to || 'Unassigned' }}</span>
              </div>
              <div class="task-title">{{ t.title }}</div>
              <span class="task-status" [class]="'ts-' + t.status">{{ t.status }}</span>
            </div>
          </div>
        </div>
        <div class="card" style="margin-top:16px" *ngIf="meeting()!.summary?.next_steps">
          <div class="card-label">NEXT STEPS</div>
          <p class="body-text">{{ meeting()!.summary!.next_steps }}</p>
        </div>
      </div>

      <!-- TRANSCRIPT TAB -->
      <div *ngIf="activeTab() === 'Transcript'" class="tab-content">
        <div class="card">
          <div class="card-label">AUTO-GENERATED TRANSCRIPT · {{ meeting()!.transcript?.word_count || 0 }} words</div>
          <p class="transcript-text">{{ meeting()!.transcript?.text || 'Transcript not available yet.' }}</p>
        </div>
      </div>

      <!-- TASKS TAB -->
      <div *ngIf="activeTab() === 'Tasks'" class="tab-content">
        <div class="kanban">
          <div *ngFor="let col of columns" class="kanban-col">
            <div class="kanban-header">
              <span>{{ col.label }}</span>
              <span class="col-count">{{ getTasksByStatus(col.status).length }}</span>
            </div>
            <div *ngFor="let t of getTasksByStatus(col.status)" class="task-card">
              <div class="task-title">{{ t.title }}</div>
              <div class="task-meta">
                <div class="assignee-sm">
                  <div class="avatar sm" [style.background]="avatarColor(t.assigned_to)">{{ initials(t.assigned_to) }}</div>
                  <span>{{ t.assigned_to || 'Unassigned' }}</span>
                </div>
                <span *ngIf="t.due_date" class="due">{{ t.due_date }}</span>
              </div>
              <div class="task-actions">
                <button *ngFor="let other of getOtherStatuses(col.status)"
                        (click)="moveTask(t, other)"
                        class="move-btn">→ {{ other }}</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- DOCUMENTATION TAB -->
      <div *ngIf="activeTab() === 'Documentation'" class="tab-content">
        <div class="doc-actions">
          <button (click)="copyMarkdown()" class="doc-btn">{{ copied() ? '✓ Copied!' : 'Copy Markdown' }}</button>
        </div>
        <div class="doc-card">
          <h2 class="doc-title">{{ meeting()!.title }}</h2>
          <div class="doc-meta">{{ meeting()!.created_at | date:'mediumDate' }} · {{ meeting()!.duration_display || '—' }}</div>
          <hr class="divider" />
          <div class="doc-section">
            <div class="doc-section-label">SUMMARY</div>
            <p>{{ meeting()!.summary?.summary_text || '—' }}</p>
          </div>
          <div class="doc-section">
            <div class="doc-section-label">KEY DECISIONS</div>
            <div *ngFor="let d of meeting()!.decisions">▸ {{ d.decision_text }}</div>
          </div>
          <div class="doc-section">
            <div class="doc-section-label">ACTION ITEMS</div>
            <div *ngFor="let t of meeting()!.tasks"><strong>{{ t.assigned_to || 'Team' }}</strong>: {{ t.title }}</div>
          </div>
          <div class="doc-section" *ngIf="meeting()!.summary?.next_steps">
            <div class="doc-section-label">NEXT STEPS</div>
            <p>{{ meeting()!.summary!.next_steps }}</p>
          </div>
        </div>
      </div>
    </div>

    <div *ngIf="loading()" class="loading">Loading meeting...</div>
  `,
   styles: [`
    .page { font-family:var(--sans); }
    .breadcrumb { color:var(--muted); font-size:11px; margin-bottom:16px; font-family:var(--mono); } .breadcrumb a { color:var(--accent); text-decoration:none; }
    .page-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; }
    .meta { color:var(--muted); font-size:11px; margin-bottom:6px; font-family:var(--mono); }
    h1 { font-family:var(--mono); font-size:28px; font-weight:700; color:var(--text); }
    .status-badge { font-size:10px; font-weight:700; padding:4px 12px; border-radius:20px; text-transform:uppercase; letter-spacing:1px; font-family:var(--mono); }
    .status-done { background:var(--green-dim); color:var(--green); } .status-pending,.status-transcribing,.status-analyzing { background:var(--accent-dim); color:var(--accent); } .status-failed { background:rgba(255,59,92,0.1); color:var(--accent); }
    .processing-banner { background:var(--accent-dim); border:1px solid rgba(255,59,92,0.3); border-radius:10px; padding:14px 20px; color:var(--accent); font-size:12px; margin-bottom:24px; }
    .spin { display:inline-block; animation:spin 1s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }

    .tabs { display:flex; border-bottom:1px solid var(--border); margin-bottom:28px; }
    .tab { background:transparent; border:none; border-bottom:2px solid transparent; color:var(--muted); font-family:var(--sans); font-size:13px; font-weight:500; padding:8px 16px; cursor:pointer; transition:all 0.15s; }
    .tab.active { color:var(--accent); border-bottom-color:var(--accent); }

    .grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
    .card { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:24px; }
    .card-label { color:var(--muted); font-size:10px; letter-spacing:2px; margin-bottom:14px; font-family:var(--mono); }
    .body-text { color:var(--muted); font-size:13px; line-height:1.8; }
    .decision-item { display:flex; gap:10px; color:var(--muted); font-size:13px; margin-bottom:10px; line-height:1.6; }
    .bullet { color:var(--accent); }
    .empty-text { color:var(--muted); font-size:12px; opacity:0.5; }

    .action-items-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }
    .action-item { background:var(--bg); border:1px solid var(--border); border-radius:10px; padding:14px; }
    .assignee { display:flex; align-items:center; gap:8px; margin-bottom:8px; }
    .avatar { width:26px; height:26px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#fff; font-size:10px; font-weight:700; flex-shrink:0; font-family:var(--mono); }
    .avatar.sm { width:20px; height:20px; font-size:9px; }
    .assignee-name { color:var(--muted); font-size:11px; }
    .task-title { color:var(--text); font-size:12px; margin-bottom:8px; line-height:1.5; }
    .task-status { font-size:10px; font-weight:700; padding:2px 8px; border-radius:20px; text-transform:uppercase; font-family:var(--mono); }
    .ts-todo { background:var(--border); color:var(--muted); } .ts-in_progress { background:rgba(255,200,50,0.12); color:#f0b429; } .ts-done { background:var(--green-dim); color:var(--green); }

    .transcript-text { color:var(--muted); font-size:13px; line-height:2; }

    .kanban { display:grid; grid-template-columns:1fr 1fr 1fr; gap:16px; }
    .kanban-col { background:var(--bg); border:1px solid var(--border); border-radius:12px; padding:18px; min-height:200px; }
    .kanban-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; font-size:11px; color:var(--muted); letter-spacing:1px; font-family:var(--mono); }
    .col-count { background:var(--border); color:var(--muted); border-radius:20px; font-size:10px; padding:2px 8px; }
    .task-card { background:var(--surface); border:1px solid var(--border); border-radius:10px; padding:14px; margin-bottom:10px; }
    .task-meta { display:flex; justify-content:space-between; align-items:center; margin-top:10px; }
    .assignee-sm { display:flex; align-items:center; gap:6px; color:var(--muted); font-size:10px; }
    .due { color:var(--muted); font-size:10px; opacity:0.6; }
    .task-actions { display:flex; gap:6px; margin-top:10px; flex-wrap:wrap; }
    .move-btn { background:var(--border); border:none; border-radius:6px; color:var(--muted); font-family:var(--mono); font-size:9px; padding:3px 8px; cursor:pointer; transition:all 0.15s; }
    .move-btn:hover { background:var(--accent-dim); color:var(--accent); }

    .doc-actions { margin-bottom:16px; }
    .doc-btn { background:var(--surface); color:var(--accent); border:1px solid var(--border); border-radius:8px; padding:8px 18px; font-family:var(--sans); font-size:12px; cursor:pointer; transition:all 0.15s; }
    .doc-btn:hover { border-color:var(--accent); }
    .doc-card { background:var(--bg); border:1px solid var(--border); border-radius:12px; padding:32px; font-family:var(--sans); }
    .doc-title { font-family:var(--mono); font-size:22px; font-weight:700; color:var(--text); margin-bottom:4px; }
    .doc-meta { color:var(--muted); font-size:11px; margin-bottom:20px; font-family:var(--mono); }
    .divider { border-color:var(--border); margin-bottom:20px; }
    .doc-section { margin-bottom:24px; color:var(--muted); font-size:13px; line-height:1.8; }
    .doc-section-label { color:var(--muted); font-size:10px; letter-spacing:2px; margin-bottom:10px; font-family:var(--mono); opacity:0.6; }

    .loading { color:var(--muted); text-align:center; padding:60px; font-family:var(--sans); }
  `],
})
export class MeetingDetailComponent implements OnInit {
   meeting = signal<Meeting | null>(null);
   loading = signal(true);
   activeTab = signal('Overview');
   copied = signal(false);
   tabs = ['Overview', 'Transcript', 'Tasks', 'Documentation'];

   columns = [
      { status: 'todo' as TaskStatus, label: 'TODO' },
      { status: 'in_progress' as TaskStatus, label: 'IN PROGRESS' },
      { status: 'done' as TaskStatus, label: 'DONE' },
   ];

   constructor(
      private route: ActivatedRoute,
      private meetingService: MeetingService,
      private taskService: TaskService,
   ) { }

   ngOnInit() {
      const id = Number(this.route.snapshot.paramMap.get('id'));
      this.meetingService.getMeeting(id).subscribe({
         next: (m) => { this.meeting.set(m); this.loading.set(false); },
         error: () => this.loading.set(false),
      });
   }

   isProcessing() {
      const s = this.meeting()?.status;
      return s === 'pending' || s === 'transcribing' || s === 'analyzing';
   }

   getTasksByStatus(status: TaskStatus) {
      return (this.meeting()?.tasks || []).filter(t => t.status === status);
   }

   getOtherStatuses(current: TaskStatus): string[] {
      return ['todo', 'in_progress', 'done'].filter(s => s !== current);
   }

   moveTask(task: Task, newStatus: string) {
      this.taskService.updateTaskStatus(task.id, newStatus as TaskStatus).subscribe({
         next: (updated) => {
            this.meeting.update(m => {
               if (!m) return m;
               return { ...m, tasks: m.tasks!.map(t => t.id === updated.id ? updated : t) };
            });
         },
      });
   }

   avatarColor(name: string) {
      const colors = ['#7c6fff', '#06b6d4', '#f43f5e', '#f59e0b', '#10b981'];
      return colors[(name?.charCodeAt(0) || 0) % colors.length];
   }

   initials(name: string) {
      return (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
   }

   copyMarkdown() {
      const m = this.meeting()!;
      const md = `# ${m.title}\n**Date:** ${m.created_at}\n\n## Summary\n${m.summary?.summary_text}\n\n## Key Decisions\n${m.decisions?.map(d => `- ${d.decision_text}`).join('\n')}\n\n## Action Items\n${m.tasks?.map(t => `- **${t.assigned_to}**: ${t.title}`).join('\n')}`;
      navigator.clipboard.writeText(md).then(() => { this.copied.set(true); setTimeout(() => this.copied.set(false), 2000); });
   }
}
