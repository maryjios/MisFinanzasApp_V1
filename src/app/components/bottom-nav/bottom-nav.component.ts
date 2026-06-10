import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [IonicModule, RouterModule],
  template: `
    <nav class="bottom-nav">
      <a class="nav-item" [class.active]="active==='inicio'" routerLink="/dashboard"><ion-icon name="home-outline"></ion-icon><span>Inicio</span></a>
      <a class="nav-item" [class.active]="active==='transacciones'" routerLink="/transactions"><ion-icon name="list-outline"></ion-icon><span>Transacciones</span></a>
      <a class="nav-item" routerLink="/income"><span class="nav-plus"><ion-icon name="add-outline"></ion-icon></span></a>
      <a class="nav-item" [class.active]="active==='presupuestos'" routerLink="/budgets"><ion-icon name="wallet-outline"></ion-icon><span>Presupuestos</span></a>
      <a class="nav-item" [class.active]="active==='mas'" routerLink="/settings"><ion-icon name="ellipsis-horizontal"></ion-icon><span>Más</span></a>
    </nav>
  `
})
export class BottomNavComponent { @Input() active = ''; }
