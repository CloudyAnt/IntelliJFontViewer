package cn.itscloudy.fontviewer.editor

import cn.itscloudy.fontviewer.MyFileType
import cn.itscloudy.fontviewer.MyMessageBundle
import com.intellij.openapi.components.Service
import com.intellij.openapi.project.Project
import com.intellij.openapi.vfs.VirtualFile
import java.util.Base64

@Service(Service.Level.PROJECT)
class HtmlEditorHelper(val project: Project) {

	fun buildFontPreviewHtml(file: VirtualFile, isDarkTheme: Boolean): String {
		val fontType = requireNotNull(MyFileType.fromFileName(file.name)) {
			"Unsupported font file: ${file.name}"
		}
		val fontBytes = file.contentsToByteArray()
		val encodedBytes = Base64.getEncoder().encodeToString(fontBytes)
		val mappedPuaCodePoints = FontCmapParser.extractMappedPuaCodePoints(fontType, fontBytes)
		val mappedPuaCodePointsLiteral = mappedPuaCodePoints?.toJsIntArrayLiteral() ?: "null"
		val parsedMetadata = FontMetadataParser.parse(fontType, fontBytes)
		val fontDataUrl = "data:${fontType.toMimeType()};base64,$encodedBytes"
		val previewTitle = parsedMetadata.fullFontName?.takeIf { it.isNotBlank() }
			?: MyMessageBundle.message("preview.title.unknown")
		val fileExtension = file.extension?.uppercase() ?: fontType.name

		return FontPreviewHtmlBuilder.build(
			fontType = fontType,
			fontDataUrl = fontDataUrl,
			previewTitle = previewTitle,
			fileExtension = fileExtension,
			metadataEntries = parsedMetadata.entries,
			mappedPuaCodePointsLiteral = mappedPuaCodePointsLiteral,
			isDarkTheme = isDarkTheme,
		)
	}

	private fun List<Int>.toJsIntArrayLiteral(): String {
		if (isEmpty()) {
			return "[]"
		}
		return joinToString(prefix = "[", postfix = "]", separator = ",")
	}

	private fun MyFileType.toMimeType(): String = when (this) {
		MyFileType.TTF -> "font/ttf"
		MyFileType.OTF -> "font/otf"
		MyFileType.WOFF -> "font/woff"
		MyFileType.WOFF2 -> "font/woff2"
	}
}