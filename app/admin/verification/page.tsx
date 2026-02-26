import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminVerificationPanel from '@/components/admin-verification-panel'

export default async function AdminVerificationPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Check if user is admin (you can set this in the database or auth metadata)
  if (!user || user.user_metadata?.is_admin !== true) {
    redirect('/')
  }

  const { data: pendingVerifications } = await supabase
    .from('verification_requests')
    .select('*, landlord:profiles(*)')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  const { data: approvedVerifications } = await supabase
    .from('verification_requests')
    .select('*, landlord:profiles(*)')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <AdminVerificationPanel
      pendingVerifications={pendingVerifications || []}
      approvedVerifications={approvedVerifications || []}
      user={user}
    />
  )
}
