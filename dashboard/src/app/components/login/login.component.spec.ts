import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../services/auth.service';

type SpyOf<T> = { [K in keyof T]: ReturnType<typeof vi.fn> };
const createSpyObj = <T extends object>(methods: (keyof T | string)[]): SpyOf<T> =>
  methods.reduce((acc, method) => {
    (acc as any)[method] = vi.fn();
    return acc;
  }, {} as SpyOf<T>);

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: SpyOf<AuthService>;
  let router: Router;
  let navigateSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    authService = createSpyObj<AuthService>(['login', 'isAuthenticated', 'getCurrentUser']);
    authService.isAuthenticated.mockReturnValue(false);
    authService.getCurrentUser.mockReturnValue(null);

    await TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule, RouterTestingModule],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compileComponents();

    router = TestBed.inject(Router);
    navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true as any);

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty values', () => {
    expect(component.loginForm.get('email')?.value).toBe('');
    expect(component.loginForm.get('password')?.value).toBe('');
  });

  it('should validate email field as required', () => {
    const emailControl = component.loginForm.get('email');
    
    emailControl?.setValue('');
    expect(emailControl?.hasError('required')).toBe(true);
    expect(emailControl?.valid).toBe(false);
  });

  it('should validate email format', () => {
    const emailControl = component.loginForm.get('email');
    
    emailControl?.setValue('invalid-email');
    expect(emailControl?.hasError('email')).toBe(true);
    
    emailControl?.setValue('valid@email.com');
    expect(emailControl?.hasError('email')).toBe(false);
  });

  it('should validate password field as required', () => {
    const passwordControl = component.loginForm.get('password');
    
    passwordControl?.setValue('');
    expect(passwordControl?.hasError('required')).toBe(true);
  });

  it('should validate password minimum length', () => {
    const passwordControl = component.loginForm.get('password');
    
    passwordControl?.setValue('12345');
    expect(passwordControl?.hasError('minlength')).toBe(true);
    
    passwordControl?.setValue('123456');
    expect(passwordControl?.hasError('minlength')).toBe(false);
  });

  it('should disable submit when form is invalid', () => {
    component.loginForm.get('email')?.setValue('');
    component.loginForm.get('password')?.setValue('');
    
    expect(component.loginForm.invalid).toBe(true);
  });

  it('should enable submit when form is valid', () => {
    component.loginForm.get('email')?.setValue('test@example.com');
    component.loginForm.get('password')?.setValue('password123');
    
    expect(component.loginForm.valid).toBe(true);
  });

  it('should call authService.login on valid form submission', () => {
    const mockResponse = {
      access_token: 'token',
      user: {
        id: '123',
        email: 'test@example.com',
        role: 'owner',
        organizationId: 'org-123',
      },
    };

    authService.login.mockReturnValue(of(mockResponse));

    component.loginForm.patchValue({
      email: 'test@example.com',
      password: 'password123',
    });

    component.onSubmit();

    expect(authService.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('should navigate to /tasks on successful login', () => {
    const mockResponse = {
      access_token: 'token',
      user: {
        id: '123',
        email: 'test@example.com',
        role: 'owner',
        organizationId: 'org-123',
      },
    };

    authService.login.mockReturnValue(of(mockResponse));

    component.loginForm.patchValue({
      email: 'test@example.com',
      password: 'password123',
    });

    component.onSubmit();

    expect(navigateSpy).toHaveBeenCalledWith(['/tasks']);
    expect(component.loading).toBe(false);
  });

  it('should show error message on login failure', () => {
    const errorResponse = {
      error: { message: 'Invalid credentials' },
    };

    authService.login.mockReturnValue(throwError(() => errorResponse));

    component.loginForm.patchValue({
      email: 'test@example.com',
      password: 'wrongpassword',
    });

    component.onSubmit();

    expect(component.error).toBe('Invalid credentials');
    expect(component.loading).toBe(false);
  });

  it('should set loading state during login', () => {
    authService.login.mockReturnValue(of({
      access_token: 'token',
      user: { id: '123', email: 'test@example.com', role: 'owner', organizationId: 'org-123' },
    }));

    component.loginForm.patchValue({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(component.loading).toBe(false);
    component.onSubmit();
    expect(component.loading).toBe(false);
  });

  it('should not submit if form is invalid', () => {
    component.loginForm.patchValue({
      email: 'invalid',
      password: '123',
    });

    component.onSubmit();

    expect(authService.login).not.toHaveBeenCalled();
  });
});
