import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import clientPromise from '../../../../lib/mongodb'

export async function POST(req: Request) {
    const { email, password } = await req.json()

    const client = await clientPromise
    const db = client.db('workflowbuilder_auth')

    const user = await db.collection('users').findOne({ email })
    if (!user) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const token = jwt.sign(
        { userId: user._id.toString(), role: user.role },
        process.env.JWT_SECRET as string,
        { expiresIn: '8h' }
    )

    return NextResponse.json({ token })
}
