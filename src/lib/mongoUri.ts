export type MongoConfig = {
    host: string
    port: string
    database: string
    username: string
    password: string
    authDb: string
}

export function buildMongoUri(cfg: MongoConfig) {
    const creds = cfg.username
        ? `${encodeURIComponent(cfg.username)}:${encodeURIComponent(cfg.password)}@`
        : ''
    const authSource = cfg.authDb ? `?authSource=${cfg.authDb}` : ''
    return `mongodb://${creds}${cfg.host}:${cfg.port}/${cfg.database}${authSource}`
}
