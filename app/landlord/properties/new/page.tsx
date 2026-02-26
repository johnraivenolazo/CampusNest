import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PropertyForm from '@/components/property-form'
import Header from '@/components/header'

export default async function NewPropertyPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.user_type !== 'landlord') {
    redirect('/auth/login')
  }

  return (
    <main className="bg-background min-h-screen">
      <Header user={user} />
      <div className="mx-auto max-w-2xl p-6 md:p-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Create New Listing</h1>
          <p className="text-muted-foreground mt-1">Add details about your rental property</p>
        </div>
        <PropertyForm user={user} />
      </div>
    </main>
  )
}
