package cn.itscloudy.fontviewer

enum class MyFileType {
    TTF,
    OTF,
    WOFF,
    WOFF2,
    ;

    companion object {
        @JvmStatic
        fun fromFileName(fileName: String): MyFileType? {
            val extension = fileName.substringAfterLast('.', "").lowercase()
            return when (extension) {
                "ttf" -> TTF
                "otf" -> OTF
                "woff" -> WOFF
                "woff2" -> WOFF2
                else -> null
            }
        }
    }
}