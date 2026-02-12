import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { ObjectId } from 'mongodb'
import { getRoomDb } from '@/lib/roomDb'
import clientPromise from '@/lib/mongodb'
import { broadcast } from '../stream/broadcaster'
import { EJSON } from 'bson'

function getUser(req: Request) {
    const auth = req.headers.get('authorization')
    if (!auth) return null
    try {
        return jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET as string) as any
    } catch {
        return null
    }
}

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ roomId: string; collectionName: string; documentId: string }> }
) {
    const user = getUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { roomId, collectionName, documentId } = await params
    const rawPayload = await req.json()
    const payload = EJSON.deserialize(rawPayload, { relaxed: false })
    const { _id: _, ...safePayload } = payload

    // if (!ObjectId.isValid(documentId)) {
    //     return NextResponse.json({ error: 'Invalid document id' }, { status: 400 })
    // }

    const db = await getRoomDb(roomId)
    let _id: any

    if (ObjectId.isValid(documentId)) {
        _id = new ObjectId(documentId)
    } else {
        _id = documentId
    }

    const collection = db.collection(collectionName)
    const before = await collection.findOne({ _id })

    if (!before) return NextResponse.json({ error: 'Document not found' }, { status: 404 })

    await collection.updateOne({ _id }, { $set: safePayload })
    const after = await collection.findOne({ _id })

    const coreClient = await clientPromise
    const coreDb = coreClient.db('workflowbuilder_core')

    // ambil nama room dari core db
    const room = await coreDb.collection('rooms').findOne(
        { _id: new ObjectId(roomId) },
        { projection: { name: 1 } }
    )

    // Audit
    await coreDb.collection('audit_logs').insertOne({
        roomId,
        roomName: room?.name || 'Unknown Room',   // snapshot untuk UI
        collection: collectionName,
        action: 'update',
        documentId,
        before,
        after,
        userId: user.userId,
        timestamp: new Date()
    })

    // Backup old version
    await coreDb.collection('backups').insertOne({
        roomId,
        collection: collectionName,
        documentId,
        data: before,
        permanent: false,
        createdAt: new Date()
    })

    broadcast({
        type: 'update',
        roomId,
        collection: collectionName,
        documentId
    })

    const responseDoc = after ? EJSON.serialize(after, { relaxed: false }) : after
    return NextResponse.json({ success: true, data: responseDoc })
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ roomId: string; collectionName: string; documentId: string }> }
) {
    const user = getUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { roomId, collectionName, documentId } = await params
    const db = await getRoomDb(roomId)
    const collection = db.collection(collectionName)

    const _id = new ObjectId(documentId)
    const before = await collection.findOne({ _id })
    if (!before) return NextResponse.json({ error: 'Document not found' }, { status: 404 })

    await collection.deleteOne({ _id })

    const coreClient = await clientPromise
    const coreDb = coreClient.db('workflowbuilder_core')

    // ambil nama room dari core db
    const room = await coreDb.collection('rooms').findOne(
        { _id: new ObjectId(roomId) },
        { projection: { name: 1 } }
    )

    // Audit
    await coreDb.collection('audit_logs').insertOne({
        roomId,
        roomName: room?.name || 'Unknown Room',   // snapshot untuk UI
        collection: collectionName,
        action: 'delete',
        documentId,
        before,
        after: null,
        userId: user.userId,
        timestamp: new Date()
    })

    // Backup snapshot
    await coreDb.collection('backups').insertOne({
        roomId,
        collection: collectionName,
        documentId,
        data: before,
        permanent: false,
        createdAt: new Date()
    })

    broadcast({
        type: 'update',
        roomId,
        collection: collectionName,
        documentId
    })

    return NextResponse.json({ success: true })
}

