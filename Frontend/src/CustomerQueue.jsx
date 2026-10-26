import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Users,
  Utensils,
  MapPin,
  Smartphone,
  ShieldCheck,
  Check,
  UtensilsCrossed,
} from "lucide-react";

function CustomerQueue() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    customerName: "",
    mobileNumber: "",
    partySize: "2",
    arrivalType: "onsite",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const cleanName = form.customerName.trim();
    const cleanMobile = form.mobileNumber.trim();
    const partySize = Number(form.partySize);

    if (cleanName.length < 2 || cleanName.length > 80) {
      setError("Name must contain between 2 and 80 characters.");
      return;
    }

    if (!/^[0-9]{10}$/.test(cleanMobile)) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (!Number.isInteger(partySize) || partySize < 1 || partySize > 20) {
      setError("Party size must be between 1 and 20 people.");
      return;
    }

    if (!["onsite", "remote"].includes(form.arrivalType)) {
      setError("Please select a valid arrival method.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/queue/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          customerName: cleanName,
          mobileNumber: cleanMobile,
          partySize,
          arrivalType: form.arrivalType,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.success !== true) {
        throw new Error(
          result.message || "Unable to join the queue. Please try again."
        );
      }

      const entry = result.data;

      if (!entry?.id || !entry?.tokenNumber) {
        throw new Error(
          "Queue response is missing the token or queue entry ID."
        );
      }

      navigate("/queue/status", {
        state: {
          queueEntry: entry,
          notification: result.notification,
        },
        replace: true,
      });
    } catch (err) {
      setError(
        err.message ||
          "Unable to connect to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-[#D9DED5] bg-white px-4 py-3 text-sm text-[#173D35] outline-none transition placeholder:text-[#8A958A] focus:border-[#173D35] focus:ring-2 focus:ring-[#DCE5D8]";

  return (
    <div
      className="min-h-screen bg-[#F7F4EC] text-[#173D35]"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <header className="border-b border-[#173D35]/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-3"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#173D35] text-white">
              <UtensilsCrossed size={23}  />
            </span>

            <span className="text-left">
              <h1
                className="text-2xl font-bold tracking-tight"
                style={{ fontFamily: "'DM Serif Display', serif" }}
              >
                resilio<span className="text-[#78877C]">.</span>
              </h1>
                           <p className="text-[10px] font-semibold uppercase tracking-[2px] text-[#78877C]">
                Dine without the wait
              </p>
            </span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 rounded-full border border-[#173D35]/20 px-4 py-2.5 text-sm font-medium transition hover:bg-white"
          >
            <ArrowLeft size={16} />
            Back to home
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-9 sm:px-8 sm:py-12">
        <div className="grid items-start gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
          <section className="lg:sticky lg:top-10">
            <p className="text-xs font-bold uppercase tracking-[2.3px] text-[#78877C]">
              Your table starts here
            </p>

            <h1
              className="mt-4 max-w-md text-3xl leading-tight sm:text-4xl"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              Join the queue.
              <br />
              <span className="text-[#78877C]">
                We'll take it from here.
              </span>
            </h1>

            <p className="mt-4 max-w-md text-sm leading-7 text-[#173D35]/70">
              Tell us a little about your visit. Once you join, you'll receive
              a token you can use to check your place in the queue.
            </p>

            <div className="mt-8 overflow-hidden rounded-xl">
              <img
                src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1100&q=85"
                alt="A welcoming restaurant dining table"
                className="h-48 w-full object-cover sm:h-60 lg:h-64"
              />
            </div>

            <div className="mt-5 flex items-start gap-3 border-b border-[#173D35]/10 pb-5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#DCE5D8]">
                <Smartphone size={17} />
              </div>
              <div>
                <p className="text-sm font-semibold">Keep your token handy</p>
                <p className="mt-1 text-xs leading-5 text-[#78877C]">
                  Use it later to check your queue status from your phone.
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#DCE5D8]">
                <ShieldCheck size={17} />
              </div>
              <div>
                <p className="text-sm font-semibold">
                  Your details stay private
                </p>
                <p className="mt-1 text-xs leading-5 text-[#78877C]">
                  Your contact information is used to manage your queue entry,
                  not displayed to other customers.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[#173D35]/10 bg-white p-5 sm:p-8">
            <div className="mb-7 border-b border-[#173D35]/10 pb-5">
              <p className="text-[11px] font-bold uppercase tracking-[2px] text-[#78877C]">
                Reservation queue
              </p>
              <h2
                className="mt-2 text-2xl"
                style={{ fontFamily: "'DM Serif Display', serif" }}
              >
                Your details
              </h2>
              <p className="mt-2 text-sm text-[#78877C]">
                All fields are required to join the queue.
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="customerName"
                  className="mb-2 block text-sm font-semibold"
                >
                  Your name
                </label>

                <input
                  id="customerName"
                  name="customerName"
                  type="text"
                  value={form.customerName}
                  onChange={handleChange}
                  required
                  minLength={2}
                  maxLength={80}
                  autoComplete="name"
                  placeholder="Enter your full name"
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="mobileNumber"
                  className="mb-2 block text-sm font-semibold"
                >
                  Mobile number
                </label>

                <input
                  id="mobileNumber"
                  name="mobileNumber"
                  type="tel"
                  inputMode="numeric"
                  value={form.mobileNumber}
                  onChange={(event) =>
                    setForm((previousForm) => ({
                      ...previousForm,
                      mobileNumber: event.target.value
                        .replace(/\D/g, "")
                        .slice(0, 10),
                    }))
                  }
                  required
                  maxLength={10}
                  pattern="[0-9]{10}"
                  autoComplete="tel"
                  placeholder="10-digit mobile number"
                  className={inputClass}
                />

                <p className="mt-1.5 text-xs text-[#78877C]">
                  Enter your 10-digit mobile number.
                </p>
              </div>

              <div>
                <label
                  htmlFor="partySize"
                  className="mb-2 block text-sm font-semibold"
                >
                  Number of people
                </label>

                <div className="relative">
                  <Users
                    size={17}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#78877C]"
                  />

                  <select
                    id="partySize"
                    name="partySize"
                    value={form.partySize}
                    onChange={handleChange}
                    required
                    className={`${inputClass} appearance-none pl-10`}
                  >
                    {Array.from({ length: 20 }, (_, index) => index + 1).map(
                      (size) => (
                        <option key={size} value={size}>
                          {size} {size === 1 ? "person" : "people"}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              <fieldset>
                <legend className="mb-3 text-sm font-semibold">
                  How will you join?
                </legend>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                      form.arrivalType === "onsite"
                        ? "border-[#173D35] bg-[#F2F6EF]"
                        : "border-[#D9DED5] hover:bg-[#F7F4EC]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="arrivalType"
                      value="onsite"
                      checked={form.arrivalType === "onsite"}
                      onChange={handleChange}
                      className="mt-1 accent-[#173D35]"
                    />

                    <span className="flex-1">
                      <span className="flex items-center gap-2 text-sm font-semibold">
                        <MapPin size={16} />
                        At restaurant
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-[#78877C]">
                        I'm already at the restaurant.
                      </span>
                    </span>

                    {form.arrivalType === "onsite" && (
                      <Check size={16} className="shrink-0" />
                    )}
                  </label>

                  <label
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                      form.arrivalType === "remote"
                        ? "border-[#173D35] bg-[#F2F6EF]"
                        : "border-[#D9DED5] hover:bg-[#F7F4EC]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="arrivalType"
                      value="remote"
                      checked={form.arrivalType === "remote"}
                      onChange={handleChange}
                      className="mt-1 accent-[#173D35]"
                    />

                    <span className="flex-1">
                      <span className="flex items-center gap-2 text-sm font-semibold">
                        <Smartphone size={16} />
                        Joining remotely
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-[#78877C]">
                        I'm joining before I arrive.
                      </span>
                    </span>

                    {form.arrivalType === "remote" && (
                      <Check size={16} className="shrink-0" />
                    )}
                  </label>
                </div>
              </fieldset>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#173D35] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#28594C] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Joining queue..." : "Confirm & join queue"}
                {!loading && <ArrowRight size={17} />}
              </button>
            </form>

            <p className="mt-4 text-center text-xs leading-5 text-[#78877C]">
              Your details will be used to manage your queue entry.
            </p>
          </section>
        </div>
      </main>

      <footer className="mt-5 border-t border-[#173D35]/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-5 text-xs text-[#78877C] sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="self-start font-semibold text-[#173D35] hover:text-[#78877C]"
          >
            resilio.
          </button>

          <p>Your next good meal starts here.</p>

          <button
            type="button"
            onClick={() => navigate("/queue/check")}
            className="self-start font-medium text-[#173D35] hover:underline sm:self-auto"
          >
            Already have a token? Check status
          </button>
        </div>
      </footer>
    </div>
  );
}

export default CustomerQueue;