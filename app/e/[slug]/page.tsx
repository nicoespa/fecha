import { notFound } from "next/navigation";
import { store } from "@/lib/store";
import { EventClient } from "@/components/EventClient";
import { dayLong } from "@/lib/slots";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const meta = await store().getMeta(slug);
  if (!meta) return { title: "Junta no encontrada — Fecha" };
  return {
    title: `${meta.title} — Fecha`,
    description: `¿Cuándo podemos? Marcá tu disponibilidad del ${dayLong(
      meta.days[0],
    )} al ${dayLong(meta.days[meta.days.length - 1])}.`,
  };
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const state = await store().getEvent(slug);
  if (!state) notFound();
  return (
    <EventClient meta={state.meta} initialParticipants={state.participants} />
  );
}
