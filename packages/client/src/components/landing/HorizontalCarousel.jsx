import React, { useRef, useEffect, useState } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { Zap, MapPin, BarChart3 } from 'lucide-react';

/**
 * HorizontalCarousel Component
 * MSI-style horizontal scroll carousel - scroll down moves content right
 * Showcases platform capabilities with images and icons
 */
export function HorizontalCarousel() {
  const containerRef = useRef(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const xOffset = useMotionValue(0);

  const slides = [
    {
      title: "Intelligent Route Optimization",
      description: "AI-powered algorithms reduce fuel costs by up to 40% while improving on-time performance.",
      icon: Zap,
      color: "#4272ff",
      gradient: "linear-gradient(135deg, #4272ff 0%, #5b8cff 100%)",
      image: "/assets/images/carousel-route-optimization.png"
    },
    {
      title: "Real-Time Fleet Tracking",
      description: "Monitor every vehicle with GPS precision. Get instant alerts and optimize dispatch in real-time.",
      icon: MapPin,
      color: "#ff7e42",
      gradient: "linear-gradient(135deg, #ff7e42 0%, #ff9563 100%)",
      image: "/assets/images/carousel-fleet-tracking.png"
    },
    {
      title: "Advanced Analytics Dashboard",
      description: "Comprehensive insights into fleet performance, driver behavior, and cost optimization opportunities.",
      icon: BarChart3,
      color: "#10b981",
      gradient: "linear-gradient(135deg, #10b981 0%, #34d399 100%)",
      image: "/assets/images/carousel-analytics.png"
    },
    {
      title: "Automated Payroll Integration",
      description: "Seamlessly sync attendance, shifts, and mileage data for accurate, hassle-free payroll processing.",
      icon: BarChart3,
      color: "#8b5cf6",
      gradient: "linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)",
      image: "/assets/images/carousel-payroll.png"
    },
    {
      title: "Smart Driver Management",
      description: "Monitor performance, manage schedules, and ensure compliance with automated driver tracking and reporting.",
      icon: Zap,
      color: "#ec4899",
      gradient: "linear-gradient(135deg, #ec4899 0%, #f472b6 100%)",
      image: "/assets/images/carousel-drivers.png"
    }
  ];

  useEffect(() => {
    let touchStartY = 0;
    let isTouching = false;

    const handleWheel = (e) => {
      if (!containerRef.current) return;
      
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      
      // Different thresholds for scrolling down vs up to center the section
      let isInView;
      if (e.deltaY > 0) {
        // Scrolling down: stick when section is more past center
        const threshold = window.innerHeight * 0.15;
        isInView = rect.top <= threshold && rect.bottom >= threshold;
      } else {
        // Scrolling up: stick when section is more before center
        const threshold = window.innerHeight * 0.94;
        isInView = rect.top <= threshold && rect.bottom >= threshold;
      }
      
      if (isInView) {
        const currentX = xOffset.get();
        const slideWidth = window.innerWidth * 0.6;
        // Stop at 80% of the way to the last slide (when #5 is centered, not at the end)
        const maxScroll = -(slides.length - 1) * slideWidth * 0.8;
        
        // Check if we're at boundaries
        const isAtStart = currentX >= 0 && e.deltaY < 0;
        const isAtEnd = currentX <= maxScroll && e.deltaY > 0;
        
        // Only prevent scroll if we're NOT at boundaries
        if (!isAtStart && !isAtEnd) {
          e.preventDefault();
          e.stopPropagation();
          
          // Calculate slide progression
          const delta = e.deltaY;
          const newX = Math.max(maxScroll, Math.min(0, currentX - delta * 2));
          
          xOffset.set(newX);
          
          // Update current slide index
          const slideIndex = Math.round(Math.abs(newX) / slideWidth);
          setCurrentSlide(Math.min(slideIndex, slides.length - 1));
        }
        // At boundaries, allow normal page scroll (don't call preventDefault)
      }
    };

    const handleTouchStart = (e) => {
      if (!containerRef.current) return;
      
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const viewportCenter = window.innerHeight / 2;
      const sectionCenter = rect.top + rect.height / 2;
      const isInView = sectionCenter <= viewportCenter;
      
      if (isInView) {
        touchStartY = e.touches[0].clientY;
        isTouching = true;
      }
    };

    const handleTouchMove = (e) => {
      if (!isTouching || !containerRef.current) return;
      
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const currentY = e.touches[0].clientY;
      
      // Different thresholds for scrolling down vs up to center the section
      let isInView;
      if (currentY < touchStartY) {
        // Scrolling down (finger moving up): stick when section is more past center
        const threshold = window.innerHeight * 0.7;
        isInView = rect.top <= threshold && rect.bottom >= threshold;
      } else {
        // Scrolling up (finger moving down): stick when section is more before center
        const threshold = window.innerHeight * 0.3;
        isInView = rect.top <= threshold && rect.bottom >= threshold;
      }
      
      if (isInView) {
        const touchCurrentY = e.touches[0].clientY;
        const deltaY = touchStartY - touchCurrentY;
        
        const currentX = xOffset.get();
        const slideWidth = window.innerWidth * 0.6;
        // Stop at 80% of the way to the last slide
        const maxScroll = -(slides.length - 1) * slideWidth * 0.8;
        
        const isAtStart = currentX >= 0 && deltaY < 0;
        const isAtEnd = currentX <= maxScroll && deltaY > 0;
        
        // Only prevent if not at boundaries
        if (!isAtStart && !isAtEnd) {
          e.preventDefault();
          e.stopPropagation();
          
          // Convert vertical drag to horizontal scroll
          const newX = Math.max(maxScroll, Math.min(0, currentX - deltaY * 1.5));
          xOffset.set(newX);
          
          // Update current slide index
          const slideIndex = Math.round(Math.abs(newX) / slideWidth);
          setCurrentSlide(Math.min(slideIndex, slides.length - 1));
          
          touchStartY = touchCurrentY;
        }
      }
    };

    const handleTouchEnd = () => {
      isTouching = false;
    };

    // Use capture phase to intercept events before they bubble
    document.addEventListener('wheel', handleWheel, { passive: false, capture: true });
    document.addEventListener('touchstart', handleTouchStart, { passive: false, capture: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false, capture: true });
    document.addEventListener('touchend', handleTouchEnd, { capture: true });

    return () => {
      document.removeEventListener('wheel', handleWheel, { capture: true });
      document.removeEventListener('touchstart', handleTouchStart, { capture: true });
      document.removeEventListener('touchmove', handleTouchMove, { capture: true });
      document.removeEventListener('touchend', handleTouchEnd, { capture: true });
    };
  }, [slides.length, xOffset]);

  return (
    <section 
      id="showcase"
      ref={containerRef}
      className="relative bg-black overflow-hidden"
      style={{ height: "100vh" }}
    >
      {/* Sticky container that holds the horizontal scroll content */}
      <div className="h-screen flex items-center overflow-hidden">
        {/* Diagonal cut from previous white section */}
        <div 
          className="absolute top-0 left-0 w-full h-32 bg-white z-10" 
          style={{
            clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 100%)'
          }}
        />

        {/* Slide progress indicator */}
        <div className="absolute top-24 right-8 z-20 flex gap-2">
          {slides.map((_, idx) => (
            <div
              key={idx}
              className="h-2 rounded-full transition-all duration-300"
              style={{
                backgroundColor: currentSlide === idx ? '#4272ff' : 'rgba(255, 255, 255, 0.3)',
                width: currentSlide === idx ? '2rem' : '0.5rem'
              }}
            />
          ))}
        </div>

        {/* Moving container */}
        <motion.div 
          style={{ x: xOffset }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="flex gap-8 px-8 md:px-16 lg:px-24"
        >
          {slides.map((slide, index) => {
            const Icon = slide.icon;
            return (
              <div
                key={index}
                className="relative flex-shrink-0 w-[85vw] md:w-[70vw] lg:w-[50vw] h-[70vh] rounded-3xl overflow-hidden group"
                style={{
                  background: slide.gradient,
                  boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)'
                }}
              >
                {/* Background pattern */}
                <div 
                  className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%),
                                      radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)`
                  }}
                />

                {/* Content */}
                <div className="relative z-10 h-full flex flex-col justify-between p-8 md:p-12">
                  {/* Header */}
                  <div>
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      viewport={{ once: true }}
                      className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-2xl mb-6"
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        backdropFilter: 'blur(10px)',
                        border: '2px solid rgba(255, 255, 255, 0.3)'
                      }}
                    >
                      <Icon className="w-8 h-8 md:w-10 md:h-10 text-white" />
                    </motion.div>

                    <motion.h3
                      initial={{ y: 30, opacity: 0 }}
                      whileInView={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      viewport={{ once: true }}
                      className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4"
                      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}
                    >
                      {slide.title}
                    </motion.h3>

                    <motion.p
                      initial={{ y: 30, opacity: 0 }}
                      whileInView={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                      viewport={{ once: true }}
                      className="text-lg md:text-xl text-white/90 max-w-lg"
                      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}
                    >
                      {slide.description}
                    </motion.p>
                  </div>

                  {/* Image preview */}
                  <motion.div
                    initial={{ y: 50, opacity: 0, scale: 0.9 }}
                    whileInView={{ y: 0, opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    viewport={{ once: true }}
                    className="relative rounded-2xl overflow-hidden"
                    style={{
                      height: '500px',
                      backgroundColor: 'rgba(0, 0, 0, 0.2)',
                      border: '2px solid rgba(255, 255, 255, 0.2)',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    <img
                      src={slide.image}
                      alt={slide.title}
                      className="w-full h-full object-contain object-center opacity-95 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                  </motion.div>
                </div>

                {/* Slide number indicator */}
                <div 
                  className="absolute top-8 right-8 w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-lg"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)',
                    border: '2px solid rgba(255, 255, 255, 0.3)'
                  }}
                >
                  {index + 1}
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

