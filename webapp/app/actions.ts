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
