import { EJSON } from 'bson'

const isPlainObject = (value: any) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false
    const proto = Object.getPrototypeOf(value)
    return proto === Object.prototype || proto === null
}

const formatNumberLong = (value: string) => {
    if (/^-?\d+$/.test(value) && Math.abs(Number(value)) <= Number.MAX_SAFE_INTEGER) {
        return `NumberLong(${value})`
    }
    return `NumberLong("${value}")`
}

const toShellLiteral = (value: any): string | null => {
    if (!isPlainObject(value)) return null

    const keys = Object.keys(value)
    if (keys.length !== 1) return null

    if (keys[0] === '$oid' && typeof value.$oid === 'string') {
        return `ObjectId("${value.$oid}")`
    }

    if (keys[0] === '$numberLong' && typeof value.$numberLong === 'string') {
        return formatNumberLong(value.$numberLong)
    }

    if (keys[0] === '$numberInt' && typeof value.$numberInt === 'string') {
        return value.$numberInt
    }

    if (keys[0] === '$date') {
        const dateValue = value.$date
        if (typeof dateValue === 'string') {
            return `ISODate("${dateValue}")`
        }
        if (isPlainObject(dateValue) && typeof dateValue.$numberLong === 'string') {
            const ms = Number(dateValue.$numberLong)
            if (!Number.isNaN(ms)) {
                return `ISODate("${new Date(ms).toISOString()}")`
            }
        }
    }

    if (keys[0] === '$numberDouble' && typeof value.$numberDouble === 'string') {
        const numeric = Number(value.$numberDouble)
        if (!Number.isNaN(numeric) && Number.isFinite(numeric)) {
            return value.$numberDouble
        }
        return `NumberDouble("${value.$numberDouble}")`
    }

    return null
}

const stringifyValue = (value: any, depth: number, space: number): string => {
    const literal = toShellLiteral(value)
    if (literal) return literal

    if (value instanceof Date) {
        return `ISODate("${value.toISOString()}")`
    }

    if (Array.isArray(value)) {
        if (!value.length) return '[]'
        const indent = ' '.repeat(space * (depth + 1))
        const closingIndent = ' '.repeat(space * depth)
        const items = value
            .map((item) => `${indent}${stringifyValue(item, depth + 1, space)}`)
            .join(',\n')
        return `[\n${items}\n${closingIndent}]`
    }

    if (isPlainObject(value)) {
        const entries = Object.entries(value)
        if (!entries.length) return '{}'
        const indent = ' '.repeat(space * (depth + 1))
        const closingIndent = ' '.repeat(space * depth)
        const body = entries
            .map(([key, val]) => `${indent}${JSON.stringify(key)}: ${stringifyValue(val, depth + 1, space)}`)
            .join(',\n')
        return `{\n${body}\n${closingIndent}}`
    }

    if (typeof value === 'string') return JSON.stringify(value)
    if (typeof value === 'number' || typeof value === 'boolean') return String(value)
    if (value === null) return 'null'

    return JSON.stringify(value)
}

export const toShellString = (value: any, space = 2) => {
    try {
        const ejson = EJSON.serialize(value ?? {}, { relaxed: false })
        return stringifyValue(ejson, 0, space)
    } catch {
        return stringifyValue(value ?? {}, 0, space)
    }
}

const normalizeShellInput = (text: string) => {
    let output = text

    output = output.replace(/ObjectId\s*\(\s*"([^"]+)"\s*\)/g, '{ "$oid": "$1" }')
    output = output.replace(/ISODate\s*\(\s*"([^"]+)"\s*\)/g, (_match, isoDate) => {
        const ms = Date.parse(isoDate)
        if (!Number.isNaN(ms)) {
            return `{ "$date": { "$numberLong": "${ms}" } }`
        }
        return `{ "$date": "${isoDate}" }`
    })
    output = output.replace(/NumberLong\s*\(\s*"?(-?\d+)"?\s*\)/g, '{ "$numberLong": "$1" }')
    output = output.replace(/NumberInt\s*\(\s*"?(-?\d+)"?\s*\)/g, '{ "$numberInt": "$1" }')

    return output
}

export const parseShellStringToEjson = (text: string) => {
    const normalized = normalizeShellInput(text)
    const raw = JSON.parse(normalized)
    const bsonDoc = EJSON.deserialize(raw, { relaxed: false })
    return EJSON.serialize(bsonDoc, { relaxed: false })
}

export const getEjsonIdString = (id: any) => {
    if (typeof id === 'string') return id
    if (id && typeof id === 'object') {
        if (typeof id.$oid === 'string') return id.$oid
        if (typeof id.$uuid === 'string') return id.$uuid
    }
    if (id === null || id === undefined) return ''
    return String(id)
}
