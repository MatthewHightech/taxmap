"use client";

import { useEffect } from "react";

/** Stops mouse-wheel / trackpad scroll from changing focused number inputs. */
export function DisableNumberInputScroll() {
  useEffect(() => {
    const onWheel = (event: WheelEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) return;
      if (target.type !== "number") return;
      event.preventDefault();
    };

    document.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      document.removeEventListener("wheel", onWheel);
    };
  }, []);

  return null;
}
