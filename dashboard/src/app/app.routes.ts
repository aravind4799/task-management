import { Route } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./components/redirect/redirect.component').then(m => m.RedirectComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'tasks',
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard],
  },
  {
    path: 'audit-log',
    loadComponent: () => import('./components/audit-log/audit-log.component').then(m => m.AuditLogComponent),
    canActivate: [authGuard],
  },
  {
    path: 'tasks/new',
    loadComponent: () => import('./components/task-form/task-form.component').then(m => m.TaskFormComponent),
    canActivate: [authGuard],
  },
  {
    path: 'tasks/:id/edit',
    loadComponent: () => import('./components/task-form/task-form.component').then(m => m.TaskFormComponent),
    canActivate: [authGuard],
  },
  {
    path: '**',
    redirectTo: '/tasks',
  },
];
