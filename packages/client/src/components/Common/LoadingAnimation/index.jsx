import { useEffect, useRef } from "react";
import PropTypes from "prop-types";

import styles from "./LoadingAnimation.module.css";

const LoadingAnimation = ({ text = "MMCY TECH", splitIndex = 4 }) => {
  const letters = text.split("");
  const carRef = useRef(null);
  const lettersRef = useRef([]);

  useEffect(() => {
    const animateLetters = () => {
      if (!carRef.current) return;

      const carRect = carRef.current.getBoundingClientRect();
      const carCenter = carRect.left + carRect.width / 2;

      lettersRef.current.forEach((letter) => {
        if (!letter) return;
        const letterRect = letter.getBoundingClientRect();
        const letterCenter = letterRect.left + letterRect.width / 2;

        if (Math.abs(carCenter - letterCenter) < 30) {
          letter.classList.add(styles.active);
        } else {
          letter.classList.remove(styles.active);
        }
      });

      requestAnimationFrame(animateLetters);
    };

    const animation = requestAnimationFrame(animateLetters);
    return () => cancelAnimationFrame(animation);
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.brandText}>
        {letters.map((letter, index) => (
          <span
            key={index}
            ref={(el) => (lettersRef.current[index] = el)}
            className={`${styles.letter} ${
              index >= splitIndex ? styles.tech : ""
            }`}
          >
            {letter}
          </span>
        ))}
      </div>

      <svg
        ref={carRef}
        className={styles.car}
        viewBox="0 0 60 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g>
          {/* Main sleek body */}
          <path d="M4 15 L15 5 H45 L56 15 L45 18 H15 Z" fill="#324048" />
          {/* Top accent */}
          <path d="M15 5 L19 10 H41 L45 5" fill="#f3684e" />
          {/* Windshield */}
          <path d="M21 7 L24 9 H36 L39 7" fill="rgba(255,255,255,0.9)" />
          {/* Bottom accent */}
          <path d="M12 15 L15 18 H45 L48 15" fill="#f3684e" />
          {/* Wheels */}
          <circle cx="19" cy="16" r="2" fill="#f3684e" />
          <circle cx="41" cy="16" r="2" fill="#f3684e" />
          {/* Front light */}
          <path d="M56 15 L58 15 L57 16 Z" fill="#f3684e">
            <animate
              attributeName="opacity"
              values="1;0.4;1"
              dur="0.3s"
              repeatCount="indefinite"
            />
          </path>
        </g>
      </svg>
    </div>
  );
};

LoadingAnimation.propTypes = {
  text: PropTypes.string,
  splitIndex: PropTypes.number,
};

export default LoadingAnimation;
