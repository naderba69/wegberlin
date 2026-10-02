"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export const STATUS_ANNOUNCEMENT_VERSION = "status-announcement-v1" as const;

type StatusAnnouncementProps = {
  message: string;
  channel: string;
  className?: string;
  icon?: ReactNode;
};

export function StatusAnnouncement({ message, channel, className = "", icon }: StatusAnnouncementProps) {
  const normalized = message.replace(/\s+/g, " ").trim();
  const previous = useRef("");
  const [liveMessage, setLiveMessage] = useState("");
  const [sequence, setSequence] = useState(0);

  useEffect(() => {
    if (!normalized || normalized === previous.current) return;
    previous.current = normalized;
    setLiveMessage(normalized);
    setSequence((value) => value + 1);
  }, [normalized]);

  if (!normalized) return null;
  return <div className={`status-announcement ${className}`.trim()} data-status-channel={channel} data-status-policy={STATUS_ANNOUNCEMENT_VERSION}>
    {icon && <span aria-hidden="true">{icon}</span>}
    <span>{normalized}</span>
    <span className="sr-only" role="status" aria-live="polite" aria-atomic="true" data-announcement-sequence={sequence}>{liveMessage}</span>
  </div>;
}
