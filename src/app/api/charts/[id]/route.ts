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

const DB = 'workflowbuilder_core'
const COL = 'charts'

type Params = { params: Promise<{ id: string }> }

export async function GET(req: Request, { params }: Params) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const client = await clientPromise
  const chart = await client.db(DB).collection(COL).findOne({
    _id: new ObjectId(id),
    userId: user.userId,
  })

  if (!chart) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(chart)
}

export async function PUT(req: Request, { params }: Params) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const body = await req.json()
  const allowed: Record<string, any> = {}
  if (body.name !== undefined) allowed.name = body.name
  if (body.description !== undefined) allowed.description = body.description
  if (body.nodes !== undefined) allowed.nodes = body.nodes
  if (body.edges !== undefined) allowed.edges = body.edges
  allowed.updatedAt = new Date()

  const client = await clientPromise
  const result = await client.db(DB).collection(COL).updateOne(
    { _id: new ObjectId(id), userId: user.userId },
    { $set: allowed }
  )

  if (result.matchedCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: Request, { params }: Params) {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const client = await clientPromise
  const result = await client.db(DB).collection(COL).deleteOne({
    _id: new ObjectId(id),
    userId: user.userId,
  })

  if (result.deletedCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ success: true })
}
