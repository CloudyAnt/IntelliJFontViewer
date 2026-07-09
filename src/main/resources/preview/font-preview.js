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
    const textGlyphSearchNoResults = __TEXT_GLYPH_SEARCH_NO_RESULTS_LITERAL__;
    const textGlyphFilterPresetPlaceholder = __TEXT_GLYPH_FILTER_PRESET_PLACEHOLDER_LITERAL__;
    const textGlyphFilterInvalidRange = __TEXT_GLYPH_FILTER_INVALID_RANGE_LITERAL__;
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
    const textFeaturesLoading = __TEXT_FEATURES_LOADING_LITERAL__;
    const textFeaturesEmpty = __TEXT_FEATURES_EMPTY_LITERAL__;
    const textFeaturesUnavailable = __TEXT_FEATURES_UNAVAILABLE_LITERAL__;
    const textPlaygroundDefault = __TEXT_PLAYGROUND_DEFAULT_LITERAL__;

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
        glyphSearchInput: document.getElementById('glyph-search'),
        glyphFilterMode: document.getElementById('glyph-filter-mode'),
        glyphFilterPreset: document.getElementById('glyph-filter-preset'),
        glyphFilterCustom: document.getElementById('glyph-filter-custom'),
        glyphFilterCustomStart: document.getElementById('glyph-filter-custom-start'),
        glyphFilterCustomEnd: document.getElementById('glyph-filter-custom-end'),
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
        featuresGrid: document.getElementById('features-grid'),
        featuresStatus: document.getElementById('features-status'),
        featuresReset: document.getElementById('features-reset'),
        playgroundInput: document.getElementById('playground-input'),
        playgroundDisplay: document.getElementById('playground-display'),
        propFontSize: document.getElementById('prop-font-size'),
        propLineHeight: document.getElementById('prop-line-height'),
        propLetterSpacing: document.getElementById('prop-letter-spacing'),
        propFontSizeVal: document.getElementById('prop-font-size-val'),
        propLineHeightVal: document.getElementById('prop-line-height-val'),
        propLetterSpacingVal: document.getElementById('prop-letter-spacing-val'),
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
        glyphSearchIndex: null,
        glyphSearchQuery: '',
        glyphSearchResults: null,
        glyphSearchDebounceTimer: null,
        glyphFilterMode: 'none',
        glyphFilterPresetIndex: -1,
        glyphFilterCustomStart: null,
        glyphFilterCustomEnd: null,
        glyphFilterDebounceTimer: null,
        parsedFont: null,
        featureTags: null,
        featureSettings: {},
        playgroundFontSize: 48,
        playgroundLineHeight: 1.2,
        playgroundLetterSpacing: 0,
    };

    if (!refs.input || refs.targets.length === 0) {
        return;
    }

    initPreviewText(refs, defaultText);
    initTabs(refs, state);
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
        searchNoResults: textGlyphSearchNoResults,
        filterPresetPlaceholder: textGlyphFilterPresetPlaceholder,
        filterInvalidRange: textGlyphFilterInvalidRange,
    });
    initGlyphDetail(refs, state, {
        title: textGlyphDetailTitle,
        close: textGlyphDetailClose,
        copyText: textGlyphDetailCopyText,
        copySvg: textGlyphDetailCopySvg,
        copied: textGlyphDetailCopied,
        copyFailed: textGlyphDetailCopyFailed,
    });
    initFeatures(refs, state, {
        loading: textFeaturesLoading,
        empty: textFeaturesEmpty,
        unavailable: textFeaturesUnavailable,
    });
    initPlayground(refs, state, textPlaygroundDefault);
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
        const rawText = value.trim().length > 0 ? value : defaultText;
        const text = resolveUnicodeEscapes(rawText);
        refs.targets.forEach((element) => {
            element.textContent = text;
        });
    };

    refs.input.addEventListener('input', () => applyPreviewText(refs.input.value));
    applyPreviewText(refs.input.value);
}

function initTabs(refs, state) {
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
            applyFeatureSettings(state);
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

function formatUnicodeRange(codePoint) {
    var hex = codePoint.toString(16).toUpperCase();
    while (hex.length < 4) {
        hex = '0' + hex;
    }
    return hex;
}

var GLYPH_UNICODE_BLOCKS = [
    { name: 'Mahjong Tiles', start: 0x1F000, end: 0x1F02F },
    { name: 'Domino Tiles', start: 0x1F030, end: 0x1F09F },
    { name: 'Playing Cards', start: 0x1F0A0, end: 0x1F0FF },
    { name: 'Chess Symbols', start: 0x1FA00, end: 0x1FA6F },
    { name: 'Alchemical Symbols', start: 0x1F700, end: 0x1F77F },
    { name: 'Egyptian Hieroglyphs', start: 0x13000, end: 0x1342F },
    { name: 'Basic Latin', start: 0x0020, end: 0x007F },
    { name: 'Latin-1 Supplement', start: 0x0080, end: 0x00FF },
    { name: 'Latin Extended-A', start: 0x0100, end: 0x017F },
    { name: 'Greek and Coptic', start: 0x0370, end: 0x03FF },
    { name: 'Cyrillic', start: 0x0400, end: 0x04FF },
    { name: 'Hebrew', start: 0x0590, end: 0x05FF },
    { name: 'Arabic', start: 0x0600, end: 0x06FF },
    { name: 'Devanagari', start: 0x0900, end: 0x097F },
    { name: 'Thai', start: 0x0E00, end: 0x0E7F },
    { name: 'Hiragana', start: 0x3040, end: 0x309F },
    { name: 'Katakana', start: 0x30A0, end: 0x30FF },
    { name: 'CJK Unified Ideographs', start: 0x4E00, end: 0x9FFF },
    { name: 'Hangul Syllables', start: 0xAC00, end: 0xD7AF },
    { name: 'Arrows', start: 0x2190, end: 0x21FF },
    { name: 'Mathematical Operators', start: 0x2200, end: 0x22FF },
    { name: 'Box Drawing', start: 0x2500, end: 0x257F },
    { name: 'Geometric Shapes', start: 0x25A0, end: 0x25FF },
    { name: 'Miscellaneous Symbols', start: 0x2600, end: 0x26FF },
    { name: 'Dingbats', start: 0x2700, end: 0x27BF },
    { name: 'Braille Patterns', start: 0x2800, end: 0x28FF },
    { name: 'Emoticons', start: 0x1F600, end: 0x1F64F },
    { name: 'Transport and Map Symbols', start: 0x1F680, end: 0x1F6FF },
    { name: 'Misc. Symbols & Pictographs', start: 0x1F300, end: 0x1F5FF },
];

function normalizeGlyphUnicodes(glyphEntry) {
    if (!glyphEntry) {
        return [];
    }
    if (Array.isArray(glyphEntry.unicodes)) {
        return glyphEntry.unicodes;
    }
    if (glyphEntry.unicode != null) {
        return [glyphEntry.unicode];
    }
    return [];
}

function getPrimaryUnicode(glyph) {
    if (!glyph) {
        return null;
    }
    if (Array.isArray(glyph.unicodes) && glyph.unicodes.length > 0) {
        var codePoint = glyph.unicodes[0];
        return typeof codePoint === 'number' ? codePoint : null;
    }
    if (glyph.unicode != null) {
        return glyph.unicode;
    }
    return null;
}

function initGlyphIndex(refs, state, embeddedFontUrl, texts) {
    const setGlyphStatus = (message) => {
        if (refs.glyphStatus) {
            refs.glyphStatus.textContent = message;
        }
    };

    function renderGlyphPage() {
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

        var isSearching = state.glyphSearchResults !== null;
        var totalCount = isSearching ? state.glyphSearchResults.length : state.glyphCount;

        if (isSearching && totalCount === 0) {
            refs.glyphRange.textContent = '';
            refs.glyphPrev.disabled = true;
            refs.glyphNext.disabled = true;
            return;
        }

        if (isSearching && state.glyphPageStart >= totalCount) {
            state.glyphPageStart = 0;
        }

        var pageEnd = Math.min(state.glyphPageStart + state.glyphPageSize, totalCount);

        if (isSearching) {
            var showing = Math.min(state.glyphPageSize, totalCount - state.glyphPageStart);
            var rangeLabel = '';
            if (state.glyphFilterMode === 'unicodeBlock' && state.glyphFilterPresetIndex >= 0 && state.glyphFilterPresetIndex < GLYPH_UNICODE_BLOCKS.length) {
                var rp = GLYPH_UNICODE_BLOCKS[state.glyphFilterPresetIndex];
                rangeLabel = rp.name + ' (U+' + formatUnicodeRange(rp.start) + '-U+' + formatUnicodeRange(rp.end) + ') — ';
            } else if (state.glyphFilterMode === 'customRange') {
                rangeLabel = 'Custom range — ';
            }
            refs.glyphRange.textContent =
                rangeLabel + 'gid ' + state.glyphSearchResults[state.glyphPageStart] + ' - ' + state.glyphSearchResults[pageEnd - 1] +
                ' (' + showing + ' / ' + totalCount + ')';
        } else {
            refs.glyphRange.textContent =
                'gid ' + state.glyphPageStart + ' - ' + (pageEnd - 1) +
                ' (' + (pageEnd - state.glyphPageStart) + ' / ' + state.glyphCount + ')';
        }

        var fragment = document.createDocumentFragment();
        for (var i = state.glyphPageStart; i < pageEnd; i += 1) {
            var gid = isSearching ? state.glyphSearchResults[i] : i;
            var glyph = state.parsedFont.glyphs.get(gid);
            if (!glyph) {
                continue;
            }

            var item = document.createElement('div');
            item.className = 'glyph-item';
            item.appendChild(createGlyphCanvas(glyph, state.parsedFont));

            var label = document.createElement('div');
            label.className = 'glyph-label';
            var primaryUnicode = isSearching ? getPrimaryUnicode(glyph) : null;
            if (primaryUnicode !== null) {
                label.textContent = 'U+' + toHex(primaryUnicode) + ' (gid ' + gid + ')';
            } else {
                label.textContent = gid === 0 ? 'gid 0 (.notdef)' : 'gid ' + gid;
            }
            item.appendChild(label);

            item.addEventListener('click', (function (capturedGid) {
                return function () {
                    var glyphData = buildGlyphDetailData(capturedGid, state.parsedFont);
                    if (glyphData) {
                        showGlyphDetail(refs, state, glyphData);
                    }
                };
            })(gid));

            fragment.appendChild(item);
        }
        refs.glyphGrid.appendChild(fragment);

        refs.glyphPrev.disabled = state.glyphPageStart <= 0;
        refs.glyphNext.disabled = pageEnd >= totalCount;
    }

    var performGlyphSearch = function (query) {
        if (!state.glyphSearchIndex) { return; }

        if (!query || query.trim().length === 0) {
            state.glyphSearchQuery = '';
            state.glyphSearchResults = null;
            state.glyphPageStart = 0;
            if (refs.glyphStatus) {
                refs.glyphStatus.textContent = texts.showingGlyphIndex;
            }
            renderGlyphPage();
            return;
        }

        var q = query.trim();
        state.glyphSearchQuery = q;
        var codePoint = null;
        var cpMatch;

        // U+XXXX, u+XXXX, or \uXXXX (4-6 hex digits)
        cpMatch = q.match(/^\\?[Uu]\+([0-9A-Fa-f]{4,6})$/);
        if (cpMatch) { codePoint = parseInt(cpMatch[1], 16); }

        // \uXXXX (4-6 hex digits)
        if (codePoint === null) {
            cpMatch = q.match(/^\\u([0-9A-Fa-f]{4,6})$/);
            if (cpMatch) { codePoint = parseInt(cpMatch[1], 16); }
        }

        // 0xXXXX
        if (codePoint === null) {
            cpMatch = q.match(/^0x([0-9A-Fa-f]+)$/);
            if (cpMatch) { codePoint = parseInt(cpMatch[1], 16); }
        }

        // Bare hex (exactly 4-6 hex digits)
        if (codePoint === null) {
            cpMatch = q.match(/^([0-9A-Fa-f]{4,6})$/);
            if (cpMatch) { codePoint = parseInt(cpMatch[1], 16); }
        }

        // Single literal character (use codePointAt for SMP support)
        if (codePoint === null && q.length >= 1 && q.length <= 2) {
            var cp = q.codePointAt(0);
            if (cp !== undefined) {
                try {
                    if (String.fromCodePoint(cp) === q) {
                        codePoint = cp;
                    }
                } catch (_) { /* fall through */ }
            }
        }

        // Validate code point range
        if (codePoint !== null && (codePoint > 0x10FFFF || (codePoint >= 0xD800 && codePoint <= 0xDFFF))) {
            codePoint = null;
        }

        var lowerQ = q.toLowerCase();
        state.glyphSearchResults = [];

        for (var i = 0; i < state.glyphSearchIndex.length; i += 1) {
            var entry = state.glyphSearchIndex[i];
            var entryUnicodes = entry.unicodes || [];
            var matches = false;

            // Exact code point match in unicodes array
            if (codePoint !== null && entryUnicodes.indexOf(codePoint) !== -1) {
                matches = true;
            }

            // Case-insensitive glyph name substring match
            if (!matches && entry.name && entry.name.toLowerCase().indexOf(lowerQ) !== -1) {
                matches = true;
            }

            if (matches) {
                state.glyphSearchResults.push(entry.gid);
            }
        }

        if (refs.glyphStatus) {
            if (state.glyphSearchResults.length === 0) {
                refs.glyphStatus.textContent = texts.searchNoResults;
            } else {
                refs.glyphStatus.textContent = texts.showingGlyphIndex;
            }
        }

        state.glyphPageStart = 0;
        renderGlyphPage();
    };

    // --- Filter application ---
    var applyFilter = function () {
        if (!state.glyphSearchIndex) { return; }

        var mode = state.glyphFilterMode;

        if (mode === 'none') {
            state.glyphSearchResults = null;
            state.glyphPageStart = 0;
            if (refs.glyphStatus) {
                refs.glyphStatus.textContent = texts.showingGlyphIndex;
            }
            renderGlyphPage();
            return;
        }

        if (mode === 'unicodeBlock') {
            var presetIndex = state.glyphFilterPresetIndex;
            if (presetIndex < 0 || presetIndex >= GLYPH_UNICODE_BLOCKS.length) {
                state.glyphSearchResults = null;
                state.glyphPageStart = 0;
                if (refs.glyphStatus) {
                    refs.glyphStatus.textContent = texts.showingGlyphIndex;
                }
                renderGlyphPage();
                return;
            }
            var preset = GLYPH_UNICODE_BLOCKS[presetIndex];
            var rangeStart = preset.start;
            var rangeEnd = preset.end;
            state.glyphSearchResults = [];
            for (var ri = 0; ri < state.glyphSearchIndex.length; ri += 1) {
                var rentry = state.glyphSearchIndex[ri];
                var rentryUnicodes = rentry.unicodes || [];
                for (var ru = 0; ru < rentryUnicodes.length; ru += 1) {
                    if (rentryUnicodes[ru] >= rangeStart && rentryUnicodes[ru] <= rangeEnd) {
                        state.glyphSearchResults.push(rentry.gid);
                        break;
                    }
                }
            }
            if (refs.glyphStatus) {
                if (state.glyphSearchResults.length === 0) {
                    refs.glyphStatus.textContent = texts.searchNoResults;
                } else {
                    refs.glyphStatus.textContent = texts.showingGlyphIndex;
                }
            }
            state.glyphPageStart = 0;
            renderGlyphPage();
            return;
        }

        if (mode === 'customRange') {
            var startStr = (refs.glyphFilterCustomStart && refs.glyphFilterCustomStart.value || '').trim();
            var endStr = (refs.glyphFilterCustomEnd && refs.glyphFilterCustomEnd.value || '').trim();
            if (startStr.length === 0 || endStr.length === 0) {
                state.glyphSearchResults = null;
                state.glyphPageStart = 0;
                if (refs.glyphStatus) {
                    refs.glyphStatus.textContent = texts.showingGlyphIndex;
                }
                renderGlyphPage();
                return;
            }
            var cs = parseInt(startStr, 16);
            var ce = parseInt(endStr, 16);
            if (isNaN(cs) || isNaN(ce) || cs < 0 || ce < cs || cs > 0x10FFFF || ce > 0x10FFFF) {
                state.glyphSearchResults = null;
                state.glyphPageStart = 0;
                if (refs.glyphStatus) {
                    refs.glyphStatus.textContent = texts.filterInvalidRange;
                }
                renderGlyphPage();
                return;
            }
            rangeStart = cs;
            rangeEnd = ce;
            state.glyphSearchResults = [];
            for (var ci = 0; ci < state.glyphSearchIndex.length; ci += 1) {
                var centry = state.glyphSearchIndex[ci];
                var centryUnicodes = centry.unicodes || [];
                for (var cu = 0; cu < centryUnicodes.length; cu += 1) {
                    if (centryUnicodes[cu] >= rangeStart && centryUnicodes[cu] <= rangeEnd) {
                        state.glyphSearchResults.push(centry.gid);
                        break;
                    }
                }
            }
            if (refs.glyphStatus) {
                if (state.glyphSearchResults.length === 0) {
                    refs.glyphStatus.textContent = texts.searchNoResults;
                } else {
                    refs.glyphStatus.textContent = texts.showingGlyphIndex;
                }
            }
            state.glyphPageStart = 0;
            renderGlyphPage();
            return;
        }

        // exactUnicode — handled by performGlyphSearch via debounced input
        if (mode === 'exactUnicode') {
            if (refs.glyphSearchInput && refs.glyphSearchInput.value.trim().length > 0) {
                performGlyphSearch(refs.glyphSearchInput.value);
            } else {
                state.glyphSearchResults = null;
                state.glyphPageStart = 0;
                if (refs.glyphStatus) {
                    refs.glyphStatus.textContent = texts.showingGlyphIndex;
                }
                renderGlyphPage();
            }
            return;
        }
    };

    // --- Update which secondary control is visible ---
    var updateFilterControls = function () {
        var mode = state.glyphFilterMode;
        if (refs.glyphFilterPreset) {
            refs.glyphFilterPreset.style.display = mode === 'unicodeBlock' ? '' : 'none';
        }
        if (refs.glyphFilterCustom) {
            refs.glyphFilterCustom.style.display = mode === 'customRange' ? '' : 'none';
        }
        if (refs.glyphSearchInput) {
            refs.glyphSearchInput.style.display = mode === 'exactUnicode' ? '' : 'none';
        }
    };

    var populatePresetDropdown = function () {
        if (!refs.glyphFilterPreset) {
            return;
        }

        var select = refs.glyphFilterPreset;
        while (select.lastChild) {
            select.removeChild(select.lastChild);
        }

        var placeholderOption = document.createElement('option');
        placeholderOption.value = '';
        placeholderOption.textContent = texts.filterPresetPlaceholder;
        select.appendChild(placeholderOption);

        for (var bi = 0; bi < GLYPH_UNICODE_BLOCKS.length; bi += 1) {
            var block = GLYPH_UNICODE_BLOCKS[bi];
            var option = document.createElement('option');
            option.value = String(bi);
            option.textContent = block.name + ' (U+' + formatUnicodeRange(block.start) + '-U+' + formatUnicodeRange(block.end) + ')';
            select.appendChild(option);
        }
    };

    if (refs.glyphPrev && refs.glyphNext) {
        refs.glyphPrev.addEventListener('click', function () {
            state.glyphPageStart = Math.max(0, state.glyphPageStart - state.glyphPageSize);
            renderGlyphPage();
        });

        refs.glyphNext.addEventListener('click', function () {
            var total = state.glyphSearchResults !== null ? state.glyphSearchResults.length : state.glyphCount;
            var maxPageStart = Math.max(0, total - state.glyphPageSize);
            state.glyphPageStart = Math.min(maxPageStart, state.glyphPageStart + state.glyphPageSize);
            renderGlyphPage();
        });
    }

    window.addEventListener('fontViewerThemeChanged', function () {
        if (state.parsedFont && state.glyphCount > 0) {
            renderGlyphPage();
        }
    });

    if (refs.glyphFilterMode) {
        state.glyphFilterMode = refs.glyphFilterMode.value;
        refs.glyphFilterMode.addEventListener('change', function () {
            state.glyphFilterMode = refs.glyphFilterMode.value;
            state.glyphPageStart = 0;
            state.glyphSearchQuery = '';
            state.glyphSearchResults = null;
            if (refs.glyphSearchInput) {
                refs.glyphSearchInput.value = '';
            }
            updateFilterControls();
            if (state.glyphFilterMode === 'unicodeBlock' && refs.glyphFilterPreset && refs.glyphFilterPreset.options.length <= 1) {
                try {
                    populatePresetDropdown();
                } catch (_presetErr) {
                    // Ignore; unicode block filter still works when presets load later.
                }
            }
            if (state.glyphFilterMode === 'exactUnicode') {
                if (refs.glyphStatus) {
                    refs.glyphStatus.textContent = texts.showingGlyphIndex;
                }
                renderGlyphPage();
            } else {
                applyFilter();
            }
        });
    }

    if (refs.glyphFilterPreset) {
        refs.glyphFilterPreset.addEventListener('change', function () {
            var val = refs.glyphFilterPreset.value;
            state.glyphFilterPresetIndex = val === '' ? -1 : parseInt(val, 10);
            state.glyphPageStart = 0;
            applyFilter();
        });
    }

    if (refs.glyphFilterCustomStart && refs.glyphFilterCustomEnd) {
        var handleCustomRangeInput = function () {
            clearTimeout(state.glyphFilterDebounceTimer);
            state.glyphFilterDebounceTimer = setTimeout(function () {
                state.glyphPageStart = 0;
                applyFilter();
            }, 300);
        };
        refs.glyphFilterCustomStart.addEventListener('input', handleCustomRangeInput);
        refs.glyphFilterCustomEnd.addEventListener('input', handleCustomRangeInput);
    }

    if (refs.glyphSearchInput) {
        refs.glyphSearchInput.addEventListener('input', function () {
            clearTimeout(state.glyphSearchDebounceTimer);
            state.glyphSearchDebounceTimer = setTimeout(function () {
                if (state.glyphFilterMode === 'exactUnicode') {
                    performGlyphSearch(refs.glyphSearchInput.value);
                }
            }, 300);
        });
    }

    updateFilterControls();

    (async () => {
        if (!refs.glyphGrid || !refs.glyphRange || !refs.glyphStatus || !refs.glyphPrev || !refs.glyphNext) {
            setGlyphStatus(texts.unableToParseFont);
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
            // Build search index for fast glyph lookup
            state.glyphSearchIndex = [];
            for (var gid = 0; gid < state.glyphCount; gid += 1) {
                var glyphEntry = state.parsedFont.glyphs.get(gid);
                if (!glyphEntry) { continue; }
                var unicodes = normalizeGlyphUnicodes(glyphEntry);
                var ch = '';
                for (var u = 0; u < unicodes.length; u += 1) {
                    try { ch += String.fromCodePoint(unicodes[u]); } catch (_) { /* skip */ }
                }
                state.glyphSearchIndex.push({
                    gid: gid,
                    name: glyphEntry.name || '',
                    unicodes: unicodes,
                    char: ch,
                });
            }
            extractFeatureTags(state);
            renderFeaturesTab(refs, state, texts);
            if (!state.glyphCount || state.glyphCount <= 0) {
                setGlyphStatus(texts.noGlyphData);
                renderGlyphPage();
                return;
            }

            setGlyphStatus(texts.showingGlyphIndex);
            if (state.glyphFilterMode === 'exactUnicode' && refs.glyphSearchInput && refs.glyphSearchInput.value.trim().length > 0) {
                performGlyphSearch(refs.glyphSearchInput.value);
            } else {
                applyFilter();
            }
        } catch (_ignored) {
            setGlyphStatus(texts.unableToParseFont);
            renderGlyphPage();
        }
    })();

    try {
        populatePresetDropdown();
    } catch (_presetErr) {
        // Unicode block presets are optional; other filters still work.
    }
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

function resolveUnicodeEscapes(str) {
    if (typeof str !== 'string' || str.length === 0) return str;
    return str.replace(/\\u([0-9a-fA-F]{4})|\\U([0-9a-fA-F]{8})/g, function (match, u4, u8) {
        var codePoint;
        if (u4) {
            codePoint = parseInt(u4, 16);
        } else {
            codePoint = parseInt(u8, 16);
        }
        if (codePoint > 0x10FFFF || (codePoint >= 0xD800 && codePoint <= 0xDFFF)) {
            return match;
        }
        try {
            return String.fromCodePoint(codePoint);
        } catch (_ignored) {
            return match;
        }
    });
}

function featureSpecUrl(tag) {
    var first = tag.charAt(0);
    var page;
    if (first >= 'a' && first <= 'e') {
        page = 'features_ae';
    } else if (first >= 'f' && first <= 'j') {
        page = 'features_fj';
    } else if (first >= 'k' && first <= 'o') {
        page = 'features_ko';
    } else if (first >= 'p' && first <= 't') {
        page = 'features_pt';
    } else {
        page = 'features_uz';
    }
    return 'https://learn.microsoft.com/en-us/typography/opentype/spec/' + page + '?source=recommendations#tag-' + tag;
}

function extractFeatureTags(state) {
    if (!state.parsedFont) {
        state.featureTags = null;
        return;
    }
    var tags = Object.create(null);
    try {
        var gsubFeatures = state.parsedFont.tables && state.parsedFont.tables.gsub && state.parsedFont.tables.gsub.features;
        var gposFeatures = state.parsedFont.tables && state.parsedFont.tables.gpos && state.parsedFont.tables.gpos.features;
        var allFeatures = [].concat(
            Array.isArray(gsubFeatures) ? gsubFeatures : [],
            Array.isArray(gposFeatures) ? gposFeatures : []
        );
        for (var i = 0; i < allFeatures.length; i += 1) {
            var tag = allFeatures[i].tag;
            if (typeof tag === 'string' && tag.length === 4) {
                tags[tag] = true;
            }
        }
        var tagList = Object.keys(tags).sort();
        state.featureTags = tagList.length > 0 ? tagList : null;
    } catch (_ignored) {
        state.featureTags = null;
    }
}

function renderFeaturesTab(refs, state, texts) {
    if (!refs.featuresGrid || !refs.featuresStatus) {
        return;
    }

    if (state.featureTags === null) {
        refs.featuresGrid.textContent = '';
        return;
    }

    if (state.featureTags.length === 0) {
        refs.featuresGrid.textContent = '';
        refs.featuresStatus.textContent = texts.empty;
        return;
    }

    refs.featuresStatus.textContent = state.featureTags.length + ' feature' + (state.featureTags.length > 1 ? 's' : '');

    var fragment = document.createDocumentFragment();
    for (var i = 0; i < state.featureTags.length; i += 1) {
        var tag = state.featureTags[i];
        var isOn = !!state.featureSettings[tag];

        var item = document.createElement('label');
        item.className = 'feature-item';

        var link = document.createElement('a');
        link.className = 'feature-tag';
        link.textContent = tag;
        link.href = featureSpecUrl(tag);
        link.target = '_blank';
        link.rel = 'noopener';
        link.title = 'OpenType spec for \'' + tag + '\'';
        item.appendChild(link);

        var toggle = document.createElement('span');
        toggle.className = 'feature-toggle';

        var checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = isOn;
        checkbox.addEventListener('change', function (t) {
            return function () {
                if (this.checked) {
                    state.featureSettings[t] = true;
                } else {
                    delete state.featureSettings[t];
                }
                applyFeatureSettings(state);
            };
        }(tag));

        var slider = document.createElement('span');
        slider.className = 'toggle-slider';

        toggle.appendChild(checkbox);
        toggle.appendChild(slider);
        item.appendChild(toggle);
        fragment.appendChild(item);
    }

    refs.featuresGrid.textContent = '';
    refs.featuresGrid.appendChild(fragment);
}

function isPlaygroundActive() {
    var panel = document.querySelector('[data-tab-panel="playground"]');
    return panel && panel.classList.contains('active');
}

function applyFeatureSettings(state) {
    var parts = [];
    var keys = Object.keys(state.featureSettings);
    for (var i = 0; i < keys.length; i += 1) {
        if (state.featureSettings[keys[i]]) {
            parts.push('"' + keys[i] + '" 1');
        }
    }
    var value = (parts.length > 0 && isPlaygroundActive()) ? parts.join(', ') : '';
    document.body.style.fontFeatureSettings = value;
    var input = document.getElementById('playground-input');
    var display = document.getElementById('playground-display');
    if (input) {
        input.style.fontFeatureSettings = value;
    }
    if (display) {
        display.style.fontFeatureSettings = value;
    }
}

function initFeatures(refs, state, texts) {
    if (!refs.featuresGrid || !refs.featuresStatus || !refs.featuresReset) {
        return;
    }

    refs.featuresGrid.textContent = '';
    refs.featuresStatus.textContent = texts.loading;

    refs.featuresReset.addEventListener('click', function () {
        state.featureSettings = {};
        applyFeatureSettings(state);
        if (state.featureTags && state.featureTags.length > 0) {
            renderFeaturesTab(refs, state, texts);
        }
    });
}

function applyPlaygroundStyles(refs, state) {
    var input = refs.playgroundInput;
    var display = refs.playgroundDisplay;
    if (!input) return;
    input.style.fontSize = state.playgroundFontSize + 'px';
    input.style.lineHeight = String(state.playgroundLineHeight);
    input.style.letterSpacing = state.playgroundLetterSpacing + 'em';
    if (display) {
        display.style.fontSize = state.playgroundFontSize + 'px';
        display.style.lineHeight = String(state.playgroundLineHeight);
        display.style.letterSpacing = state.playgroundLetterSpacing + 'em';
    }
}

function initPlayground(refs, state, defaultText) {
    var input = refs.playgroundInput;
    var display = refs.playgroundDisplay;
    if (!input) return;

    input.value = defaultText;

    var updateDisplay = function () {
        if (display) {
            var raw = input.value.trim().length > 0 ? input.value : '';
            display.textContent = resolveUnicodeEscapes(raw);
        }
    };

    input.addEventListener('input', function () {
        if (input.value.trim().length === 0) {
            input.value = '';
        }
        updateDisplay();
    });

    // Font size slider
    if (refs.propFontSize && refs.propFontSizeVal) {
        refs.propFontSize.addEventListener('input', function () {
            state.playgroundFontSize = parseInt(this.value, 10);
            refs.propFontSizeVal.textContent = state.playgroundFontSize + 'px';
            applyPlaygroundStyles(refs, state);
        });
    }

    // Line height slider
    if (refs.propLineHeight && refs.propLineHeightVal) {
        refs.propLineHeight.addEventListener('input', function () {
            state.playgroundLineHeight = parseInt(this.value, 10) / 100;
            refs.propLineHeightVal.textContent = state.playgroundLineHeight.toFixed(2);
            applyPlaygroundStyles(refs, state);
        });
    }

    // Letter spacing slider
    if (refs.propLetterSpacing && refs.propLetterSpacingVal) {
        refs.propLetterSpacing.addEventListener('input', function () {
            state.playgroundLetterSpacing = parseInt(this.value, 10) / 100;
            refs.propLetterSpacingVal.textContent = state.playgroundLetterSpacing.toFixed(2) + 'em';
            applyPlaygroundStyles(refs, state);
        });
    }

    applyPlaygroundStyles(refs, state);
    updateDisplay();
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
        var fontSize = 180;
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

