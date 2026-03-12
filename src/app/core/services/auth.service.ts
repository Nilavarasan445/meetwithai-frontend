import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError, throwError } from 'rxjs';
import { AuthResponse, User } from '../models/models';

const API = '/api/auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _user = signal<User | null>(this.loadUser());
  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => !!this._user());

  constructor(private http: HttpClient, private router: Router) {}

  private loadUser(): User | null {
    try {
      const data = localStorage.getItem('meetai_user');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  register(email: string, password: string, password_confirm: string,
           first_name: string, last_name: string) {
    return this.http.post<AuthResponse>(`${API}/register/`,
      { email, password, password_confirm, first_name, last_name }
    ).pipe(tap((res) => this.handleAuth(res)));
  }

  login(email: string, password: string) {
    return this.http.post<AuthResponse>(`${API}/login/`, { email, password })
      .pipe(tap((res) => this.handleAuth(res)));
  }

  logout() {
    const refresh = localStorage.getItem('meetai_refresh');
    if (refresh) {
      this.http.post(`${API}/logout/`, { refresh }).subscribe();
    }
    localStorage.removeItem('meetai_access');
    localStorage.removeItem('meetai_refresh');
    localStorage.removeItem('meetai_user');
    localStorage.removeItem('selectedFacility');
    this._user.set(null);
    this.router.navigate(['/auth/login']);
  }

  refreshToken() {
    const refresh = localStorage.getItem('meetai_refresh');
    if (!refresh) return throwError(() => new Error('No refresh token'));
    return this.http.post<{ access: string }>(`${API}/token/refresh/`, { refresh })
      .pipe(tap((res) => localStorage.setItem('meetai_access', res.access)));
  }

  getProfile() {
    return this.http.get<User>(`${API}/profile/`).pipe(
      tap((user) => {
        this._user.set(user);
        localStorage.setItem('meetai_user', JSON.stringify(user));
      })
    );
  }

  getAccessToken(): string | null {
    return localStorage.getItem('meetai_access');
  }

  private handleAuth(res: AuthResponse) {
    localStorage.setItem('meetai_access', res.tokens.access);
    localStorage.setItem('meetai_refresh', res.tokens.refresh);
    localStorage.setItem('meetai_user', JSON.stringify(res.user));
    this._user.set(res.user);
  }
}
