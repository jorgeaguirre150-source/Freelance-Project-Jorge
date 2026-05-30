"use server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase";

export async function updateStatus(id: string, status: string) {
  await supabaseAdmin().from("jobs").update({ status }).eq("id", id);
  revalidatePath("/");
}

export async function saveDraft(id: string, draft: string) {
  await supabaseAdmin().from("jobs").update({ draft }).eq("id", id);
  revalidatePath("/");
}

// Feedback 👍/👎 — calibra el scoring del agente (toggle)
export async function setFeedback(id: string, value: "up" | "down" | null) {
  await supabaseAdmin().from("jobs").update({ feedback: value }).eq("id", id);
  revalidatePath("/");
}
