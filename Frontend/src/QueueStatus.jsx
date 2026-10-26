``
import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Clock,
  Users,
  CheckCircle2,
  RefreshCw,
  UtensilsCrossed,
  Ticket,
  CircleAlert,
} from "lucide-react";

const API_URL = "/api";

const statusDetails = {
  Waiting: {
    title: "You're in the queue",
    description: "Please wait while we prepare for your turn.",
    step: 1,
  },
  "Your Turn": {
    title: "It's your turn!",
    description: "Please approach the restaurant staff.",
    step: 2,
  },
  Seated: {
    title: "You're seated",
    description: "Enjoy your meal!",
    step: 3,
  },
  Completed: {
    title: "Visit completed",
    description: "Thank you for dining with us.",
    step: 4,
  },
};

export default function QueueStatus() {
  const location = useLocation();
  const initialEntry = location.state?.queueEntry || null;

  const [tokenNumber, setTokenNumber] = useState(
    initialEntry?.tokenNumber || ""
  );
  const [queueEntry, setQueueEntry] = useState(initialEntry);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    if (initialEntry) {
      setQueueEntry(initialEntry);
      setTokenNumber(initialEntry.tokenNumber || "");
    }
  }, [initialEntry]);

  const checkStatus = async (event) => {
    event?.preventDefault();

    const token = tokenNumber.trim();

    if (!token) {
      setError("Please enter your token number.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/queue/token/${encodeURIComponent(token)}`,
        { credentials: "include" }
      );

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(
          result.message || "Token not found. Please check and try again."
        );
      }

      const entry = result.data || result.queueEntry || result;

      if (!entry?.tokenNumber) {
        throw new Error("Queue details could not be found.");
      }

      setQueueEntry(entry);
      setTokenNumber(entry.tokenNumber);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message || "Unable to check your queue right now.");
    } finally {
      setLoading(false);
    }
  };

  const status = queueEntry?.status || "Waiting";
  const details = statusDetails[status] || statusDetails.Waiting;

  const position = queueEntry?.position ?? queueEntry?.queuePosition;
  const estimatedWait =
    queueEntry?.estimatedWait ?? queueEntry?.estimatedWaitMinutes;

  return (
    <div className="min-h-screen bg-[#F7F4EC] text-[#173D35]">
      {/* Navbar - same style as Join Queue */}
      <header className="border-b border-[#173D35]/10 bg-[#F7F4EC]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#173D35] text-white">
              <UtensilsCrossed size={20} />
            </span>

           <div>
              <h1
                className="text-2xl font-bold tracking-tight"
                style={{ fontFamily: "'DM Serif Display', serif" }}
              >
                resilio<span className="text-[#78877C]">.</span>
              </h1>
              <p className="text-[10px] font-semibold uppercase tracking-[2px] text-[#78877C]">
                Dine without the wait
              </p>
            </div>
            
          </Link>

          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-medium text-[#173D35]/75 transition hover:text-[#173D35]"
          >
            <button
            type="button"
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 rounded-full border border-[#173D35]/20 px-4 py-2.5 text-sm font-medium transition hover:bg-white"
          >
            <ArrowLeft size={16} />
            Back to home
          </button>
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#DCE5D8]">
              <Ticket size={26} />
            </div>

            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#78877A]">
              Queue status
            </p>

            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Track your queue
            </h1>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#173D35]/65 sm:text-base">
              Enter your token number to check your current status and see
              what's next.
            </p>
          </div>

          {/* Token search */}
          <section className="rounded-2xl border border-[#173D35]/10 bg-white p-5 shadow-sm sm:p-7">
            <form onSubmit={checkStatus}>
              <label
                htmlFor="tokenNumber"
                className="mb-2 block text-sm font-semibold"
              >
                Your token number
              </label>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Ticket
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#78877A]"
                  />

                  <input
                    id="tokenNumber"
                    type="text"
                    value={tokenNumber}
                    onChange={(e) => setTokenNumber(e.target.value)}
                    placeholder="Enter your token number"
                    className="w-full rounded-xl border border-[#173D35]/15 bg-[#FAFAF7] py-3.5 pl-11 pr-4 text-sm outline-none transition placeholder:text-[#173D35]/35 focus:border-[#173D35] focus:ring-2 focus:ring-[#173D35]/10"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#173D35] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#245348] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <RefreshCw size={17} className="animate-spin" />
                  ) : (
                    <Search size={17} />
                  )}
                  {loading ? "Checking..." : "Track queue"}
                </button>
              </div>
            </form>

            {error && (
              <div
                role="alert"
                className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                <CircleAlert size={18} className="mt-0.5 shrink-0" />
                <p>{error}</p>
              </div>
            )}
          </section>

          {/* Queue details */}
          {queueEntry && (
            <section className="mt-5 overflow-hidden rounded-2xl border border-[#173D35]/10 bg-white shadow-sm">
              <div className="flex flex-col gap-4 bg-[#DCE5D8] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#173D35]/60">
                    Token number
                  </p>

                  <h2 className="mt-1 text-2xl font-bold">
                    {queueEntry.tokenNumber}
                  </h2>
                </div>

                <span className="w-fit rounded-full border border-[#173D35]/10 bg-white px-4 py-2 text-sm font-semibold">
                  {status}
                </span>
              </div>

              <div className="p-5 sm:p-6">
                <h3 className="text-xl font-semibold">{details.title}</h3>

                <p className="mt-1 text-sm leading-6 text-[#173D35]/65">
                  {details.description}
                </p>

                <div className="my-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-[#F7F4EC] p-4">
                    <div className="flex items-center gap-2 text-sm text-[#173D35]/60">
                      <Users size={17} />
                      Queue position
                    </div>

                    <p className="mt-2 text-xl font-semibold">
                      {position != null ? `#${position}` : "—"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-[#F7F4EC] p-4">
                    <div className="flex items-center gap-2 text-sm text-[#173D35]/60">
                      <Clock size={17} />
                      Estimated wait
                    </div>

                    <p className="mt-2 text-xl font-semibold">
                      {estimatedWait != null ? `${estimatedWait} min` : "—"}
                    </p>
                  </div>
                </div>

                {/* Progress */}
                <div className="rounded-xl border border-[#173D35]/10 p-4">
                  <p className="mb-4 text-sm font-semibold">Queue progress</p>

                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: "Waiting", step: 1 },
                      { label: "Your Turn", step: 2 },
                      { label: "Seated", step: 3 },
                      { label: "Completed", step: 4 },
                    ].map((item) => {
                      const complete = details.step >= item.step;

                      return (
                        <div key={item.step} className="text-center">
                          <div
                            className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full ${
                              complete
                                ? "bg-[#173D35] text-white"
                                : "bg-[#DCE5D8] text-[#173D35]/50"
                            }`}
                          >
                            {complete ? (
                              <CheckCircle2 size={17} />
                            ) : (
                              <span className="text-xs">{item.step}</span>
                            )}
                          </div>

                          <p className="mt-2 text-[10px] font-medium text-[#173D35]/70 sm:text-xs">
                            {item.label}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={checkStatus}
                  disabled={loading}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-[#173D35]/20 py-3 text-sm font-semibold transition hover:bg-[#F7F4EC] disabled:opacity-60"
                >
                  <RefreshCw
                    size={16}
                    className={loading ? "animate-spin" : ""}
                  />
                  Refresh status
                </button>

                {lastUpdated && (
                  <p className="mt-3 text-center text-xs text-[#173D35]/50">
                    Last checked at {lastUpdated.toLocaleTimeString()}
                  </p>
                )}
              </div>
            </section>
          )}

          {!queueEntry && !error && (
            <div className="mt-5 rounded-2xl border border-dashed border-[#173D35]/20 px-5 py-7 text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#DCE5D8]">
                <Search size={20} />
              </div>

              <p className="mt-3 text-sm font-semibold">
                Your queue details will appear here
              </p>

              <p className="mt-1 text-xs leading-5 text-[#173D35]/60">
                Enter the token you received after joining the queue.
              </p>
            </div>
          )}

          <p className="mt-6 text-center text-sm text-[#173D35]/65">
            Haven't joined yet?{" "}
            <Link
              to="/queue/join"
              className="font-semibold text-[#173D35] underline underline-offset-4"
            >
              Join the queue
            </Link>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#173D35]/10 px-5 py-5 text-center text-xs text-[#173D35]/50">
        resilio. · A smoother way to dine
      </footer>
    </div>
  );
}
