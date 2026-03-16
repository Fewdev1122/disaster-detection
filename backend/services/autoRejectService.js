import supabase from "../config/supabase.js";

export async function autoRejectExpiredPendingRequests(expireDays = 3) {
  const cutoff = new Date(Date.now() - expireDays * 24 * 60 * 60 * 1000).toISOString();

  const { data: expiredRequests, error: findError } = await supabase
    .from("rescue_units")
    .select("id, name, line_user_id, created_at, status")
    .eq("status", "pending_review")
    .is("line_user_id", null)
    .lt("created_at", cutoff);

  if (findError) {
    throw new Error(findError.message);
  }

  if (!expiredRequests || expiredRequests.length === 0) {
    return {
      updatedCount: 0,
      updatedIds: [],
    };
  }

  const ids = expiredRequests.map((item) => item.id);

  const { error: updateError } = await supabase
    .from("rescue_units")
    .update({
      status: "rejected",
      review_note: `ระบบปฏิเสธอัตโนมัติ เนื่องจากไม่ได้ผูก LINE ภายใน ${expireDays} วัน`,
    })
    .in("id", ids);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return {
    updatedCount: ids.length,
    updatedIds: ids,
  };
}