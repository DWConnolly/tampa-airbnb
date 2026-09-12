import { useEffect, useRef, useState } from 'react';
import { Menu, Waves, X } from 'lucide-react';
import { navigation, property } from '../config/siteConfig';
import BookingLink from './BookingLink';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const breakpoint = window.matchMedia('(min-width: 1100px)');
    const closeOnDesktop = () => setOpen(false);
    breakpoint.addEventListener('change', closeOnDesktop);
    const closeOutside = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', closeOutside);
    return () => {
      breakpoint.removeEventListener('change', closeOnDesktop);
      document.removeEventListener('pointerdown', closeOutside);
    };
  }, []);

  return (
    <header className="site-header" ref={headerRef} onKeyDown={(event) => {
      if (event.key === 'Escape' && open) {
        setOpen(false);
        toggleRef.current?.focus();
      }
    }} onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
    }}>
      <div className="shell header-inner">
        <a className="brand" href="#home" aria-label={`${property.name} — home`}>
          <Waves size={30} strokeWidth={1.4} aria-hidden="true" />
          <span>{property.shortName}<small>By The Bay</small></span>
        </a>
        <nav aria-label="Main navigation" className="desktop-nav">
          {navigation.map((item) => <a key={item.href} href={item.href}>{item.name}</a>)}
        </nav>
        <BookingLink className="button header-booking" />
        <button className="icon-button menu-toggle" ref={toggleRef} aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen(!open)}>
          {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </div>
      <nav id="mobile-navigation" aria-label="Mobile navigation" className="mobile-nav" hidden={!open}>
        {navigation.map((item) => <a key={item.href} href={item.href} onClick={() => {
          setOpen(false);
          document.querySelector<HTMLElement>(item.href)?.focus({ preventScroll: true });
        }}>{item.name}</a>)}
        <BookingLink className="button" />
      </nav>
    </header>
  );
}
