# 30-day AI

This is a section of Topaz Candy, served at /30-day-ai/ and /30-day-ai/es/. It retains the corporate ivory, plum and amber palette, emblem and wordmark. Corporate navigation links are understated; checkout and client-template funnels are separate.

## Course and enrollment

The current instructor guide sets the course at $450 USD per student, four weeks, eight two-hour meetings and 16 classroom hours. The owner selected in-person delivery. The first cohort dates, venue, teaching language and cancellation terms have not been provided.

The page therefore uses an explicitly labeled enrollment-request form. It does not collect payment, reserve a seat or report paid status. The existing website-package PayPal button is for a different product and is not used for this class.

The fixed, activated Topaz FormSubmit destination accepts the student's name, reply email, language, contact permission and optional phone, starting point and question. The payload carries the course, price, reference and pending-enrollment status. Positive provider acceptance is required before reporting receipt; timeout or failure preserves entries. Concurrent or unchanged accepted sends are blocked. A retry retains the reference. Student details are not written to browser storage.

Confirm the cohort schedule, venue, teaching language, payment product and cancellation terms before enabling a direct purchase path. Update COURSE in content.mjs, change the public wording consistently and verify the payment setup for this course. Do not treat a return URL or submitted request as proof of payment. Add an actual verified class-group URL only when that group exists.

## Content and resources

content.mjs contains complete English and Spanish copy, curriculum and resource URLs. render.mjs creates both HTML routes with full translated content before JavaScript runs. Run node 30-day-ai/render.mjs after content edits. The page declares matching canonical and hreflang links.

The switch uses a brief SVG displacement ripple and sideways wavering opacity animation, with no rotation. Reduced-motion settings use a short fade. Language changes preserve form text, selected teaching-language preference, open sections and practice checkmarks. Decorative gem and star movement has a pause control and stops for reduced-motion and background-page settings.

The prompt practice tool builds templates locally; it is not a live AI model. It supports copy and text download. The only persisted data is an eight-item practice checklist under topaz-ai-practice-v1. Storage failure keeps the checklist working for the open page and explains the limitation.

Downloads include a 14-page English workbook, a 14-page Spanish workbook and the existing bilingual website Mad Lib and sandwich reflection PDFs. The instructor guide and the instructor's offline backup are not published as student downloads.

## Checks

Run node scripts/check-ai-course.mjs and node scripts/check-contact.mjs. Check JavaScript syntax and resolve links against the current repository tree. Render and visually inspect both workbooks before replacing them.

Browser and physical-device visual QA is not available in this managed environment without the browser-control skill. Source checks and provider acceptance do not establish a completed course payment or a confirmed student enrollment.
