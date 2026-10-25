
import { useState } from "react";
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
} from "lucide-react";

const API_URL = "/api";

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
    border: "border-violet-200",
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
    border: "border-blue-200",
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
    border: "border-orange-200",
  },
  {
  id: "offline-inventory-recovery",
  title: "Offline Inventory Recovery",
  subtitle: "Inventory Management",
  description:
    "Restore inventory consistency after the database connection returns and verify recovery for all ingredients.",
  button: "Run Recovery",
  icon: PackageCheck,
  color: "text-emerald-700",
  bg: "bg-emerald-50",
  border: "border-emerald-200",
},
];

const workflowSteps = [
  {
    key: "injected",
    title: "Failure Injected",
    description: "A controlled failure scenario is introduced.",
    icon: Zap,
  },
  {
    key: "detected",
    title: "Failure Detected",
    description: "The system identifies the problem.",
    icon: Search,
  },
  {
    key: "recovering",
    title: "Recovery in Progress",
    description: "The self-healing process takes action.",
    icon: Wrench,
  },
  {
    key: "resolved",
    title: "Resolved Successfully",
    description: "The system verifies the recovery.",
    icon: CheckCircle2,
  },
];

function stageTitle(stage) {
  const titles = {
    injecting: "Injecting Failure",
    injected: "Failure Injected",
    detected: "Failure Detected",
    recovery_started: "Recovery in Progress",
    recovering: "Recovery in Progress",
    recovered: "Recovery Verified",
    resolved: "Resolved Successfully",
    cleanup: "Cleaning Up Test Data",
    notification: "Notification",
    customer_notified: "Customer Notified",
    recovery_failed: "Recovery Failed",
    replacement_assigned: "Replacement Token Assigned",
    verification_started: "Verification in Progress",
    verification_passed: "Verification Passed",
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

function CustomerDetails({ event }) {
  const customerA = event.customers?.customerA || event.customerA;
  const customerB = event.customers?.customerB || event.customerB;

  if (!customerA && !customerB) return null;

  return (
    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      {[
        { label: "Customer A", customer: customerA },
        { label: "Customer B", customer: customerB },
      ]
        .filter((item) => item.customer)
        .map(({ label, customer }) => (
          <div
            key={label}
            className="rounded-xl border border-[#e5e9df] bg-white p-3.5"
          >
            <p className="text-xs font-bold uppercase tracking-wide text-[#64816b]">
              {label}
            </p>

            <p className="mt-2 text-sm font-semibold text-[#244638]">
              {customer.name || customer.customerName || label}
            </p>

            {customer.mobileNumber && (
              <p className="mt-1 text-xs text-[#718078]">
                Mobile: {customer.mobileNumber}
              </p>
            )}

            <p className="mt-1 text-xs text-[#718078]">
              Token:{" "}
              <span className="font-bold text-[#244638]">
                {customer.token || customer.tokenNumber || "Not provided"}
              </span>
            </p>

            {customer.status && (
              <p className="mt-2 text-xs leading-5 text-[#718078]">
                Status: {customer.status}
              </p>
            )}
          </div>
        ))}
    </div>
  );
}

function EventDetailsTable({ event }) {
  const excludedKeys = [
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
      !excludedKeys.includes(key) &&
      value !== undefined &&
      value !== null &&
      typeof value !== "object"
  );

  const batches = Array.isArray(event.batches) ? event.batches : [];

  const formatLabel = (key) =>
    key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (char) => char.toUpperCase());

  const formatValue = (value) => {
    if (typeof value === "boolean") return value ? "Yes" : "No";

    if (
      typeof value === "string" &&
      /^\d{4}-\d{2}-\d{2}T/.test(value)
    ) {
      return new Date(value).toLocaleString();
    }

    return String(value);
  };

  if (!details.length && !batches.length) return null;

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-[#e5e9df] bg-white">
      {details.length > 0 && (
        <>
          <div className="border-b border-[#e5e9df] bg-[#f5f8f1] px-4 py-3">
            <h6 className="text-xs font-bold uppercase tracking-wide text-[#47754e]">
              Step Details
            </h6>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <tbody>
                {details.map(([key, value]) => (
                  <tr
                    key={key}
                    className="border-b border-[#edf0e9] last:border-0"
                  >
                    <th className="w-2/5 px-4 py-3 font-semibold text-[#536359]">
                      {formatLabel(key)}
                    </th>
                    <td className="break-words px-4 py-3 text-[#244638]">
                      {formatValue(value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {batches.length > 0 && (
        <>
          <div className="border-t border-[#e5e9df] bg-[#f5f8f1] px-4 py-3">
            <h6 className="text-xs font-bold uppercase tracking-wide text-[#47754e]">
              Affected Stock Batches
            </h6>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#fafbf8] text-[#536359]">
                <tr>
                  <th className="px-3 py-3">Batch Code</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Expiry Date</th>
                  <th className="px-3 py-3">Remaining Qty</th>
                  <th className="px-3 py-3">Expired Qty</th>
                </tr>
              </thead>

              <tbody>
                {batches.map((batch, index) => (
                  <tr
                    key={batch.batchCode || index}
                    className="border-t border-[#edf0e9]"
                  >
                    <td className="px-3 py-3 font-semibold text-[#244638]">
                      {batch.batchCode || "—"}
                    </td>
                    <td className="px-3 py-3">
                      <span className="rounded-full bg-orange-50 px-2 py-1 text-orange-700">
                        {batch.status || "—"}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-[#536359]">
                      {batch.expiryDate
                        ? new Date(batch.expiryDate).toLocaleDateString()
                        : "Not recorded"}
                    </td>
                    <td className="px-3 py-3 text-[#536359]">
                      {batch.remainingQuantity ??
                        batch.quantityRemaining ??
                        "—"}
                    </td>
                    <td className="px-3 py-3 text-[#536359]">
                      {batch.expiredQuantity ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function RecoverySummaryTable({ summary }) {
  if (!summary) return null;

  const rows = [
    ["Failure Injected", summary.failureInjected],
    ["Failure Detected", summary.failureDetected],
    ["Automatic Recovery", summary.recovered],
    ["Verification Passed", summary.verificationPassed],
    ["Cleanup Completed", summary.cleanupCompleted],
    ["Batches Recovered", summary.batchesRecovered],
    ["Temporary Batch Removed", summary.temporaryBatchRemoved],
  ].filter(([, value]) => value !== undefined && value !== null);

  if (!rows.length) return null;

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-[#dce8d7] bg-white">
      <div className="border-b border-[#dce8d7] bg-[#f1f6ed] px-4 py-3">
        <h6 className="text-sm font-bold text-[#244638]">
          Expired Stock Recovery Summary
        </h6>
        <p className="mt-1 text-xs text-[#718078]">
          Results reported by the backend recovery process
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#fafbf8] text-[#536359]">
            <tr>
              <th className="px-4 py-3">Recovery Check</th>
              <th className="px-4 py-3">Result</th>
            </tr>
          </thead>

          <tbody>
            {rows.map(([label, value]) => (
              <tr key={label} className="border-t border-[#e5e9df]">
                <td className="px-4 py-3 font-medium text-[#536359]">
                  {label}
                </td>
                <td className="px-4 py-3 font-semibold text-[#244638]">
                  {typeof value === "boolean"
                    ? value
                      ? "Successful"
                      : "Not completed"
                    : value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function VerificationTable({ section, verification }) {
  if (!verification) return null;

  let rows = [];

  if (section.id === "expired-stock") {
    rows = [
      [
        "Expired Stock Remaining",
        verification.remainingExpiredStock ?? "Unknown",
      ],
      [
        "No Expired Stock Remaining",
        verification.noExpiredStockRemaining,
      ],
    ];
  } else if (section.id === "offline-inventory-recovery") {
  rows = [
    ["Database Connected", verification.databaseConnected],
    ["Recovery Verified", verification.recoveryVerified],
  ];
  } else if (section.id === "synchronization-failure") {
    rows = [
      ["Status Mismatch Detected", verification.mismatchDetected],
      ["Status Synchronized", verification.synchronized],
      ["Test Cleanup", verification.cleanupSucceeded],
    ];
  } else {
    rows = [
      ["Duplicate Rejected", verification.duplicateRejected],
      ["Unique Tokens", verification.tokensAreDifferent],
      ["Test Cleanup", verification.cleanupSucceeded],
    ];
  }

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-[#e5e9df] bg-white">
      <div className="border-b border-[#e5e9df] bg-[#f5f8f1] px-4 py-3">
        <h6 className="text-sm font-bold text-[#244638]">
          Verification Results
        </h6>
      </div>

      <table className="w-full text-left text-sm">
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label} className="border-t border-[#edf0e9] first:border-0">
              <td className="px-4 py-3 text-[#536359]">{label}</td>
              <td className="px-4 py-3 font-semibold text-[#244638]">
                {typeof value === "boolean"
                  ? value
                    ? "Verified"
                    : "Not verified"
                  : value}
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

  function appendEvent(id, event) {
    const normalized = normalizeEvent(event);

    setResults((previous) => {
      const current = previous[id] || {};
      const events = current.events || [];
      const last = events[events.length - 1];

      if (
        last &&
        last.key === normalized.key &&
        last.description === normalized.description &&
        last.time === normalized.time
      ) {
        return previous;
      }

      return {
        ...previous,
        [id]: {
          ...current,
          currentStage: normalized.key,
          events: [...events, normalized],
        },
      };
    });
  }

  async function runSelfHealingTest(
    id,
    endpoint = "/self-healing/inject-chaos",
    failureType = "duplicate-token"
  ) {
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
            title: "Injecting Failure",
            description: `Starting the controlled ${failureType} test...`,
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

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Request failed with status ${response.status}.`
        );
      }

      const contentType = response.headers.get("content-type") || "";
      let finalResult = null;

      if (contentType.includes("text/event-stream") && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        function processMessage(message) {
          const dataLines = message
            .split(/\r?\n/)
            .filter((line) => line.startsWith("data:"));

          if (!dataLines.length) return;

          const rawData = dataLines
            .map((line) => line.slice(5).trim())
            .join("\n");

          try {
            const payload = JSON.parse(rawData);

            if (payload.type === "progress" && payload.event) {
              appendEvent(id, payload.event);
            }

            if (payload.type === "result") {
              finalResult = payload.result;
            }
          } catch (error) {
            console.error("Unable to parse recovery event:", error);
          }
        }

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
          throw new Error(
            "The server ended the stream without a final result."
          );
        }
      } else {
        const payload = await response.json();
        finalResult = payload.result || payload;
      }

      const finalEvents = Array.isArray(finalResult.timeline)
        ? finalResult.timeline.map(normalizeEvent)
        : [];

      setResults((previous) => ({
        ...previous,
        [id]: {
          ...(previous[id] || {}),
          currentStage: finalResult.success ? "resolved" : "recovery_failed",
          events: finalEvents.length
            ? finalEvents
            : previous[id]?.events || [],
          completed: Boolean(finalResult.success),
          finalResult,
        },
      }));

      if (!finalResult.success) {
        setErrors((previous) => ({
          ...previous,
          [id]:
            finalResult.message ||
            "The self-healing test did not complete successfully.",
        }));
      }
    } catch (error) {
      setErrors((previous) => ({
        ...previous,
        [id]: error.message || "Unable to run the test.",
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
    }
  }

 function runDemo(section) {
  if (runningId) return;

  setExpandedId(section.id);
  setErrors((previous) => ({ ...previous, [section.id]: "" }));

  if (section.id === "duplicate-token") {
    runSelfHealingTest(
      section.id,
      "/self-healing/inject-chaos",
      "duplicate-token"
    );
    return;
  }

  if (section.id === "synchronization-failure") {
    runSelfHealingTest(
      section.id,
      "/self-healing/synchronization-failure",
      "synchronization-failure"
    );
    return;
  }

  if (section.id === "expired-stock") {
    runSelfHealingTest(
      section.id,
      "/self-healing/expired-stock",
      "expired-stock"
    );
    return;
  }

  if (section.id === "offline-inventory-recovery") {
    runSelfHealingTest(
      section.id,
      "/self-healing/offline-inventory/recover",
      "offline-inventory-recovery"
    );
  }
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
    const events = result?.events || [];

    if (stage === "injected") {
      return events.some((event) => event.key === "injected");
    }

    if (stage === "detected") {
      return events.some((event) => event.key === "detected");
    }

    if (stage === "recovering") {
      return events.some((event) =>
        ["recovery_started", "recovering", "recovered"].includes(event.key)
      );
    }

    if (stage === "resolved") {
      return Boolean(result?.completed);
    }

    return false;
  }

  function isStageActive(result, stage, isRunning) {
    if (!isRunning) return false;

    const current = result?.currentStage;

    if (stage === "injected") {
      return ["injecting", "injected"].includes(current);
    }

    if (stage === "detected") return current === "detected";

    if (stage === "recovering") {
      return ["recovery_started", "recovering"].includes(current);
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
            Monitor failures, observe automatic recovery, and verify that your
            system returns to a healthy state.
          </p>
        </div>

        <div className="flex w-fit shrink-0 items-center gap-2 rounded-xl border border-white/70 bg-white/70 px-4 py-3 text-sm font-semibold text-[#2f684b]">
          <span className="h-2 w-2 rounded-full bg-[#5b9863]" />
          System monitoring
        </div>
      </section>

      <section className="flex gap-4 rounded-2xl border border-[#e5e9df] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e0efdd] text-[#42734c]">
          <ShieldCheck size={24} />
        </div>

        <div>
          <h2 className="text-lg font-bold text-[#244638]">
            Failure Simulation Center
          </h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-[#718078]">
            Choose a failure scenario to view how Resilio detects the issue,
            performs recovery, and verifies the result.
          </p>
        </div>
      </section>

      <div className="space-y-5">
        {failureSections.map((section, index) => {
          const Icon = section.icon;
          const isExpanded = expandedId === section.id;
          const result = results[section.id];
          const isRunning = runningId === section.id;

          return (
            <section
              key={section.id}
              className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition duration-200 hover:shadow-md ${
                isExpanded
                  ? "border-[#b5cdb0] ring-1 ring-[#dcebd9]"
                  : "border-[#e5e9df]"
              }`}
            >
              <div className="flex flex-col justify-between gap-5 p-5 sm:p-6 lg:flex-row lg:items-center">
                <div className="flex min-w-0 items-start gap-4">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${section.bg} ${section.color}`}
                  >
                    <Icon size={23} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-[#89958c]">
                        Failure {String(index + 1).padStart(2, "0")}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${section.bg} ${section.color}`}
                      >
                        {section.subtitle}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-[#244638]">
                      {section.title}
                    </h3>

                    <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[#718078]">
                      {section.description}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-3 lg:pl-4">
                  <button
                    type="button"
                    disabled={Boolean(runningId)}
                    onClick={() => runDemo(section)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2f684b] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#24553b] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isRunning ? (
                      <LoaderCircle size={17} className="animate-spin" />
                    ) : (
                      <Zap size={17} />
                    )}
                    {isRunning ? "Running Test..." : section.button}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setExpandedId(isExpanded ? null : section.id)
                    }
                    aria-label={
                      isExpanded
                        ? `Collapse ${section.title}`
                        : `Expand ${section.title}`
                    }
                    className="rounded-xl border border-[#dfe7dc] bg-white p-3 text-[#47754e] transition hover:bg-[#f1f6ed]"
                  >
                    {isExpanded ? (
                      <ChevronUp size={19} />
                    ) : (
                      <ChevronDown size={19} />
                    )}
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-[#e8ebe2] bg-[#fcfdf9] p-5 sm:p-6">
                  <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h4 className="font-bold text-[#244638]">
                        Failure &amp; Recovery Workflow
                      </h4>
                      <p className="mt-1 text-sm text-[#849087]">
                        Observe each step of the self-healing process.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {result?.completed ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-800">
                          <CheckCircle2 size={14} />
                          Resolved
                        </span>
                      ) : isRunning ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-800">
                          <LoaderCircle size={14} className="animate-spin" />
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

                      {result && !isRunning && (
                        <button
                          type="button"
                          onClick={() => resetSection(section.id)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-[#dfe7dc] bg-white px-3 py-2 text-xs font-semibold text-[#536359] transition hover:bg-[#f1f6ed]"
                        >
                          <RotateCcw size={14} />
                          Reset view
                        </button>
                      )}
                    </div>
                  </div>

                  {errors[section.id] && (
                    <div
                      role="alert"
                      className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
                    >
                      <AlertTriangle size={19} className="mt-0.5 shrink-0" />
                      <div>
                        <p className="font-semibold">Test could not finish</p>
                        <p className="mt-1 leading-5">{errors[section.id]}</p>
                        <p className="mt-2 text-xs">
                          Check that the backend is running and you are logged
                          in as an admin.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {workflowSteps.map((step, stepIndex) => {
                      const StepIcon = step.icon;
                      const complete = hasStage(result, step.key);
                      const active = isStageActive(result, step.key, isRunning);

                      const relatedEvent = [...(result?.events || [])]
                        .reverse()
                        .find((event) => {
                          if (step.key === "injected") {
                            return ["injecting", "injected"].includes(
                              event.key
                            );
                          }

                          if (step.key === "detected") {
                            return event.key === "detected";
                          }

                          if (step.key === "recovering") {
                            return [
                              "recovery_started",
                              "recovering",
                              "recovered",
                            ].includes(event.key);
                          }

                          return ["recovered", "resolved"].includes(event.key);
                        });

                      const isFailureStage =
                        step.key === "injected" || step.key === "detected";
                      const failureStageActive =
                        isFailureStage && active && isRunning;

                      return (
                        <div
                          key={step.key}
                          className={`rounded-2xl border p-4 transition ${
                            failureStageActive
                              ? "border-red-200 bg-red-50"
                              : complete
                              ? "border-green-200 bg-white"
                              : active
                              ? "border-amber-300 bg-white ring-2 ring-amber-50"
                              : "border-[#e5e9df] bg-white"
                          }`}
                        >
                          <div className="mb-4 flex items-center justify-between">
                            <div
                              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                                failureStageActive
                                  ? "bg-red-100 text-red-700"
                                  : complete
                                  ? "bg-green-100 text-green-700"
                                  : active
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-[#f1f6ed] text-[#63866a]"
                              }`}
                            >
                              {active ? (
                                <LoaderCircle
                                  size={19}
                                  className="animate-spin"
                                />
                              ) : (
                                <StepIcon size={19} />
                              )}
                            </div>

                            <span
                              className={`text-xs font-semibold ${
                                failureStageActive
                                  ? "text-red-600"
                                  : "text-[#a0aaa0]"
                              }`}
                            >
                              0{stepIndex + 1}
                            </span>

                            {complete && (
                              <CheckCircle2
                                size={17}
                                className="text-green-600"
                              />
                            )}
                          </div>

                          <h5
                            className={`text-sm font-bold ${
                              failureStageActive
                                ? "text-red-800"
                                : "text-[#244638]"
                            }`}
                          >
                            {step.title}
                          </h5>

                          <p
                            className={`mt-2 text-xs leading-5 ${
                              failureStageActive
                                ? "text-red-700"
                                : "text-[#718078]"
                            }`}
                          >
                            {relatedEvent?.description || step.description}
                          </p>

                          {relatedEvent?.time && (
                            <p className="mt-3 text-[11px] font-medium text-[#89958c]">
                              <Clock size={12} className="mr-1 inline" />
                              {relatedEvent.time}
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
                        <h5 className="font-bold text-[#244638]">
                          Recovery Activity Log
                        </h5>
                        <p className="mt-0.5 text-xs text-[#89958c]">
                          Events received from the self-healing process
                        </p>
                      </div>
                    </div>

                    {!result?.events?.length ? (
                      <p className="rounded-xl bg-[#fcfdf9] p-4 text-sm text-[#849087]">
                        Click the button above to begin the failure test. Each
                        event will appear here.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {result.events.map((event, eventIndex) => {
                          const isFailureEvent =
                            event.key === "injected" ||
                            event.key === "detected";

                          return (
                            <div
                              key={`${event.key}-${eventIndex}`}
                              className={`flex gap-3 rounded-xl p-3 ${
                                isFailureEvent
                                  ? "border border-red-200 bg-red-50"
                                  : ""
                              }`}
                            >
                              <div className="flex flex-col items-center">
                                <span
                                  className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                                    isFailureEvent
                                      ? "bg-red-400"
                                      : event.key === "recovery_failed"
                                      ? "bg-red-500"
                                      : event.key === "notification" ||
                                        event.key === "customer_notified"
                                      ? "bg-sky-500"
                                      : "bg-[#6b9b78]"
                                  }`}
                                />
                                {eventIndex < result.events.length - 1 && (
                                  <span className="mt-1 w-px flex-1 bg-[#e5e9df]" />
                                )}
                              </div>

                              <div className="min-w-0 flex-1 pb-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <p
                                    className={`text-sm font-bold ${
                                      isFailureEvent
                                        ? "text-red-800"
                                        : "text-[#244638]"
                                    }`}
                                  >
                                    {event.title || stageTitle(event.key)}
                                  </p>

                                  {event.time && (
                                    <span className="text-[11px] text-[#89958c]">
                                      {event.time}
                                    </span>
                                  )}
                                </div>

                                <p
                                  className={`mt-1 text-sm leading-6 ${
                                    isFailureEvent
                                      ? "text-red-700"
                                      : "text-[#718078]"
                                  }`}
                                >
                                  {event.description ||
                                    event.message ||
                                    "System event recorded."}
                                </p>

                                <EventDetailsTable event={event} />
                                <CustomerDetails event={event} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {result?.finalResult && (
                    <div
                      className={`mt-5 rounded-2xl border p-5 ${
                        result.finalResult.success
                          ? "border-green-200 bg-green-50"
                          : "border-red-200 bg-red-50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {result.finalResult.success ? (
                          <CheckCircle2
                            size={22}
                            className="mt-0.5 shrink-0 text-green-700"
                          />
                        ) : (
                          <AlertTriangle
                            size={22}
                            className="mt-0.5 shrink-0 text-red-700"
                          />
                        )}

                        <div className="min-w-0 flex-1">
                          <h5 className="font-bold text-[#244638]">
                            {result.finalResult.success
                              ? "Self-Healing Test Completed"
                              : "Self-Healing Test Failed"}
                          </h5>

                          <p className="mt-1 text-sm leading-6 text-[#718078]">
                            {result.finalResult.message ||
                              result.finalResult.description ||
                              "The server returned the final test result."}
                          </p>

                          {section.id === "expired-stock" && (
                            <RecoverySummaryTable
                              summary={result.finalResult.summary}
                            />
                          )}

                          <VerificationTable
                            section={section}
                            verification={result.finalResult.verification}
                          />

                          {result.finalResult.testResults && (
                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                              {[
                                {
                                  label: "Customer A",
                                  customer:
                                    result.finalResult.testResults.customerA,
                                },
                                {
                                  label: "Customer B",
                                  customer:
                                    result.finalResult.testResults.customerB,
                                },
                              ]
                                .filter((item) => item.customer)
                                .map(({ label, customer }) => (
                                  <div
                                    key={label}
                                    className="rounded-xl border border-[#e5e9df] bg-white p-4"
                                  >
                                    <p className="text-xs font-semibold uppercase tracking-wide text-[#64816b]">
                                      {label}
                                    </p>

                                    <p className="mt-2 text-sm font-semibold text-[#244638]">
                                      {customer.name || label}
                                    </p>

                                    {customer.mobileNumber && (
                                      <p className="mt-1 text-xs text-[#718078]">
                                        Mobile: {customer.mobileNumber}
                                      </p>
                                    )}

                                    <p className="mt-1 text-xs text-[#718078]">
                                      Token:{" "}
                                      <span className="font-bold text-[#244638]">
                                        {customer.token ||
                                          customer.tokenNumber ||
                                          "Not provided"}
                                      </span>
                                    </p>

                                    {customer.status && (
                                      <p className="mt-1 text-xs text-[#718078]">
                                        Status: {customer.status}
                                      </p>
                                    )}
                                  </div>
                                ))}
                            </div>
                          )}

                          {section.id === "synchronization-failure" &&
                            result.finalResult.testResults && (
                              <div className="mt-4 rounded-xl border border-[#e5e9df] bg-white p-4">
                                <h6 className="text-sm font-bold text-[#244638]">
                                  Queue Status Verification
                                </h6>

                                <p className="mt-1 text-xs text-[#718078]">
                                  Comparing the outdated status with the
                                  corrected database status.
                                </p>

                                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                                  <div className="rounded-lg bg-red-50 p-3">
                                    <p className="text-xs text-red-700">
                                      Before Recovery
                                    </p>
                                    <p className="mt-1 font-bold text-red-800">
                                      {result.finalResult.testResults
                                        .staleStatus || "Unknown"}
                                    </p>
                                  </div>

                                  <div className="rounded-lg bg-[#f1f6ed] p-3">
                                    <p className="text-xs text-[#47754e]">
                                      Database Status
                                    </p>
                                    <p className="mt-1 font-bold text-[#244638]">
                                      {result.finalResult.testResults
                                        .databaseStatus ||
                                        result.finalResult.testResults
                                          .actualStatus ||
                                        result.finalResult.testResults
                                          .correctedStatus ||
                                        "Unknown"}
                                    </p>
                                  </div>

                                  <div className="rounded-lg bg-green-50 p-3">
                                    <p className="text-xs text-green-700">
                                      After Recovery
                                    </p>
                                    <p className="mt-1 font-bold text-green-800">
                                      {result.finalResult.testResults.customerA
                                        ?.status ||
                                        result.finalResult.testResults
                                          .correctedStatus ||
                                        "Unknown"}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                          {result.finalResult.durationMs != null && (
                            <p className="mt-3 text-xs text-[#718078]">
                              Recovery duration:{" "}
                              {(result.finalResult.durationMs / 1000).toFixed(
                                2
                              )}{" "}
                              seconds
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
        Resilio uses controlled test data for failure simulations. Duplicate
        queue tokens must be rejected by the database, and temporary test
        records should be cleaned up after verification.
      </p>
    </div>
  );
}
