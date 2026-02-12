import { useEffect, useState } from 'react'

export function useRooms() {
    const [rooms, setRooms] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    const loadRooms = async () => {
        try {
            setLoading(true)
            const res = await fetch('/api/rooms', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            })
            const data = await res.json()
            setRooms(Array.isArray(data) ? data : [])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadRooms()
    }, [])

    return { rooms, loading, reload: loadRooms }
}
