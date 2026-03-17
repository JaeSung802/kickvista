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
}

const CATEGORY_META: Record<
  PostCategory,
  { labelEn: string; labelKo: string; color: string; bg: string; border: string }
> = {
  "match-discussion": { labelEn: "Match Discussion", labelKo: "경기 토론",   color: "#22c55e", bg: "rgba(34,197,94,0.1)",   border: "rgba(34,197,94,0.3)"   },
  "transfer-news":    { labelEn: "Transfer News",    labelKo: "이적 뉴스",   color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.3)"  },
  "tactics":          { labelEn: "Tactics",          labelKo: "전술 분석",   color: "#8b5cf6", bg: "rgba(139,92,246,0.1)",  border: "rgba(139,92,246,0.3)"  },
  "highlights":       { labelEn: "Highlights",       labelKo: "하이라이트",  color: "#ef4444", bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.3)"   },
  "predictions":      { labelEn: "Predictions",      labelKo: "예측",        color: "#06b6d4", bg: "rgba(6,182,212,0.1)",   border: "rgba(6,182,212,0.3)"   },
  "general":          { labelEn: "General",          labelKo: "일반",        color: "#8b949e", bg: "rgba(139,148,158,0.1)", border: "rgba(139,148,158,0.3)" },
};

const ALL_CATEGORIES: PostCategory[] = [
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

export default function WritePostForm({ locale, userNickname, userBadge, teamSlug, leagueSlug, backHref }: WritePostFormProps) {
  const tx = labels[locale];

  const [category, setCategory]   = useState<PostCategory | null>(null);
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
      <div
        style={{
          backgroundColor: "#161b22", border: "1px solid rgba(34,197,94,0.3)",
          borderRadius: 12, padding: "48px 28px", textAlign: "center",
          maxWidth: 540, margin: "0 auto",
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
        <h2 style={{ color: "#22c55e", fontSize: 20, fontWeight: 800, margin: "0 0 10px" }}>
          {tx.successTitle}
        </h2>
        <p style={{ color: "#8b949e", fontSize: 14, margin: "0 0 24px", lineHeight: 1.6 }}>
          {tx.successBody}
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <a
            href={`/${locale}/community/post/${newPostId}`}
            style={{
              display: "inline-block", padding: "10px 24px",
              backgroundColor: "#22c55e", color: "#0d1117",
              fontSize: 14, fontWeight: 700, borderRadius: 8, textDecoration: "none",
            }}
          >
            {tx.viewPost}
          </a>
          <a
            href={`/${locale}/community`}
            style={{
              display: "inline-block", padding: "10px 24px",
              backgroundColor: "transparent", color: "#8b949e",
              border: "1px solid #30363d",
              fontSize: 14, fontWeight: 600, borderRadius: 8, textDecoration: "none",
            }}
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
        <div
          style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "14px 18px", backgroundColor: "#161b22",
            border: "1px solid #30363d", borderRadius: 10,
          }}
        >
          <div
            style={{
              width: 36, height: 36, borderRadius: "50%",
              backgroundColor: "#0d1117", border: "2px solid #22c55e",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, flexShrink: 0,
            }}
          >
            {userBadge}
          </div>
          <div>
            <div style={{ color: "#e6edf3", fontSize: 13, fontWeight: 700 }}>{userNickname}</div>
            <div style={{ color: "#8b949e", fontSize: 11 }}>
              {locale === "ko" ? "게시글 작성 중" : "Writing a post"}
            </div>
          </div>
        </div>

        {/* Form card */}
        <div
          style={{
            backgroundColor: "#161b22", border: "1px solid #30363d",
            borderRadius: 12, overflow: "hidden",
          }}
        >
          {/* Edit / Preview tabs */}
          <div style={{ display: "flex", borderBottom: "1px solid #21262d", backgroundColor: "#0d1117" }}>
            {(["edit", "preview"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  padding: "12px 20px", fontSize: 13, fontWeight: 600,
                  border: "none", cursor: "pointer",
                  backgroundColor: mode === m ? "#161b22" : "transparent",
                  color: mode === m ? "#e6edf3" : "#8b949e",
                  borderBottom: mode === m ? "2px solid #22c55e" : "2px solid transparent",
                  transition: "color 0.15s",
                }}
              >
                {m === "edit"
                  ? (locale === "ko" ? "작성" : "Write")
                  : (locale === "ko" ? "미리보기" : "Preview")}
              </button>
            ))}
          </div>

          <div style={{ padding: "24px" }}>
            {mode === "preview" ? (
              /* Preview mode */
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {selectedMeta && (
                  <span
                    style={{
                      display: "inline-block", fontSize: 11, fontWeight: 600,
                      color: selectedMeta.color, backgroundColor: selectedMeta.bg,
                      border: `1px solid ${selectedMeta.border}`,
                      borderRadius: 5, padding: "3px 10px",
                    }}
                  >
                    {locale === "ko"
                      ? CATEGORY_META[category!].labelKo
                      : CATEGORY_META[category!].labelEn}
                  </span>
                )}
                <h1 style={{ color: "#e6edf3", fontSize: 20, fontWeight: 800, margin: 0, lineHeight: 1.4 }}>
                  {titleText || (locale === "ko" ? "(제목 없음)" : "(No title)")}
                </h1>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {(content || "").split("\n\n").filter(Boolean).map((para, idx) => (
                    <p key={idx} style={{ color: "#c9d1d9", fontSize: 15, lineHeight: 1.85, margin: 0 }}>
                      {para}
                    </p>
                  ))}
                </div>
                {tags && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                    {tags.split(",").map((t) => t.trim()).filter(Boolean).map((tag) => (
                      <span
                        key={tag}
                        style={{
                          fontSize: 11, color: "#8b949e",
                          backgroundColor: "#0d1117", border: "1px solid #30363d",
                          borderRadius: 5, padding: "3px 10px",
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Edit mode */
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                {/* Category */}
                <div>
                  <label style={{ color: "#8b949e", fontSize: 12, fontWeight: 600,
                    textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 10 }}>
                    {tx.categoryLabel} <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                    {ALL_CATEGORIES.map((cat) => {
                      const m        = CATEGORY_META[cat];
                      const selected = category === cat;
                      return (
                        <button
                          key={cat}
                          onClick={() => { setCategory(cat); setErrors((e) => ({ ...e, category: false })); }}
                          style={{
                            padding: "7px 14px", borderRadius: 8, fontSize: 12,
                            fontWeight: 600, cursor: "pointer",
                            backgroundColor: selected ? m.bg : "transparent",
                            color: selected ? m.color : "#8b949e",
                            border: selected ? `1px solid ${m.border}` : "1px solid #30363d",
                            transition: "all 0.15s",
                          }}
                        >
                          {locale === "ko" ? m.labelKo : m.labelEn}
                        </button>
                      );
                    })}
                  </div>
                  {errors.category && (
                    <p style={{ color: "#ef4444", fontSize: 11, marginTop: 6 }}>{tx.required}</p>
                  )}
                </div>

                {/* Title */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <label style={{ color: "#8b949e", fontSize: 12, fontWeight: 600,
                      textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {tx.titleLabel} <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <span style={{ color: titleLen > 100 ? "#ef4444" : "#484f58", fontSize: 11 }}>
                      {titleLen}/120 {tx.charCount}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={titleText}
                    onChange={(e) => { setTitle(e.target.value.slice(0, 120)); setErrors((er) => ({ ...er, title: false })); }}
                    placeholder={tx.titlePlaceholder}
                    style={{
                      width: "100%", padding: "11px 14px",
                      backgroundColor: "#0d1117",
                      border: `1px solid ${errors.title ? "#ef4444" : "#30363d"}`,
                      borderRadius: 8, color: "#e6edf3", fontSize: 14,
                      outline: "none", boxSizing: "border-box", transition: "border-color 0.15s",
                    }}
                    onFocus={(e) => { if (!errors.title) e.currentTarget.style.borderColor = "rgba(34,197,94,0.4)"; }}
                    onBlur={(e)  => { if (!errors.title) e.currentTarget.style.borderColor = "#30363d"; }}
                  />
                  {errors.title && (
                    <p style={{ color: "#ef4444", fontSize: 11, marginTop: 6 }}>{tx.required}</p>
                  )}
                </div>

                {/* Content */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <label style={{ color: "#8b949e", fontSize: 12, fontWeight: 600,
                      textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {tx.contentLabel} <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <span style={{ color: contentLen > 4500 ? "#f59e0b" : "#484f58", fontSize: 11 }}>
                      {contentLen} {tx.charCount}
                    </span>
                  </div>
                  <textarea
                    value={content}
                    onChange={(e) => { setContent(e.target.value); setErrors((er) => ({ ...er, content: false })); }}
                    placeholder={tx.contentPlaceholder}
                    rows={12}
                    style={{
                      width: "100%", padding: "12px 14px",
                      backgroundColor: "#0d1117",
                      border: `1px solid ${errors.content ? "#ef4444" : "#30363d"}`,
                      borderRadius: 8, color: "#e6edf3", fontSize: 14,
                      resize: "vertical", outline: "none", fontFamily: "inherit",
                      lineHeight: 1.65, boxSizing: "border-box", transition: "border-color 0.15s",
                    }}
                    onFocus={(e) => { if (!errors.content) e.currentTarget.style.borderColor = "rgba(34,197,94,0.4)"; }}
                    onBlur={(e)  => { if (!errors.content) e.currentTarget.style.borderColor = "#30363d"; }}
                  />
                  {errors.content && (
                    <p style={{ color: "#ef4444", fontSize: 11, marginTop: 6 }}>{tx.required}</p>
                  )}
                </div>

                {/* Tags */}
                <div>
                  <label style={{ color: "#8b949e", fontSize: 12, fontWeight: 600,
                    textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 8 }}>
                    {tx.tagsLabel}
                  </label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder={tx.tagsPlaceholder}
                    style={{
                      width: "100%", padding: "11px 14px",
                      backgroundColor: "#0d1117",
                      border: "1px solid #30363d",
                      borderRadius: 8, color: "#e6edf3", fontSize: 14,
                      outline: "none", boxSizing: "border-box", transition: "border-color 0.15s",
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(34,197,94,0.4)"; }}
                    onBlur={(e)  => { e.currentTarget.style.borderColor = "#30363d"; }}
                  />
                </div>

                {/* Server error */}
                {serverError && (
                  <p style={{ color: "#ef4444", fontSize: 13, margin: 0 }}>⚠ {serverError}</p>
                )}

                {/* Actions */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, paddingTop: 4 }}>
                  <a
                    href={backHref ?? `/${locale}/community`}
                    style={{
                      color: "#8b949e", fontSize: 13, fontWeight: 600,
                      textDecoration: "none", padding: "9px 18px",
                      border: "1px solid #30363d", borderRadius: 8,
                      display: "inline-flex", alignItems: "center", gap: 6,
                    }}
                  >
                    ← {tx.cancel}
                  </a>
                  <button
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    style={{
                      padding: "10px 24px", borderRadius: 8, fontSize: 14, fontWeight: 700,
                      border: "none", cursor: canSubmit ? "pointer" : "not-allowed",
                      backgroundColor: canSubmit ? "#22c55e" : "#21262d",
                      color: canSubmit ? "#0d1117" : "#484f58",
                      boxShadow: canSubmit ? "0 0 16px rgba(34,197,94,0.2)" : "none",
                      transition: "all 0.15s",
                    }}
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
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Guidelines */}
        <div
          style={{
            backgroundColor: "#161b22", border: "1px solid #30363d",
            borderRadius: 12, overflow: "hidden",
          }}
        >
          <div style={{ padding: "11px 16px", borderBottom: "1px solid #21262d", backgroundColor: "#0d1117" }}>
            <h3 style={{ color: "#e6edf3", fontSize: 12, fontWeight: 700, margin: 0,
              textTransform: "uppercase", letterSpacing: "0.03em" }}>
              📋 {tx.guidelines}
            </h3>
          </div>
          <div style={{ padding: "14px 16px" }}>
            <ol style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 8 }}>
              {tx.guidelineItems.map((item, idx) => (
                <li key={idx} style={{ color: "#8b949e", fontSize: 12, lineHeight: 1.5 }}>{item}</li>
              ))}
            </ol>
          </div>
        </div>

        {/* Tag preview */}
        {tags && (
          <div
            style={{
              backgroundColor: "#161b22", border: "1px solid #30363d",
              borderRadius: 12, padding: "14px 16px",
            }}
          >
            <p style={{ color: "#8b949e", fontSize: 11, fontWeight: 700,
              textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 10px" }}>
              {locale === "ko" ? "태그 미리보기" : "Tag Preview"}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {tags.split(",").map((t) => t.trim()).filter(Boolean).map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: 11, color: "#8b949e",
                    backgroundColor: "#0d1117", border: "1px solid #30363d",
                    borderRadius: 5, padding: "3px 10px",
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Moderation notice */}
        <div
          style={{
            backgroundColor: "rgba(245,158,11,0.05)",
            border: "1px solid rgba(245,158,11,0.2)",
            borderRadius: 10, padding: "14px 16px",
            display: "flex", gap: 10, alignItems: "flex-start",
          }}
        >
          <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
          <p style={{ color: "#8b949e", fontSize: 12, margin: 0, lineHeight: 1.6 }}>
            {locale === "ko"
              ? "게시글은 커뮤니티 가이드라인 준수 여부를 검토한 후 게시됩니다."
              : "Posts are reviewed for compliance with community guidelines before publishing."}
          </p>
        </div>
      </div>
    </div>
  );
}
