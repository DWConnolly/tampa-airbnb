import { HashRouter } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import LocationStory from './components/LocationStory';
import Experience from './components/Experience';
import Amenities from './components/Amenities';
import Guidelines from './components/Guidelines';
import Reviews from './components/Reviews';
import BookCTA from './components/BookCTA';
import Footer from './components/Footer';

function App() {
  return (
    <HashRouter>
      <div className="min-h-screen bg-champagne-50">
        <Navbar />
        <main>
          <Hero />
          <LocationStory />
          <Experience />
          <Amenities />
          <Guidelines />
          <Reviews />
          <BookCTA />
        </main>
        <Footer />
      </div>
    </HashRouter>
  );
}

export default App;
