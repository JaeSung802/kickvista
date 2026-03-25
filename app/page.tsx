/**
 * app/page.tsx — Root page redirect
 *
 * `/` redirects to `/ko` (default locale) so there is exactly one URL
 * serving the home experience. Both routes render identical content through
 * the [locale] layout + page, eliminating the prior dual-UI problem.
 *
 * Method A chosen over a shared HomePageContent render because:
 *  - Keeps the routing model clean — a single canonical URL
 *  - Avoids duplicating the full page render (no duplicate fetches / hydration)
 *  - SEO: canonical tag on /ko prevents any index duplication
 */

import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/ko");
}
