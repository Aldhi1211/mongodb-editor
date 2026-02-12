'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import RoomList from '@/components/rooms/RoomList'
import CollectionList from '@/components/CollectionList'
import DocumentTable from '@/components/documents/DocumentTable'
import AuditViewer from '@/components/AuditViewer'
import { LogOut } from 'lucide-react'
import { jwtDecode } from 'jwt-decode'

export default function Home() {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [roomId, setRoomId] = useState<string | null>(null)
  const [collection, setCollection] = useState<string | null>(null)
  const [tab, setTab] = useState<'data' | 'audit'>('data')

  useEffect(() => {
    const t = localStorage.getItem('token')
    if (!t) {
      router.replace('/login')
      return
    }

    try {
      const decoded: any = jwtDecode(t)
      if (decoded.exp * 1000 < Date.now()) {
        localStorage.removeItem('token')
        router.replace('/login')
      } else {
        setToken(t)
      }
    } catch {
      localStorage.removeItem('token')
      router.replace('/login')
    }
  }, [])

  useEffect(() => {
    if (tab === 'data') {
      setRoomId(null)
      setCollection(null)
    }
  }, [tab])

  useEffect(() => {
    document.body.style.pointerEvents = "auto"
  }, [])

  if (!token) return null

  const handleLogout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setRoomId(null)
    setCollection(null)
    router.replace('/login')
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="flex items-center justify-between border-b p-2">
        <div className="flex gap-2">
          <Button
            variant={tab === 'data' ? 'default' : 'ghost'}
            onClick={() => setTab('data')}
          >
            Data
          </Button>
          <Button
            variant={tab === 'audit' ? 'default' : 'ghost'}
            onClick={() => setTab('audit')}
          >
            Audit
          </Button>
        </div>

        <Button variant="destructive" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-1" />
          Logout
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {tab === 'data' && (
          <>
            <RoomList activeRoomId={roomId} onSelect={setRoomId} />
            {roomId && (
              <CollectionList
                roomId={roomId}
                activeCollection={collection}
                onSelect={setCollection}
              />
            )}
            {roomId && collection && (
              <DocumentTable roomId={roomId} collection={collection} />
            )}
          </>
        )}

        {tab === 'audit' && (
          <div className="flex-1 overflow-auto">
            <AuditViewer />
          </div>
        )}
      </div>
    </div>
  )
}
