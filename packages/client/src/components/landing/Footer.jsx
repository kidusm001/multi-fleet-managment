import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Github, Linkedin, Mail } from 'lucide-react';

/**
 * Footer Component
 * Copyright, social links (SVG icons), privacy policy
 * Flat design with clean grid layout
 */
export function Footer() {
  const currentYear = new Date().getFullYear();
  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkDarkMode();
    
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  const footerLinks = [
    { name: 'About', href: '#about' },
    { name: 'Features', href: '#features' },
    { name: 'Pricing', href: '/auth/signup' },
    { name: 'Contact', href: '#cta' },
  ];

  const legalLinks = [
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Documentation', href: '/docs' },
  ];

  const socialLinks = [
    { name: 'GitHub', icon: Github, href: 'https://github.com', color: '#ffffff' },
    { name: 'LinkedIn', icon: Linkedin, href: 'https://linkedin.com', color: '#4272ff' },
    { name: 'Email', icon: Mail, href: 'mailto:info@routegna.dev', color: '#ff7e42' },
  ];

  return (
    <footer className="relative py-12" style={{backgroundColor: 'var(--card-background)', borderTop: '1px solid var(--divider)'}}>
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="inline-block mb-4">
              <motion.img 
                key={isDark ? 'light' : 'dark'}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                src={isDark ? "/assets/images/logo-light.png" : "/assets/images/logo-dark.PNG"}
                alt="Routegna Logo" 
                className="h-10"
              />
            </Link>
            <p
              className="text-sm leading-relaxed max-w-md"
              style={{ 
                fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                color: 'var(--text-secondary)'
              }}
            >
              Enterprise fleet management platform with adaptive routing, real-time
              optimization, and predictive analytics. Built for scale, designed for
              simplicity.
            </p>
          </div>

          {/* Navigation Links */}
          <div>
            <h4
              className="text-sm font-semibold mb-4"
              style={{ 
                fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                color: 'var(--text-primary)'
              }}
            >
              Product
            </h4>
            <ul className="space-y-2">
              {footerLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-sm transition-colors duration-300"
                    style={{ 
                      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4
              className="text-sm font-semibold mb-4"
              style={{ 
                fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                color: 'var(--text-primary)'
              }}
            >
              Legal
            </h4>
            <ul className="space-y-2">
              {legalLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm transition-colors duration-300"
                    style={{ 
                      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t mb-8" style={{borderColor: 'var(--divider)'}} />

        {/* Bottom Section */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          {/* Copyright */}
          <p
            className="text-sm"
            style={{ 
              fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
              color: 'var(--text-muted)'
            }}
          >
            © {currentYear} Routegna. All rights reserved.
          </p>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            {socialLinks.map((social) => {
              const Icon = social.icon;
              return (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 hover:scale-110"
                  style={{
                    backgroundColor: 'var(--card-background)',
                    border: '1px solid var(--divider)'
                  }}
                  aria-label={social.name}
                >
                  <Icon className="w-5 h-5 transition-colors duration-300" style={{color: isDark ? social.color : '#333333'}} />
                </a>
              );
            })}
          </div>
        </div>

        {/* Academic Credit */}
        <div className="mt-8 pt-8 border-t border-white/10">
          <p
            className="text-white/40 text-xs text-center"
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}
          >
            A Senior Project by Leul Tewodros Agonafer, Leul Yared Assefa, and Kidus
            Mesfin Mekuria
            <br />
            HiLCoE School of Computer Science and Technology, 2025
          </p>
        </div>
      </div>
    </footer>
  );
}
