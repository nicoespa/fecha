export interface EventMeta {
  slug: string;
  title: string;
  /** Ordered list of dates in event-local time, format "YYYY-MM-DD". */
  days: string[];
  /** Minutes from midnight where the grid starts (e.g. 540 = 09:00). */
  startMin: number;
  /** Exclusive end in minutes from midnight (e.g. 1440 = 24:00). */
  endMin: number;
  /** Slot granularity in minutes (30 or 60). */
  slotMin: number;
  /** IANA timezone label, informational (everyone reads the same wall-clock). */
  tz: string;
  createdAt: number;
}

export interface Participant {
  pid: string;
  name: string;
  /** Sorted global slot indices the person is available. */
  slots: number[];
  updatedAt: number;
}

export interface EventState {
  meta: EventMeta;
  participants: Participant[];
}
