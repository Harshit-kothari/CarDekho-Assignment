import { Injectable, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';

/** Mirrors the profile saved by the Python backend */
export interface UserPreferences {
  budget_min_lakh: number | null;
  budget_max_lakh: number | null;
  preferred_brands: string[];
  excluded_brands: string[];
  preferred_body_types: string[];
  preferred_fuel: string[];
  primary_use: string | null;
  seating_max: number | null;
  mileage_priority: boolean;
}

const STORAGE_KEY = 'chat_user_preferences';

@Injectable({ providedIn: 'root' })
export class UserPreferencesService {
  private readonly platformId = inject(PLATFORM_ID);

  private readonly _prefs = signal<UserPreferences>({
    budget_min_lakh: null,
    budget_max_lakh: null,
    preferred_brands: [],
    excluded_brands: [],
    preferred_body_types: [],
    preferred_fuel: [],
    primary_use: null,
    seating_max: null,
    mileage_priority: false,
  });

  readonly prefs = this._prefs.asReadonly();

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        try { this._prefs.set(JSON.parse(raw)); } catch { /* ignore */ }
      }
    }
  }

  update(partial: Partial<UserPreferences>): void {
    this._prefs.update(p => ({ ...p, ...partial }));
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._prefs()));
    }
  }

  reset(): void {
    this._prefs.set({
      budget_min_lakh: null, budget_max_lakh: null,
      preferred_brands: [], excluded_brands: [], preferred_body_types: [],
      preferred_fuel: [], primary_use: null, seating_max: null, mileage_priority: false,
    });
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
}
