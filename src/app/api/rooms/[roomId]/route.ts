import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import crypto from "crypto";
import { assertRoomMember, RoomAccessError } from "@/lib/roomAccess";

function encrypt(text: string) {
  const iv = crypto.randomBytes(16);
  const key = Buffer.from(process.env.ROOM_SECRET as string, "hex");
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

function decrypt(text: string) {
  const [ivHex, encrypted] = text.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const key = Buffer.from(process.env.ROOM_SECRET as string, "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

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
  { params }: { params: Promise<{ roomId: string }> },
) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { roomId } = await params;
  const client = await clientPromise;
  const db = client.db("workflowbuilder_core");

  const room = await db.collection("rooms").findOne({ _id: new ObjectId(roomId) });
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  const me = room.members.find((m: any) => m.userId === user.userId);
  if (!me || (me.role !== "owner" && me.role !== "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const mongoUri = decrypt(room.mongoUri);
  return NextResponse.json({ name: room.name, mongoUri });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> },
) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { roomId } = await params;
  const { name, mongoUri } = await req.json();

  const client = await clientPromise;
  const db = client.db("workflowbuilder_core");

  const room = await db.collection("rooms").findOne({ _id: new ObjectId(roomId) });
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  const me = room.members.find((m: any) => m.userId === user.userId);
  if (!me || (me.role !== "owner" && me.role !== "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const update: any = {};
  if (name) update.name = name;
  if (mongoUri) update.mongoUri = encrypt(mongoUri);

  await db.collection("rooms").updateOne(
    { _id: new ObjectId(roomId) },
    { $set: update },
  );

  return NextResponse.json({ success: true });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> },
) {
  const user = getUser(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { roomId } = await params;

  let member;
  try {
    ({ member } = await assertRoomMember(roomId, user.userId));
  } catch (err) {
    if (err instanceof RoomAccessError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }

  if (member.role !== "owner") {
    return NextResponse.json({ error: "Forbidden: only the room owner can delete this room" }, { status: 403 });
  }

  const client = await clientPromise;
  const db = client.db("workflowbuilder_core");

  await db.collection("rooms").deleteOne({
    _id: new ObjectId(roomId),
  });

  return NextResponse.json({ success: true });
}
