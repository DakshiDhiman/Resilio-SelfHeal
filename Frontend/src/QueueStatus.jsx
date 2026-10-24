
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Clock,
  Users,
  ArrowLeft,
  Utensils,
  CheckCircle,
} from "lucide-react";

function QueueStatus() {
  const navigate = useNavigate();
  const [tokenNumber, setTokenNumber] = useState("");
  const [queueEntry, setQueueEntry] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const checkStatus = async (event) => {
    event.preventDefault();

    const token = tokenNumber.trim().toUpperCase();

    if (!token) {
      setError("Please enter your token number.");
      setQueueEntry(null);
      return;
    }

    setLoading(true);
    setError("");
    setQueueEntry(null);

    try {
      const response = await fetch(
        `/api/queue/token/${encodeURIComponent(token)}`
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Queue status could not be found."
        );
      }

      setQueueEntry(result.data);
    } catch (err) {
      setError(
        err.message || "Unable to connect to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const statusMessages = {
    Waiting: "You are in the queue. Please wait for your turn.",
    "Almost Your Turn": "You are almost next! Please stay nearby.",
    Called: "Your turn has been called. Please check with restaurant staff.",
    "Table Ready": "Your table is ready. Please approach the restaurant staff.",
    Seated: "You have been seated. Enjoy your meal!",
    Completed: "Your visit is marked as completed. Thank you!",
    Cancelled: "This queue entry has been cancelled.",
    "No-show": "Your token was marked as no-show. Please contact the staff.",
  };

  const isWaiting = ["Waiting", "Almost Your Turn"].includes(
    queueEntry?.status
  );

  const waitMinutes = Number(queueEntry?.estimatedWaitMinutes);
  const hasWaitEstimate =
    queueEntry?.estimatedWaitMinutes !== null &&
    queueEntry?.estimatedWaitMinutes !== undefined &&
    Number.isFinite(waitMinutes) &&
    waitMinutes >= 0;

  const waitText = !hasWaitEstimate
    ? "Not available"
    : waitMinutes === 0
      ? "Your turn is next"
      : `About ${waitMinutes} minutes`;

  return (
    <div className="min-h-screen bg-[#F7F4EC] px-4 py-8 text-[#173D35] sm:px-6">
      <header className="mx-auto flex max-w-5xl items-center justify-between">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 font-bold"
        >
          <Utensils size={24} />
          <span className="text-xl">Resilio</span>
        </button>

        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 rounded-xl border border-[#D8C6A5] px-4 py-2 text-sm font-semibold hover:bg-white"
        >
          <ArrowLeft size={16} />
          Home
        </button>
      </header>

      <main className="mx-auto mt-12 max-w-xl">
        <div className="text-center">
          <span className="inline-flex rounded-full bg-[#DCE5D8] px-4 py-2 text-xs font-bold tracking-widest">
            CUSTOMER QUEUE
          </span>

          <h1 className="mt-5 text-3xl font-bold sm:text-4xl">
            Check Your Queue Status
          </h1>

          <p className="mt-4 leading-7 text-[#78877C]">
            Enter the token number you received when joining the Resilio queue.
          </p>
        </div>

        <div className="mt-8 rounded-3xl border border-[#E5E2D9] bg-white p-6 shadow-sm sm:p-8">
          <form onSubmit={checkStatus}>
            <label
              htmlFor="tokenNumber"
              className="mb-2 block text-sm font-semibold"
            >
              Your Token Number
            </label>

            <input
              id="tokenNumber"
              type="text"
              value={tokenNumber}
              onChange={(event) => setTokenNumber(event.target.value)}
              placeholder="e.g. R-4821"
              autoComplete="off"
              className="w-full rounded-xl border border-[#D8C6A5] bg-[#F7F4EC] px-4 py-4 outline-none focus:border-[#173D35] focus:ring-2 focus:ring-[#DCE5D8]"
            />

            {error && (
              <p
                role="alert"
                className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#173D35] px-5 py-4 font-semibold text-white hover:bg-[#28594C] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Search size={18} />
              {loading ? "Checking..." : "Check Status"}
            </button>
          </form>

          {queueEntry && (
            <div
              aria-live="polite"
              className="mt-7 rounded-2xl border border-[#DCE5D8] bg-[#F7F4EC] p-5"
            >
              <p className="text-sm font-semibold text-[#78877C]">
                TOKEN NUMBER
              </p>

              <h2 className="mt-2 text-4xl font-bold">
                {queueEntry.tokenNumber}
              </h2>

              <div className="mt-5 rounded-xl bg-[#DCE5D8] p-4">
                <p className="text-sm text-[#78877C]">Current Status</p>
                <p className="mt-1 text-lg font-bold">
                  {queueEntry.status}
                </p>
                <p className="mt-2 text-sm leading-6">
                  {statusMessages[queueEntry.status] ||
                    "Please contact restaurant staff for assistance."}
                </p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-[#E5E2D9] bg-white p-4">
                  <Users size={20} className="mb-2 text-[#78877C]" />
                  <p className="text-xs text-[#78877C]">Party Size</p>
                  <p className="mt-1 font-semibold">
                    {queueEntry.partySize}{" "}
                    {queueEntry.partySize === 1 ? "person" : "people"}
                  </p>
                </div>

                <div className="rounded-xl border border-[#E5E2D9] bg-white p-4">
                  <Clock size={20} className="mb-2 text-[#78877C]" />
                  <p className="text-xs text-[#78877C]">
                    Estimated Wait
                  </p>
                  <p className="mt-1 font-semibold">
                    {isWaiting ? waitText : "—"}
                  </p>
                </div>
              </div>

              {isWaiting && queueEntry.queuePosition != null && (
                <div className="mt-4 rounded-xl border border-[#E5E2D9] bg-white p-4">
                  <p className="text-sm text-[#78877C]">
                    Your Position in Queue
                  </p>
                  <p className="mt-1 text-2xl font-bold">
                    #{queueEntry.queuePosition}
                  </p>
                </div>
              )}

              {!isWaiting &&
                ["Called", "Table Ready", "Seated", "Completed"].includes(
                  queueEntry.status
                ) && (
                  <div className="mt-4 flex items-start gap-2 rounded-xl border border-[#DCE5D8] bg-white p-4">
                    <CheckCircle
                      size={20}
                      className="mt-0.5 shrink-0 text-[#173D35]"
                    />
                    <p className="text-sm leading-6">
                      Your queue status has changed. Follow the instructions
                      shown above or ask restaurant staff if you need help.
                    </p>
                  </div>
                )}

              <p className="mt-4 text-sm leading-6 text-[#78877C]">
                This page updates when you click Check Status. Check again
                later to see the latest status saved by the restaurant system.
              </p>

              <button
                type="button"
                onClick={checkStatus}
                disabled={loading}
                className="mt-4 w-full rounded-xl border border-[#D8C6A5] px-4 py-3 text-sm font-semibold hover:bg-white disabled:opacity-60"
              >
                {loading ? "Refreshing..." : "Refresh Status"}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default QueueStatus;
