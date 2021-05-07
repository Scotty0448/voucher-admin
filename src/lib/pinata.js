import dotenv from 'dotenv'
dotenv.config()
const { PINATA_KEY, PINATA_SECRET } = process.env

import pinataSDK from '@pinata/sdk'
const pinata = pinataSDK(PINATA_KEY, PINATA_SECRET)

export function pinJsonToIpfs(json, asset_name) {
  return new Promise((resolve, reject) =>
    pinata.pinJSONToIPFS(json, { pinataMetadata: { name: asset_name } }).then((result) => {
      resolve(result.IpfsHash)
    }).catch((err) => {
      console.log(err.message)
      reject(err)
    })
  )
}

export function unpin(hash) {
  return new Promise((resolve, reject) =>
    pinata.unpin(hash).then((result) => {
      resolve(result)
    }).catch((err) => {
      console.log(err.message)
      resolve(err)
    })
  )
}
