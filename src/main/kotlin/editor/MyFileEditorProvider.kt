package cn.itscloudy.fontviewer.editor

import cn.itscloudy.fontviewer.MyFileType
import com.intellij.openapi.fileEditor.FileEditor
import com.intellij.openapi.fileEditor.FileEditorPolicy
import com.intellij.openapi.fileEditor.FileEditorProvider
import com.intellij.openapi.project.DumbAware
import com.intellij.openapi.project.Project
import com.intellij.openapi.vfs.VirtualFile
import org.jetbrains.annotations.NonNls

class MyFileEditorProvider : FileEditorProvider, DumbAware {
    override fun accept(
        project: Project,
        file: VirtualFile
    ): Boolean {
        return MyFileType.fromFileName(file.name) != null
    }

    override fun createEditor(
        project: Project,
        virtualFile: VirtualFile
    ): FileEditor {
        requireNotNull(MyFileType.fromFileName(virtualFile.name)) {
            "Unsupported file type for preview: ${virtualFile.name}"
        }
        return FontPreviewFileEditor(project, virtualFile)
    }

    override fun getEditorTypeId(): @NonNls String {
        return "fontviewer.preview.editor"
    }

    override fun getPolicy(): FileEditorPolicy {
        return FileEditorPolicy.HIDE_DEFAULT_EDITOR
    }
}