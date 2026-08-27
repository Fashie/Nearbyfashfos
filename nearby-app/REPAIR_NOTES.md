# Nearby — Real-Time Core Repair Notes

This revision repairs the three production-critical realtime areas requested:

## Chat
- Removed silent global local-storage fallback from Firebase CRUD/listeners.
- Direct-message listener is scoped to the signed-in user's `participants` array.
- Optimistic messages are preserved until the Firestore snapshot contains them.
- Real-user messages are persisted immediately instead of after an artificial delay.
- Message persistence errors are no longer swallowed.
- Notification failures no longer make an already-saved message appear unsent.

## Radar / Proximity
- Added a real-time `liveLocations` listener.
- Radar now prefers the freshest live GPS coordinates over stale profile coordinates.
- Distance is recalculated from the current user's actual GPS coordinates.
- Proximity filtering remains based on the existing radar radius.
- Reverse geocoding/Nominatim was removed from the GPS path; coordinates remain authoritative.

## Audio / Video Calls
- ICE candidate writes now use merge-safe Firestore writes so early candidates cannot be lost.
- Caller signaling documents preserve candidates when SDP metadata is written.
- Configurable TURN relay support was added through Vite environment variables.
- ICE candidate pooling and candidate-error diagnostics were added.

## Important production requirement
WebRTC cannot be guaranteed across all mobile networks with STUN alone. A production TURN relay should be configured:

VITE_TURN_SERVER_URL=
VITE_TURN_USERNAME=
VITE_TURN_CREDENTIAL=

Use credentials from a production TURN provider and never commit real credentials to the repository.

## Validation
The supplied environment did not contain a complete install of the project's npm dependencies, so a full TypeScript/Vite production build could not be completed here. The existing project files were edited directly and the repair package excludes the temporary `node_modules` created during validation attempts.
