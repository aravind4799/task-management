import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done';
  category: 'work' | 'personal';
  organizationId: string;
  createdById: string;
  assignedToId?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: {
    id: string;
    email: string;
  };
  assignedTo?: {
    id: string;
    email: string;
  } | null;
  organization?: {
    id: string;
    name: string;
  };
}

export interface CreateTaskRequest {
  title: string;
  description: string;
  status?: 'todo' | 'in_progress' | 'done';
  category: 'work' | 'personal';
  assignedToId?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: 'todo' | 'in_progress' | 'done';
  category?: 'work' | 'personal';
  assignedToId?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string;
  userId: string;
  details: string;
  createdAt: Date;
  user?: {
    id: string;
    email: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private readonly apiUrl = environment.apiUrl;
  private taskUpdated = new Subject<void>();
  private tasksSubject = new BehaviorSubject<Task[]>([]);

  // Observable that components can subscribe to
  public taskUpdated$ = this.taskUpdated.asObservable();
  public tasks$ = this.tasksSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Get the current tasks without triggering a new HTTP request
   */
  getCurrentTasks(): Task[] {
    return this.tasksSubject.value;
  }

  /**
   * Fetch the latest tasks from the API and push them to the shared stream.
   * Returns the HTTP observable so callers can react to loading/errors.
   */
  refreshTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.apiUrl}/tasks`).pipe(
      tap((tasks) => this.tasksSubject.next(tasks)),
    );
  }

  getTasks(): Observable<Task[]> {
    // Alias to keep existing call sites working while ensuring the cache updates.
    return this.refreshTasks();
  }

  getTask(id: string): Observable<Task> {
    return this.http.get<Task>(`${this.apiUrl}/tasks/${id}`);
  }

  createTask(task: CreateTaskRequest): Observable<Task> {
    return this.http.post<Task>(`${this.apiUrl}/tasks`, task).pipe(
      tap((createdTask) => {
        // Immediately reflect the newly created task in the shared stream
        const current = this.tasksSubject.value;
        this.tasksSubject.next([createdTask, ...current]);
        this.taskUpdated.next();
      }),
    );
  }

  updateTask(id: string, task: UpdateTaskRequest): Observable<Task> {
    return this.http.put<Task>(`${this.apiUrl}/tasks/${id}`, task).pipe(
      tap((updatedTask) => {
        const current = this.tasksSubject.value;
        const index = current.findIndex((t) => t.id === updatedTask.id);
        if (index !== -1) {
          const updatedList = [...current];
          updatedList[index] = updatedTask;
          this.tasksSubject.next(updatedList);
        } else {
          this.tasksSubject.next([updatedTask, ...current]);
        }
        this.taskUpdated.next();
      }),
    );
  }

  deleteTask(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/tasks/${id}`).pipe(
      tap(() => {
        const filtered = this.tasksSubject.value.filter((task) => task.id !== id);
        this.tasksSubject.next(filtered);
        this.taskUpdated.next();
      }),
    );
  }

  getAuditLogs(): Observable<AuditLog[]> {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/fb50234f-b9d6-4410-b1dc-d658e4666f84',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'task.service.ts:getAuditLogs:before',message:'getAuditLogs called',data:{apiUrl:this.apiUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'audit1',hypothesisId:'H3'})}).catch(()=>{});
    // #endregion
    return this.http.get<AuditLog[]>(`${this.apiUrl}/tasks/audit-log`).pipe(
      tap((logs) => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/fb50234f-b9d6-4410-b1dc-d658e4666f84',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'task.service.ts:getAuditLogs:success',message:'getAuditLogs success',data:{logsCount:logs.length},timestamp:Date.now(),sessionId:'debug-session',runId:'audit1',hypothesisId:'H3'})}).catch(()=>{});
        // #endregion
      }),
    );
  }
}

