import { ArrowUpRight, MessageCircle } from 'lucide-react';
import { enquiryAvailable } from '../config/booking';
import { externalLinks, siteCopy } from '../config/siteConfig';
import { useEnquiry } from '../enquiry/context';

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
  const open = useEnquiry();
  return enquiryAvailable ? (
    <button type="button" className={`enquiry-link ${className}`} onClick={open} aria-haspopup="dialog" aria-controls="enquiry-dialog">
      <span>{siteCopy.enquiry.label}</span><MessageCircle size={18} aria-hidden="true" />
    </button>
  ) : <BookingLink className={className} />;
}

export function SecondaryBookingLink({ className = '' }: { className?: string }) {
  return enquiryAvailable
    ? <BookingLink className={`text-link secondary-booking ${className}`}>airbnb</BookingLink>
    : null;
}