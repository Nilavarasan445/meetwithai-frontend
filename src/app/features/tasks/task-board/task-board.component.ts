import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TaskService } from '../../../core/services/task.service';
import { Task, TaskStatus } from '../../../core/models/models';

interface Column { status: TaskStatus; label: string; color: string; }

@Component({
  selector: 'app-task-board',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h1>Task Board</h1>
          <p class="subtitle">{{ tasks().length }} tasks across all meetings</p>
        </div>
        <button class="btn-primary" (click)="openCreate()">+ New Task</button>
      </div>

      <!-- Loading -->
      <div *ngIf="loading()" class="loading">
        <div class="loading-dots"><span></span><span></span><span></span></div>
      </div>

      <!-- Kanban Board -->
      <div class="kanban" *ngIf="!loading()">
        <div
          *ngFor="let col of columns"
          class="kanban-col"
          [attr.data-status]="col.status"
          (dragover)="onDragOver($event, col.status)"
          (dragleave)="onDragLeave($event)"
          (drop)="onDrop($event, col.status)"
          [class.drop-target]="dragOverCol() === col.status"
        >
          <!-- Column header -->
          <div class="col-header">
            <div class="col-title-row">
              <span class="col-dot" [style.background]="col.color"></span>
              <span class="col-label">{{ col.label }}</span>
              <span class="col-count">{{ getByStatus(col.status).length }}</span>
            </div>
            <button class="col-add-btn" (click)="openCreate(col.status)" title="Add task">+</button>
          </div>

          <!-- Task cards -->
          <div class="cards-list">
            <div
              *ngFor="let t of getByStatus(col.status)"
              class="task-card"
              draggable="true"
              (dragstart)="onDragStart($event, t)"
              (dragend)="onDragEnd()"
              [class.dragging]="draggingTask()?.id === t.id"
              (click)="openEdit(t)"
            >
              <!-- Meeting ref -->
              <div class="meeting-ref" *ngIf="t.meeting_title" (click)="$event.stopPropagation()">
                <a [routerLink]="['/meetings', t.meeting]">↳ {{ t.meeting_title }}</a>
              </div>

              <!-- Title -->
              <div class="card-title">{{ t.title }}</div>

              <!-- Description -->
              <div class="card-desc" *ngIf="t.description">{{ t.description }}</div>

              <!-- Footer -->
              <div class="card-footer">
                <div class="card-meta-left">
                  <div class="avatar" [style.background]="avatarColor(t.assigned_to)">
                    {{ initials(t.assigned_to) }}
                  </div>
                  <span class="assignee-name">{{ t.assigned_to || 'Unassigned' }}</span>
                </div>
                <div class="card-meta-right">
                  <span class="due-chip" *ngIf="t.due_date" [class.overdue]="isOverdue(t.due_date)">
                    📅 {{ t.due_date }}
                  </span>
                  <span class="time-chip" *ngIf="t.estimated_minutes">
                    ⏱ {{ formatMinutes(t.estimated_minutes) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Empty state -->
            <div class="empty-col" *ngIf="getByStatus(col.status).length === 0">
              Drop tasks here
            </div>
          </div>
        </div>
      </div>

      <!-- Create / Edit Modal -->
      <div class="modal-overlay" *ngIf="showModal()" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ editingTask() ? 'Edit Task' : 'New Task' }}</h2>
            <button class="modal-close" (click)="closeModal()">✕</button>
          </div>

          <div class="modal-body">
            <div class="field">
              <label>Title <span class="req">*</span></label>
              <input type="text" [(ngModel)]="form.title" placeholder="What needs to be done?" class="input" />
            </div>

            <div class="field">
              <label>Description</label>
              <textarea [(ngModel)]="form.description" placeholder="Add more details…" class="input textarea" rows="3"></textarea>
            </div>

            <div class="field-row">
              <div class="field">
                <label>Assigned to</label>
                <input type="text" [(ngModel)]="form.assigned_to" placeholder="Name" class="input" />
              </div>
              <div class="field">
                <label>Status</label>
                <select [(ngModel)]="form.status" class="input select">
                  <option value="todo">Todo</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
            </div>

            <div class="field-row">
              <div class="field">
                <label>Due date</label>
                <input type="date" [(ngModel)]="form.due_date" class="input" />
              </div>
              <div class="field">
                <label>Time estimate</label>
                <div class="time-input-row">
                  <input
                    type="number"
                    [(ngModel)]="form.estimated_minutes"
                    placeholder="0"
                    min="0"
                    class="input time-input"
                  />
                  <span class="time-unit">min</span>
                </div>
              </div>
            </div>

            <div *ngIf="modalError()" class="error-msg">{{ modalError() }}</div>
          </div>

          <div class="modal-footer">
            <button class="btn-ghost" (click)="closeModal()">Cancel</button>
            <button
              *ngIf="editingTask()"
              class="btn-danger"
              (click)="deleteTask()"
              [disabled]="saving()"
            >Delete</button>
            <button
              class="btn-primary"
              (click)="saveTask()"
              [disabled]="saving() || !form.title.trim()"
            >{{ saving() ? 'Saving…' : editingTask() ? 'Save Changes' : 'Create Task' }}</button>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .page { font-family:var(--sans); }

    /* Header */
    .page-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:28px; }
    h1 { font-family:var(--mono); font-size:26px; font-weight:700; color:var(--text); }
    .subtitle { color:var(--muted); font-size:12px; margin-top:4px; }
    .btn-primary { background:var(--accent); color:#fff; border:none; border-radius:9px; padding:10px 20px; font-family:var(--sans); font-size:12px; font-weight:600; cursor:pointer; transition:background 0.15s; }
    .btn-primary:hover { background:#ff1f42; }
    .btn-primary:disabled { opacity:0.4; cursor:not-allowed; }

    /* Loading */
    .loading { display:flex; justify-content:center; padding:60px; }
    .loading-dots { display:flex; gap:6px; }
    .loading-dots span { width:6px; height:6px; border-radius:50%; background:var(--border); animation:dot 1.2s ease-in-out infinite; }
    .loading-dots span:nth-child(2) { animation-delay:.2s; }
    .loading-dots span:nth-child(3) { animation-delay:.4s; }
    @keyframes dot { 0%,100%{opacity:.3;transform:scale(.8)} 50%{opacity:1;transform:scale(1)} }

    /* Kanban */
    .kanban { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; align-items:start; }

    .kanban-col {
      background:var(--bg);
      border:1px solid var(--border);
      border-radius:14px;
      padding:16px;
      min-height:500px;
      transition:border-color 0.15s, background 0.15s;
    }
    .kanban-col.drop-target {
      border-color:var(--accent);
      background:var(--accent-dim);
    }

    /* Column header */
    .col-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; }
    .col-title-row { display:flex; align-items:center; gap:8px; }
    .col-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
    .col-label { font-size:11px; font-weight:700; color:var(--muted); letter-spacing:1px; font-family:var(--mono); text-transform:uppercase; }
    .col-count { background:var(--surface); border:1px solid var(--border); color:var(--muted); border-radius:20px; font-size:10px; padding:1px 8px; font-family:var(--mono); }
    .col-add-btn { width:22px; height:22px; background:var(--surface); border:1px solid var(--border); border-radius:6px; color:var(--muted); font-size:14px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.15s; padding:0; }
    .col-add-btn:hover { background:var(--accent-dim); border-color:var(--accent); color:var(--accent); }

    /* Cards */
    .cards-list { display:flex; flex-direction:column; gap:10px; }

    .task-card {
      background:var(--surface);
      border:1px solid var(--border);
      border-radius:10px;
      padding:13px 14px;
      cursor:grab;
      transition:all 0.15s;
      user-select:none;
    }
    .task-card:hover { border-color:rgba(255,59,92,0.3); box-shadow:0 4px 16px rgba(0,0,0,0.2); transform:translateY(-1px); }
    .task-card:active { cursor:grabbing; }
    .task-card.dragging { opacity:0.4; transform:rotate(1deg); }

    .meeting-ref { font-size:10px; color:var(--muted); margin-bottom:6px; font-family:var(--mono); }
    .meeting-ref a { color:var(--accent); text-decoration:none; }

    .card-title { color:var(--text); font-size:13px; font-weight:500; line-height:1.4; margin-bottom:5px; }
    .card-desc { color:var(--muted); font-size:11px; line-height:1.5; margin-bottom:8px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }

    .card-footer { display:flex; align-items:center; justify-content:space-between; margin-top:10px; flex-wrap:wrap; gap:6px; }
    .card-meta-left { display:flex; align-items:center; gap:6px; }
    .card-meta-right { display:flex; align-items:center; gap:5px; flex-wrap:wrap; }

    .avatar { width:20px; height:20px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#fff; font-size:8px; font-weight:700; flex-shrink:0; font-family:var(--mono); }
    .assignee-name { font-size:11px; color:var(--muted); }

    .due-chip, .time-chip {
      font-size:10px; font-family:var(--mono);
      background:var(--bg); border:1px solid var(--border);
      border-radius:20px; padding:2px 7px; color:var(--muted);
      white-space:nowrap;
    }
    .due-chip.overdue { background:rgba(255,59,92,0.1); border-color:rgba(255,59,92,0.3); color:var(--accent); }
    .time-chip { background:rgba(34,197,94,0.08); border-color:rgba(34,197,94,0.2); color:#22c55e; }

    .empty-col { color:var(--muted); font-size:12px; text-align:center; padding:40px 0; opacity:0.4; border:2px dashed var(--border); border-radius:10px; }

    /* Modal */
    .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.7); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; z-index:1000; padding:20px; }
    .modal { background:var(--surface); border:1px solid var(--border); border-radius:16px; width:100%; max-width:520px; box-shadow:0 20px 60px rgba(0,0,0,0.5); }

    .modal-header { display:flex; align-items:center; justify-content:space-between; padding:20px 24px 16px; border-bottom:1px solid var(--border); }
    .modal-header h2 { font-family:var(--mono); font-size:16px; font-weight:700; color:var(--text); }
    .modal-close { background:transparent; border:none; color:var(--muted); font-size:18px; cursor:pointer; width:28px; height:28px; border-radius:6px; display:flex; align-items:center; justify-content:center; transition:all 0.15s; }
    .modal-close:hover { background:var(--bg); color:var(--accent); }

    .modal-body { padding:20px 24px; display:flex; flex-direction:column; gap:16px; }

    .field { display:flex; flex-direction:column; gap:6px; flex:1; }
    .field-row { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
    label { font-size:11px; font-weight:600; color:var(--muted); letter-spacing:0.5px; text-transform:uppercase; font-family:var(--mono); }
    .req { color:var(--accent); }

    .input {
      background:var(--bg); border:1px solid var(--border); border-radius:8px;
      padding:10px 12px; color:var(--text); font-family:var(--sans); font-size:13px;
      outline:none; transition:border-color 0.15s, box-shadow 0.15s; width:100%;
    }
    .input:focus { border-color:var(--accent); box-shadow:0 0 0 3px var(--accent-dim); }
    .input::placeholder { color:var(--muted); }
    .textarea { resize:vertical; min-height:80px; }
    .select { cursor:pointer; }
    option { background:var(--surface); }

    .time-input-row { display:flex; align-items:center; gap:8px; }
    .time-input { flex:1; }
    .time-unit { font-size:12px; color:var(--muted); white-space:nowrap; font-family:var(--mono); }

    .error-msg { background:var(--accent-dim); border:1px solid rgba(255,59,92,0.3); color:var(--accent); border-radius:8px; padding:10px 14px; font-size:12px; }

    .modal-footer { display:flex; align-items:center; gap:10px; padding:16px 24px; border-top:1px solid var(--border); }
    .modal-footer .btn-ghost { background:transparent; border:1px solid var(--border); color:var(--muted); border-radius:9px; padding:9px 18px; font-family:var(--sans); font-size:12px; cursor:pointer; transition:all 0.15s; }
    .modal-footer .btn-ghost:hover { border-color:var(--accent); color:var(--accent); }
    .btn-danger { background:rgba(255,59,92,0.12); border:1px solid rgba(255,59,92,0.3); color:var(--accent); border-radius:9px; padding:9px 18px; font-family:var(--sans); font-size:12px; font-weight:600; cursor:pointer; transition:all 0.15s; margin-right:auto; }
    .btn-danger:hover { background:rgba(255,59,92,0.2); }
    .btn-danger:disabled { opacity:0.4; cursor:not-allowed; }
  `],
})
export class TaskBoardComponent implements OnInit {
  tasks = signal<Task[]>([]);
  loading = signal(true);
  draggingTask = signal<Task | null>(null);
  dragOverCol = signal<TaskStatus | null>(null);
  showModal = signal(false);
  editingTask = signal<Task | null>(null);
  saving = signal(false);
  modalError = signal('');

  form: { title: string; description: string; assigned_to: string; status: TaskStatus; due_date: string; estimated_minutes: number | null } = {
    title: '', description: '', assigned_to: '', status: 'todo', due_date: '', estimated_minutes: null,
  };

  columns: Column[] = [
    { status: 'todo',        label: 'Todo',        color: '#6b6b7a' },
    { status: 'in_progress', label: 'In Progress',  color: '#f0b429' },
    { status: 'done',        label: 'Done',         color: '#22c55e' },
  ];

  constructor(private taskService: TaskService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.taskService.getTasks().subscribe({
      next: (res) => { this.tasks.set(res.results); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  getByStatus(status: TaskStatus) {
    return this.tasks().filter(t => t.status === status);
  }

  // ── Drag & Drop ──────────────────────────────────────────────

  onDragStart(event: DragEvent, task: Task) {
    this.draggingTask.set(task);
    event.dataTransfer?.setData('text/plain', String(task.id));
    event.dataTransfer!.effectAllowed = 'move';
  }

  onDragEnd() {
    this.draggingTask.set(null);
    this.dragOverCol.set(null);
  }

  onDragOver(event: DragEvent, status: TaskStatus) {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';
    this.dragOverCol.set(status);
  }

  onDragLeave(event: DragEvent) {
    const col = (event.currentTarget as HTMLElement);
    const related = event.relatedTarget as HTMLElement;
    if (!col.contains(related)) {
      this.dragOverCol.set(null);
    }
  }

  onDrop(event: DragEvent, newStatus: TaskStatus) {
    event.preventDefault();
    this.dragOverCol.set(null);
    const task = this.draggingTask();
    if (!task || task.status === newStatus) { this.draggingTask.set(null); return; }

    // Optimistic update
    this.tasks.update(ts => ts.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    this.draggingTask.set(null);

    this.taskService.updateTaskStatus(task.id, newStatus).subscribe({
      error: () => {
        // Revert on failure
        this.tasks.update(ts => ts.map(t => t.id === task.id ? { ...t, status: task.status } : t));
      },
    });
  }

  // ── Create / Edit Modal ──────────────────────────────────────

  openCreate(status: TaskStatus = 'todo') {
    this.editingTask.set(null);
    this.form = { title: '', description: '', assigned_to: '', status, due_date: '', estimated_minutes: null };
    this.modalError.set('');
    this.showModal.set(true);
  }

  openEdit(task: Task) {
    this.editingTask.set(task);
    this.form = {
      title: task.title,
      description: task.description || '',
      assigned_to: task.assigned_to || '',
      status: task.status,
      due_date: task.due_date || '',
      estimated_minutes: task.estimated_minutes,
    };
    this.modalError.set('');
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.editingTask.set(null);
  }

  saveTask() {
    if (!this.form.title.trim()) return;
    this.saving.set(true);
    this.modalError.set('');

    const payload = {
      title: this.form.title.trim(),
      description: this.form.description.trim(),
      assigned_to: this.form.assigned_to.trim(),
      status: this.form.status,
      due_date: this.form.due_date || null,
      estimated_minutes: this.form.estimated_minutes || null,
    };

    const editing = this.editingTask();

    if (editing) {
      this.taskService.updateTask(editing.id, payload).subscribe({
        next: (updated) => {
          this.tasks.update(ts => ts.map(t => t.id === updated.id ? updated : t));
          this.saving.set(false);
          this.closeModal();
        },
        error: () => { this.modalError.set('Failed to save. Please try again.'); this.saving.set(false); },
      });
    } else {
      this.taskService.createTask(payload).subscribe({
        next: (created) => {
          this.tasks.update(ts => [created, ...ts]);
          this.saving.set(false);
          this.closeModal();
        },
        error: () => { this.modalError.set('Failed to create task. Please try again.'); this.saving.set(false); },
      });
    }
  }

  deleteTask() {
    const task = this.editingTask();
    if (!task) return;
    this.saving.set(true);
    this.taskService.deleteTask(task.id).subscribe({
      next: () => {
        this.tasks.update(ts => ts.filter(t => t.id !== task.id));
        this.saving.set(false);
        this.closeModal();
      },
      error: () => { this.modalError.set('Failed to delete.'); this.saving.set(false); },
    });
  }

  // ── Helpers ──────────────────────────────────────────────────

  avatarColor(name: string) {
    const colors = ['#ff3b5c', '#06b6d4', '#f59e0b', '#10b981', '#8b5cf6'];
    return colors[(name?.charCodeAt(0) || 0) % colors.length];
  }

  initials(name: string) {
    return (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }

  formatMinutes(min: number | null): string {
    if (!min) return '';
    if (min < 60) return `${min}m`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
  }

  isOverdue(dueDate: string | null): boolean {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date(new Date().toDateString());
  }
}
