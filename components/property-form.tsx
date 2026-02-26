'use client'

import { User } from '@supabase/supabase-js'
import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import LocationPicker from '@/components/location-picker'
import Image from 'next/image'
import { X, UploadCloud } from 'lucide-react'

interface PropertyFormProps {
  user: User
}

export default function PropertyForm({ user }: PropertyFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    location: '',
    latitude: '',
    longitude: '',
    bedrooms: '',
    bathrooms: '',
    furnished: false,
    room_type: 'single',
    amenities: '',
    rules: '',
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files)

      // Limit to max 5 images for demo purposes
      if (selectedImages.length + filesArray.length > 5) {
        alert('You can only upload up to 5 images max.')
        return
      }

      setSelectedImages((prev) => [...prev, ...filesArray])

      const newPreviews = filesArray.map((file) => URL.createObjectURL(file))
      setImagePreviews((prev) => [...prev, ...newPreviews])
    }
  }

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index))

    // Revoke object URL to prevent memory leaks
    URL.revokeObjectURL(imagePreviews[index])
    setImagePreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = createClient()

      const amenitiesList = formData.amenities
        .split(',')
        .map((a) => a.trim())
        .filter((a) => a)
      const rulesList = formData.rules
        .split(',')
        .map((r) => r.trim())
        .filter((r) => r)

      // Upload images to Supabase Storage one by one
      const imageUrls: string[] = []
      if (selectedImages.length > 0) {
        for (const file of selectedImages) {
          const fileExt = file.name.split('.').pop()
          const fileName = `${uuidv4()}.${fileExt}`
          const filePath = `${user.id}/${fileName}`

          const { error: uploadError } = await supabase.storage
            .from('property-images')
            .upload(filePath, file)

          if (uploadError) {
            console.error('Error uploading image:', uploadError)
            alert('Failed to upload one or more images. Check console.')
            throw uploadError
          }

          const { data: publicUrlData } = supabase.storage
            .from('property-images')
            .getPublicUrl(filePath)

          imageUrls.push(publicUrlData.publicUrl)
        }
      }

      const { error } = await supabase
        .from('properties')
        .insert({
          landlord_id: user.id,
          title: formData.title,
          description: formData.description,
          price_per_month: parseInt(formData.price),
          address: formData.location,
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          bedrooms: parseInt(formData.bedrooms),
          bathrooms: parseInt(formData.bathrooms),
          furnished: formData.furnished,
          room_type: formData.room_type,
          amenities: amenitiesList,
          rules: rulesList,
          status: 'available',
          property_images: imageUrls,
        })
        .select()

      if (error) {
        console.error('Supabase Error:', error)
        throw error
      }

      router.push('/landlord/dashboard')
      router.refresh()
    } catch (err: unknown) {
      console.error('Error creating property:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      alert(`Failed to create property: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Property Title</Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g., Cozy 2BR Near Campus"
                required
                value={formData.title}
                onChange={handleChange}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe your property..."
                required
                value={formData.description}
                onChange={handleChange}
                rows={4}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="price">Monthly Price ($)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                placeholder="1200"
                required
                value={formData.price}
                onChange={handleChange}
              />
            </div>
          </CardContent>
        </Card>

        {/* Photos */}
        <Card>
          <CardHeader>
            <CardTitle>Photos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="photos" className="sr-only">
                Upload Photos
              </Label>
              <div className="flex w-full items-center justify-center">
                <label
                  htmlFor="photos"
                  className="hover:bg-muted/50 border-border flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <UploadCloud className="text-muted-foreground mb-2 h-8 w-8" />
                    <p className="text-foreground mb-1 text-sm font-semibold">
                      Click to upload images
                    </p>
                    <p className="text-muted-foreground text-xs">PNG, JPG, WEBP (Max 5 images)</p>
                  </div>
                  <input
                    id="photos"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    disabled={isLoading}
                  />
                </label>
              </div>
            </div>

            {/* Previews */}
            {imagePreviews.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
                {imagePreviews.map((preview, index) => (
                  <div
                    key={preview}
                    className="border-border group relative aspect-square overflow-hidden rounded-md border"
                  >
                    <Image src={preview} alt={`Preview ${index}`} fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/80"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Location — map picker replaces raw lat/lng inputs */}
        <Card>
          <CardHeader>
            <CardTitle>Property Location</CardTitle>
          </CardHeader>
          <CardContent>
            <LocationPicker
              address={formData.location}
              latitude={formData.latitude}
              longitude={formData.longitude}
              onAddressChange={(addr) => setFormData((prev) => ({ ...prev, location: addr }))}
              onCoordsChange={(lat, lng) =>
                setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }))
              }
            />
          </CardContent>
        </Card>

        {/* Property Details */}
        <Card>
          <CardHeader>
            <CardTitle>Property Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="bedrooms">Bedrooms</Label>
                <Input
                  id="bedrooms"
                  name="bedrooms"
                  type="number"
                  placeholder="2"
                  required
                  value={formData.bedrooms}
                  onChange={handleChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bathrooms">Bathrooms</Label>
                <Input
                  id="bathrooms"
                  name="bathrooms"
                  type="number"
                  placeholder="1"
                  required
                  value={formData.bathrooms}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="room_type">Room Type</Label>
              <select
                id="room_type"
                name="room_type"
                value={formData.room_type}
                onChange={handleChange}
                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="studio">Studio</option>
                <option value="single">Single Room</option>
                <option value="double">Double Room</option>
                <option value="apartment">Full Apartment</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="furnished"
                name="furnished"
                type="checkbox"
                checked={formData.furnished}
                onChange={handleChange}
                className="h-4 w-4"
              />
              <Label htmlFor="furnished" className="cursor-pointer">
                Furnished
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Amenities & Rules */}
        <Card>
          <CardHeader>
            <CardTitle>Amenities & Rules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="amenities">Amenities (comma-separated)</Label>
              <Textarea
                id="amenities"
                name="amenities"
                placeholder="WiFi, Kitchen, Washing machine, Air conditioning"
                value={formData.amenities}
                onChange={handleChange}
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="rules">House Rules (comma-separated)</Label>
              <Textarea
                id="rules"
                name="rules"
                placeholder="No smoking, No pets, Quiet hours 10pm-8am, Rent due on 1st"
                value={formData.rules}
                onChange={handleChange}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" asChild>
            <a href="/landlord/dashboard">Cancel</a>
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Listing'}
          </Button>
        </div>
      </div>
    </form>
  )
}
