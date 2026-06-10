import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';

@Component({ standalone: true, imports: [CommonModule, IonicModule, FormsModule, RouterModule], template: `
<ion-content><main class="phone-page">
  <div class="header-row"><button class="icon-btn" routerLink="/dashboard"><ion-icon name="arrow-back-outline"></ion-icon></button><h1 class="header-title">Nuevo gasto</h1><span></span></div>
  <section class="form-wrap" style="padding-top:20px">
    <div style="width:82px;height:82px;border-radius:50%;background:#ffe5e5;display:flex;align-items:center;justify-content:center;margin:0 auto 30px"><ion-icon name="arrow-up-outline" style="font-size:46px;color:#ee1b1b"></ion-icon></div>
    <div class="card">
      <p style="margin:0 0 8px"><b>Funcionalidad no incluida en esta entrega.</b></p>
      <p class="muted" style="margin:0">El registro de gastos queda planificado para la siguiente iteración.</p>
    </div>
  </section>
</main></ion-content>` })
export class ExpensePage {}
