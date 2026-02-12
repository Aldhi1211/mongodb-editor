import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import clientPromise from '../../../lib/mongodb'
import crypto from 'crypto'
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

function encrypt(text: string) {
    const iv = crypto.randomBytes(16)
    const key = Buffer.from(process.env.ROOM_SECRET as string, 'hex')
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    return iv.toString('hex') + ':' + encrypted
}

export async function POST(req: Request) {
    const user = getUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { name, mongoUri } = await req.json()
    if (!name || !mongoUri)
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })

    const client = await clientPromise
    const db = client.db('workflowbuilder_core')

    const encryptedUri = encrypt(mongoUri)

    const room = {
        name,
        mongoUri: encryptedUri,
        members: [{ userId: user.userId, role: 'owner' }],
        createdAt: new Date()
    }

    await db.collection('rooms').insertOne(room)
    return NextResponse.json({ success: true })
}

export async function GET(req: Request) {
    const user = getUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const client = await clientPromise
    const db = client.db('workflowbuilder_core')

    const rooms = await db
        .collection('rooms')
        .find({ 'members.userId': user.userId })
        .project({ mongoUri: 0 })
        .toArray()

    return NextResponse.json(rooms)
}
