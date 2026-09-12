import { ArrowUpRight, MapPin } from 'lucide-react';
import { locationHighlights, property, siteCopy } from '../config/siteConfig';

export default function LocationStory() {
  return (
    <section id="neighborhood" className="neighborhood-section section" aria-labelledby="neighborhood-title" tabIndex={-1}>
      <div className="shell neighborhood-layout">
        <div className="section-intro">
          <p className="eyebrow">{siteCopy.neighborhood.eyebrow}</p>
          <h2 id="neighborhood-title">{siteCopy.neighborhood.title}</h2>
          <p>{siteCopy.neighborhood.description}</p>
          <a className="text-link" href={siteCopy.neighborhood.mapUrl}>{siteCopy.neighborhood.link}<ArrowUpRight size={18} aria-hidden="true" /></a>
          <div className="city-orientation">
            <div><span>{siteCopy.neighborhood.homeLabel}</span><strong>{property.neighborhood}</strong></div>
            <ArrowUpRight size={22} strokeWidth={1.3} aria-hidden="true" />
            <div><span>{siteCopy.neighborhood.awayLabel}</span><p>{siteCopy.neighborhood.awayDescription}</p></div>
          </div>
        </div>
        <div className="destination-list">
          <p className="destination-label"><MapPin size={18} aria-hidden="true" /> {property.neighborhood} / {property.city}</p>
          <article className="destination-feature"><p className="eyebrow">{siteCopy.neighborhood.featuredLabel}</p><h3>{siteCopy.neighborhood.featuredTitle}</h3><p>{locationHighlights[0].description}</p></article>
          {locationHighlights.slice(1).map((place, index) => <article className="destination-stop" key={place.name}><span aria-hidden="true">0{index + 2}</span><div><h3>{place.name}</h3><p>{place.description}</p></div></article>)}
          <p className="small-note">{siteCopy.neighborhood.note}</p>
        </div>
      </div>
    </section>
  );
}
