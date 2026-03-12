import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IntegrationService } from '../../core/services/integration.service';

@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="callback-page">
      <div class="callback-card">
        <div class="brand">◈ MeetAI</div>

        <div class="state-icon" [class.success]="state() === 'success'" [class.error]="state() === 'error'">
          <span *ngIf="state() === 'loading'" class="spin">⟳</span>
          <span *ngIf="state() === 'success'">✓</span>
          <span *ngIf="state() === 'error'">✗</span>
        </div>

        <div class="state-title">{{ title() }}</div>
        <div class="state-sub">{{ subtitle() }}</div>

        <div class="progress-bar" *ngIf="state() === 'loading'">
          <div class="progress-fill"></div>
        </div>

        <div *ngIf="state() === 'error'" class="error-box">{{ errorMsg() }}</div>

        <div *ngIf="state() !== 'loading'" class="redirect-note">
          Redirecting you shortly...
        </div>
      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&family=Syne:wght@700;800&display=swap');

    .callback-page {
      min-height:100vh; background:#080a12;
      display:flex; align-items:center; justify-content:center;
      font-family:'IBM Plex Mono',monospace;
    }
    .callback-card {
      background:#0f1120; border:1px solid #1a1d30;
      border-radius:20px; padding:52px 48px;
      text-align:center; width:100%; max-width:400px;
    }
    .brand { color:#7c6fff; font-size:18px; font-weight:700; margin-bottom:36px; }

    .state-icon {
      width:72px; height:72px; border-radius:50%; background:#141628;
      border:2px solid #2a2a50; display:flex; align-items:center; justify-content:center;
      margin:0 auto 24px; font-size:28px; color:#5a607c;
      transition:all 0.3s;
    }
    .state-icon.success { background:#1a2a1a; border-color:#2a4a2a; color:#6ddf8a; }
    .state-icon.error { background:#1e0e18; border-color:#4a2030; color:#ff7090; }

    .spin { display:inline-block; animation:spin 1s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }

    .state-title { color:#d0d0e8; font-size:18px; font-weight:700; font-family:'Syne',sans-serif; margin-bottom:8px; }
    .state-sub { color:#3d4160; font-size:12px; line-height:1.7; }

    .progress-bar { background:#1a1d30; border-radius:4px; height:3px; overflow:hidden; margin:24px 0 0; }
    .progress-fill { height:100%; background:#7c6fff; border-radius:4px; animation:progress 2s ease-in-out infinite; }
    @keyframes progress { 0%{width:0%;margin-left:0} 50%{width:60%;margin-left:20%} 100%{width:0%;margin-left:100%} }

    .error-box { background:#1e0e18; border:1px solid #4a2030; color:#ff7090; border-radius:8px; padding:12px 16px; font-size:12px; margin-top:20px; }
    .redirect-note { color:#252840; font-size:11px; margin-top:24px; }
  `],
})
export class OAuthCallbackComponent implements OnInit {
  state = signal<'loading' | 'success' | 'error'>('loading');
  title = signal('Connecting...');
  subtitle = signal('Exchanging authorization tokens with the provider.');
  errorMsg = signal('');

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private integrationService: IntegrationService,
  ) {}

  ngOnInit() {
    const code = this.route.snapshot.queryParamMap.get('code');
    const provider = this.route.snapshot.paramMap.get('provider') as 'google' | 'microsoft';
    const providerName = provider === 'google' ? 'Google' : 'Microsoft';

    this.title.set(`Connecting ${providerName}...`);

    if (!code) {
      this.state.set('error');
      this.title.set('Connection Cancelled');
      this.subtitle.set('No authorization code was received from the provider.');
      this.errorMsg.set('Authorization was denied or cancelled.');
      setTimeout(() => this.router.navigate(['/integrations']), 2500);
      return;
    }

    const call$ = provider === 'google'
      ? this.integrationService.googleCallback(code)
      : this.integrationService.microsoftCallback(code);

    call$.subscribe({
      next: (res: any) => {
        this.state.set('success');
        this.title.set(`${providerName} Connected!`);
        this.subtitle.set(res.email ? `Signed in as ${res.email}` : 'Your account has been linked successfully.');
        setTimeout(() => this.router.navigate(['/meetings/upload']), 1500);
      },
      error: (err: any) => {
        this.state.set('error');
        this.title.set('Connection Failed');
        this.subtitle.set('Something went wrong while connecting your account.');
        this.errorMsg.set(err?.error?.detail || 'Token exchange failed. Please try again.');
        setTimeout(() => this.router.navigate(['/integrations']), 3000);
      },
    });
  }
}
