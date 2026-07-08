# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Run

```bash
# Build the plugin
./gradlew build

# Launch a sandbox IDE with the plugin loaded
./gradlew runIde

# Run with English or Chinese locale presets
./gradlew runIde -Duser.language=en
./gradlew runIde -Duser.language=zh

# Package the plugin distribution ZIP
./gradlew distributePlugin

# Verify plugin structure
./gradlew verifyPlugin
```

No tests exist yet (`src/test/` is absent), though the test framework dependency is already declared in `build.gradle.kts`.

## Architecture

The plugin registers a custom `FileType` and `FileEditorProvider` for `.ttf/.otf/.woff/.woff2` files, then renders an HTML-based preview inside a JCEF (Chromium) browser embedded in the editor tab. The editor uses `FileEditorPolicy.HIDE_DEFAULT_EDITOR` to replace the default binary viewer.

### Data flow (opening a font file)

```
VirtualFile (font bytes)
  ├─→ HtmlEditorHelper (project service)
  │     ├─→ FontCmapParser.extractMappedPuaCodePoints()  → JS int array literal
  │     ├─→ FontMetadataParser.parse()                   → MetadataEntry list
  │     └─→ Base64 encode font bytes                     → data: URL
  └─→ FontPreviewHtmlBuilder.build()
        ├─→ Reads static templates from /preview/font-preview.{html,css,js}
        ├─→ Replaces __TOKEN__ placeholders with i18n strings and data
        └─→ Returns a single self-contained HTML string
              └─→ FontPreviewFileEditor.loadPreviewHtml()
                    └─→ JBCefBrowser.loadHTML()
```

### Rendering split: JVM vs browser

- **JVM side**: Binary parsing of cmap (PUA extraction) and name table (metadata), plus Base64 encoding the font. These results are injected into the HTML as JS literals at build time.
- **Browser side**: `opentype.js` (loaded from CDN at runtime) handles glyph rendering (Glyph Index tab, SVG export) and OpenType feature detection (Playground tab). The Overview and PUA tabs work without it.

### WOFF2 limitation

`FontCmapParser` and `FontMetadataParser` only handle sfnt (TTF/OTF) and WOFF1 (with zlib inflation). WOFF2 returns `null`/empty from the JVM parsers — the Glyph Index and Playground tabs still work via `opentype.js`, but PUA and Metadata tabs show empty for WOFF2 files.

### Theme awareness

`FontPreviewFileEditor` subscribes to `LafManagerListener.TOPIC`. On theme change, it injects a JS call to `window.__fontViewerApplyTheme(theme)` in the browser. The CSS uses `:root[data-theme='light']` / `:root[data-theme='dark']` selectors for theming.

### Fallback when JCEF is unavailable

If `JBCefApp.isSupported()` returns false, the editor renders a plain `JTextArea` inside a `JPanel` with a message explaining the limitation.

### Template substitution

`FontPreviewHtmlBuilder` works entirely through string replacement on static template files. All user-facing strings in the HTML come from `MyMessageBundle` (i18n). JS-side strings are injected as JS string literals (`'escaped value'`). HTML-side strings are XML-escaped. This means any new UI text needs both a bundle key and a corresponding `__TOKEN__` placeholder in the templates.

### i18n

`MyMessageBundle` extends `AbstractBundle("messages.MyMessageBundle")`. English strings in `MyMessageBundle.properties`, Chinese in `MyMessageBundle_zh.properties`. The bundle key for metadata labels is computed at runtime: `"preview.metadata.key.${entry.key}"`.

## Key dependencies

| Dependency | Version |
|---|---|
| IntelliJ Platform Gradle Plugin | 2.10.5 |
| Kotlin JVM | 2.2.20 |
| JDK (toolchain) | 21 |
| Target IDE | 2025.3.1 (since-build 253) |
| Gradle | 9.4.0 |

Only `com.intellij.modules.platform` is declared as a plugin dependency — no other IntelliJ modules are required.
