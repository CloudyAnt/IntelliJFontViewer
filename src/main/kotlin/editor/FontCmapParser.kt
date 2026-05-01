package cn.itscloudy.fontviewer.editor

import cn.itscloudy.fontviewer.MyFileType
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.util.zip.InflaterInputStream

object FontCmapParser {

    fun extractMappedPuaCodePoints(fontType: MyFileType, fontBytes: ByteArray): List<Int>? {
        return runCatching {
            when (fontType) {
                MyFileType.TTF,
                MyFileType.OTF,
                MyFileType.WOFF,
                -> parseCmapMappedPua(fontType, fontBytes)
                MyFileType.WOFF2 -> null
            }
        }.getOrNull()
    }

    private fun parseCmapMappedPua(fontType: MyFileType, fontBytes: ByteArray): List<Int>? {
        val cmapTable = when (fontType) {
            MyFileType.TTF,
            MyFileType.OTF,
            -> readSfntCmapTable(fontBytes)
            MyFileType.WOFF -> readWoffCmapTable(fontBytes)
            MyFileType.WOFF2 -> ByteArray(0)
        }

        if (cmapTable.isEmpty()) {
            return null
        }

        return parseMappedPuaFromCmap(cmapTable)
    }

    private fun readSfntCmapTable(fontBytes: ByteArray): ByteArray {
        if (fontBytes.size < 12) {
            return ByteArray(0)
        }

        val numTables = readUInt16(fontBytes, 4)
        val tableStart = 12
        for (index in 0 until numTables) {
            val recordOffset = tableStart + index * 16
            if (recordOffset + 16 > fontBytes.size) {
                break
            }

            val tag = readTag(fontBytes, recordOffset)
            if (tag != "cmap") {
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

    private fun readWoffCmapTable(fontBytes: ByteArray): ByteArray {
        if (fontBytes.size < 44 || readTag(fontBytes, 0) != "wOFF") {
            return ByteArray(0)
        }

        val numTables = readUInt16(fontBytes, 12)
        val directoryStart = 44
        for (index in 0 until numTables) {
            val entryOffset = directoryStart + index * 20
            if (entryOffset + 20 > fontBytes.size) {
                break
            }

            val tag = readTag(fontBytes, entryOffset)
            if (tag != "cmap") {
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

    private fun parseMappedPuaFromCmap(cmapTable: ByteArray): List<Int> {
        if (cmapTable.size < 4) {
            return emptyList()
        }

        val numTables = readUInt16(cmapTable, 2)
        val records = mutableListOf<CmapRecord>()
        for (index in 0 until numTables) {
            val recordOffset = 4 + index * 8
            if (recordOffset + 8 > cmapTable.size) {
                break
            }
            records += CmapRecord(
                platformId = readUInt16(cmapTable, recordOffset),
                encodingId = readUInt16(cmapTable, recordOffset + 2),
                subtableOffset = readUInt32(cmapTable, recordOffset + 4),
            )
        }

        val sortedRecords = records.sortedByDescending { it.score() }
        for (record in sortedRecords) {
            val subtableOffset = record.subtableOffset
            if (subtableOffset + 2 > cmapTable.size) {
                continue
            }

            val format = readUInt16(cmapTable, subtableOffset)
            val mapped = when (format) {
                4 -> parseFormat4MappedPua(cmapTable, subtableOffset)
                12 -> parseFormat12MappedPua(cmapTable, subtableOffset)
                13 -> parseFormat13MappedPua(cmapTable, subtableOffset)
                else -> emptyList()
            }

            if (mapped.isNotEmpty()) {
                return mapped
            }
        }

        return emptyList()
    }

    private fun parseFormat12MappedPua(bytes: ByteArray, subtableOffset: Int): List<Int> {
        if (subtableOffset + 16 > bytes.size) {
            return emptyList()
        }

        val length = readUInt32(bytes, subtableOffset + 4)
        if (!isValidRange(subtableOffset, length, bytes.size)) {
            return emptyList()
        }

        val groupCount = readUInt32(bytes, subtableOffset + 12)
        val groupsOffset = subtableOffset + 16
        val mapped = mutableListOf<Int>()

        for (index in 0 until groupCount) {
            val groupOffset = groupsOffset + index * 12
            if (groupOffset + 12 > subtableOffset + length) {
                break
            }

            val startCode = readUInt32(bytes, groupOffset)
            val endCode = readUInt32(bytes, groupOffset + 4)
            val startGlyphId = readUInt32(bytes, groupOffset + 8)

            val from = maxOf(startCode, PUA_START)
            val to = minOf(endCode, PUA_END)
            if (from > to) {
                continue
            }

            for (codePoint in from..to) {
                val glyphId = startGlyphId + (codePoint - startCode)
                if (glyphId != 0) {
                    mapped += codePoint
                }
            }
        }

        return mapped
    }

    private fun parseFormat13MappedPua(bytes: ByteArray, subtableOffset: Int): List<Int> {
        if (subtableOffset + 16 > bytes.size) {
            return emptyList()
        }

        val length = readUInt32(bytes, subtableOffset + 4)
        if (!isValidRange(subtableOffset, length, bytes.size)) {
            return emptyList()
        }

        val groupCount = readUInt32(bytes, subtableOffset + 12)
        val groupsOffset = subtableOffset + 16
        val mapped = mutableListOf<Int>()

        for (index in 0 until groupCount) {
            val groupOffset = groupsOffset + index * 12
            if (groupOffset + 12 > subtableOffset + length) {
                break
            }

            val startCode = readUInt32(bytes, groupOffset)
            val endCode = readUInt32(bytes, groupOffset + 4)
            val glyphId = readUInt32(bytes, groupOffset + 8)

            if (glyphId == 0) {
                continue
            }

            val from = maxOf(startCode, PUA_START)
            val to = minOf(endCode, PUA_END)
            if (from > to) {
                continue
            }

            for (codePoint in from..to) {
                mapped += codePoint
            }
        }

        return mapped
    }

    private fun parseFormat4MappedPua(bytes: ByteArray, subtableOffset: Int): List<Int> {
        if (subtableOffset + 16 > bytes.size) {
            return emptyList()
        }

        val length = readUInt16(bytes, subtableOffset + 2)
        if (!isValidRange(subtableOffset, length, bytes.size)) {
            return emptyList()
        }

        val segCount = readUInt16(bytes, subtableOffset + 6) / 2
        if (segCount <= 0) {
            return emptyList()
        }

        val endCodesOffset = subtableOffset + 14
        val startCodesOffset = endCodesOffset + segCount * 2 + 2
        val idDeltasOffset = startCodesOffset + segCount * 2
        val idRangeOffsetsOffset = idDeltasOffset + segCount * 2
        val subtableEnd = subtableOffset + length
        if (idRangeOffsetsOffset + segCount * 2 > subtableEnd) {
            return emptyList()
        }

        val mapped = mutableListOf<Int>()
        for (segIndex in 0 until segCount) {
            val endCode = readUInt16(bytes, endCodesOffset + segIndex * 2)
            val startCode = readUInt16(bytes, startCodesOffset + segIndex * 2)
            if (startCode > endCode) {
                continue
            }

            val from = maxOf(startCode, PUA_START)
            val to = minOf(endCode, PUA_END)
            if (from > to) {
                continue
            }

            val idDelta = readInt16(bytes, idDeltasOffset + segIndex * 2)
            val idRangeOffset = readUInt16(bytes, idRangeOffsetsOffset + segIndex * 2)

            for (codePoint in from..to) {
                val glyphId = if (idRangeOffset == 0) {
                    (codePoint + idDelta) and 0xFFFF
                } else {
                    val glyphIndexAddress =
                        idRangeOffsetsOffset + segIndex * 2 + idRangeOffset + (codePoint - startCode) * 2
                    if (glyphIndexAddress + 2 > subtableEnd) {
                        continue
                    }

                    val glyphIndex = readUInt16(bytes, glyphIndexAddress)
                    if (glyphIndex == 0) {
                        0
                    } else {
                        (glyphIndex + idDelta) and 0xFFFF
                    }
                }

                if (glyphId != 0) {
                    mapped += codePoint
                }
            }
        }

        return mapped
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

    private fun readInt16(bytes: ByteArray, offset: Int): Int {
        return readUInt16(bytes, offset).toShort().toInt()
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

    private const val PUA_START = 0xE000
    private const val PUA_END = 0xF8FF

    private data class CmapRecord(
        val platformId: Int,
        val encodingId: Int,
        val subtableOffset: Int,
    ) {
        fun score(): Int {
            return when {
                platformId == 3 && encodingId == 10 -> 400
                platformId == 3 && encodingId == 1 -> 300
                platformId == 0 -> 200
                else -> 0
            }
        }
    }
}

