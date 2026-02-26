import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getRoomDb } from "@/lib/roomDb";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { broadcast } from "./stream/broadcaster";
import { EJSON } from "bson";

function getUser(req: Request) {
  const auth = req.headers.get("authorization");
  if (!auth) return null;
  try {
    return jwt.verify(
      auth.split(" ")[1],
      process.env.JWT_SECRET as string,
    ) as any;
  } catch {
    return null;
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ roomId: string; collectionName: string }> },
) {
  const user = getUser(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { roomId, collectionName } = await params;
  const { searchParams } = new URL(req.url);

  const limit = parseInt(searchParams.get("limit") || "50");
  const page = parseInt(searchParams.get("page") || "1");
  const skip = (page - 1) * limit;

  const rawFilter = searchParams.get("filter");

  let filter: any = {};
  if (rawFilter) {
    try {
      filter = EJSON.parse(decodeURIComponent(rawFilter), { relaxed: false });
    } catch {
      return NextResponse.json(
        { error: "Invalid filter JSON" },
        { status: 400 },
      );
    }
  }

  const db = await getRoomDb(roomId);
  const collection = db.collection(collectionName);

  const [docs, total] = await Promise.all([
    collection.find(filter).sort({ _id: -1 }).skip(skip).limit(limit).toArray(),
    collection.countDocuments(filter),
  ]);

  const ejsonDocs = docs.map((doc) => EJSON.serialize(doc, { relaxed: false }));

  return NextResponse.json({
    page,
    limit,
    total,
    data: ejsonDocs,
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ roomId: string; collectionName: string }> },
) {
  const user = getUser(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { roomId, collectionName } = await params;
  const rawPayload = await req.json();
  const payload = EJSON.deserialize(rawPayload, { relaxed: false });

  const db = await getRoomDb(roomId);
  const collection = db.collection(collectionName);

  const result = await collection.insertOne(payload);
  const inserted = { _id: result.insertedId, ...payload };

  // === AUDIT LOG ===
  const coreClient = await clientPromise;
  const coreDb = coreClient.db("workflowbuilder_core");

  // ambil nama room dari core db
  const room = await coreDb
    .collection("rooms")
    .findOne({ _id: new ObjectId(roomId) }, { projection: { name: 1 } });

  await coreDb.collection("audit_logs").insertOne({
    roomId,
    roomName: room?.name || "Unknown Room", // snapshot untuk UI
    collection: collectionName,
    action: "insert",
    documentId: result.insertedId.toString(),
    before: null,
    after: inserted,
    userId: user.userId,
    timestamp: new Date(),
  });

  // === BACKUP SNAPSHOT ===
  await coreDb.collection("backups").insertOne({
    roomId,
    collection: collectionName,
    documentId: result.insertedId.toString(),
    data: inserted,
    permanent: false,
    createdAt: new Date(),
  });

  broadcast({
    type: "insert",
    roomId,
    collection: collectionName,
    documentId: result.insertedId.toString(),
  });

  const responseDoc = EJSON.serialize(inserted, { relaxed: false });

  return NextResponse.json({
    success: true,
    data: responseDoc,
  });
}

type Params = {
  roomId: string;
  collectionName: string;
};

export async function DELETE(req: NextRequest, context: { params: Params }) {
  const user = await getUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { roomId, collectionName } = context.params;

  if (!collectionName) {
    return NextResponse.json(
      { error: "Invalid collection name" },
      { status: 400 },
    );
  }

  const db = await getRoomDb(roomId);
  const collection = db.collection(collectionName);

  // Snapshot sebelum di-drop (limit biar gak gila memory)
  const before = await collection.find({}).limit(100).toArray();

  // Drop collection
  await collection.drop();

  const coreClient = await clientPromise;
  const coreDb = coreClient.db("workflowbuilder_core");

  // Ambil nama room
  const room = await coreDb
    .collection("rooms")
    .findOne({ _id: new ObjectId(roomId) }, { projection: { name: 1 } });

  // Audit log
  await coreDb.collection("audit_logs").insertOne({
    roomId,
    roomName: room?.name || "Unknown Room",
    collection: collectionName,
    action: "drop_collection",
    beforeCount: before.length,
    beforeSample: before, // snapshot terbatas
    after: null,
    userId: user.userId,
    timestamp: new Date(),
  });

  // Backup snapshot
  await coreDb.collection("backups").insertOne({
    roomId,
    collection: collectionName,
    type: "collection_drop",
    data: before,
    permanent: false,
    createdAt: new Date(),
  });

  broadcast({
    type: "drop_collection",
    roomId,
    collection: collectionName,
  });

  return NextResponse.json({ success: true });
}
