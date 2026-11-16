import { galleryImages, photography, property, siteCopy } from '../config/siteConfig';
import { directBookingReady } from '../config/booking';
import BookingLink, { PrimaryBookingLink } from './BookingLink';
import PropertyImage from './PropertyImage';

export default function BookCTA() {
  const photo = galleryImages.find((image) => image.id === photography.storyIds.farewell)!;
  return (
    <section className="booking-section section" aria-labelledby="booking-title">
      <div className="shell booking-layout">
        <div className="booking-inner">
          <p className="eyebrow">{siteCopy.booking.eyebrow}</p>
          <h2 id="booking-title">{siteCopy.booking.title}{' '}<em>{siteCopy.booking.titleAccent}</em></h2>
          <p>{directBookingReady ? 'A Tampa Heights home for up to six. Find your dates, tell us about your stay, and send a request to the host.' : siteCopy.booking.description}</p>
          <div className="closing-actions">
            <PrimaryBookingLink className="button" />
            {directBookingReady && <BookingLink className="text-link">Prefer Airbnb?</BookingLink>}
          </div>
          <p className="small-note">{directBookingReady ? siteCopy.directBooking.note : siteCopy.booking.note}</p>
        </div>
        <figure className="booking-photo"><PropertyImage image={photo} sizes="(min-width: 1440px) 500px, (min-width: 900px) 40vw, 100vw" /><figcaption className="journal-caption">{siteCopy.booking.caption}</figcaption></figure>
      </div>
    </section>
  );
}

export function MobileBookingBar() {
  return <aside className="mobile-booking-bar" aria-label="Book your stay"><div><strong>{property.shortName}</strong><span>{property.guests} guests · {property.bedrooms} bedrooms</span></div><PrimaryBookingLink className="button" /></aside>;
}
