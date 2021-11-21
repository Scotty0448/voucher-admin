import dotenv from 'dotenv'
dotenv.config()
const { COIN, COIN_ADDRESS, COIN_PRIVKEY, ASSET_ADDRESS, ASSET_PRIVKEY } = process.env

import sharp        from 'sharp'

import * as rpc     from '$lib/rpc-client.js'
import * as pinata  from '$lib/pinata.js'
import { coins }    from '$lib/coins.js'

export async function get(req) {
  try {
    const assets = await rpc.listAssets(req.query.get('prefix'))
    console.log(`${assets.length} assets loaded for ${req.query.get('prefix')}`)
    return { status:200, body:assets }
  } catch(err) {
    return { status:500, body:{ message:err.message } }
  }
}

export async function post(req) {
  try {
    let asset = JSON.parse(req.body)
    console.log(`creating asset ${asset.name}`)

    if (asset.info.logo) {
      let img_data = asset.info.logo.split(',')[1]
      let resized_data = await sharp(Buffer.from(img_data, 'base64')).resize({height:100}).toBuffer()
      asset.info.logo = `data:image/png;base64,${resized_data.toString('base64')}`
    }

    let ipfs_hash = await pinata.pinJsonToIpfs(asset.info, asset.name)

    if (asset.amount) {
      if (asset.amount < 1)           { return { status:299, body:{ message:'The quantity must be greater than zero' } } }
      if (asset.amount % 1 != 0)      { return { status:299, body:{ message:'The quantity must be a whole number' } } }
      if (asset.amount > 21000000000) { return { status:299, body:{ message:'The quantity must be less than 21B' } } }
    } else {
      asset.amount = 1
    }

    // let utxos = []
    // try {
    //   utxos = await rpc.getAddressUtxos(COIN_ADDRESS)
    // } catch (err) {
    //   console.log(err.message)
    //   return { status:500, body:{ message:err.message } }
    // }
    //
    // let burn = coins[COIN].issueSubAssetBurnAmount * 100000000
    // let fee = coins[COIN].txFeePerKb * 100000000
    //
    // let remaining = burn + fee
    // let inputs = []
    // for (let utxo of utxos) {
    //   inputs.push({ txid:utxo.txid, vout:utxo.outputIndex })
    //   remaining -= Number(utxo.satoshis)
    //   if (remaining <= 0) {
    //     break
    //   }
    // }
    // if (remaining > 0) {
    //   console.log('Insufficient funds for burn+fee')
    //   return { status:500, body:{ message:'Insufficient funds for burn+fee' } }
    // }
    //
    // let outputs = {}
    // if (remaining < 0) {
    //   outputs[COIN_ADDRESS] = Math.abs(remaining) / 100000000
    // }
    // outputs[coins[COIN].issueSubAssetBurnAddress] = coins[COIN].issueSubAssetBurnAmount
    // outputs[ASSET_ADDRESS] = {"issue":{"asset_name":asset.name,"asset_quantity":Number(asset.amount),"units":0,"reissuable":1,"has_ipfs":1,"ipfs_hash":ipfs_hash}}
    //
    // let raw_tx = await rpc.createRawTransaction(inputs, outputs)
    // let signed_tx = await rpc.signRawTransaction(raw_tx, null, [COIN_PRIVKEY, ASSET_PRIVKEY])
    // let tx_id = await rpc.sendSignedTx(signed_tx.hex)

    let tx_id = await rpc.issue(asset.name, Number(asset.amount), ASSET_ADDRESS, ASSET_ADDRESS, 0, true, true, ipfs_hash)

    console.log(`created asset ${asset.name}`, asset.amount, ipfs_hash, tx_id)
    return { status:201, body:{ tx_id:tx_id } }
  } catch(err) {
    console.log(err.message)
    return { status:500, body:{ message:err.message } }
  }
}
