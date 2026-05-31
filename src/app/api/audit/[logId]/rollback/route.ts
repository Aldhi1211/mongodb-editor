import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getRoomDb } from "@/lib/roomDb";
import { EJSON } from "bson";

function getUser(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth) return null;
  try {
    return jwt.verify(auth.split(" ")[1], process.env.JWT_SECRET as string) as any;
  } catch { return null; }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ logId: string }> },
) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { logId } = await context.params;

  const client = await clientPromise;
  const coreDb = client.db("workflowbuilder_core");

  const log = await coreDb.collection("audit_logs").findOne({ _id: new ObjectId(logId) });
  if (!log) return NextResponse.json({ error: "Audit log not found" }, { status: 404 });

  if (!log.before) {
    return NextResponse.json({ error: "Cannot rollback: no before state available" }, { status: 400 });
  }

  const room = await coreDb.collection("rooms").findOne({ _id: new ObjectId(log.roomId) });
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  const me = room.members.find((m: any) => m.userId === user.userId);
  if (!me || me.role === "viewer") {
    return NextResponse.json({ error: "Forbidden: viewers cannot rollback" }, { status: 403 });
  }

  const db = await getRoomDb(log.roomId);
  const collection = db.collection(log.collection);

  // ── Bulk rollback: before is an array (deleteMany / deleteOne bulk / drop_collection) ──
  if (Array.isArray(log.before)) {
    const docs = (log.before as any[]).map((d) =>
      EJSON.deserialize(d, { relaxed: false })
    ) as any[];

    if (docs.length > 0) {
      // Remove any existing docs with the same _ids to avoid duplicate key errors
      const ids = docs.map((d) => d._id).filter(Boolean);
      if (ids.length > 0) {
        await collection.deleteMany({ _id: { $in: ids } });
      }
      await collection.insertMany(docs);
    }

    await coreDb.collection("audit_logs").insertOne({
      roomId: log.roomId,
      roomName: log.roomName,
      collection: log.collection,
      action: "rollback",
      before: log.after,
      after: log.before,
      restoredCount: docs.length,
      userId: user.userId,
      timestamp: new Date(),
      rollbackOf: logId,
    });

    return NextResponse.json({ success: true, restored: docs.length });
  }

  // ── Single-document rollback (update / delete single / insert) ──
  const beforeDoc = EJSON.deserialize(log.before, { relaxed: false }) as any;
  const { _id: rawId, ...rest } = beforeDoc;

  let docId: any;
  try {
    docId = ObjectId.isValid(log.documentId) ? new ObjectId(log.documentId) : log.documentId;
  } catch {
    docId = log.documentId;
  }

  await collection.replaceOne(
    { _id: docId },
    { _id: docId, ...rest },
    { upsert: true },
  );

  await coreDb.collection("audit_logs").insertOne({
    roomId: log.roomId,
    roomName: log.roomName,
    collection: log.collection,
    action: "rollback",
    documentId: log.documentId,
    before: log.after,
    after: log.before,
    userId: user.userId,
    timestamp: new Date(),
    rollbackOf: logId,
  });

  return NextResponse.json({ success: true });
}
