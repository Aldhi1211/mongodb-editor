import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

function getUser(req: Request) {
  const auth = req.headers.get("authorization");

  if (!auth) return null;

  if (!auth.startsWith("Bearer ")) return null;

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
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const coreClient = await clientPromise;
  const coreDb = coreClient.db("workflowbuilder_core");

  const logs = await coreDb
    .collection("audit_logs")
    .find({})
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray();

  return NextResponse.json({ data: logs });
}
