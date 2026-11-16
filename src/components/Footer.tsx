import { Waves } from 'lucide-react';
import { Link } from 'react-router-dom';
import { directBookingReady } from '../config/booking';
import { policies } from '../config/policies';
import { pageRoutes, policyRouteKeys } from '../config/routes';
import { navigation, property, siteCopy } from '../config/siteConfig';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="shell footer-main"><div><a className="brand" href="#home"><Waves size={28} strokeWidth={1.4} aria-hidden="true" /><span>{property.shortName}<small>By The Bay</small></span></a><p>{siteCopy.footer.location}</p></div><nav aria-label="Footer navigation">{navigation.map((item) => <a key={item.href} href={item.href}>{item.name}</a>)}</nav></div>
      <div className="shell footer-bottom"><p>© {new Date().getFullYear()} {property.name}</p><p>{siteCopy.footer.note}</p>{directBookingReady && <nav aria-label="Booking and policies" className="footer-policies"><Link to={`/${pageRoutes.book.path}`}>{siteCopy.directBooking.link}</Link>{policyRouteKeys.map((key) => <Link key={key} to={`/${pageRoutes[key].path}`}>{policies[key].title}</Link>)}</nav>}</div>
    </footer>
  );
}
