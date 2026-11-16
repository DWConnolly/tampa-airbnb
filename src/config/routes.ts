// Every client-side route. The Vite build writes an index.html copy for each
// so GitHub Pages serves them directly (HTTP 200) with their own metadata.
export interface PageRoute {
  path: string;
  title: string;
  description: string;
  noindex?: boolean;
}

export const pageRoutes = {
  book: { path: 'book/', title: 'Request to book | Blue Bliss By The Bay', description: 'Check dates and send a direct booking request for Blue Bliss By The Bay in Tampa Heights. Stays starting within 7 days are booked on Airbnb.' },
  cancellation: { path: 'policies/cancellation/', title: 'Cancellation policy | Blue Bliss By The Bay', description: 'Cancellation policy for direct bookings at Blue Bliss By The Bay.' },
  houseRules: { path: 'policies/house-rules/', title: 'House rules | Blue Bliss By The Bay', description: 'House rules for Blue Bliss By The Bay in Tampa Heights.' },
  rentalTerms: { path: 'policies/rental-terms/', title: 'Rental terms | Blue Bliss By The Bay', description: 'Rental terms for direct bookings at Blue Bliss By The Bay.' },
  privacy: { path: 'policies/privacy/', title: 'Privacy | Blue Bliss By The Bay', description: 'How the Blue Bliss By The Bay website handles booking information.' },
} satisfies Record<string, PageRoute>;

export const policyRouteKeys = ['cancellation', 'houseRules', 'rentalTerms', 'privacy'] as const;
export type PolicyKey = (typeof policyRouteKeys)[number];
