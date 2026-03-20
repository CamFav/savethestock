export type KpiTrend = {
  value: string;
  direction: "up" | "down" | "flat";
  label: string;
};

export type DashboardKpi = {
  id: string;
  title: string;
  value: string;
  hint: string;
  trend: KpiTrend;
};

export type ReceptionStatus = "draft" | "validated" | "blocked";

export type ReceptionRow = {
  id: string;
  reference: string;
  supplier: string;
  lines: number;
  receivedAt: string;
  status: ReceptionStatus;
};

export type SetupTask = {
  id: string;
  title: string;
  description: string;
  done: boolean;
  ctaLabel: string;
};

export type DataQualityAlert = {
  id: string;
  severity: "high" | "medium" | "low";
  title: string;
  description: string;
};

export type QuickAction = {
  id: string;
  title: string;
  description: string;
  to: string;
};

export type DashboardMockData = {
  kpis: DashboardKpi[];
  recentReceptions: ReceptionRow[];
  setupTasks: SetupTask[];
  alerts: DataQualityAlert[];
  quickActions: QuickAction[];
};

export const dashboardMock: DashboardMockData = {
  kpis: [
    {
      id: "stock-value",
      title: "Stock value",
      value: "€ 182,430",
      hint: "Current warehouse valuation",
      trend: { value: "+3.2%", direction: "up", label: "vs last week" },
    },
    {
      id: "low-stock",
      title: "Low stock SKUs",
      value: "18",
      hint: "Items below safety threshold",
      trend: { value: "-2", direction: "up", label: "improved today" },
    },
    {
      id: "blocked-lots",
      title: "Blocked lots",
      value: "3",
      hint: "Pending quality investigation",
      trend: { value: "+1", direction: "down", label: "since yesterday" },
    },
    {
      id: "lead-time",
      title: "Avg supplier lead time",
      value: "5.4d",
      hint: "Rolling 30-day average",
      trend: { value: "flat", direction: "flat", label: "stable" },
    },
  ],
  recentReceptions: [],
  setupTasks: [
    {
      id: "categories",
      title: "Define category taxonomy",
      description: "Create clear category groups for inventory reporting and traceability.",
      done: false,
      ctaLabel: "Add categories",
    },
    {
      id: "suppliers",
      title: "Register suppliers",
      description: "Attach lead times and sourcing metadata to each supplier account.",
      done: false,
      ctaLabel: "Add suppliers",
    },
    {
      id: "products",
      title: "Create product catalog",
      description: "Populate SKU records to unlock receptions, lots, and stock tracking.",
      done: false,
      ctaLabel: "Add products",
    },
  ],
  alerts: [],
  quickActions: [
    {
      id: "new-category",
      title: "New category",
      description: "Structure taxonomy for product analytics.",
      to: "/app/categories",
    },
    {
      id: "new-supplier",
      title: "New supplier",
      description: "Create a source for inbound receptions.",
      to: "/app/suppliers",
    },
    {
      id: "new-product",
      title: "New product",
      description: "Add a SKU with thresholds and metadata.",
      to: "/app/products",
    },
    {
      id: "new-reception",
      title: "Log reception",
      description: "Capture inbound stock from a supplier.",
      to: "/app/receptions",
    },
  ],
};
