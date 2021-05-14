import * as bitcoin from 'bitcoinjs-lib'
import * as Buffer  from 'buffer'
import reverse      from 'buffer-reverse'
import fetch        from 'node-fetch'

import dotenv from 'dotenv'
dotenv.config()
const { COIN, COIN_ADDRESS, COIN_PRIVKEY, ASSET_ADDRESS, ASSET_PRIVKEY } = process.env

import * as rpc     from '$lib/rpc-client.js'
import * as pinata  from '$lib/pinata.js'
import { coins }    from '$lib/coins.js'

async function signRawTransaction(raw_tx) {
  let txFromHex = bitcoin.Transaction.fromHex(raw_tx)
  let txb = bitcoin.TransactionBuilder.fromTransaction(txFromHex, coins[COIN].network)

  for (let [idx, input] of txFromHex.ins.entries()) {
    let txid = reverse(input.hash).toString('hex')
    let txout = await rpc.getTxOut(txid, input.index)

    if (txout.scriptPubKey.type == 'new_asset' || txout.scriptPubKey.type == 'reissue_asset' || txout.scriptPubKey.type == 'transfer_asset') {
      txb.__TX.ins[idx].assetScript = Buffer.Buffer.from(txout.scriptPubKey.hex, 'hex')
    }

    if (txout.scriptPubKey.addresses[0] == COIN_ADDRESS) {
      let keypair = bitcoin.ECPair.fromWIF(COIN_PRIVKEY, coins[COIN].network)
      txb.sign(idx, keypair)
    }
    if (txout.scriptPubKey.addresses[0] == ASSET_ADDRESS) {
      let keypair = bitcoin.ECPair.fromWIF(ASSET_PRIVKEY, coins[COIN].network)
      txb.sign(idx, keypair)
    }
  }

  return txb.build().toHex()
}

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
    if (Math.abs(remaining) > 0) {
      outputs[COIN_ADDRESS] = Math.abs(remaining) / 100000000
    }
    outputs[coins[COIN].reissueAssetBurnAddress] = coins[COIN].reissueAssetBurnAmount
    outputs[ASSET_ADDRESS] = {"reissue":{"asset_name":asset.name,"asset_quantity":reissue_quantity,"ipfs_hash":ipfs_hash}}

    let raw_tx = await rpc.createRawTransaction(inputs, outputs)
    let signed_tx = await signRawTransaction(raw_tx)
    let tx_id = await rpc.sendSignedTx(signed_tx)

    console.log(`updated asset ${asset.name}`, reissue_quantity, ipfs_hash, tx_id)
    return { status:200, body:{ tx_id:tx_id } }
  } catch(err) {
    console.log(err)
    return { status:500, body:{ message:err.message } }
  }
}
