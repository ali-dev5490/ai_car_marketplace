import type { SyntheticEvent } from 'react';

/** Local stand-in when a remote listing photo 403s or fails to load. */
export const LISTING_IMAGE_FALLBACK = '/car-placeholder.svg';

export function onListingImageError(event: SyntheticEvent<HTMLImageElement>) {
  const img = event.currentTarget;
  if (img.dataset.fallbackApplied === '1') return;
  img.dataset.fallbackApplied = '1';
  img.src = LISTING_IMAGE_FALLBACK;
}
