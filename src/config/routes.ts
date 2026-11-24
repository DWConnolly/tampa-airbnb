// Every client-side route. The Vite build writes an index.html copy for each
// so GitHub Pages serves them directly (HTTP 200) with their own metadata.
export const siteTitle = 'Blue Bliss | 3BR TPA Heights| Armature/Riverwalk';

export interface PageRoute {
  path: string;
  title: string;
  description: string;
  noindex?: boolean;
}

export const pageRoutes = {
  book: { path: 'book/', title: siteTitle, description: 'Prepare an availability enquiry for Blue Bliss By The Bay with our guided stay assistant. The host confirms dates and price by email.' },
  cancellation: { path: 'policies/cancellation/', title: siteTitle, description: 'Cancellation policy for direct bookings at Blue Bliss By The Bay.' },
  houseRules: { path: 'policies/house-rules/', title: siteTitle, description: 'House rules for Blue Bliss By The Bay in Tampa Heights.' },
  rentalTerms: { path: 'policies/rental-terms/', title: siteTitle, description: 'Rental terms for direct bookings at Blue Bliss By The Bay.' },
  privacy: { path: 'policies/privacy/', title: siteTitle, description: 'How the Blue Bliss By The Bay website handles booking information.' },
} satisfies Record<string, PageRoute>;

export const policyRouteKeys = ['cancellation', 'houseRules', 'rentalTerms', 'privacy'] as const;
export type PolicyKey = (typeof policyRouteKeys)[number];
