import Gun from 'gun/gun.js'
import SEA from 'gun/sea.js'

const mode = process.env.NODE_ENV
const dev = mode === "development"

export const gun_relay = dev ? 'http://localhost:8013': 'https://ttdb-testnet.chaintek.net'
export const gun = Gun({axe:false, peers:[`${gun_relay}/gun`]})
