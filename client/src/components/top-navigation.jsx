import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./ui/breadcrumb.jsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu.jsx";
import { SidebarTrigger } from "./ui/sidebar.jsx";
import { Badge } from "./ui/badge.jsx";
import { Link, useLocation } from "react-router-dom";
import { ChevronDownIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

export function TopNavigation() {
  const { user } = useAuth();
  const location = useLocation();
  const { pathname } = location;
  const stockCountMatch = pathname.match(/^\/stock-count\/(.+)$/);
  const stockCountId = stockCountMatch?.[1] ?? null;
  const [stockCountDetailName, setStockCountDetailName] = useState("");
  const pageTitles = {
    "/dashboard": "Dashboard",
    "/branch-dashboard": "Dashboard",
    "/stock-count": "Stock Count",
    "/products": "Products",
    "/branches": "Branches",
    "/categories": "Categories",
    "/suppliers": "Suppliers",
    "/uom": "Units of Measure",
    "/branch-assignment": "Branch Assignment",
    "/users": "Users",
  };
  const pageTitle = pageTitles[pathname] ?? "Dashboard";
  const dashboardPath = user?.role === "admin" ? "/dashboard" : "/branch-dashboard";
  const managePages = [
    { label: "Products", to: "/products" },
    { label: "Branches", to: "/branches" },
    { label: "Categories", to: "/categories" },
    { label: "Suppliers", to: "/suppliers" },
    { label: "Units of Measure", to: "/uom" },
    { label: "Branch Assignment", to: "/branch-assignment" },
    { label: "Users", to: "/users" },
  ];
  const isManagePage = user?.role === "admin" && managePages.some((page) => page.to === pathname);
  const isStockCountDetail = Boolean(stockCountId);

  useEffect(() => {
    const title = isStockCountDetail ? stockCountDetailName || "Stock Count" : pageTitle;
    document.title = `${title} | Stocktaking Application`;
  }, [pageTitle, isStockCountDetail, stockCountDetailName]);

  useEffect(() => {
    if (!stockCountId) return;
    const stateName = location.state?.assignmentName || location.state?.name;
    const stored = sessionStorage.getItem(`stockcount-name:${stockCountId}`);
    setStockCountDetailName(stateName || stored || "");
    if (stateName) sessionStorage.setItem(`stockcount-name:${stockCountId}`, stateName);
  }, [location.state, stockCountId]);

  useEffect(() => {
    function handleNameUpdate(event) {
      if (!event?.detail || !stockCountId) return;
      if (String(event.detail.id) !== String(stockCountId)) return;
      const name = event.detail.name || "";
      setStockCountDetailName(name);
      if (name) {
        sessionStorage.setItem(`stockcount-name:${stockCountId}`, name);
      }
    }

    window.addEventListener("stockcount-name", handleNameUpdate);
    return () => window.removeEventListener("stockcount-name", handleNameUpdate);
  }, [stockCountId]);

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-gray-200 bg-white/80 px-4 backdrop-blur">
      <SidebarTrigger />
      <Breadcrumb className="ml-2">
        <BreadcrumbList>
          {isStockCountDetail ? (
            <>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to={dashboardPath}>
                    <Badge
                      variant="outline"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Dashboard
                    </Badge>
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/stock-count">
                    <Badge
                      variant="outline"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Stock Count
                    </Badge>
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>
                  <Badge variant="outline" className="border-primary text-primary">
                    {stockCountDetailName || "Stock Count"}
                  </Badge>
                </BreadcrumbPage>
              </BreadcrumbItem>
            </>
          ) : pageTitle === "Dashboard" ? (
            <BreadcrumbItem>
              <BreadcrumbPage>
                <Badge variant="outline" className="border-primary text-primary">
                  Dashboard
                </Badge>
              </BreadcrumbPage>
            </BreadcrumbItem>
          ) : (
            <>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to={dashboardPath}>
                    <Badge
                      variant="outline"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Dashboard
                    </Badge>
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {isManagePage ? (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>
                      <Badge
                        variant="outline"
                        className="text-muted-foreground"
                      >
                        Management
                      </Badge>
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              ) : null}
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>
                  {isManagePage ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger className="flex min-w-40 items-center gap-1 border-primary text-primary">
                        <span>{pageTitle}</span>
                        <ChevronDownIcon className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        {managePages.map((page) => (
                          <DropdownMenuItem key={page.to}>
                            <Link className="w-full" to={page.to}>
                              {page.label}
                            </Link>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <Badge
                      variant="outline"
                      className="border-primary text-primary"
                    >
                      {pageTitle}
                    </Badge>
                  )}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  );
}
