import { useRef } from "react";

/** Dismiss only when a pointer gesture both starts and ends on the backdrop. */
export default function ModalBackdrop({ onClick, children, ...props }) {
  const startedOnBackdrop = useRef(false);

  return (
    <div
      {...props}
      onPointerDown={(event) => {
        startedOnBackdrop.current = event.target === event.currentTarget;
      }}
      onPointerCancel={() => { startedOnBackdrop.current = false; }}
      onClick={(event) => {
        const shouldDismiss = startedOnBackdrop.current && event.target === event.currentTarget;
        startedOnBackdrop.current = false;
        if (shouldDismiss) onClick?.(event);
      }}
    >
      {children}
    </div>
  );
}
