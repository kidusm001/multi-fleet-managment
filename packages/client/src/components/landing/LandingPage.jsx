import React, { useEffect } from 'react';
import { Hero } from './Hero';
import { Features } from './Features';
import { HorizontalCarousel } from './HorizontalCarousel';
import { VideoScroll } from './VideoScroll';
import { MapShowcase } from './MapShowcase';
import { About } from './About';
import { CTA } from './CTA';
import { Footer } from './Footer';
import { LandingNav } from './LandingNav';
import './landing.css';

/**
 * LandingPage - Main Entry Point
 * Composes all landing page sections into a single scrollable experience
 * Fully responsive (mobile-first) using existing Tailwind setup
 * 
 * Design Philosophy:
 * - Flat, minimalist aesthetics (no shadows, no gradients with depth)
 * - System fonts only (-apple-system, BlinkMacSystemFont)
 * - Strict color palette: #000000, #FFFFFF, #007AFF, #F5F5F7
 * - CSS transitions only (via framer-motion)
 * - Generous whitespace and micro-animations
 */
export function LandingPage() {
  useEffect(() => {
    // Smooth scroll behavior for anchor links
    document.documentElement.classList.add('landing-scroll');
    
    return () => {
      document.documentElement.classList.remove('landing-scroll');
    };
  }, []);

  return (
    <div className="landing-page min-h-screen bg-white">
      {/* Sticky Navigation */}
      <LandingNav />

      {/* Main Content */}
      <main>
        <Hero />
        <Features />
        <HorizontalCarousel />
        <About />
        <VideoScroll />
        <MapShowcase />
        <CTA />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
