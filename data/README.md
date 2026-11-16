# Bliss Sync data

Edit these files through a pull request or the GitHub web editor; git history is the audit log. Every push to `main` that changes a file here runs the **Calendar sync** workflow, which rebuilds `public/calendar.json` and `public/direct.ics` and redeploys the site. The workflow also runs daily at 5:00 AM Tampa time (to pick up Airbnb/Vrbo changes) and on **Actions → Calendar sync → Run workflow**.

## Before merging `enable-direct-booking`

This branch sets `directBooking.enabled` and every `ownerConfirmations` flag to `true`. Until the steps below are done, requests stay **closed** automatically:

1. **Set `directBooking.requestEmail`** in `booking-config.json` to the dedicated booking-request inbox. This is the one required edit; while it is empty the sync publishes `booking.open: false` and the site hides the "Request to book direct" link.
2. Replace every "Owner to confirm:" item in `src/config/policies.ts` with final text. The site treats policies as unconfirmed (draft banner, requests closed) while any remain.
3. Add the `AIRBNB_ICAL_URL` Actions secret. Requests stay closed while the Airbnb feed is missing or stale.
4. Merge only once these are **really** confirmed, not just flagged: rates, taxes (rates and registrations), policies, licences/registrations, insurance, and the request inbox plus Stripe invoicing. The flags are the owner's statement that they are.

| File | Who edits it | Contents |
| --- | --- | --- |
| `booking-config.json` | Owner | Nightly, weekend and seasonal rates, cleaning fee, tax lines (used for the guest's **estimate** and the tax report), stay rules, `directBooking.enabled` and `requestEmail`, owner confirmations. |
| `owner-blocks.json` | Owner | Nights the home is unavailable. `start` is the first blocked night; `end` is the day **after** the last blocked night (like a checkout date). Example: `{ "start": "2027-01-10", "end": "2027-01-13", "note": "Maintenance" }` blocks the nights of Jan 10, 11 and 12. |
| `direct-bookings.json` | Owner | Direct stays whose Stripe invoice is paid: `{ "id": "BB-270107-K4P9", "checkIn": "2027-01-07", "checkOut": "2027-01-10", "status": "confirmed" }`. Use the reference from the request email as `id`. Set `"status": "cancelled"` to free the dates. |

This repository may be public. **Never add guest names, emails, phone numbers or payment details** to any file here. Request references and notes in `owner-blocks.json` stay in the repository but are not published in `calendar.json` or `direct.ics`.
