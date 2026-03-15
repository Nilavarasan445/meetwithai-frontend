import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { facilityGuard } from './core/guards/facility.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.routes').then((m) => m.authRoutes),
  },
  {
    path: 'facilities',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/facilities/facility-list.component').then(
        (m) => m.FacilityListComponent
      ),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent
      ),
  },
  {
    path: 'meetings',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/meetings/meeting-list/meeting-list.component').then(
            (m) => m.MeetingListComponent
          ),
      },
      {
        path: 'upload',
        loadComponent: () =>
          import('./features/meetings/meeting-upload/meeting-upload.component').then(
            (m) => m.MeetingUploadComponent
          ),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./features/meetings/meeting-detail/meeting-detail.component').then(
            (m) => m.MeetingDetailComponent
          ),
      },
    ],
  },
  {
    path: 'tasks',
    canActivate: [authGuard, facilityGuard],
    loadComponent: () =>
      import('./features/tasks/task-board/task-board.component').then(
        (m) => m.TaskBoardComponent
      ),
  },
  {
    path: 'notes',
    canActivate: [authGuard, facilityGuard],
    loadComponent: () =>
      import('./features/notes/notes.component').then(
        (m) => m.NotesComponent
      ),
  },
  {
    path: 'standup',
    canActivate: [authGuard, facilityGuard],
    loadComponent: () =>
      import('./features/standup/standup.component').then(
        (m) => m.StandupComponent
      ),
  },
  {
    path: 'report',
    canActivate: [authGuard, facilityGuard],
    loadComponent: () =>
      import('./features/standup/daily-report.component').then(
        (m) => m.DailyReportComponent
      ),
  },
  {
    path: 'standup/github/callback',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/standup/github-callback.component').then(
        (m) => m.GithubCallbackComponent
      ),
  },
  {
    path: 'integrations',
    canActivate: [authGuard, facilityGuard],
    loadComponent: () =>
      import('./features/integrations/integrations.component').then(
        (m) => m.IntegrationsComponent
      ),
  },
  {
    path: 'integrations/:provider/callback',
    canActivate: [authGuard, facilityGuard],
    loadComponent: () =>
      import('./features/integrations/oauth-callback.component').then(
        (m) => m.OAuthCallbackComponent
      ),
  },
  {
    path: 'calendar',
    canActivate: [authGuard, facilityGuard],
    loadComponent: () =>
      import('./features/calendar/calendar.component').then(
        (m) => m.CalendarComponent
      ),
  },
  { path: '**', redirectTo: '/dashboard' },
];
