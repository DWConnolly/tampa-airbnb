import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { MapPin, Utensils, Waves, ShoppingBag, Wine, Building } from 'lucide-react';
import { locationHighlights } from '../config/siteConfig';

const iconMap: { [key: string]: React.ComponentType<{ className?: string }> } = {
  Utensils,
  Waves,
  ShoppingBag,
  Wine,
  Palmtree: MapPin, // Using MapPin as fallback
  Building,
};

const LocationStory = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const y2 = useTransform(scrollYProgress, [0, 1], [50, -50]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] as const },
    },
  };

  return (
    <section
      id="location"
      ref={sectionRef}
      className="relative py-24 lg:py-32 overflow-hidden bg-champagne-50"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-greek-400/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-gold-400/10 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16 lg:mb-20"
        >
          <span className="font-heading text-sm tracking-[0.2em] uppercase text-gold-500 mb-4 block">
            Location
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-navy-900 mb-6">
            The Heart of Tampa Heights
          </h2>
          <div className="gold-line-center mb-6" />
          <p className="font-body text-lg text-charcoal-700 max-w-2xl mx-auto">
            Nestled in one of Tampa's most vibrant neighborhoods, your retreat offers 
            effortless access to waterfront dining, cultural attractions, and coastal escapes.
          </p>
        </motion.div>

        {/* Split Content Grid */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-20">
          {/* Image Stack with Parallax */}
          <div className="relative h-[500px] lg:h-[600px]">
            <motion.div
              style={{ y: y1 }}
              className="absolute top-0 left-0 w-3/4 h-[350px] rounded-lg overflow-hidden shadow-2xl"
            >
              <img
                src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80"
                alt="Industrial chic food hall like Armature Works"
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-900/30 to-transparent" />
            </motion.div>
            <motion.div
              style={{ y: y2 }}
              className="absolute bottom-0 right-0 w-2/3 h-[280px] rounded-lg overflow-hidden shadow-2xl border-4 border-champagne-50"
            >
              <img
                src="https://hospitalitysnapshots.com/wp-content/uploads/sites/3/2019/12/M-bird-Aerial-High-to-City.jpg"
                alt="M.Bird rooftop with downtown Tampa skyline views"
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-900/30 to-transparent" />
            </motion.div>
            {/* Decorative Frame */}
            <div className="absolute -bottom-4 -left-4 w-32 h-32 border-l-2 border-b-2 border-gold-400/40" />
            <div className="absolute -top-4 -right-4 w-32 h-32 border-r-2 border-t-2 border-gold-400/40" />
          </div>

          {/* Location Highlights */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="space-y-6"
          >
            <motion.p
              variants={itemVariants}
              className="font-body text-lg text-charcoal-700 leading-relaxed mb-8"
            >
              Tampa Heights blends historic character with contemporary energy. 
              Wake to morning walks along the Riverwalk, savor artisan cuisine at 
              Armature Works, and return home to your private sanctuary — all without 
              ever needing a car.
            </motion.p>

            <div className="grid sm:grid-cols-2 gap-4">
              {locationHighlights.slice(0, 4).map((highlight) => {
                const IconComponent = iconMap[highlight.icon] || MapPin;
                return (
                  <motion.div
                    key={highlight.name}
                    variants={itemVariants}
                    className="group relative bg-white rounded-lg p-5 shadow-sm hover:shadow-lg transition-shadow duration-300 border border-champagne-200"
                  >
                    <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-gold-400 to-gold-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-champagne-100 rounded-lg group-hover:bg-gold-400/10 transition-colors">
                        <IconComponent className="w-5 h-5 text-navy-800" />
                      </div>
                      <div>
                        <h3 className="font-heading font-semibold text-navy-900 mb-1">
                          {highlight.name}
                        </h3>
                        <p className="font-heading text-sm text-gold-500 mb-1">
                          {highlight.distance}
                        </p>
                        <p className="font-body text-sm text-charcoal-600">
                          {highlight.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Distance Badges Row */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="flex flex-wrap justify-center gap-4 lg:gap-8"
        >
          {[
            { text: 'Steps from Armature Works', icon: '🍽️' },
            { text: 'Minutes to M.Bird Rooftop', icon: '🌆' },
            { text: '40 min to Gulf Beaches', icon: '🏖️' },
          ].map((badge, index) => (
            <motion.div
              key={badge.text}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="flex items-center gap-3 bg-navy-900 text-champagne-50 px-6 py-3 rounded-full"
            >
              <span className="text-xl">{badge.icon}</span>
              <span className="font-heading text-sm font-medium">{badge.text}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default LocationStory;
