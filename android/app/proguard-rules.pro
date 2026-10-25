# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Uncomment this to preserve the line number information for
# debugging stack traces.
#-keepattributes SourceFile,LineNumberTable

# If you keep the line number information, uncomment this to
# hide the original source file name.
#-renamesourcefileattribute SourceFile

# ---- Chompbook: release builds are shrunk by R8 (0.13.0) ----
# Capacitor finds plugins and their methods by reflection; the Capacitor and plugin
# libraries ship consumer rules, and these keep rules add a safety margin for every
# plugin the app uses (official, community, secure storage, social login, Ionic libs).
# Everything else (AndroidX, Kotlin, Play services, OkHttp…) is shrunk normally.
-keep class com.getcapacitor.** { *; }
-keep class com.capacitorjs.plugins.** { *; }
-keep class com.getcapacitor.community.** { *; }
-keep class com.aparajita.capacitor.** { *; }
-keep class ee.forgr.capacitor.** { *; }
-keep class io.ionic.libs.** { *; }
-keep class io.github.helgurkonungson.pes.** { *; }
-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod,JavascriptInterface
-keepclassmembers class * { @android.webkit.JavascriptInterface <methods>; }
-dontwarn org.apache.cordova.**
