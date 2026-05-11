import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ActivityIcon,
  ArrowRightIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  ClipboardListIcon,
  Clock3Icon,
  DownloadIcon,
  LayoutGridIcon,
  PackageIcon,
  StoreIcon,
  TrendingUpIcon,
} from "lucide-react";
import { fetchOutlets } from "../../api/outlets.js";
import { fetchSessionDetail, fetchSessions } from "../../api/stocktake.js";
import { fetchCategories, fetchProducts } from "../../api/products.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { Button } from "../../components/ui/button.jsx";
import { Badge } from "../../components/ui/badge.jsx";
import { Calendar } from "../../components/ui/calendar.jsx";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card.jsx";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select.jsx";

const ALL_OUTLETS = "__all__";
const ALL_CATEGORIES = "__all__";
const PACKAGING_CATEGORY = "__packaging__";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    minimumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatMonthLabel(date, style = "long") {
  return date.toLocaleDateString("en-NZ", {
    month: style,
    year: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) return "Not counted yet";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not counted yet";

  return date.toLocaleString("en-NZ", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getSessionMonthKey(session) {
  return `${session.year}-${String(session.month).padStart(2, "0")}`;
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getLastSixMonths(baseDate) {
  return Array.from({ length: 6 }, (_, index) => {
    const offset = 5 - index;
    return new Date(baseDate.getFullYear(), baseDate.getMonth() - offset, 1);
  });
}

function getStatusMeta(status) {
  switch (status) {
    case "submitted":
      return {
        label: "Submitted",
        className: "bg-emerald-100 text-emerald-700",
      };
    case "in_progress":
      return {
        label: "In Progress",
        className: "bg-sky-100 text-sky-700",
      };
    case "draft":
      return {
        label: "Draft",
        className: "bg-amber-100 text-amber-700",
      };
    case "locked":
      return {
        label: "Locked",
        className: "bg-rose-100 text-rose-700",
      };
    default:
      return {
        label: status || "Unknown",
        className: "bg-slate-100 text-slate-700",
      };
  }
}

function matchesCategory(product, selectedCategory) {
  if (selectedCategory === ALL_CATEGORIES) return true;
  if (selectedCategory === PACKAGING_CATEGORY) return Boolean(product?.is_packaging);

  return (
    product?.food_group === selectedCategory ||
    product?.packaging_type === selectedCategory
  );
}

async function fetchAllProducts() {
  const limit = 100;
  let page = 1;
  let allRows = [];
  let totalCount = 0;

  while (page === 1 || allRows.length < totalCount) {
    const data = await fetchProducts({ page, limit, search: "" });
    allRows = allRows.concat(Array.isArray(data?.rows) ? data.rows : []);
    totalCount = Number(data?.totalCount || 0);
    if (!data?.rows?.length) {
      break;
    }
    page += 1;
  }

  return {
    rows: allRows,
    totalCount,
  };
}

function SummaryCard({ title, value, description, icon: Icon }) {
  const tone = title === "Open Work" || title === "Number of Product"
    ? "default"
    : "light";
  const toneClasses = {
    default: "border-0 bg-slate-950 text-white shadow-[0_18px_50px_-30px_rgba(15,23,42,0.8)]",
    light: "border border-slate-200/70 bg-white/90 text-slate-900 shadow-sm",
  };

  return (
    <Card className={toneClasses[tone]}>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardDescription
            className={tone === "default" ? "text-slate-300" : "text-slate-500"}
          >
            {title}
          </CardDescription>
          <CardTitle className="mt-3 text-3xl font-semibold tracking-tight">
            {value}
          </CardTitle>
        </div>
        <div
          className={
            tone === "default"
              ? "rounded-full bg-white/10 p-2.5 text-white"
              : "rounded-full bg-slate-100 p-2.5 text-slate-700"
          }
        >
          <Icon className="size-5" />
        </div>
      </CardHeader>
      <CardContent>
        <p className={tone === "default" ? "text-slate-300" : "text-slate-500"}>
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

const INVENTORY_ALERTS = [
  {
    id: 1,
    product: "12oz Coffee Cups",
    outlet: "Refuel",
    stockLeft: 8,
    reorderLevel: 24,
    urgency: "High",
  },
  {
    id: 2,
    product: "Takeaway Lids",
    outlet: "Groove",
    stockLeft: 3,
    reorderLevel: 10,
    urgency: "Critical",
  },
  {
    id: 3,
    product: "Paper Food Containers",
    outlet: "AUT Shop",
    stockLeft: 12,
    reorderLevel: 30,
    urgency: "Medium",
  },
  {
    id: 4,
    product: "Carry Bags",
    outlet: "Refuel",
    stockLeft: 6,
    reorderLevel: 20,
    urgency: "High",
  },
];

function getAlertTone(urgency) {
  switch (urgency) {
    case "Critical":
      return "bg-rose-100 text-rose-700";
    case "High":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-sky-100 text-sky-700";
  }
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [outlets, setOutlets] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [products, setProducts] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [sessionDetails, setSessionDetails] = useState({});
  const [selectedOutlet, setSelectedOutlet] = useState(ALL_OUTLETS);
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES);
  const [selectedMonth, setSelectedMonth] = useState(startOfMonth(new Date()));
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const accessibleOutletIds = Array.isArray(user?.outlet_ids)
    ? user.outlet_ids.map(String)
    : [];
  const accessibleOutletIdsKey = accessibleOutletIds.join(",");
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const [outletData, sessionData, productData, categoriesData] =
          await Promise.all([
            fetchOutlets({ page: 1, limit: 1000, search: "" }),
            fetchSessions(
              selectedOutlet === ALL_OUTLETS
                ? {}
                : { outlet_id: selectedOutlet }
            ),
            fetchAllProducts(),
            fetchCategories(),
          ]);

        if (cancelled) return;

        const safeOutlets = Array.isArray(outletData?.rows) ? outletData.rows : [];
        const visibleOutlets = isAdmin
          ? safeOutlets
          : safeOutlets.filter((outlet) =>
              accessibleOutletIds.includes(String(outlet.id))
            );
        const safeSessions = Array.isArray(sessionData) ? sessionData : [];
        const safeProducts = Array.isArray(productData?.rows) ? productData.rows : [];
        const safeCategories = [
          ...new Set([
            ...(categoriesData?.foodGroups || []).map((item) => item.name),
            ...(categoriesData?.packagingTypes || []).map((item) => item.name),
          ]),
        ].sort((first, second) => first.localeCompare(second));

        setOutlets(visibleOutlets);
        setSessions(safeSessions);
        setProducts(safeProducts);
        setCategoryOptions(safeCategories);

        const monthScopeKeys = new Set(
          getLastSixMonths(selectedMonth).map(getMonthKey)
        );
        const scopedSessions = safeSessions.filter((session) =>
          monthScopeKeys.has(getSessionMonthKey(session))
        );

        const detailsEntries = await Promise.all(
          scopedSessions.map(async (session) => {
            try {
              const detail = await fetchSessionDetail(session.id);
              return [session.id, detail];
            } catch {
              return [session.id, null];
            }
          })
        );

        if (cancelled) return;

        setSessionDetails(Object.fromEntries(detailsEntries));
      } catch (err) {
        if (cancelled) return;
        setError(err.message || "Failed to load dashboard.");
        setOutlets([]);
        setSessions([]);
        setProducts([]);
        setSessionDetails({});
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [accessibleOutletIdsKey, isAdmin, selectedOutlet, selectedMonth]);

  useEffect(() => {
    if (isAdmin) return;
    if (selectedOutlet === ALL_OUTLETS) return;
    if (!accessibleOutletIds.length) {
      setSelectedOutlet(ALL_OUTLETS);
      return;
    }
    if (!accessibleOutletIds.includes(String(selectedOutlet))) {
      setSelectedOutlet(ALL_OUTLETS);
    }
  }, [accessibleOutletIdsKey, isAdmin, selectedOutlet]);

  const visibleMonthKeys = new Set(getLastSixMonths(selectedMonth).map(getMonthKey));
  const visibleSessions = sessions.filter((session) =>
    visibleMonthKeys.has(getSessionMonthKey(session))
  );

  const productMap = Object.fromEntries(products.map((product) => [product.id, product]));
  const selectedMonthKey = getMonthKey(selectedMonth);
  const selectedMonthSessions = sessions.filter(
    (session) => getSessionMonthKey(session) === selectedMonthKey
  );

  const monthValueByOutlet = {};
  const trendMap = Object.fromEntries(
    getLastSixMonths(selectedMonth).map((date) => [
      getMonthKey(date),
      {
        label: date.toLocaleDateString("en-NZ", { month: "short" }),
        fullLabel: formatMonthLabel(date),
        value: 0,
      },
    ])
  );

  for (const session of visibleSessions) {
    const detail = sessionDetails[session.id];
    const monthKey = getSessionMonthKey(session);
    let sessionTotal = 0;

    if (detail?.current_entries?.length) {
      for (const entry of detail.current_entries) {
        const product = productMap[entry.product_id];
        if (!matchesCategory(product, selectedCategory)) continue;
        sessionTotal += Number(entry.quantity || 0) * Number(entry.unit_price || 0);
      }
    } else if (selectedCategory === ALL_CATEGORIES) {
      sessionTotal = Number(session.total_value || 0);
    }

    if (trendMap[monthKey]) {
      trendMap[monthKey].value += sessionTotal;
    }

    if (monthKey === selectedMonthKey) {
      const outletName = session.outlet_name || "Unknown outlet";
      monthValueByOutlet[outletName] =
        (monthValueByOutlet[outletName] || 0) + sessionTotal;
    }
  }

  const trendData = getLastSixMonths(selectedMonth).map((date) => {
    const monthKey = getMonthKey(date);
    return trendMap[monthKey];
  });

  const outletRankingData = Object.entries(monthValueByOutlet)
    .map(([name, value]) => ({
      name,
      value,
    }))
    .sort((first, second) => second.value - first.value)
    .map((item, index) => ({
      ...item,
      rank: index + 1,
    }));

  const selectedMonthValue = outletRankingData.reduce(
    (total, outlet) => total + outlet.value,
    0
  );
  const openWorkCount = selectedMonthSessions.filter((session) =>
    ["draft", "in_progress"].includes(session.status)
  ).length;
  const submittedCount = selectedMonthSessions.filter(
    (session) => session.status === "submitted"
  ).length;
  const lockedCount = selectedMonthSessions.filter(
    (session) => session.status === "locked"
  ).length;
  const completionRate = selectedMonthSessions.length
    ? Math.round((submittedCount / selectedMonthSessions.length) * 100)
    : 0;

  const filteredProducts = products.filter((product) => {
    const outletMatches =
      selectedOutlet === ALL_OUTLETS ||
      (Array.isArray(product.outlet_ids) &&
        product.outlet_ids.includes(Number(selectedOutlet)));

    return outletMatches && matchesCategory(product, selectedCategory);
  });

  const recentSessions = [...selectedMonthSessions]
    .sort((first, second) => {
      const firstDate = new Date(
        first.counted_date || `${first.year}-${first.month}-01`
      ).getTime();
      const secondDate = new Date(
        second.counted_date || `${second.year}-${second.month}-01`
      ).getTime();
      return secondDate - firstDate;
    });

  const statusCards = [
    {
      label: "Submitted",
      value: submittedCount,
      className: "bg-emerald-500",
    },
    {
      label: "In Flight",
      value: openWorkCount,
      className: "bg-sky-500",
    },
    {
      label: "Locked",
      value: lockedCount,
      className: "bg-rose-500",
    },
  ];

  function exportMonthlySummary() {
    setExporting(true);

    try {
      const previousMonth = startOfMonth(
        new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1)
      );
      const previousMonthKey = getMonthKey(previousMonth);
      const generatedDate = new Date().toISOString().slice(0, 10);

      const getSessionValue = (session, categoryFilter = ALL_CATEGORIES) => {
        const detail = sessionDetails[session.id];

        if (detail?.current_entries?.length) {
          return detail.current_entries.reduce((total, entry) => {
            const product = productMap[entry.product_id];
            if (!matchesCategory(product, categoryFilter)) return total;
            return (
              total + Number(entry.quantity || 0) * Number(entry.unit_price || 0)
            );
          }, 0);
        }

        if (categoryFilter === ALL_CATEGORIES) {
          return Number(session.total_value || 0);
        }

        return 0;
      };

      const currentSessions = sessions.filter(
        (session) => getSessionMonthKey(session) === selectedMonthKey
      );
      const previousSessions = sessions.filter(
        (session) => getSessionMonthKey(session) === previousMonthKey
      );

      const currentValueByOutlet = {};
      const previousValueByOutlet = {};

      for (const session of currentSessions) {
        const outletName = session.outlet_name || "Unknown outlet";
        currentValueByOutlet[outletName] =
          (currentValueByOutlet[outletName] || 0) + getSessionValue(session);
      }

      for (const session of previousSessions) {
        const outletName = session.outlet_name || "Unknown outlet";
        previousValueByOutlet[outletName] =
          (previousValueByOutlet[outletName] || 0) + getSessionValue(session);
      }

      const allOutletNames = Array.from(
        new Set([
          ...Object.keys(currentValueByOutlet),
          ...Object.keys(previousValueByOutlet),
        ])
      ).sort((first, second) => first.localeCompare(second));

      const outletSummaryRows = allOutletNames.map((name) => {
        const currentValue = Number(currentValueByOutlet[name] || 0);
        const previousValue = Number(previousValueByOutlet[name] || 0);
        const difference = currentValue - previousValue;
        const percentChange = previousValue !== 0 ? difference / previousValue : 0;

        return [name, currentValue, previousValue, difference, percentChange, ""];
      });

      const grandTotalCurrent = outletSummaryRows.reduce(
        (total, row) => total + Number(row[1] || 0),
        0
      );
      const grandTotalPrevious = outletSummaryRows.reduce(
        (total, row) => total + Number(row[2] || 0),
        0
      );
      const overallDifference = grandTotalCurrent - grandTotalPrevious;
      const overallPercentChange =
        grandTotalPrevious !== 0 ? overallDifference / grandTotalPrevious : 0;

      const categoryNames = categoryOptions.length
        ? categoryOptions
        : Array.from(
            new Set(
              products.flatMap((product) =>
                [product.food_group, product.packaging_type].filter(Boolean)
              )
            )
          ).sort((first, second) => first.localeCompare(second));

      const categoryRows = categoryNames.map((categoryName) => {
        const currentTotal = currentSessions.reduce(
          (total, session) => total + getSessionValue(session, categoryName),
          0
        );
        const previousTotal = previousSessions.reduce(
          (total, session) => total + getSessionValue(session, categoryName),
          0
        );
        const difference = currentTotal - previousTotal;
        const percentChange = previousTotal !== 0 ? difference / previousTotal : 0;

        return [categoryName, currentTotal, previousTotal, difference, percentChange];
      });

      const rows = [
        ["Monthly Stocktake Summary - All Outlets"],
        [],
        ["Reporting Month", formatMonthLabel(selectedMonth), "", "", "Generated Date", generatedDate],
        ["Report Type", "All Outlets Monthly Report", "", "", "Outlet", "All Outlets"],
        [
          "Selected Category Filter",
          selectedCategory === ALL_CATEGORIES
            ? "All categories"
            : selectedCategory === PACKAGING_CATEGORY
              ? "Packaging"
              : selectedCategory,
        ],
        [],
        ["Outlet Summary Table"],
        ["Outlet", "Current Month Value", "Previous Month Value", "Difference", "% Change", "Notes"],
        ...outletSummaryRows,
        [],
        ["Final Summary"],
        ["Grand Total Current Month", grandTotalCurrent],
        ["Grand Total Previous Month", grandTotalPrevious],
        ["Overall Difference", overallDifference],
        ["Overall % Change", overallPercentChange],
        [],
        ["Category Breakdown (All Outlets)"],
        ["Category", "Current Month Total", "Previous Month Total", "Difference", "% Change"],
        ...categoryRows,
      ];

      const csv = rows
        .map((row) =>
          row
            .map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`)
            .join(",")
        )
        .join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Outlets-monthly-report-${selectedMonthKey}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col bg-[radial-gradient(circle_at_top,#ffffff_0%,#f8fafc_40%,#eef2ff_100%)] p-4 sm:p-6">
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6">
        <section className="overflow-hidden rounded-[28px] border border-white/70 bg-slate-950 text-white shadow-[0_25px_80px_-32px_rgba(15,23,42,0.55)]">
          <div className="grid gap-8 px-6 py-6 sm:px-8 lg:grid-cols-[1.35fr_0.65fr]">
            <div className="space-y-6">
              <Badge className="w-fit border border-white/10 bg-white/10 text-white">
                Reporting & Progress
              </Badge>
              <div className="space-y-3">
                <h1 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
                  AUT Stocktake Dashboard
                </h1>
                <p className="max-w-2xl text-sm text-slate-300 sm:text-base">
                  Review monthly stock value, track outlet progress, and compare
                  branch performance at a glance.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[220px_220px_220px]">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                    >
                      <span className="flex items-center gap-2">
                        <CalendarDaysIcon className="size-4" />
                        {formatMonthLabel(selectedMonth)}
                      </span>
                      <ChevronDownIcon className="size-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedMonth}
                      month={selectedMonth}
                      onMonthChange={setSelectedMonth}
                      onSelect={(date) => {
                        if (date) {
                          setSelectedMonth(startOfMonth(date));
                        }
                      }}
                      captionLayout="dropdown"
                      fromYear={2020}
                      toYear={2035}
                    />
                  </PopoverContent>
                </Popover>

                <Select value={selectedOutlet} onValueChange={setSelectedOutlet}>
                  <SelectTrigger className="w-full border-white/15 bg-white/5 text-white">
                    <SelectValue placeholder="Select outlet" />
                  </SelectTrigger>
                  <SelectContent align="start">
                    <SelectItem value={ALL_OUTLETS}>
                      {isAdmin ? "All outlets" : "All accessible outlets"}
                    </SelectItem>
                    {outlets.map((outlet) => (
                      <SelectItem key={outlet.id} value={String(outlet.id)}>
                        {outlet.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedOutlet === ALL_OUTLETS ? (
                  <Button
                    onClick={exportMonthlySummary}
                    disabled={loading || exporting}
                    className="w-full bg-white text-slate-950 hover:bg-white/90"
                  >
                    <DownloadIcon className="size-4" />
                    {exporting ? "Exporting..." : "Export Monthly Summary"}
                  </Button>
                ) : null}
              </div>

              <div className="flex gap-2">
                <Button
                  asChild
                  className="bg-white text-slate-950 hover:bg-white/90! hover:text-slate-950"
                >
                  <Link to="/stock-count">
                    Open stock counts
                    <ArrowRightIcon className="size-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                >
                  <Link to="/products">Manage products</Link>
                </Button>
              </div>
            </div>

            <Card className="border-0 bg-white/6 text-white ring-1 ring-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardDescription className="text-slate-300">
                  {formatMonthLabel(selectedMonth)}
                </CardDescription>
                <CardTitle className="text-5xl font-semibold">
                  {formatCurrency(selectedMonthValue)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                    <p className="text-sm text-slate-300">Completion rate</p>
                    <p className="mt-2 text-2xl font-semibold">
                      {completionRate}%
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                    <p className="text-sm text-slate-300">Open work</p>
                    <p className="mt-2 text-2xl font-semibold">
                      {openWorkCount}
                    </p>
                  </div>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-white"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
                <p className="text-sm text-slate-300">
                  {submittedCount} submitted and {lockedCount} locked for{" "}
                  {selectedOutlet === ALL_OUTLETS
                    ? "all outlets"
                    : "the selected outlet"}
                  .
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Total Stock Value"
            value={formatCurrency(selectedMonthValue)}
            description="Current month stock value"
            icon={TrendingUpIcon}
          />
          <SummaryCard
            title="Open Work"
            value={String(openWorkCount)}
            description="Draft and in-progress stocktakes"
            icon={Clock3Icon}
          />
          <SummaryCard
            title="Submitted"
            value={String(submittedCount)}
            description="Completed sessions this month"
            icon={CheckCircle2Icon}
          />
          <SummaryCard
            title="Number of Product"
            value={String(filteredProducts.length)}
            description="Products in the current dashboard scope"
            icon={PackageIcon}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <Card className="border border-slate-200/70 bg-white/85 shadow-sm backdrop-blur">
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Stock Value Trend (Last 6 Months)</CardTitle>
                <CardDescription>
                  Compare monthly stock value and spot increases or decreases over
                  time.
                </CardDescription>
              </div>
              <CardAction className="w-full sm:w-60">
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className="w-full border-slate-200 bg-white">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent align="end">
                    <SelectItem value={ALL_CATEGORIES}>All categories</SelectItem>
                    <SelectItem value={PACKAGING_CATEGORY}>Packaging</SelectItem>
                    {categoryOptions.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardAction>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ left: 12, right: 12 }}>
                    <CartesianGrid vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 12 }}
                      tickFormatter={(value) =>
                        new Intl.NumberFormat("en-NZ", {
                          notation: "compact",
                          maximumFractionDigits: 1,
                        }).format(value)
                      }
                    />
                    <Tooltip
                      formatter={(value) => formatCurrency(value)}
                      labelFormatter={(label, payload) =>
                        payload?.[0]?.payload?.fullLabel || label
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#0f172a"
                      strokeWidth={3}
                      dot={{ fill: "#0f172a", strokeWidth: 0, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200/70 bg-white/85 shadow-sm backdrop-blur">
            <CardHeader>
              <CardDescription>Outlet ranking</CardDescription>
              <CardTitle>Outlet Stock Value Ranking</CardTitle>
              <CardDescription>
                Compare outlets by stock value for {formatMonthLabel(selectedMonth)}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              
              <div className="mt-4 space-y-2">
                <div className="max-h-50 space-y-2 overflow-y-auto pr-1">
                  {outletRankingData.map((outlet) => (
                    <div
                      key={outlet.name}
                      className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm"
                    >
                      <span className="font-medium text-slate-900">
                        {outlet.rank}. {outlet.name}
                      </span>
                      <span className="text-slate-600">
                        {formatCurrency(outlet.value)}
                      </span>
                    </div>
                  ))}
                </div>
                {!loading && outletRankingData.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                    No outlet values available for this month.
                  </div>
                ) : null}
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-white p-2 text-slate-700 shadow-sm">
                      <ActivityIcon className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        Focus area
                      </p>
                      <p className="text-sm text-slate-500">
                        {openWorkCount > 0
                          ? `${openWorkCount} active sessions still need attention this month.`
                          : "No active sessions are waiting right now."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.85fr_0.85fr_1.1fr]">
          <Card className="border-slate-200/70 bg-white/90 shadow-sm">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Jump straight into the next reporting or setup task.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <Link
                to="/stock-count"
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-white"
              >
                <ClipboardListIcon className="size-5 text-slate-900" />
                <p className="mt-4 font-medium text-slate-900">Review stocktakes</p>
                <p className="mt-1 text-sm text-slate-500">
                  Continue open work and inspect completed sessions.
                </p>
              </Link>
              <Link
                to="/branches"
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-white"
              >
                <StoreIcon className="size-5 text-slate-900" />
                <p className="mt-4 font-medium text-slate-900">Manage outlets</p>
                <p className="mt-1 text-sm text-slate-500">
                  Keep outlet records and branch coverage up to date.
                </p>
              </Link>
              <Link
                to="/products"
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-white"
              >
                <PackageIcon className="size-5 text-slate-900" />
                <p className="mt-4 font-medium text-slate-900">Update products</p>
                <p className="mt-1 text-sm text-slate-500">
                  Refresh product details before the next reporting cycle.
                </p>
              </Link>
              <Link
                to="/branch-assignment"
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-white"
              >
                <LayoutGridIcon className="size-5 text-slate-900" />
                <p className="mt-4 font-medium text-slate-900">Check assignments</p>
                <p className="mt-1 text-sm text-slate-500">
                  Confirm outlet responsibilities and session setup.
                </p>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-slate-200/70 bg-white/90 shadow-sm">
            <CardHeader>
              <CardTitle>Inventory Alerts</CardTitle>
              <CardDescription>
                Products running low and likely needing reordering soon.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
                {INVENTORY_ALERTS.map((alert) => (
                  <div
                    key={alert.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900">
                          {alert.product}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {alert.outlet}
                        </p>
                      </div>
                      <Badge className={getAlertTone(alert.urgency)}>
                        {alert.urgency}
                      </Badge>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-sm">
                      <span className="text-slate-500">Stock left</span>
                      <span className="font-medium text-slate-900">
                        {alert.stockLeft}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <span className="text-slate-500">Reorder level</span>
                      <span className="font-medium text-slate-900">
                        {alert.reorderLevel}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/70 bg-white/90 shadow-sm">
            <CardHeader>
              <CardTitle>Recent Stocktakes</CardTitle>
              <CardDescription>
                Latest activity for {formatMonthLabel(selectedMonth)}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
                {loading ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                    Loading dashboard data...
                  </div>
                ) : recentSessions.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                    No stocktake sessions found for this month.
                  </div>
                ) : (
                  recentSessions.map((session) => {
                    const status = getStatusMeta(session.status);
                    const detail = sessionDetails[session.id];
                    let sessionValue = Number(session.total_value || 0);

                    if (detail?.current_entries?.length && selectedCategory !== ALL_CATEGORIES) {
                      sessionValue = detail.current_entries.reduce((total, entry) => {
                        const product = productMap[entry.product_id];
                        if (!matchesCategory(product, selectedCategory)) return total;
                        return (
                          total +
                          Number(entry.quantity || 0) * Number(entry.unit_price || 0)
                        );
                      }, 0);
                    }

                    return (
                      <Link
                        key={session.id}
                        to={`/stock-count/${session.id}`}
                        state={{
                          assignmentName:
                            session.name || session.assignment_name || "",
                        }}
                        className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 transition hover:border-slate-300 hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-slate-900">
                              {session.assignment_name ||
                                session.name ||
                                session.outlet_name ||
                                "Stocktake session"}
                            </p>
                            <Badge className={status.className}>{status.label}</Badge>
                          </div>
                          <p className="text-sm text-slate-500">
                            {session.outlet_name || "Unknown outlet"} •{" "}
                            {session.counted_by || "No counter assigned"}
                          </p>
                        </div>
                        <div className="text-sm text-slate-500 sm:text-right">
                          <p>{formatDateTime(session.counted_date)}</p>
                          <p className="font-medium text-slate-900">
                            {formatCurrency(sessionValue)}
                          </p>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
