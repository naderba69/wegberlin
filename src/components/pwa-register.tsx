"use client";
import { useEffect } from "react";
export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }

    function useCachedDocument(event: MouseEvent) {
      if (navigator.onLine || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a");
      if (!anchor || anchor.hasAttribute("download") || (anchor.target && anchor.target !== "_self")) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin || url.protocol !== window.location.protocol) return;
      event.preventDefault();
      window.location.assign(url.href);
    }

    document.addEventListener("click", useCachedDocument, true);
    return () => document.removeEventListener("click", useCachedDocument, true);
  }, []);
  return null;
}
