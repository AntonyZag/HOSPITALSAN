import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'productos' },
  {
    path: 'productos',
    loadComponent: () => import('./components/productos/producto-lista').then((m) => m.ProductoLista),
  },
  {
    path: 'productos/nuevo',
    loadComponent: () => import('./components/productos/producto-form').then((m) => m.ProductoForm),
  },
  {
    path: 'productos/proximos-vencer',
    loadComponent: () =>
      import('./components/productos/proximos-vencer').then((m) => m.ProximosVencer),
  },
  {
    path: 'productos/:id/editar',
    loadComponent: () => import('./components/productos/producto-form').then((m) => m.ProductoForm),
  },
  {
    path: 'categorias',
    loadComponent: () =>
      import('./components/categorias/categoria-lista').then((m) => m.CategoriaLista),
  },
  {
    path: 'categorias/nueva',
    loadComponent: () =>
      import('./components/categorias/categoria-form').then((m) => m.CategoriaForm),
  },
  {
    path: 'categorias/:id/editar',
    loadComponent: () =>
      import('./components/categorias/categoria-form').then((m) => m.CategoriaForm),
  },
  {
    path: 'entradas',
    loadComponent: () =>
      import('./components/entradas/entrada-historial').then((m) => m.EntradaHistorial),
  },
  {
    path: 'entradas/nueva',
    loadComponent: () => import('./components/entradas/entrada-form').then((m) => m.EntradaForm),
  },
  {
    path: 'diagnostico',
    loadComponent: () => import('./components/connection-test').then((m) => m.ConnectionTest),
  },
  { path: '**', redirectTo: 'productos' },
];
