package cn.itscloudy.fontviewer

import com.intellij.AbstractBundle
import org.jetbrains.annotations.Nls
import java.util.function.Supplier

object MyMessageBundle : AbstractBundle("messages.MyMessageBundle") {

    @JvmStatic
    fun message(key: String, vararg params: Any?): @Nls String {
        return getMessage(key, *params)
    }

    @JvmStatic
    fun lazyMessage(key: String, vararg params: Any?): Supplier<@Nls String> {
        return getLazyMessage(key, *params)
    }

}