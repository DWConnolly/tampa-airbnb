import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { bookingConfig, directBookingReady, directEnquiryAvailable } from '../config/booking';
import { mailtoUrl } from '../../shared/booking/request.ts';
import { pageRoutes } from '../config/routes';
import { externalLinks, property, siteCopy } from '../config/siteConfig';

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
  ) : directEnquiryAvailable ? (
    <a className={`enquiry-link ${className}`} href={mailtoUrl(
      bookingConfig.directBooking.requestEmail,
      `Stay enquiry for ${property.name}`,
      `Hello,\n\nI'd like to enquire about a stay at ${property.name}.\n\nPreferred dates:\nNumber of guests (up to ${property.guests}):\nQuestions:\n\nI understand this is an enquiry only. The host confirms dates and price; no dates are held and no payment is taken.\n`,
    )}>
      <span>Enquire direct</span><ArrowUpRight size={18} aria-hidden="true" />
    </a>
  ) : <BookingLink className={className} />;
}

export function SecondaryBookingLink({ className = '' }: { className?: string }) {
  return directBookingReady || directEnquiryAvailable
    ? <BookingLink className={`text-link secondary-booking ${className}`}>Book on Airbnb</BookingLink>
    : null;
}