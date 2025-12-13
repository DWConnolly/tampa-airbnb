import { motion } from 'framer-motion';
import { Calendar, ArrowRight } from 'lucide-react';
import { externalLinks, property } from '../config/siteConfig';

const BookCTA = () => {
  return (
    <section className="relative py-24 lg:py-32 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1920&q=80"
          alt="Tropical Florida sunset with palms"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy-900/80 via-navy-900/70 to-navy-900/90" />
      </div>

      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gold-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-greek-400/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8 }}
        >
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold-400/20 mb-8">
            <Calendar className="w-8 h-8 text-gold-400" />
          </div>

          {/* Heading */}
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-champagne-50 mb-6 leading-tight">
            Your Coastal Retreat
            <br />
            <span className="text-gold-400">Awaits</span>
          </h2>

          <div className="gold-line-center mb-8" />

          {/* Description */}
          <p className="font-body text-lg sm:text-xl text-champagne-200 max-w-2xl mx-auto mb-10 leading-relaxed">
            Experience the perfect harmony of Mediterranean elegance and Tampa's vibrant 
            energy. Book your stay at {property.name} and discover why guests 
            consistently rate us 5 stars.
          </p>

          {/* CTA Button */}
          <motion.a
            href={externalLinks.airbnbListing}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 btn-primary text-lg px-12 py-5 gold-glow group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <span>Reserve Your Retreat</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </motion.a>

          {/* Trust Indicators */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-champagne-300">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-gold-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="font-heading text-sm">Instant Booking</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-gold-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="font-heading text-sm">Superhost</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-gold-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="font-heading text-sm">Self Check-in</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-gold-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="font-heading text-sm">Free Cancellation</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default BookCTA;
