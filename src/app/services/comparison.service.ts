import { Injectable, signal, computed } from '@angular/core';
import type { Car } from '../models/car.types';

@Injectable({ providedIn: 'root' })
export class ComparisonService {
  private readonly comparisonList = signal<Car[]>([]);
  private readonly isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined';

  readonly isPanelOpen = signal(false);

  readonly cars = computed(() => this.comparisonList());
  readonly count = computed(() => this.comparisonList().length);
  readonly isFull = computed(() => this.comparisonList().length >= 4);

  constructor() {
    if (this.isBrowser) {
      this.loadFromStorage();
    }
  }

  addCar(car: Car): void {
    if (this.comparisonList().length >= 4) return;
    if (this.comparisonList().some(c => c.id === car.id)) return;
    
    this.comparisonList.update(cars => [...cars, car]);
    if (this.isBrowser) {
      this.saveToStorage();
    }
  }

  removeCar(carId: string): void {
    this.comparisonList.update(cars => cars.filter(c => c.id !== carId));
    if (this.isBrowser) {
      this.saveToStorage();
    }
  }

  clear(): void {
    this.comparisonList.set([]);
    if (this.isBrowser) {
      this.saveToStorage();
    }
  }

  openPanel(): void {
    this.isPanelOpen.set(true);
  }

  closePanel(): void {
    this.isPanelOpen.set(false);
  }

  isInComparison(carId: string): boolean {
    return this.comparisonList().some(c => c.id === carId);
  }

  private saveToStorage(): void {
    if (this.isBrowser) {
      localStorage.setItem('car-comparison', JSON.stringify(this.comparisonList()));
    }
  }

  private loadFromStorage(): void {
    if (this.isBrowser) {
      const stored = localStorage.getItem('car-comparison');
      if (stored) {
        try {
          const cars = JSON.parse(stored) as Car[];
          this.comparisonList.set(cars);
        } catch {
          // Ignore invalid data
        }
      }
    }
  }
}
