(() => {
    const defaultText = __DEFAULT_TEXT_LITERAL__;
    const embeddedFontUrl = __FONT_DATA_URL_LITERAL__;
    const initialTheme = __INITIAL_THEME_LITERAL__;
    const metadataEntries = __METADATA_ENTRIES_LITERAL__;
    const mappedPuaCodePoints = __MAPPED_PUA_LITERAL__;
    const textNoMappedPua = __TEXT_NO_MAPPED_PUA_LITERAL__;
    const textNoGlyphData = __TEXT_NO_GLYPH_DATA_LITERAL__;
    const textLoadingOpentype = __TEXT_LOADING_OPENTYPE_LITERAL__;
    const textOpentypeUnavailable = __TEXT_OPENTYPE_UNAVAILABLE_LITERAL__;
    const textParsingFontBytes = __TEXT_PARSING_FONT_BYTES_LITERAL__;
    const textShowingGlyphIndex = __TEXT_SHOWING_GLYPH_INDEX_LITERAL__;
    const textUnableToParseFont = __TEXT_UNABLE_TO_PARSE_FONT_LITERAL__;
    const textMetadataEmpty = __TEXT_METADATA_EMPTY_LITERAL__;
    const textMetadataCopy = __TEXT_METADATA_COPY_LITERAL__;
    const textMetadataCopyAll = __TEXT_METADATA_COPY_ALL_LITERAL__;
    const textMetadataCopied = __TEXT_METADATA_COPIED_LITERAL__;
    const textMetadataCopyFailed = __TEXT_METADATA_COPY_FAILED_LITERAL__;
    const textGlyphDetailTitle = __TEXT_GLYPH_DETAIL_TITLE_LITERAL__;
    const textGlyphDetailClose = __TEXT_GLYPH_DETAIL_CLOSE_LITERAL__;
    const textGlyphDetailCopyText = __TEXT_GLYPH_DETAIL_COPY_TEXT_LITERAL__;
    const textGlyphDetailCopySvg = __TEXT_GLYPH_DETAIL_COPY_SVG_LITERAL__;
    const textGlyphDetailCopied = __TEXT_GLYPH_DETAIL_COPIED_LITERAL__;
    const textGlyphDetailCopyFailed = __TEXT_GLYPH_DETAIL_COPY_FAILED_LITERAL__;

    const applyTheme = (theme) => {
        const normalizedTheme = theme === 'light' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', normalizedTheme);
        window.dispatchEvent(new Event('fontViewerThemeChanged'));
    };

    window.__fontViewerApplyTheme = applyTheme;
    applyTheme(initialTheme);

    const refs = {
        input: document.getElementById('custom-preview-input'),
        targets: document.querySelectorAll('[data-preview-target="true"]'),
        tabButtons: document.querySelectorAll('[data-tab]'),
        tabPanels: document.querySelectorAll('[data-tab-panel]'),
        puaGrid: document.getElementById('pua-grid'),
        puaRange: document.getElementById('pua-range'),
        puaPrev: document.getElementById('pua-prev'),
        puaNext: document.getElementById('pua-next'),
        glyphGrid: document.getElementById('glyph-grid'),
        glyphRange: document.getElementById('glyph-range'),
        glyphStatus: document.getElementById('glyph-status'),
        glyphPrev: document.getElementById('glyph-prev'),
        glyphNext: document.getElementById('glyph-next'),
        metadataList: document.getElementById('metadata-list'),
        metadataStatus: document.getElementById('metadata-status'),
        metadataCopyAll: document.getElementById('metadata-copy-all'),
        glyphDetailOverlay: document.getElementById('glyph-detail-overlay'),
        glyphDetailBackdrop: document.querySelector('.glyph-detail-backdrop'),
        glyphDetailClose: document.getElementById('glyph-detail-close'),
        glyphDetailCanvas: document.getElementById('glyph-detail-canvas'),
        glyphDetailTable: document.getElementById('glyph-detail-table'),
        glyphDetailCopyText: document.getElementById('glyph-detail-copy-text'),
        glyphDetailCopySvg: document.getElementById('glyph-detail-copy-svg'),
    };

    const state = {
        usingMappedPua: Array.isArray(mappedPuaCodePoints),
        mappedPuaCodePoints,
        puaStart: 0xE000,
        puaEnd: 0xF8FF,
        puaPageSize: 0x100,
        puaPageStart: 0,
        glyphPageSize: 64,
        glyphPageStart: 0,
        glyphCount: 0,
        parsedFont: null,
    };

    if (!refs.input || refs.targets.length === 0) {
        return;
    }

    initPreviewText(refs, defaultText);
    initTabs(refs);
    initMetadata(refs, metadataEntries, {
        empty: textMetadataEmpty,
        copy: textMetadataCopy,
        copyAll: textMetadataCopyAll,
        copied: textMetadataCopied,
        copyFailed: textMetadataCopyFailed,
    });
    initPua(refs, state, textNoMappedPua);
    initGlyphIndex(refs, state, embeddedFontUrl, {
        noGlyphData: textNoGlyphData,
        loadingOpenType: textLoadingOpentype,
        openTypeUnavailable: textOpentypeUnavailable,
        parsingFontBytes: textParsingFontBytes,
        showingGlyphIndex: textShowingGlyphIndex,
        unableToParseFont: textUnableToParseFont,
    });
    initGlyphDetail(refs, state, {
        title: textGlyphDetailTitle,
        close: textGlyphDetailClose,
        copyText: textGlyphDetailCopyText,
        copySvg: textGlyphDetailCopySvg,
        copied: textGlyphDetailCopied,
        copyFailed: textGlyphDetailCopyFailed,
    });
})();

function initMetadata(refs, metadataEntries, texts) {
    if (!refs.metadataList || !refs.metadataStatus || !refs.metadataCopyAll) {
        return;
    }

    refs.metadataCopyAll.textContent = texts.copyAll;
    refs.metadataList.textContent = '';
    const validEntries = Array.isArray(metadataEntries)
        ? metadataEntries.filter((entry) => entry && typeof entry.label === 'string' && typeof entry.value === 'string')
        : [];

    if (validEntries.length === 0) {
        refs.metadataCopyAll.disabled = true;
        refs.metadataStatus.textContent = texts.empty;
        return;
    }

    refs.metadataCopyAll.disabled = false;
    refs.metadataCopyAll.addEventListener('click', async () => {
        const clipboardText = validEntries
            .map((entry) => entry.label + ': ' + entry.value)
            .join('\n');
        const copied = await copyText(clipboardText);
        if (copied) {
            refs.metadataCopyAll.disabled = true;
            refs.metadataCopyAll.textContent = texts.copied;
            setTimeout(() => {
                refs.metadataCopyAll.disabled = false;
                refs.metadataCopyAll.textContent = texts.copyAll;
            }, 1200);
            refs.metadataStatus.textContent = '';
        } else {
            refs.metadataStatus.textContent = texts.copyFailed;
        }
    });

    refs.metadataStatus.textContent = '';
    const fragment = document.createDocumentFragment();
    for (const entry of validEntries) {

        const row = document.createElement('div');
        row.className = 'metadata-item';

        const head = document.createElement('div');
        head.className = 'metadata-item-head';

        const label = document.createElement('div');
        label.className = 'metadata-key';
        label.textContent = entry.label;
        head.appendChild(label);

        const copyButton = document.createElement('button');
        copyButton.className = 'metadata-copy';
        copyButton.type = 'button';
        copyButton.textContent = texts.copy;
        copyButton.addEventListener('click', async () => {
            const copied = await copyText(entry.value);
            if (copied) {
                copyButton.disabled = true;
                copyButton.textContent = texts.copied;
                setTimeout(() => {
                    copyButton.disabled = false;
                    copyButton.textContent = texts.copy;
                }, 1200);
                refs.metadataStatus.textContent = '';
            } else {
                refs.metadataStatus.textContent = texts.copyFailed;
            }
        });
        head.appendChild(copyButton);

        const value = document.createElement('pre');
        value.className = 'metadata-value';
        value.textContent = entry.value;

        row.appendChild(head);
        row.appendChild(value);
        fragment.appendChild(row);
    }

    if (fragment.childNodes.length === 0) {
        refs.metadataStatus.textContent = texts.empty;
        return;
    }

    refs.metadataList.appendChild(fragment);
}

function initPreviewText(refs, defaultText) {
    const applyPreviewText = (value) => {
        const text = value.trim().length > 0 ? value : defaultText;
        refs.targets.forEach((element) => {
            element.textContent = text;
        });
    };

    refs.input.addEventListener('input', () => applyPreviewText(refs.input.value));
    applyPreviewText(refs.input.value);
}

function initTabs(refs) {
    refs.tabButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const activeTab = button.getAttribute('data-tab');
            refs.tabButtons.forEach((item) => item.classList.remove('active'));
            refs.tabPanels.forEach((panel) => panel.classList.remove('active'));
            button.classList.add('active');
            const panel = document.querySelector('[data-tab-panel="' + activeTab + '"]');
            if (panel) {
                panel.classList.add('active');
            }
        });
    });
}

function initPua(refs, state, textNoMappedPua) {
    const renderPuaPage = () => {
        if (!refs.puaGrid || !refs.puaRange || !refs.puaPrev || !refs.puaNext) {
            return;
        }

        refs.puaGrid.textContent = '';

        if (state.usingMappedPua && state.mappedPuaCodePoints.length === 0) {
            refs.puaRange.textContent = textNoMappedPua;
            refs.puaPrev.disabled = true;
            refs.puaNext.disabled = true;
            return;
        }

        const pageItems = [];
        let pageEnd = 0;
        if (state.usingMappedPua) {
            pageEnd = Math.min(state.puaPageStart + state.puaPageSize, state.mappedPuaCodePoints.length);
            pageItems.push(...state.mappedPuaCodePoints.slice(state.puaPageStart, pageEnd));
            const firstCodePoint = pageItems[0];
            const lastCodePoint = pageItems[pageItems.length - 1];
            refs.puaRange.textContent =
                'U+' + toHex(firstCodePoint) + ' - U+' + toHex(lastCodePoint) +
                ' (' + pageItems.length + ' / ' + state.mappedPuaCodePoints.length + ')';
        } else {
            const startCodePoint = state.puaStart + state.puaPageStart;
            const endCodePoint = Math.min(startCodePoint + state.puaPageSize - 1, state.puaEnd);
            for (let codePoint = startCodePoint; codePoint <= endCodePoint; codePoint += 1) {
                pageItems.push(codePoint);
            }
            pageEnd = Math.min(state.puaPageStart + state.puaPageSize, state.puaEnd - state.puaStart + 1);
            refs.puaRange.textContent = 'U+' + toHex(startCodePoint) + ' - U+' + toHex(endCodePoint);
        }

        const fragment = document.createDocumentFragment();
        for (const codePoint of pageItems) {
            const item = document.createElement('div');
            item.className = 'pua-item';

            const glyph = document.createElement('div');
            glyph.className = 'pua-glyph sample-font';
            glyph.textContent = String.fromCodePoint(codePoint);

            const label = document.createElement('div');
            label.className = 'pua-code';
            label.textContent = 'U+' + toHex(codePoint);

            item.appendChild(glyph);
            item.appendChild(label);
            fragment.appendChild(item);
        }

        refs.puaGrid.appendChild(fragment);
        refs.puaPrev.disabled = state.puaPageStart <= 0;
        refs.puaNext.disabled = state.usingMappedPua
            ? pageEnd >= state.mappedPuaCodePoints.length
            : (state.puaStart + pageEnd) > state.puaEnd;
    };

    if (refs.puaPrev && refs.puaNext) {
        refs.puaPrev.addEventListener('click', () => {
            state.puaPageStart = Math.max(0, state.puaPageStart - state.puaPageSize);
            renderPuaPage();
        });

        refs.puaNext.addEventListener('click', () => {
            const maxIndex = state.usingMappedPua
                ? Math.max(0, state.mappedPuaCodePoints.length - 1)
                : (state.puaEnd - state.puaStart);
            state.puaPageStart = Math.min(maxIndex, state.puaPageStart + state.puaPageSize);
            renderPuaPage();
        });
    }

    renderPuaPage();
}

function initGlyphIndex(refs, state, embeddedFontUrl, texts) {
    const setGlyphStatus = (message) => {
        if (refs.glyphStatus) {
            refs.glyphStatus.textContent = message;
        }
    };

    const renderGlyphPage = () => {
        if (!refs.glyphGrid || !refs.glyphRange || !refs.glyphPrev || !refs.glyphNext) {
            return;
        }
        refs.glyphGrid.textContent = '';

        if (!state.parsedFont || state.glyphCount <= 0) {
            refs.glyphRange.textContent = texts.noGlyphData;
            refs.glyphPrev.disabled = true;
            refs.glyphNext.disabled = true;
            return;
        }

        const pageEnd = Math.min(state.glyphPageStart + state.glyphPageSize, state.glyphCount);
        refs.glyphRange.textContent =
            'gid ' + state.glyphPageStart + ' - ' + (pageEnd - 1) +
            ' (' + (pageEnd - state.glyphPageStart) + ' / ' + state.glyphCount + ')';

        const fragment = document.createDocumentFragment();
        for (let gid = state.glyphPageStart; gid < pageEnd; gid += 1) {
            const glyph = state.parsedFont.glyphs.get(gid);
            if (!glyph) {
                continue;
            }

            const item = document.createElement('div');
            item.className = 'glyph-item';
            item.appendChild(createGlyphCanvas(glyph, state.parsedFont));

            const label = document.createElement('div');
            label.className = 'glyph-label';
            label.textContent = gid === 0 ? 'gid 0 (.notdef)' : 'gid ' + gid;
            item.appendChild(label);

            item.addEventListener('click', () => {
                const glyphData = buildGlyphDetailData(gid, state.parsedFont);
                if (glyphData) {
                    showGlyphDetail(refs, state, glyphData);
                }
            });

            fragment.appendChild(item);
        }
        refs.glyphGrid.appendChild(fragment);

        refs.glyphPrev.disabled = state.glyphPageStart <= 0;
        refs.glyphNext.disabled = pageEnd >= state.glyphCount;
    };

    if (refs.glyphPrev && refs.glyphNext) {
        refs.glyphPrev.addEventListener('click', () => {
            state.glyphPageStart = Math.max(0, state.glyphPageStart - state.glyphPageSize);
            renderGlyphPage();
        });

        refs.glyphNext.addEventListener('click', () => {
            const maxIndex = Math.max(0, state.glyphCount - 1);
            state.glyphPageStart = Math.min(maxIndex, state.glyphPageStart + state.glyphPageSize);
            renderGlyphPage();
        });
    }

    window.addEventListener('fontViewerThemeChanged', () => {
        if (state.parsedFont && state.glyphCount > 0) {
            renderGlyphPage();
        }
    });

    (async () => {
        if (!refs.glyphGrid || !refs.glyphRange || !refs.glyphStatus || !refs.glyphPrev || !refs.glyphNext) {
            return;
        }

        setGlyphStatus(texts.loadingOpenType);
        const ready = await ensureOpenType();
        if (!ready || !window.opentype) {
            setGlyphStatus(texts.openTypeUnavailable);
            return;
        }

        try {
            setGlyphStatus(texts.parsingFontBytes);
            const response = await fetch(embeddedFontUrl);
            const buffer = await response.arrayBuffer();
            state.parsedFont = window.opentype.parse(buffer);
            state.glyphCount = state.parsedFont.numGlyphs || (state.parsedFont.glyphs ? state.parsedFont.glyphs.length : 0);
            if (!state.glyphCount || state.glyphCount <= 0) {
                setGlyphStatus(texts.noGlyphData);
                renderGlyphPage();
                return;
            }

            setGlyphStatus(texts.showingGlyphIndex);
            renderGlyphPage();
        } catch (_ignored) {
            setGlyphStatus(texts.unableToParseFont);
            renderGlyphPage();
        }
    })();
}

async function ensureOpenType() {
    if (window.opentype) {
        return true;
    }

    const sources = [
        'https://cdn.jsdelivr.net/npm/opentype.js@1.3.4/dist/opentype.min.js',
        'https://unpkg.com/opentype.js@1.3.4/dist/opentype.min.js',
    ];
    for (const source of sources) {
        try {
            await loadScript(source);
            if (window.opentype) {
                return true;
            }
        } catch (_ignored) {
            // Try the next CDN source.
        }
    }
    return false;
}

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load ' + src));
        document.head.appendChild(script);
    });
}

async function copyText(value) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
            await navigator.clipboard.writeText(value);
            return true;
        } catch (_ignored) {
            // Fall through to legacy copy.
        }
    }
    return fallbackCopyText(value);
}

function fallbackCopyText(value) {
    const area = document.createElement('textarea');
    area.value = value;
    area.setAttribute('readonly', 'readonly');
    area.style.position = 'fixed';
    area.style.left = '-9999px';
    document.body.appendChild(area);
    area.select();

    try {
        return document.execCommand('copy');
    } catch (_ignored) {
        return false;
    } finally {
        document.body.removeChild(area);
    }
}

function createGlyphCanvas(glyph, parsedFont) {
    const canvas = document.createElement('canvas');
    canvas.width = 84;
    canvas.height = 84;
    canvas.className = 'glyph-canvas';
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        return canvas;
    }

    try {
        const metrics = glyph.getMetrics();
        const unitsPerEm = parsedFont.unitsPerEm || 1000;
        const fontSize = 56;
        const scale = fontSize / unitsPerEm;

        const xMin = Number.isFinite(metrics.xMin) ? metrics.xMin : 0;
        const xMax = Number.isFinite(metrics.xMax) ? metrics.xMax : 0;
        const yMin = Number.isFinite(metrics.yMin) ? metrics.yMin : 0;
        const yMax = Number.isFinite(metrics.yMax) ? metrics.yMax : 0;

        const width = (xMax - xMin) * scale;
        const height = (yMax - yMin) * scale;

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const drawX = centerX - ((xMin + xMax) * scale) / 2;
        const drawY = centerY + ((yMin + yMax) * scale) / 2;

        const inkColor = readGlyphInkColor();
        ctx.fillStyle = inkColor;
        if (width > 0.5 || height > 0.5) {
            glyph.draw(ctx, drawX, drawY, fontSize);
        }
    } catch (_ignored) {
        ctx.fillStyle = readGlyphInkColor();
        ctx.fillRect(36, 36, 12, 12);
    }

    return canvas;
}

function readGlyphInkColor() {
    const color = getComputedStyle(document.documentElement).getPropertyValue('--glyph-ink').trim();
    return color || '#f5f7fa';
}

function toHex(value) {
    return value.toString(16).toUpperCase().padStart(4, '0');
}

function initGlyphDetail(refs, state, texts) {
    var currentGlyphData = null;

    var closeModal = function () {
        if (refs.glyphDetailOverlay) {
            refs.glyphDetailOverlay.classList.remove('open');
        }
        currentGlyphData = null;
    };

    if (refs.glyphDetailClose) {
        refs.glyphDetailClose.addEventListener('click', closeModal);
    }
    if (refs.glyphDetailBackdrop) {
        refs.glyphDetailBackdrop.addEventListener('click', closeModal);
    }

    if (refs.glyphDetailCopyText) {
        refs.glyphDetailCopyText.textContent = texts.copyText;
        refs.glyphDetailCopyText.addEventListener('click', async function () {
            if (!currentGlyphData) return;
            var text = currentGlyphData.entries
                .map(function (e) { return e.key + ': ' + e.value; })
                .join('\n');
            var ok = await copyText(text);
            updateCopyButtonState(refs.glyphDetailCopyText, ok, texts.copyText, texts.copied, texts.copyFailed);
        });
    }

    if (refs.glyphDetailCopySvg) {
        refs.glyphDetailCopySvg.textContent = texts.copySvg;
        refs.glyphDetailCopySvg.addEventListener('click', async function () {
            if (!currentGlyphData) return;
            var svg = currentGlyphData.svg;
            if (!svg) return;
            var ok = await copyText(svg);
            updateCopyButtonState(refs.glyphDetailCopySvg, ok, texts.copySvg, texts.copied, texts.copyFailed);
        });
    }

    window.showGlyphDetail = function (refs, state, glyphData) {
        currentGlyphData = glyphData;
        renderGlyphDetailCanvas(refs.glyphDetailCanvas, glyphData.gid, state.parsedFont);
        renderGlyphDetailTable(refs.glyphDetailTable, glyphData.entries);
        resetCopyButtons(refs, texts);
        if (refs.glyphDetailOverlay) {
            refs.glyphDetailOverlay.classList.add('open');
        }
    };
}

function resetCopyButtons(refs, texts) {
    if (refs.glyphDetailCopyText) {
        refs.glyphDetailCopyText.disabled = false;
        refs.glyphDetailCopyText.textContent = texts.copyText;
    }
    if (refs.glyphDetailCopySvg) {
        refs.glyphDetailCopySvg.disabled = false;
        refs.glyphDetailCopySvg.textContent = texts.copySvg;
    }
}

function updateCopyButtonState(button, ok, defaultLabel, successLabel, failLabel) {
    if (!button) return;
    button.disabled = true;
    button.textContent = ok ? successLabel : failLabel;
    setTimeout(function () {
        button.disabled = false;
        button.textContent = defaultLabel;
    }, 1200);
}

function showGlyphDetail(refs, state, glyphData) {
    if (window.showGlyphDetail) {
        window.showGlyphDetail(refs, state, glyphData);
    }
}

function buildGlyphDetailData(gid, parsedFont) {
    if (!parsedFont) return null;
    var glyph = parsedFont.glyphs.get(gid);
    if (!glyph) return null;

    var metrics = glyph.getMetrics();
    var entries = [];

    entries.push({ key: 'Glyph ID', value: String(gid) });

    if (glyph.name) {
        entries.push({ key: 'Name', value: glyph.name });
    }

    if (glyph.unicodes && glyph.unicodes.length > 0) {
        var unicodeStrs = glyph.unicodes.map(function (u) { return 'U+' + toHex(u); });
        entries.push({ key: 'Unicode', value: unicodeStrs.join(', ') });

        var chars = glyph.unicodes.map(function (u) {
            try { return String.fromCodePoint(u); } catch (_) { return ''; }
        }).filter(Boolean);
        if (chars.length > 0) {
            entries.push({ key: 'Character', value: chars.join(' ') });
        }
    }

    entries.push({ key: 'Advance Width', value: String(metrics.advanceWidth) });
    entries.push({ key: 'Left Bearing', value: String(metrics.leftSideBearing) });
    entries.push({ key: 'Right Bearing', value: String(metrics.rightSideBearing) });
    entries.push({ key: 'xMin', value: String(metrics.xMin) });
    entries.push({ key: 'yMin', value: String(metrics.yMin) });
    entries.push({ key: 'xMax', value: String(metrics.xMax) });
    entries.push({ key: 'yMax', value: String(metrics.yMax) });

    var svg = generateGlyphSvg(glyph, parsedFont);

    return { gid: gid, entries: entries, svg: svg };
}

function generateGlyphSvg(glyph, parsedFont) {
    try {
        var unitsPerEm = parsedFont.unitsPerEm || 1000;
        var path = glyph.getPath(0, 0, unitsPerEm);
        var pathData = path.toPathData(2);
        var metrics = glyph.getMetrics();

        var padding = 40;
        var minX = boundsOr(metrics.xMin, 0);
        var minY = boundsOr(metrics.yMin, 0);
        var maxX = boundsOr(metrics.xMax, 0);
        var maxY = boundsOr(metrics.yMax, 0);

        var viewBoxX = minX - padding;
        var viewBoxY = -(maxY + padding);
        var viewBoxW = (maxX - minX) + padding * 2;
        var viewBoxH = (maxY - minY) + padding * 2;

        if (viewBoxW < 1 || viewBoxH < 1) {
            return null;
        }

        return '<svg xmlns="http://www.w3.org/2000/svg"' +
            ' viewBox="' + viewBoxX + ' ' + viewBoxY + ' ' + viewBoxW + ' ' + viewBoxH + '"' +
            ' width="' + viewBoxW + '" height="' + viewBoxH + '">' +
            '<path d="' + pathData + '" fill="currentColor"/>' +
            '</svg>';
    } catch (_) {
        return null;
    }
}

function boundsOr(value, fallback) {
    return Number.isFinite(value) ? value : fallback;
}

function renderGlyphDetailCanvas(canvas, gid, parsedFont) {
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    var glyph = parsedFont.glyphs.get(gid);
    if (!glyph) return;

    try {
        var metrics = glyph.getMetrics();
        var unitsPerEm = parsedFont.unitsPerEm || 1000;
        var fontSize = 120;
        var scale = fontSize / unitsPerEm;

        var xMin = Number.isFinite(metrics.xMin) ? metrics.xMin : 0;
        var xMax = Number.isFinite(metrics.xMax) ? metrics.xMax : 0;
        var yMin = Number.isFinite(metrics.yMin) ? metrics.yMin : 0;
        var yMax = Number.isFinite(metrics.yMax) ? metrics.yMax : 0;

        var centerX = canvas.width / 2;
        var centerY = canvas.height / 2;
        var drawX = centerX - ((xMin + xMax) * scale) / 2;
        var drawY = centerY + ((yMin + yMax) * scale) / 2;

        var inkColor = readGlyphInkColor();
        ctx.fillStyle = inkColor;

        var width = (xMax - xMin) * scale;
        var height = (yMax - yMin) * scale;
        if (width > 0.5 || height > 0.5) {
            glyph.draw(ctx, drawX, drawY, fontSize);
        }

        // Draw baseline, ascender, descender lines
        var mutedColor = getComputedStyle(document.documentElement).getPropertyValue('--muted').trim() || 'rgba(245,247,250,0.68)';
        ctx.lineWidth = 1;

        var lines = [];
        // Baseline at font y=0
        lines.push({ y: drawY, label: 'baseline' });
        // Ascender
        if (parsedFont.ascender != null) {
            lines.push({ y: drawY - parsedFont.ascender * scale, label: 'ascender' });
        }
        // Descender
        if (parsedFont.descender != null) {
            lines.push({ y: drawY - parsedFont.descender * scale, label: 'descender' });
        }

        lines.forEach(function (line) {
            if (!Number.isFinite(line.y)) return;
            ctx.strokeStyle = mutedColor;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(8, line.y);
            ctx.lineTo(canvas.width - 8, line.y);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.font = '10px -apple-system, BlinkMacSystemFont, sans-serif';
            ctx.fillStyle = mutedColor;
            ctx.fillText(line.label, 10, line.y - 4);
        });
    } catch (_) {
        ctx.fillStyle = readGlyphInkColor();
        ctx.fillRect(70, 70, 20, 20);
    }
}

function renderGlyphDetailTable(table, entries) {
    if (!table) return;
    table.textContent = '';

    var fragment = document.createDocumentFragment();
    entries.forEach(function (entry) {
        var row = document.createElement('tr');

        var keyCell = document.createElement('td');
        keyCell.className = 'glyph-detail-key';
        keyCell.textContent = entry.key;
        row.appendChild(keyCell);

        var valueCell = document.createElement('td');
        valueCell.className = 'glyph-detail-value';
        valueCell.textContent = entry.value;
        row.appendChild(valueCell);

        fragment.appendChild(row);
    });
    table.appendChild(fragment);
}

