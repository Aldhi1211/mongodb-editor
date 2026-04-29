import { MongoClient } from 'mongodb'
import crypto from 'crypto'
import clientPromise from './mongodb'
import { ObjectId } from 'mongodb'

// Only cache SUCCESSFUL connections
const roomClients: Record<string, MongoClient> = {}

function decrypt(encrypted: string) {
    const [ivHex, data] = encrypted.split(':')
    const iv = Buffer.from(ivHex, 'hex')
    const key = Buffer.from(process.env.ROOM_SECRET as string, 'hex')

    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
    let decrypted = decipher.update(data, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
}

export async function getRoomDb(roomId: string) {
    const coreClient = await clientPromise
    const coreDb = coreClient.db('workflowbuilder_core')

    const room = await coreDb.collection('rooms').findOne({ _id: new ObjectId(roomId) })
    if (!room) throw new Error('Room not found')

    // Return cached client if it's still alive
    if (roomClients[roomId]) {
        try {
            await roomClients[roomId].db().command({ ping: 1 })
            return roomClients[roomId].db()
        } catch {
            // Cached connection is dead, remove it and reconnect
            delete roomClients[roomId]
        }
    }

    const uri = decrypt(room.mongoUri)
    const client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 8000,
        connectTimeoutMS: 8000,
        socketTimeoutMS: 10000,
    })

    await client.connect()

    // Only cache after successful connect
    roomClients[roomId] = client
    return client.db()
}
