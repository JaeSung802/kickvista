/**
 * StandingsSection — Server Component
 *
 * Renders the league standings area. Receives pre-fetched StandingsMap
 * from the page and passes to StandingsTabs (client) for tab interaction.
 */

import type { Locale } from "@/lib/i18n";
import type { StandingsMap } from "./HomePageContent";
import { SectionHeader } from "./HomePageContent";
import StandingsTabs from "./StandingsTabs";

interface StandingsSectionProps {
  standingsData: StandingsMap;
  locale: Locale;
}

export default function StandingsSection({ standingsData, locale }: StandingsSectionProps) {
  const isKo = locale === "ko";

  return (
    <div id="standings">
      <SectionHeader
        title={isKo ? "리그 순위" : "League Standings"}
        href={`/${locale}/league/premier-league`}
        linkLabel={isKo ? "전체 순위" : "Full table"}
      />

      <StandingsTabs standingsData={standingsData} locale={locale} />
    </div>
  );
}
