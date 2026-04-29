import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import clientPromise from "@/lib/mongodb";

function getUser(req: Request) {
  const auth = req.headers.get("authorization");

  if (!auth || !auth.startsWith("Bearer ")) return null;

  const token = auth.slice(7);

  if (!token) return null;

  try {
    return jwt.verify(token, process.env.JWT_SECRET as string) as any;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const user = getUser(req);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = 20;
  const skip = (page - 1) * limit;

  const client = await clientPromise;
  const db = client.db("workflowbuilder_core");

  // Ambil hanya rooms yang user ini adalah member-nya
  const userRooms = await db
    .collection("rooms")
    .find({ "members.userId": user.userId })
    .project({ _id: 1 })
    .toArray();

  const roomIds = userRooms.map((r) => r._id.toString());

  if (roomIds.length === 0) {
    return NextResponse.json({ data: [], total: 0, page, totalPages: 0 });
  }

  const filter = { roomId: { $in: roomIds } };

  const [logs, total] = await Promise.all([
    db.collection("audit_logs").find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit).toArray(),
    db.collection("audit_logs").countDocuments(filter),
  ]);

  return NextResponse.json({ data: logs, total, page, totalPages: Math.ceil(total / limit) });
}
