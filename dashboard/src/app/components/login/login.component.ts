import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService, LoginRequest } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  error: string | null = null;
  loading = false;
  returnUrl: string = '/tasks';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  ngOnInit(): void {
    // If already logged in, redirect to tasks or returnUrl
    if (this.authService.isAuthenticated()) {
      const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/tasks';
      this.router.navigate([returnUrl]);
      return;
    }

    // Get returnUrl from query parameters
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/tasks';
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.loading = true;
      this.error = null;

      const credentials: LoginRequest = this.loginForm.value;
      this.authService.login(credentials).subscribe({
        next: () => {
          this.router.navigate([this.returnUrl]);
          this.loading = false;
        },
        error: (err) => {
          this.error = err.error?.message || 'Login failed. Please check your credentials.';
          this.loading = false;
        },
      });
    }
  }
}

