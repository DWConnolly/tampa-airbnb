import { motion } from 'framer-motion';
import { ChevronDown, Star, MapPin, Users } from 'lucide-react';
import { property, heroImages, externalLinks } from '../config/siteConfig';

const Hero = () => {
  const scrollToLocation = () => {
    const element = document.querySelector('#location');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <motion.img
          initial={{ scale: 1.05 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: [0.4, 0, 0.2, 1] }}
          src={heroImages[0]}
          alt="Blue Bliss By The Bay exterior"
          className="w-full h-full object-cover object-center"
          style={{ objectPosition: '50% 30%' }}
        />
        <div className="absolute inset-0 overlay-gradient" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Superhost Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-8"
        >
          <Star className="w-4 h-4 text-gold-400 fill-gold-400" />
          <span className="font-heading text-sm text-navy-900">
            Superhost · {property.rating} · {property.reviewCount} Reviews
          </span>
        </motion.div>

        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-champagne-50 font-medium leading-tight mb-6"
          style={{ textShadow: '0 4px 8px rgba(0,0,0,0.8), 0 8px 25px rgba(0,0,0,0.6), 0 20px 50px rgba(0,0,0,0.4)' }}
        >
          Your Tropical Mediterranean
          <br />
          <span 
            className="bg-clip-text text-transparent"
            style={{ 
              backgroundImage: 'linear-gradient(135deg, #FFB4A2, #D4A574, #4ECDC4)',
              textShadow: 'none',
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))'
            }}
          >
            Tampa Retreat
          </span>
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="font-body text-lg sm:text-xl text-champagne-200 max-w-2xl mx-auto mb-8 leading-relaxed"
          style={{ textShadow: '0 2px 6px rgba(0,0,0,0.8), 0 4px 15px rgba(0,0,0,0.5)' }}
        >
          Discover coastal serenity in Tampa Heights — where Mediterranean charm 
          meets urban convenience in a light-filled sanctuary
        </motion.p>

        {/* Property Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.8 }}
          className="flex flex-wrap items-center justify-center gap-6 mb-10"
        >
          <div className="flex items-center gap-2 text-champagne-100">
            <MapPin className="w-4 h-4 text-gold-400" />
            <span className="font-heading text-sm">{property.neighborhood}</span>
          </div>
          <div className="w-px h-4 bg-champagne-300/30 hidden sm:block" />
          <div className="flex items-center gap-2 text-champagne-100">
            <Users className="w-4 h-4 text-gold-400" />
            <span className="font-heading text-sm">{property.guests} Guests</span>
          </div>
          <div className="w-px h-4 bg-champagne-300/30 hidden sm:block" />
          <span className="font-heading text-sm text-champagne-100">
            {property.bedrooms} Bedrooms · {property.bathrooms} Baths
          </span>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.8 }}
        >
          <motion.a
            href={externalLinks.airbnbListing}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block btn-primary text-lg px-10 py-4 gold-glow"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            Reserve Your Retreat
          </motion.a>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        onClick={scrollToLocation}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-champagne-100 hover:text-gold-400 transition-colors"
        aria-label="Scroll to explore"
      >
        <span className="font-heading text-xs tracking-[0.2em] uppercase">Explore</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
        >
          <ChevronDown className="w-6 h-6" />
        </motion.div>
      </motion.button>

      {/* Decorative Gold Lines */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-400/30 to-transparent" />
    </section>
  );
};

export default Hero;
