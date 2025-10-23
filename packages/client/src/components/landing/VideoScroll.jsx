import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * VideoScroll Component
 * Immersive video section that plays at normal speed when in view
 * Page scroll is disabled until the video finishes playing
 */
export function VideoScroll() {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const pauseTimerRef = useRef(null);
  const reverseIntervalRef = useRef(null);
  const [isReversing, setIsReversing] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    
    if (!video) return;

    // Video ready handler
    const handleLoadedMetadata = () => {
      setIsVideoReady(true);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    let isControlling = false;

    const handleWheel = (e) => {
      e.preventDefault();
      if (!isVideoReady) return;

      const delta = e.deltaY;

      // If at end and scrolling down, stop controlling to allow scroll past
      if (video.currentTime >= video.duration - 0.1 && delta > 0) {
        stopControlling();
        return;
      }

      // If at beginning and scrolling up, stop controlling to allow scroll past
      if (video.currentTime <= 0.1 && delta < 0) {
        stopControlling();
        return;
      }

      // Clear any existing pause timer
      if (pauseTimerRef.current) {
        clearTimeout(pauseTimerRef.current);
      }

      if (delta > 0) {
        // Scrolling down: play forward at normal speed
        setIsReversing(false);
        video.playbackRate = 1;
        video.play();
        // Set a timer to pause after 500ms of no scroll
        pauseTimerRef.current = setTimeout(() => {
          video.pause();
        }, 500);
      } else if (delta < 0) {
        // Scrolling up: start reversing faster
        setIsReversing(true);
        video.pause();
        // No pause timer for reverse, keeps reversing until scrolling down
      }
    };

    const startControlling = () => {
      if (isControlling) return;
      isControlling = true;
      containerRef.current.addEventListener('wheel', handleWheel, { passive: false });
    };

    const stopControlling = () => {
      if (!isControlling) return;
      isControlling = false;
      containerRef.current.removeEventListener('wheel', handleWheel);
      // Clear timer and pause video
      if (pauseTimerRef.current) {
        clearTimeout(pauseTimerRef.current);
        pauseTimerRef.current = null;
      }
      setIsReversing(false);
      if (video) video.pause();
    };

    // Intersection Observer to start controlling when section is in view
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && isVideoReady) {
            startControlling();
          } else {
            stopControlling();
          }
        });
      },
      { threshold: 0.9 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
      stopControlling();
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [isVideoReady]);

  // Effect for reverse playback
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideoReady) return;

    if (isReversing) {
      reverseIntervalRef.current = setInterval(() => {
        video.currentTime = Math.max(0, video.currentTime - 0.1); // Smoother reverse at original speed
      }, 25);
    } else {
      if (reverseIntervalRef.current) {
        clearInterval(reverseIntervalRef.current);
        reverseIntervalRef.current = null;
      }
    }

    return () => {
      if (reverseIntervalRef.current) {
        clearInterval(reverseIntervalRef.current);
      }
    };
  }, [isReversing, isVideoReady]);

  return (
    <section 
      id="video"
      ref={containerRef}
      className="relative bg-black overflow-hidden"
      style={{ height: "100vh" }}
    >
        {/* Sticky container */}
        <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
          {/* Diagonal cut from previous section */}
          <div 
            className="absolute top-0 left-0 w-full h-32 bg-black z-10" 
            style={{
              clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 100%)'
            }}
          />

          {/* Video container */}
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Background gradient */}
            <div 
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(circle at 50% 50%, rgba(66, 114, 255, 0.1) 0%, rgba(0, 0, 0, 1) 70%)'
              }}
            />

            {/* Video element */}
            <div className="relative w-full overflow-hidden">
              <video
                ref={videoRef}
                className="w-full h-auto"
                playsInline
                muted
                preload="auto"
                style={{
                }}
              >
                <source src="/assets/videos/routegna-demo.mp4" type="video/mp4" />
                <source src="/assets/videos/routegna-demo.webm" type="video/webm" />
              </video>

              {/* Loading overlay */}
              {!isVideoReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-t-blue-500 border-r-orange-500 border-b-transparent border-l-transparent animate-spin" />
                    <p className="text-white/80 text-sm font-semibold" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
                      Loading Experience...
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Scroll indicator */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.8 }}
              className="absolute bottom-20 left-1/2 transform -translate-x-1/2"
            >
              <div className="flex flex-col items-center gap-3">
                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  className="w-6 h-10 rounded-full border-2 border-white/60 flex items-start justify-center p-2"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-white/80" />
                </motion.div>
                <p className="text-white/80 text-sm font-semibold tracking-wider uppercase" 
                  style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', zIndex: 9999 }}>
                  Scroll to Play Video
                </p>
              </div>
            </motion.div>

            {/* Text overlay */}
            <motion.div
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="absolute top-24 left-1/2 transform -translate-x-1/2 text-center z-20"
            >
              <h2 className="text-4xl md:text-5xl lg:text-7xl text-transparent bg-clip-text bg-gradient-to-r from-[#f3684e] to-[#ff8a65] mb-4"
                style={{ 
                  fontFamily: "'Bebas Neue', -apple-system, BlinkMacSystemFont, sans-serif",
                  textShadow: '0 6px 30px rgba(243, 104, 78, 0.5), 0 0 60px rgba(243, 104, 78, 0.3)',
                  letterSpacing: '-0.02em',
                  fontWeight: 900
                }}
              >
                See Routegna in Action
              </h2>
              <p className="text-lg md:text-xl font-bold text-white"
                style={{ 
                  fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                  textShadow: '0 2px 10px rgba(0, 0, 0, 0.8)'
                }}
              >
                Watch how we transform fleet management
              </p>
            </motion.div>
          </div>

          {/* Diagonal cut to next section */}
          <div 
            className="absolute bottom-0 left-0 w-full h-32 bg-black z-10" 
            style={{
              clipPath: 'polygon(0 50%, 100% 0, 100% 100%, 0 100%)'
            }}
          />
        </div>
      </section>
  );
}