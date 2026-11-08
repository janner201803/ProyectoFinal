import { Routes } from '@angular/router';

import { Login } from './pages/login/login';
import { Registro } from './pages/registro/registro';
import { Inicio } from './pages/inicio/inicio';

import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

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
    path: '**',
    redirectTo: 'login'
  }

];