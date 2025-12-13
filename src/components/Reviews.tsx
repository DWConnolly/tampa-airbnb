import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { reviews, property } from '../config/siteConfig';

const Reviews = () => {
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
    <section id="reviews" className="relative py-24 lg:py-32 bg-navy-900 overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-greek-400/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gold-400/5 rounded-full blur-3xl" />
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
          <span className="font-heading text-sm tracking-[0.2em] uppercase text-gold-400 mb-4 block">
            Guest Experiences
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-champagne-50 mb-6">
            Words From Our Guests
          </h2>
          <div className="gold-line-center mb-6" />
          
          {/* Rating Summary */}
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 text-gold-400 fill-gold-400" />
              ))}
            </div>
            <div className="text-champagne-100">
              <span className="font-heading font-bold text-2xl">{property.rating}</span>
              <span className="font-body text-champagne-300 ml-2">
                · {property.reviewCount} reviews
              </span>
            </div>
          </div>
        </motion.div>

        {/* Reviews Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {reviews.map((review, index) => (
            <motion.div
              key={review.id}
              variants={itemVariants}
              className={`group relative bg-navy-800/50 backdrop-blur-sm rounded-xl p-6 border border-navy-700 hover:border-gold-400/30 transition-colors duration-300 ${
                index === 0 ? 'md:col-span-2 lg:col-span-1' : ''
              }`}
            >
              {/* Quote Icon */}
              <Quote className="absolute top-4 right-4 w-8 h-8 text-gold-400/20" />
              
              {/* Stars */}
              <div className="flex items-center gap-0.5 mb-4">
                {[...Array(review.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-gold-400 fill-gold-400" />
                ))}
              </div>

              {/* Quote */}
              <blockquote className="font-body text-champagne-200 italic mb-6 leading-relaxed">
                "{review.quote}"
              </blockquote>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
                  <span className="font-heading font-semibold text-white text-sm">
                    {review.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-heading font-medium text-champagne-100">
                    {review.name}
                  </p>
                  <p className="font-body text-xs text-champagne-300">
                    {review.date}
                  </p>
                </div>
              </div>

              {/* Decorative Corner */}
              <div className="absolute bottom-0 right-0 w-16 h-16 overflow-hidden">
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-gold-400/5 to-transparent transform translate-x-16 translate-y-16 rotate-45" />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Superhost Badge */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-4 bg-navy-800/50 backdrop-blur-sm rounded-full px-8 py-4 border border-gold-400/30">
            <div className="w-12 h-12 rounded-full bg-gold-400 flex items-center justify-center">
              <Star className="w-6 h-6 text-navy-900 fill-navy-900" />
            </div>
            <div className="text-left">
              <p className="font-heading font-semibold text-champagne-50">Superhost Status</p>
              <p className="font-body text-sm text-champagne-300">
                Consistently excellent hospitality
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Reviews;
