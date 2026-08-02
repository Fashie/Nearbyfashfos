# Nearby Application Architecture Guide

Welcome to the Nearby codebase architecture guide. This document outlines the clean, modular, and scalable **Feature-Based Architecture** implemented for Nearby, ensuring high maintainability, independence of visual concerns, and secure separation of platform services.

---

## 📂 Folder Structure

The project has been refactored into a standardized architectural layout:

```text
src/
├── app/                      # Application entry points & routing configuration
│   ├── App.tsx               # Main orchestration screen & global app layout
│   ├── providers/            # Context/Provider-level wrappers
│   └── routes/               # Modular routes definitions
├── shared/                   # Global reusable design system components
│   ├── Button/               # Primary & secondary responsive interactive button
│   ├── Card/                 # Clean, padded container panel with dark/light states
│   ├── Avatar/               # Multi-avatar, emoji, or picture display fallback
│   ├── Modal/                # AnimatePresence-powered center modal overlays
│   ├── Input/                # Standardized text inputs with form labels and errors
│   ├── BottomSheet/          # Swipeable/springy bottom sheet drawers for mobile
│   ├── Loading/              # Fully-centered SVG animation status loader
│   ├── EmptyState/           # Fallback template screen for empty results
│   └── components/           # Common, non-domain visual sub-components (SystemBanners, StateContainer, OptimizedImage)
├── features/                 # Modular, decoupled feature domains
│   ├── authentication/       # User credentials, auto-login, and email verification
│   ├── chat/                 # Direct messaging, group logs, status replies, forward
│   ├── calls/                # Audio/Video proximity calling interfaces
│   ├── profile/              # User settings, bios, cover pictures, custom avatars
│   ├── friends/              # Friendship requests, logs, and expired connections
│   ├── radar/                # Distance tracking, real-time presence, compass offsets
│   ├── maps/                 # Google Maps Platform configuration & location tracking
│   ├── safeMeetups/          # Propose/Schedule verification point and user ratings
│   ├── explore/              # Global explore feeds, post comments, and like metrics
│   ├── notifications/        # In-app alerts, story snap reaction indicators
│   ├── settings/             # Multi-language translation, sound toggles, accounts
│   ├── trust/                # User reports, verification levels, age confirmation
│   └── posts/                # Custom posts creation, delete actions, captions
├── services/                 # Infrastructure and database access layer
│   └── firebase/             # Firestore, Firebase Auth configuration & error proxies
├── hooks/                    # Reusable cross-feature custom hooks
│   ├── useAuth.ts            # User auth lifecycle and credential checks
│   ├── useProfile.ts         # Profile details caching and persistence
│   ├── useChat.ts            # Messaging stream listeners and chat send functions
│   ├── useRadar.ts           # Sort neighbors dynamically by proximity distance
│   ├── useLocation.ts        # Coordinates tracking and Geolocation watch callbacks
│   ├── useMeetups.ts         # User scheduled meetup lists and approval status
│   └── useNotifications.ts   # System-level notification delivery listeners
├── types/                    # Shared TypeScript interfaces & compile schemas
│   └── index.ts              # Core Neighbor, Message, Story, and Meetup declarations
├── utils/                    # Global helper utilities
│   └── index.ts              # State-specific street generators and distance formatting
├── constants/                # Project level immutable variables
│   └── index.ts              # Proximity hotspots, preset state boundaries
├── theme/                    # Color palette, dark mode configuration presets
└── assets/                   # Vector layouts, sound effects, static icons
```

---

## 🛠️ Feature Responsibilities

Each feature directory within `features/` is fully self-contained to maximize decoupling:
- **authentication**: Handles secure user registration, silent on-disk sessions restoration, sign-out operations, and Google OAuth wrappers.
- **chat**: Governs direct messaging, story-snap interactions, voice recording compression, and local read receipts.
- **radar**: Coordinates GPS synced range indicators, active neighbor indicators, and state epicenters.
- **safeMeetups**: Guides users through proposing, accepting, and rating real-world meetings at high-footflow locations.
- **profile**: Manages local caching and Firestore sync for bio entries, usernames, cover photos, and custom profile pictures.

---

## 🔄 Data Flow

Data in Nearby flows via a **Unidirectional and Service-Driven** pattern:
1. **Components** trigger actions inside customized **Hooks** or call public APIs inside **Services**.
2. **Services** execute structural operations (e.g. Firestore transactions, local caching) without leaking raw implementation details directly into components.
3. Hook listeners sync real-time database state back into React state to drive UI updates cleanly.

```text
[UI Components] ───> [Custom Hooks] ───> [Feature Services] ───> [Firebase/Storage Layer]
      ▲                                                                     │
      └─────────────────────────── [Real-time Streams] ─────────────────────┘
```

---

## 💾 State Management

Nearby optimizes standard React state with on-disk fallbacks to maintain resilience in sandboxed iframe environments:
- **Global Contexts / Hooks**: User authentication streams and background GPS updates are centralized to prevent redundant listeners.
- **Local Cache (`localStorage`)**: Profiles, credentials, and settings are cached on-disk on update to enable instant bypass of welcome screens during cold-starts.

---

## 📞 Services & Database Abstraction

All core database mutations and queries are organized under feature service modules (e.g. `src/features/chat/services/chatService.ts`):
- Direct mutations to the database within visual components are strictly prohibited.
- Errors are gracefully processed and piped through the custom Firestore tracking proxy to ensure seamless logging and system diagnosis.

---

## 📦 Shared Components

Our shared component suite follows strict **Tailwind design guidelines**:
- Avoids custom inline styles or arbitrary CSS sheets.
- Integrates fluidly with the master project theme.
- Features micro-animations implemented safely via `motion` for maximum responsiveness.

---

## 🚀 Best Practices for Future Development

1. **Strict Decoupling**: Features should never import files from other features directly. Instead, they should share logic through common schemas, utilities, or services.
2. **File Length Limit**: Keep components under **300 lines** and services under **400 lines** to maintain readability, support rapid parsing, and avoid token compilation truncation.
3. **No Unrequested Theme/UI Redesigns**: Maintain the pristine light-theme design, color palette, and high-contrast styling unless explicitly instructed.
4. **Lint and Type Validation**: Always run `npm run lint` and `npm run build` after changes to guarantee type-safe compile compliance.
