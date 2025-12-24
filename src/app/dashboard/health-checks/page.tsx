"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import Loader from "@/components/loader";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
  RefreshCcw,
  Server,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

type EnvironmentKey = "dev" | "prod";

type ServiceEndpoint = {
  id: string;
  label: string;
  path: string;
  region?: string;
};

type HealthService = {
  id: string;
  name: string;
  description: string;
  endpoints: ServiceEndpoint[];
};

type EndpointStatus = {
  status: "healthy" | "down";
  httpStatus?: number;
  latency?: number | null;
  lastChecked?: number;
  error?: string;
  details?: unknown;
  rawBody?: string | null;
  url: string;
};

type DetailContext = {
  service: HealthService;
  endpoint: ServiceEndpoint;
};

const DEFAULT_BASES: Record<EnvironmentKey, string> = {
  dev: "https://dev-mdr.mydigirecords.com/v1",
  prod: "https://prod-mdr.mydigirecords.com/v1",
};

const BASE_URLS: Record<EnvironmentKey, string> = {
  dev: process.env.NEXT_PUBLIC_DEV_API_BASE ?? DEFAULT_BASES.dev,
  prod: process.env.NEXT_PUBLIC_PROD_API_BASE ?? DEFAULT_BASES.prod,
};

const ENVIRONMENT_LABELS: Record<EnvironmentKey, string> = {
  dev: "Development",
  prod: "Production",
};

const SERVICE_CATALOG: HealthService[] = [
  {
    id: "auth",
    name: "Auth",
    description: "Login, OTP and account access endpoints.",
    endpoints: [
      { id: "auth-us", label: "US", path: "/auth-mydig/api/us/health", region: "US" },
      { id: "auth-in", label: "India", path: "/auth-mydig/api/in/health", region: "IN" },
    ],
  },
  {
    id: "healthhub",
    name: "HealthHub",
    description: "Hub for care plans and vitals.",
    endpoints: [
      { id: "healthhub-us", label: "US", path: "/healthhub-mydi-api/api/us/health", region: "US" },
      { id: "healthhub-in", label: "India", path: "/healthhub-mydi-api/api/in/health", region: "IN" },
    ],
  },
  {
    id: "healthsnapshot",
    name: "Health Snapshot",
    description: "Aggregated health snapshot widgets.",
    endpoints: [
      { id: "healthsnapshot-us", label: "US", path: "/healthsnapshot-mydig/api/us/health", region: "US" },
      { id: "healthsnapshot-in", label: "India", path: "/healthsnapshot-mydig/api/in/health", region: "IN" },
    ],
  },
  {
    id: "homepage",
    name: "Homepage",
    description: "Marketing/home landing APIs.",
    endpoints: [
      { id: "homepage-us", label: "US", path: "/homepage/api/us/health", region: "US" },
      { id: "homepage-in", label: "India", path: "/homepage/api/in/health", region: "IN" },
    ],
  },
  {
    id: "medication",
    name: "Medication",
    description: "Medication management APIs.",
    endpoints: [
      { id: "medication-us", label: "US", path: "/medication-mydig-api/api/us/health", region: "US" },
      { id: "medication-in", label: "India", path: "/medication-mydig-api/api/in/health", region: "IN" },
    ],
  },
  {
    id: "members",
    name: "Members",
    description: "Member profile and enrollment APIs.",
    endpoints: [
      { id: "members-us", label: "US", path: "/members/api/us/health", region: "US" },
      { id: "members-in", label: "India", path: "/members/api/in/health", region: "IN" },
    ],
  },
  {
    id: "prenatal",
    name: "Prenatal",
    description: "Prenatal program workflows.",
    endpoints: [
      { id: "prenatal-us", label: "US", path: "/prenatal-mydig-api/api/us/health", region: "US" },
      { id: "prenatal-in", label: "India", path: "/prenatal-mydig-api/api/in/health", region: "IN" },
    ],
  },
  {
    id: "records",
    name: "Records",
    description: "Medical record ingestion.",
    endpoints: [
      { id: "records-global", label: "Global", path: "/records-mydig/health" },
    ],
  },
  {
    id: "uspayment",
    name: "US Payment",
    description: "Stripe and card orchestration (US).",
    endpoints: [
      { id: "uspayment", label: "US", path: "/uspayment/health", region: "US" },
    ],
  },
  {
    id: "payment",
    name: "Payment (Flask)",
    description: "Legacy payment (Flask) endpoints.",
    endpoints: [
      { id: "payment-us", label: "US", path: "/payment-mydig-api/api/us/health", region: "US" },
      { id: "payment-in", label: "India", path: "/payment-mydig-api/api/in/health", region: "IN" },
    ],
  },
  {
    id: "vaccines",
    name: "Vaccines",
    description: "Vaccination schedule services.",
    endpoints: [
      { id: "vaccines-us", label: "US", path: "/vaccines-mydig-api/api/us/health", region: "US" },
      { id: "vaccines-in", label: "India", path: "/vaccines-mydig-api/api/in/health", region: "IN" },
    ],
  },
  {
    id: "mdr-ai",
    name: "MDR AI",
    description: "AI-powered health services.",
    endpoints: [
      { id: "mdr-ai-global", label: "Global", path: "/mdr-ai/api/us/health" },
    ],
  },
  {
  id: "mdr-pro",
  name: "MDR Pro (HIMs)",
  description: "Hospital Information Management System backend.",
  endpoints: [
    {
      id: "mdr-pro-in",
      label: "India",
      path: "/hims-backend/api/health", // only used as fallback/display
      region: "IN",
    },
  ],
},
];

const statusStyles: Record<
  EndpointStatus["status"] | "pending",
  { label: string; badge: string; dot: string }
> = {
  healthy: {
    label: "Healthy",
    badge: "bg-green-100 text-green-700 border-green-200",
    dot: "bg-green-500",
  },
  down: {
    label: "Down",
    badge: "bg-red-100 text-red-700 border-red-200",
    dot: "bg-red-500",
  },
  pending: {
    label: "Pending",
    badge: "bg-gray-100 text-gray-600 border-gray-200",
    dot: "bg-gray-400",
  },
};

function getAggregateStatus(service: HealthService, statusMap: Record<string, EndpointStatus | undefined>) {
  const statuses = service.endpoints.map((endpoint) => statusMap[endpoint.id]?.status);
  if (statuses.every((status) => !status)) return "pending";
  if (statuses.some((status) => status === "down")) return "down";
  if (statuses.some((status) => !status)) return "pending";
  return "healthy";
}

export default function HealthChecksPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedEnv, setSelectedEnv] = useState<EnvironmentKey>("dev");
  const [statusMap, setStatusMap] = useState<Record<string, EndpointStatus | undefined>>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailContext, setDetailContext] = useState<DetailContext | null>(null);
  const [detailStatus, setDetailStatus] = useState<EndpointStatus | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  /* Sidebar persistence */
  useEffect(() => {
    const savedCollapsed = localStorage.getItem("sidebarCollapsed");
    if (savedCollapsed !== null) {
      setSidebarCollapsed(savedCollapsed === "true");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchHealth = useCallback(
  async (endpoint: ServiceEndpoint, env: EnvironmentKey): Promise<EndpointStatus> => {
    // Special case for MDR Pro
    if (endpoint.id === "mdr-pro-in") {
      const fullUrl =
        env === "dev"
          ? "https://dev-mdr-in.mydigirecords.com/v1/hims-backend/api/health"
          : "https://prod-mdr-in.mydigirecords.com/v1/hims-backend/api/health"; // adjust prod if needed

      const response = await fetch("/api/health-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: fullUrl }),
      });

      // ... same error/response handling as before
      if (!response.ok) {
        const errorMessage = await response.text();
        return {
          status: "down",
          latency: null,
          lastChecked: Date.now(),
          error: errorMessage || "Health check failed",
          url: fullUrl,
        };
      }

      const payload = await response.json();
      return payload as EndpointStatus;
    }

    // All other endpoints: use existing path + env logic
    const response = await fetch("/api/health-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: endpoint.path,
        env,
      }),
    });

    if (!response.ok) {
      const errorMessage = await response.text();
      return {
        status: "down",
        latency: null,
        lastChecked: Date.now(),
        error: errorMessage || "Health check proxy error",
        url: `${BASE_URLS[env]}${endpoint.path}`,
      };
    }

    const payload = (await response.json()) as EndpointStatus;
    return payload;
  },
  []
);

  const refreshEndpoint = useCallback(
    async (endpoint: ServiceEndpoint) => {
      setLoadingMap((prev) => ({ ...prev, [endpoint.id]: true }));
      const status = await fetchHealth(endpoint, selectedEnv);
      setStatusMap((prev) => ({ ...prev, [endpoint.id]: status }));
      setLoadingMap((prev) => {
        const next = { ...prev };
        delete next[endpoint.id];
        return next;
      });
      return status;
    },
    [fetchHealth, selectedEnv]
  );

  const refreshAll = useCallback(async () => {
    setIsRefreshing(true);
    const results = await Promise.all(
      SERVICE_CATALOG.flatMap((service) =>
        service.endpoints.map(async (endpoint) => ({
          endpointId: endpoint.id,
          status: await fetchHealth(endpoint, selectedEnv),
        }))
      )
    );

    setStatusMap((prev) => {
      const next = { ...prev };
      results.forEach(({ endpointId, status }) => {
        next[endpointId] = status;
      });
      return next;
    });
    setLastUpdated(Date.now());
    setIsRefreshing(false);
  }, [fetchHealth, selectedEnv]);

  useEffect(() => {
    refreshAll().catch(() => {
      toast.error("Unable to load health checks");
      setIsRefreshing(false);
    });
  }, [refreshAll]);

  const handleOpenDetails = async (service: HealthService, endpoint: ServiceEndpoint) => {
    setDetailContext({ service, endpoint });
    setDetailStatus(null);
    setDetailLoading(true);
    setDetailOpen(true);
    const status = await refreshEndpoint(endpoint);
    setDetailStatus(status);
    setDetailLoading(false);
  };

  const handleCloseDetails = () => {
    setDetailOpen(false);
    setDetailContext(null);
    setDetailStatus(null);
  };

  const renderStatusBadge = (status?: EndpointStatus["status"]) => {
    const variant = status ? statusStyles[status] : statusStyles.pending;
    return (
      <Badge className={variant.badge}>
        <span className={clsx("inline-block h-2 w-2 rounded-full mr-2", variant.dot)} />
        {variant.label}
      </Badge>
    );
  };

  const overallSummary = useMemo(() => {
    const stats = { healthy: 0, down: 0, total: 0 };
    SERVICE_CATALOG.forEach((service) => {
      service.endpoints.forEach((endpoint) => {
        stats.total += 1;
        const status = statusMap[endpoint.id]?.status;
        if (status === "healthy") stats.healthy += 1;
        if (status === "down") stats.down += 1;
      });
    });
    return stats;
  }, [statusMap]);

  const hasLoaded = Object.keys(statusMap).length > 0;

  return (
    <div className={clsx("h-screen bg-gray-50 flex overflow-hidden", sidebarOpen && "overflow-hidden")}>
      <Sidebar
        sidebarOpen={sidebarOpen}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onCloseMobile={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col overflow-hidden transition-all duration-300 bg-white">
        <Header
          title="Health Monitor"
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          sidebarCollapsed={sidebarCollapsed}
        />

        <main className="flex-1 overflow-y-auto p-6 bg-gray-50 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-lg font-semibold text-gray-900">API health overview</p>
              <p className="text-sm text-gray-500">
                Monitoring environment: {ENVIRONMENT_LABELS[selectedEnv]} (
                {BASE_URLS[selectedEnv] ?? BASE_URLS.dev})
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Select value={selectedEnv} onValueChange={(value) => setSelectedEnv(value as EnvironmentKey)}>
                <SelectTrigger className="w-40 bg-white">
                  <SelectValue placeholder="Environment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dev">Development</SelectItem>
                  <SelectItem value="prod">Production</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={refreshAll}
                disabled={isRefreshing}
                className="bg-[#0a3a7a] hover:bg-[#0a3a7a]/90"
              >
                {isRefreshing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Refreshing…
                  </>
                ) : (
                  <>
                    <RefreshCcw className="h-4 w-4 mr-2" />
                    Refresh all
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Healthy endpoints
                </div>
                <p className="text-2xl font-semibold text-gray-900">{overallSummary.healthy}</p>
              </CardHeader>
            </Card>
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Down endpoints
                </div>
                <p className="text-2xl font-semibold text-gray-900">{overallSummary.down}</p>
              </CardHeader>
            </Card>
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Server className="h-4 w-4 text-blue-500" />
                  Monitored APIs
                </div>
                <p className="text-2xl font-semibold text-gray-900">{overallSummary.total}</p>
              </CardHeader>
            </Card>
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Info className="h-4 w-4 text-gray-500" />
                  Last refresh
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : "—"}
                </p>
              </CardHeader>
            </Card>
          </div>

          {!hasLoaded && isRefreshing ? (
            <Loader />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {SERVICE_CATALOG.map((service) => {
                const aggregateStatus = getAggregateStatus(service, statusMap);
                const aggregateConfig = statusStyles[
                  aggregateStatus === "pending" ? "pending" : (aggregateStatus as EndpointStatus["status"])
                ];

                return (
                  <Card key={service.id} className="border border-gray-200 shadow-sm">
                    <CardHeader className="flex flex-col gap-2 border-b border-gray-100">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-lg font-semibold text-gray-900">{service.name}</p>
                          <p className="text-sm text-gray-500">{service.description}</p>
                        </div>
                        {renderStatusBadge(aggregateStatus === "pending" ? undefined : (aggregateStatus as EndpointStatus["status"]))}
                      </div>
                    </CardHeader>
                    <CardContent className="divide-y">
                      {service.endpoints.map((endpoint) => {
                        const endpointStatus = statusMap[endpoint.id];
                        const isLoading = loadingMap[endpoint.id];
                        return (
                          <div key={endpoint.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="font-medium text-gray-900">
                                {endpoint.label}
                                {endpoint.region && (
                                  <span className="text-gray-400 text-sm ml-2">({endpoint.region})</span>
                                )}
                              </p>
                              <div className="flex items-center gap-3 mt-1">
                                {renderStatusBadge(endpointStatus?.status)}
                                {endpointStatus?.latency !== undefined && endpointStatus?.latency !== null && (
                                  <span className="text-xs text-gray-500">{endpointStatus.latency} ms</span>
                                )}
                              </div>
                              {endpointStatus?.error && (
                                <p className="text-xs text-red-500 mt-1 line-clamp-2">{endpointStatus.error}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => refreshEndpoint(endpoint)}
                                disabled={isLoading}
                              >
                                {isLoading ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <RefreshCcw className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleOpenDetails(service, endpoint)}
                                className="bg-[#0a3a7a] text-white hover:bg-[#0a3a7a]/90"
                              >
                                Details
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </main>
      </div>

      <Dialog open={detailOpen} onOpenChange={(open) => !open ? handleCloseDetails() : null}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              {detailContext
                ? `${detailContext.service.name} · ${detailContext.endpoint.label} (${ENVIRONMENT_LABELS[selectedEnv]})`
                : "Endpoint details"}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              Latest response pulled directly from the health check endpoint.
            </DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-[#0a3a7a]" />
            </div>
          ) : detailStatus ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                {renderStatusBadge(detailStatus.status)}
                {detailStatus.httpStatus && (
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                    HTTP {detailStatus.httpStatus}
                  </Badge>
                )}
                {detailStatus.latency !== undefined && detailStatus.latency !== null && (
                  <Badge className="bg-gray-100 text-gray-600 border-gray-200">
                    {detailStatus.latency} ms
                  </Badge>
                )}
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  <span className="font-semibold text-gray-800">URL:</span>{" "}
                  <a
                    href={detailStatus.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    {detailStatus.url}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </p>
                <p>
                  <span className="font-semibold text-gray-800">Last checked:</span>{" "}
                  {detailStatus.lastChecked ? new Date(detailStatus.lastChecked).toLocaleString() : "—"}
                </p>
                {detailStatus.error && (
                  <p className="text-red-600">
                    <span className="font-semibold text-gray-800">Error:</span> {detailStatus.error}
                  </p>
                )}
              </div>

              <div className="bg-gray-900 rounded-lg p-4 text-sm text-gray-100 overflow-x-auto max-h-96">
                <pre className="text-xs whitespace-pre-wrap">
                  {typeof detailStatus.details === "string"
                    ? detailStatus.details
                    : JSON.stringify(detailStatus.details, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-500 py-6">Select an endpoint to load details.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

