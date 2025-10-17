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

  if (segments.length === 0) {
    return "";
  }

  const filteredSegments = segments.filter((part, index) => {
    if (index > 0 && /^ethiopia$/i.test(part)) {
      return false;
    }
    return true;
  });

  const dedupedSegments = filteredSegments.filter((part, index, array) => {
    if (index === 0) {
      return true;
    }
    return part.toLowerCase() !== array[index - 1].toLowerCase();
  });

  if (dedupedSegments.length >= 2) {
    const lastTwo = dedupedSegments.slice(-2);
    return lastTwo.join(", ");
  }

  return dedupedSegments[0] || trimmed;
};

export const formatDisplayAddressOrFallback = (address, fallback = "") => {
  const formatted = formatDisplayAddress(address);
  if (formatted) {
    return formatted;
  }
  return fallback;
};
