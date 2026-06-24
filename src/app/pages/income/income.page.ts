import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { FinanceService } from '../../services/finance.service';

@Component({ standalone: true, imports: [CommonModule, IonicModule, FormsModule, RouterModule], template: `
<ion-content><main class="phone-page">
  <div class="header-row"><button class="icon-btn" routerLink="/dashboard"><ion-icon name="arrow-back-outline"></ion-icon></button><h1 class="header-title">Nuevo ingreso</h1><span></span></div>
  <section class="form-wrap" style="padding-top:20px">
    <div style="width:82px;height:82px;border-radius:50%;background:#e8f8eb;display:flex;align-items:center;justify-content:center;margin:0 auto 30px"><ion-icon name="download-outline" style="font-size:46px;color:#0b8f2a"></ion-icon></div>
    <label class="label">Monto</label><div class="input-box"><b>$</b><input [(ngModel)]="amount" placeholder="Ingresa el monto"></div>
    <label class="label">Categoría</label><div class="input-box"><ion-icon name="cash-outline"></ion-icon><select [(ngModel)]="category"><option value="" disabled>Selecciona una categoría</option><option *ngFor="let item of categories" [value]="item">{{ item }}</option></select></div>
    <div class="row" style="margin-top:8px;gap:8px"><div class="input-box" style="flex:1"><input [(ngModel)]="newCategory" placeholder="Nueva categoría"></div><button class="btn-outline" style="width:130px;min-height:46px" (click)="addCategory()">Agregar</button></div>
    <label class="label">Fecha</label><div class="input-box"><ion-icon name="calendar-outline"></ion-icon><input [(ngModel)]="date" type="date"></div>
    <small class="muted">{{ formattedDate }}</small>
    <label class="label">Descripción (opcional)</label><div class="input-box"><input [(ngModel)]="description" placeholder="Escribe una descripción"></div>
    <button class="btn-primary" style="margin-top:36px" (click)="save()">Guardar ingreso</button>
    <div *ngIf="message" class="alert" [class.ok]="messageOk">{{ message }}</div>
  </section>
</main></ion-content>` })
export class IncomePage {
  amount = '';
  category = '';
  date = this.localIsoDate();
  description = '';
  newCategory = '';
  categories: string[] = [];
  message = '';
  messageOk = false;

  constructor(private router: Router, private finance: FinanceService) {
    this.categories = this.finance.getCategories('income');
  }

  ionViewWillEnter() {
    this.categories = this.finance.getCategories('income');
    if (!this.category && this.categories.length > 0) {
      this.category = this.categories[0];
    }
  }

  async addCategory() {
    const createdName = this.newCategory.trim();
    const ok = await this.finance.addCustomCategory(createdName);
    this.message = ok ? 'Categoría agregada correctamente.' : 'No se pudo agregar la categoría.';
    this.messageOk = ok;
    if (ok) {
      this.newCategory = '';
      this.categories = this.finance.getCategories('income');
      this.category = createdName;
    }
  }

  save() {
    const amount = this.parseMoneyValue(this.amount);
    if (!amount || amount <= 0 || !this.category || !this.date) {
      this.message = 'Completa monto, categoría y fecha con valores válidos.';
      this.messageOk = false;
      return;
    }

    this.finance.addMovement({
      type: 'income',
      amount,
      category: this.category,
      date: this.date,
      description: this.description.trim()
    });

    this.message = 'Ingreso registrado correctamente.';
    this.messageOk = true;
    setTimeout(() => this.router.navigateByUrl('/dashboard'), 500);
  }

  get formattedDate(): string {
    return this.finance.formatDateDisplay(this.date);
  }

  private localIsoDate(date = new Date()): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  private parseMoneyValue(value: string): number {
    const text = value.trim();
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
