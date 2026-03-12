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
    .facility-container { min-height:100vh; background:#080a12; padding:80px 20px; font-family:'IBM Plex Mono',monospace; color:#e8e8f0; }
    .header { max-width:800px; margin:0 auto 60px; text-align:center; }
    .brand { color:#7c6fff; font-size:20px; font-weight:700; margin-bottom:24px; }
    h1 { font-family:'Syne',sans-serif; font-size:48px; font-weight:800; margin-bottom:12px; }
    .subtitle { color:#4a5070; font-size:16px; }

    .workspace-grid { max-width:800px; margin:0 auto; display:grid; grid-template-columns:1fr; gap:16px; }
    .workspace-card { background:#12141f; border:1px solid #1e2130; border-radius:16px; padding:24px; display:flex; align-items:center; cursor:pointer; transition:all 0.2s; position:relative; overflow:hidden; }
    .workspace-card:hover { border-color:#7c6fff; background:#161928; transform:translateY(-2px); box-shadow:0 10px 30px rgba(0,0,0,0.5); }
    .workspace-card .icon { width:56px; height:56px; background:#1e2130; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:24px; font-weight:700; color:#7c6fff; margin-right:24px; flex-shrink:0; }
    .workspace-card .content h3 { margin:0 0 4px; font-size:18px; font-weight:700; }
    .workspace-card .content p { margin:0; font-size:13px; color:#4a5070; }
    .workspace-card .arrow { margin-left:auto; font-size:20px; color:#4a5070; opacity:0; transition:all 0.2s; }
    .workspace-card:hover .arrow { opacity:1; transform:translateX(5px); color:#7c6fff; }

    .workspace-card.create-new { border-style:dashed; border-color:#2a2d3e; }
    .workspace-card.create-new .icon { background:transparent; border:1px dashed #4a5070; color:#4a5070; }
    .workspace-card.create-new:hover { border-color:#7c6fff; }
    .workspace-card.create-new:hover .icon { color:#7c6fff; border-color:#7c6fff; }

    .modal { position:fixed; inset:0; background:rgba(4,6,12,0.9); backdrop-filter:blur(10px); display:flex; align-items:center; justify-content:center; z-index:100; padding:20px; }
    .modal-content { background:#12141f; border:1px solid #1e2130; border-radius:20px; padding:40px; width:100%; max-width:480px; box-shadow:0 20px 60px rgba(0,0,0,0.6); }
    .modal-content h2 { font-family:'Syne',sans-serif; margin-bottom:32px; font-size:28px; }
    .field { margin-bottom:24px; }
    label { display:block; color:#4a5070; font-size:11px; letter-spacing:1px; margin-bottom:8px; }
    input, textarea { width:100%; background:#0d0f14; border:1px solid #1e2130; border-radius:10px; padding:14px; color:#c8c8e0; font-family:'IBM Plex Mono',monospace; font-size:13px; outline:none; box-sizing:border-box; transition:border-color 0.15s; }
    input:focus, textarea:focus { border-color:#7c6fff; }
    textarea { min-height:100px; resize:vertical; }
    .actions { display:flex; justify-content:flex-end; gap:12px; margin-top:32px; }
    .btn-primary { background:#7c6fff; color:#white; border:none; border-radius:10px; padding:12px 24px; font-family:'IBM Plex Mono',monospace; font-size:13px; font-weight:700; cursor:pointer; }
    .btn-ghost { background:transparent; color:#4a5070; border:none; padding:12px 24px; font-family:'IBM Plex Mono',monospace; font-size:13px; cursor:pointer; border-radius:10px; }
    .btn-ghost:hover { background:#1e2130; color:#e8e8f0; }
    .btn-primary:disabled { opacity:0.5; cursor:not-allowed; }
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
