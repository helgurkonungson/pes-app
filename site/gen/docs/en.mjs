// Full documents in English — the binding versions for Google Play, the App Store and the GitHub build.
import { SELLER as S } from "../config.mjs";

const who = `${S.en.name}, an ${S.en.kind} (state registration no. ${S.regNo}, taxpayer no. ${S.tin}, address: ${S.en.address})`;
const mail = (a) => `<a href="mailto:${a}">${a}</a>`;

export const privacy = {
  title: "Privacy policy",
  body: `
<p>Chompbook (in Russian: «Грызи») is a learning app made by ${who} ("we", "us"). We are the controller of the personal data described below.</p>
<div class="note"><p><strong>In short:</strong> your learning data stays on your phone. We run no accounts, no analytics and no ads. Text leaves the phone only to go to the AI service <em>you</em> choose (including Chompbook AI if you subscribe to Chompbook Pro), to us when <em>you</em> report a lesson or send an error report, or to a web page <em>you</em> ask the app to read.</p>
<p>This policy covers the app installed from Google Play, the Apple App Store or GitHub, and this website. If you installed the app from RuStore, the <a href="/cis/privacy/">RuStore documents</a> apply instead.</p></div>

<h2>Data kept only on your device</h2>
<ul>
<li>Your skillsets, the books, articles, notes and courses you import, lessons, answers, progress, XP, streaks and badges.</li>
<li>Your name (as you typed it), daily goal, interface language, theme and reminder time.</li>
<li>An age group (under 13, 13–17 or 18+) if you connect an AI service or open Chompbook Pro. The birth year itself is not stored.</li>
<li>AI service keys, kept in the phone's secure storage (Android Keystore / iOS Keychain).</li>
<li>An error log and your lesson reports, until you send or clear them.</li>
<li>Automatic backups in the app's storage and, before updates, in <em>Documents/PES</em> on the phone.</li>
<li>The phone's time zone is read on the device to suggest an AI service that works in your region; it is not sent anywhere.</li>
</ul>
<p>We have no copy of this data and cannot see it.</p>

<h2>AI services you connect</h2>
<p>AI features are optional. If you connect an AI service (for example Google Gemini, Anthropic Claude, OpenAI ChatGPT, Groq, Mistral, OpenRouter, NVIDIA, Yandex Alice AI, Alibaba Qwen, or your own server), the app sends that service, directly from your phone and with your own key: excerpts of your materials, the skillset name and goal, your quiz results and the open answers you ask it to check. The service processes this under its own terms and privacy policy, which you accept when connecting it; for that processing the service, not us, is responsible. On some free tiers the service may use this content to improve its models — the app tells you so before you connect. Do not upload personal or confidential documents.</p>
<p><strong>Google sign-in</strong> (only to create a free Gemini key for you): with your consent the app signs in to your Google account once, creates a "Chompbook" project with a key restricted to the Gemini API, and signs out. The access token, your e-mail address and your name are not stored.</p>
<p><strong>OpenRouter sign-in</strong> (only to get a free OpenRouter key for you): you sign in on openrouter.ai; OpenRouter then sends a one-time code to <code>chompbook.online/oauth/openrouter/</code>, a page that only passes it on to the app on your phone and keeps nothing. The app exchanges the code for your key directly with OpenRouter. We never see your OpenRouter account or key.</p>

<h2>Chompbook Pro and Chompbook AI</h2>
<p>Chompbook Pro is an optional subscription sold inside the app from Google Play and, once released, the App Store. It adds Chompbook AI, an AI service run by us, so you don't need your own key.</p>
<ul>
<li><strong>Payment.</strong> You pay through Google Play or Apple under their terms and privacy policies. We never see your card details, name, e-mail address, Google account or Apple ID. The store gives us the order or transaction number, the plan, the country and currency, the price and the subscription status.</li>
<li><strong>Anonymous ID.</strong> The app creates a random ID (such as <code>$RCAnonymousID:…</code>) that is not linked to your name, e-mail or store account. It identifies your subscription and your daily allowance.</li>
<li><strong>RevenueCat.</strong> We use RevenueCat, Inc. (USA) to confirm purchases with Google Play and the App Store. The app sends RevenueCat the anonymous ID, your purchase records for this app, the app and operating-system version, your locale and currency, and, like any internet request, your IP address. RevenueCat processes this on our behalf (<a href="https://www.revenuecat.com/privacy">its privacy policy</a>). The app does not send it your advertising ID and does not track you across other companies' apps or websites.</li>
<li><strong>Lessons by Chompbook AI.</strong> When Chompbook AI writes a lesson or checks an answer, the app sends our server <code>api.chompbook.online</code> the same lesson content as for any other AI service (see the previous section) with your anonymous ID and whether you said you are 18 or older; for younger learners the server adds safety rules for the AI. The server checks the subscription with RevenueCat and passes the request to OpenRouter, Inc. (USA), which sends it to the company that runs the AI model (currently Anthropic; if it is unavailable, another model host). The answer comes back the same way. Our server does not store or read the content of your lessons, and we don't use it to train AI. OpenRouter is set to use only model providers that do not train on requests.</li>
<li><strong>What our server keeps:</strong> the anonymous ID, whether the subscription is active and until when (a cached answer from RevenueCat), and how many AI tokens you used each day, so the daily fair-use limit can work. We keep no request logs. The server runs on Cloudflare, which processes IP addresses to deliver and protect the service.</li>
</ul>

<h2>Lesson reports and error reports</h2>
<p><strong>Lesson reports.</strong> When you tap the flag to report a lesson, the report contains: the reason you picked, your optional comment, the text that was on the screen, the lesson title, which AI service and model wrote it, and the app version. It is saved on your phone and sent to us when you file it (if there is no connection, the app tries again later); in builds without our report server your mail app opens with a ready e-mail to ${mail(S.support)} instead.</p>
<p><strong>Error reports.</strong> The error log (Settings → Error log) is sent to us when you tap "Send to the developer". Automatic sending is <strong>off by default</strong>; if you turn on "Send error reports automatically", new log entries are sent by themselves, at most once every 10 minutes. An error report contains the log entries (error messages and technical details), the app version, the platform, the interface language and your browser/WebView description, which includes the phone model.</p>
<p>In both cases anything that looks like an API key is removed, on the phone and again on our server. Reports go over HTTPS to <code>chompbook.online/api/report</code>, a server run for us by Cloudflare, Inc.; we store them in a Cloudflare database together with the country the request came from. Your IP address is used only for a moment to limit how many requests one device can send and is not stored. We receive a short notice about each report through Telegram. We use reports only to review content and fix the app. Please don't write personal details in the comment.</p>

<h2>Other network requests</h2>
<ul>
<li><strong>Web pages you add as sources</strong> are downloaded from their sites.</li>
<li><strong>Update check</strong> (only in the version installed from GitHub): once a day the app asks GitHub for the latest release. Versions from the stores are updated by the store.</li>
<li><strong>This website</strong> sets no cookies and uses no analytics. It remembers your language choice only in your browser. Cloudflare serves it and processes IP addresses to deliver and protect it.</li>
<li>Like any internet request, these reveal your IP address to the server you contact.</li>
</ul>

<h2>What we don't do</h2>
<ul>
<li>No user accounts, no tracking, no advertising, no analytics or crash-reporting SDKs. Error reports reach us only as described above.</li>
<li>We don't sell or share your personal information (including in the sense of California law), and we don't use your materials or lessons to train AI.</li>
</ul>

<h2>How long we keep data</h2>
<table>
<tr><th>Data</th><th>Where</th><th>Kept for</th></tr>
<tr><td>Your materials, lessons, progress, keys</td><td>Your phone only</td><td>Until you delete them or the app</td></tr>
<tr><td>Lesson reports and error reports you send</td><td>Our database at Cloudflare</td><td>Up to 12 months, then deleted automatically</td></tr>
<tr><td>Pro: daily usage counts</td><td>Our server</td><td>90 days</td></tr>
<tr><td>Pro: cached subscription status</td><td>Our server</td><td>30 days after you last used Chompbook AI</td></tr>
<tr><td>Purchase records</td><td>RevenueCat, the store</td><td>Under their policies and tax law</td></tr>
</table>

<h2>Why we process data and where</h2>
<p>We process data to provide what you asked for (lessons, AI features, the Pro subscription), to keep the service working and fair (the daily limit, preventing abuse), and to review lesson and error reports you choose to send. Where the GDPR, the UK GDPR or a similar law applies, the legal bases are the performance of our contract with you (Art. 6(1)(b)) and our legitimate interests in a secure and working service (Art. 6(1)(f)). RevenueCat, OpenRouter, Cloudflare and AI model providers may process data in the USA and other countries; where required, transfers rely on safeguards such as the EU Standard Contractual Clauses in their data-processing terms.</p>

<h2>Your choices and rights</h2>
<ul>
<li>Use the app without AI (Settings → Lesson mode → "Always without AI").</li>
<li>Remove an AI key at any time in Settings.</li>
<li>Cancel Chompbook Pro at any time in the store: Google Play → Payments &amp; subscriptions → Subscriptions, or on iPhone Settings → your name → Subscriptions. Deleting the app does not cancel a subscription.</li>
<li>Delete everything on the phone: Settings → Delete all data, or uninstall the app. See <a href="/delete-data/">Delete your data</a>.</li>
<li>Export your data: Settings → Export backup.</li>
<li>Turn automatic error reports on or off at any time: Settings → Error log.</li>
<li>You may ask us for access to, correction or deletion of the data we hold (a lesson or error report you sent, or Pro data on our server), object to processing, or ask for a copy. For Pro data, include your order number (Google Play: starts with <code>GPA.</code>; Apple: from your receipt) so we can find the anonymous ID. We answer within one month. You may also complain to your data-protection authority.</li>
</ul>

<h2>Children</h2>
<p>The app is intended for users aged 13 and over. Users under 13 cannot connect AI services or buy Chompbook Pro; lessons from their own materials work without sending anything. Users aged 13–17 may connect only services that allow their age, with a parent's or guardian's permission where the service requires it; purchases follow the family settings of their Google or Apple account. We do not knowingly collect personal data from children under 13; if you believe we have, write to us and we will delete it.</p>

<h2>Security</h2>
<p>Data in transit is encrypted with HTTPS (except a server address you enter yourself starting with <code>http://</code>, such as a computer on your home network). Keys are kept in the phone's secure storage. Our server's own keys are stored as encrypted secrets at Cloudflare and are never in the app. Access to the report database is limited to the developer.</p>

<h2>Changes</h2>
<p>We will publish any changes on this page and update the date above. For significant changes we will also tell you in the app before they apply.</p>

<h2>Contact</h2>
<p>${who}<br>Privacy questions: ${mail(S.privacy)} · Support: ${mail(S.support)}</p>
<p>See also: <a href="/terms/">Terms of use</a> · <a href="/delete-data/">Delete your data</a> · <a href="/support/">Support</a>.</p>
`,
};

export const terms = {
  title: "Terms of use",
  body: `
<p>These terms apply to the Chompbook app (in Russian: «Грызи») and the Chompbook Pro subscription, provided by ${who} ("we", "us"). By installing or using the app you accept them. The terms of the store you got the app from also apply to the download and to payments (Google Play Terms of Service; for the App Store see the "Apple App Store" section below). How we handle data is described in the <a href="/privacy/">privacy policy</a>. If you installed the app from RuStore, the <a href="/cis/terms/">RuStore documents</a> apply instead.</p>

<h2>The app and your licence</h2>
<p>Chompbook turns your own materials and the built-in courses into daily lessons. The app is free. Lessons from your materials work without AI and without the internet; AI features are optional. We grant you a personal, non-exclusive, non-transferable, revocable licence to use the app on devices you own or control, for your own learning. The app's source code is publicly viewable on GitHub; seeing it does not grant any rights beyond this licence unless a separate licence file says so. Open-source components keep their own licences.</p>

<h2>Your materials</h2>
<p>You keep all rights to the books, articles, notes and other materials you import. Import only materials you are allowed to use for your own learning, and nothing illegal. Your materials stay on your phone except as described in the privacy policy.</p>

<h2>AI-generated content</h2>
<p>AI can be wrong. Lessons, quizzes and feedback written by AI may contain mistakes and are not professional advice (for example medical, legal or financial). Check anything important against reliable sources. If a lesson looks wrong or inappropriate, report it with the flag on the lesson screen.</p>

<h2>AI services you connect yourself</h2>
<p>If you connect an AI service with your own key, your use of it is governed by that service's terms, and any charges are between you and that service. We are not responsible for its availability, answers or prices.</p>

<h2>Chompbook Pro</h2>
<ul>
<li><strong>What you get.</strong> Chompbook AI writes lessons and checks your written answers without a key of your own. Fair use: a daily allowance of AI tokens that covers about 10 fifteen-minute AI lessons a day; it resets every day at 00:00 UTC. Longer or larger lessons use more of it. When the allowance is used up, lessons continue without AI until the reset. We choose the AI model and may change it, keeping comparable quality.</li>
<li><strong>Where it is sold.</strong> Inside the app from Google Play and, once released, the App Store, in countries where these stores sell subscriptions.</li>
<li><strong>Plans and prices.</strong> Monthly and annual plans. The store shows the price in your currency, including the taxes it applies, before you pay; prices can differ by country.</li>
<li><strong>Free trial.</strong> New subscribers may get a free trial of the length shown before purchase (7 days at launch). Eligibility is decided by the store (usually one trial per account). Nothing is charged during the trial; if you don't cancel at least 24 hours before it ends, the subscription starts and the first payment is charged.</li>
<li><strong>Automatic renewal.</strong> The subscription renews automatically at the end of each period, and the store charges the payment method on your account, unless you cancel at least 24 hours before the end of the current period.</li>
<li><strong>Cancelling.</strong> Cancel at any time: Google Play → Payments &amp; subscriptions → Subscriptions; on iPhone, Settings → your name → Subscriptions; or in the app: Settings → Chompbook Pro → Manage subscription. Pro stays active until the end of the period you have paid for. Deleting the app does not cancel the subscription.</li>
<li><strong>Refunds.</strong> Payments are processed by the store, so refunds follow its policy: request one in Google Play, or for Apple at <a href="https://reportaproblem.apple.com">reportaproblem.apple.com</a>. You can also write to us and we will help.</li>
<li><strong>Price changes.</strong> If the price changes, the store notifies you in advance as its rules require, and you can cancel before the new price applies.</li>
<li><strong>Restoring.</strong> On a new phone, sign in to the same store account and tap Settings → Chompbook Pro → "Restore purchases".</li>
</ul>
<p>Nothing in these terms limits the rights you have under the mandatory consumer law of your country. If you are a consumer in the EU or UK, you agree that Chompbook Pro starts right after purchase and you acknowledge that you lose the right of withdrawal once the service has started, except during a free trial, which you can cancel without charge.</p>

<h2>Acceptable use</h2>
<p>Don't misuse the app or Chompbook AI: no attempts to get around the daily allowance or the subscription check, no sharing or reselling access, no automated or bulk requests to our server, no attacks on it, no reverse engineering of our server, and no using it to create illegal or harmful content. We may suspend Chompbook AI for an anonymous ID that clearly breaks these rules; if that happens, write to us.</p>

<h2>Changes to the service</h2>
<p>We keep improving the app and may change or remove features. If we stop offering Chompbook Pro, we will tell you in the app at least 30 days in advance and stop renewals; refunds for unused paid time follow the store's refund policy and applicable law. The service may sometimes be unavailable for maintenance or because of providers we depend on.</p>

<h2>Liability</h2>
<p>The app is provided "as is" and "as available". To the extent the law allows, we are not liable for indirect or consequential losses, or for lost data — please use Settings → Export backup. Our total liability related to Chompbook Pro is limited to the amount you paid for it in the 12 months before the claim. None of this limits liability that cannot be limited by law, such as for intent or gross negligence, or for death or personal injury.</p>

<h2>Apple App Store</h2>
<p>If you got the app from the Apple App Store, these terms also include the following, and Apple's <a href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/">Licensed Application End User License Agreement</a> applies where these terms say nothing:</p>
<ul>
<li>These terms are between you and us, not Apple. We, not Apple, are solely responsible for the app and its content.</li>
<li>You may use the app on Apple-branded products you own or control, as allowed by the Usage Rules in the Apple Media Services Terms and Conditions.</li>
<li>Apple has no obligation to provide any maintenance or support for the app. Support is provided by us: ${mail(S.support)}.</li>
<li>If the app fails to conform to any applicable warranty, you may notify Apple, and Apple will refund the purchase price, if any. To the maximum extent permitted by law, Apple has no other warranty obligation with respect to the app; any other claims, losses or costs attributable to such a failure are our responsibility.</li>
<li>We, not Apple, are responsible for addressing any claims relating to the app or your use of it, including product liability claims, claims that the app fails to conform to any legal or regulatory requirement, and claims under consumer protection, privacy or similar laws.</li>
<li>If a third party claims that the app or your use of it infringes their intellectual property rights, we, not Apple, are responsible for the investigation, defence, settlement and discharge of that claim.</li>
<li>You confirm that you are not located in a country subject to a U.S. Government embargo or designated as "terrorist supporting", and that you are not on any U.S. Government list of prohibited or restricted parties.</li>
<li>You must comply with applicable third-party terms when using the app (for example, the terms of the AI service you connect).</li>
<li>Apple and its subsidiaries are third-party beneficiaries of these terms and, once you accept them, may enforce them against you.</li>
</ul>

<h2>Law and disputes</h2>
<p>These terms are governed by the law of the Republic of Armenia. If you are a consumer, you also keep the protection of the mandatory law of your country of residence and may bring a claim in its courts. Please write to us first — most problems can be solved quickly. EU consumers can also use their national consumer advice centres.</p>

<h2>Changes to these terms</h2>
<p>We will publish changes on this page and update the date above. For significant changes we will also tell you in the app before they apply.</p>

<h2>Contact</h2>
<p>${who}<br>${mail(S.support)}</p>
`,
};

export const support = {
  title: "Support",
  body: `
<p>We read every message. Write to ${mail(S.support)} — in any of the app's languages — and we will usually answer within two working days.</p>
<div class="note"><p>To report a wrong or inappropriate lesson, tap the <strong>flag</strong> on the lesson screen. To send technical details about a problem, open <strong>Settings → Error log → Send to the developer</strong>.</p></div>

<h2>Subscriptions</h2>
<h3>How do I cancel Chompbook Pro?</h3>
<p>Google Play: open Play Store → profile → Payments &amp; subscriptions → Subscriptions → Chompbook → Cancel. iPhone: Settings → your name → Subscriptions → Chompbook. Or in the app: Settings → Chompbook Pro → Manage subscription. Pro stays active until the end of the paid period. Deleting the app does not cancel the subscription.</p>
<h3>How do I get a refund?</h3>
<p>The store processes payments, so request a refund there: in Google Play (Order history → Request a refund) or at <a href="https://reportaproblem.apple.com">reportaproblem.apple.com</a>. If that doesn't work, write to us with your order number and we will help.</p>
<h3>I changed phones. How do I get Pro back?</h3>
<p>Sign in with the same Google account or Apple ID, open Settings → Chompbook Pro → "Restore purchases".</p>
<h3>Chompbook AI says the daily limit is reached.</h3>
<p>The fair-use allowance covers about 10 fifteen-minute AI lessons a day and resets at 00:00 UTC. Until then lessons continue without AI.</p>

<h2>Lessons and AI</h2>
<h3>Do I need AI?</h3>
<p>No. Lessons from your own materials and the five built-in courses work without AI and without internet. AI makes explanations and quizzes richer and checks open answers.</p>
<h3>Which AI services can I connect?</h3>
<p>A free service in a few taps (OpenRouter, Google Gemini, Mistral and others, depending on your age and region), your own key for Claude, ChatGPT, Groq, NVIDIA, Yandex Alice AI, Qwen or your own server, or Chompbook Pro.</p>
<h3>A file won't import.</h3>
<p>Try another format (PDF, EPUB, Word, TXT, Markdown, HTML) or paste the text. Very large scanned PDFs take time to recognise on the phone. If it still fails, send the error log from Settings.</p>

<h2>Your data</h2>
<h3>How do I move my progress to a new phone?</h3>
<p>Settings → Export backup on the old phone, then Settings → Restore from backup on the new one. We keep no copy, so a backup is the only way.</p>
<h3>How do I delete my data?</h3>
<p>See <a href="/delete-data/">Delete your data</a>.</p>

<h2>Contact</h2>
<p>E-mail: ${mail(S.support)} · Privacy: ${mail(S.privacy)}<br>${who}</p>
`,
};

export const deleteData = {
  title: "Delete your data",
  body: `
<p>Chompbook has no user accounts. Almost everything lives only on your phone, so you can delete it yourself at any time. This page explains how, and how to ask us to delete the little we may hold.</p>

<h2>Data on your phone</h2>
<ol>
<li>Open Chompbook → <strong>Settings → Delete all data</strong> and confirm. This removes your skillsets, materials, lessons, progress, AI keys, reports and the error log.</li>
<li>Or uninstall the app. Android also removes its storage. Backups you exported yourself (and the automatic copies in <em>Documents/PES</em>) stay where you saved them — delete those files in your file manager if you want them gone.</li>
</ol>

<h2>Data on our servers</h2>
<p>We may hold:</p>
<ul>
<li><strong>Lesson reports and error reports</strong> you chose to send — deleted automatically after 12 months.</li>
<li><strong>Chompbook Pro data</strong>: an anonymous ID, the cached subscription status (deleted 30 days after your last use of Chompbook AI) and daily usage counts (deleted after 90 days).</li>
</ul>
<p>To have them deleted earlier, write to ${mail(S.privacy)} with the subject "Delete my data". For Pro data, include your order number (Google Play: starts with <code>GPA.</code>; Apple: from your receipt) — without an account it is the only way to find your anonymous ID. For reports, tell us roughly when you sent them and from which app version. We confirm deletion within 30 days. Purchase records that the store and RevenueCat must keep for tax and accounting are deleted under their own policies.</p>

<h2>AI services you connected</h2>
<p>Data you sent to an AI service with your own key is held by that service. Delete it in your account there (for example in Google AI Studio, OpenRouter or the provider's console), and revoke the key.</p>

<h2>Cancelling a subscription</h2>
<p>Deleting data or the app does not cancel Chompbook Pro. Cancel it in Google Play or in your Apple ID settings — see <a href="/support/">Support</a>.</p>
`,
};
