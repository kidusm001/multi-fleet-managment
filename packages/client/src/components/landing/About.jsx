import React from 'react';
import { motion } from 'framer-motion';
import { Users, Award, TrendingUp } from 'lucide-react';

/**
 * About Component
 * Story/narrative section with timeline and key milestones
 * Flat design with centered content, max-width 800px
 */
export function About() {
  const milestones = [
    {
      icon: Users,
      title: 'The Problem',
      description:
        'Corporate shuttles in cities like Addis Ababa were coordinated through spreadsheets, phone calls, and guesswork—leading to 20% avoidable costs and hours of manual work.',
    },
    {
      icon: Award,
      title: 'The Solution',
      description:
        'Routegna was built by a team at HiLCoE School of Computer Science to replace fragmented workflows with a unified, data-driven platform.',
    },
    {
      icon: TrendingUp,
      title: 'The Impact',
      description:
        'Organizations now reduce operational costs by 20%, cut planning time by 50%, and deliver consistent, reliable commuter experiences at scale.',
    },
  ];

  return (
    <section id="about" className="relative py-24 sm:py-32 overflow-hidden bg-black">
      {/* Diagonal cut from white section */}
      <div className="absolute top-0 left-0 w-full h-32 bg-white" 
        style={{
          clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 100%)'
        }}
      />
      {/* Blue accent */}
      <div className="absolute bottom-20 left-0 w-[400px] h-[400px] opacity-5" 
        style={{
          backgroundColor: '#4272ff',
          transform: 'rotate(-45deg)'
        }} 
      />

      <div className="relative max-w-4xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2
            className="text-4xl sm:text-5xl font-bold mb-4 text-white"
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}
          >
            Built by Experts, Proven at Scale
          </h2>
          <p
            className="text-lg max-w-2xl mx-auto text-white/70"
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}
          >
            Routegna emerged from real-world challenges faced by enterprises managing
            employee transportation in congested urban environments.
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="space-y-12">
          {milestones.map((milestone, idx) => {
            const Icon = milestone.icon;
            return (
              <motion.div
                key={milestone.title}
                initial={{ opacity: 0, x: idx % 2 === 0 ? -60 : 60, scale: 0.8 }}
                whileInView={{ opacity: 1, x: 0, scale: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ 
                  duration: 0.7, 
                  delay: idx * 0.2,
                  type: "spring",
                  stiffness: 80
                }}
                className="flex flex-col items-center text-center"
              >
                {/* Icon */}
                <div className="flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{backgroundColor: '#ff7e42'}}>
                  <Icon className="w-8 h-8 text-white" strokeWidth={2} />
                </div>

                {/* Title */}
                <h3
                  className="text-2xl font-bold mb-2 text-white"
                  style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}
                >
                  {milestone.title}
                </h3>

                {/* Description */}
                <p
                  className="text-base leading-relaxed max-w-xl text-white/70"
                  style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}
                >
                  {milestone.description}
                </p>

                {/* Connector line (except last) */}
                {idx < milestones.length - 1 && (
                  <div className="w-px h-12 mt-8 bg-white/20" />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Pull Quote */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-20 p-8 rounded-2xl border-2"
          style={{backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: '#4272ff'}}
        >
          <blockquote
            className="text-xl sm:text-2xl font-semibold text-center italic mb-4 text-white"
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}
          >
            &ldquo;Routegna replaces fragmented coordination with a single, data-driven
            system—faster planning, reduced waste, and scalable operations.&rdquo;
          </blockquote>
          <p className="text-center font-medium text-white/60" style={{color: '#ff7e42'}}>
            — HiLCoE Senior Project Team, 2025
          </p>
        </motion.div>
      </div>
    </section>
  );
}
