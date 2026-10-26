
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Clock3,
  CheckCircle2,
  Menu,
  X,
  UtensilsCrossed,
  Ticket,
  Users,
  Leaf,
} from "lucide-react";

const restaurantImage =
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=85";

const colors = {
  forest: "#173D35",
  cream: "#F7F4EC",
  sage: "#DCE5D8",
  sand: "#D8C6A5",
  muted: "#78877C",
  white: "#FFFFFF",
};

export default function CustomerHome() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  const steps = [
    {
      number: "01",
      icon: <Users size={25} />,
      title: "Join the queue",
      description:
        "Enter your details and join the restaurant waiting list online.",
    },
    {
      number: "02",
      icon: <Ticket size={25} />,
      title: "Get your token",
      description:
        "Receive your queue token and know your place in line.",
    },
    {
      number: "03",
      icon: <Clock3 size={25} />,
      title: "Track your turn",
      description:
        "Check your queue status online and know when it is your turn.",
    },
  ];

  return (
    <div
      className="min-h-screen bg-[#F7F4EC] text-[#173D35]"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-[#173D35]/10 bg-[#F7F4EC]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8 lg:px-12">
          <Link to="/" onClick={closeMenu} className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#173D35] text-white">
              <UtensilsCrossed size={23} />
            </div>

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

          <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
            <a href="#home" className="transition hover:text-[#78877C]">
              Home
            </a>
            <a
              href="#how-it-works"
              className="transition hover:text-[#78877C]"
            >
              How It Works
            </a>
            <a href="#about" className="transition hover:text-[#78877C]">
              About
            </a>
            <Link
              to="/queue/check"
              className="transition hover:text-[#78877C]"
            >
              Check Status
            </Link>
          </nav>

          <div className="hidden md:block">
            <Link
              to="/queue/join"
              className="inline-flex items-center gap-2 rounded-lg bg-[#173D35] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#28594D]"
            >
              Join Queue <ArrowRight size={16} />
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="rounded-lg border border-[#173D35]/15 p-2 md:hidden"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {menuOpen && (
          <nav className="border-t border-[#173D35]/10 bg-[#F7F4EC] px-5 py-5 md:hidden">
            <div className="flex flex-col gap-5 text-sm font-medium">
              <a href="#home" onClick={closeMenu}>Home</a>
              <a href="#how-it-works" onClick={closeMenu}>
                How It Works
              </a>
              <a href="#about" onClick={closeMenu}>About</a>
              <Link to="/queue/check" onClick={closeMenu}>
                Check Queue Status
              </Link>
              <Link
                to="/queue/join"
                onClick={closeMenu}
                className="rounded-lg bg-[#173D35] px-5 py-3 text-center font-semibold text-white"
              >
                Join Queue <ArrowRight size={16} className="ml-1 inline" />
              </Link>
            </div>
          </nav>
        )}
      </header>

      <main>
        {/* HERO */}
        <section
          id="home"
          className="overflow-hidden px-5 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-20"
        >
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              

              <h2
                className="max-w-xl text-4xl font-normal leading-tight tracking-tight sm:text-5xl lg:text-6xl"
                style={{ fontFamily: "'DM Serif Display', serif" }}
              >
                Good food.
                <br />
                Good company.
                <br />
                <span className="text-[#78877C]">Less waiting.</span>
              </h2>

              <p className="mt-6 max-w-lg text-base leading-8 text-[#173D35]/75 sm:text-lg">
                Your table is worth waiting for, but waiting in line isn't.
                Join the restaurant queue online and keep track of your turn
                from anywhere.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/queue/join"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#173D35] px-7 py-4 font-semibold text-white transition hover:bg-[#28594D]"
                >
                  Join the Queue <ArrowRight size={18} />
                </Link>

                <Link
                  to="/queue/check"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#173D35]/20 px-7 py-4 font-semibold transition hover:bg-[#DCE5D8]"
                >
                  <Clock3 size={18} /> Track My Token
                </Link>
              </div>

            </div>

            <div className="relative px-1 pb-5 sm:px-3">
              <div className="absolute -right-2 -top-3 h-24 w-24 rounded-2xl bg-[#DCE5D8] sm:-right-2 sm:-top-5" />

              <img
                src={restaurantImage}
                alt="A welcoming restaurant dining table"
                className="relative h-[330px] w-full rounded-2xl object-cover shadow-xl sm:h-[450px]"
              />

            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section
          id="how-it-works"
          className="bg-[#DCE5D8] px-5 py-16 sm:px-8 sm:py-20 lg:px-12"
        >
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <p className="text-xs font-bold uppercase tracking-[3px] text-[#78877C]">
                Simple and convenient
              </p>
              <h2
                className="mt-3 text-3xl sm:text-4xl"
                style={{ fontFamily: "'DM Serif Display', serif" }}
              >
                Your table, three steps away
              </h2>
              <p className="mt-4 leading-7 text-[#173D35]/70">
                Spend less time standing in line and more time enjoying your
                restaurant experience.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {steps.map((step) => (
                <div
                  key={step.number}
                  className="rounded-2xl border border-[#173D35]/10 bg-[#FFFFFF] p-7 transition duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-8"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#DCE5D8] text-[#173D35]">
                      {step.icon}
                    </div>
                    <span
                      className="text-3xl text-[#78877C]/60"
                      style={{ fontFamily: "'DM Serif Display', serif" }}
                    >
                      {step.number}
                    </span>
                  </div>

                  <h3
                    className="mt-6 text-xl"
                    style={{ fontFamily: "'DM Serif Display', serif" }}
                  >
                    {step.title}
                  </h3>
                  <p className="mt-3 leading-7 text-[#78877C]">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-10 text-center">
              <Link
                to="/queue/join"
                className="inline-flex items-center gap-2 rounded-lg bg-[#173D35] px-7 py-4 font-semibold text-white transition hover:bg-[#28594D]"
              >
                Get Started <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>

        {/* ABOUT */}
        <section
          id="about"
          className="px-5 py-16 sm:px-8 sm:py-20 lg:px-12"
        >
          <div className="mx-auto grid max-w-7xl items-center gap-10 md:grid-cols-2 md:gap-16">
            <div className="overflow-hidden rounded-2xl">
              <img
                src="https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1100&q=85"
                alt="A comfortable restaurant interior"
                className="h-[300px] w-full object-cover sm:h-[390px]"
                loading="lazy"
              />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[3px] text-[#78877C]">
                About Resilio
              </p>
              <h2
                className="mt-4 text-3xl leading-tight sm:text-4xl"
                style={{ fontFamily: "'DM Serif Display', serif" }}
              >
                A better way to wait for what you love.
              </h2>
              <p className="mt-5 leading-8 text-[#173D35]/75">
                Resilio makes restaurant queues easier to manage. Customers
                can join a queue and check their token status online, while
                restaurant staff can organize the waiting list more
                efficiently.
              </p>

              <p className="mt-4 leading-8 text-[#173D35]/75">
                Less confusion at the counter. Better organization for the
                restaurant. A smoother experience for everyone.
              </p>

              <Link
                to="/queue/join"
                className="mt-7 inline-flex items-center gap-2 font-semibold text-[#173D35] transition hover:text-[#78877C]"
              >
                Join the queue <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>

        {/* CALL TO ACTION */}
        <section className="px-5 pb-16 sm:px-8 sm:pb-20 lg:px-12">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-7 rounded-2xl bg-[#173D35] px-7 py-10 text-[#F7F4EC] sm:px-12 sm:py-14 md:flex-row md:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[3px] text-[#D8C6A5]">
                Ready when you are
              </p>
              <h2
                className="mt-3 text-3xl sm:text-4xl"
                style={{ fontFamily: "'DM Serif Display', serif" }}
              >
                Your next meal starts here.
              </h2>
              <p className="mt-3 max-w-xl leading-7 text-white/75">
                Join the queue online or check the status of your existing
                token.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Link
                to="/queue/join"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#DCE5D8] px-6 py-3.5 font-semibold text-[#173D35] transition hover:bg-[#FFFFFF]"
              >
                Join Queue <ArrowRight size={17} />
              </Link>
              <Link
                to="/queue/check"
                className="inline-flex items-center justify-center rounded-lg border border-white/30 px-6 py-3.5 font-semibold transition hover:bg-white/10"
              >
                Check Status
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-[#173D35] px-5 py-10 text-[#F7F4EC] sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-start">
            <div>
              <Link to="/" className="inline-flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#DCE5D8] text-[#173D35]">
                  <UtensilsCrossed size={21} />
                </div>
                <span
                  className="text-2xl font-bold"
                  style={{ fontFamily: "'DM Serif Display', serif" }}
                >
                  resilio.
                </span>
              </Link>
              <p className="mt-4 max-w-sm text-sm leading-6 text-white/70">
                A simpler restaurant queue experience, designed to make
                waiting a little easier.
              </p>
            </div>

            <div>
              <h3 className="font-semibold">Quick Links</h3>
              <div className="mt-4 flex flex-col gap-3 text-sm text-white/70">
                <a href="#home" className="transition hover:text-white">Home</a>
                <a href="#about" className="transition hover:text-white">About Us</a>
                <Link
                  to="/queue/join"
                  className="transition hover:text-white"
                >
                  Join Queue
                </Link>
                <Link
                  to="/queue/check"
                  className="transition hover:text-white"
                >
                  Check Queue Status
                </Link>
              </div>
            </div>

            <div>
              <h3 className="font-semibold">Restaurant Admin</h3>
              <p className="mt-3 max-w-xs text-sm leading-6 text-white/70">
                Manage restaurant operations through the admin panel.
              </p>
              <Link
                to="/admin"
                className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/30 px-5 py-3 text-sm font-semibold transition hover:bg-white/10"
              >
                Admin Login <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          <div className="mt-9 border-t border-white/15 pt-5 text-center text-xs text-white/60 sm:text-left">
            © {new Date().getFullYear()} Resilio. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
