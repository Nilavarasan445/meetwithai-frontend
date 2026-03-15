import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../core/services/task.service';
import { Note, TaskStatus } from '../../core/models/models';

@Component({
  selector: 'app-notes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Notes</h1>
          <p class="subtitle">{{ notes().length }} notes</p>
        </div>
        <button class="btn-primary" (click)="createNote()">+ New Note</button>
      </div>

      <div class="notes-grid" *ngIf="notes().length > 0">
        <div
          *ngFor="let note of notes()"
          class="note-card"
          [class.pinned]="note.pinned"
          [style.border-color]="note.color !== '#2a2a32' ? note.color + '55' : ''"
          (click)="openNote(note)"
        >
          <div class="pin-badge" *ngIf="note.pinned">📌</div>
          <div class="note-content">{{ note.content || 'Empty note…' }}</div>
          <div class="note-footer">
            <span class="note-date">{{ formatDate(note.updated_at) }}</span>
            <button class="to-task-btn" (click)="$event.stopPropagation(); quickToTask(note)">→ Task</button>
          </div>
        </div>
      </div>

      <div class="empty-state" *ngIf="notes().length === 0">
        <div class="empty-icon">✎</div>
        <p>No notes yet. Create your first note.</p>
        <button class="btn-primary" (click)="createNote()">+ New Note</button>
      </div>

      <!-- Note editor modal -->
      <div class="modal-overlay" *ngIf="activeNote()" (click)="closeNote()">
        <div class="note-modal" (click)="$event.stopPropagation()">
          <div class="note-toolbar">
            <div class="color-picker">
              <button
                *ngFor="let c of noteColors"
                class="color-dot"
                [style.background]="c"
                [class.selected]="activeNote()!.color === c"
                (click)="setColor(c)"
              ></button>
            </div>
            <div class="toolbar-actions">
              <button class="tool-btn" [class.active]="activeNote()!.pinned" (click)="togglePin()">📌</button>
              <button class="tool-btn convert-btn" (click)="openConvertModal()">▦ To Task</button>
              <button class="tool-btn delete-btn" (click)="deleteNote()">🗑</button>
              <button class="tool-btn" (click)="closeNote()">✕</button>
            </div>
          </div>
          <textarea
            class="note-textarea"
            [(ngModel)]="draftContent"
            (ngModelChange)="onNoteChange()"
            placeholder="Start typing your note…"
          ></textarea>
          <div class="note-statusbar">
            <span>{{ wordCount() }} words</span>
            <span [class.saving]="noteSaving()">{{ noteSaving() ? 'Saving…' : 'Auto-saved' }}</span>
          </div>
        </div>
      </div>

      <!-- Convert to Task modal -->
      <div class="modal-overlay" *ngIf="showConvertModal()" (click)="showConvertModal.set(false)">
        <div class="convert-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Convert to Task</h2>
            <button class="modal-close" (click)="showConvertModal.set(false)">✕</button>
          </div>
          <div class="modal-body">
            <div class="note-preview">
              <div class="note-preview-label">From note</div>
              <div class="note-preview-text">{{ activeNote()?.content }}</div>
            </div>
            <div class="field">
              <label>Task title <span class="req">*</span></label>
              <input type="text" [(ngModel)]="convertForm.title" class="input" placeholder="Task name" />
            </div>
            <div class="field">
              <label>Description</label>
              <textarea [(ngModel)]="convertForm.description" class="input textarea" rows="2"></textarea>
            </div>
            <div class="field-row">
              <div class="field">
                <label>Assigned to</label>
                <input type="text" [(ngModel)]="convertForm.assigned_to" class="input" placeholder="Name" />
              </div>
              <div class="field">
                <label>Status</label>
                <select [(ngModel)]="convertForm.status" class="input">
                  <option value="todo">Todo</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
            </div>
            <div class="field-row">
              <div class="field">
                <label>Due date</label>
                <input type="date" [(ngModel)]="convertForm.due_date" class="input" />
              </div>
              <div class="field">
                <label>Time estimate (min)</label>
                <input type="number" [(ngModel)]="convertForm.estimated_minutes" min="0" class="input" placeholder="0" />
              </div>
            </div>
            <div class="error-msg" *ngIf="convertError()">{{ convertError() }}</div>
            <div class="success-msg" *ngIf="convertSuccess()">✅ Task created! Head to Task Board to view it.</div>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" (click)="showConvertModal.set(false)">Cancel</button>
            <button class="btn-primary" (click)="convertToTask()" [disabled]="converting() || !convertForm.title.trim()">
              {{ converting() ? 'Creating…' : 'Create Task' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { font-family:var(--sans); }
    .page-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:28px; }
    h1 { font-family:var(--mono); font-size:26px; font-weight:700; color:var(--text); }
    .subtitle { color:var(--muted); font-size:12px; margin-top:4px; }
    .btn-primary { background:var(--accent); color:#fff; border:none; border-radius:9px; padding:10px 20px; font-family:var(--sans); font-size:12px; font-weight:600; cursor:pointer; transition:background 0.15s; }
    .btn-primary:hover { background:#ff1f42; }
    .btn-primary:disabled { opacity:0.4; cursor:not-allowed; }

    .notes-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(210px,1fr)); gap:14px; }
    .note-card { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:16px; cursor:pointer; transition:all 0.15s; position:relative; min-height:140px; display:flex; flex-direction:column; justify-content:space-between; }
    .note-card:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(0,0,0,0.25); }
    .pin-badge { position:absolute; top:10px; right:10px; font-size:12px; }
    .note-content { font-size:13px; color:var(--text); line-height:1.6; flex:1; overflow:hidden; display:-webkit-box; -webkit-line-clamp:5; -webkit-box-orient:vertical; white-space:pre-wrap; word-break:break-word; }
    .note-footer { display:flex; align-items:center; justify-content:space-between; margin-top:12px; padding-top:10px; border-top:1px solid var(--border); }
    .note-date { font-size:10px; color:var(--muted); font-family:var(--mono); }
    .to-task-btn { background:var(--accent-dim); border:1px solid rgba(255,59,92,0.25); color:var(--accent); border-radius:6px; padding:3px 9px; font-size:10px; font-weight:600; cursor:pointer; }
    .to-task-btn:hover { background:rgba(255,59,92,0.2); }

    .empty-state { text-align:center; padding:80px 0; }
    .empty-icon { font-size:48px; margin-bottom:16px; opacity:0.3; }
    .empty-state p { color:var(--muted); font-size:14px; margin-bottom:20px; }

    .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.75); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; z-index:1000; padding:20px; }

    .note-modal { background:var(--surface); border:1px solid var(--border); border-radius:16px; width:100%; max-width:660px; display:flex; flex-direction:column; height:520px; box-shadow:0 20px 60px rgba(0,0,0,0.5); }
    .note-toolbar { display:flex; align-items:center; justify-content:space-between; padding:12px 16px; border-bottom:1px solid var(--border); flex-shrink:0; }
    .color-picker { display:flex; gap:7px; }
    .color-dot { width:16px; height:16px; border-radius:50%; border:2px solid transparent; cursor:pointer; transition:all 0.15s; padding:0; }
    .color-dot:hover { transform:scale(1.2); }
    .color-dot.selected { border-color:var(--text); }
    .toolbar-actions { display:flex; gap:6px; align-items:center; }
    .tool-btn { background:var(--bg); border:1px solid var(--border); border-radius:7px; padding:5px 10px; font-size:11px; font-weight:500; cursor:pointer; color:var(--muted); transition:all 0.15s; font-family:var(--sans); }
    .tool-btn:hover { border-color:var(--accent); color:var(--text); }
    .tool-btn.active { background:rgba(255,200,0,0.1); border-color:rgba(255,200,0,0.4); color:#f0b429; }
    .tool-btn.convert-btn { background:var(--accent-dim); border-color:rgba(255,59,92,0.3); color:var(--accent); }
    .tool-btn.delete-btn:hover { background:rgba(255,59,92,0.1); border-color:rgba(255,59,92,0.3); color:var(--accent); }
    .note-textarea { flex:1; width:100%; resize:none; border:none; outline:none; background:transparent; padding:20px; color:var(--text); font-family:var(--sans); font-size:14px; line-height:1.7; }
    .note-textarea::placeholder { color:var(--muted); }
    .note-statusbar { display:flex; justify-content:space-between; padding:8px 16px; border-top:1px solid var(--border); font-size:10px; color:var(--muted); font-family:var(--mono); flex-shrink:0; }
    .saving { color:var(--accent); }

    .convert-modal { background:var(--surface); border:1px solid var(--border); border-radius:16px; width:100%; max-width:500px; box-shadow:0 20px 60px rgba(0,0,0,0.5); }
    .modal-header { display:flex; align-items:center; justify-content:space-between; padding:18px 22px 14px; border-bottom:1px solid var(--border); }
    .modal-header h2 { font-family:var(--mono); font-size:15px; font-weight:700; color:var(--text); }
    .modal-close { background:transparent; border:none; color:var(--muted); font-size:18px; cursor:pointer; }
    .modal-body { padding:18px 22px; display:flex; flex-direction:column; gap:14px; }
    .modal-footer { display:flex; justify-content:flex-end; gap:10px; padding:14px 22px; border-top:1px solid var(--border); }

    .note-preview { background:var(--bg); border:1px solid var(--border); border-radius:8px; padding:12px; }
    .note-preview-label { font-size:10px; color:var(--muted); font-family:var(--mono); text-transform:uppercase; letter-spacing:1px; margin-bottom:6px; }
    .note-preview-text { font-size:12px; color:var(--muted); line-height:1.5; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; white-space:pre-wrap; }

    .field { display:flex; flex-direction:column; gap:5px; flex:1; }
    .field-row { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    label { font-size:10px; font-weight:700; color:var(--muted); letter-spacing:0.5px; text-transform:uppercase; font-family:var(--mono); }
    .req { color:var(--accent); }
    .input { background:var(--bg); border:1px solid var(--border); border-radius:8px; padding:9px 12px; color:var(--text); font-family:var(--sans); font-size:12px; outline:none; transition:border-color 0.15s; width:100%; }
    .input:focus { border-color:var(--accent); }
    .input::placeholder { color:var(--muted); }
    .textarea { resize:vertical; min-height:60px; }

    .error-msg { background:var(--accent-dim); border:1px solid rgba(255,59,92,0.3); color:var(--accent); border-radius:8px; padding:10px 14px; font-size:12px; }
    .success-msg { background:rgba(34,197,94,0.1); border:1px solid rgba(34,197,94,0.25); color:#22c55e; border-radius:8px; padding:10px 14px; font-size:12px; }
    .btn-ghost { background:transparent; border:1px solid var(--border); color:var(--muted); border-radius:9px; padding:9px 18px; font-family:var(--sans); font-size:12px; cursor:pointer; }
    .btn-ghost:hover { border-color:var(--accent); color:var(--accent); }
  `],
})
export class NotesComponent implements OnInit {
  notes = signal<Note[]>([]);
  activeNote = signal<Note | null>(null);
  draftContent = '';
  showConvertModal = signal(false);
  noteSaving = signal(false);
  converting = signal(false);
  convertError = signal('');
  convertSuccess = signal(false);
  private saveTimer: any;

  noteColors = ['#2a2a32', '#ff3b5c', '#f0b429', '#22c55e', '#06b6d4', '#8b5cf6'];

  convertForm: {
    title: string;
    description: string;
    assigned_to: string;
    status: TaskStatus;
    due_date: string;
    estimated_minutes: number | null;
  } = { title: '', description: '', assigned_to: '', status: 'todo', due_date: '', estimated_minutes: null };

  wordCount = computed(() =>
    this.draftContent.trim() ? this.draftContent.trim().split(/\s+/).length : 0
  );

  constructor(private taskService: TaskService) {}

  ngOnInit() { this.loadNotes(); }

  loadNotes() {
    try {
      const raw = localStorage.getItem('meetai_notes');
      const data: Note[] = raw ? JSON.parse(raw) : [];
      data.sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });
      this.notes.set(data);
    } catch { this.notes.set([]); }
  }

  saveNotes(notes: Note[]) {
    localStorage.setItem('meetai_notes', JSON.stringify(notes));
  }

  createNote() {
    const note: Note = {
      id: Date.now().toString(),
      content: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      pinned: false,
      color: '#2a2a32',
    };
    const updated = [note, ...this.notes()];
    this.notes.set(updated);
    this.saveNotes(updated);
    this.activeNote.set({ ...note });
    this.draftContent = '';
  }

  openNote(note: Note) {
    this.activeNote.set({ ...note });
    this.draftContent = note.content;
  }

  closeNote() {
    clearTimeout(this.saveTimer);
    this.flushSave();
    this.activeNote.set(null);
  }

  onNoteChange() {
    clearTimeout(this.saveTimer);
    this.noteSaving.set(true);
    this.saveTimer = setTimeout(() => this.flushSave(), 700);
  }

  flushSave() {
    const note = this.activeNote();
    if (!note) return;
    const saved: Note = { ...note, content: this.draftContent, updated_at: new Date().toISOString() };
    this.activeNote.set(saved);
    const list = this.notes().map(n => n.id === saved.id ? saved : n);
    list.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
    this.notes.set(list);
    this.saveNotes(list);
    this.noteSaving.set(false);
  }

  deleteNote() {
    const note = this.activeNote();
    if (!note) return;
    const updated = this.notes().filter(n => n.id !== note.id);
    this.notes.set(updated);
    this.saveNotes(updated);
    this.activeNote.set(null);
  }

  togglePin() {
    const note = this.activeNote();
    if (!note) return;
    const pinned: Note = { ...note, pinned: !note.pinned };
    this.activeNote.set(pinned);
    const list = this.notes().map(n => n.id === pinned.id ? pinned : n);
    list.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
    this.notes.set(list);
    this.saveNotes(list);
  }

  setColor(color: string) {
    const note = this.activeNote();
    if (!note) return;
    const colored: Note = { ...note, color };
    this.activeNote.set(colored);
    this.notes.set(this.notes().map(n => n.id === colored.id ? colored : n));
    this.saveNotes(this.notes());
  }

  quickToTask(note: Note) {
    this.activeNote.set({ ...note });
    this.draftContent = note.content;
    this.openConvertModal();
  }

  openConvertModal() {
    const note = this.activeNote();
    const firstLine = note?.content?.split('\n')[0]?.trim() || '';
    this.convertForm = {
      title: firstLine.slice(0, 100) || 'Task from note',
      description: note?.content || '',
      assigned_to: '',
      status: 'todo',
      due_date: '',
      estimated_minutes: null,
    };
    this.convertError.set('');
    this.convertSuccess.set(false);
    this.showConvertModal.set(true);
  }

  convertToTask() {
    if (!this.convertForm.title.trim()) return;
    this.converting.set(true);
    this.convertError.set('');
    this.taskService.createTask({
      title: this.convertForm.title.trim(),
      description: this.convertForm.description.trim(),
      assigned_to: this.convertForm.assigned_to.trim(),
      status: this.convertForm.status,
      due_date: this.convertForm.due_date || null,
      estimated_minutes: this.convertForm.estimated_minutes || null,
    }).subscribe({
      next: () => {
        this.converting.set(false);
        this.convertSuccess.set(true);
        setTimeout(() => this.showConvertModal.set(false), 2000);
      },
      error: () => {
        this.convertError.set('Failed to create task. Please try again.');
        this.converting.set(false);
      },
    });
  }

  formatDate(iso: string): string {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
