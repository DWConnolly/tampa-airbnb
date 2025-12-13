import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { property, navigation, externalLinks } from '../config/siteConfig';

const Footer = () => {
  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-navy-900 border-t border-navy-800">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <h3 className="font-display text-2xl text-champagne-50 mb-2">
              {property.name}
            </h3>
            <p className="font-heading text-sm tracking-[0.15em] uppercase text-gold-400 mb-4">
              {property.neighborhood} · {property.city}
            </p>
            <p className="font-body text-champagne-300 leading-relaxed max-w-md">
              A Greek-inspired retreat where Mediterranean elegance meets Tampa's vibrant 
              energy. Your sanctuary of coastal serenity awaits.
            </p>
          </div>

          {/* Navigation Column */}
          <div>
            <h4 className="font-heading font-semibold text-champagne-100 mb-4">
              Explore
            </h4>
            <ul className="space-y-2">
              {navigation.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection(item.href);
                    }}
                    className="font-body text-champagne-300 hover:text-gold-400 transition-colors cursor-pointer"
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Book Column */}
          <div>
            <h4 className="font-heading font-semibold text-champagne-100 mb-4">
              Reserve
            </h4>
            <motion.a
              href={externalLinks.airbnbListing}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block btn-primary text-sm mb-4"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Book on Airbnb
            </motion.a>
            <p className="font-body text-sm text-champagne-400">
              Superhost · 5.0★ · {property.reviewCount} Reviews
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-navy-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="font-body text-sm text-champagne-400 flex items-center gap-1">
              Made with <Heart className="w-4 h-4 text-gold-400 fill-gold-400" /> in Tampa
            </p>
            <p className="font-body text-sm text-champagne-500">
              © {new Date().getFullYear()} {property.name}. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* Decorative Top Border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-400/30 to-transparent" />
    </footer>
  );
};

export default Footer;
