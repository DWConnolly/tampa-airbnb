import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import LocationStory from '../components/LocationStory';
import Experience from '../components/Experience';
import Amenities from '../components/Amenities';
import Guidelines from '../components/Guidelines';
import Reviews from '../components/Reviews';
import BookCTA from '../components/BookCTA';
import Footer from '../components/Footer';

export default function HomePage() {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <Navbar />
      <main id="main-content" tabIndex={-1}>
        <Hero />
        <Experience />
        <div className="coastal-amenities"><Amenities /></div>
        <LocationStory />
        <div className="coastal-reviews"><Reviews /></div>
        <Guidelines />
        <BookCTA />
      </main>
      <Footer />
    </>
  );
}
