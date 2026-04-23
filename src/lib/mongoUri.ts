export type MongoConfig = {
    host: string
    port: string
    database: string
    username: string
    password: string
    authDb: string
}

export function parseMongoUri(uri: string): MongoConfig {
    try {
        const url = new URL(uri)
        return {
            host: url.hostname,
            port: url.port || '27017',
            database: url.pathname.replace(/^\//, ''),
            username: decodeURIComponent(url.username || ''),
            password: decodeURIComponent(url.password || ''),
            authDb: url.searchParams.get('authSource') || 'admin',
        }
    } catch {
        return { host: '', port: '27017', database: '', username: '', password: '', authDb: 'admin' }
    }
}

export function buildMongoUri(cfg: MongoConfig) {
    const creds = cfg.username
        ? `${encodeURIComponent(cfg.username)}:${encodeURIComponent(cfg.password)}@`
        : ''
    const authSource = cfg.authDb ? `?authSource=${cfg.authDb}` : ''
    return `mongodb://${creds}${cfg.host}:${cfg.port}/${cfg.database}${authSource}`
}
