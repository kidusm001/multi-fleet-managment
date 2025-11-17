import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

/**
 * MapShowcase Component
 * Sexy section showcasing Mapbox 3D capabilities alongside logo reveal video
 */
export function MapShowcase() {
  const mapContainerRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    // Initialize Mapbox 3D map
    if (mapContainerRef.current) {
      mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [38.7578, 9.0300], // Addis Ababa coordinates
        zoom: 15,
        pitch: 60, // 3D tilt
        bearing: -17.6, // 3D rotation
        antialias: true
      });

      // Add 3D buildings
      map.on('load', () => {
        // Add 3D buildings layer
        map.addLayer({
          'id': '3d-buildings',
          'source': 'composite',
          'source-layer': 'building',
          'filter': ['==', 'extrude', 'true'],
          'type': 'fill-extrusion',
          'minzoom': 15,
          'paint': {
            'fill-extrusion-color': '#aaa',
            'fill-extrusion-height': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15,
              0,
              15.05,
              ['get', 'height']
            ],
            'fill-extrusion-base': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15,
              0,
              15.05,
              ['get', 'min_height']
            ],
            'fill-extrusion-opacity': 0.6
          }
        });

        // Add terrain
        map.addSource('mapbox-dem', {
          'type': 'raster-dem',
          'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
          'tileSize': 512,
          'maxzoom': 14
        });

        map.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });

        // Add sky layer
        map.addLayer({
          'id': 'sky',
          'type': 'sky',
          'paint': {
            'sky-type': 'atmosphere',
            'sky-atmosphere-sun': [0.0, 0.0],
            'sky-atmosphere-sun-intensity': 15
          }
        });
      });

      // Animate the map slightly
      let animationId;
      const animate = () => {
        map.rotateTo(map.getBearing() + 0.1);
        animationId = requestAnimationFrame(animate);
      };
      map.on('load', () => {
        animate();
      });

      return () => {
        if (animationId) cancelAnimationFrame(animationId);
        map.remove();
      };
    }
  }, []);

  useEffect(() => {
    // Setup video loop
    const video = videoRef.current;
    if (video) {
      video.loop = true;
      video.muted = true;
      video.play();
    }
  }, []);

  return (
    <section id="maps" className="relative py-20 bg-black overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4"
            style={{ fontFamily: "'Bebas Neue', -apple-system, BlinkMacSystemFont, sans-serif" }}
          >
            Explore Our World
          </h2>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Experience immersive 3D mapping technology that brings your routes to life
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-8 gap-16 items-center">
          {/* Map Section */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="lg:col-span-3 relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10">
              <div
                ref={mapContainerRef}
                className="w-full h-96 lg:h-[500px] rounded-2xl"
              />
              <div className="absolute inset-0 rounded-2xl ring-1 ring-white/20" />
            </div>
            <div className="mt-6 text-center">
              <h3 className="text-2xl font-bold text-white mb-2">3D Route Visualization</h3>
              <p className="text-white/70">
                Interactive maps with terrain, buildings, and real-time route optimization
              </p>
            </div>
          </motion.div>

          {/* Video Section */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            className="lg:col-span-5 relative"
          >
            <div className="relative rounded-2xl overflow-hidden">
              <video
                ref={videoRef}
                className="w-full h-80 lg:h-[400px] object-cover rounded-2xl"
                playsInline
                muted
                loop
              >
                <source src="/assets/videos/logoReveal.mp4" type="video/mp4" />
              </video>
            </div>
            <div className="mt-6 text-center">
              <h3 className="text-2xl font-bold text-white mb-2">Our Brand</h3>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}