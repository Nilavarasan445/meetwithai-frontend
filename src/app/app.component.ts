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
          <a routerLink="/notes" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">✎</span> Notes
          </a>
          <a routerLink="/standup" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">⚡</span> Standup
          </a>
          <a routerLink="/report" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">📊</span> Daily Report
          </a>
          <a routerLink="/calendar" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">📅</span> Calendar
          </a>

          <div class="nav-group-separator" style="height: 1px; background: var(--border); margin: 12px 0;"></div>

          <a routerLink="/integrations" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">⊕</span> Integrations
            <span class="nav-badge" *ngIf="connectedCount() > 0" style="margin-left:auto; background:var(--accent); color:#fff; border-radius:10px; font-size:9px; font-weight:700; padding:2px 7px; min-width:18px; text-align:center;">{{ connectedCount() }}</span>
          </a>

          <!-- Extension Token -->
          <div class="token-card" *ngIf="isLoggedIn()">
            <div class="token-label">🎙 Extension Token</div>
            <div class="token-desc">Copy this into the Meet Recorder extension to upload recordings directly.</div>
            <div class="token-box">
              <span class="token-value">{{ maskedToken() }}</span>
              <button class="token-copy-btn" (click)="copyToken()" [class.copied]="tokenCopied()">
                {{ tokenCopied() ? '✓' : 'Copy' }}
              </button>
            </div>
          </div>
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
    * { box-sizing:border-box; margin:0; padding:0; }
    :host { display:block; }
    .app-shell { display:flex; min-height:100vh; background:var(--bg); }
    .auth-mode { display:block; }

    .sidebar {
      width:220px; min-height:100vh; background:var(--surface);
      border-right:1px solid var(--border);
      display:flex; flex-direction:column;
      padding:32px 16px; position:fixed; top:0; left:0; bottom:0; z-index:100;
      font-family:var(--sans);
    }
    .brand { color:var(--accent); font-size:20px; font-weight:700; letter-spacing:-1px; font-family:var(--mono); }
    .brand-sub { color:var(--muted); font-size:9px; letter-spacing:2px; margin-top:2px; margin-bottom:12px; opacity:0.5; }

    .facility-switcher { margin-bottom:24px; padding:12px; background:var(--bg); border:1px solid var(--border); border-radius:10px; cursor:pointer; }
    .facility-switcher:hover { border-color:var(--accent); }
    .facility-switcher .label { color:var(--muted); font-size:9px; font-weight:700; letter-spacing:1px; margin-bottom:4px; font-family:var(--mono); }
    .facility-switcher .current-facility { display:flex; align-items:center; justify-content:space-between; gap:8px; }
    .facility-switcher .facility-name { color:var(--text); font-size:12px; font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .facility-switcher .switch-icon { color:var(--accent); font-size:14px; }

    .nav { display:flex; flex-direction:column; gap:2px; flex:1; }
    .nav-item {
      display:flex; align-items:center; gap:10px;
      color:var(--muted); font-size:13px; font-weight:500;
      padding:10px 12px; border-radius:8px; text-decoration:none;
      border-left:2px solid transparent; transition:all 0.15s;
    }
    .nav-item:hover { color:var(--text); background:rgba(255,59,92,0.07); }
    .nav-item.active { color:var(--accent); background:var(--accent-dim); border-left-color:var(--accent); }
    .nav-icon { opacity:0.6; }

    .sidebar-footer { padding-top:20px; border-top:1px solid var(--border); }
    .user-info { display:flex; align-items:center; gap:10px; margin-bottom:12px; }
    .user-avatar { width:32px; height:32px; border-radius:50%; background:var(--accent); display:flex; align-items:center; justify-content:center; color:#fff; font-size:12px; font-weight:700; flex-shrink:0; font-family:var(--mono); }
    .user-name { color:var(--text); font-size:12px; font-weight:500; }
    .user-plan { color:var(--muted); font-size:9px; letter-spacing:1px; font-family:var(--mono); }
    .logout-btn { width:100%; background:transparent; border:1px solid var(--border); color:var(--muted); border-radius:8px; padding:8px; font-family:var(--sans); font-size:11px; cursor:pointer; transition:all 0.15s; }
    .logout-btn:hover { border-color:var(--accent); color:var(--accent); }

    .main-content { margin-left:220px; flex:1; padding:48px 48px 48px 40px; min-height:100vh; }
    .main-content.full-width { margin-left:0; padding:0; }

    /* Extension token card */
    .token-card { margin-top:8px; background:var(--bg); border:1px solid var(--border); border-radius:10px; padding:12px; }
    .token-label { font-size:11px; font-weight:600; color:var(--text); margin-bottom:4px; font-family:var(--mono); }
    .token-desc { font-size:10px; color:var(--muted); line-height:1.5; margin-bottom:10px; }
    .token-box { display:flex; align-items:center; gap:6px; background:var(--surface); border:1px solid var(--border); border-radius:7px; padding:6px 8px; }
    .token-value { flex:1; font-family:var(--mono); font-size:10px; color:var(--muted); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; letter-spacing:0.5px; }
    .token-copy-btn { flex-shrink:0; background:var(--accent); color:#fff; border:none; border-radius:5px; padding:3px 10px; font-family:var(--sans); font-size:10px; font-weight:600; cursor:pointer; transition:all 0.15s; white-space:nowrap; }
    .token-copy-btn.copied { background:var(--green); }
    .token-copy-btn:hover { opacity:0.85; }
  `],
})
export class AppComponent {
  isLoggedIn = this.auth.isLoggedIn;
  user = this.auth.user;
  selectedFacility = this.facilityService.selectedFacility;
  isFacilityPage = signal(false);
  connectedCount = signal(0);
  tokenCopied = signal(false);

  // Show first 10 + last 6 chars of token, rest masked
  maskedToken = computed(() => {
    const t = this.auth.getAccessToken();
    if (!t) return '';
    if (t.length <= 20) return t;
    return t.slice(0, 10) + '••••••••' + t.slice(-6);
  });

  copyToken() {
    const token = this.auth.getAccessToken();
    if (!token) return;
    navigator.clipboard.writeText(token).then(() => {
      this.tokenCopied.set(true);
      setTimeout(() => this.tokenCopied.set(false), 2000);
    });
  }

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
