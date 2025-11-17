import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';

/**
 * LandingNav Component
 * Sticky navigation bar with logo, links, and CTA
 * Transparent → solid on scroll, flat design
 */
export function LandingNav() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (scrollTop / docHeight) * 100;
      
      setIsScrolled(scrollTop > 20);
      setScrollProgress(Math.min(scrollPercent, 100));
      
      // Debug: console.log('Scroll progress:', scrollPercent, 'scrollTop:', scrollTop, 'docHeight:', docHeight);
      
      // Update active section based on scroll position
      const sections = ['features', 'showcase', 'about', 'video', 'cta'];
      const scrollPosition = scrollTop + 100; // Offset for nav height
      
      // Check if we're above the features section (in hero section)
      const featuresElement = document.getElementById('features');
      if (featuresElement && scrollPosition < featuresElement.offsetTop) {
        setActiveSection('');
        return;
      }
      
      // Find which section we're currently in
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    // Check dark mode
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkDarkMode();
    
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial call
    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  const navLinks = [
    { name: 'Features', href: '#features' },
    { name: 'Showcase', href: '#showcase' },
    { name: 'About', href: '#about' },
    { name: 'Video', href: '#video' },
    { name: 'Maps', href: '#maps' },
    { name: 'Contact', href: '#cta' },
  ];

  const scrollToSection = (href) => {
    const targetId = href.substring(1);
    const element = document.getElementById(targetId);
    if (element) {
      const offsetTop = element.offsetTop - 80; // Account for nav height
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500`}
        style={{
          backgroundColor: isScrolled ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0.3)',
          borderBottom: isScrolled ? '1px solid rgba(66, 114, 255, 0.2)' : 'none',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          boxShadow: isScrolled ? '0 8px 32px rgba(0, 0, 0, 0.2)' : 'none'
        }}
      >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center space-x-2 group"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <img 
              src={isDark ? "/assets/images/logo-light.png" : "/assets/images/logo-dark.PNG"}
              alt="Routegna Logo" 
              className="h-10 sm:h-12 md:h-14 transition-all duration-300 group-hover:opacity-80"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <motion.a
                key={link.name}
                onClick={() => scrollToSection(link.href)}
                whileHover={{ scale: 1.05, color: '#4272ff' }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`text-sm font-semibold relative group cursor-pointer ${
                  activeSection === link.href.substring(1) ? 'text-blue-400' : ''
                }`}
                style={{ 
                  fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                  color: '#FFFFFF'
                }}
              >
                {link.name}
                <span className={`absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-orange-500 transition-all duration-300 ${
                  activeSection === link.href.substring(1) ? 'w-full' : 'group-hover:w-full'
                }`} />
              </motion.a>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/auth/login"
                className="px-5 py-2.5 text-sm font-semibold rounded-full transition-all duration-300 border-2"
                style={{ 
                  fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                  color: '#FFFFFF',
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }}
              >
                Sign In
              </Link>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(66, 114, 255, 0.5)' }} 
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to="/auth/login"
                className="px-6 py-2.5 text-white text-sm font-bold rounded-full transition-all duration-300"
                style={{ 
                  fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', 
                  background: 'linear-gradient(135deg, #4272ff 0%, #ff7e42 100%)',
                  boxShadow: '0 4px 20px rgba(66, 114, 255, 0.3)'
                }}
              >
                Get Started
              </Link>
            </motion.div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2"
            style={{ color: 'var(--text-primary)' }}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="md:hidden backdrop-blur-xl"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            borderTop: '1px solid rgba(66, 114, 255, 0.2)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)'
          }}
        >
          <div className="px-6 py-4 space-y-4">
            {navLinks.map((link) => (
              <motion.a
                key={link.name}
                onClick={() => scrollToSection(link.href)}
                whileTap={{ scale: 0.95 }}
                className={`block text-base font-semibold transition-colors duration-300 cursor-pointer ${
                  activeSection === link.href.substring(1) ? 'text-blue-400' : ''
                }`}
                style={{ 
                  fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                  color: '#FFFFFF'
                }}
              >
                {link.name}
              </motion.a>
            ))}
            <div className="pt-4 space-y-3">
              <Link
                to="/auth/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block w-full text-center px-4 py-3 text-sm font-semibold rounded-full transition-all duration-300"
                style={{ 
                  fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#FFFFFF'
                }}
              >
                Sign In
              </Link>
              <Link
                to="/auth/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block w-full text-center px-4 py-3 text-white text-sm font-bold rounded-full transition-all duration-300"
                style={{ 
                  fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', 
                  background: 'linear-gradient(135deg, #4272ff 0%, #ff7e42 100%)'
                }}
              >
                Get Started
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </motion.nav>

    {/* Scroll Progress Bar */}
    <motion.div
      className="fixed top-0 left-0 right-0 z-[9999] h-1"
      initial={{ scaleX: 0 }}
      animate={{ scaleX: scrollProgress / 100 }}
      transition={{ duration: 0.1 }}
      style={{
        transformOrigin: 'left',
        background: 'linear-gradient(90deg, #4272ff 0%, #ff7e42 100%)',
        boxShadow: '0 0 10px rgba(66, 114, 255, 0.3)'
      }}
    />
    </>
  );
}
