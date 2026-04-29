import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getRoomDb } from "@/lib/roomDb";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

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
  const { targetName } = await req.json();
  if (!targetName?.trim()) return NextResponse.json({ error: "Target name is required" }, { status: 400 });
  if (targetName === collectionName) return NextResponse.json({ error: "Target name must be different from source" }, { status: 400 });

  const db = await getRoomDb(roomId);

  const existing = await db.listCollections({ name: targetName }).toArray();
  if (existing.length > 0) return NextResponse.json({ error: `Collection "${targetName}" already exists` }, { status: 409 });

  const source = db.collection(collectionName);
  const target = db.collection(targetName);

  let totalCopied = 0;
  const batch: any[] = [];

  for await (const doc of source.find({})) {
    batch.push(doc);
    if (batch.length === 200) {
      await target.insertMany(batch);
      totalCopied += batch.length;
      batch.length = 0;
    }
  }
  if (batch.length > 0) {
    await target.insertMany(batch);
    totalCopied += batch.length;
  }

  const coreClient = await clientPromise;
  const coreDb = coreClient.db("workflowbuilder_core");
  const room = await coreDb.collection("rooms").findOne({ _id: new ObjectId(roomId) }, { projection: { name: 1 } });

  await coreDb.collection("audit_logs").insertOne({
    roomId,
    roomName: room?.name || "Unknown Room",
    collection: collectionName,
    action: "clone_collection",
    before: { name: collectionName },
    after: { name: targetName, documentsCopied: totalCopied },
    userId: user.userId,
    timestamp: new Date(),
  });

  return NextResponse.json({ success: true, targetName, documentsCopied: totalCopied });
}
