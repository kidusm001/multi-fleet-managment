export const formatDisplayAddress = (address) => {
  if (!address || typeof address !== "string") {
    return "";
  }

  const trimmed = address.trim();
  if (!trimmed) {
    return "";
  }

  const segments = trimmed
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  if (segments.length <= 1) {
    return segments[0] || trimmed;
  }

  const restSegments = segments.slice(1);
  const filteredRest = restSegments.filter((part) => {
    if (/ethiopia$/i.test(part) && restSegments.length > 1) {
      return false;
    }
    return true;
  });

  const normalizedRest = filteredRest.length > 0 ? filteredRest : restSegments;
  const formatted = normalizedRest.join(", ");

  return formatted || segments[0] || trimmed;
};

export const formatDisplayAddressOrFallback = (address, fallback = "") => {
  const formatted = formatDisplayAddress(address);
  if (formatted) {
    return formatted;
  }
  return fallback;
};
