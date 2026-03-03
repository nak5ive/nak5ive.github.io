# Executive Summary: Andrew Kent (nak5ive) — Cash App Android

**Period:** December 2021 – February 2026 (4+ years)

---

## At a Glance

| Metric | Value |
|--------|-------|
| Total PRs | 826 |
| Merged PRs | 765 |
| Lines Added | 127,654 |
| Lines Deleted | 96,255 |
| Files Changed | 15,142 |
| Repositories | 12 |

---

## Technical Expertise

### Core: Android Platform Engineering
- **Jetpack Compose** — Extensive UI development across every major screen in Cash App: profiles, payments, settings, onboarding, QR, messaging, pools, and discover. Built custom composables (progress rings, clustered avatars, glitter shaders), managed Compose/View interop, and drove legacy XML-to-Compose migration.
- **Architecture Patterns** — Molecule (reactive Compose-based state), Broadway, MVP-to-MVVM migration, presenter/view/model separation, state-flow-based presenters, and modular architecture (api/fake/real layers).
- **Reactive Programming** — Migrated 17+ presenters from RxJava to Kotlin Coroutines/Flow. Deep fluency in both paradigms.
- **Dependency Injection** — Dagger module modernization across multiple feature areas.

### Specialty: Design System Engineering
- Led the organization-wide migration from "Mooncake" (legacy) to "Arcade" (new) design system across essentially every user-facing screen in Cash App Android.
- Built core Arcade components: segmented controls, toggles, dropdown buttons, badge system, inline messages, form inputs with masked input handling.
- Net deletion of 30,000+ lines of legacy UI code through systematic cleanup.

### Specialty: Developer Tooling & Infrastructure
- **@Paparazzi Snapshot Testing Framework** — Designed and built a KSP annotation processor + Gradle plugin that auto-generates screenshot tests from Compose `@Preview` functions. Adopted team-wide as foundational UI testing infrastructure.
- **Build Size Optimization** — Built R8 output analysis tooling to identify and remove unused strings across 20+ modules.
- **Echo Android SDK** — Bootstrapped a new SDK project with CI, sample app, logging plugin, and first release.

### Specialty: Bluetooth Low Energy / Hardware
- **Nearby** — Architected a BLE-based peer discovery system for in-person P2P payments, including advertisement/discovery abstractions, GATT services, and gRPC session resolution with real-time streaming.
- **Chirp** — Built a BLE push-to-talk hardware prototype (Arduino firmware on nRF52840, macOS CoreBluetooth companion app).

### Specialty: Graphics / Shader Programming
- Built a real-time glitter effect with procedural normal map generation, gyroscope-based 5-point lighting, and lifecycle-aware sensor management.

---

## Major Projects

### 1. Profile & Account Rewrite (Feb – Jul 2022)
**75 PRs | ~12,000 lines changed**

Rebuilt the Cash App profile and account experience from scratch: Compose migration, Molecule adoption, profile photo management system, profile preview, cashtag deep linking, verified/business badges, CDF analytics migration.

### 2. Threads / 1-to-1 Messaging (Oct 2022 – Jun 2023)
**~70 PRs | ~20,000 lines changed**

Built the messaging/threads feature end-to-end: message renderer architecture with factory pattern, payment message redesign with protobuf v2 support, navigation layer, experimentation integration (LaunchDarkly → Amplitude), offline support, multiple content types. Later systematically removed the feature (-15,756 lines) when the product direction changed.

### 3. Personalized Payments (Aug 2023 – Mar 2024)
**~30 PRs | ~3,500 lines changed**

Rich interactive payment customization: drag-and-drop elements, gesture transformations, glitter shader effects, carousel UI, state persistence.

### 4. Arcade Design System Migration (Jan – Dec 2024)
**~200 PRs | ~30,000+ lines changed (net -10,000)**

Single largest initiative by PR count. Migrated every major screen to the new Arcade design system: Account, Discover, P2P, Onboarding/IDV, QR, Documents, Settings, Security, Edit Profile. Built reusable components, established migration patterns, and removed tens of thousands of lines of legacy code.

### 5. Pools — Group Savings Feature (Mar 2025 – Jan 2026)
**~155 PRs | ~24,000 lines changed**

Built a complete group savings product from zero: proto definitions, contribution flows, payment instrument integration, theme system, animated progress rings, goal celebrations, observability across all screens, teen/sponsored account support, V2 redesign of creation and contribution flows.

### 6. Nearby — BLE Peer Discovery (Nov 2025 – Feb 2026)
**~25 PRs | ~8,600 lines changed**

Architected BLE-based peer-to-peer discovery for in-person payments: advertisement/discovery framework, gRPC session resolution with streaming, permission management, Pay/Get Paid flow, sample app for hardware testing.

---

## Timeline & Role Evolution

### Phase 1: Onboarding → Feature Owner (Dec 2021 – Jul 2022)
Ramped from bug fixes to owning the profile/account rewrite within ~2 months. Demonstrated rapid learning of the codebase, Compose migration skills, and end-to-end feature delivery across multiple repos.

### Phase 2: Greenfield Feature Builder (Jul 2022 – Oct 2023)
Built successive greenfield features (Groups, Threads, Personalized Payments) with increasing complexity. Designed scalable architectures, managed proto contracts, integrated experimentation systems.

### Phase 3: Platform Migration Lead (2024)
Drove the organization-wide Arcade design system migration, operating at peak velocity (91 PRs in Q3 2024). Built the @Paparazzi testing framework. Showed ability to execute systematic large-scale refactoring while maintaining product quality.

### Phase 4: Technical Leader & Architect (2025 – Present)
Simultaneously built two major features (Pools, Nearby), drove platform improvements (Green theme, build optimization), and prototyped hardware (Chirp BLE button). Scope spans mobile, networking, BLE, gRPC, firmware, and build tooling — operating as a senior/staff-level engineer driving multiple high-impact initiatives concurrently.

---

## Key Strengths

1. **Full-stack mobile ownership** — Consistently delivers features end-to-end: proto definitions → backend wiring → UI → analytics → experimentation → launch → cleanup
2. **Large-scale systematic execution** — The Arcade migration (~200 PRs) demonstrates ability to execute tedious but critical infrastructure work at scale with consistency and quality
3. **Architectural design** — Thread message renderer, Nearby BLE framework, @Paparazzi plugin, and Pools all show strong system design skills
4. **Technical breadth** — Compose UI, BLE/hardware, shader programming, KSP annotation processing, Gradle plugins, gRPC streaming, R8 analysis
5. **Codebase stewardship** — Proactively removes dead code (Threads deletion: -15,756 lines; Mooncake cleanups: -30,000+ lines), builds developer tooling, optimizes build size
6. **Velocity** — Sustained high output (765 merged PRs in 4 years, peaking at 100 merged PRs in a single quarter)
