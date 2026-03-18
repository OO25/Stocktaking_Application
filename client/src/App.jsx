// Root component — shows LoginPage if unauthenticated, main app if logged in

import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import LoginPage from "./pages/LoginPage/index.jsx";
import { AppSidebar } from "./components/app-sidebar.jsx";
import ManageProductPage from "./pages/ManageProductPage/index.jsx";
import ManageBranchPage from "./pages/ManageBranchPage/index.jsx";
import ManageSupplierPage from "./pages/ManageSupplierPage/index.jsx";
import ManageCategoryPage from "./pages/ManageCategoryPage/index.jsx";
import ManageUomPage from "./pages/ManageUomPage/index.jsx";
import ManageBranchAssignmentPage from "./pages/ManageBranchAssignmentPage/index.jsx";
import ManageUsersPage from "./pages/ManageUsersPage/index.jsx";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "./components/ui/sidebar.jsx";

/*
 * Wraps all protected routes, if you're not logged in you get
 * kicked to /login, otherwise renders the sidebar + page content
 */
function AuthLayout() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-svh w-full overflow-hidden">
        <AppSidebar collapsible="icon" variant="sidebar" />
        <SidebarInset className="flex-1 min-h-svh w-full overflow-y-auto bg-gray-50">
          <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-gray-200 bg-white/80 px-4 backdrop-blur">
            <SidebarTrigger />
            <span className="text-sm font-semibold text-gray-900">
              Stocktake
            </span>
          </header>
          <Outlet />
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

function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <LoginPage />}
      />

      <Route element={<AuthLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Placeholder />} />
        <Route path="stock-count" element={<Placeholder />} />
        <Route path="inventory" element={<Placeholder />} />
        <Route path="products" element={<ManageProductPage />} />
        <Route path="branches" element={<Placeholder />} />
        <Route path="categories" element={<ManageCategoryPage />} />
        <Route path="suppliers" element={<ManageSupplierPage />} />
        <Route path="uom" element={<ManageUomPage />} />
        <Route path="branch-assignment" element={<ManageBranchAssignmentPage />} />
        <Route path="users" element={<ManageUsersPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
