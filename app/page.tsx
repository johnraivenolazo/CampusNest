import { createClient } from '@/lib/supabase/server'
import MapSearch from '@/components/map-search'
import Header from '@/components/header'

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <main className="bg-background min-h-screen">
      <Header user={user} />
      <MapSearch user={user} />
    </main>
  )
}
