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
    .auth-container { min-height:100vh; background:#080a12; display:flex; align-items:center; justify-content:center; font-family:'IBM Plex Mono',monospace; }
    .auth-card { background:#12141f; border:1px solid #1e2130; border-radius:16px; padding:48px 40px; width:100%; max-width:460px; }
    .brand { color:#7c6fff; font-size:22px; font-weight:700; margin-bottom:24px; }
    h2 { color:#e8e8f0; font-size:24px; font-weight:700; margin:0 0 4px; font-family:'Syne',sans-serif; }
    .subtitle { color:#4a5070; font-size:13px; margin:0 0 28px; }
    .error-msg { background:#2a1020; border:1px solid #5a2030; color:#ff7090; padding:12px; border-radius:8px; font-size:12px; margin-bottom:20px; }
    .row-2 { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
    .field { margin-bottom:18px; }
    label { display:block; color:#4a5070; font-size:11px; letter-spacing:1px; margin-bottom:8px; }
    input { width:100%; background:#0d0f14; border:1px solid #1e2130; border-radius:8px; padding:12px 14px; color:#c8c8e0; font-family:'IBM Plex Mono',monospace; font-size:13px; outline:none; box-sizing:border-box; transition:border-color 0.15s; }
    input:focus { border-color:#7c6fff; }
    .btn-primary { width:100%; background:#7c6fff; color:#fff; border:none; border-radius:10px; padding:14px; font-family:'IBM Plex Mono',monospace; font-size:13px; font-weight:700; cursor:pointer; letter-spacing:1px; margin-top:4px; transition:opacity 0.2s; }
    .btn-primary:disabled { opacity:0.5; cursor:not-allowed; }
    .link-row { text-align:center; color:#4a5070; font-size:12px; margin-top:20px; }
    a { color:#7c6fff; text-decoration:none; }
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
