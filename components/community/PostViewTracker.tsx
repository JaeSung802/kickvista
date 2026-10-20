"use client";

import { useEffect, useRef } from "react";
import { recordPostView } from "@/lib/community/actions";

interface PostViewTrackerProps {
  postId: string;
}

/**
 * Records one view per post id while this component stays mounted. Runs only
 * after a real client mount (never during metadata generation, server
 * rendering, prefetch or the re-render after a comment). The ref is set before
 * the call and never reset, so Strict Mode's second effect run does not count
 * twice. Renders nothing.
 */
export default function PostViewTracker({ postId }: PostViewTrackerProps) {
  const recordedId = useRef<string | null>(null);

  useEffect(() => {
    if (recordedId.current === postId) return;
    recordedId.current = postId;
    recordPostView(postId).catch(() => {
      // ignore — the view count is best-effort, no retry
    });
  }, [postId]);

  return null;
}
