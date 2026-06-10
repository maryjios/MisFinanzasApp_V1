import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { BottomNavComponent } from '../../components/bottom-nav/bottom-nav.component';
import { AuthService } from '../../services/auth.service';
import { FinanceService, Movement } from '../../services/finance.service';

@Component({
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule, BottomNavComponent],
  template: `
  <ion-content>
    <main class="phone-page">
      <div class="header-row dashboard-header">
        <button class="icon-btn" routerLink="/side-menu" aria-label="Abrir menú">
          <ion-icon name="menu-outline"></ion-icon>
        </button>
        <h1 class="dashboard-title">MisFinanzasApp</h1>
        <button class="icon-btn" routerLink="/notifications" aria-label="Ver notificaciones">
          <ion-icon name="notifications-outline"></ion-icon>
        </button>
      </div>

      <section class="content-pad dashboard-content">
        <h2 class="hello-title">Hola, {{ name }} 👋</h2>

        <div class="green-card dashboard-balance-card">
          <div class="row">
            <span class="balance-label">Balance disponible</span>
            <ion-icon name="eye-outline" class="balance-eye"></ion-icon>
          </div>
          <h1 class="balance-value">{{ formatCurrency(summary.balance) }}</h1>
        </div>

        <div class="grid-2 dashboard-summary-cards">
          <div class="card dashboard-stat-card">
            <b>Ingresos</b>
            <div class="row">
              <h2 class="stat-value">{{ formatCurrency(summary.income) }}</h2>
              <ion-icon name="arrow-up-circle-outline" class="stat-icon income"></ion-icon>
            </div>
          </div>
          <div class="card dashboard-stat-card">
            <b>Gastos</b>
            <div class="row">
              <h2 class="stat-value">{{ formatCurrency(summary.expense) }}</h2>
              <ion-icon name="arrow-down-circle-outline" class="stat-icon expense"></ion-icon>
            </div>
          </div>
        </div>

        <h3 class="section-title">Resumen del mes</h3>

        <div class="card" *ngIf="recent.length === 0">
          <p class="muted" style="margin:0">Aún no tienes movimientos registrados este mes.</p>
        </div>
        <div class="list-card" *ngFor="let movement of recent">
          <div class="round-icon" [style.background]="movement.type === 'income' ? '#e8f8eb' : '#ffe7e7'" [style.color]="movement.type === 'income' ? '#0b8f2a' : '#ee1b1b'">
            <ion-icon [name]="movement.type === 'income' ? 'add-circle' : 'remove-circle'"></ion-icon>
          </div>
          <div style="flex:1">
            <b>{{ movement.category }}</b><br>
            <small class="muted">{{ movement.description || 'Sin descripción' }}</small>
          </div>
          <div [class]="movement.type === 'income' ? 'amount-green' : 'amount-red'">
            {{ formatAmount(movement) }}
          </div>
        </div>

        <h3 class="section-title">Accesos rápidos</h3>
        
        <div class="quick-grid">
          <a class="quick dashboard-quick" routerLink="/income"><ion-icon name="add-circle"></ion-icon>Ingreso</a>
          <a class="quick dashboard-quick red" routerLink="/expense"><ion-icon name="remove-circle"></ion-icon>Gasto</a>
          <a class="quick dashboard-quick" routerLink="/budgets"><ion-icon name="wallet"></ion-icon>Presupuestos</a>
          <a class="quick dashboard-quick" routerLink="/reports"><ion-icon name="bar-chart"></ion-icon>Reportes</a>
        </div>
      </section>

      <app-bottom-nav active="inicio"></app-bottom-nav>
    </main>
  </ion-content>
  `
})
export class DashboardPage {
  name = this.auth.currentName().split(' ')[0] || 'Usuario';
  summary = { income: 0, expense: 0, balance: 0, count: 0 };
  recent: Movement[] = [];
  private readonly currency = 'COP';

  constructor(private auth: AuthService, private finance: FinanceService) {}

  ionViewWillEnter() {
    this.summary = this.finance.getMonthlySummary();
    this.recent = this.finance.getMovements().slice(0, 5);
  }

  formatCurrency(value: number): string {
    try {
      return new Intl.NumberFormat('es-CO', { style: 'currency', currency: this.currency, maximumFractionDigits: 0 }).format(value);
    } catch {
      return `$ ${value.toFixed(0)}`;
    }
  }

  formatAmount(movement: Movement): string {
    const sign = movement.type === 'income' ? '+' : '-';
    return `${sign} ${this.formatCurrency(movement.amount)}`;
  }
}
