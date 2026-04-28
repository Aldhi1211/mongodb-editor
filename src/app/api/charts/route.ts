import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import clientPromise from '@/lib/mongodb'

function getUser(req: Request) {
  const auth = req.headers.get('authorization')
  if (!auth) return null
  try {
    return jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET as string) as any
  } catch {
    return null
  }
}

const DB = 'workflowbuilder_core'
const COL = 'charts'

export async function GET(req: Request) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const client = await clientPromise
  const charts = await client
    .db(DB)
    .collection(COL)
    .find({ userId: user.userId })
    .sort({ updatedAt: -1 })
    .project({ nodes: 0, edges: 0 })
    .toArray()

  return NextResponse.json(charts)
}

export async function POST(req: Request) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, description } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  const client = await clientPromise
  const now = new Date()

  const result = await client.db(DB).collection(COL).insertOne({
    name: name.trim(),
    description: description?.trim() || '',
    nodes: [],
    edges: [],
    userId: user.userId,
    createdAt: now,
    updatedAt: now,
  })

  return NextResponse.json({ _id: result.insertedId })
}
