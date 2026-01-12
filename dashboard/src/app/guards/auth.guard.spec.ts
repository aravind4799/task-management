import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

type SpyOf<T> = { [K in keyof T]: ReturnType<typeof vi.fn> };
const createSpyObj = <T extends object>(methods: (keyof T | string)[]): SpyOf<T> =>
  methods.reduce((acc, method) => {
    (acc as any)[method] = vi.fn();
    return acc;
  }, {} as SpyOf<T>);

describe('authGuard', () => {
  let authService: SpyOf<AuthService>;
  let router: SpyOf<Router>;
  let mockRoute: ActivatedRouteSnapshot;
  let mockState: RouterStateSnapshot;

  beforeEach(() => {
    authService = createSpyObj<AuthService>(['isAuthenticated']);
    router = createSpyObj<Router>(['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    });

    mockRoute = {} as ActivatedRouteSnapshot;
    mockState = { url: '/tasks' } as RouterStateSnapshot;
  });

  it('should allow access when user is authenticated', () => {
    authService.isAuthenticated.mockReturnValue(true);

    const result = TestBed.runInInjectionContext(() =>
      authGuard(mockRoute, mockState)
    );

    expect(result).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should redirect to login when user is not authenticated', () => {
    authService.isAuthenticated.mockReturnValue(false);

    const result = TestBed.runInInjectionContext(() =>
      authGuard(mockRoute, mockState)
    );

    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(
      ['/login'],
      { queryParams: { returnUrl: '/tasks' } }
    );
  });

  it('should pass returnUrl in query params', () => {
    authService.isAuthenticated.mockReturnValue(false);
    mockState = { url: '/tasks/new' } as RouterStateSnapshot;

    TestBed.runInInjectionContext(() =>
      authGuard(mockRoute, mockState)
    );

    expect(router.navigate).toHaveBeenCalledWith(
      ['/login'],
      { queryParams: { returnUrl: '/tasks/new' } }
    );
  });
});
