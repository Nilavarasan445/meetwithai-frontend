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
    .auth-container { min-height:100vh; background:var(--bg); display:flex; align-items:center; justify-content:center; font-family:var(--sans); }
    .auth-card { background:var(--surface); border:1px solid var(--border); border-radius:16px; padding:48px 40px; width:100%; max-width:420px; }
    .brand { color:var(--accent); font-size:22px; font-weight:700; margin-bottom:24px; font-family:var(--mono); }
    h2 { color:var(--text); font-size:24px; font-weight:600; margin:0 0 4px; font-family:var(--sans); }
    .subtitle { color:var(--muted); font-size:13px; margin:0 0 32px; }
    .error-msg { background:var(--accent-dim); border:1px solid rgba(255,59,92,0.3); color:var(--accent); padding:12px; border-radius:8px; font-size:12px; margin-bottom:20px; }
    .field { margin-bottom:20px; }
    label { display:block; color:var(--muted); font-size:11px; letter-spacing:1px; margin-bottom:8px; font-family:var(--mono); }
    input { width:100%; background:var(--bg); border:1px solid var(--border); border-radius:8px; padding:12px 14px; color:var(--text); font-family:var(--sans); font-size:13px; outline:none; box-sizing:border-box; transition:border-color 0.15s; }
    input:focus { border-color:var(--accent); }
    .btn-primary { width:100%; background:var(--accent); color:#fff; border:none; border-radius:9px; padding:14px; font-family:var(--sans); font-size:13px; font-weight:600; cursor:pointer; letter-spacing:0.3px; margin-top:8px; transition:background 0.15s; }
    .btn-primary:hover { background:#ff1f42; }
    .btn-primary:disabled { opacity:0.4; cursor:not-allowed; }
    .link-row { text-align:center; color:var(--muted); font-size:12px; margin-top:20px; }
    a { color:var(--accent); text-decoration:none; }
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
