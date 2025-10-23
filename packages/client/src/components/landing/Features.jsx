import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { MapPin, Zap, BarChart3, Shield } from 'lucide-react';

/**
 * Features Component
 * Flat card design with icon, title, description
 * No shadows, pure color blocks with subtle hover states
 */
export function Features() {
  const { scrollYProgress } = useScroll();
  const features = [
    {
      icon: MapPin,
      title: 'Adaptive Routing',
      description:
        'AI-powered clustering and optimization reduce travel time by 15% and minimize fuel costs through intelligent stop sequencing.',
      color: '#4272ff',
    },
    {
      icon: Zap,
      title: 'Real-Time Optimization',
      description:
        'Dynamic route adjustments respond to traffic, delays, and last-minute changes with sub-5s optimization cycles.',
      color: '#6a89a7',
    },
    {
      icon: BarChart3,
      title: 'Predictive Analytics',
      description:
        'Unified dashboards surface peak demand, utilization rates, and payroll-ready insights for data-driven decisions.',
      color: '#ff7e42',
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description:
        'Multi-tenant architecture with RBAC, organization-scoped data, and session-based OAuth ensures complete data sovereignty.',
      color: '#16a34a',
    },
  ];

  return (
        <section id="features" className="relative py-24 sm:py-32 overflow-hidden" style={{backgroundColor: '#FFFFFF'}}>
      {/* Diagonal cut top */}
      <div className="absolute top-0 left-0 w-full h-32" style={{
        background: '#000000',
        clipPath: 'polygon(0 0, 100% 40%, 100% 0)'
      }} />
      
      {/* Geometric accent with parallax */}
      <motion.div 
        style={{ 
          y: useTransform(scrollYProgress, [0.2, 0.5], [0, 100]),
          backgroundColor: '#4272ff'
        }}
        className="absolute top-0 right-0 w-[300px] h-[300px] opacity-10 rounded-full -translate-y-1/2 translate-x-1/2" 
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2
            className="text-4xl sm:text-5xl font-bold mb-4 text-black"
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}
          >
            Built for Enterprise Scale
          </h2>
          <p
            className="text-lg max-w-2xl mx-auto text-black/70"
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}
          >
            From route creation to payroll reconciliation, Routegna handles every
            aspect of your fleet operations—automated, secure, and scalable.
          </p>
        </motion.div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ 
                  duration: 0.6, 
                  delay: idx * 0.15,
                  type: "spring",
                  stiffness: 100
                }}
                className="p-8 rounded-2xl border transition-all duration-300"
                style={{backgroundColor: '#FFFFFF', borderColor: '#E5E5E5'}}
                whileHover={{ y: -12, scale: 1.02, transition: { duration: 0.2 } }}
              >
                <div 
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-6"
                  style={{ backgroundColor: feature.color }}
                >
                  <Icon size={28} style={{ color: 'white' }} />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-black">{feature.title}</h3>
                <p className="leading-relaxed text-black/70">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 text-center"
        >
          <p className="mb-4 text-black/70">
            Join organizations reducing costs and improving service quality
          </p>
          <a
            href="#cta"
            className="inline-flex items-center gap-2 font-semibold transition-all duration-300 hover:gap-3"
            style={{color: '#4272ff'}}
          >
            Get Started Today
            <span>→</span>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
