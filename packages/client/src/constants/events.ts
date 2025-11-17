// Event names for shuttle updates
export const SHUTTLE_EVENTS = {
  MAINTENANCE_CHANGED: 'shuttle:maintenance-changed',
  STATUS_UPDATED: 'shuttle:status-updated',
  SHUTTLE_EDITED: 'shuttle:edited'
} as const;

type ShuttleEventTypes = typeof SHUTTLE_EVENTS;
export type ShuttleEventKeys = keyof ShuttleEventTypes;
export type ShuttleEventValues = ShuttleEventTypes[ShuttleEventKeys];