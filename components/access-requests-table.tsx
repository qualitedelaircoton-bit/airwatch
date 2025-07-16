"use client";

import { useEffect, useState } from 'react';

// Fetch pending access requests via API

// import Firestore client removed
// import db removed
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface AccessRequest {
  id: string;
  email: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
}

const approveRequest = async (requestId: string, email: string) => {
  const functions = getFunctions();
  const approveAccessRequestFn = httpsCallable(functions, 'approveAccessRequest');

  toast.loading('Approving request...');

  try {
    const result = await approveAccessRequestFn({ requestId, email });
    toast.dismiss();
    toast.success(`Access approved for ${email}. User created successfully.`);
    console.log('Function result:', result.data);
  } catch (error: any) {
    toast.dismiss();
    console.error('Error calling approveAccessRequest function:', error);
    toast.error(error.message || 'An unknown error occurred.');
  }
};

const rejectRequest = async (requestId: string) => {
  try {
    const res = await fetch(`/api/access-requests/${requestId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'rejected' }),
    });
    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error || 'Failed to reject access request');
    }
    toast.info('Access request has been rejected.');
  } catch (error: any) {
    console.error('Error rejecting access request:', error);
    toast.error(error.message || 'Failed to reject access request.');
  }
};

export function AccessRequestsTable() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/access-requests?status=pending');
        if (!res.ok) throw new Error('Failed to load access requests');
        const data = await res.json();
        setRequests(data.map((r: any) => ({
          id: r.id,
          email: r.email,
          reason: r.reason,
          status: r.status,
          createdAt: new Date(r.createdAt),
        })));
      } catch (err) {
        console.error('Error loading access requests:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
    const interval = setInterval(fetchRequests, 5000);
    return () => clearInterval(interval);
  }, []);
    

  if (loading) {
    return <div>Loading access requests...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Access Requests</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.length > 0 ? (
              requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>{request.email}</TableCell>
                  <TableCell className="max-w-xs truncate">{request.reason}</TableCell>
                  <TableCell>{request.createdAt.toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={request.status === 'pending' ? 'default' : 'outline'}>
                      {request.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button onClick={() => approveRequest(request.id, request.email)} size="sm" className="mr-2">Approve</Button>
                    <Button onClick={() => rejectRequest(request.id)} size="sm" variant="destructive">Reject</Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center">No pending requests.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
