import { Car, Flame, KeyRound, Laptop, ShowerHead, Tv } from 'lucide-react';
import { amenities, siteCopy } from '../config/siteConfig';

const icons = { Car, Flame, KeyRound, Laptop, ShowerHead, Tv };

export default function Amenities() {
  return (
    <section id="amenities" className="section shell" aria-labelledby="amenities-title" tabIndex={-1}>
      <div className="section-intro"><p className="eyebrow">{siteCopy.amenities.eyebrow}</p><h2 id="amenities-title">{siteCopy.amenities.title}</h2></div>
      <ul className="amenities-list">
        {amenities.map((amenity) => {
          const Icon = icons[amenity.icon];
          return <li key={amenity.name}><Icon size={26} strokeWidth={1.4} aria-hidden="true" /><div><h3>{amenity.name}</h3><p>{amenity.description}</p></div></li>;
        })}
      </ul>
      <p className="small-note">{siteCopy.amenities.note}</p>
    </section>
  );
}
