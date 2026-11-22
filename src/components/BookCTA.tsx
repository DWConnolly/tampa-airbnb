import { galleryImages, photography, siteCopy } from '../config/siteConfig';
import { enquiryAvailable } from '../config/booking';
import { PrimaryBookingLink, SecondaryBookingLink } from './BookingLink';
import PropertyImage from './PropertyImage';

export default function BookCTA() {
  const photo = galleryImages.find((image) => image.id === photography.storyIds.farewell)!;
  return (
    <section className="booking-section section" aria-labelledby="booking-title">
      <div className="shell booking-layout">
        <div className="booking-inner">
          <p className="eyebrow">{siteCopy.booking.eyebrow}</p>
          <h2 id="booking-title">{siteCopy.booking.title}{' '}<em>{siteCopy.booking.titleAccent}</em></h2>
          <p>{enquiryAvailable ? 'A Tampa Heights home for up to six. Share your preferred dates with our guided stay assistant, or book through Airbnb.' : siteCopy.booking.description}</p>
          <div className="closing-actions">
            <PrimaryBookingLink className="button" />
            <SecondaryBookingLink />
          </div>
          <p className="small-note">{enquiryAvailable ? siteCopy.enquiry.note : siteCopy.booking.note}</p>
        </div>
        <figure className="booking-photo"><PropertyImage image={photo} sizes="(min-width: 1440px) 500px, (min-width: 900px) 40vw, 100vw" /><figcaption className="journal-caption">{siteCopy.booking.caption}</figcaption></figure>
      </div>
    </section>
  );
}
