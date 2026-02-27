import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/header'
import PropertyListings from '@/components/property-listings'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function SavedPropertiesPage() {
    const supabase = await createClient()

    // 1. Authenticate user
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/')
    }

    // 2. Verify user is a student (optional but good practice)
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'student') {
        redirect('/')
    }

    // 3. Fetch saved properties
    const { data: savedRecords, error } = await supabase
        .from('saved_properties')
        .select(`
      property_id,
      properties (*)
    `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching saved properties:', error)
    }

    // Extract the actual property objects from the join
    const savedProperties = savedRecords?.map(record => record.properties).filter(Boolean) as any[] || []

    return (
        <div className="bg-background min-h-screen">
            <Header user={user} />

            <main className="mx-auto max-w-7xl px-4 py-8 md:px-8">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Saved Properties</h1>
                        <p className="text-muted-foreground mt-2">
                            Properties you've bookmarked for later.
                        </p>
                    </div>
                </div>

                {savedProperties.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-32 text-center">
                        <div className="bg-muted mb-4 flex h-20 w-20 items-center justify-center rounded-full">
                            <Home className="text-muted-foreground h-10 w-10" />
                        </div>
                        <h2 className="text-xl font-semibold">No saved properties yet</h2>
                        <p className="text-muted-foreground mt-2 max-w-md">
                            Start exploring campus housing and click the heart icon or "Save Property" button to keep track of places you love.
                        </p>
                        <Button asChild className="mt-6" variant="default">
                            <Link href="/">Explore Properties</Link>
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {/* We can re-use the property listings design visually if we extract it, 
                 or we can map through a stripped down version of the card here for simplicity. 
                 Since the list view in search expects `onPropertySelect`, we'll build a standalone card here or update the props.
             */}
                        {savedProperties.map((property) => (
                            <div key={property.id} className="group overflow-hidden rounded-2xl border bg-card transition-all hover:-translate-y-1 hover:shadow-lg">
                                <Link href={`/properties/${property.id}`} className="block">
                                    <div className="relative h-48 w-full bg-muted">
                                        {property.property_images?.[0] ? (
                                            <img
                                                src={property.property_images[0]}
                                                alt={property.title}
                                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center">
                                                <Home className="h-8 w-8 text-muted-foreground" />
                                            </div>
                                        )}
                                        <div className="absolute top-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-md">
                                            ${property.price_per_month}/mo
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <h3 className="line-clamp-1 font-bold text-foreground">{property.title}</h3>
                                        <p className="line-clamp-1 mt-1 text-sm text-muted-foreground">{property.address}</p>
                                        <div className="mt-3 flex items-center text-sm font-medium text-muted-foreground gap-3">
                                            <span className="flex items-center gap-1">
                                                {property.bedrooms} Beds
                                            </span>
                                            <span className="flex items-center gap-1">
                                                {property.bathrooms} Baths
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
