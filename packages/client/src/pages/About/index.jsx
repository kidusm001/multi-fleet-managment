import React from "react";
import { motion } from "framer-motion";
import { useTheme } from "@contexts/ThemeContext";
import { Users, Truck, Clock, BarChart, MapPin, Shield } from "lucide-react";
import { Button } from "@components/Common/UI/Button";
import { useNavigate } from "react-router-dom";
import "./About.css";

const features = [
  {
    icon: <Users size={24} />,
    title: "Employee Management",
    description:
      "Comprehensive employee tracking and management system designed for enterprise-scale operations.",
  },
  {
    icon: <Truck size={24} />,
    title: "Fleet Optimization",
    description:
      "Enterprise-grade shuttle fleet management with real-time tracking and route optimization.",
  },
  {
    icon: <Clock size={24} />,
    title: "Schedule Management",
    description:
      "Efficient shift and schedule management system built for complex organizational needs.",
  },
  {
    icon: <BarChart size={24} />,
    title: "Analytics Dashboard",
    description:
      "Advanced analytics and reporting tools for data-driven fleet management decisions.",
  },
  {
    icon: <MapPin size={24} />,
    title: "Route Planning",
    description:
      "Intelligent route optimization algorithms designed for large-scale transportation networks.",
  },
  {
    icon: <Shield size={24} />,
    title: "Enterprise Security",
    description:
      "Industry-standard security measures ensuring your organization's data protection.",
  },
];

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

export default function About() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const navigate = useNavigate();

  return (
    <div className={`about-container ${isDark ? "dark" : ""}`}>
      {/* Hero Section */}
      <motion.div
        className="about-hero"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="about-title"
        >
          Enterprise
          <span className="gradient-text"> Shuttle Management</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="about-subtitle"
        >
          MMCY TECH delivers a comprehensive enterprise solution for managing
          your organization&#39;s shuttle operations efficiently and securely.
        </motion.p>
      </motion.div>

      {/* Mission Section */}
      <motion.section
        className="about-section mission-section"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <motion.div className="section-content" variants={itemVariants}>
          <h2>Our Solution</h2>
          <p>
            Our enterprise shuttle management system is designed to streamline
            transportation operations for large organizations. We provide a
            robust platform that handles complex scheduling, route optimization,
            and employee management with ease and precision.
          </p>
          <motion.div className="stats-container" variants={containerVariants}>
            <motion.div className="stat-item" variants={itemVariants}>
              <h3>99.9%</h3>
              <p>System Uptime</p>
            </motion.div>
            <motion.div className="stat-item" variants={itemVariants}>
              <h3>100%</h3>
              <p>Data Security</p>
            </motion.div>
            <motion.div className="stat-item" variants={itemVariants}>
              <h3>24/7</h3>
              <p>System Monitoring</p>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        className="about-section features-section"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <motion.h2 variants={itemVariants}>Enterprise Features</motion.h2>
        <motion.div className="features-grid" variants={containerVariants}>
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="feature-card"
              variants={itemVariants}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        className="about-section cta-section"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <motion.div className="cta-content" variants={itemVariants}>
          <h2>Ready to Optimize Your Fleet Operations?</h2>
          <p>
            Access your enterprise shuttle management dashboard to start
            managing your transportation operations more efficiently.
          </p>
          <Button onClick={() => navigate("/dashboard")} className="cta-button">
            Go to Dashboard
          </Button>
        </motion.div>
      </motion.section>
    </div>
  );
}
