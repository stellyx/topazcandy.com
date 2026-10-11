# MJ Holistic Studio SEO and customer funnel audit

Reviewed October 11, 2026. Recommendations combine current public source, an earlier rendered homepage capture from the same day, the supplied sitemap, public listings and official Google guidance. Traffic, rankings, appointment conversion and missed revenue have not been measured.

## Recommended course

Keep MJ's existing Square reservation and gift card systems. Give new guests a clear introduction, explain service choices, show authentic work and make booking or asking Mayra a question easy. Preserve the gold and lavender identity with the black primary setting. Resolve location, hours and naming conflicts before paying to attract more visitors.

The observed opportunity is clearer local identity and a simpler first visit journey. The evidence does not establish that the scheduler is broken or that replacing it would improve performance.

## Coverage

| Evidence | Coverage |
| --- | --- |
| Live HTTP source | Homepage, appointments, gift cards, robots, sitemap and two retail products |
| Domain behavior | HTTP and non-www homepage requests ended at HTTPS www; intermediate redirect codes were not recorded |
| Rendered homepage | Same-day capture examined for visible copy, headings, canonical, service menu and contacts |
| Sitemap | 57 listed URLs, all under `/product/` |
| Public identity | Phenix Walden Park, Birdeye, dedicated Fresha profile and a separate Fresha area directory |
| Preview checks | Ten generated pages across MJ and generic template, with source, local references, contacts, logic and principal contrast checked |
| Unavailable evidence | MJ's Search Console, profile owner settings, analytics, scheduler reports, paid keyword/rank data, Core Web Vitals and full device playback |

The crawl service's credits were exhausted during this follow-up. Technical checks used direct live HTTP responses and the previously obtained same-day rendered homepage. Two product pages are a sample; the 57 products were not individually audited. Directory crawl ages do not establish the date of a move.

## Existing strengths

The domain and sampled pages respond successfully. MJ's homepage appears in retrieved public search results, which does not establish its position for competitive searches. Prices, durations and individual booking actions are already available. Phone, email and gift routes exist. Square provides reservation and checkout infrastructure. The original logo and independent guest reviews offer real identity and trust assets.

A canonical URL exists in the rendered homepage. Its absence from the initial HTML is not evidence that the homepage lacks a canonical. The site's initial response is an application shell, and the rendered capture includes its services.

## Colors

Square saves black `#000000` as primary, with no configured secondary colors. A gold logo and lavender-flower photograph supply the visible accent identity. The preview now uses black actions, ivory, pale lavender and the original gold mark. Media retains natural colors at 85% opacity. See [MJ_Color_Scheme.md](MJ_Color_Scheme.md) for the palette, image sources and contrast results.

## SEO repair order

| Priority | Finding | Evidence and interpretation | Repair |
| --- | --- | --- | --- |
| First | Business details conflict | Site map and Phenix use U.S. 183; older profiles use Pecan Park. Hours disagree. This can affect arrival and local identity. | Confirm one name, street/building/studio, map pin, phone and schedule; correct the relevant records. |
| First | Homepage title is a reservation label | Root and appointment route initially return `Appointments \| Mj hair studio`. The generic description omits Austin and the fuller identity. | Give the informational homepage a descriptive local title; distinguish it from the booking route. |
| First | Little introduction for a new guest | The configured introductory banner is hidden. No H1 appears in the rendered sample; service headings use H3. | Add a visible main heading, local service promise, stylist context and first visit guidance. An H1 alone does not guarantee rankings. |
| First | Limited dedicated service content | The supplied sitemap lists products rather than local service guides. | Publish useful haircut, color, care and consultation pages, with verified menus, preparation, real work and booking. Avoid duplicated town pages. |
| Next | Homepage and guides absent from sitemap | All 57 supplied entries are product URLs. Omission does not prevent discovery or indexing. | Include canonical salon pages in the final sitemap and submit it in Search Console; retain useful products. |
| Next | Identity markup absent from sampled homepage | No JSON-LD or microdata found in the rendered sample. | Add verified HairSalon identity. Confirm address/hours before inclusion and test on the final domain; eligibility is not a rich-result guarantee. |
| Next | JavaScript rendering needs inspection | Initial source is a shell; rendered content and canonical are present. Google can render JavaScript, so this is not proof of an indexing failure. | Inspect Google's rendered page in Search Console. The new static preview includes its main content in the response HTML. |
| Next | Root and appointment roles need review | Initial titles/descriptions match. Rendered homepage canonical points to root; rendered booking canonical was not separately checked. | Establish homepage versus transaction roles and verify rendered/Google-selected canonicals before claiming harmful duplication. |
| Next | Retail metadata needs a bounded follow-up | Two product samples have unique initial titles, but no initial description/canonical. Rendered product head was not inspected. | Check rendered metadata before repair. Prioritize salon pages, then improve useful products. |
| Next | Viewport restricts zoom | Sampled source includes `maximum-scale=1`; earlier rendered markup also restricts scaling. | Use an unrestricted responsive viewport, as the preview does. |
| Later | Robots groups require platform review | General rules disallow transaction routes; the more-specific Googlebot group has an empty disallow. | Review effective behavior and transaction indexability. Do not blindly block pages or required rendering assets. |

No measured speed failure, backlink penalty, manual action, deindexing or local ranking position is asserted. Those conclusions need the relevant account data or measurements.

## Location and hours reconciliation

| Source | Observed location | Other detail | Action |
| --- | --- | --- | --- |
| Current MJ site | 14005 U.S. 183, Austin, TX 78717 | Map present; location-info address visibility is off. Same-day menu says next Monday opening is 8 a.m.; footer says Monday through Saturday, 9 a.m. to 5 p.m. | Confirm actual hours, align calendar/footer and show arrival details. |
| Phenix Walden Park | Building: 14005 U.S. 183 North, Suite 1200; MJ: Studio 124 | Phone matches the current site. MJ has no booking link; neighboring entries have one. | Confirm building versus studio wording and request the MJ booking button. |
| Birdeye | 10222 Pecan Park Blvd #11, Austin, TX 78729 | Reviews exist; listed hours differ from current site. | Update the record through its owner route while preserving genuine review history. |
| Dedicated Fresha profile | Pecan Park Blvd #11 | Direct profile asks visitors to call. | Resolve its location and current booking destination or obsolete record. |
| Fresha Cedar Park highlights directory | 14005 U.S. 183, Suite 1200 | This separate page already has the newer street address. | Reconcile Fresha's internally inconsistent records. |

The current site and Phenix provide stronger current-location evidence than older profiles, but MJ should confirm exact arrival instructions before launch. No new hours, address or service area is invented.

Google's official guidance describes local visibility through relevance, distance and prominence and recommends complete, accurate information. Record cleanup is practical work, rather than a promise of first-place placement.

## Customer funnel

| Stage | Current path and friction | Repair | Measurement |
| --- | --- | --- | --- |
| Find | Brand search/referrals/directories can reach MJ. Identity varies; Phenix lacks the direct booking action. | Align local identity and add verified booking destinations to authorized directory/profile settings. | Search Console queries; profile website and booking clicks. |
| Understand | New visitors land on a long appointment menu with limited introduction. | Clear first screen: hair, color and care in Northwest Austin; original logo; Book or help choosing. | Homepage-to-booking/finder rates by source and device. |
| Trust | Prices are useful; sampled homepage lacks a portrait/introduction and real gallery. Reviews are elsewhere. | Add approved Mayra portrait and client work. Keep linked attributed reviews; disclose illustrative film. | Portfolio/review engagement and actual enquiry outcomes. |
| Choose | Hair, beauty, combinations and utility entries are mixed. A one-cent Product appointment appears publicly. | Preview groups 27 selected entries with price/time. Ask before uncertain changes. Review public utility entries in Square. | Service selection, finder choices and appointment corrections. |
| Reserve | Individual booking actions exist. Preview opens the full Square menu without preselection. | Keep real provider flow; exercise service, time, details, policies and confirmation in an agreed test. | Provider-confirmed bookings, abandonment if available, cancellations/no-shows. |
| Prepare/arrive | Locations and hours conflict; actual confirmation/policies untested. | Confirm studio/building wording, map pin, entry/parking and reminders; use actual cancellation rules. | Arrival questions, missed visits and provider reminder delivery. |
| Return | Rebooking, aftercare and follow-up operation are not observable publicly. | Agree next interval at checkout and provide useful aftercare. Review applicable provider features with the owner. | Repeat visit rate, time to return and rebooked visits. |
| Refer/gift | Gift checkout exists; review-request operation unverified. | Keep gifts accessible; request reviews appropriately after genuine visits. | Completed gifts, referrals and received reviews. |

These repairs are inferred from observed paths. Public content does not reveal conversion rates or prove how frequently confusion occurs. The preview offers a meaningful action in one or two taps; Square still owns the full reservation sequence.

### Ready-to-use booking repair

Proposed Phenix button: **Book an appointment**.

Destination: `https://www.mjholisticstudiollc.com/s/appointments`.

Use this verified route for an authorized Google profile booking link while it remains valid. Google's tools allow a preferred link when multiple links are present. No directory request, profile edit or outreach message was sent.

### Service content targets

These targets come from the actual menu. They are not measured keyword volumes or profitability claims.

| Page | Intent | Helpful content | Next action |
| --- | --- | --- | --- |
| Home | MJ by name or a Northwest Austin stylist | Identity, services, real introduction/proof, clear arrival information | Book or ask |
| Haircuts | Austin haircut, bang trim or blowout | Actual options, price/time, routine and real cut photos | Book or ask about appointment length |
| Color | Balayage, highlights, roots or a change | Actual combinations, price/time, history, upkeep and real results | Book a known service or ask before a change |
| Care | Scalp therapy or conditioning | Verified treatments, duration, products and sensitivities; no medical outcomes | Choose care or ask |
| Extensions | Extensions and consultation | Consultation, maintenance, method/cost only when verified | Discuss the consultation |

Proposed homepage title: **MJ Holistic Studio | Hair, Color & Scalp Care in Austin**.

Proposed description: **Explore haircuts, balayage, color, scalp care and beauty services at MJ Holistic Studio in Northwest Austin. View published prices and book your next appointment.**

These are in the preview. Four guides also have unique titles and local descriptions. They can affect MJ's public search presence only after final-domain publication and indexing.

## Delivered in this follow-up

- MJ-specific black, ivory, lavender and gold colors derived from current settings/images; generic identity stays separate.
- Mobile CSS places a compact film/poster before the copy. Original gold mark added to hero caption; quiet controls and motion preferences retained.
- Clear initial service language and local identity with direct booking and appointment guidance.
- Descriptive H1s and unique local descriptions for four MJ service guides.
- Identity schema uses the real logo rather than illustrative hair imagery. Unconfirmed address/hours and aggregate ratings are omitted.
- This audit and a separate color reference are attached to the retained template package.

All proposal/template copies retain `noindex,nofollow`. This publication does not establish a ranking improvement for MJ's original domain.

## Measurement and final launch

Tagged homepage actions dispatch `salon:conversion` integration hooks with action/placement. No analytics account is installed and these are not confirmed-booking events. Service guides are navigation pages; no guide-level event tracking is claimed. With authorized accounts, separate outbound clicks from provider-confirmed bookings and measure new/returning visits, cancellations and rebooking. Set targets after seeing capacity and actual data. Do not include customer messages, hair history or contact details in general analytics events.

Booking and gift checkout currently share the homepage domain. Moving that domain's hosting without a route plan could interrupt `/s/appointments`, `/s/gift-cards` or retail URLs. This is a migration risk, not a current outage. First verify a stable provider booking/gift destination or approved Square subdomain arrangement. Test it, then create redirects and preserve or deliberately migrate products. Do not invent a Square URL or redirect a booking path to itself.

On the final domain, configure canonical URLs, sitemap, indexability, redirects and confirmed address/hours. Check Google's rendered view, selected canonical and indexing afterward. Keep Topaz portfolio copies excluded from indexing.

## Next repair sequence

1. Confirm name, street/building/studio, map pin and hours; correct the site, calendar and priority profiles.
2. Add Phenix/profile booking links and review public utility appointments and combinations.
3. Supply approved stylist introduction/portrait and 8 to 12 client photos with actual service labels.
4. Choose final domain/provider routing; exercise full booking and gifts on desktop/phone; configure final SEO settings.
5. Connect approved analytics/provider reports, establish real completed-booking data, then test paid acquisition.

The established $795 package proposal is unchanged. This audit creates no invoice, accepted sale, paid subscription or recurring charge.

## Verification and limits

Build and JavaScript syntax passed. Ten appointment paths, contact encoding and generic identity isolation passed. Motion checks cover viewport/tab suspension, persistent pause, reduced motion, data saver, blocked autoplay, poster failure fallback and a delayed-play race. Ten generated pages passed one-H1, unique-title, noindex and local-reference checks; 204 references resolved. Eight principal MJ text pairs passed at least 4.5:1.

Full browser and phone-device QA remains pending because the supported browser-control plugin was unavailable. Responsive order/dimensions were checked in source; actual first-fold composition and phone playback have not been demonstrated. No real reservation, payment, SMS, email, analytics receipt or ranking outcome is claimed.

## Sources

- [MJ homepage](https://www.mjholisticstudiollc.com/), [appointments](https://www.mjholisticstudiollc.com/s/appointments), [gift cards](https://www.mjholisticstudiollc.com/s/gift-cards), [robots](https://www.mjholisticstudiollc.com/robots.txt), [sitemap](https://www.mjholisticstudiollc.com/sitemap.xml)
- Sample products: [serum](https://www.mjholisticstudiollc.com/product/age-bright-clearing-serum-1-oz/79), [eye complex](https://www.mjholisticstudiollc.com/product/age-reversal-eye-complex/94)
- [Phenix directory](https://phenixsalonsatx.com/salon-owners-southpark-meadows-2/), [Birdeye](https://reviews.birdeye.com/mj-holistic-studio-llc-171619157204383)
- [Dedicated Fresha profile](https://www.fresha.com/lvp/mj-holistic-studio-llc-pecan-park-boulevard-austin-85Wz33), [Fresha Cedar Park highlights directory](https://fresha.com/lp/en/tt/hair-colouring-highlights/in/us-austin/cedar-park)
- Google: [local visibility](https://support.google.com/business/answer/7091?hl=en), [booking links](https://support.google.com/business/answer/6218037?hl=en), [titles](https://developers.google.com/search/docs/appearance/title-link), [JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics), [canonicals](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls), [LocalBusiness data](https://developers.google.com/search/docs/appearance/structured-data/local-business)

The earlier package retains salon feature research and Austin structural comparisons. This report adds source-level colors, technical checks and a more specific funnel plan.
