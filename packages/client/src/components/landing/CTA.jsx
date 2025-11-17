import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * CTA Component
 * Full-width section with form (name/email/submit) + basic validation
 * Flat design, no external libs (native state)
 */
export function CTA() {
  const [formData, setFormData] = useState({ name: '', email: '', company: '' });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Enter a valid email';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      // Simulated submission - in production, would call API
      console.log('Form submitted:', formData);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setFormData({ name: '', email: '', company: '' });
      }, 3000);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error on change
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <section id="cta" className="relative py-24 sm:py-32 overflow-hidden bg-white">
      {/* Diagonal cut from black section */}
      <div className="absolute top-0 left-0 w-full h-32 bg-black" 
        style={{
          clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 100%)'
        }}
      />
      {/* Orange diagonal accent */}
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] opacity-5" 
        style={{
          backgroundColor: '#ff7e42',
          transform: 'rotate(45deg)'
        }} 
      />

      <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-8 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2
            className="text-4xl sm:text-5xl font-bold mb-4 text-black"
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}
          >
            Ready to Transform Your Fleet?
          </h2>
          <p
            className="text-lg max-w-2xl mx-auto text-black/70"
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}
          >
            Join organizations reducing costs, saving time, and delivering better
            commuter experiences with Routegna.
          </p>
        </motion.div>

        {/* Form or Success State */}
        {submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 rounded-2xl text-center bg-white border-2"
            style={{borderColor: '#4272ff'}}
          >
            <div className="flex items-center justify-center w-16 h-16 rounded-full mx-auto mb-4" style={{backgroundColor: '#16a34a'}}>
              <Check className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-2 text-black">Thank You!</h3>
            <p className="text-black/70">
              We&apos;ll be in touch soon to discuss how Routegna can work for you.
            </p>
          </motion.div>
        ) : (
                    <motion.form
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ 
              duration: 0.7,
              delay: 0.2,
              type: "spring",
              stiffness: 100
            }}
            onSubmit={handleSubmit}
            className="p-8 rounded-2xl backdrop-blur-sm"
            style={{
              backgroundColor: '#FFFFFF',
              border: '2px solid #E5E5E5'
            }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              {/* Name Field */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-semibold mb-2 text-black"
                  style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}
                >
                  Full Name *
                </label>
                <motion.input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  whileFocus={{ scale: 1.01, borderColor: '#4272ff' }}
                  transition={{ duration: 0.2 }}
                  className="w-full px-4 py-3 rounded-lg focus:outline-none transition-all duration-300"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                    backgroundColor: '#F5F5F5',
                    border: errors.name ? '2px solid #ff7e42' : '2px solid #E5E5E5',
                    color: '#000000'
                  }}
                  placeholder="John Doe"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-400">{errors.name}</p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold mb-2 text-black"
                  style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}
                >
                  Work Email *
                </label>
                                <motion.input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  whileFocus={{ scale: 1.01, borderColor: '#4272ff' }}
                  transition={{ duration: 0.2 }}
                  className="w-full px-4 py-3 rounded-lg focus:outline-none transition-all duration-300"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                    backgroundColor: '#F5F5F5',
                    border: errors.email ? '2px solid #ff7e42' : '2px solid #E5E5E5',
                    color: '#000000'
                  }}
                  placeholder="john@company.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-400">{errors.email}</p>
                )}
              </div>
            </div>

            {/* Company Field (Optional) */}
            <div className="mb-6">
              <label
                htmlFor="company"
                className="block text-sm font-semibold mb-2 text-black"
                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}
              >
                Company Name
              </label>
                            <motion.input
                type="text"
                id="company"
                name="company"
                value={formData.company}
                onChange={handleChange}
                whileFocus={{ scale: 1.01, borderColor: '#4272ff' }}
                transition={{ duration: 0.2 }}
                className="w-full px-4 py-3 rounded-lg focus:outline-none transition-all duration-300"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                  backgroundColor: '#F5F5F5',
                  border: '2px solid #E5E5E5',
                  color: '#000000'
                }}
                placeholder="Acme Corp (Optional)"
              />
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              whileHover={{ 
                scale: 1.02, 
                boxShadow: '0 20px 40px rgba(255, 126, 66, 0.3)',
                transition: { duration: 0.2 }
              }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className="w-full flex items-center justify-center gap-2 px-8 py-4 font-semibold rounded-full text-white"
              style={{ 
                fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', 
                backgroundColor: '#ff7e42'
              }}
            >
              Request a Demo
              <ArrowRight className="w-5 h-5" />
            </motion.button>

            {/* Alternative CTA */}
            <p className="mt-6 text-center text-sm text-black/60">
              Or{' '}
              <Link
                to="/auth/login"
                className="font-semibold hover:underline"
                style={{color: '#4272ff'}}
              >
                sign up for free
              </Link>
              and get started immediately
            </p>
          </motion.form>
        )}
      </div>
    </section>
  );
}
