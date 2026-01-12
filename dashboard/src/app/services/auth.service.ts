import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, switchMap, take } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { TaskService } from './task.service';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  role: string;
  organizationId: string;
}

export interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    role: string;
    organizationId: string;
  };
}

export interface User {
  id: string;
  email: string;
  role: string;
  organizationId: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private taskService: TaskService,
  ) {
    // Load user from localStorage on service init
    const token = this.getToken();
    const user = this.getUserFromStorage();
    if (token && user) {
      this.currentUserSubject.next(user);
    }
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, credentials).pipe(
      tap((response) => {
        this.setToken(response.access_token);
        this.setUser(response.user);
        this.currentUserSubject.next(response.user);
      }),
      switchMap((response) =>
        // Prefetch tasks immediately after login so dashboard has data on first paint
        this.taskService.refreshTasks().pipe(
          take(1),
          tap(() => {}),
          // Return original auth response to keep caller behavior
          tap({
            next: () => {},
          }),
          // ensure auth response is emitted downstream
          switchMap(() => [response]),
        ),
      ),
    );
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, data).pipe(
      tap((response) => {
        this.setToken(response.access_token);
        this.setUser(response.user);
        this.currentUserSubject.next(response.user);
      }),
      switchMap((response) =>
        // Prefetch tasks for new users so dashboard is hydrated immediately
        this.taskService.refreshTasks().pipe(
          take(1),
          switchMap(() => [response]),
        ),
      ),
    );
  }

  logout(): void {
    this.removeToken();
    this.removeUser();
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token;
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  private setToken(token: string): void {
    localStorage.setItem('access_token', token);
  }

  private removeToken(): void {
    localStorage.removeItem('access_token');
  }

  private setUser(user: User): void {
    localStorage.setItem('current_user', JSON.stringify(user));
  }

  private getUserFromStorage(): User | null {
    const userStr = localStorage.getItem('current_user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  }

  private removeUser(): void {
    localStorage.removeItem('current_user');
  }
}

