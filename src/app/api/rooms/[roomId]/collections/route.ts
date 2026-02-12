import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { getRoomDb } from '@/lib/roomDb'

function getUser(req: Request) {
    const auth = req.headers.get('authorization')
    if (!auth) return null
    try {
        return jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET as string) as any
    } catch {
        return null
    }
}

export async function GET(
    req: Request,
    { params }: { params: Promise<{ roomId: string }> }
) {
    const user = getUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { roomId } = await params   // 🔥 INI KUNCINYA

    const db = await getRoomDb(roomId)
    const collections = await db.listCollections().toArray()

    return NextResponse.json(
        collections.map(c => ({
            name: c.name,
            type: c.type
        }))
    )
}
