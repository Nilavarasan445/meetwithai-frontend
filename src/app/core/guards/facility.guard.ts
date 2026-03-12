import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { FacilityService } from '../services/facility.service';

export const facilityGuard: CanActivateFn = (route, state) => {
  const facilityService = inject(FacilityService);
  const router = inject(Router);

  if (facilityService.getSelectedFacilityId()) {
    return true;
  }

  // If no facility selected, redirect to facilities selection page
  router.navigate(['/facilities']);
  return false;
};
