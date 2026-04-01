import { useLocation } from "react-router-dom"
import { useAuth } from "@/context/AuthContext.jsx"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  GalleryVerticalEndIcon,
  BoxesIcon,
  PackageIcon,
  StoreIcon,
  TagsIcon,
  LayoutDashboardIcon,
  ClipboardListIcon,
  TruckIcon,
  RulerIcon,
  GitBranchIcon,
  UsersIcon,
} from "lucide-react"

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", roles: ["admin", "manager"]  },
  { key: "stock-count", label: "Stock Count", roles: ["admin", "manager"]  },
  { key: "products", label: "Product", roles: ["admin"] },
  { key: "branches", label: "Outlet", roles: ["admin"] },
  { key: "categories", label: "Category", roles: ["admin"] },
  { key: "suppliers", label: "Suppliers", roles: ["admin"]},
  { key: "uom", label: "UOM", roles: ["admin"] },
  {
    key: "branch-assignment",
    label: "Outlet Assignment",
    roles: ["admin"],
  },
  { key: "users", label: "Users", roles: ["admin"] },
]

export function AppSidebar(props) {
  const { user, logout } = useAuth()
  const location = useLocation()

  const activePage = location.pathname.replace(/^\//, "") || "dashboard"

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(user?.role)
  )
  const generalItems = visibleItems.filter((item) =>
    ["dashboard", "stock-count"].includes(item.key)
  )
  const manageItems = visibleItems.filter(
    (item) => !["dashboard", "stock-count"].includes(item.key)
  )

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <GalleryVerticalEndIcon className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-medium">Stocktake</span>
                  <span className="text-xs text-sidebar-foreground/70">
                    Inventory
                  </span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          label="General"
          items={generalItems.map((item) => ({
            ...item,
            icon: <NavIcon itemKey={item.key} />,
          }))}
          activeKey={activePage}
        />
        <NavMain
          label="Manage"
          items={manageItems.map((item) => ({
            ...item,
            icon: <NavIcon itemKey={item.key} />,
          }))}
          activeKey={activePage}
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} onLogout={logout} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

function NavIcon({ itemKey }) {
  const cls = "size-4";

  switch (itemKey) {
    case "dashboard":
      return <LayoutDashboardIcon className={cls} />
    case "stock-count":
      return <ClipboardListIcon className={cls} />
    case "products":
      return <PackageIcon className={cls} />
    case "branches":
      return <StoreIcon className={cls} />
    case "categories":
      return <TagsIcon className={cls} />
    case "suppliers":
      return <TruckIcon className={cls} />
    case "uom":
      return <RulerIcon className={cls} />
    case "branch-assignment":
      return <GitBranchIcon className={cls} />
    case "users":
      return <UsersIcon className={cls} />
    default:
      return null
  }
}
