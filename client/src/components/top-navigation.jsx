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

export function TopNavigation() {
  const { pathname } = useLocation();
  const pageTitles = {
    "/dashboard": "Dashboard",
    "/stock-count": "Stock Count",
    "/inventory": "Inventory",
    "/products": "Products",
    "/branches": "Branches",
    "/categories": "Categories",
    "/suppliers": "Suppliers",
    "/uom": "Units of Measure",
    "/branch-assignment": "Branch Assignment",
    "/users": "Users",
  };
  const pageTitle = pageTitles[pathname] ?? "Dashboard";
  const managePages = [
    { label: "Products", to: "/products" },
    { label: "Branches", to: "/branches" },
    { label: "Categories", to: "/categories" },
    { label: "Suppliers", to: "/suppliers" },
    { label: "Units of Measure", to: "/uom" },
    { label: "Branch Assignment", to: "/branch-assignment" },
    { label: "Users", to: "/users" },
  ];
  const isManagePage = managePages.some((page) => page.to === pathname);

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-gray-200 bg-white/80 px-4 backdrop-blur">
      <SidebarTrigger />
      <Breadcrumb className="ml-2">
        <BreadcrumbList>
          {pageTitle === "Dashboard" ? (
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
                  <Link to="/dashboard">
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
