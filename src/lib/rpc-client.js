import dotenv from 'dotenv'
dotenv.config()
const { RPC_HOST, RPC_PORT, RPC_USER, RPC_PASS } = process.env

import RpcClient from 'ravend-rpc'
const rpcClient = new RpcClient({ protocol:'http', host:RPC_HOST, port:RPC_PORT, user:RPC_USER, pass:RPC_PASS })

export function listAssets(prefix) {
  return new Promise(async (resolve, reject) => {
    rpcClient.listassets((err, ret) => {
      if (err) {
        reject(err)
      } else {
        let assets = ret.result
        if (prefix) {
          assets = assets.filter(a => a.startsWith(prefix))
        }
        assets = assets.sort((a, b) => (a > b) ? 1 : -1)
        resolve(assets)
      }
    })
  })
}

export function getAssetData(name) {
  return new Promise(async (resolve, reject) => {
    rpcClient.getassetdata(name, (err, ret) => {
      if (err) {
        reject(err)
      } else {
        resolve(ret.result)
      }
    })
  })
}

export function getRawTransaction(txid) {
  return new Promise(async (resolve, reject) => {
    rpcClient.getrawtransaction(txid, true, (err, ret) => {
      if (err) {
        reject(err)
      } else {
        resolve(ret.result)
      }
    })
  })
}

export function getAssetDataWithMempool(name, address) {
  return new Promise(async (resolve, reject) => {
    rpcClient.getassetdata(name, (err, ret) => {
      if (err) {
        reject(err)
      } else {
        let asset_data = ret.result
        rpcClient.getaddressmempool({addresses:[address]}, true, async (err, ret) => {
          if (err) {
            console.log(err)
            reject(err)
          } else {
            let entries = ret.result.filter(tx => tx.assetName == name)
            entries = entries.sort((a, b) => a.timestamp > b.timestamp)
            for (let i=0; i<entries.length; i++) {
              let tx = await getRawTransaction(entries[i].txid)
              let vouts = tx.vout.filter(vout => (vout.scriptPubKey.type == 'new_asset' || vout.scriptPubKey.type == 'reissue_asset') && vout.scriptPubKey.asset.name == name)
              if (vouts[0]) {
                asset_data.amount += vouts[0].scriptPubKey.asset.amount
                asset_data.ipfs_hash = vouts[0].scriptPubKey.asset.ipfs_hash
              }
            }
            resolve(asset_data)
          }
        })
      }
    })
  })
}

export function getAdminAssetAddress(name) {
  return new Promise(async (resolve, reject) => {
    rpcClient.listaddressesbyasset(name+'!', (err, ret) => {
      if (err) {
        reject(err)
      } else {
        resolve(Object.keys(ret.result)[0])
      }
    })
  })
}

export function getAddressUtxos(address) {
  return new Promise((resolve, reject) =>
    rpcClient.getaddressutxos({addresses:[address]}, (err, ret) => {
      if (err) {
        console.log(err)
        reject(err)
      } else {
        let utxos = ret.result
        rpcClient.getaddressmempool({addresses:[address]}, (err, ret) => {
          if (err) {
            console.log(err)
            reject(err)
          } else {
            let spent_utxos = ret.result.map(utxo => utxo.prevtxid ? `${utxo.prevtxid}.${utxo.prevout}` : null)
            ret.result.forEach(utxo => {utxos.push({address:utxo.address, assetName:utxo.assetName, txid:utxo.txid, outputIndex:utxo.index, satoshis:utxo.satoshis, prevtxid:utxo.prevtxid, prevout:utxo.prevout})})
            utxos = utxos.filter(utxo => utxo.satoshis>0 && !spent_utxos.includes(`${utxo.txid}.${utxo.outputIndex}`))
            utxos = utxos.sort((a, b) => (parseInt(a.satoshis) > parseInt(b.satoshis)))
            if (utxos.length == 0) {
              console.log('No utxos found')
              reject('No utxos found')
            } else {
              resolve(utxos)
            }
          }
        })
      }
    })
  )
}

export function getTxOut(txid, index) {
  return new Promise((resolve, reject) =>
    rpcClient.gettxout(txid, index, (err, ret) => {
      if (err) {
        console.log(err)
        reject(err)
      } else {
        resolve(ret.result)
      }
    })
  )
}

export function getAssetUtxos(address, asset_name) {
  return new Promise((resolve, reject) =>
    rpcClient.getaddressutxos({'addresses':[address], 'assetName':asset_name}, (err, ret) => {
      if (err) {
        console.log(err)
        reject(err)
      } else {
        resolve(ret.result)
      }
    })
  )
}

export function createRawTransaction(inputs, outputs) {
  return new Promise((resolve, reject) =>
    rpcClient.createrawtransaction(inputs, outputs, async (err, ret) => {
      if (err) {
        console.log(err)
        reject(err)
      } else {
        resolve(ret.result)
      }
    })
  )
}

export function signRawTransaction(raw_tx, prev_txs, priv_keys) {
  return new Promise((resolve, reject) =>
    rpcClient.signrawtransaction(raw_tx, prev_txs, priv_keys, async (err, ret) => {
      if (err) {
        console.log(err)
        reject(err)
      } else {
        resolve(ret.result)
      }
    })
  )
}

export function sendSignedTx(signed_tx) {
  return new Promise((resolve, reject) =>
    rpcClient.sendrawtransaction(signed_tx, (err, ret) => {
      if (err) {
        console.log(err)
        reject(err)
      } else {
        resolve(ret.result)
      }
    })
  )
}
