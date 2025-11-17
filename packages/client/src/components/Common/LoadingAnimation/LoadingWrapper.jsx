import PropTypes from "prop-types";

import styles from "./LoadingWrapper.module.css";

import LoadingAnimation from "./index";


const LoadingWrapper = ({ isLoading, children }) => {
  if (!isLoading) return children;

  return (
    <>
      <div style={{ visibility: "hidden" }}>{children}</div>
      <div className={styles.overlay}>
        <LoadingAnimation />
      </div>
    </>
  );
};

LoadingWrapper.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  children: PropTypes.node.isRequired,
};

export default LoadingWrapper;
