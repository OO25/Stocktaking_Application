import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import LoginPage from "./pages/LoginPage/index.jsx";
import { AppSidebar } from "./components/app-sidebar.jsx";
import ManageProductPage from "./pages/ManageProductPage/index.jsx";
import ManageOutletPage from "./pages/ManageOutletPage/index.jsx";
import ManageSupplierPage from "./pages/ManageSupplierPage/index.jsx";
import ManageCategoryPage from "./pages/ManageCategoryPage/index.jsx";
import ManageUomPage from "./pages/ManageUomPage/index.jsx";
import ManageOutletAssignmentPage from "./pages/ManageOutletAssignmentPage/index.jsx";
import ManageUsersPage from "./pages/ManageUsersPage/index.jsx";
import StockCountPage from "./pages/StockCountPage/index.jsx";
import StockCountDetailPage from "./pages/StockCountPage/detail.jsx";
import DashboardPage from "./pages/DashboardPage/index.jsx";
import BranchDashboardPage from "./pages/branchDashboardPage/index.jsx";
import {
  SidebarInset,
  SidebarProvider,
} from "./components/ui/sidebar.jsx";
import { TopNavigation } from "./components/top-navigation.jsx";

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
          <TopNavigation />
          <Outlet />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

function DashboardRedirect() {
  const { user } = useAuth();
  return (
    <Navigate
      to={user?.role === "admin" ? "/dashboard" : "/branch-dashboard"}
      replace
    />
  );
}

function AdminOnlyRoute({ children }) {
  const { user } = useAuth();
  return user?.role === "admin" ? (
    children
  ) : (
    <Navigate to="/branch-dashboard" replace />
  );
}

function NonAdminOnlyRoute({ children }) {
  const { user } = useAuth();
  return user?.role !== "admin" ? (
    children
  ) : (
    <Navigate to="/dashboard" replace />
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
        <Route index element={<DashboardRedirect />} />
        <Route
          path="dashboard"
          element={
            <AdminOnlyRoute>
              <DashboardPage />
            </AdminOnlyRoute>
          }
        />
        <Route
          path="branch-dashboard"
          element={
            <NonAdminOnlyRoute>
              <BranchDashboardPage />
            </NonAdminOnlyRoute>
          }
        />
        <Route path="stock-count" element={<StockCountPage />} />
        <Route path="stock-count/:id" element={<StockCountDetailPage />} />
        <Route element={<AdminOnlyRoute><Outlet /></AdminOnlyRoute>}>
          <Route path="products" element={<ManageProductPage />} />
          <Route path="branches" element={<ManageOutletPage />} />
          <Route path="categories" element={<ManageCategoryPage />} />
          <Route path="suppliers" element={<ManageSupplierPage />} />
          <Route path="uom" element={<ManageUomPage />} />
          <Route path="branch-assignment" element={<ManageOutletAssignmentPage />} />
          <Route path="users" element={<ManageUsersPage />} />
        </Route>
      </Route>
      <Route path="*" element={<DashboardRedirect />} />
    </Routes>
  );
}

export default App;
