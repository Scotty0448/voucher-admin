import dotenv from 'dotenv'
dotenv.config()
const { COIN, COIN_ADDRESS, COIN_PRIVKEY, ASSET_ADDRESS, ASSET_PRIVKEY } = process.env

import sharp        from 'sharp'
import fetch        from 'node-fetch'

import * as rpc     from '$lib/rpc-client.js'
import * as pinata  from '$lib/pinata.js'
import { coins }    from '$lib/coins.js'

export async function get(req) {
  try {
    let name = req.params.slug.replace( /\|/g, '/' )
    let asset
    if (req.query.get('mempool') == 'false') {
      asset = await rpc.getAssetData(name)
    } else {
      asset = await rpc.getAssetDataWithMempool(name, ASSET_ADDRESS)
    }
    if (asset) {
      let asset_balances = await rpc.listAssetBalancesByAddress(ASSET_ADDRESS)
      asset.balance = asset_balances[name] || 0
      if (asset.ipfs_hash) {
        let resp = await fetch(`https://gateway.pinata.cloud/ipfs/${asset.ipfs_hash}`)
        if (resp.status == 200) {
          asset.info = await resp.json()
        }
      }
      return { status:200, body:asset }
    } else {
      return { status:404, body:{ message:'Asset not found' } }
    }
  } catch(err) {
    console.log(err.message)
    return { status:500, body:{ message:err.message } }
  }
}

export async function put(req) {
  try {
    let asset = JSON.parse(req.body)
    console.log(`updating asset ${asset.name}`)

    if (asset.info.logo) {
      let img_data = asset.info.logo.split(',')[1]
      let resized_data = await sharp(Buffer.from(img_data, 'base64')).resize({height:100}).toBuffer()
      asset.info.logo = `data:image/png;base64,${resized_data.toString('base64')}`
    }

    let org_asset = await rpc.getAssetDataWithMempool(asset.name, ASSET_ADDRESS)

    let reissue_quantity = 0

    if (asset.amount) {
      if (asset.amount < org_asset.amount)  { return { status:299, body:{ message:'The quantity cannot be decreased', org_amount:org_asset.amount } } }
      if (asset.amount % 1 != 0)            { return { status:299, body:{ message:'The quantity must be a whole number' } } }
      if (asset.amount > 21000000000)       { return { status:299, body:{ message:'The quantity must be less than 21B' } } }
      reissue_quantity = asset.amount - org_asset.amount
    }

    let ipfs_hash = await pinata.pinJsonToIpfs(asset.info, asset.name)
    if (org_asset.ipfs_hash == ipfs_hash ) {
      if (reissue_quantity == 0) {
        return { status:299, body:{ message:'No changes to update' } }
      }
    } else if (org_asset.ipfs_hash) {
      try {
        await pinata.unpin(org_asset.ipfs_hash)
      } catch(err) {
        console.log('Couldn\'t unpin '+org_asset.ipfs_hash)
      }
    }

    let utxos = []
    try {
      utxos = await rpc.getAddressUtxos(COIN_ADDRESS)
    } catch (err) {
      console.log(err.message)
      return { status:500, body:{ message:err.message } }
    }

    let burn = coins[COIN].reissueAssetBurnAmount * 100000000
    let fee = coins[COIN].txFeePerKb * 100000000

    let remaining = burn + fee
    let inputs = []
    for (let utxo of utxos) {
      inputs.push({ txid:utxo.txid, vout:utxo.outputIndex })
      remaining -= Number(utxo.satoshis)
      if (remaining <= 0) {
        break
      }
    }
    if (remaining > 0) {
      console.log('Insufficient funds for burn+fee')
      return { status:500, body:{ message:'Insufficient funds for burn+fee' } }
    }

    let asset_utxos = []
    try {
      asset_utxos = await rpc.getAssetUtxos(ASSET_ADDRESS, asset.name+'!')
      if (asset_utxos.length == 0) {
        console.log('Admin token not found')
        return { status:500, body:{ message:'Admin token not found' } }
      }
    } catch (err) {
      console.log(err.message)
      return { status:500, body:{ message:err.message } }
    }

    inputs.push({ txid:asset_utxos[0].txid, vout:asset_utxos[0].outputIndex })

    let outputs = {}
    if (remaining < 0) {
      outputs[COIN_ADDRESS] = Math.abs(remaining) / 100000000
    }
    outputs[coins[COIN].reissueAssetBurnAddress] = coins[COIN].reissueAssetBurnAmount
    outputs[ASSET_ADDRESS] = {"reissue":{"asset_name":asset.name,"asset_quantity":reissue_quantity,"ipfs_hash":ipfs_hash}}

    let raw_tx = await rpc.createRawTransaction(inputs, outputs)
    let signed_tx = await rpc.signRawTransaction(raw_tx, null, [COIN_PRIVKEY, ASSET_PRIVKEY])
    let tx_id = await rpc.sendSignedTx(signed_tx.hex)

    console.log(`updated asset ${asset.name}`, reissue_quantity, ipfs_hash, tx_id)
    return { status:200, body:{ tx_id:tx_id } }
  } catch(err) {
    console.log(err)
    return { status:500, body:{ message:err.message } }
  }
}

export async function post(req) {
  try {
    let name = req.params.slug.replace( /\|/g, '/' )
    let address = JSON.parse(req.body).address
    let qty = JSON.parse(req.body).qty

    if (qty) {
      if (qty < 1)           { return { status:299, body:{ message:'The quantity must be greater than zero' } } }
      if (qty % 1 != 0)      { return { status:299, body:{ message:'The quantity must be a whole number' } } }
    } else {
      return { status:299, body:{ message:'A quantity must be entered' } }
    }

    let utxos = []
    try {
      utxos = await rpc.getAddressUtxos(COIN_ADDRESS)
    } catch (err) {
      console.log(err.message)
      return { status:500, body:{ message:err.message } }
    }

    let fee = coins[COIN].txFeePerKb * 100000000

    let remaining = fee
    let inputs = []
    for (let utxo of utxos) {
      inputs.push({ txid:utxo.txid, vout:utxo.outputIndex })
      remaining -= Number(utxo.satoshis)
      if (remaining <= 0) {
        break
      }
    }
    if (remaining > 0) {
      console.log('Insufficient funds for fee')
      return { status:500, body:{ message:'Insufficient funds for fee' } }
    }

    let asset_utxos = []
    try {
      asset_utxos = await rpc.getAssetUtxos(ASSET_ADDRESS, name)
      if (asset_utxos.length == 0) {
        console.log('Insufficient quantity available')
        return { status:500, body:{ message:'Insufficient quantity available' } }
      }
    } catch (err) {
      console.log(err.message)
      return { status:500, body:{ message:err.message } }
    }

    let remaining_qty = qty
    for (let asset_utxo of asset_utxos) {
      inputs.push({ txid:asset_utxo.txid, vout:asset_utxo.outputIndex })
      remaining_qty -= Math.round(asset_utxo.satoshis / 100000000)
      if (remaining_qty <= 0) {
        break
      }
    }
    if (remaining_qty > 0) {
      return_error(res, 'Insufficient quantity available')
      return { status:500, body:{ message:'Insufficient quantity available' } }
    }

    let outputs = {}
    if (remaining < 0) {
      outputs[COIN_ADDRESS] = Math.abs(remaining) / 100000000
    }
    outputs[address] = JSON.parse(`{"transfer":{"${name}":${qty}}}`)
    if (Math.abs(remaining_qty) > 0) {
      outputs[ASSET_ADDRESS] = JSON.parse(`{"transfer":{"${name}":${Math.abs(remaining_qty)}}}`)
    }

    let raw_tx = await rpc.createRawTransaction(inputs, outputs)
    let signed_tx = await rpc.signRawTransaction(raw_tx, null, [COIN_PRIVKEY, ASSET_PRIVKEY])
    let tx_id = await rpc.sendSignedTx(signed_tx.hex)

    console.log('sent asset', name, qty, tx_id)
    return { status:200, body:{ tx_id:tx_id } }
  } catch(err) {
    console.log(err.message)
    return { status:500, body:{ message:err.message } }
  }
}
