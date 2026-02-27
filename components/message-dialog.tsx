'use client'

import { User } from '@supabase/supabase-js'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

interface MessageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  propertyId: string
  landlordId: string
  propertyTitle: string
  user: User
}

export default function MessageDialog({
  open,
  onOpenChange,
  propertyId,
  landlordId,
  propertyTitle,
  user,
}: MessageDialogProps) {
  const [message, setMessage] = useState('')
  const [phone, setPhone] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleSendMessage = async () => {
    if (!message.trim()) return

    setIsLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('messages').insert({
        sender_id: user.id,
        receiver_id: landlordId,
        property_id: propertyId,
        content: message,
        phone_number: phone || null,
      })

      if (error) throw error

      setMessage('')
      setPhone('')
      onOpenChange(false)
      router.refresh() // Ensure UI knows about the new message if needed

      toast({
        title: 'Message sent!',
        description: 'The landlord will respond soon.',
      })
    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: 'Error sending message',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Message Landlord</DialogTitle>
          <DialogDescription>{propertyTitle}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone Number (Optional)</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <p className="text-muted-foreground text-xs">
              Share your phone so the landlord can contact you
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Hi, I'm interested in this property. Could you tell me more about the lease terms?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendMessage} disabled={isLoading || !message.trim()}>
              {isLoading ? 'Sending...' : 'Send'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
