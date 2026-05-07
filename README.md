# IntelliJ Font Viewer

An IntelliJ Platform plugin for previewing local font files inside the IDE — no external tools needed.

Supports **TTF**, **OTF**, **WOFF**, and **WOFF2** formats.

Check out at [JetBrains Marketplace](https://plugins.jetbrains.com/plugin/31561-fontviewer) or install directly from your IDE's plugin marketplace.

## Features

- **Overview** — Type custom text to preview the font at headline, paragraph, and multiple fixed sizes. A built-in glyph set shows the character coverage at a glance.
- **PUA Browser** — Browse the Private Use Area (U+E000–U+F8FF) with 256 code points per page. PUA mappings from the font's cmap table are shown first when available.
- **Glyph Index** — Renders every glyph outline via canvas, paginated 64 per page. Click any glyph to open a detail popup with full metrics (name, Unicode, advance width, bearings, bounding box) plus **Copy Text** and **Copy SVG** buttons.
- **Playground** — Type custom text and preview it with configurable OpenType features (liga, kern, salt, etc.) and typographic properties (font size, line height, letter spacing). Toggle individual features on/off live.
- **Metadata** — Displays the font's name-table entries (family, version, license, designer, etc.) with per-field and copy-all clipboard support.
- **Theme-aware** — Automatically follows the IDE light/dark theme.

## License

Apache License 2.0. See [LICENSE](LICENSE) for details.
