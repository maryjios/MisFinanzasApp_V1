import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { BottomNavComponent } from '../../components/bottom-nav/bottom-nav.component';
import { FinanceService } from '../../services/finance.service';

@Component({ standalone:true, imports:[CommonModule, IonicModule, RouterModule, BottomNavComponent], template:`
<ion-content><main class="phone-page">
  <div class="header-row"><button class="icon-btn" routerLink="/dashboard"><ion-icon name="arrow-back-outline"></ion-icon></button><h1 class="header-title">Reportes</h1><button class="icon-btn"><ion-icon name="filter-outline"></ion-icon></button></div>
  <section class="content-pad">
    <div class="tabs"><button class="tab" [class.active]="tab==='resumen'" (click)="tab='resumen'">Resumen</button><button class="tab" [class.active]="tab==='gastos'" (click)="tab='gastos'">Gastos</button><button class="tab" [class.active]="tab==='ingresos'" (click)="tab='ingresos'">Ingresos</button></div>
    <div class="row" style="justify-content:center;margin-bottom:26px"><b>{{ selectedMonthLabel }}</b><ion-icon name="chevron-down-outline"></ion-icon></div>
    <h3 class="section-title">Resumen mensual</h3>
    <div class="card" style="margin-top:10px" *ngIf="summary.count === 0">
      <p class="muted" style="margin:0">Aún no hay datos suficientes para generar reportes.</p>
    </div>
    <div class="card" *ngIf="summary.count > 0" style="margin-top:10px">
      <div class="row"><b>Ingresos</b><b class="amount-green">{{ formatCurrency(summary.income) }}</b></div>
      <div class="row" style="margin-top:8px"><b>Gastos</b><b class="amount-red">{{ formatCurrency(summary.expense) }}</b></div>
      <div class="row" style="margin-top:8px"><b>Balance</b><b [class]="summary.balance >= 0 ? 'amount-green' : 'amount-red'">{{ formatCurrency(summary.balance) }}</b></div>
    </div>

    <h3 class="section-title" *ngIf="tab !== 'ingresos' && expenseByCategory.length > 0">Distribución de gastos</h3>
    <div class="card" *ngIf="tab !== 'ingresos' && expenseByCategory.length > 0">
      <div class="row dashboard-chart-wrap">
        <div class="pie" [style.background]="pieGradient"></div>
        <div class="legend">
          <div *ngFor="let item of expenseByCategory"><span class="dot" [style.background]="item.color"></span>{{ item.category }} ({{ item.percent }}%)</div>
        </div>
      </div>
    </div>

    <h3 class="section-title" *ngIf="tab !== 'gastos' && lastMonths.length > 0">Comparativo mensual</h3>
    <div class="card" *ngIf="tab !== 'gastos' && lastMonths.length > 0">
      <div class="bar-chart">
        <div class="bar-pair" *ngFor="let month of lastMonths">
          <div class="bar" style="background:#0b8f2a" [style.height.%]="month.incomePercent"></div>
          <div class="bar" style="background:#ee1b1b" [style.height.%]="month.expensePercent"></div>
        </div>
      </div>
      <div class="row" style="margin-top:10px;font-size:12px"><span *ngFor="let month of lastMonths">{{ month.label }}</span></div>
    </div>
  </section>
  <app-bottom-nav active="presupuestos"></app-bottom-nav>
</main></ion-content>` })
export class ReportsPage {
  tab: 'resumen' | 'gastos' | 'ingresos' = 'resumen';
  summary = { income: 0, expense: 0, balance: 0, count: 0 };
  expenseByCategory: Array<{ category: string; amount: number; percent: number; color: string }> = [];
  pieGradient = 'conic-gradient(#169a39 0 100%)';
  lastMonths: Array<{ label: string; incomePercent: number; expensePercent: number }> = [];
  selectedMonth = this.currentMonthKey();
  private readonly currency = 'COP';
  private chartColors = ['#169a39', '#3368cc', '#ff8b17', '#8b39c8', '#1b9c78', '#ee1b1b'];
  private dataSubscription?: Subscription;

  constructor(private finance: FinanceService) {}

  ionViewWillEnter() {
    this.alignToLatestMovementMonth();
    this.reloadReportData();
    this.dataSubscription?.unsubscribe();
    this.dataSubscription = this.finance.dataChanged$.subscribe(() => {
      this.alignToLatestMovementMonth();
      this.reloadReportData();
    });
  }

  ionViewDidLeave() {
    this.dataSubscription?.unsubscribe();
    this.dataSubscription = undefined;
  }

  formatCurrency(value: number): string {
    try {
      return new Intl.NumberFormat('es-CO', { style: 'currency', currency: this.currency, maximumFractionDigits: 0 }).format(value);
    } catch {
      return `$ ${value.toFixed(0)}`;
    }
  }

  get selectedMonthLabel(): string {
    const [yearText, monthText] = this.selectedMonth.split('-');
    const year = Number(yearText);
    const month = Number(monthText);
    if (!year || !month) return 'Mes actual';

    const labels = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return `${labels[month - 1]} ${year}`;
  }

  private reloadReportData() {
    this.summary = this.finance.getMonthlySummary(this.selectedMonth);
    this.buildCategoryChart();
    this.buildMonthlyBars();
  }

  private buildCategoryChart() {
    const expenses = this.finance
      .getMovements()
      .filter(m => m.type === 'expense' && this.extractMonthKey(m.date) === this.selectedMonth);
    const total = expenses.reduce((sum, item) => sum + item.amount, 0);
    if (!total) {
      this.expenseByCategory = [];
      return;
    }

    const grouped = new Map<string, number>();
    for (const item of expenses) {
      grouped.set(item.category, (grouped.get(item.category) || 0) + item.amount);
    }

    const parts = [...grouped.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, amount], index) => ({
        category,
        amount,
        percent: Math.max(1, Math.round((amount / total) * 100)),
        color: this.chartColors[index % this.chartColors.length]
      }));

    // Armamos el conic-gradient en porcentajes acumulados.
    let start = 0;
    const segments: string[] = [];
    for (const item of parts) {
      const end = start + item.percent;
      segments.push(`${item.color} ${start}% ${end}%`);
      start = end;
    }
    if (start < 100) segments.push(`#d9e5db ${start}% 100%`);

    this.expenseByCategory = parts;
    this.pieGradient = `conic-gradient(${segments.join(', ')})`;
  }

  private buildMonthlyBars() {
    const movements = this.finance.getMovements();
    const monthKeys: string[] = [];
    for (let i = 2; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      monthKeys.push(this.currentMonthKey(d));
    }

    const monthly = monthKeys.map(key => {
      const list = movements.filter(m => this.extractMonthKey(m.date) === key);
      const income = list.filter(m => m.type === 'income').reduce((sum, m) => sum + m.amount, 0);
      const expense = list.filter(m => m.type === 'expense').reduce((sum, m) => sum + m.amount, 0);
      return { key, income, expense };
    });

    const maxValue = Math.max(1, ...monthly.map(m => Math.max(m.income, m.expense)));
    this.lastMonths = monthly.map(m => ({
      label: m.key.slice(5),
      incomePercent: Math.round((m.income / maxValue) * 100),
      expensePercent: Math.round((m.expense / maxValue) * 100)
    }));
  }

  private alignToLatestMovementMonth() {
    const latest = this.finance.getMovements()[0];
    if (!latest) {
      this.selectedMonth = this.currentMonthKey();
      return;
    }

    const key = this.extractMonthKey(latest.date);
    this.selectedMonth = key || this.currentMonthKey();
  }

  private currentMonthKey(base = new Date()): string {
    return `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, '0')}`;
  }

  private extractMonthKey(value: string): string {
    const text = value.trim();

    const isoDate = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoDate) {
      const month = Number(isoDate[2]);
      if (month >= 1 && month <= 12) return `${isoDate[1]}-${isoDate[2]}`;
    }

    const isoMonth = text.match(/^(\d{4})-(\d{2})$/);
    if (isoMonth) {
      const month = Number(isoMonth[2]);
      if (month >= 1 && month <= 12) return `${isoMonth[1]}-${isoMonth[2]}`;
    }

    const slashDate = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (slashDate) {
      const day = Number(slashDate[1]);
      const month = Number(slashDate[2]);
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        return `${slashDate[3]}-${String(month).padStart(2, '0')}`;
      }
    }

    const parsed = new Date(text);
    if (!Number.isNaN(parsed.getTime())) {
      return this.currentMonthKey(parsed);
    }

    return '';
  }
}
