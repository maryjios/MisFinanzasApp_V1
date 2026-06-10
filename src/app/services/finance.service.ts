import { Injectable } from '@angular/core';

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
  private readonly expenseModuleEnabled = false;
  private readonly budgetsModuleEnabled = false;

  constructor() {
    this.removeDisabledModuleData();
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
  }

  getCategories(type: MovementType): string[] {
    const custom = this.getCustomCategories();
    if (type === 'income') {
      return [...this.incomeCategories, ...custom].sort((a, b) => a.localeCompare(b));
    }
    return [...this.defaultCategories, ...custom].sort((a, b) => a.localeCompare(b));
  }

  addCustomCategory(name: string): boolean {
    const value = name.trim();
    if (!value) return false;
    const current = this.getCustomCategories();
    if (current.some(c => c.toLowerCase() === value.toLowerCase())) return false;
    const next = [...current, value].sort((a, b) => a.localeCompare(b));
    localStorage.setItem(this.categoriesKey, JSON.stringify(next));
    return true;
  }

  getMovements(): Movement[] {
    const raw = localStorage.getItem(this.movementKey);
    if (!raw) return [];
    try {
      return (JSON.parse(raw) as Movement[]).sort((a, b) => b.date.localeCompare(a.date));
    } catch {
      return [];
    }
  }

  addMovement(payload: Omit<Movement, 'id'>): Movement {
    if (payload.type === 'expense' && !this.expenseModuleEnabled) {
      return { ...payload, id: 'disabled_expense' };
    }

    const item: Movement = { ...payload, id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}` };
    const current = this.getMovements();
    const next = [item, ...current];
    localStorage.setItem(this.movementKey, JSON.stringify(next));
    this.createBudgetAlertNotifications(item.date.slice(0, 7));
    return item;
  }

  getMonthlySummary(month = this.currentMonth()): { income: number; expense: number; balance: number; count: number } {
    const list = this.getMovements().filter(m => m.date.startsWith(month));
    const income = list.filter(m => m.type === 'income').reduce((sum, m) => sum + m.amount, 0);
    const expense = list.filter(m => m.type === 'expense').reduce((sum, m) => sum + m.amount, 0);
    return { income, expense, balance: income - expense, count: list.length };
  }

  getBudgets(month = this.currentMonth()): Budget[] {
    if (!this.budgetsModuleEnabled) return [];

    const raw = localStorage.getItem(this.budgetKey);
    if (!raw) return [];
    try {
      return (JSON.parse(raw) as Budget[])
        .filter(b => b.month === month)
        .sort((a, b) => a.category.localeCompare(b.category));
    } catch {
      return [];
    }
  }

  saveBudget(category: string, limit: number, month = this.currentMonth()): void {
    if (!this.budgetsModuleEnabled) return;

    const raw = localStorage.getItem(this.budgetKey);
    const all = raw ? (JSON.parse(raw) as Budget[]) : [];
    const trimmedCategory = category.trim();
    const existing = all.find(b => b.month === month && b.category.toLowerCase() === trimmedCategory.toLowerCase());
    if (existing) {
      existing.limit = limit;
    } else {
      all.push({ id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, category: trimmedCategory, limit, month });
    }
    localStorage.setItem(this.budgetKey, JSON.stringify(all));
    this.createBudgetAlertNotifications(month);
  }

  getBudgetProgress(month = this.currentMonth()): Array<{ category: string; limit: number; used: number; percent: number }> {
    if (!this.budgetsModuleEnabled) return [];

    const budgets = this.getBudgets(month);
    const expenses = this.getMovements().filter(m => m.type === 'expense' && m.date.startsWith(month));
    return budgets.map(b => {
      const used = expenses.filter(m => m.category.toLowerCase() === b.category.toLowerCase()).reduce((sum, m) => sum + m.amount, 0);
      const percent = b.limit > 0 ? Math.round((used / b.limit) * 100) : 0;
      return { category: b.category, limit: b.limit, used, percent };
    });
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
  }

  private getCustomCategories(): string[] {
    const raw = localStorage.getItem(this.categoriesKey);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as string[];
    } catch {
      return [];
    }
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
    return new Date().toISOString().slice(0, 7);
  }

  private wasAlreadyNotified(key: string): boolean {
    return localStorage.getItem(`misfinanzas_notice_${key}`) === '1';
  }

  private markNotified(key: string): void {
    localStorage.setItem(`misfinanzas_notice_${key}`, '1');
  }

  private removeDisabledModuleData(): void {
    if (!this.expenseModuleEnabled) {
      const onlyIncome = this.getMovements().filter(item => item.type === 'income');
      localStorage.setItem(this.movementKey, JSON.stringify(onlyIncome));
    }

    if (!this.budgetsModuleEnabled) {
      localStorage.removeItem(this.budgetKey);
    }
  }
}
