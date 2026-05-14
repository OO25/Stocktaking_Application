import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowRightIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  ClipboardListIcon,
  Clock3Icon,
  PackageCheckIcon,
  PackageIcon,
  StoreIcon,
  TrendingUpIcon,
} from "lucide-react";
import { fetchOutlets } from "../../api/outlets.js";
import { fetchProducts } from "../../api/products.js";
import { fetchSessionDetail, fetchSessions } from "../../api/stocktake.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { Badge } from "../../components/ui/badge.jsx";
import { Button } from "../../components/ui/button.jsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card.jsx";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    minimumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatMonthLabel(date) {
  return date.toLocaleDateString("en-NZ", {
    month: "long",
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
  });
}

function getMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getSessionMonthKey(session) {
  return `${session.year}-${String(session.month).padStart(2, "0")}`;
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

function getSessionValue(session, detail) {
  if (detail?.current_entries?.length) {
    return detail.current_entries.reduce(
      (total, entry) =>
        total + Number(entry.quantity || 0) * Number(entry.unit_price || 0),
      0
    );
  }

  return Number(session.total_value || 0);
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
    if (!data?.rows?.length) break;
    page += 1;
  }

  return allRows;
}

function SummaryCard({ title, value, description, icon: Icon, dark = false }) {
  return (
    <Card
      className={
        dark
          ? "border-0 bg-slate-950 text-white shadow-[0_18px_50px_-30px_rgba(15,23,42,0.8)]"
          : "border border-slate-200/70 bg-white/90 text-slate-900 shadow-sm"
      }
    >
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardDescription className={dark ? "text-slate-300" : "text-slate-500"}>
            {title}
          </CardDescription>
          <CardTitle className="mt-3 text-3xl font-semibold tracking-tight">
            {value}
          </CardTitle>
        </div>
        <div
          className={
            dark
              ? "rounded-full bg-white/10 p-2.5 text-white"
              : "rounded-full bg-slate-100 p-2.5 text-slate-700"
          }
        >
          <Icon className="size-5" />
        </div>
      </CardHeader>
      <CardContent>
        <p className={dark ? "text-slate-300" : "text-slate-500"}>
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

export default function BranchDashboardPage() {
  const { user } = useAuth();
  const [outlets, setOutlets] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [products, setProducts] = useState([]);
  const [sessionDetails, setSessionDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const assignedOutletIds = useMemo(
    () =>
      Array.isArray(user?.outlet_ids)
        ? user.outlet_ids.map((id) => Number(id)).filter(Number.isInteger)
        : [],
    [user?.outlet_ids]
  );
  const assignedOutletKey = assignedOutletIds.join(",");
  const currentDate = new Date();
  const currentMonthKey = getMonthKey(currentDate);

  useEffect(() => {
    let cancelled = false;

    async function loadBranchDashboard() {
      try {
        setLoading(true);
        setError("");

        const [outletData, sessionData, productData] = await Promise.all([
          fetchOutlets({ page: 1, limit: 1000, search: "" }),
          fetchSessions(),
          fetchAllProducts(),
        ]);

        if (cancelled) return;

        const visibleOutlets = (Array.isArray(outletData?.rows) ? outletData.rows : [])
          .filter((outlet) => assignedOutletIds.includes(Number(outlet.id)));
        const safeSessions = Array.isArray(sessionData) ? sessionData : [];
        const visibleProducts = productData.filter((product) =>
          Array.isArray(product.outlet_ids)
            ? product.outlet_ids.some((id) => assignedOutletIds.includes(Number(id)))
            : false
        );
        const detailSessions = safeSessions.filter((session) =>
          getLastSixMonths(currentDate)
            .map(getMonthKey)
            .includes(getSessionMonthKey(session))
        );

        setOutlets(visibleOutlets);
        setSessions(safeSessions);
        setProducts(visibleProducts);

        const detailsEntries = await Promise.all(
          detailSessions.map(async (session) => {
            try {
              const detail = await fetchSessionDetail(session.id);
              return [session.id, detail];
            } catch {
              return [session.id, null];
            }
          })
        );

        if (!cancelled) {
          setSessionDetails(Object.fromEntries(detailsEntries));
        }
      } catch (err) {
        if (cancelled) return;
        setError(err.message || "Failed to load branch dashboard.");
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

    loadBranchDashboard();

    return () => {
      cancelled = true;
    };
  }, [assignedOutletKey]);

  const currentMonthSessions = sessions.filter(
    (session) => getSessionMonthKey(session) === currentMonthKey
  );

  const submittedCount = currentMonthSessions.filter(
    (session) => session.status === "submitted"
  ).length;
  const lockedCount = currentMonthSessions.filter(
    (session) => session.status === "locked"
  ).length;
  const openWorkCount = currentMonthSessions.filter((session) =>
    ["draft", "in_progress"].includes(session.status)
  ).length;
  const completeCount = submittedCount + lockedCount;
  const completionRate = currentMonthSessions.length
    ? Math.round((completeCount / currentMonthSessions.length) * 100)
    : 0;

  const currentMonthValue = currentMonthSessions.reduce(
    (total, session) => total + getSessionValue(session, sessionDetails[session.id]),
    0
  );

  const latestSessionByOutlet = new Map();
  for (const session of sessions) {
    const previous = latestSessionByOutlet.get(session.outlet_id);
    const sessionDate = new Date(
      Number(session.year),
      Number(session.month) - 1,
      session.counted_date ? new Date(session.counted_date).getDate() : 1
    ).getTime();
    const previousDate = previous
      ? new Date(
          Number(previous.year),
          Number(previous.month) - 1,
          previous.counted_date ? new Date(previous.counted_date).getDate() : 1
        ).getTime()
      : -Infinity;

    if (!previous || sessionDate > previousDate) {
      latestSessionByOutlet.set(session.outlet_id, session);
    }
  }

  const outletOverallValue = [...latestSessionByOutlet.values()].reduce(
    (total, session) => total + getSessionValue(session, sessionDetails[session.id]),
    0
  );

  const monthlyTrendData = getLastSixMonths(currentDate).map((date) => {
    const monthKey = getMonthKey(date);
    const value = sessions
      .filter((session) => getSessionMonthKey(session) === monthKey)
      .reduce(
        (total, session) =>
          total + getSessionValue(session, sessionDetails[session.id]),
        0
      );

    return {
      label: date.toLocaleDateString("en-NZ", { month: "short" }),
      fullLabel: formatMonthLabel(date),
      value,
    };
  });

  const outletValueData = outlets
    .map((outlet) => {
      const latestSession = latestSessionByOutlet.get(outlet.id);
      return {
        name: outlet.name,
        value: latestSession
          ? getSessionValue(latestSession, sessionDetails[latestSession.id])
          : 0,
      };
    })
    .sort((first, second) => second.value - first.value);

  const recentSessions = [...sessions]
    .sort((first, second) => {
      const firstDate = new Date(
        first.counted_date || `${first.year}-${first.month}-01`
      ).getTime();
      const secondDate = new Date(
        second.counted_date || `${second.year}-${second.month}-01`
      ).getTime();
      return secondDate - firstDate;
    })
    .slice(0, 6);

  const branchNames = outlets.map((outlet) => outlet.name).join(", ");
  const stocktakeProgressText = currentMonthSessions.length
    ? `${completeCount} of ${currentMonthSessions.length} stocktakes complete`
    : "No stocktake session for this month";

  return (
    <div className="flex flex-1 flex-col bg-[radial-gradient(circle_at_top,#ffffff_0%,#f8fafc_44%,#eef2ff_100%)] p-4 sm:p-6">
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6">
        <section className="overflow-hidden rounded-[28px] border border-white/70 bg-slate-950 text-white shadow-[0_25px_80px_-32px_rgba(15,23,42,0.55)]">
          <div className="grid gap-8 px-6 py-6 sm:px-8 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="space-y-6">
              <Badge className="w-fit border border-white/10 bg-white/10 text-white">
                Branch Reporting
              </Badge>
              <div className="space-y-3">
                <h1 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
                  Branch Dashboard
                </h1>
                <p className="max-w-2xl text-sm text-slate-300 sm:text-base">
                  {branchNames
                    ? `Stocktake progress and value for ${branchNames}.`
                    : "Stocktake progress and value for your assigned outlet."}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm">
                  <CalendarDaysIcon className="size-4" />
                  {formatMonthLabel(currentDate)}
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm">
                  <StoreIcon className="size-4" />
                  {outlets.length || assignedOutletIds.length} assigned outlet
                  {(outlets.length || assignedOutletIds.length) === 1 ? "" : "s"}
                </div>
              </div>

              <Button
                asChild
                className="bg-white text-slate-950 hover:bg-white/90! hover:text-slate-950"
              >
                <Link to="/stock-count">
                  Open stock counts
                  <ArrowRightIcon className="size-4" />
                </Link>
              </Button>
            </div>

            <Card className="border-0 bg-white/6 text-white ring-1 ring-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardDescription className="text-slate-300">
                  Current stocktake progress
                </CardDescription>
                <CardTitle className="text-5xl font-semibold">
                  {completionRate}%
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-white"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
                <p className="text-sm text-slate-300">{stocktakeProgressText}</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                    <p className="text-sm text-slate-300">Open</p>
                    <p className="mt-2 text-2xl font-semibold">{openWorkCount}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                    <p className="text-sm text-slate-300">Submitted</p>
                    <p className="mt-2 text-2xl font-semibold">{submittedCount}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                    <p className="text-sm text-slate-300">Locked</p>
                    <p className="mt-2 text-2xl font-semibold">{lockedCount}</p>
                  </div>
                </div>
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
            title="Current Month Value"
            value={formatCurrency(currentMonthValue)}
            description="Value from this month's stocktake"
            icon={TrendingUpIcon}
            dark
          />
          <SummaryCard
            title="Outlet Value Overall"
            value={formatCurrency(outletOverallValue)}
            description="Latest stocktake value for assigned outlet"
            icon={StoreIcon}
          />
          <SummaryCard
            title="Stocktake Progress"
            value={`${completionRate}%`}
            description={stocktakeProgressText}
            icon={PackageCheckIcon}
          />
          <SummaryCard
            title="Assigned Products"
            value={String(products.length)}
            description="Products connected to your outlet"
            icon={PackageIcon}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className="border border-slate-200/70 bg-white/85 shadow-sm backdrop-blur">
            <CardHeader>
              <CardTitle>Stock Value Trend</CardTitle>
              <CardDescription>
                Last six months for your assigned outlet.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyTrendData} margin={{ left: 12, right: 12 }}>
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
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {monthlyTrendData.map((entry) => (
                        <Cell key={entry.label} fill="#0f172a" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200/70 bg-white/85 shadow-sm backdrop-blur">
            <CardHeader>
              <CardTitle>Outlet Value</CardTitle>
              <CardDescription>
                Latest stocktake value by assigned outlet.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {outletValueData.map((outlet) => (
                  <div
                    key={outlet.name}
                    className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm"
                  >
                    <span className="font-medium text-slate-900">{outlet.name}</span>
                    <span className="text-slate-600">
                      {formatCurrency(outlet.value)}
                    </span>
                  </div>
                ))}
                {!loading && outletValueData.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                    No assigned outlet value is available yet.
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.7fr_1.3fr]">
          <Card className="border-slate-200/70 bg-white/90 shadow-sm">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Continue stocktake work for your outlet.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                to="/stock-count"
                className="block rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-white"
              >
                <ClipboardListIcon className="size-5 text-slate-900" />
                <p className="mt-4 font-medium text-slate-900">Review stocktakes</p>
                <p className="mt-1 text-sm text-slate-500">
                  Open current sessions and update count progress.
                </p>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-slate-200/70 bg-white/90 shadow-sm">
            <CardHeader>
              <CardTitle>Recent Stocktakes</CardTitle>
              <CardDescription>Latest activity for your outlet.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
                {loading ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                    Loading dashboard data...
                  </div>
                ) : recentSessions.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                    No stocktake sessions found for your outlet.
                  </div>
                ) : (
                  recentSessions.map((session) => {
                    const status = getStatusMeta(session.status);
                    const sessionValue = getSessionValue(
                      session,
                      sessionDetails[session.id]
                    );

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
                            {session.outlet_name || "Unknown outlet"}
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
