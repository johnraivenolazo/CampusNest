import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import PropertyDetails from '@/components/property-details'
import Header from '@/components/header'

export default async function PropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: property, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !property) {
    notFound()
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <main className="bg-background min-h-screen">
      <Header user={user} />
      <PropertyDetails property={property} user={user} />
    </main>
  )
}
