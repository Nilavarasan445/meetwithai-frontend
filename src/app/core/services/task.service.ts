import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Task, PaginatedResponse, TaskStatus } from '../models/models';
import { FacilityService } from './facility.service';
import { environment } from '../../../environments/environment';

const API = environment.apiUrl + '/api/tasks';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private facilityService = inject(FacilityService);
  constructor(private http: HttpClient) {}

  getTasks(meetingId?: number, status?: TaskStatus): Observable<PaginatedResponse<Task>> {
    let params = new HttpParams();
    if (meetingId) params = params.set('meeting', meetingId.toString());
    if (status) params = params.set('status', status);
    
    const facilityId = this.facilityService.getSelectedFacilityId();
    if (facilityId) params = params.set('facility', facilityId.toString());

    return this.http.get<PaginatedResponse<Task>>(`${API}/`, { params });
  }

  createTask(task: Partial<Task>): Observable<Task> {
    const facilityId = this.facilityService.getSelectedFacilityId();
    const data = { ...task };
    if (facilityId) data.facility = facilityId;
    return this.http.post<Task>(`${API}/`, data);
  }

  updateTask(id: number, changes: Partial<Task>): Observable<Task> {
    return this.http.patch<Task>(`${API}/${id}/`, changes);
  }

  deleteTask(id: number): Observable<void> {
    return this.http.delete<void>(`${API}/${id}/`);
  }

  updateTaskStatus(id: number, status: TaskStatus): Observable<Task> {
    return this.updateTask(id, { status });
  }
}
