
import { useCallback, useEffect, useState } from "react";
import {
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  Users,
  Zap,
  Search,
  Wrench,
  CheckCircle2,
  Clock,
  LoaderCircle,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Activity,
  Leaf,
  CalendarClock,
  PackageCheck,
  Wifi,
  WifiOff,
  CloudUpload,
} from "lucide-react";

const API_URL = "/api";
const OFFLINE_STORAGE_KEY = "resilio_pending_inventory_operations";

const failureSections = [
  {
    id: "duplicate-token",
    title: "Duplicate Token Failure",
    subtitle: "Queue Management",
    description:
      "Detect a duplicate queue token and assign a unique token to the affected customer.",
    button: "Inject Chaos",
    icon: Users,
    color: "text-violet-700",
    bg: "bg-violet-50",
  },
  {
    id: "synchronization-failure",
    title: "Queue Status Synchronization Failure",
    subtitle: "Queue Management",
    description:
      "Detect outdated customer queue statuses and synchronize them with the latest database status.",
    button: "Inject Chaos",
    icon: RefreshCw,
    color: "text-blue-700",
    bg: "bg-blue-50",
  },
  {
    id: "expired-stock",
    title: "Expired Stock Detection & Auto-Recovery",
    subtitle: "Inventory Management",
    description:
      "Detect expired stock batches, remove expired quantities from usable inventory, and verify recovery.",
    button: "Inject Chaos",
    icon: CalendarClock,
    color: "text-orange-700",
    bg: "bg-orange-50",
  },
  {
    id: "offline-inventory-recovery",
    title: "Offline Inventory Recovery",
    subtitle: "Inventory Management",
    description:
      "Monitor connectivity and pending inventory operations, then verify synchronization when the backend supports it.",
    button: "Check & Recover",
    icon: PackageCheck,
    color: "text-emerald-700",
    bg: "bg-emerald-50",
  },
];

const workflowSteps = [
  { key: "injected", title: "Failure Injected", icon: Zap },
  { key: "detected", title: "Failure Detected", icon: Search },
  { key: "recovering", title: "Recovery in Progress", icon: Wrench },
  { key: "resolved", title: "Resolved Successfully", icon: CheckCircle2 },
];

function stageTitle(stage) {
  const titles = {
    injecting: "Starting Test",
    started: "Starting Recovery",
    checking_connection: "Checking Connection",
    connection_restored: "Connection Restored",
    injected: "Failure Injected",
    detected: "Failure Detected",
    recovery_started: "Recovery in Progress",
    recovering: "Recovery in Progress",
    recovery_in_progress: "Recovery in Progress",
    recovered: "Recovery Verified",
    resolved: "Resolved Successfully",
    cleanup: "Cleaning Up Test Data",
    cleanup_started: "Cleaning Up Test Data",
    cleanup_completed: "Cleanup Completed",
    notification: "Notification",
    customer_notified: "Customer Notified",
    recovery_failed: "Recovery Failed",
    replacement_assigned: "Replacement Token Assigned",
    verification_started: "Verification in Progress",
    verification_passed: "Verification Passed",
    verification_failed: "Verification Failed",
    inventory_found: "Inventory Found",
    connection_restored: "Connection Restored",
  };

  return titles[stage] || "System Activity";
}

function formatTime(timestamp) {
  if (!timestamp) return new Date().toLocaleTimeString();
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime())
    ? new Date().toLocaleTimeString()
    : date.toLocaleTimeString();
}

function normalizeEvent(event) {
  return {
    ...event,
    key: event.stage || event.key,
    title: event.title || stageTitle(event.stage || event.key),
    description: event.message || event.description || "",
    time: formatTime(event.timestamp),
  };
}

function readPendingOperations() {
  try {
    const value = JSON.parse(
      localStorage.getItem(OFFLINE_STORAGE_KEY) || "[]"
    );
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function EventDetailsTable({ event }) {
  const excluded = [
    "stage",
    "key",
    "title",
    "message",
    "description",
    "timestamp",
    "time",
    "customers",
    "batches",
  ];

  const details = Object.entries(event).filter(
    ([key, value]) =>
      !excluded.includes(key) &&
      value !== undefined &&
      value !== null &&
      typeof value !== "object"
  );

  const batches = Array.isArray(event.batches) ? event.batches : [];

  if (!details.length && !batches.length) return null;

  const label = (key) =>
    key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());

  const value = (item) =>
    typeof item === "boolean"
      ? item
        ? "Yes"
        : "No"
      : String(item);

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-[#e5e9df] bg-white">
      {details.length > 0 && (
        <table className="w-full text-left text-xs">
          <tbody>
            {details.map(([key, item]) => (
              <tr key={key} className="border-b border-[#edf0e9] last:border-0">
                <th className="w-2/5 px-4 py-3 font-semibold text-[#536359]">
                  {label(key)}
                </th>
                <td className="break-words px-4 py-3 text-[#244638]">
                  {value(item)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {batches.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f5f8f1]">
              <tr>
                <th className="p-3">Batch</th>
                <th className="p-3">Status</th>
                <th className="p-3">Remaining</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((batch, index) => (
                <tr key={batch.batchCode || index} className="border-t">
                  <td className="p-3">{batch.batchCode || "—"}</td>
                  <td className="p-3">{batch.status || "—"}</td>
                  <td className="p-3">
                    {batch.quantityRemaining ?? batch.remainingQuantity ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function VerificationTable({ section, verification, summary }) {
  if (!verification && !summary) return null;

  let rows = [];

  if (section.id === "offline-inventory-recovery") {
    rows = [
      ["Browser Online", verification?.browserOnline],
      ["Backend Available", verification?.backendAvailable],
      ["Pending Operations", summary?.pendingOperations],
      ["Operations Synchronized", summary?.synchronizedOperations],
      ["Recovery Verified", verification?.recoveryVerified],
    ];
  } else if (section.id === "expired-stock") {
    rows = [
      ["No Expired Stock Remaining", verification?.noExpiredStockRemaining],
      ["Batches Recovered", summary?.batchesRecovered],
      ["Temporary Batch Removed", summary?.temporaryBatchRemoved],
    ];
  } else if (section.id === "synchronization-failure") {
    rows = [
      ["Status Mismatch Detected", verification?.mismatchDetected],
      ["Status Synchronized", verification?.synchronized],
      ["Test Cleanup", verification?.cleanupSucceeded],
    ];
  } else {
    rows = [
      ["Duplicate Rejected", verification?.duplicateRejected],
      ["Unique Tokens", verification?.tokensAreDifferent],
      ["Test Cleanup", verification?.cleanupSucceeded],
    ];
  }

  rows = rows.filter(([, v]) => v !== undefined && v !== null);
  if (!rows.length) return null;

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-[#e5e9df] bg-white">
      <div className="border-b border-[#e5e9df] bg-[#f5f8f1] px-4 py-3">
        <h6 className="text-sm font-bold text-[#244638]">Verification Results</h6>
      </div>
      <table className="w-full text-left text-sm">
        <tbody>
          {rows.map(([name, result]) => (
            <tr key={name} className="border-t border-[#edf0e9] first:border-0">
              <td className="px-4 py-3 text-[#536359]">{name}</td>
              <td className="px-4 py-3 font-semibold text-[#244638]">
                {typeof result === "boolean"
                  ? result
                    ? "Verified"
                    : "Not verified"
                  : result}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SelfHealingPage() {
  const [expandedId, setExpandedId] = useState(null);
  const [runningId, setRunningId] = useState(null);
  const [results, setResults] = useState({});
  const [errors, setErrors] = useState({});
  const [browserOnline, setBrowserOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);

  const refreshPendingCount = useCallback(() => {
    setPendingCount(readPendingOperations().length);
  }, []);

  useEffect(() => {
    const online = () => setBrowserOnline(true);
    const offline = () => setBrowserOnline(false);

    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    refreshPendingCount();

    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
    };
  }, [refreshPendingCount]);

  function appendEvent(id, event) {
    const normalized = normalizeEvent(event);

    setResults((previous) => {
      const current = previous[id] || {};
      return {
        ...previous,
        [id]: {
          ...current,
          currentStage: normalized.key,
          events: [...(current.events || []), normalized],
        },
      };
    });
  }

  async function runSelfHealingTest(id, endpoint, failureType) {
    setExpandedId(id);
    setRunningId(id);
    setErrors((previous) => ({ ...previous, [id]: "" }));
    setResults((previous) => ({
      ...previous,
      [id]: {
        currentStage: "injecting",
        completed: false,
        events: [
          {
            key: "injecting",
            title: "Starting Test",
            description: `Starting ${failureType} test.`,
            time: new Date().toLocaleTimeString(),
          },
        ],
      },
    }));

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream, application/json",
        },
        body: JSON.stringify({ failureType }),
      });

      const contentType = response.headers.get("content-type") || "";
      let finalResult = null;

      if (contentType.includes("text/event-stream") && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        const processMessage = (message) => {
          const lines = message
            .split(/\r?\n/)
            .filter((line) => line.startsWith("data:"));

          if (!lines.length) return;

          try {
            const payload = JSON.parse(
              lines.map((line) => line.slice(5).trim()).join("\n")
            );

            if (payload.type === "progress" && payload.event) {
              appendEvent(id, payload.event);
            }

            if (payload.type === "result") {
              finalResult = payload.result;
            }
          } catch (error) {
            console.error("Unable to parse recovery event:", error);
          }
        };

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const messages = buffer.split(/\r?\n\r?\n/);
          buffer = messages.pop() || "";
          messages.forEach(processMessage);
        }

        buffer += decoder.decode();
        if (buffer.trim()) processMessage(buffer);

        if (!finalResult) {
          throw new Error("The server did not return a final result.");
        }
      } else {
        const payload = await response.json();
        finalResult = payload.result || payload;
      }

      if (!response.ok && !finalResult) {
        throw new Error("The recovery request failed.");
      }

      const events = Array.isArray(finalResult.timeline)
        ? finalResult.timeline.map(normalizeEvent)
        : [];

      setResults((previous) => ({
        ...previous,
        [id]: {
          ...(previous[id] || {}),
          currentStage: finalResult.success ? "resolved" : "recovery_failed",
          events: events.length ? events : previous[id]?.events || [],
          completed: Boolean(finalResult.success),
          finalResult,
        },
      }));

      if (!finalResult.success) {
        setErrors((previous) => ({
          ...previous,
          [id]: finalResult.message || "Recovery did not complete successfully.",
        }));
      }
    } catch (error) {
      setErrors((previous) => ({
        ...previous,
        [id]: error.message || "Unable to contact the backend.",
      }));
      setResults((previous) => ({
        ...previous,
        [id]: {
          ...(previous[id] || {}),
          currentStage: "recovery_failed",
          completed: false,
        },
      }));
    } finally {
      setRunningId(null);
      refreshPendingCount();
    }
  }

  async function runOfflineRecovery(section) {
    setExpandedId(section.id);
    setRunningId(section.id);
    setErrors((previous) => ({ ...previous, [section.id]: "" }));

    const localPending = readPendingOperations();
    setPendingCount(localPending.length);

    const events = [];
    const add = (stage, message, details = {}) => {
      const event = normalizeEvent({
        stage,
        message,
        timestamp: new Date().toISOString(),
        ...details,
      });
      events.push(event);

      setResults((previous) => ({
        ...previous,
        [section.id]: {
          ...(previous[section.id] || {}),
          currentStage: stage,
          events: [...events],
          completed: false,
        },
      }));
    };

    try {
      add("started", "Starting offline inventory recovery check.", {
        browserOnline,
        pendingOperations: localPending.length,
      });

      add(
        "checking_connection",
        browserOnline
          ? "Browser network connection is available."
          : "Browser is offline. Pending operations remain saved locally."
      );

      if (!browserOnline) {
        const result = {
          success: false,
          recovered: false,
          completed: true,
          message:
            "Device is offline. Pending operations have not been synchronized.",
          timeline: events,
          summary: {
            pendingOperations: localPending.length,
            synchronizedOperations: 0,
          },
          verification: {
            browserOnline: false,
            backendAvailable: false,
            recoveryVerified: false,
          },
        };

        setResults((previous) => ({
          ...previous,
          [section.id]: {
            currentStage: "recovery_failed",
            events: [...events],
            completed: false,
            finalResult: result,
          },
        }));
        return;
      }

      add(
        "checking_connection",
        "Checking whether the Resilio backend is available."
      );

      // This checks availability only. It does not replay inventory operations.
      let backendAvailable = false;

      try {
        const health = await fetch(`${API_URL}/self-healing/offline-inventory/health`, {
          method: "GET",
          credentials: "include",
        });
        backendAvailable = health.ok;
      } catch {
        backendAvailable = false;
      }

      if (!backendAvailable) {
        throw new Error(
          "The backend health endpoint is unavailable. Pending operations were kept locally."
        );
      }

      add(
        "connection_restored",
        "Backend is reachable. Checking the pending inventory queue."
      );

      // This route must be implemented on the backend to perform safe,
      // idempotent synchronization. We deliberately do not replay arbitrary
      // localStorage requests from this frontend.
      const response = await fetch(
        `${API_URL}/self-healing/offline-inventory/recover`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pendingOperationIds: localPending.map((operation) => operation.operationId),
          }),
        }
      );

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          payload.message ||
            "Backend recovery failed. Pending operations were kept locally."
        );
      }

      const finalResult = payload.result || payload;

      add(
        finalResult.success ? "verification_passed" : "verification_failed",
        finalResult.message || "Backend recovery response received.",
        {
          backendAvailable: true,
          pendingOperations: localPending.length,
          recoveryVerified: Boolean(finalResult.success),
        }
      );

      setResults((previous) => ({
        ...previous,
        [section.id]: {
          currentStage: finalResult.success ? "resolved" : "recovery_failed",
          events: Array.isArray(finalResult.timeline)
            ? finalResult.timeline.map(normalizeEvent)
            : [...events],
          completed: Boolean(finalResult.success),
          finalResult: {
            ...finalResult,
            summary: {
              pendingOperations: localPending.length,
              synchronizedOperations:
                finalResult.summary?.synchronizedOperations ?? 0,
              ...finalResult.summary,
            },
            verification: {
              browserOnline: true,
              backendAvailable: true,
              recoveryVerified: Boolean(finalResult.success),
              ...finalResult.verification,
            },
          },
        },
      }));

      refreshPendingCount();
    } catch (error) {
      setErrors((previous) => ({
        ...previous,
        [section.id]: error.message || "Offline recovery could not complete.",
      }));

      setResults((previous) => ({
        ...previous,
        [section.id]: {
          ...(previous[section.id] || {}),
          currentStage: "recovery_failed",
          events: [...events],
          completed: false,
        },
      }));
    } finally {
      setRunningId(null);
    }
  }

  function runDemo(section) {
    if (runningId) return;

    if (section.id === "offline-inventory-recovery") {
      runOfflineRecovery(section);
      return;
    }

    const routes = {
      "duplicate-token": [
        "/self-healing/inject-chaos",
        "duplicate-token",
      ],
      "synchronization-failure": [
        "/self-healing/synchronization-failure",
        "synchronization-failure",
      ],
      "expired-stock": [
        "/self-healing/expired-stock",
        "expired-stock",
      ],
    };

    const route = routes[section.id];
    if (route) runSelfHealingTest(section.id, route[0], route[1]);
  }

  function resetSection(id) {
    if (runningId === id) return;
    setResults((previous) => {
      const next = { ...previous };
      delete next[id];
      return next;
    });
    setErrors((previous) => {
      const next = { ...previous };
      delete next[id];
      return next;
    });
  }

  function hasStage(result, stage) {
    const keys = (result?.events || []).map((event) => event.key);

    if (stage === "injected") return keys.includes("injected");
    if (stage === "detected") return keys.includes("detected");
    if (stage === "recovering") {
      return keys.some((key) =>
        ["recovery_started", "recovering", "recovered", "recovery_in_progress"].includes(key)
      );
    }
    return stage === "resolved" && Boolean(result?.completed);
  }

  function isStageActive(result, stage, isRunning) {
    if (!isRunning) return false;
    const current = result?.currentStage;
    if (stage === "injected") return ["injecting", "injected"].includes(current);
    if (stage === "detected") return current === "detected";
    if (stage === "recovering") {
      return ["recovery_started", "recovering", "recovery_in_progress"].includes(current);
    }
    return false;
  }

  return (
    <div className="space-y-6 text-[#244638]">
      <section className="flex flex-col justify-between gap-5 rounded-2xl border border-[#dfe8d9] bg-gradient-to-r from-[#e3efdf] via-[#f0f4e9] to-[#fff0e5] p-6 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#64816b]">
            <Leaf size={15} />
            Inventory management
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Self-Healing Monitor
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#6e8073]">
            Monitor failures, observe automatic recovery, and verify that the
            system returns to a healthy state.
          </p>
        </div>
        <div className="flex w-fit items-center gap-2 rounded-xl border border-white/70 bg-white/70 px-4 py-3 text-sm font-semibold">
          {browserOnline ? (
            <Wifi size={17} className="text-green-700" />
          ) : (
            <WifiOff size={17} className="text-red-700" />
          )}
          {browserOnline ? "Browser online" : "Browser offline"}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#e5e9df] bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#718078]">
            Network
          </p>
          <p className="mt-2 text-lg font-bold">
            {browserOnline ? "Connected" : "Offline"}
          </p>
        </div>
        <div className="rounded-2xl border border-[#e5e9df] bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#718078]">
            Pending local operations
          </p>
          <p className="mt-2 text-lg font-bold">{pendingCount}</p>
        </div>
        <div className="rounded-2xl border border-[#e5e9df] bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#718078]">
            Recovery monitor
          </p>
          <p className="mt-2 text-lg font-bold text-[#2f684b]">
            {runningId ? "Working..." : "Ready"}
          </p>
        </div>
      </section>

      <section className="flex gap-4 rounded-2xl border border-[#e5e9df] bg-white p-5 sm:p-6">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e0efdd] text-[#42734c]">
          <ShieldCheck size={24} />
        </div>
        <div>
          <h2 className="text-lg font-bold">Failure Simulation Center</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-[#718078]">
            Select a scenario to view failure detection, recovery activity, and
            verification results.
          </p>
        </div>
      </section>

      <div className="space-y-5">
        {failureSections.map((section, index) => {
          const Icon = section.icon;
          const expanded = expandedId === section.id;
          const result = results[section.id];
          const running = runningId === section.id;

          return (
            <section
              key={section.id}
              className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${
                expanded ? "border-[#b5cdb0] ring-1 ring-[#dcebd9]" : "border-[#e5e9df]"
              }`}
            >
              <div className="flex flex-col justify-between gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
                <div className="flex min-w-0 items-start gap-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${section.bg} ${section.color}`}>
                    <Icon size={23} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-[#89958c]">
                        Failure {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${section.bg} ${section.color}`}>
                        {section.subtitle}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold">{section.title}</h3>
                    <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[#718078]">
                      {section.description}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-3">
                  <button
                    type="button"
                    disabled={Boolean(runningId)}
                    onClick={() => runDemo(section)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2f684b] px-5 py-3 text-sm font-semibold text-white hover:bg-[#24553b] disabled:opacity-60"
                  >
                    {running ? (
                      <LoaderCircle size={17} className="animate-spin" />
                    ) : section.id === "offline-inventory-recovery" ? (
                      <CloudUpload size={17} />
                    ) : (
                      <Zap size={17} />
                    )}
                    {running ? "Running Test..." : section.button}
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : section.id)}
                    aria-label={expanded ? "Collapse section" : "Expand section"}
                    className="rounded-xl border border-[#dfe7dc] p-3 text-[#47754e] hover:bg-[#f1f6ed]"
                  >
                    {expanded ? <ChevronUp size={19} /> : <ChevronDown size={19} />}
                  </button>
                </div>
              </div>

              {expanded && (
                <div className="border-t border-[#e8ebe2] bg-[#fcfdf9] p-5 sm:p-6">
                  <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h4 className="font-bold">Failure &amp; Recovery Workflow</h4>
                      <p className="mt-1 text-sm text-[#849087]">
                        Observe each step of the self-healing process.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {result?.completed ? (
                        <span className="rounded-full bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-800">
                          Resolved
                        </span>
                      ) : running ? (
                        <span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-800">
                          In progress
                        </span>
                      ) : result?.currentStage === "recovery_failed" ? (
                        <span className="rounded-full bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-800">
                          Failed
                        </span>
                      ) : (
                        <span className="rounded-full bg-[#edf5e9] px-3 py-1.5 text-xs font-semibold text-[#4c7654]">
                          Ready to test
                        </span>
                      )}
                      {result && !running && (
                        <button
                          type="button"
                          onClick={() => resetSection(section.id)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-[#dfe7dc] bg-white px-3 py-2 text-xs font-semibold"
                        >
                          <RotateCcw size={14} />
                          Reset view
                        </button>
                      )}
                    </div>
                  </div>

                  {errors[section.id] && (
                    <div role="alert" className="mb-5 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                      <AlertTriangle size={19} className="shrink-0" />
                      <div>
                        <p className="font-semibold">Test could not finish</p>
                        <p className="mt-1">{errors[section.id]}</p>
                        <p className="mt-2 text-xs">
                          Check the backend connection and admin login.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {workflowSteps.map((step, stepIndex) => {
                      const StepIcon = step.icon;
                      const complete = hasStage(result, step.key);
                      const active = isStageActive(result, step.key, running);
                      const recent = [...(result?.events || [])].reverse().find((event) => {
                        if (step.key === "injected") return event.key === "injected";
                        if (step.key === "detected") return event.key === "detected";
                        if (step.key === "recovering") return ["recovery_started", "recovering", "recovered", "recovery_in_progress"].includes(event.key);
                        return ["recovered", "resolved", "verification_passed"].includes(event.key);
                      });

                      return (
                        <div key={step.key} className={`rounded-2xl border p-4 ${complete ? "border-green-200" : active ? "border-amber-300" : "border-[#e5e9df]"} bg-white`}>
                          <div className="mb-4 flex items-center justify-between">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f1f6ed] text-[#63866a]">
                              {active ? <LoaderCircle size={19} className="animate-spin" /> : <StepIcon size={19} />}
                            </div>
                            <span className="text-xs font-semibold text-[#a0aaa0]">0{stepIndex + 1}</span>
                            {complete && <CheckCircle2 size={17} className="text-green-600" />}
                          </div>
                          <h5 className="text-sm font-bold">{step.title}</h5>
                          <p className="mt-2 text-xs leading-5 text-[#718078]">
                            {recent?.description ||
                              (step.key === "injected" && section.id === "offline-inventory-recovery"
                                ? "Waiting for a real offline operation."
                                : step.key === "detected" && section.id === "offline-inventory-recovery"
                                ? "Detect a lost connection or pending operation."
                                : step.key === "recovering" && section.id === "offline-inventory-recovery"
                                ? "Synchronize operations through the backend."
                                : "The system will report this stage when it occurs.")}
                          </p>
                          {recent?.time && (
                            <p className="mt-3 text-[11px] text-[#89958c]">
                              <Clock size={12} className="mr-1 inline" />
                              {recent.time}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-5 rounded-2xl border border-[#e5e9df] bg-white p-4 sm:p-5">
                    <div className="mb-5 flex items-center gap-2">
                      <div className="rounded-lg bg-[#e0efdd] p-2 text-[#42734c]">
                        <Activity size={18} />
                      </div>
                      <div>
                        <h5 className="font-bold">Recovery Activity Log</h5>
                        <p className="mt-0.5 text-xs text-[#89958c]">
                          Events received from the self-healing process
                        </p>
                      </div>
                    </div>

                    {!result?.events?.length ? (
                      <p className="rounded-xl bg-[#fcfdf9] p-4 text-sm text-[#849087]">
                        Run this test to display the recovery activity.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {result.events.map((event, eventIndex) => {
                          const failureEvent = ["injected", "detected"].includes(event.key);
                          return (
                            <div key={`${event.key}-${eventIndex}`} className={`flex gap-3 rounded-xl p-3 ${failureEvent ? "border border-red-200 bg-red-50" : ""}`}>
                              <div className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${failureEvent ? "bg-red-400" : event.key === "recovery_failed" ? "bg-red-500" : "bg-[#6b9b78]"}`} />
                              <div className="min-w-0 flex-1 pb-2">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <p className={`text-sm font-bold ${failureEvent ? "text-red-800" : "text-[#244638]"}`}>
                                    {event.title}
                                  </p>
                                  <span className="text-[11px] text-[#89958c]">{event.time}</span>
                                </div>
                                <p className="mt-1 text-sm leading-6 text-[#718078]">{event.description}</p>
                                <EventDetailsTable event={event} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {result?.finalResult && (
                    <div className={`mt-5 rounded-2xl border p-5 ${result.finalResult.success ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"}`}>
                      <div className="flex items-start gap-3">
                        {result.finalResult.success ? (
                          <CheckCircle2 size={22} className="mt-0.5 shrink-0 text-green-700" />
                        ) : (
                          <AlertTriangle size={22} className="mt-0.5 shrink-0 text-amber-700" />
                        )}
                        <div className="min-w-0 flex-1">
                          <h5 className="font-bold">
                            {result.finalResult.success ? "Self-Healing Test Completed" : "Recovery Needs Attention"}
                          </h5>
                          <p className="mt-1 text-sm leading-6 text-[#718078]">
                            {result.finalResult.message || "The backend returned the final result."}
                          </p>
                          <VerificationTable
                            section={section}
                            verification={result.finalResult.verification}
                            summary={result.finalResult.summary}
                          />
                          {result.finalResult.durationMs != null && (
                            <p className="mt-3 text-xs text-[#718078]">
                              Duration: {(result.finalResult.durationMs / 1000).toFixed(2)} seconds
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
          );
        })}
      </div>

      <p className="text-xs leading-5 text-[#89958c]">
        Offline recovery requires backend support for idempotent operation
        processing. The browser connectivity indicator alone does not guarantee
        that MongoDB is reachable or that pending stock changes were applied.
      </p>
    </div>
  );
}
