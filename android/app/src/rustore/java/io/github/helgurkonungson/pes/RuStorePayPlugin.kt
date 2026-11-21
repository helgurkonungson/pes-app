package io.github.helgurkonungson.pes

import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import ru.rustore.sdk.pay.RuStorePayClient
import ru.rustore.sdk.pay.model.ProductId
import ru.rustore.sdk.pay.model.ProductPurchase
import ru.rustore.sdk.pay.model.ProductPurchaseParams
import ru.rustore.sdk.pay.model.PurchaseAvailabilityResult
import ru.rustore.sdk.pay.model.SubscriptionPurchase

/**
 * Chompbook Pro in the RuStore build (ADR-042): RuStore Pay SDK. RevenueCat doesn't support RuStore,
 * so the web layer (src/pro/purchases.ts) reads products and purchases here and the Pro server
 * checks the subscription with RuStore by its purchase id.
 *
 * The SDK finds the app by `console_app_id_value` in the manifest (src/rustore/AndroidManifest.xml);
 * bank apps (SBP, SberPay, T-Pay) return through RuStorePayReturnActivity.
 */
@CapacitorPlugin(name = "RuStorePay")
class RuStorePayPlugin : Plugin() {

    private val client get() = RuStorePayClient.instance

    @PluginMethod
    fun availability(call: PluginCall) {
        client.getPurchaseInteractor().getPurchaseAvailability()
            .addOnSuccessListener { result ->
                val ret = JSObject()
                when (result) {
                    is PurchaseAvailabilityResult.Available -> ret.put("available", true)
                    is PurchaseAvailabilityResult.Unavailable -> {
                        ret.put("available", false)
                        ret.put("reason", result.cause?.message ?: "unavailable")
                    }
                    else -> ret.put("available", false)
                }
                call.resolve(ret)
            }
            .addOnFailureListener { e -> call.reject(e.message ?: "availability failed", e.javaClass.simpleName, e as? Exception) }
    }

    @PluginMethod
    fun getProducts(call: PluginCall) {
        val ids = call.getArray("ids")?.toList<String>().orEmpty().filter { it.isNotBlank() }
        if (ids.isEmpty()) {
            call.reject("ids are required")
            return
        }
        client.getProductInteractor().getProducts(productsId = ids.map { ProductId(it) })
            .addOnSuccessListener { products ->
                val list = JSArray()
                for (p in products) {
                    val o = JSObject()
                    o.put("productId", p.productId.value)
                    o.put("type", p.type.toString())
                    o.put("amountLabel", p.amountLabel?.value)
                    p.price?.value?.let { o.put("price", it) }
                    p.currency?.value?.let { o.put("currency", it) }
                    p.title?.value?.let { o.put("title", it) }
                    periods(p).forEach { (kind, duration) ->
                        if (kind == "MainPeriod") o.put("mainPeriod", duration)
                        if (kind == "TrialPeriod") o.put("trialPeriod", duration)
                    }
                    list.put(o)
                }
                val ret = JSObject()
                ret.put("products", list)
                call.resolve(ret)
            }
            .addOnFailureListener { e -> call.reject(e.message ?: "getProducts failed", e.javaClass.simpleName, e as? Exception) }
    }

    @PluginMethod
    fun getPurchases(call: PluginCall) {
        client.getPurchaseInteractor().getPurchases()
            .addOnSuccessListener { purchases ->
                val list = JSArray()
                for (p in purchases) {
                    val o = JSObject()
                    o.put("purchaseId", p.purchaseId.value)
                    o.put("status", p.status.toString())
                    p.purchaseTime?.let { o.put("purchaseTime", it.time) }
                    when (p) {
                        is SubscriptionPurchase -> {
                            o.put("kind", "SUBSCRIPTION")
                            o.put("productId", p.productId.value)
                            p.expirationDate?.let { o.put("expirationDate", it.time) }
                        }
                        is ProductPurchase -> {
                            o.put("kind", "PRODUCT")
                            o.put("productId", p.productId.value)
                        }
                        else -> o.put("kind", "OTHER")
                    }
                    list.put(o)
                }
                val ret = JSObject()
                ret.put("purchases", list)
                call.resolve(ret)
            }
            .addOnFailureListener { e -> call.reject(e.message ?: "getPurchases failed", e.javaClass.simpleName, e as? Exception) }
    }

    @PluginMethod
    fun purchase(call: PluginCall) {
        val productId = call.getString("productId")
        if (productId.isNullOrBlank()) {
            call.reject("productId is required")
            return
        }
        client.getPurchaseInteractor().purchase(ProductPurchaseParams(productId = ProductId(productId)))
            .addOnSuccessListener { r ->
                val ret = JSObject()
                ret.put("purchaseId", r.purchaseId?.value)
                ret.put("productId", r.productId?.value)
                ret.put("invoiceId", r.invoiceId?.value)
                call.resolve(ret)
            }
            .addOnFailureListener { e ->
                // RuStorePaymentException.ProductPurchaseCancelled: the learner closed the payment sheet
                val cancelled = e.javaClass.simpleName.contains("Cancel", ignoreCase = true)
                call.reject(e.message ?: "purchase failed", if (cancelled) "cancelled" else e.javaClass.simpleName, e as? Exception)
            }
    }

    /** SDK wrappers expose `value`; plain values pass through. */
    private fun text(v: Any?): String? {
        if (v == null) return null
        if (v is String) return v
        return reflectValue(v)?.toString() ?: v.toString()
    }

    private fun reflectValue(v: Any): Any? =
        try {
            v.javaClass.methods.firstOrNull { it.parameterCount == 0 && (it.name == "getValue" || it.name.startsWith("getValue-")) }?.invoke(v)
        } catch (e: Exception) {
            null
        }

    /**
     * Subscription periods of a product as (class name, ISO 8601 duration): TrialPeriod, PromoPeriod,
     * MainPeriod, GracePeriod, HoldPeriod. Read by reflection so the plugin keeps compiling if the
     * SDK moves these models between versions.
     */
    private fun periods(product: Any): List<Pair<String, String>> =
        try {
            val info = product.javaClass.methods.firstOrNull { it.parameterCount == 0 && it.name.startsWith("getSubscriptionInfo") }?.invoke(product)
            val list = info?.javaClass?.methods?.firstOrNull { it.parameterCount == 0 && it.name.startsWith("getPeriods") }?.invoke(info) as? List<*>
            list.orEmpty().mapNotNull { period ->
                if (period == null) return@mapNotNull null
                val d = period.javaClass.methods.firstOrNull { it.parameterCount == 0 && it.name.startsWith("getDuration") }?.invoke(period)
                val duration = d?.let { text(it) } ?: return@mapNotNull null
                period.javaClass.simpleName to duration
            }
        } catch (e: Exception) {
            emptyList()
        }
}
