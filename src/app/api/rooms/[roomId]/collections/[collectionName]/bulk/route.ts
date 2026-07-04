import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getRoomDb } from "@/lib/roomDb";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { broadcast } from "../stream/broadcaster";
import { EJSON } from "bson";
import { assertRoomMember, RoomAccessError } from "@/lib/roomAccess";

function getUser(req: Request) {
  const auth = req.headers.get("authorization");
  if (!auth) return null;
  try {
    return jwt.verify(auth.split(" ")[1], process.env.JWT_SECRET as string) as any;
  } catch {
    return null;
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ roomId: string; collectionName: string }> },
) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { roomId, collectionName } = await params;

  try {
    await assertRoomMember(roomId, user.userId);
  } catch (err) {
    if (err instanceof RoomAccessError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }

  const rawBody = await req.json();

  const operation: string = rawBody.operation;
  const validOps = ["deleteOne", "deleteMany", "updateOne", "updateMany"];
  if (!validOps.includes(operation)) {
    return NextResponse.json({ error: "Invalid operation" }, { status: 400 });
  }

  const filter = EJSON.deserialize(rawBody.filter ?? {}, { relaxed: false }) as any;
  const update = rawBody.update
    ? (EJSON.deserialize(rawBody.update, { relaxed: false }) as any)
    : undefined;

  const db = await getRoomDb(roomId);
  const col = db.collection(collectionName);

  const coreClient = await clientPromise;
  const coreDb = coreClient.db("workflowbuilder_core");
  const room = await coreDb
    .collection("rooms")
    .findOne({ _id: new ObjectId(roomId) }, { projection: { name: 1 } });

  let resultData: Record<string, number> = {};
  let before: any = null;
  let after: any = null;

  if (operation === "deleteOne") {
    const beforeDoc = await col.findOne(filter);
    before = beforeDoc ? EJSON.serialize(beforeDoc, { relaxed: false }) : null;
    const result = await col.deleteOne(filter);
    resultData = { deletedCount: result.deletedCount };
  } else if (operation === "deleteMany") {
    const beforeDocs = await col.find(filter).limit(100).toArray();
    before = beforeDocs.map((d) => EJSON.serialize(d, { relaxed: false }));
    const result = await col.deleteMany(filter);
    resultData = { deletedCount: result.deletedCount };
  } else if (operation === "updateOne") {
    const beforeDoc = await col.findOne(filter);
    before = beforeDoc ? EJSON.serialize(beforeDoc, { relaxed: false }) : null;
    const result = await col.updateOne(filter, update!);
    resultData = { matchedCount: result.matchedCount, modifiedCount: result.modifiedCount };
    if (beforeDoc) {
      const afterDoc = await col.findOne({ _id: (beforeDoc as any)._id });
      after = afterDoc ? EJSON.serialize(afterDoc, { relaxed: false }) : null;
    }
  } else {
    // updateMany
    const result = await col.updateMany(filter, update!);
    resultData = { matchedCount: result.matchedCount, modifiedCount: result.modifiedCount };
    after = { filter: rawBody.filter, update: rawBody.update };
  }

  await coreDb.collection("audit_logs").insertOne({
    roomId,
    roomName: room?.name || "Unknown Room",
    collection: collectionName,
    action: operation,
    filter: rawBody.filter,
    update: rawBody.update ?? null,
    before,
    after,
    userId: user.userId,
    timestamp: new Date(),
  });

  if (operation === "deleteOne" || operation === "deleteMany") {
    await coreDb.collection("backups").insertOne({
      roomId,
      collection: collectionName,
      type: operation,
      data: before,
      permanent: false,
      createdAt: new Date(),
    });
  }

  broadcast({ type: operation, roomId, collection: collectionName });

  return NextResponse.json({ success: true, ...resultData });
}
