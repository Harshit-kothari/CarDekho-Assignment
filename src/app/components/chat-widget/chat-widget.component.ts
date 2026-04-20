import { ChangeDetectionStrategy, Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { take } from 'rxjs';
import { CarChatService, type ChatTurn, type ChatOption } from '../../services/car-chat.service';
import { CarCatalogService } from '../../services/car-catalog.service';
import { ComparisonService } from '../../services/comparison.service';
import { UserPreferencesService } from '../../services/user-preferences.service';

const GREETING: ChatTurn = {
  role: 'assistant',
  content: `Namaste! I'm your BharatMotors assistant.\n  \nI'll help you find the perfect car. What's your approximate budget in lakhs?`,
  options: [
    { label: "Under 10 Lakhs", value: "0-10", type: "text" },
    { label: "10 - 20 Lakhs", value: "10-20", type: "text" },
    { label: "Over 20 Lakhs", value: "20+", type: "text" },
    { label: "Skip preference", value: "Skip preference", type: "text" },
    { label: "Restart chat", value: "restart_chat", type: "restart" }
  ]
};

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (showTeaser()) {
      <div
        class="fixed bottom-24 right-4 z-[100] w-[min(calc(100vw-2rem),18rem)] rounded-2xl border border-stone-200 bg-white p-4 shadow-xl sm:right-6"
        role="status"
      >
        <div class="flex justify-between gap-2">
          <p class="text-sm leading-relaxed text-stone-700">
            <span class="font-semibold text-stone-900">New message</span>
            — Need help shortlisting a car? Tap the chat icon.
          </p>
          <button
            type="button"
            class="shrink-0 rounded-full p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
            (click)="dismissTeaser()"
            aria-label="Dismiss"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <button
          type="button"
          class="mt-3 w-full rounded-full bg-stone-900 py-2 text-sm font-medium text-white hover:bg-stone-800"
          (click)="openPanel()"
        >
          Open chat
        </button>
      </div>
    }

    <div class="fixed bottom-6 right-4 z-[100] sm:right-6">
      <button
        type="button"
        class="relative flex h-14 w-14 items-center justify-center rounded-full bg-stone-900 text-white shadow-lg ring-1 ring-stone-900/10 transition hover:bg-stone-800"
        (click)="togglePanel()"
        aria-label="Open car assistant chat"
      >
        @if (unread()) {
          <span
            class="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold leading-none text-white"
            >1</span>
        }
        <svg class="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path
            d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 0 1-4-.84L3 20l1.17-3.51A7.94 7.94 0 0 1 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8Z"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </div>

    @if (panelOpen()) {
      <!-- NO backdrop overlay — no dark tint on the rest of the page -->
      <section
        class="fixed inset-x-0 bottom-0 z-[120] flex max-h-[min(85dvh,32rem)] flex-col rounded-t-2xl border border-stone-200 bg-white shadow-2xl sm:inset-auto sm:bottom-6 sm:right-6 sm:w-[min(calc(100vw-2rem),24.5rem)] sm:max-h-[32rem] sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Car assistant chat"
        (click)="$event.stopPropagation()"
      >
        <header class="flex items-center justify-between border-b border-stone-100 px-4 py-3">
          <div>
            <h2 class="text-sm font-semibold text-stone-900">Car assistant</h2>
            <p class="text-xs text-stone-500">Gemini AI Profiler</p>
          </div>
          <button
            type="button"
            class="rounded-full px-2 py-1 text-xs font-medium text-stone-500 hover:bg-stone-100 hover:text-stone-800"
            (click)="closePanel()"
          >
            Close
          </button>
        </header>
        <div class="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-3">
          @for (m of messages(); track $index) {
            <div
              class="max-w-[92%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-relaxed"
              [class.ml-auto]="m.role === 'user'"
              [class.bg-stone-900]="m.role === 'user'"
              [class.text-white]="m.role === 'user'"
              [class.bg-stone-100]="m.role === 'assistant'"
              [class.text-stone-800]="m.role === 'assistant'"
            >
              {{ m.content }}
            </div>

            @if (m.role === 'assistant' && m.options && m.options.length > 0 && $last) {
              <div class="flex flex-wrap gap-2 py-2">
                @for (opt of m.options; track opt.value) {
                  @if (opt.type === 'car') {
                    <button
                      type="button"
                      class="w-full rounded-lg border-2 border-stone-200 bg-white px-4 py-3 text-left text-sm font-medium transition-all hover:bg-stone-50 hover:border-blue-500 active:scale-95"
                      (click)="selectOption(opt)"
                    >
                      {{ opt.label }}
                    </button>
                  } @else if (opt.type === 'compare') {
                    <button
                      type="button"
                      class="w-full rounded-full border border-emerald-500 bg-emerald-50 px-4 py-2 text-xs font-medium text-emerald-700 transition-all hover:bg-emerald-100 active:scale-95"
                      (click)="selectOption(opt)"
                    >
                      {{ opt.label }}
                    </button>
                  } @else if (opt.type === 'search') {
                    <button
                      type="button"
                      class="rounded-full border border-blue-600 bg-blue-600 px-4 py-2 text-xs font-medium text-white transition-all hover:bg-blue-700 active:scale-95"
                      (click)="selectOption(opt)"
                    >
                      {{ opt.label }}
                    </button>
                  } @else if (opt.type === 'restart') {
                    <button
                      type="button"
                      class="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-medium text-red-700 transition-all hover:bg-red-100 active:scale-95"
                      (click)="selectOption(opt)"
                    >
                      {{ opt.label }}
                    </button>
                  } @else {
                    <button
                      type="button"
                      [class.bg-white]="!selectedOptionValues().includes(opt.value)"
                      [class.border-stone-200]="!selectedOptionValues().includes(opt.value)"
                      [class.text-stone-700]="!selectedOptionValues().includes(opt.value)"
                      [class.bg-stone-900]="selectedOptionValues().includes(opt.value)"
                      [class.text-white]="selectedOptionValues().includes(opt.value)"
                      class="rounded-full border px-4 py-2 text-xs font-medium transition-all active:scale-95"
                      (click)="selectOption(opt)"
                    >
                      {{ opt.label }}
                    </button>
                  }
                }
              </div>
              @if (selectedOptionValues().length > 0) {
                <button
                  type="button"
                  class="mt-2 w-full rounded-full bg-stone-900 px-3 py-2 text-sm font-medium text-white hover:bg-stone-800"
                  (click)="continueSelection()"
                >
                  Continue
                </button>
              }
            }
          }
          @if (loading()) {
            <div class="flex items-center gap-2">
               <span class="flex h-1.5 w-1.5 animate-bounce rounded-full bg-stone-400"></span>
               <span class="flex h-1.5 w-1.5 animate-bounce rounded-full bg-stone-400 [animation-delay:0.2s]"></span>
               <span class="flex h-1.5 w-1.5 animate-bounce rounded-full bg-stone-400 [animation-delay:0.4s]"></span>
            </div>
          }
          @if (error()) {
            <p class="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">{{ error() }}</p>
          }
          <div #scrollEnd class="h-px w-full shrink-0"></div>
        </div>
        <form class="border-t border-stone-100 p-3" (submit)="$event.preventDefault(); send()">
          <div class="flex gap-2">
            <input
              name="draft"
              class="min-w-0 flex-1 rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none ring-stone-900/10 focus:border-stone-400 focus:ring-2"
              type="text"
              autocomplete="off"
              placeholder="Type your answer…"
              [(ngModel)]="draft"
              [disabled]="loading()"
            />
            <button
              type="submit"
              class="shrink-0 rounded-xl bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              [disabled]="loading() || !draft.trim()"
            >
              Send
            </button>
          </div>
        </form>
      </section>
    }
  `
})
export class ChatWidgetComponent {
  private readonly chat = inject(CarChatService);
  private readonly router = inject(Router);
  private readonly catalog = inject(CarCatalogService);
  private readonly comparisonService = inject(ComparisonService);
  private readonly prefsService = inject(UserPreferencesService);

  protected readonly panelOpen = signal(false);
  protected readonly teaserDismissed = signal(false);
  protected readonly unread = signal(true);
  protected readonly messages = signal<ChatTurn[]>([]);
  protected readonly selectedOptionValues = signal<string[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected draft = '';

  private readonly scrollEnd = viewChild<ElementRef<HTMLDivElement>>('scrollEnd');

  protected showTeaser(): boolean {
    return !this.teaserDismissed() && !this.panelOpen();
  }

  protected togglePanel(): void {
    if (this.panelOpen()) {
      this.closePanel();
    } else {
      this.openPanel();
    }
  }

  protected openPanel(): void {
    this.panelOpen.set(true);
    this.teaserDismissed.set(true);
    this.unread.set(false);
    if (this.messages().length === 0) {
      this.messages.set([GREETING]);
    }
    this.queueScroll();
  }

  protected closePanel(): void {
    this.panelOpen.set(false);
  }

  protected dismissTeaser(): void {
    this.teaserDismissed.set(true);
    this.unread.set(false);
  }

  protected selectOption(opt: ChatOption): void {
    if (opt.type === 'car') {
      this.router.navigate(['/browse'], { queryParams: { carId: opt.value } });
      return;
    }

    if (opt.type === 'compare') {
      // Add all recommended cars to the comparison list and navigate to browse
      this.draft = 'compare_recommended';
      this.send();
      return;
    }

    if (opt.type === 'restart') {
      this.prefsService.reset();
      this.draft = opt.value;
      this.send();
      return;
    }

    const selected = this.selectedOptionValues();
    if (opt.value === 'Skip preference') {
      this.selectedOptionValues.set([opt.value]);
      return;
    }

    const isSelected = selected.includes(opt.value);
    const nextValues = isSelected
      ? selected.filter((v) => v !== opt.value)
      : [...selected.filter((v) => v !== 'Skip preference'), opt.value];

    this.selectedOptionValues.set(nextValues);
  }

  protected continueSelection(): void {
    const values = this.selectedOptionValues();
    if (values.length === 0) return;
    this.draft = values.join(', ');
    this.selectedOptionValues.set([]);
    this.send();
  }

  protected handleSkip(): void {
    this.draft = 'Skip preference';
    this.send();
  }

  protected send(): void {
    const text = this.draft.trim();
    if (!text || this.loading()) return;

    this.error.set(null);
    this.messages.update((m) => [...m, { role: 'user', content: text }]);
    this.draft = '';
    this.selectedOptionValues.set([]);
    this.loading.set(true);
    this.queueScroll();

    this.chat
      .completeChat(this.messages())
      .pipe(take(1))
      .subscribe({
        next: (resp) => {
          // Sync user preferences if the backend returned a profile snapshot
          if (resp.profile) {
            this.prefsService.update(resp.profile as unknown as Parameters<typeof this.prefsService.update>[0]);
          }

          // Handle compare_recommended — add top cars to comparison
          if (text === 'compare_recommended' && resp.options) {
            const carOpts = resp.options.filter(o => o.type === 'car');
            this.comparisonService.clear();
            for (const opt of carOpts) {
              const car = this.catalog.allCars().find(c => c.id === opt.value);
              if (car) this.comparisonService.addCar(car);
            }
            // Navigate to browse — the floating comparison bar will appear, but with compare=true it auto-opens
            this.router.navigate(['/browse'], { queryParams: { compare: 'true' } });
          }

          this.messages.update((m) => [...m, {
            role: 'assistant',
            content: resp.reply,
            options: resp.options,
            showSkip: resp.show_skip
          }]);
          this.selectedOptionValues.set([]);
          this.loading.set(false);
          this.queueScroll();
        },
        error: (e: unknown) => {
          this.loading.set(false);
          this.error.set(e instanceof Error ? e.message : 'Something went wrong.');
        }
      });
  }

  private queueScroll(): void {
    setTimeout(() => this.scrollEnd()?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'end' }), 0);
  }
}
