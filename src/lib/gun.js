import Gun from 'gun'
import SEA from 'gun/sea.js'

const mode = process.env.NODE_ENV
const dev = mode === "development"

export const gun_host = dev ? 'http://localhost:8013': 'https://ttdb-testnet.chaintek.net'
export const gun = Gun(`${gun_host}/gun`)
