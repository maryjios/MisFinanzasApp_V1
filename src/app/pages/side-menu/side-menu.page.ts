import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';

@Component({ standalone:true, imports:[IonicModule, RouterModule], template:`
<ion-content><main class="phone-page" style="background:#f8fff9">
  <section style="background:#eaf8ee;padding:28px 22px 22px;display:flex;gap:16px;align-items:center"><img src="assets/logo.svg" style="width:76px"><div><h1 style="margin:0;font-size:24px">MisFinanzasApp</h1><p style="color:#0b8f2a;font-weight:700;margin:6px 0 0">Controla tus finanzas,<br>alcanza tus metas</p></div></section>
  <section style="padding:22px">
    <div class="row" style="justify-content:flex-start;margin-bottom:22px"><div class="round-icon" style="width:54px;height:54px;background:#0b8f2a"><ion-icon name="person"></ion-icon></div><div style="flex:1"><h2 style="margin:0;font-size:20px">{{name}}</h2><small class="muted">{{email}}</small></div><ion-icon name="chevron-forward-outline"></ion-icon></div>
    <a class="menu-link active" routerLink="/dashboard"><ion-icon name="home"></ion-icon>Inicio</a>
    <a class="menu-link" routerLink="/transactions"><ion-icon name="list"></ion-icon>Transacciones</a>
    <a class="menu-link" routerLink="/budgets"><ion-icon name="wallet"></ion-icon>Presupuestos</a>
    <a class="menu-link" routerLink="/reports"><ion-icon name="bar-chart"></ion-icon>Reportes</a>
    <a class="menu-link" routerLink="/notifications"><ion-icon name="notifications-outline"></ion-icon>Notificaciones</a>
    <a class="menu-link"><ion-icon name="pricetag-outline"></ion-icon>Categorías</a>
    <a class="menu-link"><ion-icon name="locate-outline"></ion-icon>Metas</a>
    <a class="menu-link" routerLink="/settings"><ion-icon name="settings-outline"></ion-icon>Configuración</a>
    <a class="menu-link"><ion-icon name="help-circle-outline"></ion-icon>Ayuda y soporte</a>
    <a class="menu-link logout" routerLink="/login"><ion-icon name="log-out-outline"></ion-icon>Cerrar sesión</a>
    <p class="text-center" style="color:#0b8f2a;font-weight:700;margin-top:32px"><ion-icon name="shield-checkmark"></ion-icon> Tus datos están seguros</p><p class="text-center muted">Versión 1.0.0</p>
  </section>
</main></ion-content>`, styles:[`.menu-link{display:flex;align-items:center;gap:20px;padding:16px;border-bottom:1px solid #e8e8e8;text-decoration:none;color:#111;font-size:17px}.menu-link ion-icon{font-size:25px;color:#0b8f2a}.menu-link.active{background:#e8f8eb;border-radius:12px;font-weight:800;color:#0b8f2a}.menu-link.logout{color:#ee1b1b}.menu-link.logout ion-icon{color:#ee1b1b}`] })
export class SideMenuPage { user=this.auth.getUser(); name=this.user?.name||'Usuario'; email=this.user?.email||'Sin correo registrado'; constructor(private auth:AuthService){} }
