import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import clientPromise from '../../../../lib/mongodb'
import { normalizeEmail, emailMatch } from '@/lib/email'

export async function POST(req: Request) {
    const { email: rawEmail, password } = await req.json()

    if (!rawEmail || !password) {
        return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    // Normalize so logins/OAuth/invite all resolve to one account regardless of case.
    const email = normalizeEmail(rawEmail)

    const client = await clientPromise
    const db = client.db('workflowbuilder_auth')

    // Case-insensitive check so we don't create a duplicate of an existing mixed-case row.
    const existing = await db.collection('users').findOne({ email: emailMatch(email) })
    if (existing) {
        return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    const hashed = await bcrypt.hash(password, 10)

    const user = {
        email,
        password: hashed,
        role: 'owner', // sementara, nanti kita buat logic role lebih rapi
        createdAt: new Date()
    }

    await db.collection('users').insertOne(user)

    return NextResponse.json({ success: true })
}
