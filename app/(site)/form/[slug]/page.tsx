import { supabase } from "@/lib/supabase";
import FormRunner from "@/components/FormRunner";
import type { Form, Question } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const { data } = await supabase.from("forms").select("title,description").eq("slug", params.slug).maybeSingle();
  return { title: data?.title ?? "Form", description: data?.description ?? undefined };
}

export default async function FormPage({ params }: { params: { slug: string } }) {
  const { data: form } = await supabase.from("forms").select("*").eq("slug", params.slug).maybeSingle<Form>();

  if (!form) {
    return (
      <div className="container-x max-w-xl py-20 text-center">
        <h1 className="text-3xl font-bold text-white">Form not found</h1>
        <p className="mt-3 text-zinc-400">This link may be wrong or the form was removed.</p>
      </div>
    );
  }

  const { data: qs } = await supabase
    .from("form_questions")
    .select("*")
    .eq("form_id", form.id)
    .order("sort_order", { ascending: true });

  let closedReason: string | undefined;
  if (!form.is_open) closedReason = "This form is no longer accepting responses.";
  else if (form.deadline && new Date(form.deadline) < new Date()) closedReason = "The deadline for this form has passed.";
  else if (form.max_responses) {
    const { data: count } = await supabase.rpc("form_response_count", { fid: form.id });
    if (typeof count === "number" && count >= form.max_responses) closedReason = "This form has reached its response limit.";
  }

  return (
    <div className="container-x max-w-2xl py-10">
      <FormRunner form={form} questions={(qs ?? []) as Question[]} closedReason={closedReason} />
    </div>
  );
}
