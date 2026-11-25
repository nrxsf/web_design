# DevForge — Client-Side Developer Utilities Showcase

**DevForge** is a web platform and catalog of client-side micro-utilities for developers (JWT Inspector, UUID v4/v7 Generator, Markdown Live Previewer, etc.) designed to run strictly in an isolated browser environment with zero server round-trips.

---

## Page Structure (Multi-Page Application)

The project is built with **Vite** and uses **EJS** partials (`header`, `footer`, `tool-card`) for modular HTML templating:

- **`index.html` (Home)** — Landing page featuring instant search, platform telemetry metrics, featured developer tools, a responsive WebP architecture diagram (`<picture>` + `srcset`), Schema.org JSON-LD structured data, and a keyboard shortcuts bar.
- **`tools.html` (Catalog)** — Dynamic utilities catalog powered by `json-server` and `axios` with category filter chips, debounced search, sorting controls, pagination, hash routing (`#/list`, `#/item/:id`), optimistic upvotes, and a validated tool submission form.
- **`tool-details.html` (Tool Workspace)** — Interactive tool workspace (showcasing the JWT Debugger) with a configuration toolbar, dual-pane code editor, and execution pipeline breakdown.
- **`about.html` (About)** — Overview of the isolated WASM architecture, zero-network privacy guarantees, technology stack, and open-source contribution workflow.

---

## JavaScript Interactivity & REST API (`json-server`)

The client application uses modular ES classes with native DOM manipulation (no UI frameworks) and `axios` for network communication:

```text
src/js/
├── api/
│   └── http.js              # Configured Axios client (baseURL, timeout, error interceptor)
├── services/
│   └── ItemService.js       # REST API operations, two-tier TTL cache, and static JSON fallback
├── components/
│   ├── ListView.js          # Grid & detail rendering, loading skeletons, error/empty states, optimistic likes
│   ├── Paginator.js         # Accessible pagination navigation and page density switcher (9/18/27)
│   └── SubmissionForm.js    # HTML5/JS form validation, localStorage draft persistence, and POST creation
├── router/
│   └── HashRouter.js        # Client-side hash router (#/list, #/item/:id) and URL state synchronization
└── main.js                  # Application entry point and event orchestration
```

### Implemented Features
- **Filtering, Search & Sorting:** Filter tools by category (`All`, `Formatters`, `Converters`, `Security`, `Encoders`, `Web`), search by keyword with a 300ms debounce, and sort by popularity, name (`A–Z` / `Z–A`), or execution latency.
- **Two-Tier Request Caching:** `ItemService` caches `GET` responses in both an in-memory `Map` and `localStorage` with a 60-second TTL, automatically invalidating cache entries upon `POST` or `PATCH` mutations.
- **Loading, Error & Empty States:** Displays skeleton placeholders during network fetches, graceful error banners with a **Retry Request** trigger if the API fails, and empty-state notices when no utilities match the active filters.
- **Hash Router & URL Sync:** Supports `#/list` (preserving `category`, `q`, `sort`, `page`, and `limit` query parameters across reloads) and `#/item/:id` detail views without full page refreshes.
- **Validated Submission Form:** Validates `required`, `pattern`, `min`, `max`, `minlength`, and `maxlength` constraints, saves form drafts automatically to `localStorage`, and persists new utilities via `POST /tools`.
- **Optimistic UI Updates with Rollback:** Upvoting (`♡`) immediately updates the counter and active state before `PATCH /tools/:id` resolves, rolling back the UI and displaying an error toast if the request fails (can be tested via `Alt + Click` on any upvote button).
- **Static Hosting Fallback:** Automatically falls back to `./api/db.json` when `json-server` is unreachable so the catalog remains fully interactive on GitHub Pages.

---

## Styles Architecture (SCSS 7-1 & BEM)

Styles follow the **BEM (Block Element Modifier)** naming methodology and the **7-1 architectural pattern** using modern modular Sass (`@use` / `@forward`):

```text
src/scss/
├── abstracts/          # Variables, functions, mixins, and custom grid system
│   ├── _variables.scss # OLED Dark Theme palette, typography stacks, and breakpoints
│   ├── _functions.scss # px-to-rem converter (rem()) and color-mix helper (tone())
│   ├── _mixins.scss    # Responsive breakpoints (respond-to), flexbox, typography, and card mixins
│   └── _grid.scss      # Custom 12-column grid mixin (container, row, col) with gutter support
├── base/               # Core resets, animations, utilities, and print rules
│   ├── _reset.scss     # Cross-browser CSS reset and base layout defaults
│   ├── _typography.scss# Section tags, version badges, status indicators, and kbd elements
│   ├── _animations.scss# Keyframe animation system (@keyframes appear, fade, slide)
│   ├── _utilities.scss # Spacing (.u-mt-*, .u-p-*) and visibility utility classes
│   └── _print.scss     # Clean document print stylesheet (@media print)
├── components/         # Reusable UI components
│   ├── _buttons.scss   # Button variants (.btn--primary, --secondary, --outline, --ghost)
│   ├── _tool-card.scss # Catalog utility card with code preview and status badges
│   ├── _forms.scss     # Search bars, filter chips, and toolbar form controls
│   ├── _breadcrumbs.scss # Hierarchical navigation breadcrumbs
│   └── _terminal.scss  # Terminal emulator window and code snippet embed
├── layout/             # Global page layout structures
│   ├── _header.scss    # Responsive header (fixed bottom Tab Bar on mobile + top bar on desktop)
│   └── _footer.scss    # Multi-column footer with release metadata
├── pages/              # Page-specific layout grids and overrides
│   ├── _home.scss
│   ├── _tools.scss
│   ├── _tool-details.scss
│   └── _about.scss
├── themes/             # Theme configurations
│   └── _dark.scss      # CSS Custom Properties for the dark theme
├── vendors/            # Third-party stylesheet overrides
│   └── _index.scss
└── main.scss           # Single entry point compiled into production CSS
```

---

## Getting Started & Scripts

### Prerequisites
- Node.js `>= 18` and `npm`

### Installation & Local Development
```bash
# 1. Install dependencies
npm install

# 2. Start Vite dev server (port 5173) and json-server mock API (port 5174) concurrently
npm run dev:vite
```

- **Application URL:** `http://localhost:5173/tools.html`
- **Mock REST API (`api/db.json`):** `http://localhost:5174/tools`

### Linting & Production Build
```bash
# Run ESLint check
npm run lint

# Run ESLint and build static assets into dist/
npm run build:vite
```
