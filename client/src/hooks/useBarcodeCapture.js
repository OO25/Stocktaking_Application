import { useEffect, useRef } from "react";

// Keyboard-wedge scanners end a rapid sequence with Enter or Tab.
// Preserve the form before the scan so a focused name/price field is not polluted.
export function useBarcodeCapture(open, form, setForm, field, inputId) {
  const formRef = useRef(form);
  formRef.current = form;

  useEffect(() => {
    if (!open) return;
    const focus = requestAnimationFrame(() => document.getElementById(inputId)?.focus());
    let buffer = "";
    let last = 0;
    let snapshot;
    function onKeyDown(event) {
      if (event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return;
      const now = performance.now();
      if (event.key === "Enter" || event.key === "Tab") {
        if (buffer.length >= 3 && now - last < 100) {
          event.preventDefault();
          event.stopImmediatePropagation();
          setForm({ ...snapshot, [field]: buffer });
          document.getElementById(inputId)?.focus();
        } else if (event.key === "Enter" && event.target.id === inputId) {
          event.preventDefault();
        }
        buffer = "";
        return;
      }
      if (event.key.length !== 1) { buffer = ""; return; }
      if (!buffer || now - last > 100) {
        buffer = "";
        snapshot = { ...formRef.current };
      }
      buffer += event.key;
      last = now;
    }
    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      cancelAnimationFrame(focus);
      window.removeEventListener("keydown", onKeyDown, true);
    };
  }, [open, setForm, field, inputId]);
}
