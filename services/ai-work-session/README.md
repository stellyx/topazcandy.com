# Small paid-service requests

The one-to-one AI work session is $99 USD for 60 minutes on one task, including a reusable prompt or template and simple instructions. A small website repair is $99–$199 after inspection and agreement on one repair and its exact price; larger work is quoted separately. Lead-response setup is quoted after reviewing existing tools, with software costs separate.

All offer actions use the existing `/contact/` form in the same window, with allowlisted service context. The form confirms only enquiry delivery. It does not reserve a time, create an order, or collect payment. The existing website package and class work are independent.

Checks from repository root:
- `node scripts/check-paid-services.mjs`
- `node scripts/check-contact.mjs`
- `node scripts/check-purchase.mjs`

Offer styling is isolated in `assets/topaz/paid-services.css`. Homepage and service-directory callouts are additive. The contact sender and destination are unchanged.
