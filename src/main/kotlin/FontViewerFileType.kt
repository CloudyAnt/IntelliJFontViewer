package cn.itscloudy.fontviewer

import com.intellij.openapi.fileTypes.FileType
import com.intellij.openapi.vfs.VirtualFile
import javax.swing.Icon

object FontViewerFileType : FileType {
    override fun getName(): String = "FontViewerFont"

    override fun getDescription(): String = MyMessageBundle.message("filetype.font.description")

    override fun getDefaultExtension(): String = "ttf"

    override fun getIcon(): Icon = MyIcons.font

    override fun isBinary(): Boolean = true

    override fun isReadOnly(): Boolean = true

    override fun getCharset(file: VirtualFile, content: ByteArray): String? = null
}


