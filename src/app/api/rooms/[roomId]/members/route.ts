import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

function getUser(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth) return null;
  try {
    return jwt.verify(auth.split(" ")[1], process.env.JWT_SECRET as string) as any;
  } catch {
    return null;
  }
}

// GET — list members with email
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ roomId: string }> },
) {
  const { roomId } = await context.params;
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const client = await clientPromise;
  const coreDb = client.db("workflowbuilder_core");
  const authDb = client.db("workflowbuilder_auth");

  const room = await coreDb.collection("rooms").findOne({ _id: new ObjectId(roomId) });
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  const isMember = room.members.some((m: any) => m.userId === user.userId);
  if (!isMember) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Enrich members with email
  const userIds = room.members.map((m: any) => {
    try { return new ObjectId(m.userId); } catch { return null; }
  }).filter(Boolean);

  const users = await authDb.collection("users").find({ _id: { $in: userIds } }).toArray();
  const emailMap = Object.fromEntries(users.map((u) => [u._id.toString(), u.email]));

  const enriched = room.members.map((m: any) => ({
    userId: m.userId,
    role: m.role,
    email: emailMap[m.userId] ?? "(unknown)",
  }));

  return NextResponse.json(enriched);
}

// DELETE — kick a member
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ roomId: string }> },
) {
  const { roomId } = await context.params;
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { userId: targetUserId } = await req.json();
  if (!targetUserId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const client = await clientPromise;
  const coreDb = client.db("workflowbuilder_core");

  const room = await coreDb.collection("rooms").findOne({ _id: new ObjectId(roomId) });
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  const me = room.members.find((m: any) => m.userId === user.userId);
  if (!me || (me.role !== "owner" && me.role !== "admin")) {
    return NextResponse.json({ error: "Forbidden: only owner/admin can kick" }, { status: 403 });
  }

  const target = room.members.find((m: any) => m.userId === targetUserId);
  if (!target) return NextResponse.json({ error: "Member not found" }, { status: 404 });

  // Owner cannot be kicked
  if (target.role === "owner") {
    return NextResponse.json({ error: "Cannot kick the owner" }, { status: 403 });
  }

  await coreDb.collection("rooms").updateOne(
    { _id: new ObjectId(roomId) },
    { $pull: { members: { userId: targetUserId } } as any },
  );

  return NextResponse.json({ success: true });
}
