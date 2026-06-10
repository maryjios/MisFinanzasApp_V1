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
    <label class="label">Descripción (opcional)</label><div class="input-box"><input [(ngModel)]="description" placeholder="Escribe una descripción"></div>
    <button class="btn-primary" style="margin-top:36px" (click)="save()">Guardar ingreso</button>
    <div *ngIf="message" class="alert" [class.ok]="messageOk">{{ message }}</div>
  </section>
</main></ion-content>` })
export class IncomePage {
  amount = '';
  category = '';
  date = new Date().toISOString().slice(0, 10);
  description = '';
  newCategory = '';
  categories: string[] = [];
  message = '';
  messageOk = false;

  constructor(private router: Router, private finance: FinanceService) {
    this.categories = this.finance.getCategories('income');
  }

  addCategory() {
    const ok = this.finance.addCustomCategory(this.newCategory);
    this.message = ok ? 'Categoría agregada correctamente.' : 'No se pudo agregar la categoría.';
    this.messageOk = ok;
    if (ok) {
      this.newCategory = '';
      this.categories = this.finance.getCategories('income');
    }
  }

  save() {
    const amount = Number(this.amount);
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
}
