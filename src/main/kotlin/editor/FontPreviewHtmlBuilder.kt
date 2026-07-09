package cn.itscloudy.fontviewer.editor

import cn.itscloudy.fontviewer.MyFileType
import cn.itscloudy.fontviewer.MyMessageBundle
import com.intellij.openapi.util.text.StringUtil
import java.io.InputStream

object FontPreviewHtmlBuilder {

    fun build(
        fontType: MyFileType,
        fontDataUrl: String,
        previewTitle: String,
        fileExtension: String,
        metadataEntries: List<FontMetadataParser.MetadataEntry>,
        mappedPuaCodePointsLiteral: String,
        isDarkTheme: Boolean,
    ): String {
        val css = cssTemplate
        val js = jsTemplate
            .replace("__DEFAULT_TEXT_LITERAL__", defaultPreviewTextAsJsLiteral())
            .replace("__FONT_DATA_URL_LITERAL__", jsStringLiteral(fontDataUrl))
            .replace("__INITIAL_THEME_LITERAL__", jsStringLiteral(if (isDarkTheme) "dark" else "light"))
            .replace("__METADATA_ENTRIES_LITERAL__", metadataEntriesAsJsLiteral(metadataEntries))
            .replace("__MAPPED_PUA_LITERAL__", mappedPuaCodePointsLiteral)
            .replace("__TEXT_NO_MAPPED_PUA_LITERAL__", jsMessageLiteral("preview.pua.empty"))
            .replace("__TEXT_NO_GLYPH_DATA_LITERAL__", jsMessageLiteral("preview.glyph.noData"))
            .replace("__TEXT_LOADING_OPENTYPE_LITERAL__", jsMessageLiteral("preview.glyph.loadingOpenType"))
            .replace("__TEXT_OPENTYPE_UNAVAILABLE_LITERAL__", jsMessageLiteral("preview.glyph.openTypeUnavailable"))
            .replace("__TEXT_PARSING_FONT_BYTES_LITERAL__", jsMessageLiteral("preview.glyph.parsing"))
            .replace("__TEXT_SHOWING_GLYPH_INDEX_LITERAL__", jsMessageLiteral("preview.glyph.showing"))
            .replace("__TEXT_UNABLE_TO_PARSE_FONT_LITERAL__", jsMessageLiteral("preview.glyph.unableToParse"))
            .replace("__TEXT_GLYPH_SEARCH_NO_RESULTS_LITERAL__", jsMessageLiteral("preview.glyph.searchNoResults"))
            .replace("__TEXT_GLYPH_FILTER_PRESET_PLACEHOLDER_LITERAL__", jsMessageLiteral("preview.glyph.filterPreset.placeholder"))
            .replace("__TEXT_GLYPH_FILTER_INVALID_RANGE_LITERAL__", jsMessageLiteral("preview.glyph.filterCustom.invalidRange"))
            .replace("__TEXT_PUA_HINT_LITERAL__", jsMessageLiteral("preview.pua.hint"))
            .replace("__TEXT_GLYPH_FILTER_PUA_LABEL_LITERAL__", jsMessageLiteral("preview.glyph.filterPua.label"))
            .replace("__TEXT_METADATA_EMPTY_LITERAL__", jsMessageLiteral("preview.metadata.empty"))
            .replace("__TEXT_METADATA_COPY_LITERAL__", jsMessageLiteral("preview.metadata.copy"))
            .replace("__TEXT_METADATA_COPY_ALL_LITERAL__", jsMessageLiteral("preview.metadata.copyAll"))
            .replace("__TEXT_METADATA_COPIED_LITERAL__", jsMessageLiteral("preview.metadata.copied"))
            .replace("__TEXT_METADATA_COPY_FAILED_LITERAL__", jsMessageLiteral("preview.metadata.copyFailed"))
            .replace("__TEXT_GLYPH_DETAIL_TITLE_LITERAL__", jsMessageLiteral("preview.glyph.detail.title"))
            .replace("__TEXT_GLYPH_DETAIL_CLOSE_LITERAL__", jsMessageLiteral("preview.glyph.detail.close"))
            .replace("__TEXT_GLYPH_DETAIL_COPY_TEXT_LITERAL__", jsMessageLiteral("preview.glyph.detail.copyText"))
            .replace("__TEXT_GLYPH_DETAIL_COPY_SVG_LITERAL__", jsMessageLiteral("preview.glyph.detail.copySvg"))
            .replace("__TEXT_GLYPH_DETAIL_COPIED_LITERAL__", jsMessageLiteral("preview.glyph.detail.copied"))
            .replace("__TEXT_GLYPH_DETAIL_COPY_FAILED_LITERAL__", jsMessageLiteral("preview.glyph.detail.copyFailed"))
            .replace("__TEXT_FEATURES_LOADING_LITERAL__", jsMessageLiteral("preview.features.loading"))
            .replace("__TEXT_FEATURES_EMPTY_LITERAL__", jsMessageLiteral("preview.features.empty"))
            .replace("__TEXT_FEATURES_UNAVAILABLE_LITERAL__", jsMessageLiteral("preview.features.unavailable"))
            .replace("__TEXT_PLAYGROUND_DEFAULT_LITERAL__", jsMessageLiteral("preview.playground.default"))

        return htmlTemplate
            .replace("__FONT_DATA_URL__", StringUtil.escapeXmlEntities(fontDataUrl))
            .replace("__FONT_CSS_FORMAT__", fontType.toCssFormat())
            .replace("__INITIAL_THEME__", if (isDarkTheme) "dark" else "light")
            .replace("__CSS__", css)
            .replace("__JS__", js)
            .replace("__PREVIEW_TITLE__", StringUtil.escapeXmlEntities(previewTitle))
            .replace("__FILE_EXTENSION__", StringUtil.escapeXmlEntities(fileExtension))
            .replace("__DEFAULT_PREVIEW_TEXT__", StringUtil.escapeXmlEntities(DEFAULT_PREVIEW_TEXT))
            .replace("__SIZE_ROWS__", buildSizeRows())
            .replace("__TEXT_SUBTITLE__", xmlMessage("preview.subtitle"))
            .replace("__TEXT_CUSTOM_PREVIEW_LABEL__", xmlMessage("preview.controls.label"))
            .replace("__TEXT_CUSTOM_PREVIEW_PLACEHOLDER__", xmlMessage("preview.controls.placeholder"))
            .replace("__TEXT_CUSTOM_PREVIEW_HINT__", xmlMessage("preview.controls.hint"))
            .replace("__TEXT_UNICODE_HINT__", xmlMessage("preview.controls.unicodeHint"))
            .replace("__TAB_OVERVIEW__", xmlMessage("preview.tab.overview"))
            .replace("__TAB_GLYPH_INDEX__", xmlMessage("preview.tab.glyphIndex"))
            .replace("__TAB_PLAYGROUND__", xmlMessage("preview.tab.playground"))
            .replace("__TAB_METADATA__", xmlMessage("preview.tab.metadata"))
            .replace("__TEXT_HEADLINE__", xmlMessage("preview.section.headline"))
            .replace("__TEXT_PARAGRAPH__", xmlMessage("preview.section.paragraph"))
            .replace("__TEXT_GLYPH_SET__", xmlMessage("preview.section.glyphSet"))
            .replace("__TEXT_SIZE_SCALE__", xmlMessage("preview.section.sizeScale"))
            .replace("__TEXT_FOOTER__", xmlMessage("preview.footer"))
            .replace("__TEXT_GLYPH_INDEX_TITLE__", xmlMessage("preview.glyph.title"))
            .replace("__TEXT_GLYPH_LOADING__", xmlMessage("preview.glyph.loading"))
            .replace("__TEXT_GLYPH_FILTER_MODE_NONE__", xmlMessage("preview.glyph.filterMode"))
            .replace("__TEXT_GLYPH_FILTER_MODE_UNICODE_BLOCK__", xmlMessage("preview.glyph.filterMode.unicodeBlock"))
            .replace("__TEXT_GLYPH_FILTER_MODE_PUA__", xmlMessage("preview.glyph.filterMode.pua"))
            .replace("__TEXT_GLYPH_FILTER_MODE_CUSTOM_RANGE__", xmlMessage("preview.glyph.filterMode.customRange"))
            .replace("__TEXT_GLYPH_FILTER_MODE_EXACT_UNICODE__", xmlMessage("preview.glyph.filterMode.exactUnicode"))
            .replace("__TEXT_GLYPH_FILTER_CUSTOM_START__", xmlMessage("preview.glyph.filterCustom.startPlaceholder"))
            .replace("__TEXT_GLYPH_FILTER_CUSTOM_END__", xmlMessage("preview.glyph.filterCustom.endPlaceholder"))
            .replace("__TEXT_GLYPH_SEARCH_PLACEHOLDER__", xmlMessage("preview.glyph.searchPlaceholder"))
            .replace("__TEXT_METADATA_TITLE__", xmlMessage("preview.metadata.title"))
            .replace("__TEXT_METADATA_HINT__", xmlMessage("preview.metadata.hint"))
            .replace("__TEXT_METADATA_EMPTY__", xmlMessage("preview.metadata.empty"))
            .replace("__TEXT_METADATA_COPY_ALL__", xmlMessage("preview.metadata.copyAll"))
            .replace("__TEXT_PREVIOUS__", xmlMessage("preview.action.previous"))
            .replace("__TEXT_NEXT__", xmlMessage("preview.action.next"))
            .replace("__TEXT_GLYPH_DETAIL_TITLE__", xmlMessage("preview.glyph.detail.title"))
            .replace("__TEXT_GLYPH_DETAIL_CLOSE__", xmlMessage("preview.glyph.detail.close"))
            .replace("__TEXT_GLYPH_DETAIL_COPY_TEXT__", xmlMessage("preview.glyph.detail.copyText"))
            .replace("__TEXT_GLYPH_DETAIL_COPY_SVG__", xmlMessage("preview.glyph.detail.copySvg"))
            .replace("__TEXT_FEATURES_TITLE__", xmlMessage("preview.features.title"))
            .replace("__TEXT_FEATURES_HINT__", xmlMessage("preview.features.hint"))
            .replace("__TEXT_FEATURES_RESET__", xmlMessage("preview.features.reset"))
            .replace("__TEXT_PROPERTIES_TITLE__", xmlMessage("preview.properties.title"))
            .replace("__TEXT_PROPERTY_FONT_SIZE__", xmlMessage("preview.property.fontSize"))
            .replace("__TEXT_PROPERTY_LINE_HEIGHT__", xmlMessage("preview.property.lineHeight"))
            .replace("__TEXT_PROPERTY_LETTER_SPACING__", xmlMessage("preview.property.letterSpacing"))
            .replace("__TEXT_PLAYGROUND_PLACEHOLDER__", xmlMessage("preview.playground.placeholder"))
            .replace("__TEXT_PLAYGROUND_DEFAULT__", xmlMessage("preview.playground.default"))
    }

    private fun metadataEntriesAsJsLiteral(entries: List<FontMetadataParser.MetadataEntry>): String {
        if (entries.isEmpty()) {
            return "[]"
        }
        return entries.joinToString(prefix = "[", postfix = "]", separator = ",") { entry ->
            val label = runCatching {
                MyMessageBundle.message("preview.metadata.key.${entry.key}")
            }.getOrElse {
                entry.key
            }
            "{label:${jsStringLiteral(label)},value:${jsStringLiteral(entry.value)}}"
        }
    }

    private fun buildSizeRows(): String {
        return listOf(72, 48, 32, 24, 18)
            .joinToString(separator = "\n") { size ->
                """
                    <div class="size-row">
                        <div class="size-label">${size}px</div>
                        <div class="sample-font" data-preview-target="true" style="font-size: ${size}px; line-height: 1.15;">$DEFAULT_PREVIEW_TEXT</div>
                    </div>
                """.trimIndent()
            }
    }

    private fun defaultPreviewTextAsJsLiteral(): String {
        return "'" + DEFAULT_PREVIEW_TEXT
            .replace("\\", "\\\\")
            .replace("'", "\\'")
            .replace("\n", "\\n") + "'"
    }

    private fun jsStringLiteral(value: String): String {
        return "'" + value
            .replace("\\", "\\\\")
            .replace("'", "\\'")
            .replace("\n", "\\n") + "'"
    }

    private fun xmlMessage(key: String): String {
        return StringUtil.escapeXmlEntities(MyMessageBundle.message(key))
    }

    private fun jsMessageLiteral(key: String): String {
        return jsStringLiteral(MyMessageBundle.message(key))
    }

    private fun MyFileType.toCssFormat(): String = when (this) {
        MyFileType.TTF -> "truetype"
        MyFileType.OTF -> "opentype"
        MyFileType.WOFF -> "woff"
        MyFileType.WOFF2 -> "woff2"
    }

    private fun readResource(path: String): String {
        val stream: InputStream = FontPreviewHtmlBuilder::class.java.getResourceAsStream(path)
            ?: error("Missing resource: $path")
        return stream.bufferedReader(Charsets.UTF_8).use { it.readText() }
    }

    private val cssTemplate: String by lazy {
        readResource("/preview/font-preview.css")
    }

    private val htmlTemplate: String by lazy {
        readResource("/preview/font-preview.html")
    }

    private val jsTemplate: String by lazy {
        readResource("/preview/font-preview.js")
    }

    private const val DEFAULT_PREVIEW_TEXT = "Sphinx of black quartz, judge my vow."
}

