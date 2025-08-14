import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  Mail,
  Phone,
  Facebook,
  Linkedin,
  Twitter,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "@contexts/ThemeContext";
import Terms from "@components/Common/Terms";
import "./Footer.css";

const Footer = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const currentYear = new Date().getFullYear();
  const [showTerms, setShowTerms] = useState(false);

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
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    },
  };

  return (
    <>
      <footer className={`footer ${isDark ? "dark" : ""}`}>
        <motion.div
          className="footer-content"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.div className="footer-section" variants={itemVariants}>
            <div className="footer-brand">
              <h2>Routegna TECH</h2>
              <p className="footer-tagline">
                Enterprise Shuttle Management System
              </p>
            </div>
            <div className="footer-contact">
              <motion.div className="contact-item" whileHover={{ x: 5 }}>
                <MapPin size={16} />
                <span>Addis Ababa, Ethiopia</span>
              </motion.div>
              <motion.div className="contact-item" whileHover={{ x: 5 }}>
                <Mail size={16} />
                <a href="mailto:contact@routegnatech.com">contact@routegnatech.com</a>
              </motion.div>
              <motion.div className="contact-item" whileHover={{ x: 5 }}>
                <Phone size={16} />
                <a href="tel:+251903731001">090 373 1001</a>
              </motion.div>
            </div>
          </motion.div>

          <motion.div className="footer-section" variants={itemVariants}>
            <h3>Quick Links</h3>
            <nav className="footer-links">
              <Link to="/dashboard">
                <ChevronRight size={16} />
                Dashboard
              </Link>
              <Link to="/routes">
                <ChevronRight size={16} />
                Routes
              </Link>
              <Link to="/shuttles">
                <ChevronRight size={16} />
                Shuttles
              </Link>
              <Link to="/employees">
                <ChevronRight size={16} />
                Employees
              </Link>
              <Link to="/about">
                <ChevronRight size={16} />
                About Us
              </Link>
            </nav>
          </motion.div>

          <motion.div className="footer-section" variants={itemVariants}>
            <h3>Connect With Us</h3>
            <div className="social-links">
              <motion.a
                href="https://facebook.com/routegnatech"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                whileHover={{ y: -5 }}
                whileTap={{ scale: 0.95 }}
              >
                <Facebook size={20} />
              </motion.a>
              <motion.a
                href="https://twitter.com/routegnatech"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter"
                whileHover={{ y: -5 }}
                whileTap={{ scale: 0.95 }}
              >
                <Twitter size={20} />
              </motion.a>
              <motion.a
                href="https://linkedin.com/company/routegnatech"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                whileHover={{ y: -5 }}
                whileTap={{ scale: 0.95 }}
              >
                <Linkedin size={20} />
              </motion.a>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          className="footer-bottom"
          variants={itemVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div className="footer-bottom-content">
            <p className="copyright">
              © {currentYear} Routegna TECH. All rights reserved.
            </p>
            <div className="footer-legal">
              <Link to="/privacy">Privacy Policy</Link>
              <button onClick={() => setShowTerms(true)}>
                Terms of Service
              </button>
            </div>
          </div>
        </motion.div>
      </footer>

      <Terms isOpen={showTerms} onClose={() => setShowTerms(false)} />
    </>
  );
};

export default Footer;
