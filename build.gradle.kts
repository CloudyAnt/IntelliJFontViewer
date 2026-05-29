plugins {
    id("java")
    alias(libs.plugins.kotlin)
    alias(libs.plugins.intellijPlatform)
}

// Read plugin metadata from gradle.properties file
val pluginGroup: String by project
val pluginVersion: String by project

group = pluginGroup
version = pluginVersion

// Set the JVM language level used to build the project.
kotlin {
    jvmToolchain(21)
}

repositories {
    mavenCentral()
    intellijPlatform {
        defaultRepositories()
    }
}

// Read more: https://plugins.jetbrains.com/docs/intellij/tools-intellij-platform-gradle-plugin.html
dependencies {
    intellijPlatform {
        intellijIdea(providers.gradleProperty("platformVersion"))
        testFramework(org.jetbrains.intellij.platform.gradle.TestFrameworkType.Platform)

        // Add plugin dependencies for compilation here, for example:
        // bundledPlugin("com.intellij.java")

    }
}

intellijPlatform {
    pluginConfiguration {
        ideaVersion {
            sinceBuild = providers.gradleProperty("pluginSinceBuild")
        }

        changeNotes = """
            <b>0.0.1</b> Initial version. Contains Overview, PUA, GlyphIndex and Metadata tabs.<br>
            <b>0.1.0</b> Add Playground tab to preview OpenType features and test custom text input.<br>
            <b>0.1.1</b> Fix a little compatible problem.
        """.trimIndent()
    }
}

tasks {
    wrapper {
        gradleVersion = providers.gradleProperty("gradleVersion").get()
    }
}
