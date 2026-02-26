import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PropertyForm from '@/components/property-form'

interface EditPropertyPageProps {
    params: {
        id: string
    }
}

export default async function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/')
    }

    // Fetch property data
    const { data: property, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single()

    if (error || !property) {
        console.error('Error fetching property:', error)
        redirect('/landlord/dashboard')
    }

    // Ensure only the landlord who owns the property can edit it
    if (property.landlord_id !== user.id) {
        redirect('/landlord/dashboard')
    }

    return (
        <div className="mx-auto max-w-4xl p-6 md:p-10">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Edit Listing</h1>
                <p className="text-muted-foreground mt-1">Update your property details</p>
            </div>

            <PropertyForm user={user} initialData={property} propertyId={id} />
        </div>
    )
}
