import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * PATCH /api/predictions/[id]/notify
 *
 * Marks a prediction as notified (is_notified = true).
 * Only the prediction's owner can do this.
 */
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("predictions")
      .update({ is_notified: true })
      .eq("id", id)
      .eq("user_id", user.id); // RLS: can only update own predictions

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to mark notification", detail: String(error) },
      { status: 500 }
    );
  }
}
