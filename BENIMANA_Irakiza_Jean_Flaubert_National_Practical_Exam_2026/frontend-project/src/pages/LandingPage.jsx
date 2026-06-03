// Public home page at "/": explains the system and links to Sign In / Get Started.
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CaretDown,
  Cube,
  Package,
  Warehouse as WarehouseIcon,
  ArrowsLeftRight,
  ChartBar,
  ClockCounterClockwise,
  Stack,
  CalendarBlank,
  MapPin,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ROUTES, SYSTEM_NAME, SYSTEM_FULL_NAME, COMPANY_NAME } from '@/lib/constants';

const CAPABILITIES = [
  { icon: Package, title: 'Manage Products', text: 'Record product codes, categories, stock levels, prices and suppliers in one place.' },
  { icon: WarehouseIcon, title: 'Track Warehouses', text: 'Register every depot and branch with its code, name and location.' },
  { icon: ArrowsLeftRight, title: 'Record Movements', text: 'Capture stock-in and stock-out transactions with full edit and delete control.' },
  { icon: ChartBar, title: 'Generate Reports', text: 'Daily, weekly and monthly reports for available stock, stock in and stock out — print-ready.' },
];

const STATS = [
  { icon: ClockCounterClockwise, value: 'Real-time', label: 'Stock visibility across every warehouse, the moment it changes.' },
  { icon: Stack, value: '3 core registers', label: 'Products, warehouses and stock movements in one connected system.' },
  { icon: CalendarBlank, value: 'Daily · Weekly · Monthly', label: 'Available-stock, stock-in and stock-out reports generated automatically.' },
];

export default function LandingPage() {
  const navigate = useNavigate();

  function scrollToServices() {
    const el = document.getElementById('services');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Minimal public top bar */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2 font-semibold text-[var(--color-accent)]">
          <Cube size={24} weight="fill" />
          <span>{SYSTEM_NAME}</span>
        </div>
        <Button variant="outline" onClick={() => navigate(ROUTES.login)}>
          Sign In
        </Button>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 py-12 md:py-20">
        <div>
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-accent)] text-[var(--color-accent-foreground)] shadow-accent">
            <Cube size={32} weight="fill" />
          </div>
          <h1 className="text-center text-4xl font-bold leading-tight text-[var(--color-text)] md:text-5xl">
            {SYSTEM_FULL_NAME}
            <span className="mt-2 block animate-fade-up text-2xl font-semibold text-[var(--color-accent)] md:text-3xl">
              for smarter inventory control
            </span>
          </h1>
          <p className="mt-4 mx-auto max-w-3xl text-center text-lg text-[var(--color-muted)]">
            Replace slow, error-prone paperwork. {SYSTEM_NAME} lets StockHub record products, warehouses and
            stock movements digitally and generate the reports the store manager needs in seconds.
          </p>
          <p className="mt-8 flex items-center justify-center gap-1.5 text-center text-sm font-medium uppercase tracking-[0.08em] text-[var(--color-muted)]">
            <MapPin size={16} className="text-[var(--color-accent)]" />
            {COMPANY_NAME} · Kigali, Rwanda
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button size="lg" onClick={() => navigate(ROUTES.register)}>
              Get Started
              <ArrowRight size={18} />
            </Button>
            <Button size="lg" variant="outline" onClick={scrollToServices}>
              Explore More
              <CaretDown size={18} />
            </Button>
          </div>
        </div>
      </section>

      {/* Services / capabilities */}
      <section id="services" className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold">What {SYSTEM_NAME} does</h2>
          <p className="mt-2 text-[var(--color-muted)]">
            Everything the store manager needs to digitise stock management.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {CAPABILITIES.map(({ icon: Icon, title, text }) => (
            <Card key={title}>
              <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-bg)] text-[var(--color-accent)]">
                  <Icon size={24} />
                </div>
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="text-sm text-[var(--color-muted)]">{text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Why StockHub uses SMS */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold">Why StockHub uses {SYSTEM_NAME}</h2>
          <p className="mt-2 text-[var(--color-muted)]">
            The advantages of digitising stock management with {SYSTEM_NAME}.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {STATS.map(({ icon: Icon, value, label }) => (
            <Card key={value}>
              <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-bg)] text-[var(--color-accent)]">
                  <Icon size={24} />
                </div>
                <h3 className="text-lg font-semibold">{value}</h3>
                <p className="text-sm text-[var(--color-muted)]">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Call to action */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-[var(--color-surface)] p-8 text-center shadow-accent">
          <h3 className="text-2xl font-semibold">Ready to digitise your stock records?</h3>
          <Button size="lg" onClick={() => navigate(ROUTES.register)}>
            Get Started
            <ArrowRight size={18} />
          </Button>
        </div>
      </section>

      <footer className="border-t border-[var(--color-border)] py-6 text-center text-sm text-[var(--color-muted)]">
        {SYSTEM_FULL_NAME} ({SYSTEM_NAME}) — {COMPANY_NAME}
      </footer>
    </div>
  );
}
