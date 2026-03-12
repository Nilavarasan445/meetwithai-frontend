import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TaskService } from '../../../core/services/task.service';
import { Task, TaskStatus } from '../../../core/models/models';

@Component({
  selector: 'app-task-board',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Task Board</h1>
          <p class="subtitle">All tasks across all meetings</p>
        </div>
      </div>

      <div *ngIf="loading()" class="loading">Loading tasks...</div>

      <div class="kanban" *ngIf="!loading()">
        <div *ngFor="let col of columns" class="kanban-col">
          <div class="kanban-header">
            <span class="col-label">{{ col.label }}</span>
            <span class="col-count">{{ getByStatus(col.status).length }}</span>
          </div>

          <div *ngFor="let t of getByStatus(col.status)" class="task-card">
            <div class="meeting-ref" *ngIf="t.meeting_title">
              <a [routerLink]="['/meetings', t.meeting]">↳ {{ t.meeting_title }}</a>
            </div>
            <div class="task-title">{{ t.title }}</div>
            <div class="task-desc" *ngIf="t.description">{{ t.description }}</div>
            <div class="task-meta">
              <div class="assignee">
                <div class="avatar" [style.background]="avatarColor(t.assigned_to)">{{ initials(t.assigned_to) }}</div>
                <span>{{ t.assigned_to || 'Unassigned' }}</span>
              </div>
              <span class="due" *ngIf="t.due_date">{{ t.due_date }}</span>
            </div>
            <div class="task-actions">
              <button *ngFor="let other of getOtherStatuses(col.status)"
                      (click)="move(t, other)"
                      class="move-btn">→ {{ other }}</button>
            </div>
          </div>

          <div *ngIf="getByStatus(col.status).length === 0" class="empty-col">No tasks</div>
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

    .kanban { display:grid; grid-template-columns:1fr 1fr 1fr; gap:16px; }
    .kanban-col { background:#0d0f14; border:1px solid #1e2130; border-radius:12px; padding:18px; min-height:400px; }
    .kanban-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
    .col-label { font-size:11px; color:#4a5070; letter-spacing:1px; }
    .col-count { background:#1e2130; color:#4a5070; border-radius:20px; font-size:10px; padding:2px 8px; }

    .task-card { background:#12141f; border:1px solid #1e2130; border-radius:10px; padding:14px; margin-bottom:10px; }
    .meeting-ref { font-size:10px; color:#3d4160; margin-bottom:6px; }
    .meeting-ref a { color:#7c6fff; text-decoration:none; }
    .task-title { color:#c0c0d8; font-size:12px; line-height:1.5; margin-bottom:6px; }
    .task-desc { color:#5a607c; font-size:11px; margin-bottom:8px; line-height:1.5; }
    .task-meta { display:flex; justify-content:space-between; align-items:center; margin-top:10px; }
    .assignee { display:flex; align-items:center; gap:6px; color:#4a5070; font-size:11px; }
    .avatar { width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#fff; font-size:9px; font-weight:700; flex-shrink:0; }
    .due { color:#2e3350; font-size:10px; }
    .task-actions { display:flex; gap:6px; margin-top:10px; flex-wrap:wrap; }
    .move-btn { background:#1e2130; border:none; border-radius:6px; color:#4a5070; font-family:'IBM Plex Mono',monospace; font-size:9px; padding:3px 8px; cursor:pointer; }
    .move-btn:hover { background:#2e3350; color:#7c6fff; }
    .empty-col { color:#2e3350; font-size:12px; text-align:center; padding:40px 0; }
    .loading { color:#4a5070; text-align:center; padding:60px; }
  `],
})
export class TaskBoardComponent implements OnInit {
  tasks = signal<Task[]>([]);
  loading = signal(true);

  columns = [
    { status: 'todo' as TaskStatus, label: 'TODO' },
    { status: 'in_progress' as TaskStatus, label: 'IN PROGRESS' },
    { status: 'done' as TaskStatus, label: 'DONE' },
  ];

  constructor(private taskService: TaskService) { }

  ngOnInit() {
    this.taskService.getTasks().subscribe({
      next: (res) => { this.tasks.set(res.results); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  getByStatus(status: TaskStatus) {
    return this.tasks().filter(t => t.status === status);
  }

  getOtherStatuses(current: TaskStatus): string[] {
    return ['todo', 'in_progress', 'done'].filter(s => s !== current);
  }

  move(task: Task, newStatus: string) {
    this.taskService.updateTaskStatus(task.id, newStatus as TaskStatus).subscribe({
      next: (updated) => {
        this.tasks.update(ts => ts.map(t => t.id === updated.id ? updated : t));
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
}
