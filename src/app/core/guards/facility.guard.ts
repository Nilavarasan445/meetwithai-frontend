import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { FacilityService } from '../services/facility.service';

export const facilityGuard: CanActivateFn = (route, state) => {
  // Allow access even without facility selected
  // The services will handle filtering accordingly
  return true;
};
