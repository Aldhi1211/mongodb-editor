import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

function getUser(req: NextRequest) {
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

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

type Params = {
  roomId: string;
};

// Lookup a single email (GitHub-style): tells the inviter whether a user with
// that email exists, and whether they are already a member / the inviter.
export async function GET(
  req: NextRequest,
  context: { params: Promise<Params> },
) {
  const { roomId } = await context.params;

  const user = getUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = req.nextUrl.searchParams.get("email")?.trim();
  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const client = await clientPromise;
  const coreDb = client.db("workflowbuilder_core");
  const authDb = client.db("workflowbuilder_auth");

  const roomObjectId = new ObjectId(roomId);
  const room = await coreDb.collection("rooms").findOne({ _id: roomObjectId });
  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  const me = room.members.find((m: any) => m.userId === user.userId);
  if (!me || (me.role !== "owner" && me.role !== "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const target = await authDb
    .collection("users")
    .findOne({ email: { $regex: new RegExp(`^${escapeRegex(email)}$`, "i") } });

  if (!target) {
    return NextResponse.json({ exists: false });
  }

  const targetUserId = target._id.toString();
  return NextResponse.json({
    exists: true,
    email: target.email,
    isSelf: targetUserId === user.userId,
    alreadyMember: room.members.some((m: any) => m.userId === targetUserId),
  });
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<Params> },
) {
  const { roomId } = await context.params;

  const user = getUser(req);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { email, role } = await req.json();

  if (!email || !role) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const client = await clientPromise;

  const coreDb = client.db("workflowbuilder_core");
  const authDb = client.db("workflowbuilder_auth");

  const roomObjectId = new ObjectId(roomId);

  const room = await coreDb.collection("rooms").findOne({ _id: roomObjectId });

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  const me = room.members.find((m: any) => m.userId === user.userId);

  if (!me || (me.role !== "owner" && me.role !== "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const target = await authDb
    .collection("users")
    .findOne({ email: { $regex: new RegExp(`^${escapeRegex(email)}$`, "i") } });

  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const targetUserId = target._id.toString();

  // Prevent inviting yourself
  if (targetUserId === user.userId) {
    return NextResponse.json({ error: "Cannot invite yourself" }, { status: 400 });
  }

  // Pull any existing entry for this user (handles re-invite after kick)
  await coreDb.collection("rooms").updateOne(
    { _id: roomObjectId },
    { $pull: { members: { userId: targetUserId } } } as any,
  );

  // Push fresh membership
  await coreDb.collection("rooms").updateOne(
    { _id: roomObjectId },
    { $push: { members: { userId: targetUserId, role } } } as any,
  );

  return NextResponse.json({ success: true });
}
