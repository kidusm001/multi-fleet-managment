import PropTypes from "prop-types";

function CreateRoute({ onRouteCreated: _onRouteCreated }) {
  // ...existing code...
}

CreateRoute.propTypes = {
  onRouteCreated: PropTypes.func,
};

export default CreateRoute;