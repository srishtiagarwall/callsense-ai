"use client";

import { useEffect } from "react";
import { setApiKey } from "@/lib/auth";

export default function ApiKeyCapture() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const key = params.get("key");
    if (!key) return;

    setApiKey(key);
    params.delete("key");
    const newSearch = params.toString();
    const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : "");
    window.history.replaceState({}, "", newUrl);
  }, []);

  return null;
}
