import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Utensils } from "lucide-react";

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
    "w-full rounded-xl border border-[#D8DED5] bg-[#FDFCF8] px-4 py-3 text-[#173D35] outline-none transition focus:border-[#173D35] focus:ring-2 focus:ring-[#173D35]/10";

  return (
    <div className="min-h-screen bg-[#F7F4EC] px-4 py-8 text-[#173D35] md:px-10">
      <div className="mx-auto max-w-2xl">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-[#65766B] hover:text-[#173D35]"
        >
          <ArrowLeft size={18} />
          Back to home
        </button>

        <div className="rounded-3xl border border-[#E5E2D9] bg-white p-6 shadow-sm md:p-10">
          <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#DCE5D8]">
            <Utensils size={27} />
          </div>

          <p className="text-xs font-bold tracking-[0.2em] text-[#78877C]">
            RESILIO QUEUE
          </p>

          <h1 className="mt-2 text-3xl font-bold md:text-4xl">
            Join the queue
          </h1>

          <p className="mt-3 leading-7 text-[#65766B]">
            Enter your details to join the restaurant queue and receive your
            token number.
          </p>

          {error && (
            <div
              role="alert"
              className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
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
                onChange={handleChange}
                required
                maxLength={10}
                pattern="[0-9]{10}"
                autoComplete="tel"
                placeholder="Enter your 10-digit mobile number"
                className={inputClass}
              />
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
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#78877C]"
                />

                <select
                  id="partySize"
                  name="partySize"
                  value={form.partySize}
                  onChange={handleChange}
                  required
                  className={`${inputClass} pl-11`}
                >
                  {Array.from({ length: 10 }, (_, index) => index + 1).map(
                    (size) => (
                      <option key={size} value={size}>
                        {size} {size === 1 ? "person" : "people"}
                      </option>
                    )
                  )}
                  <option value="11">11 people</option>
                  <option value="12">12 people</option>
                  <option value="13">13 people</option>
                  <option value="14">14 people</option>
                  <option value="15">15 people</option>
                  <option value="16">16 people</option>
                  <option value="17">17 people</option>
                  <option value="18">18 people</option>
                  <option value="19">19 people</option>
                  <option value="20">20 people</option>
                </select>
              </div>
            </div>

            <fieldset>
              <legend className="mb-3 text-sm font-semibold">
                How will you join?
              </legend>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label
                  className={`cursor-pointer rounded-xl border p-4 transition ${
                    form.arrivalType === "onsite"
                      ? "border-[#173D35] bg-[#DCE5D8]"
                      : "border-[#D8DED5] hover:bg-[#F7F4EC]"
                  }`}
                >
                  <input
                    type="radio"
                    name="arrivalType"
                    value="onsite"
                    checked={form.arrivalType === "onsite"}
                    onChange={handleChange}
                    className="mr-2 accent-[#173D35]"
                  />
                  <span className="font-medium">At restaurant</span>
                </label>

                <label
                  className={`cursor-pointer rounded-xl border p-4 transition ${
                    form.arrivalType === "remote"
                      ? "border-[#173D35] bg-[#DCE5D8]"
                      : "border-[#D8DED5] hover:bg-[#F7F4EC]"
                  }`}
                >
                  <input
                    type="radio"
                    name="arrivalType"
                    value="remote"
                    checked={form.arrivalType === "remote"}
                    onChange={handleChange}
                    className="mr-2 accent-[#173D35]"
                  />
                  <span className="font-medium">Joining remotely</span>
                </label>
              </div>
            </fieldset>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#173D35] px-5 py-4 font-semibold text-white transition hover:bg-[#28594C] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Joining queue..." : "Confirm & Join Queue"}
            </button>
          </form>

          <p className="mt-5 text-center text-xs leading-5 text-[#78877C]">
            Your contact details are used to manage your queue entry and should
            not be displayed to other customers.
          </p>
        </div>
      </div>
    </div>
  );
}

export default CustomerQueue;
