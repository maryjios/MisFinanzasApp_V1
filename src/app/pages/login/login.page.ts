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
      <img src="assets/logo.svg" class="logo" alt="MisFinanzasApp logo" />
      <section class="brand">
        <h1>MisFinanzas<span>App</span></h1>
        <p>Controla tus finanzas,<br>alcanza tus metas</p>
      </section>

      <section class="form-wrap">
        <h2 class="form-title">¡Bienvenido de vuelta!</h2>
        <p class="form-subtitle">Inicia sesión para continuar</p>

        <div *ngIf="message" class="alert" [class.ok]="messageOk">{{ message }}</div>

        <label class="label">Correo electrónico</label>
        <div class="input-box"><ion-icon name="mail-outline"></ion-icon><input [(ngModel)]="email" type="email" placeholder="Ingresa tu correo"></div>

        <label class="label">Contraseña</label>
        <div class="input-box"><ion-icon name="lock-closed-outline"></ion-icon><input [(ngModel)]="password" [type]="showPassword ? 'text' : 'password'" placeholder="••••••••"><ion-icon (click)="showPassword=!showPassword" name="eye-off-outline"></ion-icon></div>

        <a class="help-link">¿Olvidaste tu contraseña?</a>
        <button class="btn-primary" (click)="login()">Iniciar sesión</button>

        <div class="divider">o continúa con</div>
        <div class="social-row"><button class="social-btn">Google</button><button class="social-btn">Apple</button></div>
        <p class="switch-link">¿No tienes una cuenta? <a routerLink="/register">Regístrate</a></p>
      </section>
      <div class="wave"></div>
    </main>
  </ion-content>
  `
})
export class LoginPage {
  email = '';
  password = '';
  showPassword = false;
  message = '';
  messageOk = false;

  constructor(private auth: AuthService, private router: Router) {}

  ionViewWillEnter() {
    const user = this.auth.getUser();
    if (user) this.email = user.email;
  }

  login() {
    if (!this.email || !this.password) {
      this.message = 'Completa correo y contraseña para ingresar.';
      this.messageOk = false;
      return;
    }
    if (this.auth.login(this.email, this.password)) {
      this.message = 'Inicio de sesión correcto.';
      this.messageOk = true;
      this.router.navigateByUrl('/dashboard');
    } else {
      this.message = 'Usuario o contraseña incorrectos. Crea una cuenta si aún no estás registrada.';
      this.messageOk = false;
    }
  }
}
