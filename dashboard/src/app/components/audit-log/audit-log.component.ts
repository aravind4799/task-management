import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';
import { TaskService, AuditLog } from '../../services/task.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterModule],
  templateUrl: './audit-log.component.html',
  styleUrl: './audit-log.component.css',
})
export class AuditLogComponent implements OnInit {
  auditLogs: AuditLog[] = [];
  loading = false;
  error: string | null = null;
  currentUser: User | null = null;

  constructor(
    private authService: AuthService,
    private taskService: TaskService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();

    if (!this.canViewAuditLog) {
      this.error = 'You do not have permission to view audit logs.';
      return;
    }

    this.loadAuditLogs();
  }

  get canViewAuditLog(): boolean {
    const role = this.currentUser?.role;
    return role === 'owner' || role === 'admin';
  }

  loadAuditLogs(): void {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/fb50234f-b9d6-4410-b1dc-d658e4666f84',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'audit-log.component.ts:loadAuditLogs:before',message:'Load audit logs start',data:{currentUser:this.currentUser},timestamp:Date.now(),sessionId:'debug-session',runId:'audit1',hypothesisId:'H1'})}).catch(()=>{});
    // #endregion
    this.loading = true;
    this.error = null;
    this.taskService
      .getAuditLogs()
      .pipe(
        // Ensure loading always stops
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/fb50234f-b9d6-4410-b1dc-d658e4666f84',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'audit-log.component.ts:loadAuditLogs:finalize',message:'Load audit logs finalize',data:{auditLogsCount:this.auditLogs.length,errorPresent:!!this.error},timestamp:Date.now(),sessionId:'debug-session',runId:'audit1',hypothesisId:'H1,H5'})}).catch(()=>{});
          // #endregion
        }),
      )
      .subscribe({
        next: (logs) => {
          this.auditLogs = logs;
          this.cdr.detectChanges();
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/fb50234f-b9d6-4410-b1dc-d658e4666f84',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'audit-log.component.ts:loadAuditLogs:success',message:'Load audit logs success',data:{auditLogsCount:logs.length},timestamp:Date.now(),sessionId:'debug-session',runId:'audit1',hypothesisId:'H1'})}).catch(()=>{});
          // #endregion
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to load audit logs';
          this.cdr.detectChanges();
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/fb50234f-b9d6-4410-b1dc-d658e4666f84',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'audit-log.component.ts:loadAuditLogs:error',message:'Load audit logs error',data:{errorMessage:err?.message,status:err?.status},timestamp:Date.now(),sessionId:'debug-session',runId:'audit1',hypothesisId:'H2,H3'})}).catch(()=>{});
          // #endregion
        },
      });
  }

  goBack(): void {
    this.router.navigate(['/tasks']);
  }
}
