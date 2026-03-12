import { useState } from "react";
import Sidebar from "./components/Sidebar";
import ManageProductPage from "./pages/ManageProductPage";

/** Map of page keys (matching Sidebar NAV_ITEMS) to their page components. */
const PAGES = {
  products: ManageProductPage,
};

function App() {
  const [activePage, setActivePage] = useState("inventory");
  const Page = PAGES[activePage];

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
