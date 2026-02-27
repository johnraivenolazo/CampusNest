'use client'

import { useState, useEffect, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import InboxView from '@/components/inbox-view'
import { Button } from '@/components/ui/button'
import { MessageSquare, X, Minus, Maximize2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function MessagingOverlay({ user }: { user: User | null }) {
    const [isOpen, setIsOpen] = useState(false)
    const [isMinimized, setIsMinimized] = useState(false)
    const [messages, setMessages] = useState<any[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [loading, setLoading] = useState(false)
    const fetchMessages = useCallback(async () => {
        if (!user) return
        try {
            const supabase = createClient()
            const { data, error } = await supabase
                .from('messages')
                .select(`
          id, content, created_at, sender_id, receiver_id, property_id, read,
          properties (id, title, property_images),
          sender:profiles!messages_sender_id_fkey (id, full_name, email, profile_image_url),
          receiver:profiles!messages_receiver_id_fkey (id, full_name, email, profile_image_url)
        `)
                .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
                .order('created_at', { ascending: false })

            if (error) throw error
            setMessages(data || [])

            // Calculate unread
            const unread = (data || []).filter(m => !m.read && m.receiver_id === user.id).length
            setUnreadCount(unread)
        } catch (err) {
            console.error('Error fetching overlay messages:', err)
        } finally {
            setLoading(false)
        }
    }, [user])

    useEffect(() => {
        if (!user) return
        fetchMessages()

        // Real-time subscription
        const supabase = createClient()
        const channel = supabase
            .channel('schema-db-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'messages',
                    filter: `receiver_id=eq.${user.id}`,
                },
                () => {
                    fetchMessages() // Refresh on any new message for us
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'messages',
                    filter: `sender_id=eq.${user.id}`,
                },
                () => {
                    fetchMessages() // Refresh on our own sent messages too
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [user, fetchMessages])

    // Listen for toggle events from the header
    useEffect(() => {
        const handleToggle = () => {
            setIsOpen(prev => !prev)
            setIsMinimized(false)
        }
        window.addEventListener('toggle-messaging', handleToggle)
        return () => window.removeEventListener('toggle-messaging', handleToggle)
    }, [])

    if (!user) return null

    return (
        <div className="fixed bottom-0 right-0 z-100 flex flex-col items-end p-4 pointer-events-none">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ y: 20, opacity: 0, scale: 0.95 }}
                        animate={{
                            y: 0,
                            opacity: 1,
                            scale: 1,
                            height: isMinimized ? '48px' : 'min(600px, 80vh)',
                            width: isMinimized ? '280px' : 'min(400px, 95vw)',
                        }}
                        exit={{ y: 20, opacity: 0, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="pointer-events-auto mb-4 flex flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl"
                    >
                        {/* Overlay Header */}
                        <div className={`bg-amber-500 flex shrink-0 items-center justify-between px-4 py-3 text-white dark:text-amber-950 ${isMinimized ? 'h-full' : ''}`}>
                            <div className="flex items-center gap-2 font-bold">
                                <MessageSquare className="h-4 w-4" />
                                <span className="text-sm">Messages</span>
                                {unreadCount > 0 && (
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-black text-amber-600 dark:bg-amber-950 dark:text-amber-100">
                                        {unreadCount}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 hover:bg-white/20 text-current"
                                    onClick={() => setIsMinimized(!isMinimized)}
                                >
                                    {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 hover:bg-white/20 text-current"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Chat Content */}
                        {!isMinimized && (
                            <div className="flex-1 overflow-hidden">
                                <InboxView
                                    initialMessages={messages}
                                    currentUser={user}
                                    isOverlay={true}
                                    onClose={() => setIsOpen(false)}
                                />
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Toggle Button (if closed) */}
            {!isOpen && (
                <Button
                    onClick={() => setIsOpen(true)}
                    className="pointer-events-auto h-14 w-14 rounded-full bg-amber-500 shadow-xl hover:bg-amber-600 group relative"
                >
                    <MessageSquare className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-red-500 text-[10px] font-bold text-white shadow-sm">
                            {unreadCount}
                        </span>
                    )}
                </Button>
            )}
        </div>
    )
}
