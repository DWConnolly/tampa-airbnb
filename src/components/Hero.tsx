import { ArrowDown } from 'lucide-react';
import { galleryImages, property, siteCopy } from '../config/siteConfig';
import BookingLink from './BookingLink';
import PropertyImage from './PropertyImage';

export default function Hero() {
  const facts = [
    [property.guests, 'guests'], [property.bedrooms, 'bedrooms'],
    [property.beds, 'beds'], [property.bathrooms, 'bathrooms'],
  ];
  return (
    <section id="home" className="hero" aria-labelledby="hero-title" tabIndex={-1}>
      <div className="hero-layout shell">
        <div className="hero-copy">
          <p className="eyebrow">{siteCopy.hero.eyebrow}</p>
          <h1 id="hero-title">{siteCopy.hero.headline}{' '}<em>{siteCopy.hero.headlineAccent}</em></h1>
          <p className="hero-description">{siteCopy.hero.description}</p>
          <div className="hero-actions">
            <BookingLink className="button hero-booking" />
            <a className="text-link explore-link" href="#the-home">{siteCopy.hero.explore}<ArrowDown size={16} aria-hidden="true" /></a>
          </div>
        </div>
        <figure className="hero-photo">
          <PropertyImage image={galleryImages[0]} priority sizes="(min-width: 1440px) 850px, (min-width: 900px) 62vw, 100vw" />
          <figcaption className="journal-caption"><span>{siteCopy.hero.photoNote}</span><span>{property.name}</span></figcaption>
        </figure>
      </div>
      <div className="hero-details shell">
        <p className="hero-location">{property.neighborhood}<span>{property.city}, {property.state}</span></p>
        <ul className="property-facts" aria-label="Property at a glance">
          {facts.map(([value, label]) => <li key={label}><strong>{value}</strong>{' '}<span>{label}</span></li>)}
        </ul>
        <p className="small-note">{siteCopy.hero.note}</p>
      </div>
    </section>
  );
}
