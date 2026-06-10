import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage) },
  { path: 'register', loadComponent: () => import('./pages/register/register.page').then(m => m.RegisterPage) },
  { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard.page').then(m => m.DashboardPage) },
  { path: 'income', loadComponent: () => import('./pages/income/income.page').then(m => m.IncomePage) },
  { path: 'expense', loadComponent: () => import('./pages/expense/expense.page').then(m => m.ExpensePage) },
  { path: 'budgets', loadComponent: () => import('./pages/budgets/budgets.page').then(m => m.BudgetsPage) },
  { path: 'reports', loadComponent: () => import('./pages/reports/reports.page').then(m => m.ReportsPage) },
  { path: 'transactions', loadComponent: () => import('./pages/transactions/transactions.page').then(m => m.TransactionsPage) },
  { path: 'notifications', loadComponent: () => import('./pages/notifications/notifications.page').then(m => m.NotificationsPage) },
  { path: 'settings', loadComponent: () => import('./pages/settings/settings.page').then(m => m.SettingsPage) },
  { path: 'side-menu', loadComponent: () => import('./pages/side-menu/side-menu.page').then(m => m.SideMenuPage) },
  { path: '**', redirectTo: 'login' }
];
