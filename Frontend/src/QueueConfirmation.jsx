
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2, Clock, Users, ArrowLeft, Utensils } from "lucide-react";

function QueueConfirmation() {
  const navigate = useNavigate();
  const location = useLocation();
  const entry = location.state?.queueEntry;
  const notification = location.state?.notification;

  if (!entry) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F7F4EC] px-6 text-center text-[#173D35]">
        <h1 className="text-2xl font-bold">No queue details found</h1>
        <p className="mt-3 text-[#78877C]">
          Please join the queue to receive your token.
        </p>
        <button
          onClick={() => navigate("/queue/join")}
          className="mt-6 rounded-xl bg-[#173D35] px-6 py-3 text-white"
        >
          Join the Queue
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7F4EC] px-4 py-10 text-[#173D35]">
      <div className="w-full max-w-lg rounded-3xl border border-[#E5E2D9] bg-white p-7 text-center shadow-sm md:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#DCE5D8]">
          <CheckCircle2 size={36} className="text-[#2F7555]" />
        </div>

        <p className="mt-6 text-xs font-bold tracking-[0.2em] text-[#78877C]">
          RESILIO QUEUE
        </p>
        <h1 className="mt-2 text-3xl font-bold">You're in the queue!</h1>
        <p className="mt-3 text-[#78877C]">
          Thanks, {entry.customerName}. Your queue entry was created successfully.
        </p>

{notification && (
  <div
    role="status"
    aria-live="polite"
    className="mt-5 rounded-xl border border-[#DCE5D8] bg-[#DCE5D8] p-4 text-left text-sm text-[#173D35]"
  >
    <p className="font-bold">{notification.title}</p>
    <p className="mt-1 leading-6">{notification.message}</p>
  </div>
)}

        <div className="mt-8 rounded-2xl bg-[#F7F4EC] px-5 py-7">
          <p className="text-sm font-semibold tracking-wider text-[#78877C]">
            YOUR TOKEN NUMBER
          </p>
          <p className="mt-3 text-5xl font-bold tracking-wide">
            {entry.tokenNumber}
          </p>
          <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#DCE5D8] px-4 py-2 text-sm font-semibold">
            <span className="h-2 w-2 rounded-full bg-[#2F7555]" />
            {entry.status || "Waiting"}
          </span>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 text-left">
          <div className="rounded-xl border border-[#E5E2D9] p-4">
            <Users size={20} className="mb-3 text-[#78877C]" />
            <p className="text-xs text-[#78877C]">Party size</p>
            <p className="mt-1 font-semibold">
              {entry.partySize} {entry.partySize === 1 ? "person" : "people"}
            </p>
          </div>

          <div className="rounded-xl border border-[#E5E2D9] p-4">
            <Clock size={20} className="mb-3 text-[#78877C]" />
            <p className="text-xs text-[#78877C]">Estimated wait</p>
            <p className="mt-1 font-semibold">
              {entry.estimatedWaitMinutes > 0
                ? `${entry.estimatedWaitMinutes} minutes`
                : "Not calculated yet"}
            </p>
          </div>
        </div>

        <p className="mt-6 text-sm leading-6 text-[#78877C]">
          Keep your token number handy. You can use it when checking with restaurant staff.
        </p>

        <button
          onClick={() => navigate("/")}
          className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#173D35] px-5 py-4 font-semibold text-white hover:bg-[#28594C]"
        >
          <Utensils size={18} />
          Back to Home
        </button>
      </div>
    </div>
  );
}

export default QueueConfirmation;
