import { useState } from "react";
import { CheckCircle, ShieldCheck } from "@phosphor-icons/react";
import { toast } from "sonner";
import { PageWrapper, StateBlock } from "@/components/common";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useFetch } from "@/hooks/useFetch";
import { usersAPI } from "@/api/usersAPI";
import { formatDate } from "@/lib/format";

export default function UsersPage() {
  const { data, loading, error, refetch } = useFetch(() => usersAPI.list(), []);
  const [approvingId, setApprovingId] = useState(null);

  const users = data || [];
  const pendingCount = users.filter((u) => u.Status !== "approved").length;

  // Admin approves a pending account so the user can sign in.
  async function approve(user) {
    setApprovingId(user.User_ID);
    try {
      await usersAPI.approve(user.User_ID);
      toast.success(`${user.UserName} approved`);
      await refetch();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Could not approve user");
    } finally {
      setApprovingId(null);
    }
  }

  return (
    <PageWrapper title="User Approvals" description="Approve new accounts so they can access the system.">
      <Card>
        <CardHeader>
          <CardTitle>
            All Users{" "}
            {pendingCount > 0 && (
              <Badge variant="warning" className="ml-2">{pendingCount} pending</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(loading || error || users.length === 0) ? (
            <StateBlock loading={loading} error={error}
              empty={!loading && !error && users.length === 0} emptyText="No users yet." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.User_ID}>
                    <TableCell className="font-medium">{u.UserName}</TableCell>
                    <TableCell>
                      {u.Role === "admin" ? (
                        <span className="inline-flex items-center gap-1 text-primary">
                          <ShieldCheck size={16} /> admin
                        </span>
                      ) : (
                        "staff"
                      )}
                    </TableCell>
                    <TableCell>
                      {u.Status === "approved" ? (
                        <Badge variant="success">approved</Badge>
                      ) : (
                        <Badge variant="warning">pending</Badge>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(u.created_at)}</TableCell>
                    <TableCell className="text-right">
                      {u.Status !== "approved" ? (
                        <Button size="sm" disabled={approvingId === u.User_ID}
                          onClick={() => approve(u)}>
                          <CheckCircle size={16} /> Approve
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
