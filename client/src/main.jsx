// App entry point — AuthProvider wraps the app so useAuth() works everywhere

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AuthProvider } from "./context/AuthContext.jsx";
import { TooltipProvider } from "./components/ui/tooltip.jsx";
import App from "./App.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <TooltipProvider>
        <App />
      </TooltipProvider>
    </AuthProvider>
  </StrictMode>,
);
