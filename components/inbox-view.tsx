'use client'

import { User } from '@supabase/supabase-js'
import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import Image from 'next/image'
import { Building, X } from 'lucide-react'

interface Profile {
  id: string
  full_name: string | null
  email: string
  profile_image_url: string | null
}

interface Property {
  id: string
  title: string
  property_images: string[] | null
}

interface Message {
  id: string
  content: string
  created_at: string
  sender_id: string
  receiver_id: string
  property_id: string | null
  read: boolean
  properties: Property | null
  sender: Profile | null
  receiver: Profile | null
}

interface Conversation {
  id: string // derived, e.g., `${property_id}_${other_user_id}`
  property: Property | null
  otherUser: Profile | null
  messages: Message[]
  lastMessageAt: string
}

export default function InboxView({
  initialMessages,
  currentUser,
  isOverlay = false,
  onClose,
}: {
  initialMessages: Message[]
  currentUser: User
  isOverlay?: boolean
  onClose?: () => void
}) {
  const { toast } = useToast()

  // Group messages into conversations
  const conversationsMap = new Map<string, Conversation>()

  initialMessages.forEach((msg) => {
    const isSender = msg.sender_id === currentUser.id
    const otherUser = isSender ? msg.receiver : msg.sender
    if (!otherUser) return

    const propertyId = msg.property_id || 'no-property'
    const conversationId = `${propertyId}_${otherUser.id}`

    if (!conversationsMap.has(conversationId)) {
      conversationsMap.set(conversationId, {
        id: conversationId,
        property: msg.properties || null,
        otherUser: otherUser,
        messages: [],
        lastMessageAt: msg.created_at,
      })
    }

    const conv = conversationsMap.get(conversationId)!
    conv.messages.push(msg)
    if (new Date(msg.created_at) > new Date(conv.lastMessageAt)) {
      conv.lastMessageAt = msg.created_at
    }
  })

  const conversations = Array.from(conversationsMap.values()).sort(
    (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
  )

  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    !isOverlay && conversations.length > 0 ? conversations[0].id : null
  )
  const [mobileView, setMobileView] = useState<'list' | 'chat'>(
    !isOverlay && conversations.length > 0 ? 'chat' : 'list'
  )
  const [replyText, setReplyText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [localMessages, setLocalMessages] = useState<Message[]>(initialMessages)

  const activeConversationInfo = conversations.find((c) => c.id === activeConversationId)

  const activeMessages = localMessages
    .filter((msg) => {
      if (!activeConversationInfo) return false
      const isSender = msg.sender_id === currentUser.id
      const otherUser = isSender ? msg.receiver : msg.sender
      const propId = msg.property_id || 'no-property'
      return `${propId}_${otherUser?.id}` === activeConversationId
    })
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  const handleSendMessage = async () => {
    if (!replyText.trim() || !activeConversationInfo) return

    setIsSending(true)
    const receiverId = activeConversationInfo.otherUser?.id
    const propertyId = activeConversationInfo.property?.id

    if (!receiverId) return

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: currentUser.id,
          receiver_id: receiverId,
          property_id: propertyId || null,
          content: replyText,
        })
        .select(`
          id, content, created_at, sender_id, receiver_id, property_id, read,
          properties (id, title, property_images),
          sender:profiles!messages_sender_id_fkey (id, full_name, email, profile_image_url),
          receiver:profiles!messages_receiver_id_fkey (id, full_name, email, profile_image_url)
        `)
        .single()

      if (error) throw error
      setLocalMessages((prev) => [...prev, data as any])
      setReplyText('')
    } catch (error) {
      console.error('Failed to send reply:', error)
      toast({
        title: 'Failed to send message',
        description: 'Please try again later.',
        variant: 'destructive',
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id)
    setMobileView('chat')
  }

  const containerClasses = isOverlay
    ? "flex h-full flex-col overflow-hidden bg-background"
    : "mx-auto max-w-6xl p-4 md:p-8"

  const gridClasses = isOverlay
    ? "flex flex-1 overflow-hidden"
    : "grid h-[700px] gap-6 md:grid-cols-3"

  return (
    <div className={containerClasses}>
      {!isOverlay && <h1 className="mb-8 text-3xl font-bold tracking-tight">Messages</h1>}

      <div className={gridClasses}>
        {/* Sidebar / Conversation List */}
        <Card className={`hide-scrollbar flex flex-col overflow-hidden border-none shadow-none md:border md:shadow-sm ${isOverlay ? 'w-full' : 'md:col-span-1'
          } ${mobileView === 'chat' && !isOverlay ? 'hidden md:flex' : ''} ${mobileView === 'chat' && isOverlay ? 'hidden' : 'flex'
          }`}>
          {!isOverlay && <div className="bg-muted/30 shrink-0 border-b p-4 font-semibold">Conversations</div>}
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="text-muted-foreground p-8 text-center text-sm">No messages yet.</div>
            ) : (
              conversations.map((conv) => {
                const isActive = activeConversationId === conv.id
                const otherName = conv.otherUser?.full_name || conv.otherUser?.email?.split('@')[0] || 'Unknown User'
                const propThumb = conv.property?.property_images?.[0]
                const latestMsg = conv.messages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]

                return (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv.id)}
                    className={`flex w-full items-center gap-3 border-b p-4 text-left transition-colors ${isActive ? 'bg-amber-50 dark:bg-amber-950/20' : 'hover:bg-muted/50'
                      }`}
                  >
                    <div className="bg-muted relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg">
                      {propThumb ? (
                        <Image src={propThumb} alt="Property" fill className="object-cover" />
                      ) : (
                        <Building className="text-muted-foreground h-5 w-5" />
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <p className="truncate text-sm font-semibold">{otherName}</p>
                      <p className="text-muted-foreground truncate text-xs font-medium">
                        {conv.property?.title || 'No Property'}
                      </p>
                      <p className="text-muted-foreground mt-1 truncate text-xs">
                        {latestMsg?.content}
                      </p>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </Card>

        {/* Main Chat Area */}
        <Card className={`flex flex-col overflow-hidden border-none shadow-none md:border md:shadow-sm ${isOverlay ? 'w-full' : 'md:col-span-2'
          } ${mobileView === 'list' && !isOverlay ? 'hidden md:flex' : ''} ${mobileView === 'list' && isOverlay ? 'hidden' : 'flex'
          }`}>
          {activeConversationInfo ? (
            <>
              {/* Chat Header */}
              <div className="bg-muted/30 flex shrink-0 items-center gap-3 border-b p-4">
                {(isOverlay || !isOverlay) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={() => setMobileView('list')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                  </Button>
                )}
                <div className="bg-muted relative h-9 w-9 shrink-0 overflow-hidden rounded-full border">
                  {activeConversationInfo.otherUser?.profile_image_url ? (
                    <Image src={activeConversationInfo.otherUser.profile_image_url} alt="User" fill className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-amber-100 text-sm font-bold text-amber-700">
                      {(activeConversationInfo.otherUser?.full_name || activeConversationInfo.otherUser?.email || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="overflow-hidden">
                  <h2 className="truncate text-sm font-semibold">
                    {activeConversationInfo.otherUser?.full_name || activeConversationInfo.otherUser?.email?.split('@')[0] || 'Unknown User'}
                  </h2>
                  <p className="text-muted-foreground truncate text-[10px]">
                    {activeConversationInfo.property?.title || 'General Inquiry'}
                  </p>
                </div>
                {isOverlay && onClose && (
                  <Button variant="ghost" size="icon" className="ml-auto" onClick={onClose}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Chat Messages */}
              <div className="flex-1 space-y-4 overflow-y-auto p-4 scroll-smooth">
                {activeMessages.map((msg) => {
                  const isMe = msg.sender_id === currentUser.id
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl px-3 py-1.5 text-sm ${isMe ? 'rounded-br-none bg-amber-500 text-white' : 'bg-muted rounded-bl-none'
                        }`}>
                        {msg.content}
                      </div>
                      <span className="text-muted-foreground mx-1 mt-1 text-[9px]">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Chat Input */}
              <div className="bg-background flex shrink-0 gap-2 border-t p-3">
                <Textarea
                  placeholder="Message..."
                  className="min-h-[40px] flex-1 resize-none bg-muted/30 border-none focus-visible:ring-0"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={isSending || !replyText.trim()}
                  size="sm"
                  variant="ghost"
                  className="mt-auto text-amber-600 hover:text-amber-700 hover:bg-transparent px-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
                </Button>
              </div>
            </>
          ) : (
            <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center p-8 text-center text-sm">
              <div className="mb-4 rounded-full bg-muted p-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/50"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
              </div>
              Select a conversation to start chatting
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
