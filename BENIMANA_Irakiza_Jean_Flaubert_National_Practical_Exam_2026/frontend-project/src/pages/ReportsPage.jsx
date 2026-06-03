// Reports page: three stock reports (available / in / out) with a daily/weekly/monthly filter and print.
import { useEffect, useState, useCallback } from 'react';
import { Printer, ChartBar } from '@phosphor-icons/react';

import { useAuth } from '@/context/AuthContext';
import {
  getAvailableStockReport,
  getStockInReport,
  getStockOutReport,
} from '@/api/reportsAPI';
import { extractError } from '@/api/axiosClient';
import { REPORT_PERIODS, SYSTEM_NAME, SYSTEM_FULL_NAME } from '@/lib/constants';
import { formatNumber, formatCompactCurrency, formatDate, formatDateTime, getUserLabel } from '@/lib/format';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { PageWrapper, StateBlock, Pagination, usePagination } from '@/components/common';

const REPORTS = {
  'available-stock': { label: 'Available Stock', fetcher: getAvailableStockReport },
  'stock-in': { label: 'Stock In', fetcher: getStockInReport },
  'stock-out': { label: 'Stock Out', fetcher: getStockOutReport },
};

export default function ReportsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('available-stock');
  const [period, setPeriod] = useState('daily');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [printing, setPrinting] = useState(false);

  const { page, setPage, totalPages, pageItems, total, pageSize } = usePagination(rows, 10);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await REPORTS[activeTab].fetcher(period);
      setRows(data);
      setPage(1); // start each report/period on the first page
    } catch (err) {
      console.error(err);
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }, [activeTab, period, setPage]);

  useEffect(() => {
    load();
  }, [load]);

  // Print the full report (all rows), not just the current page.
  useEffect(() => {
    const before = () => setPrinting(true);
    const after = () => setPrinting(false);
    window.addEventListener('beforeprint', before);
    window.addEventListener('afterprint', after);
    return () => {
      window.removeEventListener('beforeprint', before);
      window.removeEventListener('afterprint', after);
    };
  }, []);

  const displayRows = printing ? rows : pageItems;

  const periodLabel = REPORT_PERIODS.find((p) => p.value === period)?.label || '';
  const reportTitle = REPORTS[activeTab].label;
  const userLabel = getUserLabel(user);

  function renderTable() {
    if (activeTab === 'available-stock') {
      return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Base Stock</TableHead>
              <TableHead className="text-right">Stock In</TableHead>
              <TableHead className="text-right">Stock Out</TableHead>
              <TableHead className="text-right">Available</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayRows.map((r) => (
              <TableRow key={r._id}>
                <TableCell>{r.productCode}</TableCell>
                <TableCell>{r.productName}</TableCell>
                <TableCell>{r.category}</TableCell>
                <TableCell className="text-right tabular-nums">{formatNumber(r.quantityInStock)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatNumber(r.stockIn)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatNumber(r.stockOut)}</TableCell>
                <TableCell className="text-right font-semibold tabular-nums">{formatNumber(r.available)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    }

    // Stock In / Stock Out detailed list
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Code</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Warehouse</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead className="text-right">Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayRows.map((r) => (
            <TableRow key={r._id}>
              <TableCell>{formatDate(r.transactionDate)}</TableCell>
              <TableCell>{r.productCode || '—'}</TableCell>
              <TableCell>{r.productName || '—'}</TableCell>
              <TableCell>{r.warehouseName || '—'}</TableCell>
              <TableCell className="text-right tabular-nums">{formatNumber(r.quantityMoved)}</TableCell>
              <TableCell className="text-right tabular-nums font-medium">{formatCompactCurrency(r.value)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  return (
    <PageWrapper>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-accent)] text-white">
            <ChartBar size={22} />
          </span>
          <div>
            <h1 className="text-2xl font-bold">Reports</h1>
            <p className="text-[var(--color-muted)]">Daily, weekly and monthly stock reports.</p>
          </div>
        </div>
        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-full sm:w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REPORT_PERIODS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer size={16} />
            Print
          </Button>
        </div>
      </div>

      {/* Print-only header */}
      <div className="print-only mb-4">
        <h2 className="text-xl font-bold">{SYSTEM_FULL_NAME} ({SYSTEM_NAME})</h2>
        <p>{reportTitle} Report — {periodLabel}</p>
        <p>Printed on: {formatDateTime()}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="no-print grid w-full grid-cols-3 sm:inline-flex sm:w-auto">
          {Object.entries(REPORTS).map(([key, { label }]) => (
            <TabsTrigger key={key} value={key}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.keys(REPORTS).map((key) => (
          <TabsContent key={key} value={key}>
            <Card className="print-clean">
              <CardContent className="p-4">
                <StateBlock
                  loading={loading}
                  error={error}
                  onRetry={load}
                  empty={!loading && !error && rows.length === 0}
                  emptyMessage={`No data for the selected period (${periodLabel}).`}
                >
                  {renderTable()}
                </StateBlock>
                <div className="no-print">
                  <Pagination page={page} setPage={setPage} totalPages={totalPages} total={total} pageSize={pageSize} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Print-only footer */}
      <div className="print-only mt-4">
        <p>Generated by {userLabel}</p>
      </div>
    </PageWrapper>
  );
}
