import { useState } from "react";
import { Printer, FileText } from "@phosphor-icons/react";
import { toast } from "sonner";
import { PageWrapper, StateBlock } from "@/components/common";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { reportsAPI } from "@/api/reportsAPI";
import { formatMoney, formatDate } from "@/lib/format";
import { todayStr } from "@/lib/validators";
import { COMPANY, SYSTEM_NAME } from "@/lib/constants";

// 16 report columns exactly as required by the brief.
const COLUMNS = [
  ["Full Name", "Full_Name"],
  ["National ID", "National_ID"],
  ["Phone", "Phone"],
  ["Plate", "Plate_Number"],
  ["Brand", "Brand"],
  ["Model", "Model"],
  ["Year", "Year"],
  ["Type", "Vehicle_Type"],
  ["Reservation Date", "Reservation_Date", "date"],
  ["Rental Start", "Start_Date", "date"],
  ["Rental End", "End_Date", "date"],
  ["Reservation Status", "Reservation_Status"],
  ["Rental Date", "Rental_Date", "date"],
  ["Return Date", "Return_Date", "date"],
  ["Rental Fee", "Rental_Fee", "money"],
  ["Rental Status", "Rental_Status"],
];

export default function ReportsPage() {
  const [from, setFrom] = useState(todayStr());
  const [to, setTo] = useState(todayStr());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasRun, setHasRun] = useState(false);

  async function runReport() {
    setLoading(true);
    setError("");
    try {
      const res = await reportsAPI.reservations(from, to);
      setReport(res.data.data);
      setHasRun(true);
    } catch (err) {
      if (!err.response) setError("Unable to connect to the server. Please try again.");
      else setError(err.response.data?.error || "Could not generate report");
      toast.error("Report failed");
    } finally {
      setLoading(false);
    }
  }

  function renderCell(row, col) {
    const [, key, type] = col;
    const val = row[key];
    if (type === "money") return formatMoney(val);
    if (type === "date") return formatDate(val);
    return val ?? "—";
  }

  return (
    <PageWrapper title="Reports" description="Generate and print the reservation-rental report.">
      <Tabs defaultValue="reservation">
        <TabsList className="no-print">
          <TabsTrigger value="reservation">
            <FileText size={16} className="mr-1" /> Customer–Vehicle Reservation-Rental
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reservation">
          {/* Filter controls (hidden when printing) */}
          <Card className="no-print mb-4">
            <CardHeader><CardTitle>Filter</CardTitle></CardHeader>
            <CardContent>
              <div className="@container">
                <div className="grid grid-cols-1 gap-4 @sm:grid-cols-3 @lg:grid-cols-4">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="from">From date</Label>
                    <Input id="from" type="date" value={from} max={todayStr()}
                      onChange={(e) => setFrom(e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="to">To date</Label>
                    <Input id="to" type="date" value={to} max={todayStr()}
                      onChange={(e) => setTo(e.target.value)} />
                  </div>
                  <div className="flex items-end gap-2">
                    <Button onClick={runReport} disabled={loading}>Generate</Button>
                    {report && report.rows.length > 0 && (
                      <Button variant="outline" onClick={() => window.print()}>
                        <Printer size={16} /> Print
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Print-only header */}
          <div className="print-only mb-4">
            <h1 className="text-xl font-bold">{COMPANY}</h1>
            <p className="text-sm">{SYSTEM_NAME} — Customer Vehicle Reservation-Rental Report</p>
            {report && <p className="text-sm">Period: {report.from} to {report.to}</p>}
          </div>

          <Card>
            <CardContent className="pt-6">
              {loading || error ? (
                <StateBlock loading={loading} error={error} />
              ) : !hasRun ? (
                <StateBlock empty emptyText="Choose a date range and click Generate." />
              ) : report.rows.length === 0 ? (
                <StateBlock empty emptyText="No reservations in this period." />
              ) : (
                <>
                  {/* Fixed layout + tiny text + wrapping cells => all 16 columns
                      fit the page width with no horizontal scrolling. */}
                  <table className="w-full table-fixed border-collapse text-[11px] leading-tight">
                    <thead>
                      <tr className="border-b">
                        {COLUMNS.map((c) => (
                          <th key={c[1]} className="col-head break-words px-1 py-1.5 text-left align-bottom">
                            {c[0]}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {report.rows.map((row, i) => (
                        <tr key={i} className="border-b align-top hover:bg-muted/50">
                          {COLUMNS.map((c) => (
                            <td key={c[1]} className="break-words px-1 py-1.5 tabular-nums">
                              {renderCell(row, c)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Totals */}
                  <div className="mt-4 flex flex-col gap-1 border-t pt-4 text-sm @sm:flex-row @sm:justify-end @sm:gap-8">
                    <span>Total records: <strong className="tabular-nums">{report.totals.records}</strong></span>
                    <span>Total rental fees: <strong className="tabular-nums">{formatMoney(report.totals.totalFees)}</strong></span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Print-only footer */}
          <div className="print-only mt-4 text-xs">
            Generated by {SYSTEM_NAME} · {todayStr()}
          </div>
        </TabsContent>
      </Tabs>
    </PageWrapper>
  );
}
