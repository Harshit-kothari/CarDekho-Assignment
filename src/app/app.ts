import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ChatWidgetComponent } from './components/chat-widget/chat-widget.component';
import { CarComparisonComponent } from './components/car-comparison/car-comparison.component';
import { ComparisonService } from './services/comparison.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ChatWidgetComponent, CarComparisonComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  protected readonly comparison = inject(ComparisonService);
}
