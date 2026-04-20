import { Injectable, signal, computed } from '@angular/core';
import type { Car } from '../models/car.types';

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly favorites = signal<Set<string>>(new Set());
  private readonly isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined';

  readonly favoriteIds = computed(() => Array.from(this.favorites()));

  constructor() {
    if (this.isBrowser) {
      this.loadFromStorage();
    }
  }

  isFavorited(carId: string): boolean {
    return this.favorites().has(carId);
  }

  toggle(car: Car): void {
    const set = new Set(this.favorites());
    if (set.has(car.id)) {
      set.delete(car.id);
    } else {
      set.add(car.id);
    }
    this.favorites.set(set);
    if (this.isBrowser) {
      this.saveToStorage();
    }
  }

  private saveToStorage(): void {
    if (this.isBrowser) {
      localStorage.setItem('car-favorites', JSON.stringify(Array.from(this.favorites())));
    }
  }

  private loadFromStorage(): void {
    if (this.isBrowser) {
      const stored = localStorage.getItem('car-favorites');
      if (stored) {
        try {
          const ids = JSON.parse(stored) as string[];
          this.favorites.set(new Set(ids));
        } catch {
          // Ignore invalid data
        }
      }
    }
  }
}
