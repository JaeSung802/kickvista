"use client";

import { useState } from "react";
import { createPost } from "@/lib/community/actions";
import type { PostCategory } from "@/lib/community/types";

interface WritePostFormProps {
  locale: "ko" | "en";
  userNickname: string;
  userBadge: string;
  teamSlug?: string | null;
  leagueSlug?: string | null;
  backHref?: string;
  isAdmin?: boolean;
  initialCategory?: string | null;
}

const CATEGORY_META: Record<
  PostCategory,
  { labelEn: string; labelKo: string; color: string; bg: string; border: string }
> = {
  "match-discussion": { labelEn: "Match Discussion", labelKo: "경기 토론",   color: "#059669", bg: "#ecfdf5", border: "#a7f3d0" },
  "transfer-news":    { labelEn: "Transfer News",    labelKo: "이적 뉴스",   color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  "tactics":          { labelEn: "Tactics",          labelKo: "전술 분석",   color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  "highlights":       { labelEn: "Highlights",       labelKo: "하이라이트",  color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
  "predictions":      { labelEn: "Predictions",      labelKo: "예측",        color: "#0891b2", bg: "#ecfeff", border: "#a5f3fc" },
  "general":          { labelEn: "General",          labelKo: "일반",        color: "#6b7280", bg: "#f9fafb", border: "#e5e7eb" },
  "notice":           { labelEn: "Notice",           labelKo: "공지사항",    color: "#b45309", bg: "#fefce8", border: "#fde68a" },
  "worldcup-2026":    { labelEn: "2026 World Cup",   labelKo: "2026 월드컵", color: "#dc2626", bg: "#fef2f2", border: "#fca5a5" },
};

const BASE_CATEGORIES: PostCategory[] = [
  "match-discussion", "transfer-news", "tactics", "highlights", "predictions", "general",
];

const labels = {
  en: {
    categoryLabel: "Category",
    titleLabel: "Title",
    titlePlaceholder: "What's on your mind? (5–120 characters)",
    contentLabel: "Content",
    contentPlaceholder: "Share your analysis, opinion, or news...",
    tagsLabel: "Tags",
    tagsPlaceholder: "e.g. Arsenal, Premier League (comma-separated)",
    submit: "Publish Post",
    cancel: "Cancel",
    charCount: "characters",
    required: "This field is required",
    successTitle: "Post published!",
    successBody: "Your post is now live in the community.",
    viewPost: "View Post",
    backToCommunity: "Back to Community",
    guidelines: "Posting Guidelines",
    guidelineItems: [
      "Be respectful and constructive",
      "Stay on topic — football related only",
      "No spam, no self-promotion links",
      "Cite sources for factual claims",
      "English or Korean only",
    ],
    serverError: "Failed to publish. Please try again.",
  },
  ko: {
    categoryLabel: "카테고리",
    titleLabel: "제목",
    titlePlaceholder: "어떤 이야기를 하고 싶으신가요? (5~120자)",
    contentLabel: "내용",
    contentPlaceholder: "분석, 의견 또는 뉴스를 공유하세요...",
    tagsLabel: "태그",
    tagsPlaceholder: "예: 아스날, 프리미어리그 (쉼표로 구분)",
    submit: "게시글 발행",
    cancel: "취소",
    charCount: "자",
    required: "필수 항목입니다",
    successTitle: "게시글이 발행되었습니다!",
    successBody: "게시글이 커뮤니티에 게시되었습니다.",
    viewPost: "게시글 보기",
    backToCommunity: "커뮤니티로 돌아가기",
    guidelines: "작성 가이드",
    guidelineItems: [
      "서로 존중하고 건설적으로 작성하세요",
      "주제에 맞는 내용 — 축구 관련만",
      "스팸, 홍보 링크 금지",
      "사실 주장 시 출처를 명시하세요",
      "한국어 또는 영어만 사용",
    ],
    serverError: "게시에 실패했습니다. 다시 시도해 주세요.",
  },
};

const inputCls = "w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-colors";
const labelCls = "text-xs font-bold uppercase tracking-wider text-gray-500";

export default function WritePostForm({ locale, userNickname, userBadge, teamSlug, leagueSlug, backHref, isAdmin, initialCategory }: WritePostFormProps) {
  const tx = labels[locale];
  const ALL_CATEGORIES: PostCategory[] = isAdmin
    ? [...BASE_CATEGORIES, "notice"]
    : BASE_CATEGORIES;

  const resolvedInitial = (
    initialCategory && Object.keys(CATEGORY_META).includes(initialCategory)
      ? initialCategory as PostCategory
      : null
  );

  const [category, setCategory]   = useState<PostCategory | null>(resolvedInitial);
  const [titleText, setTitle]     = useState("");
  const [content, setContent]     = useState("");
  const [tags, setTags]           = useState("");
  const [mode, setMode]           = useState<"edit" | "preview">("edit");
  const [loading, setLoading]     = useState(false);
  const [newPostId, setNewPostId] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [errors, setErrors]       = useState<{ category?: boolean; title?: boolean; content?: boolean }>({});

  const titleLen   = titleText.length;
  const contentLen = content.length;
  const canSubmit  = !loading && !!category && titleText.trim().length >= 5 && content.trim().length >= 20;

  function validate() {
    const errs: typeof errors = {};
    if (!category)                    errs.category = true;
    if (titleText.trim().length < 5)  errs.title    = true;
    if (content.trim().length < 20)   errs.content  = true;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!validate() || !category) return;
    setLoading(true);
    setServerError(null);

    const result = await createPost({
      category,
      title:      titleText,
      content,
      tags:       tags.split(",").map((t) => t.trim()).filter(Boolean),
      teamSlug:   teamSlug ?? null,
      leagueSlug: leagueSlug ?? null,
    });

    setLoading(false);

    if (result.error) {
      setServerError(tx.serverError);
      return;
    }

    setNewPostId(result.id!);
  }

  // ─── Success screen ───────────────────────────────────────────────────────
  if (newPostId) {
    return (
      <div className="bg-white border border-emerald-200 rounded-2xl p-12 text-center max-w-xl mx-auto">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-xl font-extrabold text-emerald-600 mb-2">{tx.successTitle}</h2>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">{tx.successBody}</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <a
            href={`/${locale}/community/post/${newPostId}`}
            className="inline-block px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg no-underline transition-colors"
          >
            {tx.viewPost}
          </a>
          <a
            href={`/${locale}/community`}
            className="inline-block px-6 py-2.5 bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 text-sm font-semibold rounded-lg no-underline transition-colors"
          >
            {tx.backToCommunity}
          </a>
        </div>
      </div>
    );
  }

  const selectedMeta = category ? CATEGORY_META[category] : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      {/* Main form — 2/3 */}
      <div className="lg:col-span-2 flex flex-col gap-6">

        {/* Author info */}
        <div className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-xl">
          <div className="w-9 h-9 rounded-full bg-gray-50 border-2 border-emerald-500 flex items-center justify-center text-lg shrink-0">
            {userBadge}
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900">{userNickname}</div>
            <div className="text-xs text-gray-400">
              {locale === "ko" ? "게시글 작성 중" : "Writing a post"}
            </div>
          </div>
        </div>

        {/* Form card */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {/* Edit / Preview tabs */}
          <div className="flex border-b border-gray-200 bg-gray-50">
            {(["edit", "preview"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
                  mode === m
                    ? "bg-white text-gray-900 border-emerald-600"
                    : "text-gray-500 border-transparent hover:text-gray-700"
                }`}
              >
                {m === "edit"
                  ? (locale === "ko" ? "작성" : "Write")
                  : (locale === "ko" ? "미리보기" : "Preview")}
              </button>
            ))}
          </div>

          <div className="p-6">
            {mode === "preview" ? (
              /* Preview mode */
              <div className="flex flex-col gap-4">
                {selectedMeta && (
                  <span
                    className="inline-block text-xs font-semibold rounded-md px-2.5 py-1"
                    style={{ color: selectedMeta.color, backgroundColor: selectedMeta.bg, border: `1px solid ${selectedMeta.border}` }}
                  >
                    {locale === "ko" ? CATEGORY_META[category!].labelKo : CATEGORY_META[category!].labelEn}
                  </span>
                )}
                <h1 className="text-xl font-extrabold text-gray-900 leading-snug">
                  {titleText || (locale === "ko" ? "(제목 없음)" : "(No title)")}
                </h1>
                <div className="flex flex-col gap-4">
                  {(content || "").split("\n\n").filter(Boolean).map((para, idx) => (
                    <p key={idx} className="text-sm text-gray-700 leading-relaxed">
                      {para}
                    </p>
                  ))}
                </div>
                {tags && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {tags.split(",").map((t) => t.trim()).filter(Boolean).map((tag) => (
                      <span key={tag} className="text-xs text-gray-500 bg-gray-100 border border-gray-200 rounded px-2.5 py-0.5">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Edit mode */
              <div className="flex flex-col gap-5">

                {/* Category */}
                <div>
                  <label className={`${labelCls} block mb-2.5`}>
                    {tx.categoryLabel} <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ALL_CATEGORIES.map((cat) => {
                      const m        = CATEGORY_META[cat];
                      const selected = category === cat;
                      return (
                        <button
                          key={cat}
                          onClick={() => { setCategory(cat); setErrors((e) => ({ ...e, category: false })); }}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all border"
                          style={{
                            backgroundColor: selected ? m.bg : "transparent",
                            color: selected ? m.color : "#6b7280",
                            borderColor: selected ? m.border : "#e5e7eb",
                          }}
                        >
                          {locale === "ko" ? m.labelKo : m.labelEn}
                        </button>
                      );
                    })}
                  </div>
                  {errors.category && <p className="text-xs text-red-500 mt-1.5">{tx.required}</p>}
                </div>

                {/* Title */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className={labelCls}>
                      {tx.titleLabel} <span className="text-red-500">*</span>
                    </label>
                    <span className={`text-xs ${titleLen > 100 ? "text-red-500" : "text-gray-400"}`}>
                      {titleLen}/120 {tx.charCount}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={titleText}
                    onChange={(e) => { setTitle(e.target.value.slice(0, 120)); setErrors((er) => ({ ...er, title: false })); }}
                    placeholder={tx.titlePlaceholder}
                    className={`${inputCls} ${errors.title ? "border-red-400 focus:border-red-400 focus:ring-red-100" : ""}`}
                  />
                  {errors.title && <p className="text-xs text-red-500 mt-1.5">{tx.required}</p>}
                </div>

                {/* Content */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className={labelCls}>
                      {tx.contentLabel} <span className="text-red-500">*</span>
                    </label>
                    <span className={`text-xs ${contentLen > 4500 ? "text-amber-500" : "text-gray-400"}`}>
                      {contentLen} {tx.charCount}
                    </span>
                  </div>
                  <textarea
                    value={content}
                    onChange={(e) => { setContent(e.target.value); setErrors((er) => ({ ...er, content: false })); }}
                    placeholder={tx.contentPlaceholder}
                    rows={12}
                    className={`${inputCls} resize-vertical leading-relaxed ${errors.content ? "border-red-400 focus:border-red-400 focus:ring-red-100" : ""}`}
                  />
                  {errors.content && <p className="text-xs text-red-500 mt-1.5">{tx.required}</p>}
                </div>

                {/* Tags */}
                <div>
                  <label className={`${labelCls} block mb-2`}>{tx.tagsLabel}</label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder={tx.tagsPlaceholder}
                    className={inputCls}
                  />
                </div>

                {/* Server error */}
                {serverError && (
                  <p className="text-sm text-red-500">⚠ {serverError}</p>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
                  <a
                    href={backHref ?? `/${locale}/community`}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 border border-gray-200 rounded-lg px-4 py-2.5 hover:bg-gray-50 transition-colors no-underline"
                  >
                    ← {tx.cancel}
                  </a>
                  <button
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                      canSubmit
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {loading
                      ? (locale === "ko" ? "발행 중..." : "Publishing...")
                      : `✏️ ${tx.submit}`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar — 1/3 */}
      <div className="flex flex-col gap-4">
        {/* Guidelines */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide">
              📋 {tx.guidelines}
            </h3>
          </div>
          <div className="px-4 py-3.5">
            <ol className="flex flex-col gap-2 pl-4 list-decimal">
              {tx.guidelineItems.map((item, idx) => (
                <li key={idx} className="text-xs text-gray-500 leading-relaxed">{item}</li>
              ))}
            </ol>
          </div>
        </div>

        {/* Tag preview */}
        {tags && (
          <div className="bg-white border border-gray-200 rounded-xl px-4 py-3.5">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2.5">
              {locale === "ko" ? "태그 미리보기" : "Tag Preview"}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {tags.split(",").map((t) => t.trim()).filter(Boolean).map((tag) => (
                <span
                  key={tag}
                  className="text-xs text-gray-500 bg-gray-100 border border-gray-200 rounded px-2.5 py-0.5"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Moderation notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3.5 flex gap-2.5 items-start">
          <span className="text-base shrink-0">⚠️</span>
          <p className="text-xs text-amber-700 leading-relaxed">
            {locale === "ko"
              ? "게시글은 커뮤니티 가이드라인 준수 여부를 검토한 후 게시됩니다."
              : "Posts are reviewed for compliance with community guidelines before publishing."}
          </p>
        </div>
      </div>
    </div>
  );
}
