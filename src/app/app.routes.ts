import { Routes } from '@angular/router';
import { HomePage } from './pages/home/home.page';
import { BrowsePage } from './pages/browse/browse.page';

export const routes: Routes = [
  { path: '', component: HomePage },
  { path: 'browse', component: BrowsePage },
  { path: '**', redirectTo: '' }
];
