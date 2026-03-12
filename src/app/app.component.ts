import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { FacilityService } from './core/services/facility.service';
import { IntegrationService } from './core/services/integration.service';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="app-shell" [class.auth-mode]="!isLoggedIn() || isFacilityPage()">
      <!-- Sidebar - only shown when logged in and NOT on facilities page -->
      <aside class="sidebar" *ngIf="isLoggedIn() && !isFacilityPage()">
        <div class="brand">◈ MeetAI</div>
        <div class="brand-sub">INTELLIGENCE PLATFORM</div>

        <div class="facility-switcher" *ngIf="isLoggedIn() && selectedFacility()">
          <div class="label">WORKSPACE</div>
          <div class="current-facility" (click)="switchFacility()">
            <span class="facility-name">{{ selectedFacility()?.name }}</span>
            <span class="switch-icon">⇄</span>
          </div>
        </div>

        <nav class="nav">
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">⬡</span> Dashboard
          </a>
          <a routerLink="/meetings" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" class="nav-item">
            <span class="nav-icon">◈</span> Meetings
          </a>
          <a routerLink="/meetings/upload" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">↑</span> Upload
          </a>
          <a routerLink="/tasks" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">▦</span> Task Board
          </a>
          <a routerLink="/calendar" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">📅</span> Calendar
          </a>

          <div class="nav-group-separator" style="height: 1px; background: #1e2130; margin: 12px 0;"></div>

          <a routerLink="/integrations" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">⊕</span> Integrations
            <span class="nav-badge" *ngIf="connectedCount() > 0" style="margin-left:auto; background:#7c6fff; color:#fff; border-radius:10px; font-size:9px; font-weight:700; padding:2px 7px; min-width:18px; text-align:center;">{{ connectedCount() }}</span>
          </a>
        </nav>

        <div class="sidebar-footer">
          <div class="user-info" *ngIf="user()">
            <div class="user-avatar">{{ initials() }}</div>
            <div>
              <div class="user-name">{{ user()?.first_name || user()?.email }}</div>
              <div class="user-plan">{{ user()?.plan | uppercase }} PLAN</div>
            </div>
          </div>
          <button class="logout-btn" (click)="logout()">Sign Out</button>
        </div>
      </aside>

      <main class="main-content" [class.full-width]="!isLoggedIn()">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&family=Syne:wght@700;800&display=swap');
    * { box-sizing:border-box; margin:0; padding:0; }
    :host { display:block; }
    .app-shell { display:flex; min-height:100vh; background:#080a12; }
    .auth-mode { display:block; }

    .sidebar {
      width:220px; min-height:100vh; background:#0d0f14;
      border-right:1px solid #1e2130;
      display:flex; flex-direction:column;
      padding:32px 16px; position:fixed; top:0; left:0; bottom:0; z-index:100;
      font-family:'IBM Plex Mono',monospace;
    }
    .brand { color:#7c6fff; font-size:20px; font-weight:700; letter-spacing:-1px; }
    .brand-sub { color:#2e3350; font-size:9px; letter-spacing:2px; margin-top:2px; margin-bottom:12px; }

    .facility-switcher { margin-bottom:24px; padding:12px; background:#12141f; border:1px solid #1e2130; border-radius:10px; cursor:pointer; font-family:'IBM Plex Mono',monospace; }
    .facility-switcher:hover { border-color:#7c6fff; }
    .facility-switcher .label { color:#3d4160; font-size:9px; font-weight:700; letter-spacing:1px; margin-bottom:4px; }
    .facility-switcher .current-facility { display:flex; align-items:center; justify-content:space-between; gap:8px; }
    .facility-switcher .facility-name { color:#c0c0d8; font-size:12px; font-weight:700; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .facility-switcher .switch-icon { color:#7c6fff; font-size:14px; }

    .nav { display:flex; flex-direction:column; gap:2px; flex:1; }
    .nav-item {
      display:flex; align-items:center; gap:10px;
      color:#3d4160; font-size:13px; font-weight:600;
      padding:10px 12px; border-radius:8px; text-decoration:none;
      border-left:2px solid transparent; transition:all 0.15s;
    }
    .nav-item:hover { color:#7c6fff; background:#141628; }
    .nav-item.active { color:#7c6fff; background:#1a1d2e; border-left-color:#7c6fff; }
    .nav-icon { opacity:0.6; }

    .sidebar-footer { padding-top:20px; border-top:1px solid #1e2130; }
    .user-info { display:flex; align-items:center; gap:10px; margin-bottom:12px; }
    .user-avatar { width:32px; height:32px; border-radius:50%; background:#7c6fff; display:flex; align-items:center; justify-content:center; color:#fff; font-size:12px; font-weight:700; flex-shrink:0; }
    .user-name { color:#c0c0d8; font-size:12px; }
    .user-plan { color:#3d4160; font-size:9px; letter-spacing:1px; }
    .logout-btn { width:100%; background:transparent; border:1px solid #1e2130; color:#4a5070; border-radius:8px; padding:8px; font-family:'IBM Plex Mono',monospace; font-size:11px; cursor:pointer; transition:all 0.15s; }
    .logout-btn:hover { border-color:#7c6fff; color:#7c6fff; }

    .main-content { margin-left:220px; flex:1; padding:48px 48px 48px 40px; min-height:100vh; }
    .main-content.full-width { margin-left:0; padding:0; }
  `],
})
export class AppComponent {
  isLoggedIn = this.auth.isLoggedIn;
  user = this.auth.user;
  selectedFacility = this.facilityService.selectedFacility;
  isFacilityPage = signal(false);
  connectedCount = signal(0); // will be updated via integration status

  initials = computed(() => {
    const u = this.auth.user();
    if (!u) return '?';
    const first = u.first_name?.[0] || '';
    const last = u.last_name?.[0] || '';
    return `${first}${last}`.toUpperCase() || u.email[0].toUpperCase();
  });

  constructor(
    private auth: AuthService,
    private facilityService: FacilityService,
    private integrationService: IntegrationService,
    private router: Router
  ) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.isFacilityPage.set(event.url.includes('/facilities'));
      
      // Update integration count when navigating
      if (this.isLoggedIn() && !this.isFacilityPage()) {
        this.updateConnectedCount();
      }
    });
  }

  private updateConnectedCount() {
    this.integrationService.getStatus().subscribe({
      next: (status) => {
        let count = 0;
        if (status.google?.connected) count++;
        if (status.microsoft?.connected) count++;
        this.connectedCount.set(count);
      }
    });
  }

  logout() { this.auth.logout(); }

  switchFacility() {
    this.router.navigate(['/facilities']);
  }
}
