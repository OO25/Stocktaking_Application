import { Trash } from "lucide-react";
import { Button } from "./ui/button.jsx";

export default function DeleteButton({ inUse = false, onClick }) {
  const label = inUse ? "This is in use and cannot be deleted." : "Delete";
  return (
    <span title={label} tabIndex={inUse ? 0 : undefined} aria-label={inUse ? label : undefined}>
      <Button
        size="sm"
        variant="destructive"
        disabled={inUse}
        className={inUse ? "disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100" : undefined}
        onClick={onClick}
        aria-label={label}
      >
        <Trash className="h-4 w-4" />
      </Button>
    </span>
  );
}
