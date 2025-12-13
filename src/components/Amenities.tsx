import { motion } from 'framer-motion';
import {
  ChefHat,
  Wifi,
  Monitor,
  Car,
  Tv,
  Flame,
  KeyRound,
  Thermometer,
  Bed,
  Bath,
  Home,
  Sparkles,
} from 'lucide-react';
import { amenities, property } from '../config/siteConfig';

const iconMap: { [key: string]: React.ComponentType<{ className?: string }> } = {
  ChefHat,
  Wifi,
  Monitor,
  Car,
  Tv,
  Flame,
  KeyRound,
  Thermometer,
};

const Amenities = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as const },
    },
  };

  return (
    <section id="amenities" className="relative py-24 lg:py-32 bg-champagne-50">
      {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-48 w-96 h-96 bg-greek-400/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-gold-400/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="font-heading text-sm tracking-[0.2em] uppercase text-gold-500 mb-4 block">
            Amenities
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-navy-900 mb-6">
            Thoughtfully Appointed
          </h2>
          <div className="gold-line-center mb-6" />
          <p className="font-body text-lg text-charcoal-700 max-w-2xl mx-auto">
            Every detail has been considered to ensure your comfort — from the fully equipped 
            kitchen to the evening fire pit gatherings.
          </p>
        </motion.div>

        {/* Property Overview Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16"
        >
          {[
            { icon: Home, label: 'Entire Home', value: 'Private retreat' },
            { icon: Bed, label: 'Bedrooms', value: `${property.bedrooms} + Loft` },
            { icon: Bath, label: 'Bathrooms', value: property.bathrooms },
            { icon: Sparkles, label: 'Superhost', value: '5.0★ Rating' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="bg-white rounded-xl p-6 text-center shadow-sm border border-champagne-200"
            >
              <stat.icon className="w-8 h-8 text-gold-500 mx-auto mb-3" />
              <p className="font-heading font-semibold text-navy-900">{stat.value}</p>
              <p className="font-body text-sm text-charcoal-600">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Amenities Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {amenities.map((amenity) => {
            const IconComponent = iconMap[amenity.icon] || Sparkles;
            return (
              <motion.div
                key={amenity.name}
                variants={itemVariants}
                className="group relative bg-white rounded-xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-champagne-200 hover:border-gold-400/50 overflow-hidden"
              >
                {/* Hover Background Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-gold-400/0 to-gold-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Gold Top Border on Hover */}
                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-gold-400 to-gold-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                
                <div className="relative">
                  <div className="w-12 h-12 rounded-lg bg-champagne-100 group-hover:bg-gold-400/10 flex items-center justify-center mb-4 transition-colors duration-300">
                    <IconComponent className="w-6 h-6 text-navy-800 group-hover:text-gold-600 transition-colors duration-300" />
                  </div>
                  <h3 className="font-heading font-semibold text-navy-900 mb-2">
                    {amenity.name}
                  </h3>
                  <p className="font-body text-sm text-charcoal-600">
                    {amenity.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Additional Features Banner */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-16 bg-navy-900 rounded-2xl p-8 md:p-12 text-center"
        >
          <h3 className="font-display text-2xl md:text-3xl text-champagne-50 mb-4">
            Everything You Need, Nothing You Don't
          </h3>
          <p className="font-body text-champagne-200 max-w-2xl mx-auto mb-6">
            From premium linens to high-speed WiFi, we've anticipated every need so you can 
            focus on what matters — unwinding in your coastal sanctuary.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-gold-400 font-heading text-sm">
            {['Premium Linens', 'Complimentary Toiletries', 'Coffee & Tea', 'Beach Towels', 'Local Guidebook'].map((item) => (
              <span key={item} className="px-4 py-2 border border-gold-400/30 rounded-full">
                {item}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Amenities;
