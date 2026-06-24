import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { Subject } from 'rxjs';

export type MovementType = 'income' | 'expense';

export interface Movement {
  id: string;
  type: MovementType;
  amount: number;
  category: string;
  date: string;
  description: string;
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  month: string;
}

export interface AppNotification {
  id: string;
  title: string;
  text: string;
  type: 'alert' | 'info';
  createdAt: string;
}

export interface AppSettings {
  currency: string;
  cutoffDay: number;
  notificationsEnabled: boolean;
}

@Injectable({ providedIn: 'root' })
export class FinanceService {
  private readonly movementKey = 'misfinanzas_movements';
  private readonly budgetKey = 'misfinanzas_budgets';
  private readonly categoriesKey = 'misfinanzas_categories';
  private readonly notificationsKey = 'misfinanzas_notifications';
  private readonly settingsKey = 'misfinanzas_settings';

  private readonly defaultCategories = ['Alimentacion', 'Transporte', 'Entretenimiento', 'Ahorro'];
  private readonly incomeCategories = ['Salario', 'Freelance', 'Venta', 'Ahorro'];
  private readonly expenseModuleEnabled = true;
  private readonly budgetsModuleEnabled = true;
  private readonly dataChanged = new Subject<void>();

  readonly dataChanged$ = this.dataChanged.asObservable();

  constructor() {
    void this.hydrateCategoriesFromNative();
  }

  getSettings(): AppSettings {
    const raw = localStorage.getItem(this.settingsKey);
    if (!raw) {
      return { currency: 'COP', cutoffDay: 30, notificationsEnabled: true };
    }
    try {
      const parsed = JSON.parse(raw) as AppSettings;
      return {
        currency: 'COP',
        cutoffDay: parsed.cutoffDay ?? 30,
        notificationsEnabled: parsed.notificationsEnabled ?? true
      };
    } catch {
      return { currency: 'COP', cutoffDay: 30, notificationsEnabled: true };
    }
  }

  saveSettings(settings: AppSettings): void {
    localStorage.setItem(this.settingsKey, JSON.stringify({
      currency: 'COP',
      cutoffDay: settings.cutoffDay,
      notificationsEnabled: settings.notificationsEnabled
    }));
    this.notifyDataChanged();
  }

  getCategories(type: MovementType): string[] {
    const custom = this.getCustomCategories();
    if (type === 'income') {
      return this.uniqueCategoryList([...this.incomeCategories, ...custom]);
    }
    return this.uniqueCategoryList([...this.defaultCategories, ...custom]);
  }

  async addCustomCategory(name: string): Promise<boolean> {
    const value = this.cleanCategoryName(name);
    if (!value) return false;
    const current = this.getCustomCategories();
    if (current.some(c => this.normalizeCategoryKey(c) === this.normalizeCategoryKey(value))) return false;
    const next = this.uniqueCategoryList([...current, value]);
    localStorage.setItem(this.categoriesKey, JSON.stringify(next));
    await this.persistCategoriesToNative(next);
    this.notifyDataChanged();
    return true;
  }

  getMovements(): Movement[] {
    const raw = localStorage.getItem(this.movementKey);
    if (!raw) return [];
    try {
      return (JSON.parse(raw) as Movement[])
        .sort((a, b) => this.toTimestamp(b.date) - this.toTimestamp(a.date));
    } catch {
      return [];
    }
  }

  addMovement(payload: Omit<Movement, 'id'>): Movement {
    if (payload.type === 'expense' && !this.expenseModuleEnabled) {
      return { ...payload, id: 'disabled_expense' };
    }

    const item: Movement = {
      ...payload,
      date: this.normalizeDateValue(payload.date),
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    };
    const current = this.getMovements();
    const next = [item, ...current];
    localStorage.setItem(this.movementKey, JSON.stringify(next));
    this.createBudgetAlertNotifications(this.toMonthKey(item.date) || this.currentMonth());
    this.notifyDataChanged();
    return item;
  }

  getMonthlySummary(month = this.currentMonth()): { income: number; expense: number; balance: number; count: number } {
    const monthKey = this.toMonthKey(month);
    const list = this.getMovements().filter(m => this.toMonthKey(m.date) === monthKey);
    const income = list.filter(m => m.type === 'income').reduce((sum, m) => sum + m.amount, 0);
    const expense = list.filter(m => m.type === 'expense').reduce((sum, m) => sum + m.amount, 0);
    return { income, expense, balance: income - expense, count: list.length };
  }

  getGlobalSummary(): { income: number; expense: number; balance: number; count: number } {
    const list = this.getMovements();
    const income = list.filter(m => m.type === 'income').reduce((sum, m) => sum + m.amount, 0);
    const expense = list.filter(m => m.type === 'expense').reduce((sum, m) => sum + m.amount, 0);
    return { income, expense, balance: income - expense, count: list.length };
  }

  getBudgets(month = this.currentMonth()): Budget[] {
    if (!this.budgetsModuleEnabled) return [];

    const monthKey = this.toMonthKey(month);
    const raw = localStorage.getItem(this.budgetKey);
    if (!raw) return [];
    try {
      return (JSON.parse(raw) as Budget[])
        .filter(b => this.toMonthKey(b.month) === monthKey)
        .sort((a, b) => a.category.localeCompare(b.category));
    } catch {
      return [];
    }
  }

  saveBudget(category: string, limit: number, month = this.currentMonth()): void {
    if (!this.budgetsModuleEnabled) return;

    const monthKey = this.toMonthKey(month);
    if (!monthKey) return;

    const raw = localStorage.getItem(this.budgetKey);
    const all = raw ? (JSON.parse(raw) as Budget[]) : [];
    const trimmedCategory = this.cleanCategoryName(category);
    const targetCategoryKey = this.normalizeCategoryKey(trimmedCategory);
    const existing = all.find(b => this.toMonthKey(b.month) === monthKey && this.normalizeCategoryKey(b.category) === targetCategoryKey);
    if (existing) {
      existing.limit = limit;
      existing.month = monthKey;
    } else {
      all.push({ id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, category: trimmedCategory, limit, month: monthKey });
    }
    localStorage.setItem(this.budgetKey, JSON.stringify(all));
    this.createBudgetAlertNotifications(monthKey);
    this.notifyDataChanged();
  }

  getBudgetProgress(month = this.currentMonth()): Array<{ category: string; limit: number; used: number; percent: number }> {
    if (!this.budgetsModuleEnabled) return [];

    const monthKey = this.toMonthKey(month);
    const budgets = this.getBudgets(month);
    const expenses = this.getMovements().filter(m => m.type === 'expense' && this.toMonthKey(m.date) === monthKey);
    return budgets.map(b => {
      const budgetCategoryKey = this.normalizeCategoryKey(b.category);
      const used = expenses
        .filter(m => this.normalizeCategoryKey(m.category) === budgetCategoryKey)
        .reduce((sum, m) => sum + m.amount, 0);
      const percent = b.limit > 0 ? Math.round((used / b.limit) * 100) : 0;
      return { category: b.category, limit: b.limit, used, percent };
    });
  }

  formatDateDisplay(value: string): string {
    const text = value.trim();
    const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;

    const normalized = this.normalizeDateValue(text);
    const normalizedIso = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (normalizedIso) return `${normalizedIso[3]}/${normalizedIso[2]}/${normalizedIso[1]}`;

    return text;
  }

  getNotifications(): AppNotification[] {
    const raw = localStorage.getItem(this.notificationsKey);
    if (!raw) return [];
    try {
      return (JSON.parse(raw) as AppNotification[]).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } catch {
      return [];
    }
  }

  addNotification(title: string, text: string, type: 'alert' | 'info' = 'info'): void {
    const current = this.getNotifications();
    const item: AppNotification = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      title,
      text,
      type,
      createdAt: new Date().toISOString()
    };
    localStorage.setItem(this.notificationsKey, JSON.stringify([item, ...current]));
    this.notifyDataChanged();
  }

  private getCustomCategories(): string[] {
    const raw = localStorage.getItem(this.categoriesKey);
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw) as unknown;
      const normalized = this.normalizeStoredCategoryData(parsed);
      const next = this.uniqueCategoryList(normalized);
      if (JSON.stringify(next) !== raw) {
        localStorage.setItem(this.categoriesKey, JSON.stringify(next));
        void this.persistCategoriesToNative(next);
      }
      return next;
    } catch {
      // Compatibilidad con datos heredados guardados como texto plano o CSV.
      const fallback = this.uniqueCategoryList(raw.split(',').map(item => this.cleanCategoryName(item)));
      if (fallback.length > 0) {
        localStorage.setItem(this.categoriesKey, JSON.stringify(fallback));
        void this.persistCategoriesToNative(fallback);
      }
      return fallback;
    }
  }

  private async hydrateCategoriesFromNative(): Promise<void> {
    try {
      const { value } = await Preferences.get({ key: this.categoriesKey });
      if (!value) return;

      const local = this.getCustomCategories();
      const native = this.parseNativeCategories(value);
      const merged = this.uniqueCategoryList([...local, ...native]);

      if (merged.length === 0) return;
      if (JSON.stringify(merged) === JSON.stringify(local)) return;

      localStorage.setItem(this.categoriesKey, JSON.stringify(merged));
      this.notifyDataChanged();
    } catch {
      // Ignora fallas de lectura nativa y mantiene localStorage como respaldo.
    }
  }

  private async persistCategoriesToNative(categories: string[]): Promise<void> {
    try {
      await Preferences.set({ key: this.categoriesKey, value: JSON.stringify(categories) });
    } catch {
      // Ignora fallas de escritura nativa y mantiene localStorage como respaldo.
    }
  }

  private parseNativeCategories(value: string): string[] {
    try {
      const parsed = JSON.parse(value) as unknown;
      return this.uniqueCategoryList(this.normalizeStoredCategoryData(parsed));
    } catch {
      return this.uniqueCategoryList(value.split(',').map(item => this.cleanCategoryName(item)));
    }
  }

  private normalizeStoredCategoryData(value: unknown): string[] {
    if (!Array.isArray(value)) return [];

    const list: string[] = [];
    for (const item of value) {
      if (typeof item === 'string') {
        list.push(this.cleanCategoryName(item));
      }
    }
    return list;
  }

  private uniqueCategoryList(list: string[]): string[] {
    const map = new Map<string, string>();
    for (const item of list) {
      const clean = this.cleanCategoryName(item);
      if (!clean) continue;
      const key = this.normalizeCategoryKey(clean);
      if (!map.has(key)) map.set(key, clean);
    }
    return [...map.values()].sort((a, b) => a.localeCompare(b));
  }

  private cleanCategoryName(value: string): string {
    return value.trim().replace(/\s+/g, ' ');
  }

  private normalizeCategoryKey(value: string): string {
    return this.cleanCategoryName(value)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private createBudgetAlertNotifications(month = this.currentMonth()): void {
    const settings = this.getSettings();
    if (!settings.notificationsEnabled) return;

    const progress = this.getBudgetProgress(month);
    for (const item of progress) {
      // Evita repetir la misma alerta del mes/categoria en cada guardado.
      if (item.percent >= 100) {
        const key = `${month}_${item.category}_100`;
        if (!this.wasAlreadyNotified(key)) {
          this.addNotification('Presupuesto agotado', `Llegaste al 100% del presupuesto de ${item.category}.`, 'alert');
          this.markNotified(key);
        }
      } else if (item.percent >= 80) {
        const key = `${month}_${item.category}_80`;
        if (!this.wasAlreadyNotified(key)) {
          this.addNotification('Alerta de presupuesto', `Ya consumiste el ${item.percent}% de ${item.category}.`, 'alert');
          this.markNotified(key);
        }
      }
    }
  }

  private currentMonth(): string {
    return this.localIsoDate().slice(0, 7);
  }

  private wasAlreadyNotified(key: string): boolean {
    return localStorage.getItem(`misfinanzas_notice_${key}`) === '1';
  }

  private markNotified(key: string): void {
    localStorage.setItem(`misfinanzas_notice_${key}`, '1');
  }

  private notifyDataChanged(): void {
    this.dataChanged.next();
  }

  private toMonthKey(value: string): string {
    const normalizedDate = this.normalizeDateValue(value);
    const isoDate = normalizedDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoDate) {
      const year = Number(isoDate[1]);
      const month = Number(isoDate[2]);
      const day = Number(isoDate[3]);
      if (this.isValidDateParts(year, month, day)) {
        return `${isoDate[1]}-${isoDate[2]}`;
      }
    }

    const isoMonth = value.trim().match(/^(\d{4})-(\d{2})$/);
    if (isoMonth) {
      const month = Number(isoMonth[2]);
      if (month >= 1 && month <= 12) {
        return `${isoMonth[1]}-${isoMonth[2]}`;
      }
    }

    return '';
  }

  private normalizeDateValue(value: string): string {
    const text = value.trim();

    const isoDate = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoDate) {
      const year = Number(isoDate[1]);
      const month = Number(isoDate[2]);
      const day = Number(isoDate[3]);

      if (this.isValidDateParts(year, month, day)) {
        return `${isoDate[1]}-${isoDate[2]}-${isoDate[3]}`;
      }

      // Recupera fechas guardadas por error como YYYY-DD-MM.
      if (this.isValidDateParts(year, day, month)) {
        return `${year}-${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}`;
      }
    }

    const slashDate = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (slashDate) {
      const first = Number(slashDate[1]);
      const second = Number(slashDate[2]);
      const year = slashDate[3];

      let day = first;
      let month = second;

      // Si la segunda parte es > 12, viene como MM/DD/YYYY.
      if (second > 12 && first <= 12) {
        day = second;
        month = first;
      }

      if (!this.isValidDateParts(Number(year), month, day)) {
        return text;
      }

      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    const parsed = new Date(text);
    if (!Number.isNaN(parsed.getTime())) {
      return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
    }

    return text;
  }

  private toTimestamp(value: string): number {
    const normalized = this.normalizeDateValue(value);
    const parsed = new Date(normalized);
    return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
  }

  private isValidDateParts(year: number, month: number, day: number): boolean {
    if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;

    const test = new Date(year, month - 1, day);
    return test.getFullYear() === year && test.getMonth() === month - 1 && test.getDate() === day;
  }

  private localIsoDate(date = new Date()): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
}
