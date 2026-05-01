package cn.itscloudy.fontviewer

import com.intellij.ide.plugins.PluginManager
import com.intellij.openapi.extensions.PluginDescriptor


object PluginInfo {

    @JvmStatic
    val descriptor: PluginDescriptor by lazy {
        PluginManager.getPluginByClass(this.javaClass)
            ?: throw RuntimeException("Unable to get plugin descriptor")
    }

}