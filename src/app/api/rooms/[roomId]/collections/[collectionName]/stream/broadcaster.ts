let clients: ReadableStreamDefaultController[] = []

export function broadcast(event: any) {
    const msg = `data: ${JSON.stringify(event)}\n\n`
    clients.forEach(c => c.enqueue(msg))
}

export function addClient(controller: ReadableStreamDefaultController) {
    clients.push(controller)
}

export function removeClient(controller: ReadableStreamDefaultController) {
    clients = clients.filter(c => c !== controller)
}
