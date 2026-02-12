import { addClient, removeClient } from "./broadcaster"

export async function GET() {
    let controllerRef: ReadableStreamDefaultController | null = null

    const stream = new ReadableStream({
        start(controller) {
            controllerRef = controller
            addClient(controller)
        },
        cancel() {
            if (controllerRef) {
                removeClient(controllerRef)
            }
        }
    })

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive"
        }
    })
}
