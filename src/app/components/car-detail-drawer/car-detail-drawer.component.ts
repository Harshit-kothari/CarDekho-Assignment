import { ChangeDetectionStrategy, Component, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { Car } from '../../models/car.types';
import { formatLakhInr } from '../../utils/format-price';
import { FavoritesService } from '../../services/favorites.service';
import { ComparisonService } from '../../services/comparison.service';

@Component({
  selector: 'app-car-detail-drawer',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (car(); as c) {
      <div
        class="fixed inset-0 z-40 bg-stone-900/60 backdrop-blur-md"
        (click)="close.emit()"
        aria-hidden="true"
      ></div>
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="'Details for ' + c.name"
      >
        <div
          class="relative w-full max-w-3xl max-h-[90vh] overflow-auto bg-white rounded-3xl shadow-2xl flex flex-col"
          (click)="$event.stopPropagation()"
        >
          <!-- Header -->
          <header class="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-stone-100 bg-white px-8 py-6 rounded-t-3xl">
            <div class="flex-1">
              <p class="text-xs font-medium uppercase tracking-wide text-stone-500">{{ c.company }}</p>
              <h2 class="mt-1 text-3xl font-semibold tracking-tight text-stone-900">{{ c.name }}</h2>
              <p class="mt-2 text-sm text-stone-500">{{ c.model }} · {{ c.launchYear }} · {{ c.bodyType }}</p>
            </div>
            <button
              type="button"
              class="rounded-full border border-stone-200 px-3 py-1.5 text-sm text-stone-600 transition hover:bg-stone-50 flex-shrink-0"
              (click)="close.emit()"
            >
              Close
            </button>
          </header>

          <!-- Content -->
          <div class="flex-1 overflow-y-auto px-8 py-6">
            <div class="flex items-end justify-between gap-4 mb-6">
              <p class="text-2xl font-semibold text-stone-900">{{ formatPrice(c.priceLakh) }}</p>
              <p class="text-sm text-stone-500">{{ c.fuel }} · {{ c.transmission }} · {{ c.seating }} seats</p>
            </div>

            <dl class="grid grid-cols-2 gap-4 text-sm md:grid-cols-3 mb-8">
              <div class="rounded-xl bg-stone-50 p-3">
                <dt class="text-xs text-stone-500">Mileage (city)</dt>
                <dd class="font-medium text-stone-900">{{ c.mileageCity }}{{ unit(c) }}</dd>
              </div>
              <div class="rounded-xl bg-stone-50 p-3">
                <dt class="text-xs text-stone-500">Mileage (highway)</dt>
                <dd class="font-medium text-stone-900">{{ c.mileageHighway }}{{ unit(c) }}</dd>
              </div>
              <div class="rounded-xl bg-stone-50 p-3">
                <dt class="text-xs text-stone-500">Safety (NCAP)</dt>
                <dd class="font-medium text-stone-900">{{ c.safetyRating }} stars</dd>
              </div>
              <div class="rounded-xl bg-stone-50 p-3">
                <dt class="text-xs text-stone-500">Reviews</dt>
                <dd class="font-medium text-stone-900">{{ c.reviewsScore.toFixed(1) }} / 5</dd>
              </div>
              <div class="rounded-xl bg-stone-50 p-3">
                <dt class="text-xs text-stone-500">Post-purchase service</dt>
                <dd class="font-medium text-stone-900">{{ c.postPurchaseServiceScore }} / 10</dd>
              </div>
              <div class="rounded-xl bg-stone-50 p-3">
                <dt class="text-xs text-stone-500">Luggage</dt>
                <dd class="font-medium text-stone-900">{{ c.luggageLitres }} L</dd>
              </div>
              <div class="rounded-xl bg-stone-50 p-3">
                <dt class="text-xs text-stone-500">Child seat mounts</dt>
                <dd class="font-medium text-stone-900">{{ c.easyChildSeatMounts ? 'Easy ISOFIX' : 'Limited' }}</dd>
              </div>
              <div class="rounded-xl bg-stone-50 p-3">
                <dt class="text-xs text-stone-500">A/C quality</dt>
                <dd class="font-medium text-stone-900">{{ c.acQuality }}</dd>
              </div>
              <div class="rounded-xl bg-stone-50 p-3">
                <dt class="text-xs text-stone-500">Airbags</dt>
                <dd class="font-medium text-stone-900">{{ c.airbags }}</dd>
              </div>
              <div class="rounded-xl bg-stone-50 p-3">
                <dt class="text-xs text-stone-500">ABS</dt>
                <dd class="font-medium text-stone-900">{{ c.abs ? 'Yes' : 'No' }}</dd>
              </div>
              <div class="rounded-xl bg-stone-50 p-3">
                <dt class="text-xs text-stone-500">Ground clearance</dt>
                <dd class="font-medium text-stone-900">{{ c.groundClearanceMm }} mm</dd>
              </div>
              <div class="rounded-xl bg-stone-50 p-3">
                <dt class="text-xs text-stone-500">Steering</dt>
                <dd class="font-medium text-stone-900">{{ c.steeringType }}</dd>
              </div>
              <div class="col-span-2 rounded-xl bg-stone-50 p-3 md:col-span-1">
                <dt class="text-xs text-stone-500">Infotainment</dt>
                <dd class="font-medium text-stone-900">{{ c.infotainmentSystem }}</dd>
              </div>
            </dl>
          </div>

          <!-- Footer with Actions -->
          <footer class="sticky bottom-0 border-t border-stone-100 bg-white px-8 py-4 rounded-b-3xl flex gap-3 flex-wrap">
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition"
              [class.bg-red-50]="favoritesService.isFavorited(c.id)"
              [class.text-red-600]="favoritesService.isFavorited(c.id)"
              [class.bg-stone-100]="!favoritesService.isFavorited(c.id)"
              [class.text-stone-600]="!favoritesService.isFavorited(c.id)"
              [class.hover:bg-red-100]="favoritesService.isFavorited(c.id)"
              [class.hover:bg-stone-200]="!favoritesService.isFavorited(c.id)"
              (click)="favoritesService.toggle(c)"
            >
              <span [class]="favoritesService.isFavorited(c.id) ? '♥' : '♡'" class="text-base">
                {{ favoritesService.isFavorited(c.id) ? '♥' : '♡' }}
              </span>
              {{ favoritesService.isFavorited(c.id) ? 'Liked' : 'Like' }}
            </button>

            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition"
              [class.bg-blue-50]="comparisonService.isInComparison(c.id)"
              [class.text-blue-600]="comparisonService.isInComparison(c.id)"
              [class.bg-stone-100]="!comparisonService.isInComparison(c.id)"
              [class.text-stone-600]="!comparisonService.isInComparison(c.id)"
              [class.hover:bg-blue-100]="comparisonService.isInComparison(c.id)"
              [class.hover:bg-stone-200]="!comparisonService.isInComparison(c.id)"
              [disabled]="comparisonService.isFull() && !comparisonService.isInComparison(c.id)"
              (click)="toggleCompare(c)"
            >
              <span class="text-base">⚖️</span>
              {{ comparisonService.isInComparison(c.id) 
                ? 'In Compare (' + comparisonService.count() + '/4)' 
                : 'Compare' + (comparisonService.count() > 0 ? ' (' + comparisonService.count() + '/4)' : '') }}
            </button>

            @if (comparisonService.count() > 1) {
              <button
                type="button"
                class="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium bg-emerald-50 text-emerald-600 transition hover:bg-emerald-100 ml-auto"
                (click)="viewComparison.emit()"
              >
                <span class="text-base">📊</span>
                View Comparison ({{ comparisonService.count() }})
              </button>
            }
          </footer>
        </div>
      </div>
    }
  `
})
export class CarDetailDrawerComponent {
  readonly car = input<Car | null>(null);
  readonly close = output<void>();
  readonly viewComparison = output<void>();

  protected readonly favoritesService = inject(FavoritesService);
  protected readonly comparisonService = inject(ComparisonService);
  protected formatPrice = formatLakhInr;

  protected unit(c: Car): string {
    return c.fuel === 'EV' ? ' km/kWh' : ' km/l';
  }

  toggleCompare(car: Car): void {
    if (this.comparisonService.isInComparison(car.id)) {
      this.comparisonService.removeCar(car.id);
    } else {
      if (!this.comparisonService.isFull()) {
        this.comparisonService.addCar(car);
      }
    }
  }
}

