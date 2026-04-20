import { ChangeDetectionStrategy, Component, input, output, inject } from '@angular/core';
import type { Car } from '../../models/car.types';
import { formatShortLakh } from '../../utils/format-price';
import { ComparisonService } from '../../services/comparison.service';

@Component({
  selector: 'app-car-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article
      class="group flex h-full cursor-pointer flex-col rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm transition hover:border-stone-300 hover:shadow-md"
      (click)="selected.emit(car())"
      (keydown.enter)="selected.emit(car())"
      (keydown.space)="$event.preventDefault(); selected.emit(car())"
      tabindex="0"
      role="button"
      [attr.aria-label]="'View details for ' + car().name"
    >
      <div class="flex items-start justify-between gap-3">
        <div>
          <p class="text-xs font-medium tracking-wide text-stone-500">{{ car().company }}</p>
          <h3 class="mt-1 text-lg font-semibold tracking-tight text-stone-900">{{ car().name }}</h3>
        </div>
        <div class="text-right">
          <p class="text-sm font-semibold text-stone-900">{{ price() }}</p>
          <p class="text-xs text-stone-500">{{ car().fuel }} · {{ car().transmission }}</p>
        </div>
      </div>
      <dl class="mt-4 grid grid-cols-2 gap-3 text-sm text-stone-600">
        <div>
          <dt class="text-xs uppercase tracking-wide text-stone-400">Reviews</dt>
          <dd class="font-medium text-stone-800">{{ car().reviewsScore.toFixed(1) }} / 5</dd>
        </div>
        <div>
          <dt class="text-xs uppercase tracking-wide text-stone-400">Safety</dt>
          <dd class="font-medium text-stone-800">{{ car().safetyRating }}★ NCAP</dd>
        </div>
        <div>
          <dt class="text-xs uppercase tracking-wide text-stone-400">Type</dt>
          <dd class="font-medium text-stone-800">{{ car().bodyType }}</dd>
        </div>
        <div>
          <dt class="text-xs uppercase tracking-wide text-stone-400">Service</dt>
          <dd class="font-medium text-stone-800">{{ car().postPurchaseServiceScore }}/10</dd>
        </div>
      </dl>
      <div class="mt-4 flex items-center justify-between border-t border-stone-50 pt-4">
        <p class="line-clamp-2 text-sm leading-relaxed text-stone-500">
          {{ car().mileageCity }}{{ mileageUnit() }} city · {{ car().mileageHighway }}{{ mileageUnit() }} hw
        </p>
        <button
          type="button"
          class="shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all active:scale-95"
          [class.border-emerald-500]="inComparison()"
          [class.text-emerald-700]="inComparison()"
          [class.bg-emerald-50]="inComparison()"
          [class.border-stone-200]="!inComparison()"
          [class.text-stone-600]="!inComparison()"
          [class.hover:bg-stone-50]="!inComparison()"
          (click)="$event.stopPropagation(); toggleCompare()"
        >
          {{ inComparison() ? '✓ Added' : '+ Compare' }}
        </button>
      </div>
    </article>
  `
})
export class CarCardComponent {
  readonly car = input.required<Car>();
  readonly selected = output<Car>();
  protected readonly comparisonService = inject(ComparisonService);

  protected price(): string {
    return formatShortLakh(this.car().priceLakh);
  }

  protected mileageUnit(): string {
    return this.car().fuel === 'EV' ? ' km/kWh' : ' km/l';
  }

  protected inComparison(): boolean {
    return this.comparisonService.isInComparison(this.car().id);
  }

  protected toggleCompare(): void {
    if (this.inComparison()) {
      this.comparisonService.removeCar(this.car().id);
    } else {
      if (!this.comparisonService.isFull()) {
        this.comparisonService.addCar(this.car());
      }
    }
  }
}
