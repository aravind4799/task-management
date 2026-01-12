import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AuthService, LoginRequest, RegisterRequest } from './auth.service';
import { TaskService } from './task.service';
import { of } from 'rxjs';
import { environment } from '../../environments/environment';

type SpyOf<T> = { [K in keyof T]: ReturnType<typeof vi.fn> };
const createSpyObj = <T extends object>(methods: (keyof T | string)[]): SpyOf<T> =>
  methods.reduce((acc, method) => {
    (acc as any)[method] = vi.fn();
    return acc;
  }, {} as SpyOf<T>);

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: SpyOf<Router>;
  let taskService: SpyOf<TaskService>;

  const mockLoginResponse = {
    access_token: 'mock-jwt-token',
    user: {
      id: 'user-123',
      email: 'test@example.com',
      role: 'owner',
      organizationId: 'org-123',
    },
  };

  beforeEach(() => {
    router = createSpyObj<Router>(['navigate']);
    taskService = createSpyObj<TaskService>(['refreshTasks']);
    taskService.refreshTasks.mockReturnValue(of([]));

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClientTesting(),
        { provide: Router, useValue: router },
        { provide: TaskService, useValue: taskService },
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);

    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should login successfully and store token', () => {
      const loginRequest: LoginRequest = {
        email: 'test@example.com',
        password: 'password123',
      };

      service.login(loginRequest).subscribe((response) => {
        expect(response).toEqual(mockLoginResponse);
        expect(localStorage.getItem('access_token')).toBe('mock-jwt-token');
        expect(localStorage.getItem('current_user')).toBeTruthy();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(loginRequest);
      req.flush(mockLoginResponse);
    });

    it('should update currentUser$ observable on login', () => {
      const loginRequest: LoginRequest = {
        email: 'test@example.com',
        password: 'password123',
      };

      let userReceived = false;
      service.currentUser$.subscribe((user) => {
        if (user && !userReceived) {
          userReceived = true;
          expect(user.email).toBe('test@example.com');
          expect(user.role).toBe('owner');
        }
      });

      service.login(loginRequest).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush(mockLoginResponse);
    });
  });

  describe('register', () => {
    it('should register successfully', () => {
      const registerRequest: RegisterRequest = {
        email: 'newuser@example.com',
        password: 'password123',
        role: 'admin',
        organizationId: 'org-123',
      };

      service.register(registerRequest).subscribe((response) => {
        expect(response).toEqual(mockLoginResponse);
        expect(localStorage.getItem('access_token')).toBe('mock-jwt-token');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/register`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(registerRequest);
      req.flush(mockLoginResponse);
    });
  });

  describe('logout', () => {
    it('should clear token and user data', () => {
      // Set up some data first
      localStorage.setItem('access_token', 'token');
      localStorage.setItem('current_user', JSON.stringify({ id: '123' }));

      service.logout();

      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('current_user')).toBeNull();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should set currentUser$ to null', () => {
      let nullReceived = false;
      service.currentUser$.subscribe((user) => {
        if (user === null && !nullReceived) {
          nullReceived = true;
          expect(user).toBeNull();
        }
      });

      service.logout();
      expect(nullReceived).toBe(true);
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when token exists', () => {
      localStorage.setItem('access_token', 'mock-token');

      expect(service.isAuthenticated()).toBe(true);
    });

    it('should return false when token does not exist', () => {
      localStorage.removeItem('access_token');

      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('getToken', () => {
    it('should return token from localStorage', () => {
      localStorage.setItem('access_token', 'mock-token');

      expect(service.getToken()).toBe('mock-token');
    });

    it('should return null if no token', () => {
      expect(service.getToken()).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user from observable', () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'owner',
        organizationId: 'org-123',
      };

      localStorage.setItem('current_user', JSON.stringify(mockUser));
      localStorage.setItem('access_token', 'token');

      // Create new service instance to load from localStorage
      const newService = new AuthService(
        TestBed.inject(HttpClient) as any,
        router as any,
        taskService as any,
      );

      expect(newService.getCurrentUser()?.email).toBe('test@example.com');
    });
  });
});
