package cn.itscloudy.fontviewer.editor

import cn.itscloudy.fontviewer.MyFileType
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.nio.charset.StandardCharsets
import java.util.zip.InflaterInputStream

object FontMetadataParser {

    data class MetadataEntry(
        val key: String,
        val value: String,
    )

    data class ParsedMetadata(
        val fullFontName: String?,
        val entries: List<MetadataEntry>,
    )

    fun parse(fontType: MyFileType, fontBytes: ByteArray): ParsedMetadata {
        val nameTable = readNameTable(fontType, fontBytes)
        if (nameTable.isEmpty()) {
            return ParsedMetadata(fullFontName = null, entries = emptyList())
        }

        val namesById = parseNameTable(nameTable)
        val entries = NAME_IDS_TO_KEYS.mapNotNull { (nameId, key) ->
            namesById[nameId]?.takeIf { it.isNotBlank() }?.let { value ->
                MetadataEntry(key = key, value = value)
            }
        }

        return ParsedMetadata(
            fullFontName = namesById[NAME_ID_FULL_NAME],
            entries = entries,
        )
    }

    private fun readNameTable(fontType: MyFileType, fontBytes: ByteArray): ByteArray {
        return when (fontType) {
            MyFileType.TTF,
            MyFileType.OTF,
            -> readSfntNameTable(fontBytes)
            MyFileType.WOFF -> readWoffNameTable(fontBytes)
            MyFileType.WOFF2 -> ByteArray(0)
        }
    }

    private fun readSfntNameTable(fontBytes: ByteArray): ByteArray {
        if (fontBytes.size < 12) {
            return ByteArray(0)
        }

        val numTables = readUInt16(fontBytes, 4)
        for (index in 0 until numTables) {
            val recordOffset = 12 + index * 16
            if (recordOffset + 16 > fontBytes.size) {
                break
            }

            val tag = readTag(fontBytes, recordOffset)
            if (tag != NAME_TABLE_TAG) {
                continue
            }

            val offset = readUInt32(fontBytes, recordOffset + 8)
            val length = readUInt32(fontBytes, recordOffset + 12)
            if (!isValidRange(offset, length, fontBytes.size)) {
                return ByteArray(0)
            }

            return fontBytes.copyOfRange(offset, offset + length)
        }

        return ByteArray(0)
    }

    private fun readWoffNameTable(fontBytes: ByteArray): ByteArray {
        if (fontBytes.size < 44 || readTag(fontBytes, 0) != "wOFF") {
            return ByteArray(0)
        }

        val numTables = readUInt16(fontBytes, 12)
        for (index in 0 until numTables) {
            val entryOffset = 44 + index * 20
            if (entryOffset + 20 > fontBytes.size) {
                break
            }

            val tag = readTag(fontBytes, entryOffset)
            if (tag != NAME_TABLE_TAG) {
                continue
            }

            val offset = readUInt32(fontBytes, entryOffset + 4)
            val compressedLength = readUInt32(fontBytes, entryOffset + 8)
            val originalLength = readUInt32(fontBytes, entryOffset + 12)
            if (!isValidRange(offset, compressedLength, fontBytes.size)) {
                return ByteArray(0)
            }

            val tableBytes = fontBytes.copyOfRange(offset, offset + compressedLength)
            return if (compressedLength == originalLength) {
                tableBytes
            } else {
                inflateWoffTable(tableBytes, originalLength)
            }
        }

        return ByteArray(0)
    }

    private fun inflateWoffTable(compressedBytes: ByteArray, expectedSize: Int): ByteArray {
        val output = ByteArrayOutputStream(expectedSize.coerceAtLeast(256))
        InflaterInputStream(ByteArrayInputStream(compressedBytes)).use { stream ->
            stream.copyTo(output)
        }
        return output.toByteArray()
    }

    private fun parseNameTable(nameTable: ByteArray): Map<Int, String> {
        if (nameTable.size < 6) {
            return emptyMap()
        }

        val count = readUInt16(nameTable, 2)
        val stringStorageOffset = readUInt16(nameTable, 4)
        val selected = mutableMapOf<Int, ScoredName>()

        for (index in 0 until count) {
            val recordOffset = 6 + index * 12
            if (recordOffset + 12 > nameTable.size) {
                break
            }

            val record = NameRecord(
                platformId = readUInt16(nameTable, recordOffset),
                encodingId = readUInt16(nameTable, recordOffset + 2),
                languageId = readUInt16(nameTable, recordOffset + 4),
                nameId = readUInt16(nameTable, recordOffset + 6),
                length = readUInt16(nameTable, recordOffset + 8),
                offset = readUInt16(nameTable, recordOffset + 10),
            )

            val stringOffset = stringStorageOffset + record.offset
            if (!isValidRange(stringOffset, record.length, nameTable.size)) {
                continue
            }

            val raw = nameTable.copyOfRange(stringOffset, stringOffset + record.length)
            val decoded = decodeName(record, raw)
                .replace('\u0000', ' ')
                .trim()
                .replace(Regex("\\s+"), " ")
            if (decoded.isBlank()) {
                continue
            }

            val score = record.score()
            val current = selected[record.nameId]
            if (current == null || score > current.score) {
                selected[record.nameId] = ScoredName(decoded, score)
            }
        }

        return selected.mapValues { it.value.value }
    }

    private fun decodeName(record: NameRecord, raw: ByteArray): String {
        return when (record.platformId) {
            0, 3 -> String(raw, Charsets.UTF_16BE)
            1 -> String(raw, StandardCharsets.ISO_8859_1)
            else -> String(raw, Charsets.UTF_8)
        }
    }

    private fun readTag(bytes: ByteArray, offset: Int): String {
        if (offset + 4 > bytes.size) {
            return ""
        }
        return String(bytes, offset, 4, Charsets.US_ASCII)
    }

    private fun readUInt16(bytes: ByteArray, offset: Int): Int {
        if (offset + 2 > bytes.size) {
            return 0
        }
        return ((bytes[offset].toInt() and 0xFF) shl 8) or (bytes[offset + 1].toInt() and 0xFF)
    }

    private fun readUInt32(bytes: ByteArray, offset: Int): Int {
        if (offset + 4 > bytes.size) {
            return 0
        }
        return ((bytes[offset].toInt() and 0xFF) shl 24) or
            ((bytes[offset + 1].toInt() and 0xFF) shl 16) or
            ((bytes[offset + 2].toInt() and 0xFF) shl 8) or
            (bytes[offset + 3].toInt() and 0xFF)
    }

    private fun isValidRange(offset: Int, length: Int, totalSize: Int): Boolean {
        if (offset < 0 || length <= 0) {
            return false
        }
        val end = offset.toLong() + length.toLong()
        return end <= totalSize.toLong()
    }

    private data class NameRecord(
        val platformId: Int,
        val encodingId: Int,
        val languageId: Int,
        val nameId: Int,
        val length: Int,
        val offset: Int,
    ) {
        fun score(): Int {
            val platformScore = when {
                platformId == 3 && (encodingId == 10 || encodingId == 1 || encodingId == 0) -> 400
                platformId == 0 -> 300
                platformId == 1 -> 200
                else -> 100
            }
            val languageScore = when {
                platformId == 3 && languageId == 0x0409 -> 80
                platformId == 1 && languageId == 0 -> 50
                languageId == 0 -> 30
                else -> 0
            }
            return platformScore + languageScore
        }
    }

    private data class ScoredName(
        val value: String,
        val score: Int,
    )

    private const val NAME_TABLE_TAG = "name"
    private const val NAME_ID_FULL_NAME = 4

    private val NAME_IDS_TO_KEYS = listOf(
        4 to "fullName",
        1 to "familyName",
        2 to "subfamilyName",
        16 to "typographicFamily",
        17 to "typographicSubfamily",
        6 to "postScriptName",
        5 to "version",
        3 to "uniqueId",
        8 to "manufacturer",
        9 to "designer",
        11 to "vendorUrl",
        12 to "designerUrl",
        13 to "license",
        14 to "licenseUrl",
        0 to "copyright",
        10 to "description",
        7 to "trademark",
    )
}

