import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CarCardComponent } from '../../components/car-card/car-card.component';
import { CarDetailDrawerComponent } from '../../components/car-detail-drawer/car-detail-drawer.component';
import { CarCatalogService } from '../../services/car-catalog.service';
import type { Car } from '../../models/car.types';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CarCardComponent, CarDetailDrawerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 lg:px-8">
      <div class="max-w-2xl">
        <p class="text-sm font-medium text-stone-500">India-focused catalogue</p>
        <h1 class="mt-3 text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl">
          Find a car that fits Indian roads—and your life.
        </h1>
        <p class="mt-4 text-lg leading-relaxed text-stone-600">
          Curated ex-showroom prices, real-world mileage, safety, and ownership signals in one calm place.
        </p>
        <a
          routerLink="/browse"
          class="mt-8 inline-flex items-center rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-stone-800"
        >
          Search all cars
        </a>
      </div>

      <div class="mt-16 border-t border-stone-200/80 pt-12">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 class="text-xl font-semibold text-stone-900">Top rated picks</h2>
            <p class="mt-1 text-sm text-stone-500">Blended from reviews, safety, and after-sales scores.</p>
          </div>
        </div>
        <div class="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          @for (car of featured(); track car.id) {
            <app-car-card [car]="car" (selected)="open($event)" />
          }
        </div>
      </div>
    </section>
    <app-car-detail-drawer [car]="active()" (close)="active.set(null)" />
  `
})
export class HomePage {
  private readonly catalog = inject(CarCatalogService);
  protected readonly featured = signal(this.catalog.topRated(6));
  protected readonly active = signal<Car | null>(null);

  protected open(car: Car): void {
    this.active.set(car);
  }
}
