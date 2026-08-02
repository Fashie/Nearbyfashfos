# Technical Debt Tracker

This document records the known limitations, architectural compromises, and planned future refactors for the Nearby codebase. These items are non-critical and safe to defer until after the production launch.

---

## 🏗️ 1. Refactor Monolithic Core: `src/app/App.tsx`
- **Current State**: `App.tsx` acts as the central orchestration controller and is exceptionally large (~16k lines), housing local views, sub-drawers, and various local state managers.
- **Why It is Debt**: While highly robust, performant, and correctly linked with on-disk fallbacks and quota handlers, the size of this file makes extensive visual iterations more time-consuming to audit.
- **Future Resolution**: Break down the remaining inline tab segments (e.g., active menu, direct radar panels, status list) into the respective directories created under `/src/features/` (e.g., `/src/features/radar/`, `/src/features/settings/`).

---

## 💾 2. Local State Management Consolidation
- **Current State**: Local states (friends, chats, stories, locations) are managed using nested React state blocks, with direct cache handlers syncing to `localStorage` for session restoration.
- **Why It is Debt**: This design bypasses sandbox iframe cookie constraints, but as the app grows, a state manager or specialized React Contexts would simplify tracing state updates.
- **Future Resolution**: Introduce structured, modular context files under `src/app/providers/` (e.g., `ChatContext`, `RadarContext`) to abstract state sync and persistence details from components.

---

## 🗺️ 3. Google Maps Integration & Geocoding Caching
- **Current State**: Google Maps and Directions APIs are called directly dynamically. If coordinate drift occurs rapidly, it can trigger successive API calls.
- **Why It is Debt**: In heavy simulation testing, rapid geolocation geocoding updates can consume Firestore and Google Cloud billing actions if unchecked.
- **Future Resolution**: Implement a robust debounce wrapper and cache geocoded coordinates locally inside `sessionStorage` or local states to eliminate redundant geocoding queries for identical coordinate ranges.

---

## 📱 4. Iframe Sandbox Storage and Fallback State
- **Current State**: Iframe sandbox restrictions on iOS and Android sometimes block standard cookies or nested storage APIs, requiring our custom status-warning banners and safe, local-disk auto-login restorations.
- **Why It is Debt**: These workarounds are highly effective and user-friendly, but represent an extra layer of defensive logic that can be streamlined.
- **Future Resolution**: As the web application shifts entirely to standalone domains, we can transition from our iframe fallback indicators into standard PWA (Progressive Web App) service workers to simplify storage permissions.
