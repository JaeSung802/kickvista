"use client";

import { useState } from "react";
import {
  createPostReport,
  createCommentReport,
  type ReportReason,
} from "@/lib/community/reportActions";

interface ReportModalProps {
  type: "post" | "comment";
  targetId: string;
  locale: "ko" | "en";
  isLoggedIn: boolean;
  loginHref: string;
}

type ModalState = "idle" | "open" | "submitting" | "success" | "already" | "error";

const REASONS: { value: ReportReason; en: string; ko: string }[] = [
  { value: "spam",           en: "Spam",                  ko: "스팸" },
  { value: "harassment",     en: "Harassment / Bullying",  ko: "괴롭힘 / 따돌림" },
  { value: "misinformation", en: "Misinformation",         ko: "허위 정보" },
  { value: "hate_speech",    en: "Hate Speech",            ko: "혐오 발언" },
  { value: "illegal",        en: "Illegal Content",        ko: "불법 콘텐츠" },
  { value: "other",          en: "Other",                  ko: "기타" },
];

export default function ReportModal({
  type,
  targetId,
  locale,
  isLoggedIn,
  loginHref,
}: ReportModalProps) {
  const isKo = locale === "ko";
  const [modalState, setModalState] = useState<ModalState>("idle");
  const [reason, setReason] = useState<ReportReason>("spam");
  const [details, setDetails] = useState("");

  function openModal() {
    if (!isLoggedIn) {
      window.location.href = loginHref;
      return;
    }
    setModalState("open");
  }

  function closeModal() {
    setModalState("idle");
    setReason("spam");
    setDetails("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setModalState("submitting");

    const result =
      type === "post"
        ? await createPostReport(targetId, reason, details.trim() || null)
        : await createCommentReport(targetId, reason, details.trim() || null);

    if (result.error === "already_reported") {
      setModalState("already");
      return;
    }
    if (result.error) {
      setModalState("error");
      return;
    }
    setModalState("success");
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={openModal}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#484f58",
          fontSize: 12,
          padding: 0,
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          transition: "color 0.15s",
          fontFamily: "inherit",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "#ef4444";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "#484f58";
        }}
        title={isKo ? "신고" : "Report"}
      >
        ⚑ {isKo ? "신고" : "Report"}
      </button>

      {/* Modal overlay */}
      {modalState !== "idle" && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 16,
          }}
        >
          <div
            style={{
              backgroundColor: "#161b22",
              border: "1px solid #30363d",
              borderRadius: 14,
              width: "100%",
              maxWidth: 440,
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                borderBottom: "1px solid #21262d",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: "#ef4444", fontSize: 16 }}>⚑</span>
                <h3 style={{ color: "#e6edf3", fontSize: 15, fontWeight: 800, margin: 0 }}>
                  {isKo
                    ? (type === "post" ? "게시글 신고" : "댓글 신고")
                    : (type === "post" ? "Report Post" : "Report Comment")}
                </h3>
              </div>
              <button
                onClick={closeModal}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#8b949e",
                  fontSize: 18,
                  lineHeight: 1,
                  padding: 4,
                  fontFamily: "inherit",
                }}
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: "20px" }}>
              {/* Success */}
              {modalState === "success" && (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div style={{ fontSize: 40, marginBottom: 14 }}>✅</div>
                  <p style={{ color: "#e6edf3", fontSize: 15, fontWeight: 700, margin: "0 0 6px" }}>
                    {isKo ? "신고가 접수되었습니다" : "Report submitted"}
                  </p>
                  <p style={{ color: "#8b949e", fontSize: 13, margin: "0 0 20px" }}>
                    {isKo
                      ? "검토 후 적절한 조치가 이루어집니다."
                      : "Our moderation team will review this report."}
                  </p>
                  <button
                    onClick={closeModal}
                    style={{
                      backgroundColor: "#22c55e",
                      color: "#0d1117",
                      border: "none",
                      borderRadius: 8,
                      padding: "9px 24px",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {isKo ? "확인" : "Done"}
                  </button>
                </div>
              )}

              {/* Already reported */}
              {modalState === "already" && (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div style={{ fontSize: 40, marginBottom: 14 }}>ℹ️</div>
                  <p style={{ color: "#e6edf3", fontSize: 15, fontWeight: 700, margin: "0 0 6px" }}>
                    {isKo ? "이미 신고한 콘텐츠입니다" : "Already reported"}
                  </p>
                  <p style={{ color: "#8b949e", fontSize: 13, margin: "0 0 20px" }}>
                    {isKo
                      ? "이 콘텐츠는 이미 신고하셨습니다."
                      : "You have already reported this content."}
                  </p>
                  <button
                    onClick={closeModal}
                    style={{
                      backgroundColor: "#21262d",
                      color: "#8b949e",
                      border: "1px solid #30363d",
                      borderRadius: 8,
                      padding: "9px 24px",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {isKo ? "닫기" : "Close"}
                  </button>
                </div>
              )}

              {/* Error */}
              {modalState === "error" && (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div style={{ fontSize: 40, marginBottom: 14 }}>⚠️</div>
                  <p style={{ color: "#e6edf3", fontSize: 15, fontWeight: 700, margin: "0 0 6px" }}>
                    {isKo ? "신고에 실패했습니다" : "Report failed"}
                  </p>
                  <p style={{ color: "#8b949e", fontSize: 13, margin: "0 0 20px" }}>
                    {isKo ? "잠시 후 다시 시도해 주세요." : "Please try again in a moment."}
                  </p>
                  <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                    <button
                      onClick={() => setModalState("open")}
                      style={{
                        backgroundColor: "#22c55e",
                        color: "#0d1117",
                        border: "none",
                        borderRadius: 8,
                        padding: "9px 24px",
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {isKo ? "다시 시도" : "Try Again"}
                    </button>
                    <button
                      onClick={closeModal}
                      style={{
                        backgroundColor: "transparent",
                        color: "#8b949e",
                        border: "1px solid #30363d",
                        borderRadius: 8,
                        padding: "9px 24px",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {isKo ? "취소" : "Cancel"}
                    </button>
                  </div>
                </div>
              )}

              {/* Form */}
              {(modalState === "open" || modalState === "submitting") && (
                <form onSubmit={handleSubmit}>
                  {/* Reason */}
                  <div style={{ marginBottom: 16 }}>
                    <label
                      style={{
                        display: "block",
                        color: "#8b949e",
                        fontSize: 12,
                        fontWeight: 600,
                        marginBottom: 8,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {isKo ? "신고 사유" : "Reason"}
                    </label>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {REASONS.map((r) => (
                        <label
                          key={r.value}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "9px 12px",
                            borderRadius: 8,
                            cursor: "pointer",
                            backgroundColor:
                              reason === r.value
                                ? "rgba(239,68,68,0.08)"
                                : "rgba(255,255,255,0.02)",
                            border: `1px solid ${reason === r.value ? "rgba(239,68,68,0.3)" : "#21262d"}`,
                            transition: "all 0.1s",
                          }}
                        >
                          <input
                            type="radio"
                            name="reason"
                            value={r.value}
                            checked={reason === r.value}
                            onChange={() => setReason(r.value)}
                            style={{ accentColor: "#ef4444", width: 14, height: 14 }}
                          />
                          <span
                            style={{
                              color: reason === r.value ? "#e6edf3" : "#8b949e",
                              fontSize: 13,
                              fontWeight: reason === r.value ? 600 : 400,
                            }}
                          >
                            {isKo ? r.ko : r.en}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Details */}
                  <div style={{ marginBottom: 20 }}>
                    <label
                      style={{
                        display: "block",
                        color: "#8b949e",
                        fontSize: 12,
                        fontWeight: 600,
                        marginBottom: 8,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {isKo ? "추가 설명 (선택)" : "Additional Details (optional)"}
                    </label>
                    <textarea
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                      placeholder={
                        isKo
                          ? "신고 이유를 구체적으로 작성해 주세요..."
                          : "Describe the issue in more detail..."
                      }
                      rows={3}
                      maxLength={500}
                      style={{
                        width: "100%",
                        backgroundColor: "#0d1117",
                        border: "1px solid #30363d",
                        borderRadius: 8,
                        color: "#e6edf3",
                        fontSize: 13,
                        padding: "10px 14px",
                        resize: "vertical",
                        outline: "none",
                        fontFamily: "inherit",
                        lineHeight: 1.5,
                        boxSizing: "border-box",
                        transition: "border-color 0.15s",
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = "rgba(239,68,68,0.4)";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = "#30363d";
                      }}
                    />
                    <div
                      style={{
                        textAlign: "right",
                        color: "#484f58",
                        fontSize: 11,
                        marginTop: 4,
                      }}
                    >
                      {details.length}/500
                    </div>
                  </div>

                  {/* Buttons */}
                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      onClick={closeModal}
                      disabled={modalState === "submitting"}
                      style={{
                        backgroundColor: "transparent",
                        color: "#8b949e",
                        border: "1px solid #30363d",
                        borderRadius: 8,
                        padding: "9px 20px",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      {isKo ? "취소" : "Cancel"}
                    </button>
                    <button
                      type="submit"
                      disabled={modalState === "submitting"}
                      style={{
                        backgroundColor:
                          modalState === "submitting" ? "#21262d" : "#ef4444",
                        color: modalState === "submitting" ? "#8b949e" : "#fff",
                        border: "none",
                        borderRadius: 8,
                        padding: "9px 20px",
                        fontSize: 13,
                        fontWeight: 700,
                        cursor:
                          modalState === "submitting" ? "default" : "pointer",
                        fontFamily: "inherit",
                        transition: "all 0.15s",
                      }}
                    >
                      {modalState === "submitting"
                        ? isKo
                          ? "제출 중..."
                          : "Submitting..."
                        : isKo
                        ? "신고 제출"
                        : "Submit Report"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
