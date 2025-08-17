import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";

function CreateRoute({ onRouteCreated }) {
  // ...existing code...
}

CreateRoute.propTypes = {
  onRouteCreated: PropTypes.func,
};

export default CreateRoute;