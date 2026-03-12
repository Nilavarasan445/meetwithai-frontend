import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { PaginatedResponse } from '../models/models';

export interface Facility {
  id: number;
  name: string;
  description: string;
  owner?: string;
  owner_email?: string;
  members?: number[];
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root',
})
export class FacilityService {
  private apiUrl = '/api/facilities/';
  
  // Use signals for reactive storage of selected facility
  selectedFacility = signal<Facility | null>(null);

  constructor(private http: HttpClient) {
    const saved = localStorage.getItem('selectedFacility');
    if (saved) {
      try {
        this.selectedFacility.set(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved facility', e);
      }
    }
  }

  getFacilities(): Observable<PaginatedResponse<Facility>> {
    return this.http.get<PaginatedResponse<Facility>>(this.apiUrl);
  }

  createFacility(facility: Partial<Facility>): Observable<Facility> {
    return this.http.post<Facility>(this.apiUrl, facility);
  }

  setSelectedFacility(facility: Facility | null): void {
    if (facility) {
      localStorage.setItem('selectedFacility', JSON.stringify(facility));
    } else {
      localStorage.removeItem('selectedFacility');
    }
    this.selectedFacility.set(facility);
  }

  getSelectedFacilityId(): number | null {
    return this.selectedFacility()?.id || null;
  }
}
