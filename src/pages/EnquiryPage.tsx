import PageLayout from './PageLayout';
import { PrimaryBookingLink, SecondaryBookingLink } from '../components/BookingLink';

export default function EnquiryPage() {
  return <PageLayout><section className="shell section enquiry-page" aria-labelledby="enquiry-page-title">
    <p className="eyebrow">Plan a stay at Blue Bliss</p>
    <h1 id="enquiry-page-title">A little closer to Tampa.</h1>
    <p>Tell us your preferred dates and a little about your group. Our guided stay assistant helps you prepare an availability enquiry for the host to follow up.</p>
    <div className="closing-actions"><PrimaryBookingLink className="button" /><SecondaryBookingLink /></div>
    <p className="small-note">This is a guided form, not a live chat or an availability calendar. The host confirms dates and price. No dates are held and no payment is taken. You’ll review your enquiry, then send it from your own email app.</p>
  </section></PageLayout>;
}
