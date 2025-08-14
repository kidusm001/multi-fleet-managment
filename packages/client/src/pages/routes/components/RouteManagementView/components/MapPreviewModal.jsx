import { motion } from "framer-motion";
import Map from "@components/Common/Map/MapComponent";
import { X } from "lucide-react";
import PropTypes from "prop-types";
import { useEffect } from "react";

const MapPreviewModal = ({ selectedRoute, onClose }) => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => {
      document.body.style.overflow = "hidden";
    }, 300); // Wait for smooth scroll to complete

    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-[9999] flex items-start pt-[5vh] justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-background w-[90vw] max-w-[1200px] h-[80vh] rounded-2xl overflow-hidden relative my-8"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-background/80 backdrop-blur border border-border hover:bg-accent transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        <Map selectedRoute={selectedRoute} showDirections={true} />
      </motion.div>
    </motion.div>
  );
};

MapPreviewModal.propTypes = {
  selectedRoute: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    coordinates: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number))
      .isRequired,
    areas: PropTypes.arrayOf(PropTypes.string).isRequired,
    dropOffOrder: PropTypes.arrayOf(PropTypes.number).isRequired,
    stops: PropTypes.number.isRequired,
    passengers: PropTypes.number.isRequired,
    status: PropTypes.string.isRequired,
  }),
  onClose: PropTypes.func.isRequired,
};

export default MapPreviewModal;
