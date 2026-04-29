import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { getRoomDb } from '@/lib/roomDb'
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

export async function GET(
    req: Request,
    { params }: { params: Promise<{ roomId: string }> }
) {
    const user = getUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { roomId } = await params

    let db
    try {
        db = await getRoomDb(roomId)
    } catch (err: any) {
        return NextResponse.json(
            { error: `Cannot connect to database: ${err.message}` },
            { status: 500 }
        )
    }

    try {
        const raw = await db.listCollections().toArray()
        return NextResponse.json(
            raw.map(c => ({ name: c.name, type: c.type || 'collection' }))
        )
    } catch {
        try {
            const dbName = db.databaseName
            const namespaces = await db.collection('system.namespaces').find({}).toArray()
            const collections = namespaces
                .filter((ns: any) => !ns.name.includes('$') && ns.name.startsWith(dbName + '.'))
                .map((ns: any) => ({
                    name: ns.name.slice(dbName.length + 1),
                    type: 'collection',
                }))
            return NextResponse.json(collections)
        } catch (fallbackErr: any) {
            return NextResponse.json(
                { error: `Cannot list collections: ${fallbackErr.message}` },
                { status: 500 }
            )
        }
    }
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ roomId: string }> }
) {
    const user = getUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { roomId } = await params
    const { name } = await req.json()
    if (!name?.trim()) return NextResponse.json({ error: 'Collection name is required' }, { status: 400 })

    const db = await getRoomDb(roomId)

    const existing = await db.listCollections({ name }).toArray()
    if (existing.length > 0) return NextResponse.json({ error: `Collection "${name}" already exists` }, { status: 409 })

    await db.createCollection(name)

    const coreClient = await clientPromise
    const coreDb = coreClient.db('workflowbuilder_core')
    const room = await coreDb.collection('rooms').findOne({ _id: new ObjectId(roomId) }, { projection: { name: 1 } })

    await coreDb.collection('audit_logs').insertOne({
        roomId,
        roomName: room?.name || 'Unknown Room',
        collection: name,
        action: 'create_collection',
        before: null,
        after: { name },
        userId: user.userId,
        timestamp: new Date(),
    })

    return NextResponse.json({ success: true })
}
