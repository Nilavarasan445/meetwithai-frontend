import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FacilityService, Facility } from '../../core/services/facility.service';

@Component({
  selector: 'app-facility-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="facility-container">
      <div class="header">
        <div class="brand">◈ MeetAI</div>
        <h1>Select your Workspace</h1>
        <p class="subtitle">Please select a project/facility to continue</p>
      </div>

      <div class="workspace-grid">
        @for (facility of facilities(); track facility.id) {
          <div class="workspace-card" (click)="selectFacility(facility)">
            <div class="icon">{{ facility.name.substring(0, 1).toUpperCase() }}</div>
            <div class="content">
              <h3>{{ facility.name }}</h3>
              <p>{{ facility.description || 'No description provided' }}</p>
            </div>
            <div class="arrow">→</div>
          </div>
        }

        <div class="workspace-card create-new" (click)="showCreateForm.set(true)">
          <div class="icon">+</div>
          <div class="content">
            <h3>Create New Workspace</h3>
            <p>Start a new project or facility</p>
          </div>
        </div>
      </div>

      @if (showCreateForm()) {
        <div class="modal">
          <div class="modal-content">
            <h2>New Workspace</h2>
            <div class="field">
              <label>Name</label>
              <input type="text" [(ngModel)]="newFacilityName" placeholder="e.g. Acme Project" />
            </div>
            <div class="field">
              <label>Description (Optional)</label>
              <textarea [(ngModel)]="newFacilityDesc" placeholder="Briefly describe what this is for"></textarea>
            </div>
            <div class="actions">
              <button (click)="showCreateForm.set(false)" class="btn-ghost">Cancel</button>
              <button (click)="createFacility()" [disabled]="!newFacilityName || creating()" class="btn-primary">
                {{ creating() ? 'Creating...' : 'Create Workspace' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .facility-container { min-height:100vh; background:var(--bg); padding:80px 20px; font-family:var(--sans); color:var(--text); }
    .header { max-width:800px; margin:0 auto 60px; text-align:center; }
    .brand { color:var(--accent); font-size:20px; font-weight:700; margin-bottom:24px; font-family:var(--mono); }
    h1 { font-family:var(--mono); font-size:42px; font-weight:700; margin-bottom:12px; letter-spacing:-1px; }
    .subtitle { color:var(--muted); font-size:15px; }

    .workspace-grid { max-width:800px; margin:0 auto; display:grid; grid-template-columns:1fr; gap:16px; }
    .workspace-card { background:var(--surface); border:1px solid var(--border); border-radius:16px; padding:24px; display:flex; align-items:center; cursor:pointer; transition:all 0.2s; position:relative; overflow:hidden; }
    .workspace-card:hover { border-color:rgba(255,59,92,0.5); background:#1c1c20; transform:translateY(-2px); box-shadow:0 10px 30px rgba(0,0,0,0.4); }
    .workspace-card .icon { width:56px; height:56px; background:var(--bg); border:1px solid var(--border); border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:22px; font-weight:700; color:var(--accent); margin-right:24px; flex-shrink:0; font-family:var(--mono); transition:all 0.2s; }
    .workspace-card:hover .icon { background:var(--accent-dim); border-color:rgba(255,59,92,0.4); }
    .workspace-card .content h3 { margin:0 0 4px; font-size:16px; font-weight:600; font-family:var(--mono); color:var(--text); }
    .workspace-card .content p { margin:0; font-size:13px; color:var(--muted); }
    .workspace-card .arrow { margin-left:auto; font-size:20px; color:var(--muted); opacity:0; transition:all 0.2s; }
    .workspace-card:hover .arrow { opacity:1; transform:translateX(5px); color:var(--accent); }

    .workspace-card.create-new { border-style:dashed; border-color:var(--border); }
    .workspace-card.create-new .icon { background:transparent; border:1px dashed var(--border); color:var(--muted); }
    .workspace-card.create-new:hover { border-color:rgba(255,59,92,0.4); }
    .workspace-card.create-new:hover .icon { color:var(--accent); border-color:rgba(255,59,92,0.4); border-style:dashed; }

    .modal { position:fixed; inset:0; background:rgba(0,0,0,0.85); backdrop-filter:blur(10px); display:flex; align-items:center; justify-content:center; z-index:100; padding:20px; }
    .modal-content { background:var(--surface); border:1px solid var(--border); border-radius:20px; padding:40px; width:100%; max-width:480px; box-shadow:0 20px 60px rgba(0,0,0,0.6); }
    .modal-content h2 { font-family:var(--mono); margin-bottom:32px; font-size:24px; font-weight:700; color:var(--text); }
    .field { margin-bottom:24px; }
    label { display:block; color:var(--muted); font-size:11px; letter-spacing:1px; margin-bottom:8px; font-family:var(--mono); }
    input, textarea { width:100%; background:var(--bg); border:1px solid var(--border); border-radius:9px; padding:14px; color:var(--text); font-family:var(--sans); font-size:13px; outline:none; box-sizing:border-box; transition:border-color 0.15s; }
    input:focus, textarea:focus { border-color:var(--accent); }
    textarea { min-height:100px; resize:vertical; }
    .actions { display:flex; justify-content:flex-end; gap:12px; margin-top:32px; }
    .btn-primary { background:var(--accent); color:#fff; border:none; border-radius:9px; padding:12px 24px; font-family:var(--sans); font-size:13px; font-weight:600; cursor:pointer; transition:background 0.15s; }
    .btn-primary:hover { background:#ff1f42; }
    .btn-primary:disabled { opacity:0.4; cursor:not-allowed; }
    .btn-ghost { background:transparent; color:var(--muted); border:1px solid var(--border); padding:12px 24px; font-family:var(--sans); font-size:13px; cursor:pointer; border-radius:9px; transition:all 0.15s; }
    .btn-ghost:hover { background:var(--border); color:var(--text); }
  `],
})
export class FacilityListComponent implements OnInit {
  private facilityService = inject(FacilityService);
  private router = inject(Router);

  facilities = signal<Facility[]>([]);
  showCreateForm = signal(false);
  creating = signal(false);

  newFacilityName = '';
  newFacilityDesc = '';

  ngOnInit() {
    this.loadFacilities();
  }

  loadFacilities() {
    this.facilityService.getFacilities().subscribe({
      next: (data) => this.facilities.set(data.results),
      error: (err) => console.error('Failed to load facilities', err),
    });
  }

  selectFacility(facility: Facility) {
    this.facilityService.setSelectedFacility(facility);
    this.router.navigate(['/dashboard']);
  }

  createFacility() {
    if (!this.newFacilityName) return;
    this.creating.set(true);
    this.facilityService.createFacility({
      name: this.newFacilityName,
      description: this.newFacilityDesc
    }).subscribe({
      next: (facility) => {
        this.creating.set(false);
        this.showCreateForm.set(false);
        this.selectFacility(facility);
      },
      error: (err) => {
        console.error('Failed to create facility', err);
        this.creating.set(false);
      }
    });
  }
}
