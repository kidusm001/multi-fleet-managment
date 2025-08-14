import PropTypes from "prop-types";
import { Plus } from "lucide-react";

import styles from "../styles/CustomButton.module.css";

const CustomButton = ({ onClick, children, disabled }) => {
  return (
    <button className={styles.button} onClick={onClick} disabled={disabled}>
      <span className={styles.button__text}>{children}</span>
      <span className={styles.button__icon}>
        <Plus className={styles.svg} />
      </span>
    </button>
  );
};

CustomButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  disabled: PropTypes.bool,
};

export default CustomButton;
