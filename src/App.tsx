import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { pageRoutes, policyRouteKeys } from './config/routes';
import { seoConfig } from './config/siteConfig';
import HomePage from './pages/HomePage';
import EnquiryPage from './pages/EnquiryPage';
import EnquiryProvider from './components/EnquiryProvider';
import PolicyPage from './pages/PolicyPage';
import './App.css';

const titles: Record<string, string> = Object.fromEntries(Object.values(pageRoutes).map((route) => [`/${route.path}`, route.title]));

function RouteEffects() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    const normalized = pathname.endsWith('/') ? pathname : `${pathname}/`;
    document.title = titles[normalized] ?? seoConfig.title;
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

export default function App() {
  return (
    <EnquiryProvider>
      <RouteEffects />
      <Routes>
        <Route index element={<HomePage />} />
        <Route path={pageRoutes.book.path} element={<EnquiryPage />} />
        {policyRouteKeys.map((key) => <Route key={key} path={pageRoutes[key].path} element={<PolicyPage policy={key} />} />)}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </EnquiryProvider>
  );
}
