'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MoreVertical } from 'lucide-react'
import { useState } from 'react'
import { useRooms } from './useRooms'
import CreateRoomDialog from './CreateRoomDialog'
import InviteUserDialog from './InviteUserDialog'
import InviteStatusDialog from './InviteStatusDialog'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"

type RoomListProps = {
    onSelect: (id: string) => void
    activeRoomId: string | null
}

export default function RoomList({ onSelect, activeRoomId }: RoomListProps) {
    const { rooms, reload } = useRooms()
    const [createOpen, setCreateOpen] = useState(false)
    const [inviteRoomId, setInviteRoomId] = useState<string | null>(null)
    const [inviteOpen, setInviteOpen] = useState(false)
    const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null)

    return (
        <Card className="w-64 h-full rounded-none border-r">
            <CardContent className="p-3">
                <div className="flex justify-between mb-2">
                    <h2 className="font-semibold">Rooms</h2>
                    <Button size="sm" onClick={() => setCreateOpen(true)}>+</Button>
                </div>

                <ScrollArea className="h-[calc(100vh-60px)]">
                    {rooms.map(room => (
                        <div key={room._id} className="flex items-center">
                            <Button
                                variant={room._id === activeRoomId ? "secondary" : "ghost"}
                                className="flex-1 justify-start"
                                onClick={() => onSelect(room._id)}
                            >
                                {room.name}
                            </Button>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button size="icon" variant="ghost">
                                        <MoreVertical className="w-4 h-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => {
                                        setInviteRoomId(room._id)
                                        setInviteOpen(true)
                                    }}>
                                        Invite
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    ))}
                </ScrollArea>
            </CardContent>

            <CreateRoomDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreated={reload} />
            <InviteUserDialog
                open={inviteOpen}
                roomId={inviteRoomId}
                onClose={() => setInviteOpen(false)}
                onResult={(type, msg) => setStatus({ type, msg })}
            />
            <InviteStatusDialog status={status} onClose={() => setStatus(null)} />
        </Card>
    )
}
