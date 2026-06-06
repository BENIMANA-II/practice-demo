import { Link } from "react-router-dom";
import {
  SteeringWheel, Car, ClipboardText, ChartBar, Users, ShieldCheck,
  Notebook, ClockCounterClockwise, ChartLineUp,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { SYSTEM_NAME, COMPANY } from "@/lib/constants";

// "What VRS can do?" — core capabilities.
const SERVICES = [
  { icon: Car, title: "Fleet Management", text: "Track every vehicle, its type, price and live availability status." },
  { icon: ClipboardText, title: "Reservations & Rentals", text: "Book, confirm and return vehicles with full date and fee tracking." },
  { icon: Users, title: "Customer Records", text: "Keep customer details organised and searchable in one place." },
  { icon: ChartBar, title: "Reports", text: "Generate the Customer–Vehicle reservation-rental report on demand." },
];

// "What VRS can solve?" — the manual-system pain points it removes.
const SOLUTIONS = [
  { icon: Notebook, title: "No more logbooks & paper forms", text: "Replace logbooks, receipt books and notice boards with instant digital records anyone on the team can reach." },
  { icon: ShieldCheck, title: "Fewer errors & duplicates", text: "Built-in validation and one shared source of truth stop the inconsistent, duplicated entries manual tools create." },
  { icon: ClockCounterClockwise, title: "Real-time availability", text: "See vehicle status, bookings and rentals update live — no more guessing what is free or already rented." },
  { icon: ChartLineUp, title: "Fewer missed opportunities", text: "Faster bookings and clear reporting mean fewer delays, less idle fleet time and no lost business." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Minimal public top bar */}
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <SteeringWheel size={24} weight="fill" className="text-primary" />
            <span className="font-bold tracking-tight">{SYSTEM_NAME}</span>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/login">Sign In</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 py-20 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
          <ShieldCheck size={14} /> {COMPANY} · Huye City, Rwanda
        </span>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight @md:text-5xl">
          Vehicle Rental & Reservation, digitalised.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          SwiftWheels Enterprises rents and sells company vehicles in Huye City, Southern
          Province. As the business grows, manual logbooks, paper forms and verbal
          coordination have become slow and error-prone. The Vehicle Rental & Reservation
          Subsystem replaces them with a fast, reliable web application — so your team
          manages the fleet, customer reservations and rentals in real time, reduces
          mistakes, and never misses a booking opportunity.
        </p>
        {/* Two hero buttons, aligned horizontally. */}
        <div className="mt-8 flex flex-row flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link to="/register">Get Started</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href="#services">Explore More</a>
          </Button>
        </div>
      </section>

      {/* What VRS can do? */}
      <section id="services" className="border-t bg-card py-16">
        <div className="@container mx-auto max-w-6xl px-4">
          <h2 className="text-center text-2xl font-bold tracking-tight">What VRS can do?</h2>
          <div className="mt-10 grid grid-cols-1 gap-6 @md:grid-cols-2 @lg:grid-cols-4">
            {SERVICES.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.title} className="rounded-lg border bg-background p-6 shadow-accent">
                  <Icon size={28} weight="duotone" className="text-primary" />
                  <h3 className="mt-3 font-semibold">{s.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* What VRS can solve? */}
      <section className="border-t py-16">
        <div className="@container mx-auto max-w-6xl px-4">
          <h2 className="text-center text-2xl font-bold tracking-tight">What VRS can solve?</h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-sm text-muted-foreground">
            The problems the old manual system caused — and how VRS removes each one.
          </p>
          <div className="mt-10 grid grid-cols-1 gap-6 @md:grid-cols-2">
            {SOLUTIONS.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.title} className="flex gap-4 rounded-lg border bg-card p-6 shadow-accent">
                  <Icon size={28} weight="duotone" className="shrink-0 text-primary" />
                  <div>
                    <h3 className="font-semibold">{s.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Call to action, above the footer — presented as an elevated card. */}
      <section className="border-t py-16">
        <div className="mx-auto max-w-5xl px-4">
          <div className="rounded-lg bg-primary px-6 py-12 text-center text-primary-foreground shadow-accent">
            <h2 className="text-2xl font-bold tracking-tight @md:text-3xl">
              Ready to digitalize SwiftWheels operations?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-primary-foreground/80">
              Create your account and start managing the fleet, reservations and rentals today —
              with real-time updates your whole team can rely on.
            </p>
            <div className="mt-6 flex flex-row flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" variant="secondary">
                <Link to="/register">Get Started</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                <Link to="/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        © 2026 {COMPANY}. All rights reserved.
      </footer>
    </div>
  );
}
