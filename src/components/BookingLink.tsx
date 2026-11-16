import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { directBookingReady } from '../config/booking';
import { pageRoutes } from '../config/routes';
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

export function PrimaryBookingLink({ className = '' }: { className?: string }) {
  return directBookingReady ? (
    <Link to={`/${pageRoutes.book.path}`} className={`direct-booking-link ${className}`}>
      <span>{siteCopy.directBooking.link}</span><ArrowRight size={18} aria-hidden="true" />
    </Link>
  ) : <BookingLink className={className} />;
}