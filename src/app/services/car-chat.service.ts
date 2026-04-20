import { isDevMode, Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export type OptionType = 'text' | 'car' | 'search' | 'restart' | 'compare';

export interface ChatOption {
  label: string;
  value: string;
  type: OptionType;
}

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
  options?: ChatOption[];
  showSkip?: boolean;
}

export interface ChatResponse {
  reply: string;
  options?: ChatOption[];
  show_skip?: boolean;
  profile?: Record<string, unknown>;
}

@Injectable({ providedIn: 'root' })
export class CarChatService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private userId: string | null = null;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.userId = localStorage.getItem('car_assistant_user_id');
      if (!this.userId) {
        this.userId = 'user_' + Math.random().toString(36).substring(2, 11);
        localStorage.setItem('car_assistant_user_id', this.userId);
      }
    } else {
      this.userId = 'ssr_user';
    }
  }

  /** Calls the Python backend (FastAPI) which uses Gemini API. */
  completeChat(messages: ChatTurn[]): Observable<ChatResponse> {
    const backendUrl = isDevMode() ? 'http://localhost:8000/api/chat' : '/api/chat';
    
    // We only send roll and content to the backend
    const sanitizedMessages = messages.map(m => ({ role: m.role, content: m.content }));

    return this.http.post<ChatResponse>(backendUrl, { 
      user_id: this.userId,
      messages: sanitizedMessages 
    }).pipe(
      catchError((err) => {
        const msg =
          err?.error && typeof err.error === 'object' && 'detail' in err.error
            ? String((err.error as { detail?: string }).detail)
            : err?.message ?? 'Chat request failed';
        return throwError(() => new Error(msg));
      })
    );
  }
}
