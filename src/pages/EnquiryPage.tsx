import PageLayout from './PageLayout';
import { PrimaryBookingLink, SecondaryBookingLink } from '../components/BookingLink';

export default function EnquiryPage() {
  return <PageLayout><section className="shell section enquiry-page" aria-labelledby="enquiry-page-title">
    <p className="eyebrow">Plan a stay at Blue Bliss</p>
    <h1 id="enquiry-page-title">A little closer to Tampa.</h1>
    <p>Share your preferred dates and group size. The host will follow up by email.</p>
    <div className="closing-actions"><PrimaryBookingLink className="button" /><SecondaryBookingLink /></div>
    <p className="small-note">Review your inquiry and send it here. No dates held or payment taken.</p>
  </section></PageLayout>;
}
