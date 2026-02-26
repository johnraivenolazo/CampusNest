import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LandlordDashboard from '@/components/landlord-dashboard'
import Header from '@/components/header'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.user_type !== 'landlord') {
    redirect('/auth/login')
  }

  const { data: properties } = await supabase
    .from('properties')
    .select('*')
    .eq('landlord_id', user.id)

  return (
    <main className="bg-background min-h-screen">
      <Header user={user} />
      <LandlordDashboard user={user} initialProperties={properties || []} />
    </main>
  )
}
