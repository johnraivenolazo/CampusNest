import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import PropertyMessagesView from '@/components/property-messages-view'

export default async function PropertyMessagesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.user_type !== 'landlord') {
    redirect('/')
  }

  // Get property
  const { data: property, error: propError } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .eq('landlord_id', user.id)
    .single()

  if (propError || !property) {
    notFound()
  }

  // Get messages
  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('property_id', id)
    .order('created_at', { ascending: false })

  return <PropertyMessagesView property={property} messages={messages || []} user={user} />
}
