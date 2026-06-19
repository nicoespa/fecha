import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { newSlug } from "@/lib/id";
import { cleanDays, cleanTitle, clampInt } from "@/lib/validate";
import type { EventMeta } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const title = cleanTitle(b.title);
  const days = cleanDays(b.days);
  if (days.length === 0) {
    return NextResponse.json(
      { error: "Elegí al menos un día." },
      { status: 400 },
    );
  }

  const slotMin = b.slotMin === 30 ? 30 : 60;
  let startMin = clampInt(b.startMin, 0, 1440 - slotMin, 9 * 60);
  let endMin = clampInt(b.endMin, slotMin, 1440, 24 * 60);
  // snap to slot grid + guarantee a positive range
  startMin = Math.floor(startMin / slotMin) * slotMin;
  endMin = Math.ceil(endMin / slotMin) * slotMin;
  if (endMin <= startMin) endMin = Math.min(1440, startMin + slotMin);

  const tz =
    typeof b.tz === "string" && b.tz.length < 60
      ? b.tz
      : "America/Argentina/Buenos_Aires";

  const s = store();
  let slug = newSlug();
  for (let i = 0; i < 5; i++) {
    if (!(await s.getMeta(slug))) break;
    slug = newSlug();
  }

  const meta: EventMeta = {
    slug,
    title,
    days,
    startMin,
    endMin,
    slotMin,
    tz,
    createdAt: Date.now(),
  };

  await s.createEvent(meta);
  return NextResponse.json({ slug });
}
