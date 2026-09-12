# Blue Bliss By The Bay

A mobile-first vacation-home website built with React, TypeScript, Vite, and Tailwind CSS 4. All reservation links lead to the supplied Airbnb listing; this site does not collect payments, calculate prices, or promise availability.

## Develop and validate

- `npm install` installs the existing stack. No new application dependencies were added for the redesign.
- `npm run dev` starts development at the configured Vite base path.
- `npm run build` runs TypeScript checks and creates the production output.
- `npm run lint` runs ESLint.
- The [base-path checks](scripts/base-check.mjs) verify development image helpers and generated production metadata for root, GitHub Pages, and alternate subpath deployments without overwriting the production build. They run as part of the VS Code validation task.
- `npm run preview` serves the production build.
- `node scripts/browser-check.mjs` runs the dependency-free headless Chrome regression checks after a build. Requires Node 22+ and Chrome; set `CHROME_PATH` on non-macOS systems. It starts an isolated browser and a local preview if necessary, cleans them up, and prints a temporary report/artifact directory. Optional axe-core is fetched from a pinned CDN version for testing only; use `--no-axe` for offline checks. No Airbnb booking is submitted.
- The equivalent validation, preview, and browser-check tasks are available in [the VS Code tasks](.vscode/tasks.json).

## Content and trust

Edit [src/config/siteConfig.ts](src/config/siteConfig.ts) for property facts, sleeping arrangements, amenities, guest quotes, FAQs, navigation, booking URL, and page/SEO copy.

- Three bedrooms are separate from `additionalSleeping` (the loft sofa bed). The total capacity is six, not an invitation to add extra guests.
- Supplied guest quotes are retained without rewriting. The page labels them as host-supplied and links to the current Airbnb review history.
- `trust` retains the historical rating, review count, and Superhost claim, but each badge is **off by default**. Confirm the value against Airbnb, set that field’s `verified` flag, and record `verifiedAt` as an ISO date. Both flag and date are required to display the badge. Dates are shown publicly; recheck regularly.
- `ownerVerification` lists outstanding checks. Verify review attribution/permission, bed sizes and loft layout, amenities, parking limits, fire pit instructions, listing URL, and production domain.
- Arrival/departure times, pets, smoking, events, quiet hours, and cancellation terms are intentionally deferred to Airbnb until confirmed. Old unverified times, instant-booking/free-cancellation promises, stock photos, geographic coordinates, and structured ratings have been removed. No JSON-LD is emitted; add it only when its facts are verified.
- The home is a Tampa Heights neighborhood property, not beachfront or waterfront. Destination recommendations carry no unverified travel-time claims. The neighborhood currently has no imagery; do not put destination photos in the property gallery.

## Photography handoff

The owner supplied a [Lightroom album](https://lightroom.adobe.com/shares/86fb79cab64549df885c04ea983c2eef) containing **56 downloadable photographs**. These were imported on September 12, 2026. The third photo in Lightroom’s custom order, **DSC06600**, is now the hero and first gallery photo, as requested by the owner. The original exterior AVIF remains further into the collection, making **57 gallery images** in total.

### Outdoor-first order and Blue Bliss refresh

The hero now pairs “Your Tampa launchpad.” with the uncropped DSC06600 photograph and a short introduction positioning Blue Bliss in Tampa Heights, close to Armature Works. The home-base theme continues through the stay story, neighborhood, closing invitation, and SEO description. The owner’s longer description about coffee, wine/beer, bocce, Armature Works, and the outdoor shower is preserved in the expandable “A note for your stay” section below the image-led story. The “Your Own Place. Your Own Pace.” introduction retains conference, golf, downtown and Tampa Bay as possible outings. Promotional cooking/shared-meal language has been removed; genuine guest quotes remain unchanged.

The editorial composition uses navy-to-azure tonal depth, a continuous pale-blue canvas, numbered journal captions, asymmetric outdoor/interior photography, unboxed property facts, an inset midnight-blue sleeping chapter, and a sunlit photographic closing invitation. The illustrated skyline has been retired from the hero and neighborhood section: real property photography and restrained destination typography now carry the design. A lightweight local SVG paper texture adds depth; no animated backgrounds, stock photography, or scroll effects are used. Outdoor copy sits beside—not over—the photograph. Every photo opener has a visible, minimum-44px “View photo” action row below its image, including small gallery tiles. No photo action is positioned over image content or hidden on smaller screens. The owner-selected hero stays fully visible at its natural aspect ratio. Composition styles are in [src/App.css](src/App.css); base styles and controls remain in [src/index.css](src/index.css). `photography.storyIds` selects the outdoor, interior, sleeping, and closing images. The home remains in Tampa Heights, not downtown or on the waterfront.

`photography.priorityIds` controls the front of the full collection; `photography.previewIds` controls the five page previews. Current first five: **DSC06600, DSC06560, DSC06562, DSC06590, DSC06584**. Local Apple Vision classification strongly supports the table/chair/patio selections and identifies **DSC06560 / DSC06562 as likely shower views**. This is not a direct visual review: the owner should confirm those two shower filenames. Their public captions remain neutral rather than presenting classifier guesses as facts. Remaining photos preserve their prior relative order.

All imported photos are local WebP assets in [public/images/property](public/images/property), with real 640 × 427, 1280 × 853, and 2048 × 1365 exports. The full set of 168 renditions is about 17.3 MB; it is **not** downloaded on initial page load. Five gallery previews and four editorial images are lazy-loaded below the eager hero. The full viewer loads the selected image on demand, with responsive source selection, previous/next buttons, left/right arrow keys, a live counter, and a labeled jump selector. The modal image is unmounted when closed. No Lightroom login, hotlinked renditions, or expiring Adobe URLs are required by the deployed site.

**Caption review needed:** Lightroom supplies filenames and copyright metadata, but no room descriptions. Images therefore have distinct neutral property-album labels and source references; these are not a substitute for descriptive room-specific alt text. Supply a filename-to-room/photo-description key, especially for the three named bedrooms and the loft. Do not infer bed sizes, accessibility, or amenities from filenames. Photo contents/crops have not been visually reviewed by the automated checks. Confirm the album’s coverage of the loft sofa bed, bathrooms, parking, and entrance. The user supplied the album for use on this site; confirm that your photo license permits publication without attribution.

The reproducible [scripts/import-lightroom.py](scripts/import-lightroom.py) downloads public 2048-pixel renditions and creates the local WebP sizes with Pillow. Pillow is photo-tooling only, not an application dependency. It strips EXIF/GPS and prints an inventory; it does not rewrite site content. Review album changes before rerunning (existing imported renditions are replaced). Original Lightroom filenames are retained as local file stems, and `albumPhotoFiles`, `photography`, captions, and preview selections live in [src/config/siteConfig.ts](src/config/siteConfig.ts).

To add a photo:

1. Put optimized files in [public/images](public/images). Prefer AVIF/WebP, with sensible dimensions and compression.
2. Add one `galleryImages` entry with a unique `id`, public-relative `src` (for example `images/kitchen.avif`), factual `alt` and `caption`, and the actual pixel `width`/`height`.
3. Optionally add `sources` containing real exports of the same photo at different widths. `PropertyImage` generates `srcSet` and uses context-appropriate `sizes`; never list a width that does not match the file.
4. Keep at least one image. The first is the hero. Choose the compact page preview using `photography.previewIds`; every gallery entry is available in the full viewer. Add accurate captions and alt descriptions rather than copying the provisional album labels.
5. Confirm every source in both development and the production preview. Below-fold gallery images are lazy-loaded and dimensioned; the hero is loaded eagerly with high priority. The full image is available in a native modal dialog with Escape, focus restoration, and background isolation.

Neighborhood photos, if supplied later, must be separately configured/rendered in the neighborhood section, licensed for use, and captioned as destinations **not at the property**. Do not add stock hotel, pool, beach, or restaurant imagery to suggest amenities.

## Deployment and social sharing

[vite.config.ts](vite.config.ts) preserves the existing `/tampa-airbnb/` base. `assetUrl` uses the resolved base for property images, and HTML uses Vite’s `%BASE_URL%` for the favicon. The metadata plugin uses the same resolved base, including CLI base overrides.

`seoConfig` is the single source for the title, description, production origin, and social-image path. Vite emits title, canonical, Open Graph, and Twitter metadata into HTML at build time, so social crawlers do not need to run React. Confirm `siteOrigin` before launch; changing domains requires rebuilding. The sharing image uses the existing [public/images/hero.jpg](public/images/hero.jpg), which is a different export from the AVIF. Both files decode successfully, and automated pixel comparison is broadly similar, but **the owner must approve the JPEG’s identity, crop, and publishing rights**. Similarity does not establish provenance. Supply a replacement authentic JPEG/PNG if necessary. Test the deployed preview with the intended social platforms, which may cache older metadata.

## Manual launch checks still required

### Editorial redesign validation completed

- Latest photo-control/design refinement: **252 browser assertions passed, 0 failed, 1 existing social-JPEG approval check skipped**. All eight photo openers passed visible-label, below-image placement, minimum-44px height, hit-testing, real pointer-open and Escape/focus-restoration checks at 320, 390, 768, 1024 and 1440 px widths (80 targeted assertions). Skyline absence, full photo ratios, remaining gallery interactions and four axe audit states passed. Build/lint/base-path checks passed; manual visual/device review remains separate.
- Latest Tampa-launchpad/skyline pass: **169 browser assertions passed, 0 failed, 1 existing social-JPEG approval check skipped**. Production build, lint and all three base-path checks passed. Tests verify the new headline and Armature Works positioning, local skyline decoding, decorative accessibility handling, accurate Tampa Heights home-base labeling, and the explicit “not a view from the home” caption. Mobile/desktop geometry, all gallery photos, reduced motion and four axe audit states passed; direct visual and physical-device review remain outstanding.
- Latest layered-design pass: **168 browser assertions passed, 0 failed, 1 existing social-JPEG approval check skipped**. Build, lint, and three deployment-base checks passed. The previous flat-color pass exposed small-text contrast issues; its colors have been corrected and the latest axe audits report no detected violations. Automated audits still mark some image/gradient contrast cases for manual review; this is not an accessibility certification.
- Actual rendered tonal backgrounds, mobile/desktop geometry, uncropped image ratios, gallery controls, and reduced-motion behavior were checked. The development stylesheet was updated and the local site opened in the editor browser. Direct visual screenshot review remains unavailable.
- Production build, ESLint, and all three deployment-base checks passed.
- Chrome: **167 assertions passed, 0 failed, 1 existing social-JPEG approval check skipped**. Four axe-core states passed without detected violations.
- Checked rendered geometry from 320 to 1920 px, first-screen booking access, all 57 gallery images, keyboard interactions, reduced motion, exact requested introductory copy, preserved owner description, and unchanged guest quote text.
- Measured mobile and desktop hero/supporting-photo aspect ratios match the source images: no cropping. Mobile/desktop section screenshots were captured, and composition geometry was inspected.
- **Direct visual screenshot review was not available.** Local image classification informed supporting selections; it is not a substitute for visual art direction or owner confirmation of photo labels. Physical-device, Safari, screen-reader, and visual photo review remain required.

### Photo import validation completed

- Build, ESLint, and all three base-path checks passed after integration; editor diagnostics were clear.
- All **168 WebP files** decoded locally, matched their advertised widths, and contained no EXIF.
- Updated Chrome regression run: **144 assertions passed, 0 failed, 1 existing social-JPEG owner-approval check skipped**.
- All **57 gallery photos** decoded with distinct sources. Tested previous/next buttons, wraparound arrow keys, jump selection, view-all opening, Escape/pointer closing, and focus restoration on mobile, desktop, and short landscape layouts.
- Responsive viewport and four axe-core audits passed. Full gallery images are not mounted while the viewer is closed.
- Visual photo identification, room-specific descriptions, Safari/physical-device review, and deployment remain separate manual checks; generic album labels are intentionally provisional.

### Redesign validation completed (before album import)

- Production build and ESLint passed; editor diagnostics were clear.
- Development image helpers and built metadata passed at `/`, `/tampa-airbnb/`, and `/coastal-preview/`.
- Headless Chrome: **120 assertions passed, 0 failed, 1 owner-verification check skipped**. Tested 320, 375, 390, 768, 1024, 1440, and 1920 px widths, four short-landscape sizes, and two approximate 200% reflow sizes. No horizontal overflow; booking CTA available on the first screen; footer links/text clear of sticky UI.
- Keyboard navigation, fragment focus/scroll, gallery Enter/Escape/Tab behavior and pointer close, five FAQ disclosures, asset decoding, consistent Airbnb destinations, conditional trust badges, and reduced-motion styles passed. No browser console errors or failed asset requests were observed.
- axe-core 4.10.3 reported no tested WCAG A/AA or best-practice violations in mobile, desktop, expanded-disclosure, and gallery-modal states. Automated checks are not a conformance certification; manual review remains required.
- Social-image ownership/identity approval was explicitly skipped, not marked verified. Screenshots were captured but not visually reviewed. Only the available single-photo gallery was exercised.

### Before publishing

- Review the design/photos on physical phones and in Safari, including notched-device safe areas, landscape, pinch zoom, and larger system text.
- Test VoiceOver/screen-reader navigation and the modal photo viewer. Automated audits do not establish full accessibility conformance.
- Check the deployed subpath, favicon, all image variants, fragment links, and social previews.
- Confirm the Airbnb destination and current facts/policies. No live booking or owner claim verification is part of the automated checks.
- Review the imported photo collection and supply room-specific captions/alt descriptions. Recheck responsive crops after changing the preview selection.

The Chrome script reports the checks it actually performs (viewport geometry, overflow, assets, focus/navigation/dialog behavior, reduced motion, and optional automated accessibility). Screenshots are artifacts, not proof of visual review; viewport reflow is not a substitute for real browser zoom or physical-device testing.

