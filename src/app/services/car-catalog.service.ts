import { Injectable, computed, signal } from '@angular/core';
import { INDIAN_CARS } from '../data/indian-cars.data';
import type { BodyType, Car, CarFilters } from '../models/car.types';

function compositeScore(car: Car): number {
  return car.reviewsScore * 2.2 + car.safetyRating * 1.6 + car.postPurchaseServiceScore * 0.45;
}

@Injectable({ providedIn: 'root' })
export class CarCatalogService {
  private readonly cars = signal<Car[]>(INDIAN_CARS);

  readonly allCars = this.cars.asReadonly();

  readonly companies = computed(() => {
    const set = new Set(this.cars().map((c) => c.company));
    return [...set].sort((a, b) => a.localeCompare(b));
  });

  readonly models = computed(() => {
    const set = new Set(this.cars().map((c) => c.model));
    return [...set].sort((a, b) => a.localeCompare(b));
  });

  modelsForCompany(company: string): string[] {
    if (!company) {
      return this.models();
    }
    const set = new Set(this.cars().filter((c) => c.company === company).map((c) => c.model));
    return [...set].sort((a, b) => a.localeCompare(b));
  }

  topRated(limit = 6): Car[] {
    return [...this.cars()].sort((a, b) => compositeScore(b) - compositeScore(a)).slice(0, limit);
  }

  filter(filters: CarFilters): Car[] {
    const q = filters.query.trim().toLowerCase();
    return this.cars().filter((car) => {
      if (q && !(`${car.name} ${car.company} ${car.model}`.toLowerCase().includes(q))) {
        return false;
      }
      if (filters.company && car.company !== filters.company) {
        return false;
      }
      if (filters.model && car.model !== filters.model) {
        return false;
      }
      if (filters.priceMin != null && car.priceLakh < filters.priceMin) {
        return false;
      }
      if (filters.priceMax != null && car.priceLakh > filters.priceMax) {
        return false;
      }
      if (filters.fuels.length && !filters.fuels.includes(car.fuel)) {
        return false;
      }
      if (filters.transmission && car.transmission !== filters.transmission) {
        return false;
      }
      if (filters.bodyTypes.length && !filters.bodyTypes.includes(car.bodyType)) {
        return false;
      }
      if (filters.safetyMin != null && car.safetyRating < filters.safetyMin) {
        return false;
      }
      if (filters.seatingMin != null && car.seating < filters.seatingMin) {
        return false;
      }
      if (filters.yearMin != null && car.launchYear < filters.yearMin) {
        return false;
      }
      if (filters.yearMax != null && car.launchYear > filters.yearMax) {
        return false;
      }
      if (filters.absOnly === true && !car.abs) {
        return false;
      }
      if (filters.airbagsMin != null && car.airbags < filters.airbagsMin) {
        return false;
      }
      return true;
    });
  }
}
