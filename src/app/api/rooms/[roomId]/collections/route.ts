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

    let db
    try {
        db = await getRoomDb(roomId)
    } catch (err: any) {
        return NextResponse.json(
            { error: `Cannot connect to database: ${err.message}` },
            { status: 500 }
        )
    }

    // Try modern listCollections first (MongoDB 3.0+),
    // fall back to system.namespaces for older versions (< 3.0)
    try {
        const raw = await db.listCollections().toArray()
        return NextResponse.json(
            raw.map(c => ({ name: c.name, type: c.type || 'collection' }))
        )
    } catch {
        // Fallback: query system.namespaces (MongoDB 2.x)
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
