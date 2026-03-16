import { CheckCheckIcon } from "lucide-react";
import { cn } from "../lib/utils.js";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert.jsx";

function SuccessAlert({
  message,
  title = "Success",
  className = "",
  alertClassName = "",
  descriptionClassName = "",
}) {
  if (!message) return null;

  return (
    <div className={className}>
      <Alert
        className={cn(
          "border-none bg-green-600/10 text-green-600 dark:bg-green-400/10 dark:text-green-400",
          alertClassName
        )}
      >
        <CheckCheckIcon />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription
          className={cn(
            "text-green-600/80 dark:text-green-400/80",
            descriptionClassName
          )}
        >
          {message}
        </AlertDescription>
      </Alert>
    </div>
  );
}

export default SuccessAlert;
