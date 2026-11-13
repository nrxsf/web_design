# DevForge — Client-Side Developer Utilities Showcase

**DevForge** is a web platform and catalog of client-side micro-utilities for developers (JWT Inspector, UUID v4/v7 Generator, Markdown Live Previewer, etc.) designed to run strictly in an isolated browser environment with zero server round-trips.

## Page Structure (Multi-Page Application)

The project is built with **Vite** and uses **EJS** partials (`header`, `footer`, `tool-card`) for modular HTML templating:

* **`index.html` (Home)** — Landing page featuring instant search, platform telemetry metrics, featured developer tools, a responsive WebP architecture diagram (`<picture>` + `srcset`), and a keyboard shortcuts bar.
* **`tools.html` (Catalog)** — Full utilities catalog with category filter chips, live search input, sorting controls, and pagination.
* **`tool-details.html` (Tool Workspace)** — Interactive tool workspace (showcasing the JWT Debugger) with a configuration toolbar, dual-pane code editor, and execution pipeline breakdown.
* **`about.html` (About)** — Overview of the isolated WASM architecture, zero-network privacy guarantees, technology stack, and open-source contribution workflow.

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
