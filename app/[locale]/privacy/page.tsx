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
    title: loc === "ko" ? "개인정보처리방침" : "Privacy Policy",
    description:
      loc === "ko"
        ? "킥비스타가 수집하는 정보, 사용 방법 및 개인정보 보호 방식에 대해 설명합니다."
        : "Learn how KickVista collects, uses, and protects your personal information.",
    path: "/privacy",
  });
}

export default async function PrivacyPage({
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
            <span className="text-gray-600">{isKo ? "개인정보처리방침" : "Privacy Policy"}</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">
            {isKo ? "개인정보처리방침" : "Privacy Policy"}
          </h1>
          <p className="text-sm text-gray-400">
            {isKo ? `최종 업데이트: ${LAST_UPDATED}` : `Last updated: ${LAST_UPDATED}`}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
          <div className="p-8 sm:p-10 prose prose-gray max-w-none">
            {isKo ? <KoContent /> : <EnContent />}
          </div>
        </div>

        {/* Contact box */}
        <div className="mt-8 bg-emerald-50 border border-emerald-200 rounded-xl px-6 py-5">
          <p className="text-sm font-semibold text-emerald-800 mb-1">
            {isKo ? "개인정보 관련 문의" : "Privacy Inquiries"}
          </p>
          <p className="text-sm text-emerald-700">
            {isKo
              ? "개인정보 처리에 관한 문의사항은 아래 이메일로 연락해 주세요."
              : "For any questions about our privacy practices, please contact us at:"}
          </p>
          <a
            href="mailto:privacy@kickvista.io"
            className="text-sm font-bold text-emerald-700 hover:text-emerald-900 transition-colors mt-1 inline-block"
          >
            privacy@kickvista.io
          </a>
        </div>
      </div>
    </main>
  );
}

// ─── English Content ──────────────────────────────────────────────────────────

function EnContent() {
  return (
    <div className="space-y-8 text-sm leading-relaxed text-gray-700">
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3">1. Introduction</h2>
        <p>
          KickVista (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) operates the website
          kickvista.io (the &ldquo;Service&rdquo;). This Privacy Policy explains how we collect, use,
          disclose, and safeguard your information when you visit our website. Please read this policy
          carefully. If you disagree with any part of it, please discontinue use of the Service.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3">2. Information We Collect</h2>
        <p className="mb-2"><strong>Information you provide directly:</strong></p>
        <ul className="list-disc pl-5 space-y-1 mb-4">
          <li>Account registration data (email address, nickname)</li>
          <li>Community posts and comments you submit</li>
          <li>Profile preferences such as favourite league</li>
        </ul>
        <p className="mb-2"><strong>Information collected automatically:</strong></p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Log data: IP address, browser type, pages visited, time and date of visit</li>
          <li>Device information: hardware model, operating system, unique device identifiers</li>
          <li>Cookies and similar tracking technologies (see Section 5)</li>
          <li>Usage data: attendance check-in activity, pages viewed, features used</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3">3. How We Use Your Information</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>To provide, operate, and maintain the Service</li>
          <li>To manage your account and track attendance points</li>
          <li>To send service-related notifications (account security, feature updates)</li>
          <li>To personalise your experience based on your league and team preferences</li>
          <li>To analyse aggregate usage patterns and improve the Service</li>
          <li>To comply with legal obligations</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3">4. Sharing of Information</h2>
        <p className="mb-3">
          We do <strong>not</strong> sell your personal data. We may share information with:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Service providers</strong> — Supabase (authentication &amp; database hosting),
            Vercel (hosting), and other infrastructure partners who process data on our behalf under
            strict confidentiality agreements.
          </li>
          <li>
            <strong>Analytics providers</strong> — Aggregated, anonymised data to understand traffic
            patterns (e.g. Vercel Analytics).
          </li>
          <li>
            <strong>Law enforcement</strong> — When required by applicable law, court order, or
            governmental authority.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3">5. Cookies &amp; Advertising</h2>
        <p className="mb-3">
          We use cookies and similar technologies to operate and improve the Service. This includes:
        </p>
        <ul className="list-disc pl-5 space-y-1 mb-3">
          <li><strong>Essential cookies</strong> — required for authentication and session management.</li>
          <li><strong>Preference cookies</strong> — remember your locale and display settings.</li>
          <li>
            <strong>Advertising cookies</strong> — we use <strong>Google AdSense</strong> to display
            advertisements. Google may use cookies to serve ads based on your prior visits to this
            site and other sites on the internet. You can opt out of personalised advertising by
            visiting{" "}
            <a
              href="https://www.google.com/settings/ads"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 hover:underline"
            >
              Google Ads Settings
            </a>
            .
          </li>
        </ul>
        <p>
          For more information on how Google uses data from sites that use its advertising services,
          visit{" "}
          <a
            href="https://policies.google.com/technologies/partner-sites"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-600 hover:underline"
          >
            policies.google.com/technologies/partner-sites
          </a>
          .
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3">6. Data Retention</h2>
        <p>
          We retain your personal data for as long as your account is active or as needed to provide
          the Service. You may request deletion of your account and associated data at any time by
          contacting <a href="mailto:privacy@kickvista.io" className="text-emerald-600 hover:underline">privacy@kickvista.io</a>.
          Aggregated, anonymised data may be retained indefinitely for analytical purposes.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3">7. Your Rights</h2>
        <p className="mb-3">
          Depending on your jurisdiction, you may have the following rights regarding your personal data:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Access</strong> — request a copy of the personal data we hold about you.</li>
          <li><strong>Correction</strong> — request that we correct inaccurate or incomplete data.</li>
          <li><strong>Deletion</strong> — request that we delete your personal data (&ldquo;right to be forgotten&rdquo;).</li>
          <li><strong>Portability</strong> — receive your data in a structured, machine-readable format.</li>
          <li><strong>Objection</strong> — object to the processing of your data for direct marketing purposes.</li>
          <li><strong>Withdrawal of consent</strong> — withdraw consent at any time where processing is based on consent.</li>
        </ul>
        <p className="mt-3">
          Korean residents also have rights under the <em>Personal Information Protection Act (PIPA)</em>{" "}
          including the right to inspect, correct, delete, and suspend processing of your personal information.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3">8. Children&apos;s Privacy</h2>
        <p>
          The Service is not directed to children under the age of 14. We do not knowingly collect
          personal information from children under 14. If you believe we have inadvertently collected
          such information, please contact us immediately and we will delete it promptly.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3">9. Security</h2>
        <p>
          We implement industry-standard security measures including HTTPS encryption, hashed
          password storage, and role-based access controls. However, no method of transmission over
          the internet is 100% secure, and we cannot guarantee absolute security.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3">10. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify you of any material
          changes by updating the &ldquo;Last updated&rdquo; date at the top of this page. Continued
          use of the Service after changes constitutes acceptance of the revised policy.
        </p>
      </section>
    </div>
  );
}

// ─── Korean Content ───────────────────────────────────────────────────────────

function KoContent() {
  return (
    <div className="space-y-8 text-sm leading-relaxed text-gray-700">
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3">1. 개요</h2>
        <p>
          킥비스타(KickVista, 이하 &lsquo;회사&rsquo;)는 kickvista.io 웹사이트(이하 &lsquo;서비스&rsquo;)를 운영합니다.
          본 개인정보처리방침은 서비스 이용 시 회사가 수집·이용·보호하는 개인정보에 대해 설명합니다.
          본 방침에 동의하지 않는 경우 서비스 이용을 중단하여 주시기 바랍니다.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3">2. 수집하는 개인정보</h2>
        <p className="mb-2"><strong>직접 제공하는 정보:</strong></p>
        <ul className="list-disc pl-5 space-y-1 mb-4">
          <li>회원가입 정보 (이메일 주소, 닉네임)</li>
          <li>커뮤니티에 작성한 게시글 및 댓글</li>
          <li>좋아하는 리그 등 프로필 설정 정보</li>
        </ul>
        <p className="mb-2"><strong>자동으로 수집되는 정보:</strong></p>
        <ul className="list-disc pl-5 space-y-1">
          <li>로그 데이터: IP 주소, 브라우저 유형, 방문 페이지, 접속 일시</li>
          <li>기기 정보: 하드웨어 모델, 운영체제, 고유 기기 식별자</li>
          <li>쿠키 및 유사 추적 기술 (제5조 참조)</li>
          <li>이용 데이터: 출석 체크 활동, 조회 페이지, 이용 기능</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3">3. 개인정보 이용 목적</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>서비스 제공, 운영 및 유지관리</li>
          <li>계정 관리 및 출석 포인트 적립</li>
          <li>서비스 관련 알림 발송 (계정 보안, 기능 업데이트)</li>
          <li>리그 및 팀 선호도 기반 개인화 서비스 제공</li>
          <li>집계된 이용 패턴 분석 및 서비스 개선</li>
          <li>법적 의무 이행</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3">4. 개인정보 제공 및 위탁</h2>
        <p className="mb-3">
          회사는 이용자의 개인정보를 <strong>판매하지 않습니다</strong>. 다음의 경우에 한해 제공될 수 있습니다:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>서비스 제공업체</strong> — Supabase(인증 및 데이터베이스 호스팅), Vercel(호스팅) 등
            비밀유지 계약 하에 서비스 운영을 지원하는 파트너사
          </li>
          <li>
            <strong>분석 서비스</strong> — 트래픽 패턴 파악을 위한 집계·익명화된 데이터 제공
          </li>
          <li>
            <strong>수사기관 등</strong> — 관련 법령, 법원 명령 또는 정부 기관의 요청에 따른 경우
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3">5. 쿠키 및 광고</h2>
        <p className="mb-3">
          서비스 운영 및 개선을 위해 쿠키 및 유사 기술을 사용합니다:
        </p>
        <ul className="list-disc pl-5 space-y-1 mb-3">
          <li><strong>필수 쿠키</strong> — 인증 및 세션 관리에 필요</li>
          <li><strong>설정 쿠키</strong> — 언어 설정 등 이용자 환경 저장</li>
          <li>
            <strong>광고 쿠키</strong> — 회사는 <strong>Google AdSense</strong>를 통해 광고를 게재합니다.
            Google은 쿠키를 활용하여 이전 방문 기록을 기반으로 관심 기반 광고를 제공할 수 있습니다.
            맞춤 광고는{" "}
            <a
              href="https://www.google.com/settings/ads"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 hover:underline"
            >
              Google 광고 설정
            </a>
            에서 거부하실 수 있습니다.
          </li>
        </ul>
        <p>
          Google의 광고 서비스 관련 데이터 사용 방식은{" "}
          <a
            href="https://policies.google.com/technologies/partner-sites"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-600 hover:underline"
          >
            policies.google.com/technologies/partner-sites
          </a>
          에서 확인하실 수 있습니다.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3">6. 개인정보 보유 기간</h2>
        <p>
          회원 탈퇴 시 또는 이용자의 삭제 요청 시 개인정보를 파기합니다.
          계정 및 관련 데이터 삭제를 원하시면{" "}
          <a href="mailto:privacy@kickvista.io" className="text-emerald-600 hover:underline">privacy@kickvista.io</a>로
          문의해 주세요. 집계·익명화된 데이터는 분석 목적으로 보존될 수 있습니다.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3">7. 이용자의 권리 (개인정보보호법)</h2>
        <p className="mb-3">이용자는 개인정보보호법에 따라 다음의 권리를 행사할 수 있습니다:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>열람권</strong> — 보유 중인 개인정보 열람 요청</li>
          <li><strong>정정권</strong> — 부정확하거나 불완전한 정보의 수정 요청</li>
          <li><strong>삭제권</strong> — 개인정보 삭제 요청</li>
          <li><strong>처리정지권</strong> — 개인정보 처리의 정지 요청</li>
          <li><strong>이동권</strong> — 구조화된 형태로 개인정보 이전 요청</li>
        </ul>
        <p className="mt-3">
          위 권리 행사는 <a href="mailto:privacy@kickvista.io" className="text-emerald-600 hover:underline">privacy@kickvista.io</a>로
          서면 요청 바랍니다. 개인정보 침해 관련 신고·상담은{" "}
          <a href="https://www.privacy.go.kr" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">개인정보보호위원회</a>
          {" "}또는{" "}
          <a href="https://privacy.kisa.or.kr" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">한국인터넷진흥원(KISA)</a>에
          문의하실 수 있습니다.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3">8. 아동 개인정보 보호</h2>
        <p>
          서비스는 만 14세 미만 아동을 대상으로 하지 않으며, 만 14세 미만의 개인정보를 고의로 수집하지
          않습니다. 아동의 정보가 수집된 것으로 판단될 경우 즉시 삭제 조치를 취합니다.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3">9. 보안</h2>
        <p>
          HTTPS 암호화, 비밀번호 해시 처리, 접근 권한 관리 등 업계 표준 보안 조치를 시행합니다.
          그러나 인터넷을 통한 전송은 완전히 안전하지 않을 수 있음을 유의해 주시기 바랍니다.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3">10. 방침 변경</h2>
        <p>
          본 방침은 수시로 변경될 수 있습니다. 중요한 변경 시 상단의 &lsquo;최종 업데이트&rsquo; 날짜를
          업데이트하여 공지합니다. 변경 후에도 서비스를 계속 이용하시면 변경된 방침에 동의한 것으로
          간주됩니다.
        </p>
      </section>
    </div>
  );
}
