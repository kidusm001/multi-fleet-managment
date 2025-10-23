import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap } from 'lucide-react';

/**
 * Hero Component
 * Flat, bold design with system fonts and minimal animations
 * Features: Headline, subheadline, dual CTA, metrics showcase
 */
export function Hero() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, 300]);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
      {/* Diagonal accent */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -bottom-32 -right-32 w-[800px] h-[800px] opacity-10" 
          style={{
            background: 'linear-gradient(135deg, #4272ff 0%, #ff7e42 100%)',
            transform: 'rotate(45deg)'
          }} 
        />
      </div>

      <motion.div 
        style={{ y, opacity }}
        className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-20 sm:py-32"
      >
        <div className="text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full"
            style={{
              backgroundColor: 'rgba(66, 114, 255, 0.1)',
              border: '2px solid #4272ff'
            }}
          >
            <Zap className="w-4 h-4" style={{color: '#4272ff'}} />
            <span className="text-sm font-medium" style={{color: '#4272ff'}}>
              AI-Powered Fleet Intelligence
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-black text-white mb-8 tracking-tight"
            style={{ 
              fontFamily: "'Bebas Neue', -apple-system, BlinkMacSystemFont, sans-serif",
              letterSpacing: '-0.02em'
            }}
          >
            Enterprise Fleet Management,{' '}
            <span className="text-[#4272ff]">Reimagined</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-4xl mx-auto text-lg sm:text-xl mb-16 leading-relaxed text-white/80"
            style={{ 
              fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
            }}
          >
            Routegna transforms corporate shuttle operations with adaptive routing,
            real-time optimization, and predictive analytics. Reduce costs by 20%,
            cut planning time by 50%, and deliver exceptional commuter experiences.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-20"
          >
            <Link
              to="/auth/signup"
              className="group flex items-center gap-3 px-10 py-5 text-white font-semibold text-lg rounded-full transition-all duration-300 hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #4272ff 0%, #ff7e42 100%)'
              }}
            >
              Get Started Free
              <ArrowRight className="w-6 h-6 transition-transform duration-300 group-hover:translate-x-2" />
            </Link>
            <a
              href="#features"
              className="group flex items-center gap-3 px-10 py-5 font-semibold text-lg rounded-full transition-all duration-300 text-white border-2 border-white/50 hover:border-white"
            >
              See How It Works
            </a>
          </motion.div>

          {/* Metrics - Clean cards */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-5xl mx-auto"
          >
            {[
              { label: 'Cost Reduction', value: '20%', desc: 'Lower operational costs', color: '#4272ff' },
              { label: 'Time Saved', value: '50%', desc: 'Faster route planning', color: '#ff7e42' },
              { label: 'Efficiency Gain', value: '15%', desc: 'Travel time optimization', color: '#4272ff' },
            ].map((metric, idx) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 + idx * 0.1 }}
                className="p-8 rounded-2xl backdrop-blur-sm transition-all duration-300 hover:scale-105 border-2"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderColor: metric.color
                }}
              >
                <div className="text-4xl font-bold mb-3" style={{color: metric.color, fontFamily: "'Bebas Neue', sans-serif"}}>
                  {metric.value}
                </div>
                <div className="text-lg font-semibold mb-2 text-white">
                  {metric.label}
                </div>
                <div className="text-sm text-white/70">{metric.desc}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="w-6 h-10 rounded-full flex items-start justify-center p-2 border-2 border-white/30">
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full"
            style={{backgroundColor: '#4272ff'}}
          />
        </div>
      </motion.div>
    </section>
  );
}
