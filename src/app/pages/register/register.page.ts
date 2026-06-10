import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';

@Component({
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, RouterModule],
  template: `
  <ion-content>
    <main class="phone-page">
      <div class="header-row"><button class="icon-btn" routerLink="/login"><ion-icon name="arrow-back-outline"></ion-icon></button><span></span></div>
      <img src="assets/logo.svg" class="logo" alt="MisFinanzasApp logo" />
      <section class="brand">
        <h1>MisFinanzas<span>App</span></h1>
        <p>Controla tus finanzas,<br>alcanza tus metas</p>
      </section>
      <section class="form-wrap">
        <h2 class="form-title">Crea tu cuenta</h2>
        <p class="form-subtitle">Completa tus datos para comenzar</p>
        <div *ngIf="message" class="alert">{{ message }}</div>

        <label class="label">Nombre completo</label>
        <div class="input-box"><ion-icon name="person-outline"></ion-icon><input [(ngModel)]="name" placeholder="Ingresa tu nombre"></div>

        <label class="label">Correo electrónico</label>
        <div class="input-box"><ion-icon name="mail-outline"></ion-icon><input [(ngModel)]="email" type="email" placeholder="Ingresa tu correo"></div>

        <label class="label">Contraseña</label>
        <div class="input-box"><ion-icon name="lock-closed-outline"></ion-icon><input [(ngModel)]="password" [type]="showPassword ? 'text' : 'password'" placeholder="••••••••"><ion-icon (click)="showPassword=!showPassword" name="eye-off-outline"></ion-icon></div>
        <div class="row"><small class="muted">Mínimo 6 caracteres</small><small style="color:#ff8b17;font-weight:700">Seguridad: Media</small></div>

        <label class="label">Confirmar contraseña</label>
        <div class="input-box"><ion-icon name="lock-closed-outline"></ion-icon><input [(ngModel)]="confirm" [type]="showPassword ? 'text' : 'password'" placeholder="••••••••"></div>

        <label style="display:flex;gap:10px;align-items:center;margin:16px 0 20px"><input type="checkbox" [(ngModel)]="terms"> Acepto los <b style="color:#0b8f2a">Términos y condiciones</b></label>
        <button class="btn-primary" (click)="register()">Crear cuenta</button>
        <p class="switch-link">¿Ya tienes una cuenta? <a routerLink="/login">Inicia sesión</a></p>
      </section>
      <div class="wave"></div>
    </main>
  </ion-content>
  `
})
export class RegisterPage {
  name = '';
  email = '';
  password = '';
  confirm = '';
  terms = true;
  showPassword = false;
  message = '';

  constructor(private auth: AuthService, private router: Router) {}

  register() {
    if (!this.name || !this.email || !this.password) { this.message = 'Completa todos los campos obligatorios.'; return; }
    if (this.password.length < 6) { this.message = 'La contraseña debe tener mínimo 6 caracteres.'; return; }
    if (this.password !== this.confirm) { this.message = 'Las contraseñas no coinciden.'; return; }
    if (!this.terms) { this.message = 'Debes aceptar los términos y condiciones.'; return; }
    this.auth.register({ name: this.name, email: this.email, password: this.password });
    this.router.navigateByUrl('/dashboard');
  }
}
