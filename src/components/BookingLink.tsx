import { ArrowUpRight } from 'lucide-react';
import { externalLinks, siteCopy } from '../config/siteConfig';

// Same-tab links let guests use Back naturally; no surprise new windows.
export default function BookingLink({ className = '', children }: { className?: string; children?: React.ReactNode }) {
  return (
    <a href={externalLinks.airbnbListing} className={`booking-link ${className}`}>
      <span>{children ?? siteCopy.bookingLabel}</span>
      <ArrowUpRight size={18} aria-hidden="true" />
    </a>
  );
}