import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CarCardComponent } from '../../components/car-card/car-card.component';
import { CarDetailDrawerComponent } from '../../components/car-detail-drawer/car-detail-drawer.component';
import type { BodyType, Car, CarFilters, FuelType } from '../../models/car.types';
import { emptyCarFilters } from '../../models/car.types';
import { CarCatalogService } from '../../services/car-catalog.service';
import { ComparisonService } from '../../services/comparison.service';

const FUELS: FuelType[] = ['Petrol', 'Diesel', 'EV', 'CNG', 'Hybrid'];
const BODIES: BodyType[] = ['Hatchback', 'Sedan', 'SUV', 'MPV', 'Coupe SUV'];

@Component({
  selector: 'app-browse',
  standalone: true,
  imports: [RouterLink, FormsModule, CarCardComponent, CarDetailDrawerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6 lg:flex-row lg:px-8">
      <aside class="w-full shrink-0 lg:w-72">
        <div class="sticky top-6 space-y-6 rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm">
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-semibold text-stone-900">Filters</h2>
            <button
              type="button"
              class="text-xs font-medium text-stone-500 hover:text-stone-800"
              (click)="reset()"
            >
              Reset
            </button>
          </div>
          <label class="block text-xs font-medium text-stone-500">
            Search
            <input
              class="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50/60 px-3 py-2 text-sm text-stone-900 outline-none ring-stone-900/10 focus:border-stone-400 focus:ring-2"
              type="search"
              placeholder="Name, company, model…"
              [value]="filters().query"
              (input)="patch({ query: $any($event.target).value })"
            />
          </label>
          <label class="block text-xs font-medium text-stone-500">
            Make
            <select
              class="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-900/10"
              [ngModel]="filters().company"
              (ngModelChange)="onCompany($event)"
            >
              <option value="">All makes</option>
              @for (c of catalog.companies(); track c) {
                <option [value]="c">{{ c }}</option>
              }
            </select>
          </label>
          <label class="block text-xs font-medium text-stone-500">
            Model
            <select
              class="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-900/10"
              [ngModel]="filters().model"
              (ngModelChange)="patch({ model: $event })"
            >
              <option value="">All models</option>
              @for (m of modelOptions(); track m) {
                <option [value]="m">{{ m }}</option>
              }
            </select>
          </label>
          <div class="grid grid-cols-2 gap-3">
            <label class="block text-xs font-medium text-stone-500">
              Min price (₹ L)
              <input
                class="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
                type="number"
                min="0"
                step="0.5"
                [ngModel]="filters().priceMin"
                (ngModelChange)="patch({ priceMin: num($event) })"
              />
            </label>
            <label class="block text-xs font-medium text-stone-500">
              Max price (₹ L)
              <input
                class="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
                type="number"
                min="0"
                step="0.5"
                [ngModel]="filters().priceMax"
                (ngModelChange)="patch({ priceMax: num($event) })"
              />
            </label>
          </div>
          <fieldset>
            <legend class="text-xs font-medium text-stone-500">Fuel</legend>
            <div class="mt-2 flex flex-wrap gap-2">
              @for (f of fuels; track f) {
                <label
                  class="inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs"
                  [class.border-stone-900]="filters().fuels.includes(f)"
                  [class.bg-stone-900]="filters().fuels.includes(f)"
                  [class.text-white]="filters().fuels.includes(f)"
                  [class.border-stone-200]="!filters().fuels.includes(f)"
                  [class.bg-white]="!filters().fuels.includes(f)"
                  [class.text-stone-700]="!filters().fuels.includes(f)"
                >
                  <input
                    type="checkbox"
                    class="sr-only"
                    [checked]="filters().fuels.includes(f)"
                    (change)="toggleFuel(f, $any($event.target).checked)"
                  />
                  {{ f }}
                </label>
              }
            </div>
          </fieldset>
          <label class="block text-xs font-medium text-stone-500">
            Transmission
            <select
              class="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm"
              [ngModel]="filters().transmission"
              (ngModelChange)="patch({ transmission: $event })"
            >
              <option value="">Any</option>
              <option value="Manual">Manual</option>
              <option value="Automatic">Automatic</option>
            </select>
          </label>
          <fieldset>
            <legend class="text-xs font-medium text-stone-500">Body type</legend>
            <div class="mt-2 flex flex-wrap gap-2">
              @for (b of bodies; track b) {
                <label
                  class="inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs"
                  [class.border-stone-900]="filters().bodyTypes.includes(b)"
                  [class.bg-stone-900]="filters().bodyTypes.includes(b)"
                  [class.text-white]="filters().bodyTypes.includes(b)"
                  [class.border-stone-200]="!filters().bodyTypes.includes(b)"
                  [class.bg-white]="!filters().bodyTypes.includes(b)"
                  [class.text-stone-700]="!filters().bodyTypes.includes(b)"
                >
                  <input
                    type="checkbox"
                    class="sr-only"
                    [checked]="filters().bodyTypes.includes(b)"
                    (change)="toggleBody(b, $any($event.target).checked)"
                  />
                  {{ b }}
                </label>
              }
            </div>
          </fieldset>
          <div class="grid grid-cols-2 gap-3">
            <label class="block text-xs font-medium text-stone-500">
              Min safety ★
              <input
                class="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
                type="number"
                min="0"
                max="5"
                step="1"
                [ngModel]="filters().safetyMin"
                (ngModelChange)="patch({ safetyMin: num($event) })"
              />
            </label>
            <label class="block text-xs font-medium text-stone-500">
              Min seats
              <input
                class="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
                type="number"
                min="2"
                max="9"
                step="1"
                [ngModel]="filters().seatingMin"
                (ngModelChange)="patch({ seatingMin: num($event) })"
              />
            </label>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <label class="block text-xs font-medium text-stone-500">
              From year
              <input
                class="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
                type="number"
                min="2000"
                max="2030"
                step="1"
                [ngModel]="filters().yearMin"
                (ngModelChange)="patch({ yearMin: num($event) })"
              />
            </label>
            <label class="block text-xs font-medium text-stone-500">
              To year
              <input
                class="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
                type="number"
                min="2000"
                max="2030"
                step="1"
                [ngModel]="filters().yearMax"
                (ngModelChange)="patch({ yearMax: num($event) })"
              />
            </label>
          </div>
        </div>
      </aside>
      <section class="min-w-0 flex-1">
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div>
            <a routerLink="/" class="text-sm text-stone-500 hover:text-stone-800">← Back home</a>
            <h1 class="mt-2 text-2xl font-semibold text-stone-900">Browse cars</h1>
            <p class="mt-1 text-sm text-stone-500">{{ results().length }} matches</p>
          </div>
        </div>
        <div class="mt-8 grid gap-5 sm:grid-cols-2">
          @for (car of results(); track car.id) {
            <app-car-card [car]="car" (selected)="active.set($event)" />
          } @empty {
            <p class="col-span-full rounded-2xl border border-dashed border-stone-200 bg-stone-50/50 px-6 py-12 text-center text-sm text-stone-500">
              No cars match these filters. Try widening price or fuel options.
            </p>
          }
        </div>
      </section>
    </div>
    <app-car-detail-drawer [car]="active()" (close)="active.set(null)" (viewComparison)="comparison.openPanel()" />
  `
})
export class BrowsePage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  protected readonly catalog = inject(CarCatalogService);
  protected readonly comparison = inject(ComparisonService);
  
  protected readonly fuels = FUELS;
  protected readonly bodies = BODIES;

  protected readonly filters = signal<CarFilters>(emptyCarFilters());
  protected readonly results = computed(() => this.catalog.filter(this.filters()));
  protected readonly active = signal<Car | null>(null);

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const carId = params['carId'];
      if (carId) {
        const car = this.catalog.allCars().find(c => c.id === carId);
        if (car) {
          this.active.set(car);
        }
      }
      
      if (params['compare'] === 'true') {
        // Need a slight timeout to let the view settle if navigating from home
        setTimeout(() => {
          this.active.set(null);
          this.comparison.openPanel();
        }, 50);
      }
    });
  }

  protected readonly modelOptions = computed(() =>
    this.catalog.modelsForCompany(this.filters().company)
  );

  protected patch(partial: Partial<CarFilters>): void {
    this.filters.update((f) => {
      const next = { ...f, ...partial };
      if (partial.company !== undefined && partial.company !== f.company) {
        next.model = '';
      }
      return next;
    });
  }

  protected onCompany(company: string): void {
    this.patch({ company, model: '' });
  }

  protected toggleFuel(f: FuelType, on: boolean): void {
    this.filters.update((fl) => {
      const set = new Set(fl.fuels);
      if (on) {
        set.add(f);
      } else {
        set.delete(f);
      }
      return { ...fl, fuels: [...set] };
    });
  }

  protected toggleBody(b: BodyType, on: boolean): void {
    this.filters.update((fl) => {
      const set = new Set(fl.bodyTypes);
      if (on) {
        set.add(b);
      } else {
        set.delete(b);
      }
      return { ...fl, bodyTypes: [...set] };
    });
  }

  protected num(v: unknown): number | null {
    if (v === '' || v === null || v === undefined) {
      return null;
    }
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  protected reset(): void {
    this.filters.set(emptyCarFilters());
  }
}
