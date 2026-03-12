import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, interval, switchMap, takeWhile } from 'rxjs';
import { Meeting, PaginatedResponse } from '../models/models';
import { FacilityService } from './facility.service';

const API = '/api/meetings';

@Injectable({ providedIn: 'root' })
export class MeetingService {
  private facilityService = inject(FacilityService);
  constructor(private http: HttpClient) {}

  getMeetings(search?: string, status?: string): Observable<PaginatedResponse<Meeting>> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    if (status) params = params.set('status', status);
    
    const facilityId = this.facilityService.getSelectedFacilityId();
    if (facilityId) params = params.set('facility', facilityId.toString());

    return this.http.get<PaginatedResponse<Meeting>>(`${API}/`, { params });
  }

  getMeeting(id: number): Observable<Meeting> {
    return this.http.get<Meeting>(`${API}/${id}/`);
  }

  uploadMeeting(title: string, file: File): Observable<Meeting> {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('recording_file', file);
    
    const facilityId = this.facilityService.getSelectedFacilityId();
    if (facilityId) formData.append('facility', facilityId.toString());

    return this.http.post<Meeting>(`${API}/`, formData);
  }

  deleteMeeting(id: number): Observable<void> {
    return this.http.delete<void>(`${API}/${id}/`);
  }

  getMeetingStatus(id: number): Observable<{ id: number; status: string; error_message: string }> {
    return this.http.get<any>(`${API}/${id}/status/`);
  }

  pollMeetingStatus(id: number): Observable<any> {
    return interval(3000).pipe(
      switchMap(() => this.getMeetingStatus(id)),
      takeWhile((res) => res.status === 'pending' || res.status === 'transcribing' || res.status === 'analyzing', true)
    );
  }

  analyzeMeeting(id: number): Observable<any> {
    return this.http.post<any>(`${API}/${id}/analyze/`, {});
  }

  getTranscript(id: number): Observable<any> {
    return this.http.get<any>(`${API}/${id}/transcript/`);
  }
}
