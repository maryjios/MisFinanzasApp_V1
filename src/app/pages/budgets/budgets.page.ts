import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { BottomNavComponent } from '../../components/bottom-nav/bottom-nav.component';
import { FinanceService } from '../../services/finance.service';

@Component({
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, RouterModule, BottomNavComponent],
  template: `
  <ion-content><main class="phone-page">
    <div class="header-row"><button class="icon-btn" routerLink="/dashboard"><ion-icon name="arrow-back-outline"></ion-icon></button><h1 class="header-title">Mis presupuestos</h1><button class="icon-btn" type="button" (click)="saveBudget()"><ion-icon name="add-outline"></ion-icon></button></div>
    <section class="content-pad">
      <div class="card" style="padding:14px;margin-bottom:14px">
        <h3 class="section-title" style="margin-top:0">Registrar presupuesto</h3>
        <label class="label" style="margin-top:0">Categoría</label>
        <div class="input-box"><ion-icon name="pricetag-outline"></ion-icon><select [(ngModel)]="category"><option value="" disabled>Selecciona una categoría</option><option *ngFor="let item of categories" [value]="item">{{ item }}</option></select></div>
        <div class="row" style="margin-top:8px;gap:8px"><div class="input-box" style="flex:1"><input [(ngModel)]="newCategory" placeholder="Nueva categoría"></div><button class="btn-outline" style="width:130px;min-height:46px" (click)="addCategory()">Agregar</button></div>
        <label class="label">Límite mensual</label>
        <div class="input-box"><b>$</b><input [(ngModel)]="limit" type="text" inputmode="numeric" autocomplete="off" placeholder="Ingresa el límite"></div>
        <label class="label">Mes</label>
        <div class="row" style="gap:8px">
          <div class="input-box" style="flex:1"><ion-icon name="calendar-outline"></ion-icon><select [(ngModel)]="selectedMonth" (ngModelChange)="loadBudgets()"><option *ngFor="let month of monthOptions" [ngValue]="month.value">{{ month.label }}</option></select></div>
          <div class="input-box" style="width:130px"><select [(ngModel)]="selectedYear" (ngModelChange)="loadBudgets()"><option *ngFor="let year of yearOptions" [ngValue]="year">{{ year }}</option></select></div>
        </div>
        <button class="btn-primary" type="button" style="margin-top:18px" (click)="saveBudget()">Guardar presupuesto</button>
        <div *ngIf="message" class="alert" [class.ok]="messageOk" style="margin-top:14px;margin-bottom:0">{{ message }}</div>
      </div>

      <div class="card" style="padding:10px 14px;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between">
        <button class="icon-btn" type="button" (click)="changeMonth(-1)" aria-label="Mes anterior"><ion-icon name="chevron-back-outline"></ion-icon></button>
        <b style="font-size:20px">{{ selectedMonthLabel }}</b>
        <button class="icon-btn" type="button" (click)="changeMonth(1)" aria-label="Mes siguiente"><ion-icon name="chevron-forward-outline"></ion-icon></button>
      </div>

      <div class="card" style="margin-bottom:14px" *ngIf="budgets.length === 0">
        <p class="muted" style="margin:0">Aún no has registrado presupuestos para este mes.</p>
      </div>

      <div class="card" style="padding:12px 12px 10px;margin-bottom:12px" *ngFor="let item of budgets">
        <div class="row" style="align-items:flex-start;gap:12px">
          <div [style.background]="item.color" style="width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff"><ion-icon [name]="item.icon" style="font-size:22px"></ion-icon></div>
          <div style="flex:1">
            <div class="row" style="align-items:flex-start;gap:8px">
              <b>{{ item.category }}</b>
              <b>{{ item.values }}</b>
            </div>
            <div class="progress" style="margin-top:8px;background:#edf0ee"><span [style.width.%]="item.progressPercent" [style.background]="item.color"></span></div>
            <div class="row" style="margin-top:8px;gap:8px">
              <span [style.color]="item.statusColor" style="font-weight:700">{{ item.status }}</span>
              <b>{{ item.percent }}%</b>
            </div>
          </div>
        </div>
      </div>
    </section>
    <app-bottom-nav active="presupuestos"></app-bottom-nav>
  </main></ion-content>
  `
})
export class BudgetsPage {
  category = '';
  limit: string | number = '';
  selectedMonth = new Date().getMonth() + 1;
  selectedYear = new Date().getFullYear();
  yearOptions: number[] = [];
  readonly monthOptions = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' }
  ];
  newCategory = '';
  categories: string[] = [];
  budgets: Array<{
    category: string;
    limit: number;
    used: number;
    percent: number;
    progressPercent: number;
    values: string;
    status: string;
    statusColor: string;
    icon: string;
    color: string;
  }> = [];
  message = '';
  messageOk = false;
  private readonly currency = 'COP';
  private dataSubscription?: Subscription;

  constructor(private finance: FinanceService) {
    this.configureYearOptions();
    this.dataSubscription = this.finance.dataChanged$.subscribe(() => {
      this.alignToLatestMovementMonth();
      this.refreshCategories();
      this.loadBudgets();
    });
  }

  ionViewWillEnter() {
    this.useCurrentMonth();
    this.alignToLatestMovementMonth();
    this.configureYearOptions();
    this.refreshCategories();
    this.loadBudgets();
  }

  ngOnDestroy() {
    this.dataSubscription?.unsubscribe();
  }

  async addCategory() {
    const createdName = this.newCategory.trim();
    const ok = await this.finance.addCustomCategory(createdName);
    this.message = ok ? 'Categoría agregada correctamente.' : 'No se pudo agregar la categoría.';
    this.messageOk = ok;
    if (ok) {
      this.newCategory = '';
      this.refreshCategories();
      this.category = createdName;
    }
  }

  saveBudget() {
    try {
      const month = this.getSelectedMonth();
      const limit = this.parseMoneyValue(this.limit);
      if (!this.category || !month || !limit || limit <= 0) {
        this.message = 'Completa categoría, límite y mes con valores válidos.';
        this.messageOk = false;
        return;
      }

      this.finance.saveBudget(this.category, limit, month);
      this.message = 'Presupuesto guardado correctamente.';
      this.messageOk = true;
      this.limit = '';
      this.loadBudgets();
    } catch {
      this.message = 'No se pudo guardar el presupuesto. Intenta de nuevo.';
      this.messageOk = false;
    }
  }

  formatCurrency(value: number): string {
    try {
      return new Intl.NumberFormat('es-CO', { style: 'currency', currency: this.currency, maximumFractionDigits: 0 }).format(value);
    } catch {
      return `$ ${value.toFixed(0)}`;
    }
  }

  private refreshCategories() {
    this.categories = this.finance.getCategories('expense');
    if (!this.category && this.categories.length > 0) {
      this.category = this.categories[0];
    }
  }

  loadBudgets() {
    const month = this.getSelectedMonth();
    const budgets = this.finance.getBudgets(month);
    const progress = new Map(
      this.finance.getBudgetProgress(month).map(item => [this.categoryKey(item.category), item])
    );

    this.budgets = budgets.map(item => {
      const current = progress.get(this.categoryKey(item.category));
      const percent = current?.percent ?? 0;
      const style = this.getCategoryStyle(item.category);
      const status = this.getBudgetStatus(percent);
      return {
        category: item.category,
        limit: item.limit,
        used: current?.used ?? 0,
        percent,
        progressPercent: Math.max(0, Math.min(100, percent)),
        values: `${this.formatCurrency(current?.used ?? 0)} / ${this.formatCurrency(item.limit)}`,
        status: status.text,
        statusColor: status.color,
        icon: style.icon,
        color: style.color
      };
    });
  }

  changeMonth(offset: number) {
    const base = new Date(this.selectedYear, this.selectedMonth - 1, 1);
    base.setMonth(base.getMonth() + offset);
    this.selectedYear = base.getFullYear();
    this.selectedMonth = base.getMonth() + 1;
    this.configureYearOptions();
    this.loadBudgets();
  }

  get selectedMonthLabel(): string {
    const monthLabel = this.monthOptions.find(item => item.value === this.selectedMonth)?.label || 'Mes';
    return `${monthLabel} de ${this.selectedYear}`;
  }

  private getSelectedMonth(): string {
    return `${this.selectedYear}-${String(this.selectedMonth).padStart(2, '0')}`;
  }

  private useCurrentMonth() {
    const now = new Date();
    this.selectedMonth = now.getMonth() + 1;
    this.selectedYear = now.getFullYear();
  }

  private alignToLatestMovementMonth() {
    const latest = this.finance.getMovements()[0];
    if (!latest) return;

    const monthMatch = latest.date.match(/^(\d{4})-(\d{2})/);
    if (!monthMatch) return;

    const monthKey = `${monthMatch[1]}-${monthMatch[2]}`;
    if (this.finance.getBudgets(monthKey).length === 0) return;

    this.selectedYear = Number(monthMatch[1]);
    this.selectedMonth = Number(monthMatch[2]);
    this.configureYearOptions();
  }

  private getBudgetStatus(percent: number): { text: string; color: string } {
    if (percent >= 100) {
      return { text: 'Presupuesto agotado', color: '#ee1b1b' };
    }
    if (percent >= 80) {
      return { text: 'Cerca del limite', color: '#ff8b17' };
    }
    return { text: 'Dentro del limite', color: '#0b8f2a' };
  }

  private getCategoryStyle(category: string): { icon: string; color: string } {
    const key = category.trim().toLowerCase();
    if (key.includes('aliment')) return { icon: 'restaurant', color: '#ee1b1b' };
    if (key.includes('transport')) return { icon: 'car', color: '#3368cc' };
    if (key.includes('entreten')) return { icon: 'game-controller', color: '#7b30c4' };
    if (key.includes('ahorro')) return { icon: 'wallet', color: '#169a39' };
    if (key.includes('salud')) return { icon: 'heart', color: '#ff8b17' };
    return { icon: 'pricetag-outline', color: '#0b8f2a' };
  }

  private categoryKey(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private configureYearOptions() {
    const current = new Date().getFullYear();
    const start = Math.min(current - 1, this.selectedYear - 1);
    const end = Math.max(current + 2, this.selectedYear + 1);
    const years: number[] = [];
    for (let year = start; year <= end; year++) {
      years.push(year);
    }
    this.yearOptions = years;
  }

  private parseMoneyValue(value: string | number | null | undefined): number {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : 0;
    }

    const text = String(value ?? '').trim();
    if (!text) return 0;

    const normalized = text
      .replace(/\s+/g, '')
      .replace(/\.(?=\d{3}(\D|$))/g, '')
      .replace(/,(?=\d{3}(\D|$))/g, '')
      .replace(',', '.');

    const parsed = Number(normalized.replace(/[^0-9.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }
}
