import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-redirect',
  standalone: true,
  template: '',
})
export class RedirectComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit(): void {
    this.router.navigate(['/login'], { queryParams: { returnUrl: '/tasks' } });
  }
}
