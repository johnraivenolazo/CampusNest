'use client'

import { User } from '@supabase/supabase-js'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Message {
  id: string
  sender_id: string
  receiver_id: string
  property_id: string
  content: string
  phone_number: string | null
  created_at: string
  sender?: {
    email: string
    user_metadata?: {
      full_name?: string
    }
  }
}

interface Property {
  id: string
  title: string
}

interface PropertyMessagesViewProps {
  property: Property
  messages: Message[]
  user: User
}

export default function PropertyMessagesView({
  property,
  messages,
  user,
}: PropertyMessagesViewProps) {
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(
    messages.length > 0 ? messages[0] : null
  )
  const [replyText, setReplyText] = useState('')
  const [isReplying, setIsReplying] = useState(false)

  const handleReply = async () => {
    if (!selectedMessage || !replyText.trim()) return

    setIsReplying(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('messages').insert({
        sender_id: user.id,
        receiver_id: selectedMessage.sender_id,
        property_id: property.id,
        content: replyText,
        phone_number: null,
      })

      if (error) throw error

      setReplyText('')
      alert('Reply sent!')
      // In production, we would refresh the messages list
    } catch (error) {
      console.error('Error sending reply:', error)
      alert('Failed to send reply')
    } finally {
      setIsReplying(false)
    }
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-6xl p-6 md:p-10">
        <div className="mb-8 flex items-center gap-4">
          <Link href="/landlord/dashboard" className="text-primary hover:underline">
            Back to Dashboard
          </Link>
          <h1 className="flex-1 text-2xl font-bold">Messages: {property.title}</h1>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Messages List */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Inquiries</CardTitle>
              </CardHeader>
              <CardContent>
                {messages.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No inquiries yet</p>
                ) : (
                  <div className="space-y-2">
                    {messages.map((message) => (
                      <button
                        key={message.id}
                        onClick={() => setSelectedMessage(message)}
                        className={`w-full rounded-lg border p-3 text-left transition-colors ${
                          selectedMessage?.id === message.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:bg-muted/50'
                        }`}
                      >
                        <p className="line-clamp-1 text-sm font-medium">
                          {message.sender?.user_metadata?.full_name || 'Anonymous'}
                        </p>
                        <p className="text-muted-foreground line-clamp-1 text-xs">
                          {message.content}
                        </p>
                        <p className="text-muted-foreground mt-1 text-xs">
                          {new Date(message.created_at).toLocaleDateString()}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Message Detail */}
          <div className="md:col-span-2">
            {selectedMessage ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {selectedMessage.sender?.user_metadata?.full_name || 'Inquiry from Student'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Message Content */}
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-muted-foreground mb-2 text-sm">Original Message:</p>
                    <p className="text-foreground">{selectedMessage.content}</p>
                    <p className="text-muted-foreground mt-4 text-xs">
                      Sent on {new Date(selectedMessage.created_at).toLocaleString()}
                    </p>
                  </div>

                  {/* Contact Info */}
                  <div>
                    <h3 className="mb-2 font-semibold">Contact Information</h3>
                    <div className="space-y-1 text-sm">
                      <p>
                        Email: <span className="font-medium">{selectedMessage.sender?.email}</span>
                      </p>
                      {selectedMessage.phone_number && (
                        <p>
                          Phone: <span className="font-medium">{selectedMessage.phone_number}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Reply Section */}
                  <div className="border-border border-t pt-6">
                    <div className="grid gap-2">
                      <Label htmlFor="reply">Send a Reply</Label>
                      <Textarea
                        id="reply"
                        placeholder="Reply to this inquiry..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        rows={4}
                      />
                    </div>
                    <Button
                      onClick={handleReply}
                      disabled={isReplying || !replyText.trim()}
                      className="mt-4"
                    >
                      {isReplying ? 'Sending...' : 'Send Reply'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Select a message to view details</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
