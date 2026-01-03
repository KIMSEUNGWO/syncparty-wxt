# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **SyncParty**, a browser extension built with WXT (Web Extension Toolkit) and Vue 3. The extension appears to be focused on Netflix watch synchronization functionality.

## Technology Stack

- **WXT**: Web extension framework for building cross-browser extensions
- **Vue 3**: Frontend framework with Composition API and TypeScript
- **TypeScript**: Strict mode enabled
- **Browser targets**: Chrome (default) and Firefox

## Development Commands

```bash
# Development
npm run dev                 # Start dev server (Chrome)
npm run dev:firefox        # Start dev server (Firefox)

# Build
npm run build              # Production build (Chrome)
npm run build:firefox      # Production build (Firefox)

# Type checking
npm run compile            # Run TypeScript type checker (no emit)

# Packaging
npm run zip                # Create distributable zip (Chrome)
npm run zip:firefox        # Create distributable zip (Firefox)

# Setup
npm run postinstall        # Prepare WXT (runs automatically after install)
```

## Project Architecture

### Extension Entry Points

WXT uses a file-based entry point system in the `entrypoints/` directory:

- **`background.ts`**: Background service worker that runs independently of web pages
- **`index.ts`**: Content script injected into Netflix watch pages (`https://www.netflix.com/watch/*`), runs at `document_idle`
- **`popup/`**: Browser action popup UI
  - `index.html`: Popup HTML with `manifest.type` meta tag for browser_action
  - `main.ts`: Vue app initialization
  - `App.vue`: Root Vue component
  - `style.css`: Popup styles

### Configuration

- **`wxt.config.ts`**: Main WXT configuration
  - Extension name: "SyncParty"
  - Permissions: `sidePanel`
  - Vue module integration via `@wxt-dev/module-vue`
  - Path alias `@` configured (points to project root)

- **`tsconfig.json`**: Extends `.wxt/tsconfig.json` (auto-generated)
  - WXT generates TypeScript config with proper path mappings (`@`, `~`, `@@`, `~~`)
  - Strict mode enabled by default

### Directory Structure

```
entrypoints/     # Extension entry points (background, content, popup)
components/      # Reusable Vue components
assets/          # Static assets (e.g., vue.svg)
public/          # Public files copied to build (icons, etc.)
  icon/          # Extension icons
.output/         # Build output (excluded from TypeScript compilation)
.wxt/            # WXT generated files (tsconfig, types)
```

## Important Notes

- WXT uses file-based routing for extension entry points - files in `entrypoints/` are automatically detected
- The content script currently targets Netflix watch pages only
- TypeScript path aliases are auto-configured by WXT (use `@/` or `~/` for imports)
- The extension has `sidePanel` permission configured in manifest
- WXT auto-generates type definitions in `.wxt/wxt.d.ts`