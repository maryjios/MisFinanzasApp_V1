import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { BottomNavComponent } from '../../components/bottom-nav/bottom-nav.component';
import { AuthService } from '../../services/auth.service';
import { FinanceService } from '../../services/finance.service';

@Component({ standalone:true, imports:[CommonModule, FormsModule, IonicModule, RouterModule, BottomNavComponent], template:`
<ion-content><main class="phone-page">
  <div class="header-row"><button class="icon-btn" routerLink="/dashboard"><ion-icon name="arrow-back-outline"></ion-icon></button><h1 class="header-title">Configuración</h1><span></span></div>
  <section class="content-pad">
    <div class="row" style="justify-content:flex-start;margin:10px 0 24px"><div class="round-icon" style="width:54px;height:54px;background:#0b8f2a"><ion-icon name="person"></ion-icon></div><div><h2 style="margin:0;font-size:18px">{{name}}</h2><small class="muted">{{email}}</small></div></div>
    <h3 class="section-title">Preferencias</h3>
    <div class="card" style="padding:14px">
      <label class="label" style="margin-top:0">Moneda</label>
      <div class="input-box"><input value="Peso colombiano (COP)" disabled></div>
      <label class="label">Día de corte mensual</label>
      <div class="input-box"><input [(ngModel)]="cutoffDay" type="number" min="1" max="31"></div>
      <label style="display:flex;gap:10px;align-items:center;margin:14px 0"><input type="checkbox" [(ngModel)]="notificationsEnabled"> Activar notificaciones</label>
      <button class="btn-primary" (click)="saveSettings()">Guardar preferencias</button>
      <div *ngIf="message" class="alert" [class.ok]="messageOk" style="margin-bottom:0">{{ message }}</div>
    </div>

    <h3 class="section-title">Categorías personalizadas</h3>
    <div class="card" style="padding:14px">
      <div class="row" style="gap:8px"><div class="input-box" style="flex:1"><input [(ngModel)]="newCategory" placeholder="Nueva categoría"></div><button class="btn-outline" style="width:130px;min-height:46px" (click)="addCategory()">Agregar</button></div>
      <p class="muted" style="margin:10px 0 0" *ngIf="customCategories.length === 0">No hay categorías personalizadas.</p>
      <div style="margin-top:10px" *ngIf="customCategories.length > 0"><small class="muted">{{ customCategories.join(', ') }}</small></div>
    </div>

    <h3 class="section-title">Cuenta</h3>
    <div class="card" style="padding:0"><div class="list-card"><b>Cambiar contraseña</b><span>›</span></div><button (click)="logout()" style="width:100%;border:0;background:white;color:#ee1b1b;text-align:left;padding:16px;font-weight:800">Cerrar sesión <ion-icon name="log-out-outline" style="float:right"></ion-icon></button></div>
    <p class="text-center muted" style="margin-top:50px">Versión 1.0.0</p>
  </section><app-bottom-nav active="mas"></app-bottom-nav>
</main></ion-content>` })
export class SettingsPage {
  user = this.auth.getUser();
  name = this.user?.name || 'Usuario';
  email = this.user?.email || 'Sin correo registrado';
  cutoffDay = 30;
  notificationsEnabled = true;
  newCategory = '';
  customCategories: string[] = [];
  message = '';
  messageOk = false;

  constructor(private auth: AuthService, private router: Router, private finance: FinanceService) {}

  ionViewWillEnter() {
    const settings = this.finance.getSettings();
    this.cutoffDay = settings.cutoffDay;
    this.notificationsEnabled = settings.notificationsEnabled;
    this.refreshCustomCategories();
  }

  saveSettings() {
    if (this.cutoffDay < 1 || this.cutoffDay > 31) {
      this.message = 'El día de corte debe estar entre 1 y 31.';
      this.messageOk = false;
      return;
    }
    this.finance.saveSettings({
      currency: 'COP',
      cutoffDay: this.cutoffDay,
      notificationsEnabled: this.notificationsEnabled
    });
    this.message = 'Preferencias guardadas.';
    this.messageOk = true;
  }

  addCategory() {
    const ok = this.finance.addCustomCategory(this.newCategory);
    this.message = ok ? 'Categoría personalizada agregada.' : 'No se pudo agregar la categoría.';
    this.messageOk = ok;
    if (ok) {
      this.newCategory = '';
      this.refreshCustomCategories();
    }
  }

  logout() {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }

  private refreshCustomCategories() {
    const base = ['Alimentacion', 'Transporte', 'Entretenimiento', 'Ahorro', 'Salario', 'Freelance', 'Venta'];
    const all = [...new Set([...this.finance.getCategories('expense'), ...this.finance.getCategories('income')])];
    this.customCategories = all.filter(c => !base.includes(c));
  }
}
