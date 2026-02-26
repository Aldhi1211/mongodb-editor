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

type Params = {
  roomId: string;
};

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

  const target = await authDb.collection("users").findOne({ email });

  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await coreDb.collection("rooms").updateOne(
    { _id: roomObjectId },
    {
      $addToSet: {
        members: {
          userId: target._id.toString(),
          role,
        },
      },
    },
  );

  return NextResponse.json({ success: true });
}
