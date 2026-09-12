import { BadgeCheck, Star } from 'lucide-react';
import { reviews, siteCopy, trust } from '../config/siteConfig';
import BookingLink from './BookingLink';

function ReviewQuote({ review }: { review: (typeof reviews)[number] }) {
  return <figure className="review-quote"><blockquote><p>“{review.quote}”</p></blockquote><figcaption><strong>{review.name}</strong><span>{review.date}{review.location && review.location !== 'Airbnb Member' ? ` · ${review.location}` : ''}</span></figcaption></figure>;
}

export default function Reviews() {
  const ratingVerified = trust.rating.verified && Boolean(trust.rating.verifiedAt);
  const countVerified = trust.reviewCount.verified && Boolean(trust.reviewCount.verifiedAt);
  const superhostVerified = trust.superhost.verified && Boolean(trust.superhost.verifiedAt) && trust.superhost.value;
  return (
    <section id="reviews" className="section shell" aria-labelledby="reviews-title" tabIndex={-1}>
      <div className="section-intro split-intro">
        <div><p className="eyebrow">{siteCopy.reviews.eyebrow}</p><h2 id="reviews-title">{siteCopy.reviews.title}</h2></div>
        <div><p className="small-note">{trust.reviewSourceNote}</p><BookingLink className="text-link">{siteCopy.reviews.link}</BookingLink></div>
      </div>
      {(ratingVerified || countVerified || superhostVerified) && <div className="trust-badges">
        {ratingVerified && <span><Star size={16} aria-hidden="true" /> {trust.rating.value.toFixed(1)} / 5 on Airbnb · checked {trust.rating.verifiedAt}</span>}
        {countVerified && <span>{trust.reviewCount.value} Airbnb reviews · checked {trust.reviewCount.verifiedAt}</span>}
        {superhostVerified && <span><BadgeCheck size={16} aria-hidden="true" /> Airbnb Superhost · checked {trust.superhost.verifiedAt}</span>}
      </div>}
      <div className="review-layout">{reviews.slice(0, 2).map((review) => <ReviewQuote key={review.id} review={review} />)}</div>
      <details className="more-reviews"><summary>{siteCopy.reviews.more}</summary><div className="review-layout">{reviews.slice(2).map((review) => <ReviewQuote key={review.id} review={review} />)}</div></details>
    </section>
  );
}
