import { MongoClient } from 'mongodb'
import crypto from 'crypto'
import clientPromise from './mongodb'

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

    const room = await coreDb.collection('rooms').findOne({ _id: new (require('mongodb').ObjectId)(roomId) })
    if (!room) throw new Error('Room not found')

    if (roomClients[roomId]) {
        return roomClients[roomId].db()
    }

    const uri = decrypt(room.mongoUri)
    const client = new MongoClient(uri)
    await client.connect()

    roomClients[roomId] = client
    return client.db()
}
