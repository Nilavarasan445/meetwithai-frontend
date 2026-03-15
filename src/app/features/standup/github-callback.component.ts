import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StandupService } from '../../core/services/standup.service';

@Component({
  selector: 'app-github-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="callback-page">
      <div class="callback-card">
        <div class="logo">⌥</div>
        <ng-container *ngIf="!error">
          <div class="spinner"></div>
          <p class="msg">Connecting GitHub account…</p>
        </ng-container>
        <ng-container *ngIf="error">
          <div class="error-icon">✕</div>
          <p class="msg error">{{ error }}</p>
          <button class="btn" (click)="retry()">Try Again</button>
        </ng-container>
      </div>
    </div>
  `,
  styles: [`
    .callback-page { min-height:100vh; background:var(--bg); display:flex; align-items:center; justify-content:center; font-family:var(--sans); }
    .callback-card { background:var(--surface); border:1px solid var(--border); border-radius:16px; padding:48px 40px; text-align:center; min-width:280px; }
    .logo { font-size:32px; margin-bottom:20px; }
    .spinner { width:32px; height:32px; border:3px solid var(--border); border-top-color:var(--accent); border-radius:50%; animation:spin 0.8s linear infinite; margin:0 auto 16px; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .msg { font-size:14px; color:var(--muted); }
    .msg.error { color:var(--accent); }
    .error-icon { font-size:28px; color:var(--accent); margin-bottom:12px; }
    .btn { margin-top:20px; background:var(--accent); color:#fff; border:none; border-radius:9px; padding:10px 24px; font-family:var(--sans); font-size:13px; font-weight:600; cursor:pointer; }
  `],
})
export class GithubCallbackComponent implements OnInit {
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private standupService: StandupService,
  ) {}

  ngOnInit() {
    const code = this.route.snapshot.queryParamMap.get('code');
    const errorParam = this.route.snapshot.queryParamMap.get('error');

    if (errorParam) {
      this.error = 'GitHub authorization was denied.';
      return;
    }

    if (!code) {
      this.error = 'No authorization code received from GitHub.';
      return;
    }

    this.standupService.exchangeGitHubCode(code).subscribe({
      next: () => this.router.navigate(['/standup'], { queryParams: { github: 'connected' } }),
      error: (err) => {
        this.error = err?.error?.detail || 'Failed to connect GitHub. Please try again.';
      },
    });
  }

  retry() {
    this.router.navigate(['/standup']);
  }
}
