import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { cleanName, cleanSlots } from "@/lib/validate";
import { totalSlots } from "@/lib/slots";
import type { Participant } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store, max-age=0" };

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  const state = await store().getEvent(slug);
  if (!state) {
    return NextResponse.json({ error: "not_found" }, { status: 404, headers: noStore });
  }
  return NextResponse.json(state, { headers: noStore });
}

export async function PUT(
  req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;

  const pid = typeof b.pid === "string" ? b.pid.slice(0, 64) : "";
  if (!pid) {
    return NextResponse.json({ error: "Falta pid." }, { status: 400 });
  }

  const s = store();
  const meta = await s.getMeta(slug);
  if (!meta) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const participant: Participant = {
    pid,
    name: cleanName(b.name),
    slots: cleanSlots(b.slots, totalSlots(meta)),
    updatedAt: Date.now(),
  };

  await s.upsertParticipant(slug, participant);
  return NextResponse.json({ ok: true }, { headers: noStore });
}

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  const pid = (new URL(req.url).searchParams.get("pid") ?? "").slice(0, 64);
  if (!pid) {
    return NextResponse.json({ error: "Falta pid." }, { status: 400 });
  }

  const s = store();
  const meta = await s.getMeta(slug);
  if (!meta) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await s.deleteParticipant(slug, pid);
  return NextResponse.json({ ok: true }, { headers: noStore });
}
