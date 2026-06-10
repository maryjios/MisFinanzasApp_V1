import { Injectable } from '@angular/core';

export interface AppUser {
  name: string;
  email: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly userKey = 'misfinanzas_user';
  private readonly sessionKey = 'misfinanzas_session';

  register(user: AppUser): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
    localStorage.setItem(this.sessionKey, JSON.stringify({ email: user.email, name: user.name }));
  }

  login(email: string, password: string): boolean {
    const user = this.getUser();
    if (!user) return false;
    const ok = user.email.trim().toLowerCase() === email.trim().toLowerCase() && user.password === password;
    if (ok) localStorage.setItem(this.sessionKey, JSON.stringify({ email: user.email, name: user.name }));
    return ok;
  }

  logout(): void {
    localStorage.removeItem(this.sessionKey);
  }

  getUser(): AppUser | null {
    const raw = localStorage.getItem(this.userKey);
    return raw ? JSON.parse(raw) as AppUser : null;
  }

  currentName(): string {
    const raw = localStorage.getItem(this.sessionKey);
    if (raw) return (JSON.parse(raw) as {name:string}).name || 'Usuario';
    return this.getUser()?.name || 'Usuario';
  }
}
