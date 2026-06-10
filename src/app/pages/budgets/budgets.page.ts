import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { BottomNavComponent } from '../../components/bottom-nav/bottom-nav.component';

@Component({ standalone:true, imports:[CommonModule, IonicModule, RouterModule, BottomNavComponent], template:`
<ion-content><main class="phone-page">
  <div class="header-row"><button class="icon-btn" routerLink="/dashboard"><ion-icon name="arrow-back-outline"></ion-icon></button><h1 class="header-title">Mis presupuestos</h1><button class="icon-btn" type="button"><ion-icon name="add-outline"></ion-icon></button></div>
  <section class="content-pad">
    <div class="card" style="padding:12px 12px 10px;margin-bottom:12px" *ngFor="let item of budgets">
      <div class="row" style="align-items:flex-start;gap:12px">
        <div style="width:42px;height:42px;border:1px solid #d8d8d8;border-radius:10px;display:flex;align-items:center;justify-content:center"><ion-icon [name]="item.icon" style="font-size:22px"></ion-icon></div>
        <div style="flex:1">
          <b>{{ item.name }}</b>
          <div style="font-weight:700;margin-top:2px">{{ item.values }}</div>
          <div class="progress" style="margin-top:8px"><span [style.width.%]="item.percent" style="background:#0b8f2a"></span></div>
        </div>
        <b style="padding-top:4px">{{ item.percent }}%</b>
      </div>
    </div>

    <div class="card" style="margin-bottom:14px" *ngIf="budgets.length === 0">
      <p class="muted" style="margin:0">Sin presupuestos registrados.</p>
    </div>

    <div class="card" style="padding:0;border-radius:12px">
      <button class="btn-outline" type="button" style="border:0;border-radius:12px;min-height:52px;display:flex;align-items:center;justify-content:center;gap:8px">
        <ion-icon name="add-outline"></ion-icon>
        CREAR PRESUPUESTO
      </button>
    </div>
  </section>
  <app-bottom-nav active="presupuestos"></app-bottom-nav>
</main></ion-content>` })
export class BudgetsPage {
  budgets: Array<{ name: string; values: string; percent: number; icon: string }> = [];
}
