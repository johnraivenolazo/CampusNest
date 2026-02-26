'use client'

import { User } from '@supabase/supabase-js'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface VerificationRequest {
  id: string
  landlord_id: string
  id_document_url: string
  property_proof_url: string
  status: 'pending' | 'approved' | 'rejected'
  rejection_reason: string | null
  created_at: string
  landlord?: {
    full_name: string
    email: string
  }
}

interface AdminVerificationPanelProps {
  pendingVerifications: VerificationRequest[]
  approvedVerifications: VerificationRequest[]
  user: User
}

export default function AdminVerificationPanel({
  pendingVerifications,
  approvedVerifications,
  user: _user,
}: AdminVerificationPanelProps) {
  const [selectedVerification, setSelectedVerification] = useState<VerificationRequest | null>(
    pendingVerifications.length > 0 ? pendingVerifications[0] : null
  )
  const [rejectionReason, setRejectionReason] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const handleApprove = async (verificationId: string) => {
    setIsProcessing(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('verification_requests')
        .update({ status: 'approved' })
        .eq('id', verificationId)

      if (error) throw error

      alert('Verification approved!')
      setSelectedVerification(null)
      // In production, refresh the list
    } catch (error) {
      console.error('Error approving verification:', error)
      alert('Failed to approve verification')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async (verificationId: string) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason')
      return
    }

    setIsProcessing(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('verification_requests')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason,
        })
        .eq('id', verificationId)

      if (error) throw error

      alert('Verification rejected!')
      setRejectionReason('')
      setSelectedVerification(null)
      // In production, refresh the list
    } catch (error) {
      console.error('Error rejecting verification:', error)
      alert('Failed to reject verification')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-6xl p-6 md:p-10">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">Landlord Verification</h1>
          <p className="text-muted-foreground">Review and approve landlord applications</p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                Pending Verification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingVerifications.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {approvedVerifications.length}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Pending List */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pending ({pendingVerifications.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingVerifications.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No pending verifications</p>
                ) : (
                  <div className="space-y-2">
                    {pendingVerifications.map((verification) => (
                      <button
                        key={verification.id}
                        onClick={() => setSelectedVerification(verification)}
                        className={`w-full rounded-lg border p-3 text-left transition-colors ${
                          selectedVerification?.id === verification.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:bg-muted/50'
                        }`}
                      >
                        <p className="text-sm font-medium">
                          {verification.landlord?.full_name || 'Unknown'}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {verification.landlord?.email}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Review Panel */}
          <div className="md:col-span-2">
            {selectedVerification ? (
              <Card>
                <CardHeader>
                  <CardTitle>
                    Review Application: {selectedVerification.landlord?.full_name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Applicant Info */}
                  <div>
                    <h3 className="mb-2 font-semibold">Applicant Information</h3>
                    <div className="bg-muted/50 space-y-1 rounded-lg p-4 text-sm">
                      <p>
                        Name:{' '}
                        <span className="font-medium">
                          {selectedVerification.landlord?.full_name}
                        </span>
                      </p>
                      <p>
                        Email:{' '}
                        <span className="font-medium">{selectedVerification.landlord?.email}</span>
                      </p>
                    </div>
                  </div>

                  {/* Documents */}
                  <div>
                    <h3 className="mb-2 font-semibold">Documents Provided</h3>
                    <div className="space-y-2">
                      <div className="border-border rounded-lg border p-4">
                        <p className="text-muted-foreground mb-2 text-sm">ID Document</p>
                        <a
                          href={selectedVerification.id_document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary text-sm hover:underline"
                        >
                          View Document
                        </a>
                      </div>
                      <div className="border-border rounded-lg border p-4">
                        <p className="text-muted-foreground mb-2 text-sm">Property Proof</p>
                        <a
                          href={selectedVerification.property_proof_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary text-sm hover:underline"
                        >
                          View Document
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Rejection Reason (if rejecting) */}
                  {selectedVerification.status === 'pending' && (
                    <div className="border-border border-t pt-6">
                      <div className="mb-4 grid gap-2">
                        <Label htmlFor="reason">Rejection Reason (required if rejecting)</Label>
                        <Textarea
                          id="reason"
                          placeholder="e.g., Invalid ID, Missing property documents..."
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          rows={3}
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => handleReject(selectedVerification.id)}
                          disabled={isProcessing}
                        >
                          Reject
                        </Button>
                        <Button
                          onClick={() => handleApprove(selectedVerification.id)}
                          disabled={isProcessing}
                        >
                          {isProcessing ? 'Processing...' : 'Approve'}
                        </Button>
                      </div>
                    </div>
                  )}

                  {selectedVerification.status === 'approved' && (
                    <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                      <Badge className="bg-green-100 text-green-800">Approved</Badge>
                      <p className="text-muted-foreground mt-2 text-sm">
                        This landlord has been verified and can list properties
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Select a pending verification to review</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
