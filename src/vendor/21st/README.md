# Authenticated 21st.dev sources

Retrieved through the user's signed-in browser on 2026-10-23, using the two free source views shown by 21st.dev. No account tokens or cookies were copied.

- Calendar Scheduler, Ruixen UI: https://21st.dev/@ruixen.ui/components/calendar-scheduler
  - Original displayed source transcribed with normalized formatting into `calendar-scheduler.original.tsx`; the site's initial clipboard copy returned empty text.
  - Active adaptation: `src/components/calendar-scheduler.jsx`. Preserves calendar/time-slot split, selected slot state and reset action. Uses React Day Picker directly, Thai locale, controlled booking form state, actual availability and 24-hour time.
- Daily Timeline Scheduler, Ruixen UI: https://21st.dev/@ruixen.ui/components/daily-timeline-scheduler
  - Original copied using the site's Copy action into `daily-timeline-scheduler.original.tsx`.
  - Active adaptation: `src/components/daily-timeline-scheduler.jsx`. Preserves hourly grouping and add/delete controls. Uses reservation IDs and parent-owned booking state; events at fractional hours are grouped into their containing hour. Creation and cancellation use the app's validated dialog and confirmation.

Original reference TSX files are not imported by Vite. Existing local React/CSS presentation remains around the two adapted components. Attribution links are retained in both visible components. No license beyond the source site's permissions is asserted for these Ruixen components.
