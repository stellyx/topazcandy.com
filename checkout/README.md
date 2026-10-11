# $450 website package cart

All six template purchase banners and the homepage/catalog offer open this shared cart. `config.mjs` is the single payment destination for the cart. Template query values are allowlisted and cannot change the package price, currency or payment destination.

The approved offer is $450 USD for one website using a selected design, setup and launch, SEO setup, eligible Google Maps/Business Profile setup or cleanup, business-information and link checks, and three months of website service and maintenance from launch. The included care covers the agreed website and its existing content. AI agents, automation, ongoing AI services, new features, domain registration, paid hosting and third-party subscriptions are agreed separately. Search Console/sitemap/indexing submission is a launch task with owner access; Google controls actual indexing and ranking.

## Current payment and email behavior

The owner requested use of the existing personal PayPal account. A classic hosted Buy Now button was created there on 2026-10-11: `H48437LCHWWFQ`, product `TOPAZ-WEBSITE-450`, with a saved price of $450.00 USD, one item, $0 shipping and no customer shipping-address request. The account was not converted to a business account. All six design options use that same fixed product price.

The cart POSTs to PayPal using the exact generated `cmd=_s-xclick`, `hosted_button_id`, `currency_code` and `on0`–`on2`/`os0`–`os2` fields. The visible design selector belongs to the PayPal form, so design selection also works without JavaScript. With JavaScript, a reply email/business summary and current-site/project-note summary are refreshed before submission; each is limited to PayPal's 200-character text-option limit. The selected design is allowlisted and query parameters cannot change the saved button, price or destination. No account email, credentials, private profile details or payment-method information is embedded in the site.

PayPal's receive-payment email setting was confirmed enabled/read-only. The receive-payment SMS switch was enabled and confirmed checked after reloading the account settings. PayPal sends these transaction alerts to the account's existing contact destinations. Actual delivery and a paid transaction were not tested; no charge was made and no email or SMS was sent by this implementation. App push alerts were not verified.

The optional email action still opens a draft to the verified Topaz Candy business mailbox with the selected design, package scope, full business details and optional transaction ID. Visitors review and send it themselves. Contact details remain in page memory until visitors choose to share them with PayPal or their email app. There is no website email sender, lead-storage endpoint, IPN receiver or webhook.

Do not treat a return URL/query string, opening PayPal, clicking an email link, or an entered transaction ID as proof of payment. The operator confirms the payment in PayPal before starting work. A future automatic payment-status/email integration must verify server-side notifications and use a real email sender; do not enable IPN against static GitHub Pages.

The older owner-provided QR destination was replaced by this fixed-price hosted checkout. No PayPal.Me handle was guessed or created. Provider reference: https://developer.paypal.com/api/nvp-soap/paypal-payments-standard/integration-guide/Appx-websitestandard-htmlvariables/

## Film montage

The cart uses five diagonal sections from the existing detailing, garden, roofing, HVAC and hair films. No new generated media or client work was added. Videos retain natural 85% opacity. Posters show when JavaScript, autoplay or video loading is unavailable. The shared pause/play control supports reduced motion, data saver, viewport/tab suspension and manual opt-in.

## Verification

Run `node scripts/check-purchase.mjs` from the repository root for package consistency, purchase routes, sanitization and motion logic. Internal page/asset/anchor targets and external links are checked separately. Browser/device visual QA is unavailable in this managed environment. The PayPal saved button, generated form and incoming-payment notification settings were verified through the authenticated account UI. Source checks and account configuration do not prove a completed payment or notification delivery.
