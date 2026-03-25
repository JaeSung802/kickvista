import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const loc = locale as Locale;
  return buildMetadata({
    locale: loc,
    title: loc === "ko" ? "이용약관" : "Terms of Service",
    description:
      loc === "ko"
        ? "킥비스타 서비스 이용에 관한 약관을 확인하세요."
        : "Read the terms and conditions governing your use of KickVista.",
    path: "/terms",
  });
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const isKo = locale === "ko";

  const LAST_UPDATED = "2026-03-01";

  return (
    <main className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
            <a href={`/${locale}`} className="hover:text-emerald-600 transition-colors no-underline">
              {isKo ? "홈" : "Home"}
            </a>
            <span>/</span>
            <span className="text-gray-600">{isKo ? "이용약관" : "Terms of Service"}</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">
            {isKo ? "이용약관" : "Terms of Service"}
          </h1>
          <p className="text-sm text-gray-400">
            {isKo ? `최종 업데이트: ${LAST_UPDATED}` : `Last updated: ${LAST_UPDATED}`}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
          <div className="p-8 sm:p-10">
            {isKo ? <KoContent locale={locale} /> : <EnContent locale={locale} />}
          </div>
        </div>

        {/* Contact box */}
        <div className="mt-8 bg-emerald-50 border border-emerald-200 rounded-xl px-6 py-5">
          <p className="text-sm font-semibold text-emerald-800 mb-1">
            {isKo ? "이용약관 관련 문의" : "Terms Inquiries"}
          </p>
          <p className="text-sm text-emerald-700">
            {isKo
              ? "이용약관에 관한 문의사항은 아래 이메일로 연락해 주세요."
              : "For any questions about these terms, please contact us at:"}
          </p>
          <a
            href="mailto:legal@kickvista.io"
            className="text-sm font-bold text-emerald-700 hover:text-emerald-900 transition-colors mt-1 inline-block"
          >
            legal@kickvista.io
          </a>
        </div>
      </div>
    </main>
  );
}

// ─── English Content ──────────────────────────────────────────────────────────

function EnContent({ locale }: { locale: string }) {
  return (
    <div className="space-y-8 text-sm leading-relaxed text-gray-700">
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3">1. Acceptance of Terms</h2>
        <p>
          By accessing or using KickVista (&ldquo;the Service&rdquo;) at kickvista.io, you agree to
          be bound by these Terms of Service (&ldquo;Terms&rdquo;) and our{" "}
          <a href={`/${locale}/privacy`} className="text-emerald-600 hover:underline">Privacy Policy</a>.
          If you do not agree, you may not access or use the Service. These Terms apply to all
          visitors, users, and others who access or use the Service.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3">2. Description of Service</h2>
        <p>
          KickVista is a football information platform providing live scores, league standings, AI-powered
          match analysis, a fan community, and a daily attendance reward system. The Service is
          provided for informational and entertainment purposes only. We are not a sports betting
          service and no content on this site constitutes gambling advice.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3">3. Eligibility</h2>
        <p>
          You must be at least 14 years of age to create an account and use the Service.
          By creating an account, you represent that you meet this requirement. If you are under 18,
          you must have the consent of a parent or legal guardian.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3">4. User Accounts</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
          <li>You are responsible for all activities that occur under your account.</li>
          <li>You must provide accurate and complete information during registration.</li>
          <li>You may not use another user&apos;s account without permission.</li>
          <li>
            You must notify us immediately at{" "}
            <a href="mailto:support@kickvista.io" className="text-emerald-600 hover:underline">
              support@kickvista.io
            </a>{" "}
            of any unauthorised use of your account.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3">5. User-Generated Content</h2>
        <p className="mb-3">
          By submitting posts, comments, or other content (&ldquo;User Content&rdquo;) to the Service,
          you grant KickVista a non-exclusive, royalty-free, worldwide licence to use, reproduce,
          modify, and display that content within the Service.
        </p>
        <p className="mb-2">You agree <strong>not</strong> to post content that:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Is unlawful, abusive, harassing, threatening, or defamatory</li>
          <li>Infringes any third party&apos;s intellectual property rights</li>
          <li>Contains spam, unsolicited advertising, or phishing links</li>
          <li>Impersonates any person or entity</li>
          <li>Violates the privacy of others</li>
          <li>Is unrelated to football or sports</li>
        </ul>
        <p className="mt-3">
          We reserve the right to remove any User Content and to suspend or terminate accounts that
          violate these guidelines, at our sole discretion.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3">6. Intellectual Property</h2>
        <p>
          The Service and its original content (excluding User Content), features, and functionality
          are and will remain the exclusive property of KickVista. Our trademarks and trade dress may
          not be used in connection with any product or service without our prior written consent.
          Football data is provided by third-party APIs and is subject to those providers&apos; terms.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3">7. Advertising</h2>
        <p>
          The Service displays advertisements served by <strong>Google AdSense</strong> and other
          third-party advertising networks. We are not responsible for the content of such
          advertisements. Clicking on advertisements may direct you to third-party websites governed
          by their own terms and privacy policies.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3">8. Attendance &amp; Points System</h2>
        <p>
          The attendance check-in and points system is provided as an engagement feature with no
          monetary value. Points, badges, and ranks are solely for use within the Service and cannot
          be transferred, redeemed for cash, or used outside of KickVista. We reserve the right to
          modify, suspend, or terminate the points system at any time without notice.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3">9. Disclaimer of Warranties</h2>
        <p>
          The Service is provided on an &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo; basis
          without any warranties of any kind, either express or implied. We do not warrant that the
          Service will be uninterrupted, error-free, or free of viruses. Sports data (scores,
          standings, fixtures) is provided for informational purposes and may contain inaccuracies;
          do not rely on it for any financial, betting, or legal decisions.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3">10. Limitation of Liability</h2>
        <p>
          To the fullest extent permitted by applicable law, KickVista shall not be liable for any
          indirect, incidental, special, consequential, or punitive damages arising out of or related
          to your use of the Service, even if we have been advised of the possibility of such damages.
          Our total liability to you for any claim shall not exceed KRW 100,000 (or equivalent).
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3">11. Termination</h2>
        <p>
          We reserve the right to suspend or terminate your account and access to the Service at any
          time, without prior notice, for conduct that we believe violates these Terms or is harmful
          to other users, us, third parties, or the Service. You may terminate your account at any
          time by contacting us.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3">12. Governing Law</h2>
        <p>
          These Terms shall be governed by and construed in accordance with the laws of the Republic
          of Korea. Any disputes arising under these Terms shall be subject to the exclusive
          jurisdiction of the courts located in Seoul, Korea.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3">13. Changes to Terms</h2>
        <p>
          We reserve the right to modify these Terms at any time. We will notify users of material
          changes by updating the &ldquo;Last updated&rdquo; date. Continued use of the Service after
          changes constitutes acceptance of the new Terms.
        </p>
      </section>
    </div>
  );
}

// ─── Korean Content ───────────────────────────────────────────────────────────

function KoContent({ locale }: { locale: string }) {
  return (
    <div className="space-y-8 text-sm leading-relaxed text-gray-700">
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3">제1조 (목적 및 동의)</h2>
        <p>
          본 이용약관(&ldquo;약관&rdquo;)은 킥비스타(KickVista, 이하 &ldquo;회사&rdquo;)가 운영하는
          kickvista.io 웹사이트(이하 &ldquo;서비스&rdquo;) 이용에 관한 조건 및 절차를 규정합니다.
          서비스 접속 또는 이용 시{" "}
          <a href={`/${locale}/privacy`} className="text-emerald-600 hover:underline">개인정보처리방침</a>을
          포함한 본 약관에 동의하는 것으로 간주됩니다.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3">제2조 (서비스 내용)</h2>
        <p>
          킥비스타는 라이브 스코어, 리그 순위, AI 경기 분석, 팬 커뮤니티, 출석 포인트 시스템을 제공하는
          축구 정보 플랫폼입니다. 서비스는 정보 제공 및 오락 목적으로만 제공되며, 스포츠 베팅 서비스가
          아닙니다. 서비스 내 어떠한 콘텐츠도 도박 또는 베팅 조언으로 해석될 수 없습니다.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3">제3조 (이용자 자격)</h2>
        <p>
          만 14세 이상이어야 계정을 생성하고 서비스를 이용할 수 있습니다. 계정 생성 시 이 요건을
          충족함을 확인한 것으로 봅니다. 만 18세 미만인 경우 보호자의 동의가 필요합니다.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3">제4조 (계정 관리)</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>이용자는 계정 자격증명의 기밀을 유지할 책임이 있습니다.</li>
          <li>계정에서 발생하는 모든 활동에 대한 책임은 이용자에게 있습니다.</li>
          <li>가입 시 정확하고 완전한 정보를 제공해야 합니다.</li>
          <li>타인의 계정을 무단 사용해서는 안 됩니다.</li>
          <li>
            계정 무단 사용을 인지한 경우 즉시{" "}
            <a href="mailto:support@kickvista.io" className="text-emerald-600 hover:underline">
              support@kickvista.io
            </a>
            로 신고해 주세요.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3">제5조 (이용자 제작 콘텐츠)</h2>
        <p className="mb-3">
          게시글, 댓글 등 이용자가 제출하는 콘텐츠(&ldquo;이용자 콘텐츠&rdquo;)에 대해 킥비스타에게
          서비스 내 사용·재현·수정·표시할 수 있는 비독점적·무상의 전세계 라이선스를 부여합니다.
        </p>
        <p className="mb-2">다음과 같은 콘텐츠를 게시해서는 <strong>안 됩니다</strong>:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>불법적이거나 학대적·모욕적·위협적·명예훼손적 내용</li>
          <li>제3자의 지식재산권을 침해하는 내용</li>
          <li>스팸, 무단 광고, 피싱 링크</li>
          <li>타인이나 단체를 사칭하는 행위</li>
          <li>타인의 개인정보를 침해하는 내용</li>
          <li>축구·스포츠와 무관한 내용</li>
        </ul>
        <p className="mt-3">
          위반 콘텐츠 삭제 및 계정 정지·해지는 회사의 단독 판단에 따라 결정됩니다.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3">제6조 (지식재산권)</h2>
        <p>
          서비스 및 그 콘텐츠(이용자 콘텐츠 제외), 기능, 기술은 킥비스타의 독점 재산입니다.
          축구 데이터는 제3자 API를 통해 제공되며 해당 제공사의 이용약관이 적용됩니다.
          사전 서면 동의 없이 킥비스타의 상표·트레이드드레스를 사용할 수 없습니다.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3">제7조 (광고)</h2>
        <p>
          서비스에는 <strong>Google AdSense</strong> 등 제3자 광고 네트워크의 광고가 게재될 수 있습니다.
          회사는 해당 광고의 내용에 대해 책임을 지지 않습니다. 광고 클릭 시 이동하는 외부 사이트는
          해당 사이트의 약관 및 개인정보처리방침이 적용됩니다.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3">제8조 (출석 포인트 시스템)</h2>
        <p>
          출석 체크 및 포인트 시스템은 서비스 참여를 위한 기능으로, 어떠한 금전적 가치도 없습니다.
          포인트, 뱃지, 등급은 서비스 내에서만 사용되며 현금으로 전환하거나 외부로 이전할 수 없습니다.
          회사는 사전 통보 없이 포인트 시스템을 변경, 중단, 종료할 권리를 보유합니다.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3">제9조 (서비스 보증의 부인)</h2>
        <p>
          서비스는 어떠한 명시적·묵시적 보증 없이 &ldquo;있는 그대로&rdquo; 제공됩니다. 스코어,
          순위, 일정 등 스포츠 데이터는 정보 제공 목적으로만 제공되며 오류가 포함될 수 있습니다.
          재정적·베팅 등 중요한 결정의 근거로 활용하지 마십시오.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3">제10조 (책임 제한)</h2>
        <p>
          관련 법령이 허용하는 최대 범위 내에서, 킥비스타는 서비스 이용으로 인한 간접적·부수적·특별·
          결과적 손해에 대해 책임을 지지 않습니다. 이용자에 대한 총 책임은 100,000원을 초과하지 않습니다.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3">제11조 (계정 해지)</h2>
        <p>
          회사는 본 약관을 위반하거나 타 이용자·회사·제3자에게 해를 끼치는 행위에 대해 사전 통보 없이
          계정을 정지하거나 해지할 수 있습니다. 이용자는 언제든지 탈퇴를 요청할 수 있습니다.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3">제12조 (준거법 및 관할)</h2>
        <p>
          본 약관은 대한민국 법률에 따라 해석됩니다. 약관과 관련한 분쟁은 대한민국 서울 소재 법원을
          전속 관할 법원으로 합니다.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3">제13조 (약관 변경)</h2>
        <p>
          회사는 약관을 언제든지 변경할 수 있으며, 중요한 변경 시 상단의 &lsquo;최종 업데이트&rsquo;
          날짜를 갱신하여 공지합니다. 변경 후 서비스 계속 이용 시 변경된 약관에 동의한 것으로 봅니다.
        </p>
      </section>
    </div>
  );
}
