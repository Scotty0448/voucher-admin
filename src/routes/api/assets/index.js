import * as bitcoin from 'bitcoinjs-lib'
import * as Buffer  from 'buffer'
import reverse      from 'buffer-reverse'

import dotenv from 'dotenv'
dotenv.config()
const { RITO_ADDRESS, RITO_PRIVKEY, ASSET_ADDRESS, ASSET_PRIVKEY } = process.env

import * as rpc     from '$lib/rpc-client.js'
import * as pinata  from '$lib/pinata.js'

// testnet
let issue_burn_address = 'n1issueSubAssetXXXXXXXXXXXXXbNiH6v'
let network = {
  messagePrefix: '\x15Rito Signed Message:\n',
  bech32: null,
  bip32: {
    public: 0x43587CD,
    private: 0x4358391,
  },
  pubKeyHash: 0x6F,
  scriptHash: 0xC4,
  wif: 0xEF
}

async function signRawTransaction(raw_tx) {
  let txFromHex = bitcoin.Transaction.fromHex(raw_tx)
  let txb = bitcoin.TransactionBuilder.fromTransaction(txFromHex, network)

  for (let [idx, input] of txFromHex.ins.entries()) {
    let txid = reverse(input.hash).toString('hex')
    let txout = await rpc.getTxOut(txid, input.index)

    if (txout.scriptPubKey.type == 'new_asset' || txout.scriptPubKey.type == 'reissue_asset' || txout.scriptPubKey.type == 'transfer_asset') {
      txb.__TX.ins[idx].assetScript = Buffer.Buffer.from(txout.scriptPubKey.hex, 'hex')
    }

    if (txout.scriptPubKey.addresses[0] == RITO_ADDRESS) {
      let keypair = bitcoin.ECPair.fromWIF(RITO_PRIVKEY, network)
      txb.sign(idx, keypair)
    }
    if (txout.scriptPubKey.addresses[0] == ASSET_ADDRESS) {
      let keypair = bitcoin.ECPair.fromWIF(ASSET_PRIVKEY, network)
      txb.sign(idx, keypair)
    }
  }

  return txb.build().toHex()
}

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

    let ipfs_hash = await pinata.pinJsonToIpfs(asset.info, asset.name)

    if (asset.amount) {
      if (asset.amount < 1)           { return { status:299, body:{ message:'The quantity must be greater than zero' } } }
      if (asset.amount % 1 != 0)      { return { status:299, body:{ message:'The quantity must be a whole number' } } }
      if (asset.amount > 21000000000) { return { status:299, body:{ message:'The quantity must be less than 21B' } } }
    } else {
      asset.amount = 1
    }

    let burn = 10000000000
    let fee = 1000000

    let utxos = []
    try {
      utxos = await rpc.getAddressUtxos(RITO_ADDRESS)
    } catch (err) {
      console.log(err.message)
      return { status:500, body:{ message:err.message } }
    }

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

    let outputs = {}
    if (Math.abs(remaining) > 0) {
      outputs[RITO_ADDRESS] = Math.abs(remaining) / 100000000
    }
    outputs[issue_burn_address] = 100
    outputs[ASSET_ADDRESS] = {"issue":{"asset_name":asset.name,"asset_quantity":Number(asset.amount),"units":0,"reissuable":1,"has_ipfs":1,"ipfs_hash":ipfs_hash}}

    let raw_tx = await rpc.createRawTransaction(inputs, outputs)
    let signed_tx = await signRawTransaction(raw_tx)
    let tx_id = await rpc.sendSignedTx(signed_tx)

    console.log(`created asset ${asset.name}`, asset.amount, ipfs_hash, tx_id)
    return { status:201, body:{ tx_id:tx_id } }
  } catch(err) {
    console.log(err.message)
    return { status:500, body:{ message:err.message } }
  }
}
