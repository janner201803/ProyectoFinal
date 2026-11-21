import { Routes } from '@angular/router';

import { Login } from './pages/login/login';
import { Registro } from './pages/registro/registro';
import { Inicio } from './pages/inicio/inicio';
import { Servicios } from './pages/servicios/servicios';
import { Mapa } from './pages/mapa/mapa';

import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { ObjetosPerdidos } from './pages/objetos-perdidos/objetos-perdidos';
import { Perfil } from './pages/perfil/perfil';
import { Eventos } from './pages/eventos/eventos';
import { Chat } from './pages/chat/chat';

export const routes: Routes = [

  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },

  {
    path: 'login',
    component: Login,
    canActivate: [guestGuard]
  },

  {
    path: 'registro',
    component: Registro,
    canActivate: [guestGuard]
  },

  {
    path: 'inicio',
    component: Inicio,
    canActivate: [authGuard]
  },

  {
    path: 'servicios',
    component: Servicios,
    canActivate: [authGuard]
  },

  {
    path: 'mapa',
    component: Mapa,
    canActivate: [authGuard]
  },

  { path: 'objetos-perdidos',
    component: ObjetosPerdidos,
    canActivate: [authGuard] 
  },
  
  { path: 'perfil',
    component: Perfil,
    canActivate: [authGuard] 
  },

  { path: 'eventos',
    component: Eventos,
    canActivate: [authGuard]
  },

  { path: 'chat', 
    component: Chat,
    canActivate: [authGuard]
  },

  {
    path: '**',
    redirectTo: 'login'
  }

];
