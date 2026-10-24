
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Users,
  RefreshCw,
  Search,
  Clock3,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
  UserRoundCheck,
  Utensils,
  CalendarClock,
  BellRing,
  Check,
  Armchair,
} from "lucide-react";

const API_URL = "/api";

const STATUSES = ["Waiting", "Your Turn", "Seated", "Completed"];
const WAITING_STATUSES = ["Waiting"];

const NEXT_ACTION = {
  Waiting: { label: "Call Customer", nextStatus: "Your Turn" },
  "Your Turn": { label: "Mark as Seated", nextStatus: "Seated" },
  Seated: { label: "Mark as Completed", nextStatus: "Completed" },
  Completed: null,
};

const inputClass =
  "w-full rounded-xl border border-[#dfe7dc] bg-[#fcfdf9] px-4 py-3 text-sm text-[#244638] outline-none transition placeholder:text-[#a0aaa0] focus:border-[#78a17b] focus:ring-2 focus:ring-[#e0efdd]";

function statusStyle(status) {
  switch (status) {
    case "Completed":
      return "bg-green-100 text-green-800";
    case "Seated":
      return "bg-sky-100 text-sky-800";
    case "Your Turn":
      return "bg-amber-100 text-amber-800";
    case "Waiting":
    default:
      return "bg-[#edf5e9] text-[#4c7654]";
  }
}

function formatDateTime(date) {
  if (!date) return "—";

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return "—";

  return parsedDate.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function getWaitText(minutes, position) {
  const wait = Number(minutes);

  if (
    minutes === null ||
    minutes === undefined ||
    minutes === "" ||
    !Number.isFinite(wait) ||
    wait < 0
  ) {
    return "Not available";
  }

  if (position === 1 || wait === 0) return "Your turn is next";

  return `About ${wait} minutes`;
}

function StatCard({ label, value, icon: Icon, note, color }) {
  return (
    <div className="rounded-2xl border border-[#e8eadf] bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#718078]">{label}</p>
          <p className="mt-2 text-3xl font-bold text-[#244638]">{value}</p>
          <p className="mt-1.5 text-xs leading-5 text-[#89958c]">{note}</p>
        </div>
        <div className={`shrink-0 rounded-2xl p-3.5 ${color}`}>
          <Icon size={23} />
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl border border-[#e5e9df] bg-white p-4">
      <div className="flex items-center gap-2 text-[#729477]">
        {Icon && <Icon size={16} />}
        <p className="text-xs font-medium text-[#718078]">{label}</p>
      </div>
      <p className="mt-2 break-words font-bold text-[#294637]">{value}</p>
    </div>
  );
}

export default function QueueManagementPage() {
  const [entries, setEntries] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Load the latest queue records from the backend.
  const fetchQueue = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/queue`, {
        credentials: "include",
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to load the queue.");
      }

      const queueData = Array.isArray(result.data) ? result.data : [];
      setEntries(queueData);
    } catch (err) {
      console.error("Queue loading error:", err);
      setError(err.message || "Unable to load the queue.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // Update one customer's status.
  async function updateStatus(id, nextStatus, tokenNumber) {
    if (updatingId) return;

    setUpdatingId(id);
    setError("");
    setNotice("");

    try {
      const response = await fetch(`${API_URL}/queue/${id}/status`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to update status.");
      }

      const updatedEntry = result.data;

      if (updatedEntry?._id) {
        setEntries((currentEntries) =>
          currentEntries.map((entry) =>
            String(entry._id) === String(updatedEntry._id)
              ? { ...entry, ...updatedEntry }
              : entry
          )
        );
      }

      setNotice(
        `Token ${updatedEntry?.tokenNumber || tokenNumber} updated to ${updatedEntry?.status || nextStatus}.`
      );

      // Reload from the database to verify the saved status.
      await fetchQueue();
    } catch (err) {
      console.error("Queue status update error:", err);
      setError(err.message || "Unable to update status.");
    } finally {
      setUpdatingId("");
    }
  }

  const orderedEntries = useMemo(() => {
    return [...entries].sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;

      if (timeA !== timeB) return timeA - timeB;
      return String(a._id).localeCompare(String(b._id));
    });
  }, [entries]);

  const waitingEntries = useMemo(
    () =>
      orderedEntries.filter((entry) =>
        WAITING_STATUSES.includes(entry.status)
      ),
    [orderedEntries]
  );

  const queueDetails = useMemo(
    () =>
      new Map(
        waitingEntries.map((entry, index) => [
          String(entry._id),
          {
            position: index + 1,
            waitMinutes: entry.estimatedWaitMinutes,
          },
        ])
      ),
    [waitingEntries]
  );

  const filteredEntries = useMemo(() => {
    return orderedEntries.filter((entry) => {
      const term = search.trim().toLowerCase();

      const matchesSearch =
        !term ||
        String(entry.tokenNumber || "").toLowerCase().includes(term) ||
        String(entry.customerName || "").toLowerCase().includes(term) ||
        String(entry.mobileNumber || "").includes(term);

      const matchesStatus =
        statusFilter === "All" || entry.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orderedEntries, search, statusFilter]);

  const activeCount = entries.filter(
    (entry) => entry.status !== "Completed"
  ).length;

  const waitingCount = waitingEntries.length;
  const yourTurnCount = entries.filter(
    (entry) => entry.status === "Your Turn"
  ).length;
  const seatedCount = entries.filter(
    (entry) => entry.status === "Seated"
  ).length;
  const completedCount = entries.filter(
    (entry) => entry.status === "Completed"
  ).length;

  const nextCustomer = waitingEntries[0] || null;
  const nextCustomerDetails = nextCustomer
    ? queueDetails.get(String(nextCustomer._id))
    : null;

  return (
    <div className="space-y-6 text-[#244638]">
      {/* Page header */}
      <section className="flex flex-col justify-between gap-5 rounded-2xl border border-[#dfe8d9] bg-gradient-to-r from-[#e3efdf] via-[#f0f4e9] to-[#fff0e5] p-6 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#64816b]">
            <Users size={15} />
            Restaurant operations
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Queue Management
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#6e8073]">
            Manage customer turns, monitor waiting times, and keep the
            restaurant queue organized.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchQueue}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2f684b] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#24553b] active:scale-[0.98] disabled:opacity-60"
        >
          <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
          Refresh Queue
        </button>
      </section>

      {/* Error notification */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <AlertCircle size={19} className="mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">Something went wrong</p>
            <p className="mt-1">{error}</p>
            {error.toLowerCase().includes("log in") && (
              <p className="mt-1">
                Please sign in to your Resilio admin account.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
            className="rounded-lg p-1 hover:bg-red-100"
          >
            ×
          </button>
        </div>
      )}

      {/* Success notification */}
      {notice && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
        >
          <CheckCircle2 size={19} className="shrink-0" />
          <span className="flex-1">{notice}</span>
          <button
            type="button"
            onClick={() => setNotice("")}
            aria-label="Dismiss message"
            className="rounded-lg px-2 hover:bg-green-100"
          >
            ×
          </button>
        </div>
      )}

      {/* Summary cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active customers"
          value={activeCount}
          icon={Users}
          note="Customers not yet completed"
          color="bg-[#e0efdd] text-[#42734c]"
        />
        <StatCard
          label="Waiting"
          value={waitingCount}
          icon={Clock3}
          note="Customers waiting for their turn"
          color="bg-[#fff0e8] text-[#b56d4d]"
        />
        <StatCard
          label="Your Turn"
          value={yourTurnCount}
          icon={BellRing}
          note="Customers called by the restaurant"
          color="bg-[#ffead9] text-[#b36d36]"
        />
        <StatCard
          label="Seated"
          value={seatedCount}
          icon={Armchair}
          note={`${completedCount} customers completed`}
          color="bg-[#e0efdd] text-[#42734c]"
        />
      </section>

      {/* Next waiting customer */}
      <section className="overflow-hidden rounded-2xl border border-[#e5e9df] bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-[#edf0e9] p-5 sm:flex-row sm:items-center sm:p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-[#e0efdd] p-3.5 text-[#47754e]">
              <UserRoundCheck size={24} />
            </div>
            <div>
              <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#64816b]">
                <Utensils size={14} />
                Up next
              </div>
              <h2 className="text-lg font-bold text-[#244638]">
                Next Customer
              </h2>
              <p className="mt-1 text-sm text-[#849087]">
                The earliest customer still waiting for their turn.
              </p>
            </div>
          </div>

          {nextCustomer && (
            <span
              className={`w-fit rounded-full px-3 py-1.5 text-xs font-semibold ${statusStyle(
                nextCustomer.status
              )}`}
            >
              {nextCustomer.status}
            </span>
          )}
        </div>

        <div className="bg-[#fcfdf9] p-5 sm:p-6">
          {loading && entries.length === 0 ? (
            <div className="flex items-center gap-3 py-5 text-sm text-[#718078]">
              <LoaderCircle size={20} className="animate-spin" />
              Loading next customer...
            </div>
          ) : nextCustomer ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-[#dfe8d9] bg-gradient-to-br from-[#e3efdf] to-[#f7f8ef] p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#64816b]">
                  Token number
                </p>
                <p className="mt-2 break-words text-3xl font-bold text-[#244638]">
                  {nextCustomer.tokenNumber}
                </p>
                <p className="mt-1 text-sm text-[#6e8073]">
                  {nextCustomer.customerName}
                </p>
              </div>

              <DetailItem
                label="Party size"
                value={`${nextCustomer.partySize} ${
                  nextCustomer.partySize === 1 ? "person" : "people"
                }`}
                icon={Users}
              />
              <DetailItem
                label="Queue position"
                value={`#${nextCustomerDetails?.position ?? "—"}`}
                icon={UserRoundCheck}
              />
              <DetailItem
                label="Estimated wait"
                value={getWaitText(
                  nextCustomerDetails?.waitMinutes,
                  nextCustomerDetails?.position
                )}
                icon={Clock3}
              />
            </div>
          ) : (
            <div className="flex items-start gap-3 rounded-xl border border-[#e5e9df] bg-white p-5">
              <div className="rounded-xl bg-[#e0efdd] p-2.5 text-[#47754e]">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <p className="font-semibold text-[#294637]">
                  No customers are waiting
                </p>
                <p className="mt-1 text-sm text-[#849087]">
                  New customers will appear here when they join the queue.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Customer queue directory */}
      <section className="overflow-hidden rounded-2xl border border-[#e5e9df] bg-white shadow-sm">
        <div className="border-b border-[#edf0e9] p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold text-[#244638]">
                Customer Queue
              </h2>
              <p className="mt-1 text-sm text-[#849087]">
                Search customers, check positions, and advance queue status.
              </p>
            </div>
            <span className="w-fit rounded-full bg-[#edf5e9] px-3 py-1.5 text-xs font-semibold text-[#4c7654]">
              {filteredEntries.length} results
            </span>
          </div>

          {/* Search and filters */}
          <div className="mt-5 flex flex-col gap-3 lg:flex-row">
            <label className="relative min-w-0 flex-1">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#89958c]"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search token, name, mobile..."
                className={`${inputClass} pl-10`}
                aria-label="Search queue entries"
              />
            </label>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className={`${inputClass} lg:w-56`}
              aria-label="Filter by queue status"
            >
              <option value="All">All statuses</option>
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={fetchQueue}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#dfe7dc] bg-white px-4 py-3 text-sm font-medium text-[#405b49] transition hover:bg-[#f1f6ed] disabled:opacity-60"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </div>

        {/* Queue table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-left text-sm">
            <thead className="bg-[#f4f7f0] text-xs uppercase tracking-wider text-[#718078]">
              <tr>
                <th className="px-6 py-4 font-semibold">Token</th>
                <th className="px-5 py-4 font-semibold">Customer</th>
                <th className="px-5 py-4 font-semibold">Party size</th>
                <th className="px-5 py-4 font-semibold">Position</th>
                <th className="px-5 py-4 font-semibold">Estimated wait</th>
                <th className="px-5 py-4 font-semibold">Joined</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 font-semibold">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#edf0e9]">
              {loading && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-14 text-center text-[#718078]"
                  >
                    <LoaderCircle
                      size={23}
                      className="mx-auto mb-3 animate-spin"
                    />
                    Loading queue entries...
                  </td>
                </tr>
              )}

              {!loading &&
                filteredEntries.map((entry) => {
                  const details = queueDetails.get(String(entry._id));
                  const isWaiting = entry.status === "Waiting";
                  const isNext = isWaiting && details?.position === 1;
                  const action = NEXT_ACTION[entry.status];
                  const isUpdating = updatingId === entry._id;

                  return (
                    <tr
                      key={entry._id}
                      className={`transition hover:bg-[#fbfcf8] ${
                        isNext ? "bg-[#eaf4e6]/60" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {isNext && (
                            <span
                              className="h-2 w-2 rounded-full bg-[#4c8a58]"
                              title="Next waiting customer"
                            />
                          )}
                          <span className="font-bold text-[#294637]">
                            {entry.tokenNumber}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-semibold text-[#294637]">
                          {entry.customerName}
                        </p>
                        <p className="mt-1 text-xs text-[#89958c]">
                          {entry.mobileNumber || "No mobile number"}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-[#536359]">
                        {entry.partySize}{" "}
                        {entry.partySize === 1 ? "person" : "people"}
                      </td>

                      <td className="px-5 py-4">
                        {isWaiting ? (
                          <span className="font-semibold text-[#294637]">
                            #{details?.position ?? "—"}
                          </span>
                        ) : (
                          <span className="text-[#a0aaa0]">—</span>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-[#536359]">
                        {isWaiting
                          ? getWaitText(details?.waitMinutes, details?.position)
                          : "—"}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <div className="flex items-start gap-2">
                          <CalendarClock
                            size={15}
                            className="mt-0.5 shrink-0 text-[#729477]"
                          />
                          <span className="text-xs text-[#536359]">
                            {formatDateTime(entry.createdAt)}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${statusStyle(
                            entry.status
                          )}`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                          {entry.status}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        {action ? (
                          <button
                            type="button"
                            disabled={Boolean(updatingId)}
                            onClick={() =>
                              updateStatus(
                                entry._id,
                                action.nextStatus,
                                entry.tokenNumber
                              )
                            }
                            className="inline-flex min-w-[160px] items-center justify-center gap-2 rounded-xl bg-[#2f684b] px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-[#24553b] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isUpdating ? (
                              <LoaderCircle
                                size={15}
                                className="animate-spin"
                              />
                            ) : entry.status === "Waiting" ? (
                              <BellRing size={15} />
                            ) : entry.status === "Your Turn" ? (
                              <Armchair size={15} />
                            ) : (
                              <Check size={15} />
                            )}
                            {isUpdating ? "Saving..." : action.label}
                          </button>
                        ) : entry.status === "Completed" ? (
                          <span className="inline-flex items-center gap-1.5 rounded-xl bg-green-50 px-3 py-2.5 text-xs font-semibold text-green-700">
                            <CheckCircle2 size={15} />
                            Completed
                          </span>
                        ) : (
                          <span className="text-xs text-[#89958c]">
                            Check status
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}

              {!loading && filteredEntries.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-14 text-center">
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#edf5e9] text-[#63866a]">
                      <Users size={27} />
                    </div>
                    <p className="font-semibold text-[#294637]">
                      No queue entries found
                    </p>
                    <p className="mt-1 text-sm text-[#849087]">
                      Try another search or status filter, or refresh the queue.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-2 border-t border-[#edf0e9] bg-[#fcfdf9] px-5 py-4 text-xs text-[#879289] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>
            Showing {filteredEntries.length} of {entries.length} queue entries
          </span>
          <span>
            {waitingCount} waiting · {yourTurnCount} your turn · {seatedCount} seated · {completedCount} completed
          </span>
        </div>
      </section>
    </div>
  );
}
