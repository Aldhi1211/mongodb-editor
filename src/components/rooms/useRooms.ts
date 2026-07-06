import { useEffect, useState } from 'react'

export function useRooms() {
    const [rooms, setRooms] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    // `loading` starts false before the first fetch kicks off, so consumers that
    // must wait for room data (redirects, invalid-room checks) use `loaded`.
    const [loaded, setLoaded] = useState(false)

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
            setLoaded(true)
        }
    }

    useEffect(() => {
        loadRooms()
    }, [])

    return { rooms, loading, loaded, reload: loadRooms }
}
