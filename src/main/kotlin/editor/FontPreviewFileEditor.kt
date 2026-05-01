package cn.itscloudy.fontviewer.editor

import cn.itscloudy.fontviewer.MyMessageBundle
import com.intellij.ide.ui.LafManager
import com.intellij.ide.ui.LafManagerListener
import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.fileEditor.FileEditor
import com.intellij.openapi.fileEditor.FileEditorLocation
import com.intellij.openapi.fileEditor.FileEditorState
import com.intellij.openapi.project.Project
import com.intellij.openapi.util.Disposer
import com.intellij.openapi.util.UserDataHolderBase
import com.intellij.openapi.vfs.VirtualFile
import com.intellij.ui.components.JBScrollPane
import com.intellij.ui.jcef.JBCefApp
import com.intellij.ui.jcef.JBCefBrowser
import java.awt.BorderLayout
import java.beans.PropertyChangeListener
import javax.swing.JComponent
import javax.swing.JPanel
import javax.swing.JTextArea

class FontPreviewFileEditor(
    project: Project,
    private val file: VirtualFile,
) : UserDataHolderBase(), FileEditor {

    private val htmlEditorHelper = project.getService(HtmlEditorHelper::class.java)
    private val browser = if (JBCefApp.isSupported()) JBCefBrowser() else null
    private val themeChangeConnection = ApplicationManager.getApplication().messageBus.connect()
    private val component: JComponent = browser?.component ?: createFallbackComponent(file)

    init {
        loadPreviewHtml()
        themeChangeConnection.subscribe(LafManagerListener.TOPIC, LafManagerListener {
            applyThemeToPreview()
        })
    }

    override fun getComponent(): JComponent = component

    override fun getPreferredFocusedComponent(): JComponent? = browser?.component

    override fun getName(): String = MyMessageBundle.message("editor.preview.name")

    override fun setState(state: FileEditorState) = Unit

    override fun isModified(): Boolean = false

    override fun isValid(): Boolean = file.isValid

    override fun selectNotify() = Unit

    override fun deselectNotify() = Unit

    override fun addPropertyChangeListener(listener: PropertyChangeListener) = Unit

    override fun removePropertyChangeListener(listener: PropertyChangeListener) = Unit

    override fun getCurrentLocation(): FileEditorLocation? = null

    override fun dispose() {
        themeChangeConnection.disconnect()
        browser?.let(Disposer::dispose)
    }

    override fun getFile(): VirtualFile {
        return file
    }

    private fun createFallbackComponent(file: VirtualFile): JComponent {
        val textArea = JTextArea(
            MyMessageBundle.message("editor.preview.fallback.description", file.name),
        ).apply {
            isEditable = false
            lineWrap = true
            wrapStyleWord = true
            border = null
            isOpaque = false
        }

        return JPanel(BorderLayout()).apply {
            add(JBScrollPane(textArea), BorderLayout.CENTER)
        }
    }

    private fun loadPreviewHtml() {
        browser?.loadHTML(htmlEditorHelper.buildFontPreviewHtml(file, isDarkTheme()))
    }

    private fun applyThemeToPreview() {
        val currentBrowser = browser ?: return
        val theme = if (isDarkTheme()) "dark" else "light"
        val script = """
            (function() {
                if (window.__fontViewerApplyTheme) {
                    window.__fontViewerApplyTheme('$theme');
                } else {
                    document.documentElement.setAttribute('data-theme', '$theme');
                }
            })();
        """.trimIndent()
        currentBrowser.cefBrowser.executeJavaScript(script, currentBrowser.cefBrowser.url, 0)
    }

    private fun isDarkTheme(): Boolean = LafManager.getInstance().currentUIThemeLookAndFeel?.isDark ?: false
}

