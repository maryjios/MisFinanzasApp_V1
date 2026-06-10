import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { BottomNavComponent } from '../../components/bottom-nav/bottom-nav.component';
import { FinanceService, Movement, MovementType } from '../../services/finance.service';

@Component({ standalone:true, imports:[CommonModule, FormsModule, IonicModule, RouterModule, BottomNavComponent], template:`
<ion-content><main class="phone-page">
  <div class="header-row"><span></span><h1 class="header-title">Movimientos</h1><button class="icon-btn"><ion-icon name="search-outline"></ion-icon></button></div>
  <section class="content-pad">
    <div class="tabs"><button class="tab" [class.active]="typeFilter==='all'" (click)="setType('all')">Todos</button><button class="tab" [class.active]="typeFilter==='income'" (click)="setType('income')">Ingresos</button><button class="tab" [class.active]="typeFilter==='expense'" (click)="setType('expense')">Gastos</button></div>
    <div class="row" style="margin-bottom:12px;gap:8px;align-items:stretch">
      <div class="input-box" style="flex:1"><input [(ngModel)]="query" (ngModelChange)="applyFilters()" placeholder="Buscar por categoría o nota"></div>
      <div class="input-box" style="width:140px"><input [(ngModel)]="dateFilter" (ngModelChange)="applyFilters()" type="date"></div>
    </div>
    <div class="row" style="gap:8px;margin-bottom:14px">
      <div class="input-box" style="flex:1"><select [(ngModel)]="categoryFilter" (ngModelChange)="applyFilters()"><option value="">Todas las categorías</option><option *ngFor="let category of categories" [value]="category">{{ category }}</option></select></div>
      <button class="btn-outline" style="width:120px;min-height:46px" (click)="clearFilters()">Limpiar</button>
    </div>
    <div class="card" *ngIf="movements.length === 0">
      <p class="muted" style="margin:0">Aún no tienes movimientos registrados.</p>
    </div>
    <div class="list-card" *ngFor="let movement of movements">
      <div class="round-icon" [style.background]="movement.bg" [style.color]="movement.color"><ion-icon [name]="movement.icon"></ion-icon></div>
      <div style="flex:1"><b>{{ movement.title }}</b><br><small>{{ movement.type }}</small></div>
      <div [class]="movement.isIncome ? 'amount-green' : 'amount-red'">{{ movement.amount }}<br><small class="muted">{{ movement.time }}</small></div>
    </div>
    <button class="btn-primary" routerLink="/income" style="width:54px;height:54px;border-radius:50%;position:absolute;right:28px;bottom:86px"><ion-icon name="add-outline" style="font-size:30px"></ion-icon></button>
  </section>
  <app-bottom-nav active="transacciones"></app-bottom-nav>
</main></ion-content>` })
export class TransactionsPage {
  movements: Array<{ title: string; type: string; amount: string; time: string; icon: string; color: string; bg: string; isIncome: boolean; }> = [];
  categories: string[] = [];
  query = '';
  dateFilter = '';
  categoryFilter = '';
  typeFilter: 'all' | MovementType = 'all';
  private readonly currency = 'COP';

  constructor(private finance: FinanceService) {}

  ionViewWillEnter() {
    this.categories = [...new Set(this.finance.getMovements().map(m => m.category))].sort((a, b) => a.localeCompare(b));
    this.applyFilters();
  }

  setType(type: 'all' | MovementType) {
    this.typeFilter = type;
    this.applyFilters();
  }

  clearFilters() {
    this.query = '';
    this.dateFilter = '';
    this.categoryFilter = '';
    this.typeFilter = 'all';
    this.applyFilters();
  }

  applyFilters() {
    const q = this.query.trim().toLowerCase();
    // Filtro combinado: tipo, fecha, categoria y texto libre.
    const list = this.finance.getMovements().filter(m => {
      if (this.typeFilter !== 'all' && m.type !== this.typeFilter) return false;
      if (this.dateFilter && m.date !== this.dateFilter) return false;
      if (this.categoryFilter && m.category !== this.categoryFilter) return false;
      if (!q) return true;
      return m.category.toLowerCase().includes(q) || m.description.toLowerCase().includes(q);
    });

    this.movements = list.map(m => this.toView(m));
  }

  private toView(movement: Movement) {
    const isIncome = movement.type === 'income';
    return {
      title: movement.category,
      type: isIncome ? 'Ingreso' : 'Gasto',
      amount: `${isIncome ? '+' : '-'} ${this.formatCurrency(movement.amount)}`,
      time: movement.date,
      icon: isIncome ? 'add-circle' : 'remove-circle',
      color: isIncome ? '#0b8f2a' : '#ee1b1b',
      bg: isIncome ? '#e8f8eb' : '#ffe7e7',
      isIncome
    };
  }

  private formatCurrency(value: number): string {
    try {
      return new Intl.NumberFormat('es-CO', { style: 'currency', currency: this.currency, maximumFractionDigits: 0 }).format(value);
    } catch {
      return `$ ${value.toFixed(0)}`;
    }
  }
}
