import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FacilityService } from './facility.service';
import { environment } from '../../../environments/environment';

const API = environment.apiUrl + '/api/integrations';

export interface IntegrationStatus {
  google: { connected: boolean; email?: string };
  microsoft: { connected: boolean; email?: string };
}

export interface Recording {
  id: string;
  name: string;
  size?: number;
  createdTime: string;
  webViewLink?: string;
}

@Injectable({ providedIn: 'root' })
export class IntegrationService {
  private facilityService = inject(FacilityService);
  constructor(private http: HttpClient) {}

  getStatus(): Observable<IntegrationStatus> {
    return this.http.get<IntegrationStatus>(`${API}/status/`);
  }

  disconnect(provider: 'google' | 'microsoft'): Observable<any> {
    return this.http.delete(`${API}/${provider}/disconnect/`);
  }

  // ── Google ──────────────────────────────────────────────────────────────────

  getGoogleAuthUrl(): Observable<{ url: string }> {
    return this.http.get<{ url: string }>(`${API}/google/auth-url/`);
  }

  googleCallback(code: string): Observable<any> {
    return this.http.post(`${API}/google/callback/`, { code });
  }

  getGoogleRecordings(): Observable<{ recordings: Recording[] }> {
    return this.http.get<{ recordings: Recording[] }>(`${API}/google/recordings/`);
  }

  importGoogleRecording(fileId: string, fileName: string, title: string): Observable<{ meeting_id: number }> {
    const facility = this.facilityService.getSelectedFacilityId();
    return this.http.post<{ meeting_id: number }>(`${API}/google/import/`, {
      file_id: fileId,
      file_name: fileName,
      title,
      facility,
    });
  }

  // ── Microsoft ────────────────────────────────────────────────────────────────

  getMicrosoftAuthUrl(): Observable<{ url: string }> {
    return this.http.get<{ url: string }>(`${API}/microsoft/auth-url/`);
  }

  microsoftCallback(code: string): Observable<any> {
    return this.http.post(`${API}/microsoft/callback/`, { code });
  }

  getMicrosoftRecordings(): Observable<{ recordings: Recording[] }> {
    return this.http.get<{ recordings: Recording[] }>(`${API}/microsoft/recordings/`);
  }

  importMicrosoftRecording(fileId: string, fileName: string, title: string): Observable<{ meeting_id: number }> {
    const facility = this.facilityService.getSelectedFacilityId();
    return this.http.post<{ meeting_id: number }>(`${API}/microsoft/import/`, {
      file_id: fileId,
      file_name: fileName,
      title,
      facility,
    });
  }
  getCalendarEvents(): Observable<{ events: any[] }> {
    return this.http.get<{ events: any[] }>(`${API}/calendar/events/`);
  }
}
