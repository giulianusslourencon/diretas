import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/crosswords',
    pathMatch: 'full',
  },
  {
    path: 'crosswords',
    loadComponent: () =>
      import('./features/crossword-list/crossword-list.component').then(
        (m) => m.CrosswordListComponent
      ),
  },
  {
    path: 'crosswords/new',
    loadComponent: () =>
      import('./features/crossword-editor/crossword-editor.component').then(
        (m) => m.CrosswordEditorComponent
      ),
  },
  {
    path: 'crosswords/:id',
    loadComponent: () =>
      import('./features/crossword-editor/crossword-editor.component').then(
        (m) => m.CrosswordEditorComponent
      ),
  },
];
