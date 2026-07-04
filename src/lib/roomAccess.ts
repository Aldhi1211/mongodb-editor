import clientPromise from "./mongodb";
import { ObjectId } from "mongodb";

export class RoomAccessError extends Error {
    status: number;
    constructor(status: number, message: string) {
        super(message);
        this.status = status;
    }
}

/**
 * Loads the room from workflowbuilder_core and verifies the given userId is
 * one of its members. Throws RoomAccessError(404) if the room doesn't exist,
 * or RoomAccessError(403) if the user isn't a member — callers must run this
 * before touching getRoomDb() / room data so cross-tenant access is blocked.
 */
export async function assertRoomMember(roomId: string, userId: string) {
    const client = await clientPromise;
    const coreDb = client.db("workflowbuilder_core");

    let objectId: ObjectId;
    try {
        objectId = new ObjectId(roomId);
    } catch {
        throw new RoomAccessError(404, "Room not found");
    }

    const room = await coreDb.collection("rooms").findOne({ _id: objectId });
    if (!room) throw new RoomAccessError(404, "Room not found");

    const member = room.members.find((m: any) => m.userId === userId);
    if (!member) throw new RoomAccessError(403, "Forbidden: you are not a member of this room");

    return { room, member };
}
