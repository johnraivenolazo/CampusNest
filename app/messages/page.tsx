import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import InboxView from '@/components/inbox-view'
import Header from '@/components/header'

export const dynamic = 'force-dynamic'

export default async function MessagesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // Fetch all messages where user is either sender or receiver
  // We use postgREST foreign key disambiguation to join the sender and receiver profiles
  const { data: messages, error } = await supabase
    .from('messages')
    .select(
      `
      id,
      content,
      created_at,
      sender_id,
      receiver_id,
      property_id,
      read,
      properties (
        id,
        title,
        property_images
      ),
      sender:profiles!messages_sender_id_fkey (
        id,
        full_name,
        email,
        profile_image_url
      ),
      receiver:profiles!messages_receiver_id_fkey (
        id,
        full_name,
        email,
        profile_image_url
      )
    `
    )
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching messages:', error)
  }

  return (
    <div className="bg-background min-h-screen">
      <Header user={user} />
      <InboxView initialMessages={messages || []} currentUser={user} />
    </div>
  )
}
