import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

function getUser(req: Request) {
    const auth = req.headers.get('authorization')
    if (!auth) return null
    try {
        return jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET as string) as any
    } catch {
        return null
    }
}

export async function GET(req: Request, { params }: { params: { roomId: string } }) {
    const user = getUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const client = await clientPromise
    const db = client.db('workflowbuilder_core')

    const room = await db.collection('rooms').findOne({ _id: new ObjectId(params.roomId) })
    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 })

    const isMember = room.members.some((m: any) => m.userId === user.userId)
    if (!isMember) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    return NextResponse.json(room.members)
}
