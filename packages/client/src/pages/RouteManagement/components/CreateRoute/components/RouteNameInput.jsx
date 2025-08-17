import React from "react";
import PropTypes from "prop-types";
import { Wand2 } from "lucide-react";
import { Input } from "@/components/Common/UI/Input";
import styles from "../styles/CreateRouteForm.module.css";

export default function RouteNameInput({
  routeName,
  onNameChange,
  onSuggest,
  showSuggest,
}) {
  return (
    <div className={styles.inputGroup}>
      <Input
        type="text"
        value={routeName}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder="Enter route name"
        className={styles.routeNameInput}
      />
      {showSuggest && (
        <button
          type="button"
          onClick={onSuggest}
          className={styles.suggestButton}
        >
          <Wand2 size={16} />
          <span>Suggest</span>
        </button>
      )}
    </div>
  );
}

RouteNameInput.propTypes = {
  routeName: PropTypes.string.isRequired,
  onNameChange: PropTypes.func.isRequired,
  onSuggest: PropTypes.func.isRequired,
  showSuggest: PropTypes.bool.isRequired,
};
