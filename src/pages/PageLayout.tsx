import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Waves } from 'lucide-react';
import { pageRoutes, policyRouteKeys } from '../config/routes';
import { property } from '../config/siteConfig';
import { policies } from '../config/policies';

// Shared frame for booking and policy pages. The home page keeps its own layout.
export default function PageLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="site-header">
        <div className="shell header-inner">
          <Link className="brand" to="/" aria-label={`${property.name} — home`}>
            <Waves size={30} strokeWidth={1.4} aria-hidden="true" />
            <span>{property.shortName}<small>By The Bay</small></span>
          </Link>
          <Link className="page-back-link" to="/"><ArrowLeft size={18} aria-hidden="true" />The home</Link>
        </div>
      </header>
      <main id="main-content" tabIndex={-1} className="subpage">{children}</main>
      <footer className="site-footer subpage-footer">
        <div className="shell footer-main">
          <div><p>© {new Date().getFullYear()} {property.name}</p></div>
          <nav aria-label="Booking and policies">
            <Link to={`/${pageRoutes.book.path}`}>Ask about a stay</Link>
            {policyRouteKeys.map((key) => <Link key={key} to={`/${pageRoutes[key].path}`}>{policies[key].title}</Link>)}
          </nav>
        </div>
      </footer>
    </>
  );
}
