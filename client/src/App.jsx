// Root component — shows LoginPage if unauthenticated, main app if logged in

import { useState } from "react";
import { useAuth } from "./context/AuthContext.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import Sidebar from "./components/Sidebar";
import ManageProductPage from "./pages/ManageProductPage";

// Map of page keys (matching Sidebar NAV_ITEMS) to their page components
const PAGES = {
  products: ManageProductPage,
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
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <main className="flex-1 overflow-y-auto">
        {Page ? <Page /> : <Placeholder />}
      </main>
    </div>
  );
}

function Placeholder() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900">Stocktaking Application</h1>
      <p className="mt-2 text-gray-600">Select a page from the sidebar to get started.</p>
    </div>
  );
}

export default App;
