package cn.itscloudy.fontviewer

import com.intellij.AbstractBundle
import org.jetbrains.annotations.Nls

object MyMessageBundle : AbstractBundle("messages.MyMessageBundle") {

    @JvmStatic
    fun message(key: String, vararg params: Any?): @Nls String {
        return getMessage(key, *params)
    }

}