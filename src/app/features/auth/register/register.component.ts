import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="brand">◈ MeetAI</div>
        <h2>Create your account</h2>
        <p class="subtitle">Start turning meetings into action</p>
        <div *ngIf="error" class="error-msg">{{ error }}</div>
        <form (ngSubmit)="onSubmit()">
          <div class="row-2">
            <div class="field">
              <label>First Name</label>
              <input type="text" [(ngModel)]="firstName" name="firstName" placeholder="Jane" />
            </div>
            <div class="field">
              <label>Last Name</label>
              <input type="text" [(ngModel)]="lastName" name="lastName" placeholder="Doe" />
            </div>
          </div>
          <div class="field">
            <label>Email</label>
            <input type="email" [(ngModel)]="email" name="email" required placeholder="you@example.com" />
          </div>
          <div class="field">
            <label>Password</label>
            <input type="password" [(ngModel)]="password" name="password" required placeholder="Min 8 characters" />
          </div>
          <div class="field">
            <label>Confirm Password</label>
            <input type="password" [(ngModel)]="passwordConfirm" name="passwordConfirm" required placeholder="Repeat password" />
          </div>
          <button type="submit" [disabled]="loading" class="btn-primary">
            {{ loading ? 'Creating account...' : 'Create Account' }}
          </button>
        </form>
        <p class="link-row">Already have an account? <a routerLink="/auth/login">Sign in</a></p>
      </div>
    </div>
  `,
  styles: [`
    .auth-container { min-height:100vh; background:var(--bg); display:flex; align-items:center; justify-content:center; font-family:var(--sans); }
    .auth-card { background:var(--surface); border:1px solid var(--border); border-radius:16px; padding:48px 40px; width:100%; max-width:460px; }
    .brand { color:var(--accent); font-size:22px; font-weight:700; margin-bottom:24px; font-family:var(--mono); }
    h2 { color:var(--text); font-size:24px; font-weight:600; margin:0 0 4px; font-family:var(--sans); }
    .subtitle { color:var(--muted); font-size:13px; margin:0 0 28px; }
    .error-msg { background:var(--accent-dim); border:1px solid rgba(255,59,92,0.3); color:var(--accent); padding:12px; border-radius:8px; font-size:12px; margin-bottom:20px; }
    .row-2 { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
    .field { margin-bottom:18px; }
    label { display:block; color:var(--muted); font-size:11px; letter-spacing:1px; margin-bottom:8px; font-family:var(--mono); }
    input { width:100%; background:var(--bg); border:1px solid var(--border); border-radius:8px; padding:12px 14px; color:var(--text); font-family:var(--sans); font-size:13px; outline:none; box-sizing:border-box; transition:border-color 0.15s; }
    input:focus { border-color:var(--accent); }
    .btn-primary { width:100%; background:var(--accent); color:#fff; border:none; border-radius:9px; padding:14px; font-family:var(--sans); font-size:13px; font-weight:600; cursor:pointer; letter-spacing:0.3px; margin-top:4px; transition:background 0.15s; }
    .btn-primary:hover { background:#ff1f42; }
    .btn-primary:disabled { opacity:0.4; cursor:not-allowed; }
    .link-row { text-align:center; color:var(--muted); font-size:12px; margin-top:20px; }
    a { color:var(--accent); text-decoration:none; }
  `],
})
export class RegisterComponent {
  firstName = '';
  lastName = '';
  email = '';
  password = '';
  passwordConfirm = '';
  loading = false;
  error = '';

  constructor(private auth: AuthService, private router: Router) { }

  onSubmit() {
    if (this.password !== this.passwordConfirm) {
      this.error = 'Passwords do not match.';
      return;
    }
    this.loading = true;
    this.error = '';
    this.auth
      .register(this.email, this.password, this.passwordConfirm, this.firstName, this.lastName)
      .subscribe({
        next: () => this.router.navigate(['/facilities']),
        error: (err) => {
          this.error = JSON.stringify(err?.error) || 'Registration failed.';
          this.loading = false;
        },
      });
  }
}
