import { ChangeDetectionStrategy, Component, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComparisonService } from '../../services/comparison.service';
import { UserPreferencesService } from '../../services/user-preferences.service';
import { formatLakhInr } from '../../utils/format-price';

@Component({
  selector: 'app-car-comparison',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (show()) {
      <div
        class="fixed inset-0 z-40 bg-stone-900/60 backdrop-blur-md"
        (click)="close.emit()"
        aria-hidden="true"
      ></div>
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-label="Car Comparison"
      >
        <div
          class="w-full max-w-6xl max-h-[90vh] bg-white rounded-3xl shadow-2xl flex flex-col"
          (click)="$event.stopPropagation()"
        >
          <!-- Header -->
          <header class="sticky top-0 z-10 border-b border-stone-100 bg-white px-8 py-6 rounded-t-3xl">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-3xl font-semibold text-stone-900">Compare Cars</h2>
                <p class="mt-1 text-sm text-stone-500">{{ comparisonService.count() }} of 4 cars selected</p>
              </div>
              <button
                type="button"
                class="rounded-full border border-stone-200 px-3 py-1.5 text-sm text-stone-600 transition hover:bg-stone-50"
                (click)="close.emit()"
              >
                Close
              </button>
            </div>
          </header>

          <!-- Comparison Table -->
          <div class="flex-1 overflow-auto px-8 py-6">
            <div class="overflow-x-auto">
              <table class="w-full border-collapse">
                <thead class="sticky top-0 bg-stone-50">
                  <tr>
                    <th class="text-left px-4 py-3 font-semibold text-stone-900 bg-white border-b border-stone-200 w-40 sticky left-0 z-10">
                      Specification
                    </th>
                    @for (car of comparisonService.cars(); track car.id) {
                      <th class="px-4 py-3 font-semibold text-stone-900 text-center border-b border-stone-200 min-w-48">
                        <div class="font-semibold text-sm text-stone-900">{{ car.name }}</div>
                        <div class="text-xs text-stone-500 font-normal">{{ car.company }}</div>
                      </th>
                    }
                  </tr>
                </thead>
                <tbody class="divide-y divide-stone-200">
                  <!-- Price -->
                  <tr>
                    <td class="px-4 py-3 font-medium text-stone-900 bg-stone-50 sticky left-0 z-10 border-r border-stone-200">Price</td>
                    @for (car of comparisonService.cars(); track car.id) {
                      <td class="px-4 py-3 text-center text-stone-900">
                        <span class="font-semibold text-lg">{{ formatPrice(car.priceLakh) }}</span>
                      </td>
                    }
                  </tr>

                  <!-- Body Type -->
                  <tr>
                    <td class="px-4 py-3 font-medium text-stone-900 bg-stone-50 sticky left-0 z-10 border-r border-stone-200">Body Type</td>
                    @for (car of comparisonService.cars(); track car.id) {
                      <td class="px-4 py-3 text-center">
                        <span [class.font-semibold]="matchesBodyType(car.bodyType)" [class.text-emerald-700]="matchesBodyType(car.bodyType)">
                          {{ car.bodyType }}
                        </span>
                        @if (matchesBodyType(car.bodyType)) {
                          <span class="ml-1 text-emerald-500 text-xs" title="Matches your preference">✓</span>
                        }
                      </td>
                    }
                  </tr>

                  <!-- Fuel Type -->
                  <tr>
                    <td class="px-4 py-3 font-medium text-stone-900 bg-stone-50 sticky left-0 z-10 border-r border-stone-200">Fuel Type</td>
                    @for (car of comparisonService.cars(); track car.id) {
                      <td class="px-4 py-3 text-center">
                        <span [class.font-semibold]="matchesFuel(car.fuel)" [class.text-emerald-700]="matchesFuel(car.fuel)">
                          {{ car.fuel }}
                        </span>
                        @if (matchesFuel(car.fuel)) {
                          <span class="ml-1 text-emerald-500 text-xs" title="Matches your preference">✓</span>
                        }
                      </td>
                    }
                  </tr>

                  <!-- Transmission -->
                  <tr>
                    <td class="px-4 py-3 font-medium text-stone-900 bg-stone-50 sticky left-0 z-10 border-r border-stone-200">Transmission</td>
                    @for (car of comparisonService.cars(); track car.id) {
                      <td class="px-4 py-3 text-center">
                        <span [class.font-semibold]="matchesBodyType(car.bodyType)" [class.text-emerald-700]="matchesBodyType(car.bodyType)">
                          {{ car.transmission }}
                        </span>
                      </td>
                    }
                  </tr>

                  <!-- Seating -->
                  <tr>
                    <td class="px-4 py-3 font-medium text-stone-900 bg-stone-50 sticky left-0 z-10 border-r border-stone-200">Seating</td>
                    @for (car of comparisonService.cars(); track car.id) {
                      <td class="px-4 py-3 text-center text-stone-700">{{ car.seating }} seats</td>
                    }
                  </tr>

                  <!-- Mileage City -->
                  <tr>
                    <td class="px-4 py-3 font-medium text-stone-900 bg-stone-50 sticky left-0 z-10 border-r border-stone-200">Mileage (City)</td>
                    @for (car of comparisonService.cars(); track car.id) {
                      <td class="px-4 py-3 text-center text-stone-700">
                        {{ car.mileageCity }}{{ car.fuel === 'EV' ? ' km/kWh' : ' km/l' }}
                      </td>
                    }
                  </tr>

                  <!-- Mileage Highway -->
                  <tr>
                    <td class="px-4 py-3 font-medium text-stone-900 bg-stone-50 sticky left-0 z-10 border-r border-stone-200">Mileage (Highway)</td>
                    @for (car of comparisonService.cars(); track car.id) {
                      <td class="px-4 py-3 text-center text-stone-700">
                        {{ car.mileageHighway }}{{ car.fuel === 'EV' ? ' km/kWh' : ' km/l' }}
                      </td>
                    }
                  </tr>

                  <!-- Safety Rating -->
                  <tr>
                    <td class="px-4 py-3 font-medium text-stone-900 bg-stone-50 sticky left-0 z-10 border-r border-stone-200">Safety Rating</td>
                    @for (car of comparisonService.cars(); track car.id) {
                      <td class="px-4 py-3 text-center text-stone-700">{{ car.safetyRating }}★</td>
                    }
                  </tr>

                  <!-- Reviews -->
                  <tr>
                    <td class="px-4 py-3 font-medium text-stone-900 bg-stone-50 sticky left-0 z-10 border-r border-stone-200">Reviews Score</td>
                    @for (car of comparisonService.cars(); track car.id) {
                      <td class="px-4 py-3 text-center text-stone-700">{{ car.reviewsScore.toFixed(1) }}/5</td>
                    }
                  </tr>

                  <!-- Post-Purchase Service -->
                  <tr>
                    <td class="px-4 py-3 font-medium text-stone-900 bg-stone-50 sticky left-0 z-10 border-r border-stone-200">Service Score</td>
                    @for (car of comparisonService.cars(); track car.id) {
                      <td class="px-4 py-3 text-center text-stone-700">{{ car.postPurchaseServiceScore }}/10</td>
                    }
                  </tr>

                  <!-- Luggage -->
                  <tr>
                    <td class="px-4 py-3 font-medium text-stone-900 bg-stone-50 sticky left-0 z-10 border-r border-stone-200">Luggage</td>
                    @for (car of comparisonService.cars(); track car.id) {
                      <td class="px-4 py-3 text-center text-stone-700">{{ car.luggageLitres }} L</td>
                    }
                  </tr>

                  <!-- Ground Clearance -->
                  <tr>
                    <td class="px-4 py-3 font-medium text-stone-900 bg-stone-50 sticky left-0 z-10 border-r border-stone-200">Ground Clearance</td>
                    @for (car of comparisonService.cars(); track car.id) {
                      <td class="px-4 py-3 text-center text-stone-700">{{ car.groundClearanceMm }} mm</td>
                    }
                  </tr>

                  <!-- Launch Year -->
                  <tr>
                    <td class="px-4 py-3 font-medium text-stone-900 bg-stone-50 sticky left-0 z-10 border-r border-stone-200">Launch Year</td>
                    @for (car of comparisonService.cars(); track car.id) {
                      <td class="px-4 py-3 text-center text-stone-700">{{ car.launchYear }}</td>
                    }
                  </tr>

                  <!-- Infotainment -->
                  <tr>
                    <td class="px-4 py-3 font-medium text-stone-900 bg-stone-50 sticky left-0 z-10 border-r border-stone-200">Infotainment</td>
                    @for (car of comparisonService.cars(); track car.id) {
                      <td class="px-4 py-3 text-center text-stone-700 text-sm">{{ car.infotainmentSystem }}</td>
                    }
                  </tr>

                  <!-- Actions -->
                  <tr>
                    <td class="px-4 py-3 font-medium text-stone-900 bg-stone-50 sticky left-0 z-10 border-r border-stone-200">Remove</td>
                    @for (car of comparisonService.cars(); track car.id) {
                      <td class="px-4 py-3 text-center">
                        <button
                          type="button"
                          class="text-xs px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 transition"
                          (click)="comparisonService.removeCar(car.id)"
                        >
                          Remove
                        </button>
                      </td>
                    }
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Footer -->
          <footer class="sticky bottom-0 border-t border-stone-100 bg-white px-8 py-4 rounded-b-3xl flex gap-3">
            <button
              type="button"
              class="px-4 py-2 text-sm font-medium bg-stone-100 text-stone-600 rounded-lg hover:bg-stone-200 transition"
              (click)="clearAll.emit()"
            >
              Clear All
            </button>
            <button
              type="button"
              class="px-4 py-2 text-sm font-medium bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition ml-auto"
              (click)="close.emit()"
            >
              Done
            </button>
          </footer>
        </div>
      </div>
    }
  `
})
export class CarComparisonComponent {
  readonly show = input(false);
  readonly close = output<void>();    // just hide panel, keep cars
  readonly clearAll = output<void>(); // clear list + hide panel

  protected readonly comparisonService = inject(ComparisonService);
  protected readonly prefsService = inject(UserPreferencesService);
  protected formatPrice = formatLakhInr;

  protected matchesFuel(fuel: string): boolean {
    const prefs = this.prefsService.prefs().preferred_fuel;
    return prefs.length > 0 && prefs.some(f => f.toLowerCase() === fuel.toLowerCase());
  }

  protected matchesBodyType(bodyType: string): boolean {
    const prefs = this.prefsService.prefs().preferred_body_types;
    return prefs.length > 0 && prefs.some(b => b.toLowerCase() === bodyType.toLowerCase());
  }
}
