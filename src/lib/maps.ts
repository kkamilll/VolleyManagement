/**
 * Returns a direct Google Maps URL for an event location.
 * If an explicit pin URL (`locationUrl`) is provided, uses that exact link;
 * otherwise falls back to a Google Maps search query for the address text.
 */
export function getGoogleMapsUrl(location?: string, locationUrl?: string): string | null {
  if (locationUrl && locationUrl.trim()) {
    const trimmed = locationUrl.trim();
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  }
  if (location && location.trim()) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.trim())}`;
  }
  return null;
}
