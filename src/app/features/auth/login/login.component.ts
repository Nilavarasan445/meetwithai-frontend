import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="brand">◈ MeetAI</div>
        <h2>Welcome back</h2>
        <p class="subtitle">Sign in to your account</p>

        <div *ngIf="error" class="error-msg">{{ error }}</div>

        <form (ngSubmit)="onSubmit()">
          <div class="field">
            <label>Email</label>
            <input type="email" [(ngModel)]="email" name="email" required placeholder="you@example.com" />
          </div>
          <div class="field">
            <label>Password</label>
            <input type="password" [(ngModel)]="password" name="password" required placeholder="••••••••" />
          </div>
          <button type="submit" [disabled]="loading" class="btn-primary">
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>
        <p class="link-row">No account? <a routerLink="/auth/register">Register</a></p>
      </div>
    </div>
  `,
  styles: [`
    .auth-container { min-height:100vh; background:#080a12; display:flex; align-items:center; justify-content:center; font-family:'IBM Plex Mono',monospace; }
    .auth-card { background:#12141f; border:1px solid #1e2130; border-radius:16px; padding:48px 40px; width:100%; max-width:420px; }
    .brand { color:#7c6fff; font-size:22px; font-weight:700; margin-bottom:24px; }
    h2 { color:#e8e8f0; font-size:24px; font-weight:700; margin:0 0 4px; font-family:'Syne',sans-serif; }
    .subtitle { color:#4a5070; font-size:13px; margin:0 0 32px; }
    .error-msg { background:#2a1020; border:1px solid #5a2030; color:#ff7090; padding:12px; border-radius:8px; font-size:12px; margin-bottom:20px; }
    .field { margin-bottom:20px; }
    label { display:block; color:#4a5070; font-size:11px; letter-spacing:1px; margin-bottom:8px; }
    input { width:100%; background:#0d0f14; border:1px solid #1e2130; border-radius:8px; padding:12px 14px; color:#c8c8e0; font-family:'IBM Plex Mono',monospace; font-size:13px; outline:none; box-sizing:border-box; transition:border-color 0.15s; }
    input:focus { border-color:#7c6fff; }
    .btn-primary { width:100%; background:#7c6fff; color:#fff; border:none; border-radius:10px; padding:14px; font-family:'IBM Plex Mono',monospace; font-size:13px; font-weight:700; cursor:pointer; letter-spacing:1px; margin-top:8px; transition:opacity 0.2s; }
    .btn-primary:disabled { opacity:0.5; cursor:not-allowed; }
    .link-row { text-align:center; color:#4a5070; font-size:12px; margin-top:20px; }
    a { color:#7c6fff; text-decoration:none; }
  `],
})
export class LoginComponent {
  email = '';
  password = '';
  loading = false;
  error = '';

  constructor(private auth: AuthService, private router: Router) { }

  onSubmit() {
    this.loading = true;
    this.error = '';
    this.auth.login(this.email, this.password).subscribe({
      next: () => this.router.navigate(['/facilities']),
      error: (err) => {
        this.error = err?.error?.non_field_errors?.[0] || 'Login failed. Please try again.';
        this.loading = false;
      },
    });
  }
}
