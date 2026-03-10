import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

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

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> },
) {
  const user = getUser(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { roomId } = await params;

  const client = await clientPromise;
  const db = client.db("workflowbuilder_core");

  await db.collection("rooms").deleteOne({
    _id: new ObjectId(roomId),
  });

  return NextResponse.json({ success: true });
}
