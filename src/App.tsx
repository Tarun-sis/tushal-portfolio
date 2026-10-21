import { useEffect, useState } from 'react';
import { Navbar, BackToTop } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { About } from '@/components/About';
import { Services } from '@/components/Services';
import { Projects } from '@/components/Projects';
import { Process } from '@/components/Process';
import { FAQ } from '@/components/FAQ';
import { Contact } from '@/components/Contact';
import { Footer } from '@/components/Footer';
import { Loader } from '@/components/Loader';
import { AdminDashboard, AdminLogin } from '@/components/Admin';
import { siteConfig } from '@/config';
import { useRevealAll } from '@/hooks/useReveal';
import { usePrefersReducedMotion } from '@/hooks/useMedia';

const SEEN_KEY = 'intro-seen';
const seenBefore = () => { try { return sessionStorage.getItem(SEEN_KEY) === '1'; } catch { return false; } };

function App() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  if (path === '/admin') return <AdminDashboard />;
  if (path === '/login') return <AdminLogin />;
  return <PortfolioHome />;
}

function PortfolioHome() {
  const reduced = usePrefersReducedMotion();
  const [showLoader, setShowLoader] = useState(() => siteConfig.showLoader && !seenBefore());
  useRevealAll();

  // Intro plays once per session, is fixed-length (no fake progress) and is removed from the DOM afterwards.
  useEffect(() => {
    if (!showLoader) return;
    try { sessionStorage.setItem(SEEN_KEY, '1'); } catch { /* storage unavailable */ }
    const t = setTimeout(() => setShowLoader(false), 1800);
    return () => clearTimeout(t);
  }, [showLoader]);

  return (
    <>
      {showLoader && !reduced && <Loader name={siteConfig.name} />}
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-full focus:bg-neon focus:px-4 focus:py-2 focus:text-bg">Skip to content</a>
      <Navbar />
      <main id="main">
        <Hero />
        <Projects />
        <Services />
        <About />
        <Process />
        <FAQ />
        <Contact />
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}

export default App;
