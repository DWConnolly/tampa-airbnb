import { motion } from 'framer-motion';
import { Clock, LogOut, Users, Heart, KeyRound, Moon, Sparkles } from 'lucide-react';
import { houseGuidelines } from '../config/siteConfig';

const iconMap: { [key: string]: React.ComponentType<{ className?: string }> } = {
  Clock,
  LogOut,
  Users,
  Heart,
  KeyRound,
  Moon,
};

const Guidelines = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as const },
    },
  };

  return (
    <section className="relative py-24 lg:py-32 bg-champagne-100 overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-0 right-0 w-1/2 h-full">
        <div className="absolute inset-0 bg-gradient-to-l from-greek-400/5 to-transparent" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8 }}
          >
            <span className="font-heading text-sm tracking-[0.2em] uppercase text-gold-500 mb-4 block">
              Your Stay
            </span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-navy-900 mb-6">
              Thoughtfully Designed For
            </h2>
            <div className="gold-line mb-8" />
            
            <div className="space-y-4 mb-8">
              <p className="font-body text-lg text-charcoal-700 leading-relaxed">
                <span className="font-display italic text-gold-600">Discerning travelers</span> seeking 
                tranquility over commotion. Couples craving a romantic escape. Families making memories. 
                Remote workers needing inspiring surroundings.
              </p>
              <p className="font-body text-charcoal-600">
                Blue Bliss By The Bay welcomes those who appreciate thoughtful design, 
                cherish quiet mornings, and believe a home should feel like a retreat 
                from the everyday.
              </p>
            </div>

            {/* Highlight Box */}
            <div className="bg-white rounded-xl p-6 border border-gold-400/30 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-gold-400/10 rounded-lg">
                  <Sparkles className="w-6 h-6 text-gold-500" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-navy-900 mb-2">
                    Our Promise
                  </h3>
                  <p className="font-body text-sm text-charcoal-600">
                    An immaculate space, thoughtful touches, and responsive communication — 
                    we're committed to making your retreat exceptional from booking to departure.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Guidelines Cards */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="space-y-4"
          >
            {houseGuidelines.map((guideline, index) => {
              const IconComponent = iconMap[guideline.icon] || Clock;
              return (
                <motion.div
                  key={guideline.title}
                  variants={itemVariants}
                  className="group flex items-start gap-4 bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300 border border-champagne-200"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-navy-900 flex items-center justify-center">
                    <IconComponent className="w-5 h-5 text-gold-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-heading font-semibold text-navy-900 mb-1">
                      {guideline.title}
                    </h3>
                    <p className="font-body text-sm text-charcoal-600">
                      {guideline.description}
                    </p>
                  </div>
                  <span className="flex-shrink-0 font-heading text-xs text-gold-500 bg-gold-400/10 px-2 py-1 rounded">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Guidelines;
