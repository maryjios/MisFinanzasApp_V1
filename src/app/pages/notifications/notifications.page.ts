import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { BottomNavComponent } from '../../components/bottom-nav/bottom-nav.component';
import { AppNotification, FinanceService } from '../../services/finance.service';

@Component({ standalone:true, imports:[CommonModule, IonicModule, RouterModule, BottomNavComponent], template:`
<ion-content><main class="phone-page">
  <div class="header-row"><span></span><h1 class="header-title">Notificaciones</h1><button class="icon-btn"><ion-icon name="settings-outline"></ion-icon></button></div>
  <section class="content-pad">
    <div class="tabs"><button class="tab" [class.active]="tab==='all'" (click)="setTab('all')">Todas</button><button class="tab" [class.active]="tab==='alert'" (click)="setTab('alert')">Alertas</button><button class="tab" [class.active]="tab==='info'" (click)="setTab('info')">Información</button></div>
    <div class="card" *ngIf="notis.length === 0" style="margin-bottom:12px">
      <p class="muted" style="margin:0">No tienes notificaciones por ahora.</p>
    </div>
    <div class="card" *ngFor="let n of notis" style="margin-bottom:12px">
      <div class="row" style="align-items:flex-start"><div class="round-icon" [style.background]="n.color"><ion-icon [name]="n.icon"></ion-icon></div><div style="flex:1"><b>{{n.title}}</b><p style="margin:5px 0">{{n.text}}</p><small class="muted">{{n.time}}</small></div><ion-icon name="ellipsis-horizontal"></ion-icon></div>
    </div>
  </section><app-bottom-nav active="mas"></app-bottom-nav>
</main></ion-content>` })
export class NotificationsPage {
  notis: Array<{title: string; text: string; time: string; color: string; icon: string;}> = [];
  tab: 'all' | 'alert' | 'info' = 'all';

  constructor(private finance: FinanceService) {}

  ionViewWillEnter() {
    this.loadNotifications();
  }

  setTab(value: 'all' | 'alert' | 'info') {
    this.tab = value;
    this.loadNotifications();
  }

  private loadNotifications() {
    const all = this.finance.getNotifications();
    const filtered = this.tab === 'all' ? all : all.filter(item => item.type === this.tab);
    this.notis = filtered.map(item => this.toView(item));
  }

  private toView(item: AppNotification) {
    return {
      title: item.title,
      text: item.text,
      time: this.finance.formatDateDisplay(item.createdAt),
      color: item.type === 'alert' ? '#ffe7e7' : '#e8f8eb',
      icon: item.type === 'alert' ? 'warning-outline' : 'information-outline'
    };
  }
}
