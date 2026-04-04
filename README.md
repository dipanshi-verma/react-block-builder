# React Block Builder

A standalone **Gutenberg-powered visual page editor** built with React and Vite — no WordPress required. Compose pages with blocks, apply reusable templates, undo/redo changes, and preview the rendered output exactly as a visitor would see it.

**<a href="https://react-block-builder.vercel.app/" target="_blank">Live Demo →</a>**

---

## Features

| Feature | Description |
|---------|-------------|
| **Block Editor** | Full Gutenberg editor (`@wordpress/block-editor`) embedded in a React app |
| **Custom Blocks** | 4 hand-crafted blocks: Hero Banner, CTA, Image+Text, Card Grid |
| **JSON Block Factory** | Blocks defined in `customBlocksConfig.json` are auto-registered at startup — simulating database-loaded blocks |
| **Custom Category** | All custom blocks appear under "My Custom Blocks" in the inserter with a custom SVG icon |
| **Block Templates** | 8 pre-built page templates (Hero Section, CTA Banner, Landing Page, etc.) inserted via the toolbar picker |
| **Undo / Redo** | Full history stack with Undo / Redo toolbar buttons |
| **Frontend Preview** | Switch to a viewer that renders the saved block HTML exactly as a public page |
| **Swappable API** | `src/data/api.js` uses localStorage by default — swap the three functions for any real backend |
| **Drag & Drop** | Blocks can be reordered by dragging |
| **Sidebar Inspector** | Block settings panel powered by `BlockInspector` |

---

## Project Structure

```
src/
├── App.jsx                  # Main editor component (toolbar, undo/redo, templates)
├── FrontendPage.jsx         # Public-facing page viewer
├── main.jsx                 # App entry point + view router (editor ↔ site)
├── registerBlocks.jsx       # Block registration, JSON factory, custom category
├── index.css                # All application styles
│
├── blocks/                  # Hand-crafted custom blocks
│   ├── cta-block/
│   ├── hero-banner/
│   ├── image-text/
│   └── card-grid/
│
└── data/
    ├── api.js               # ← Swap this for your real backend
    ├── customBlocksConfig.json  # JSON definitions for auto-registered blocks
    └── blockTemplates.js    # 8 reusable page template layouts
```

---

## Getting Started

### Prerequisites

- Node.js `>=18`
- npm

### Install & Run

```bash
# Clone the repo
git clone https://github.com/bhavik-dreamz/react-block-builder.git
cd react-block-builder

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open `http://localhost:5173` in your browser.

### Build for Production

```bash
npm run build
# Output is in /dist
```

---

## How Data Storage Works

The app uses a swappable API layer at `src/data/api.js`. By default it uses **localStorage** so nothing needs a backend to run.

### To connect a real backend

Open `src/data/api.js` and replace the three function bodies:

```js
// Example — Express / Node REST API
export async function savePage(id, title, html, json) {
  const res = await fetch(`/api/pages/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, html, json }),
  });
  return res.json();
}

export async function loadPage(id) {
  const res = await fetch(`/api/pages/${id}`);
  return res.ok ? res.json() : null;
}

export async function listPages() {
  const res = await fetch('/api/pages');
  return res.json();
}
```

The rest of the app never changes. The same swap pattern works for:
- **WordPress REST API** — `PUT /wp-json/wp/v2/pages/:id`
- **Supabase** — `supabase.from('pages').upsert(...)`
- **Firebase** — `setDoc(doc(db, 'pages', id), ...)`

### Data format stored / fetched

```json
{
  "id": "home",
  "title": "Home",
  "html": "<!-- wp:paragraph -->...",
  "json": "[{\"clientId\":\"...\", ...}]",
  "updatedAt": "2026-04-04T12:00:00.000Z"
}
```

- `html` — output of `serialize(blocks)`. This is what you render on the public site with `innerHTML` (or `the_content()` in WordPress).
- `json` — output of `JSON.stringify(blocks)`. Used to re-parse and reopen in the editor.

---

## Adding Blocks via JSON

Add an entry to `src/data/customBlocksConfig.json`:

```json
{
  "name": "myapp/my-new-block",
  "title": "My New Block",
  "description": "A block loaded from JSON",
  "category": "myapp-blocks",
  "icon": "star-filled",
  "keywords": ["star", "feature"],
  "attributes": {
    "heading": { "type": "string", "default": "Hello" },
    "body":    { "type": "string", "default": "Your content here" },
    "accentColor": { "type": "string", "default": "#3858e9" }
  }
}
```

- Attributes with `color` in their name automatically get a color picker in the editor.
- The block is registered at startup by `registerJSONBlock()` in `registerBlocks.jsx`.
- In production, replace the static JSON import with a `fetch()` call to your API.

---

## Tech Stack

| Package | Version | Purpose |
|---------|---------|---------|
| React | ^18.2 | UI framework |
| Vite | ^5.4 | Build tool & dev server |
| @wordpress/block-editor | ^12 | Block editor UI |
| @wordpress/blocks | ^12 | Block registration & serialization |
| @wordpress/block-library | ^8 | Core block types (paragraph, heading, image…) |
| @wordpress/components | ^25 | UI component library |
| @wordpress/data | ^9 | State management |
| path-browserify | ^1.0 | Browser shim for Node's `path` module |

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server at `localhost:5173` |
| `npm run build` | Build optimised production bundle to `/dist` |
| `npm run preview` | Locally preview the production build |

---

## Author

**Bhavik Patel** — [@bhavik-dreamz](https://github.com/bhavik-dreamz)

Full-stack developer at **Dynamic Dreamz**, based in Surat, India. Specialises in WordPress/WooCommerce plugins, AI-powered tooling, MCP servers, Shopify integrations, and React-based page builders.

### Other projects

| Repo | Stack | Description |
|------|-------|-------------|
| [AI-Smart-Search-for-WooCommerce-Free](https://github.com/bhavik-dreamz/AI-Smart-Search-for-WooCommerce-Free) | PHP | AI smart search plugin for WooCommerce |
| [WooCommerce-AI-Chat-Support-free](https://github.com/bhavik-dreamz/WooCommerce-AI-Chat-Support-free) | PHP | AI chat support with Groq & OpenAI |
| [PDF-Chat-Support-for-WordPress](https://github.com/bhavik-dreamz/PDF-Chat-Support-for-WordPress) | PHP | PDF-powered AI support via Pinecone |
| [proposal-ai-agent](https://github.com/bhavik-dreamz/proposal-ai-agent) | TypeScript | AI proposal generator for IT project managers |
| [WordPress-MCP-Server](https://github.com/bhavik-dreamz/WordPress-MCP-Server) | TypeScript | MCP server for WordPress |
| [shopify-mcp-server-graphql](https://github.com/bhavik-dreamz/shopify-mcp-server-graphql) | JavaScript | Shopify MCP server via GraphQL |
| [ecommerce-mcp-server](https://github.com/bhavik-dreamz/ecommerce-mcp-server) | JavaScript | MCP server for e-commerce operations |
| [multi-agent-educational-AI-system](https://github.com/bhavik-dreamz/multi-agent-educational-AI-system) | JavaScript | Multi-agent system for exam generation & evaluation |
| [feedback-widget](https://github.com/bhavik-dreamz/feedback-widget) | JavaScript | Visual feedback & bug reporting widget |
