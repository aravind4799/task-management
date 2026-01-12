import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { lastValueFrom } from 'rxjs';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

type SpyOf<T> = { [K in keyof T]: ReturnType<typeof vi.fn> };
const createSpyObj = <T extends object>(methods: (keyof T | string)[]): SpyOf<T> =>
  methods.reduce((acc, method) => {
    (acc as any)[method] = vi.fn();
    return acc;
  }, {} as SpyOf<T>);

describe('authInterceptor', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let authService: SpyOf<AuthService>;

  beforeEach(() => {
    authService = createSpyObj<AuthService>(['getToken']);
    const routerSpy = createSpyObj<Router>(['navigate']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: routerSpy },
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should add Authorization header when token exists', () => {
    authService.getToken.mockReturnValue('mock-token');

    httpClient.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.has('Authorization')).toBe(true);
    expect(req.request.headers.get('Authorization')).toBe('Bearer mock-token');
    req.flush({});
  });

  it('should not add Authorization header when token does not exist', () => {
    authService.getToken.mockReturnValue(null);

    httpClient.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('should handle successful requests', () => {
    authService.getToken.mockReturnValue('mock-token');

    httpClient.get('/api/test').subscribe({
      next: (data) => {
        expect(data).toEqual({ success: true });
      },
    });

    const req = httpMock.expectOne('/api/test');
    req.flush({ success: true });
  });

  it('should handle error responses', async () => {
    authService.getToken.mockReturnValue('mock-token');

    const requestPromise = lastValueFrom(httpClient.get('/api/test'));
    const req = httpMock.expectOne('/api/test');
    req.error(new ProgressEvent('Unauthorized'), { status: 401, statusText: 'Unauthorized' });

    await expect(requestPromise).rejects.toBeTruthy();
  });
});
