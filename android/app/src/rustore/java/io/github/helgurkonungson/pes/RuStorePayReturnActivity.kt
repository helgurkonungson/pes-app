package io.github.helgurkonungson.pes

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import ru.rustore.sdk.pay.RuStorePayClient

/**
 * RuStore build (ADR-042): bank apps (SBP, SberPay, T-Pay) return to the app through the
 * `online.chompbook.app.rustorepay` scheme after a payment. This invisible screen hands the link to
 * RuStore Pay, which finishes the payment, and closes; the learner is back on the Pro screen.
 * A separate activity keeps these links away from MainActivity's own deep links (OAuth).
 */
class RuStorePayReturnActivity : Activity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        if (savedInstanceState == null) RuStorePayClient.instance.getIntentInteractor().proceedIntent(intent)
        finish()
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        RuStorePayClient.instance.getIntentInteractor().proceedIntent(intent)
        finish()
    }
}
