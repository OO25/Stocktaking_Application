// Root component — shows LoginPage if unauthenticated, main app if logged in

import { useState } from "react";
import { useAuth } from "./context/AuthContext.jsx";
import LoginPage from "./pages/LoginPage/index.jsx";
import { AppSidebar } from "./components/app-sidebar.jsx";
import ManageProductPage from "./pages/ManageProductPage/index.jsx";
import ManageSupplierPage from "./pages/ManageSupplierPage/index.jsx";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "./components/ui/sidebar.jsx";


// Map of page keys (matching Sidebar NAV_ITEMS) to their page components
const PAGES = {
  products: ManageProductPage,
  suppliers: ManageSupplierPage,
};

function App() {
  const { user } = useAuth();
  const [activePage, setActivePage] = useState("inventory");
  const Page = PAGES[activePage];

  // Show the login page until the user authenticates
  if (!user) {
    return <LoginPage />;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-svh w-full overflow-hidden">
        <AppSidebar
          activePage={activePage}
          onNavigate={setActivePage}
          collapsible="icon"
          variant="sidebar"
        />
        <SidebarInset className="flex-1 min-h-svh w-full overflow-y-auto bg-gray-50">
          <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-gray-200 bg-white/80 px-4 backdrop-blur">
            <SidebarTrigger />
            <span className="text-sm font-semibold text-gray-900">
              Stocktake
            </span>
          </header>
          {Page ? <Page /> : <Placeholder />}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

function Placeholder() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900">
        Stocktaking Application
      </h1>
      <p className="mt-2 text-gray-600">
        Select a page from the sidebar to get started.
      </p>
    </div>
  );
}

export default App;
