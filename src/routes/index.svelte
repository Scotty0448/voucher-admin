<script>
	import { Buffer } from 'buffer'
	import process 		from 'process'
	import md5 				from 'crypto-js/md5.js'

	import { onMount }  	from 'svelte'
	import Merchant				from '$lib/Merchant.svelte'
	import Spinner        from '$lib/Spinner.svelte'

	import { authorized }																				from '$lib/local_stores.js'
	import { coin, block_count, root_asset, assets, balances }  from '$lib/stores.js'

	let selected_merchant_name
	let state = 'list'
	let window_width

	import rdb_ws_client from 'rethinkdb-websocket-client'
  let rdb = rdb_ws_client.rethinkdb

  function syncWithDB(address) {
		rdb_ws_client.connect({host:'wss.rethinkdb.chaintek.net', port:443, path:'/', wsProtocols: ['binary'], secure:true, db:$coin}).then((conn) => {

			rdb.table('info').get('blockcount').run(conn, (err, info) => {
				$block_count = info.value
			})
			rdb.table('info').filter({ key:'blockcount' }).changes().run(conn, (err, changes) => {
				changes.each((err, change) => {
					if (change) {
						$block_count = change.new_val.value
					}
				})
			})

			rdb.table('assets').run(conn, (err, cursor) => {	//.filter((asset)=>{return asset('name').match(`^${$root_asset}/`)})
				cursor.toArray((err, db_assets) => {
					db_assets.forEach(async asset => {
						if (asset.name.startsWith(`${$root_asset}/`)) {
							try { asset.info = JSON.parse(asset.info) } catch(err) {}
							$assets[asset.name] = asset
						}
					})
				})
			})
			rdb.table('assets').changes().run(conn, (err, changes) => {  //.filter((asset)=>{return asset('name').match(`^${$root_asset}/`)})
	      changes.each((err, change) => {
					if (change) {
						if (change.new_val != null) {
							if (change.new_val.name.startsWith(`${$root_asset}/`)) {
								try { change.new_val.info = JSON.parse(change.new_val.info) } catch(err) {}
								$assets[change.new_val.name] = change.new_val
							}
						}
					}
	      })
	    })

      rdb.table('balances').filter({ address:address }).run(conn, (err, cursor) => {
        cursor.toArray((err, db_balances) => {
          db_balances.forEach(async asset_balances => {
						if (asset_balances.asset.startsWith(`${$root_asset}/`)) {
							$balances[asset_balances.asset] = asset_balances
						}
					})
				})
			})
			rdb.table('balances').filter({ address:address }).changes().run(conn, (err, changes) => {
	      changes.each((err, change) => {
					if (change) {
						if (change.new_val.asset.startsWith(`${$root_asset}/`)) {
							if (change.new_val != null) {
								$balances[change.new_val.asset] = change.new_val
							} else {
								$balances[change.old_val.asset].confirmed = 0
								$balances[change.old_val.asset].unconfirmed = 0
							}
						}
					}
	      })
	    })
    })
  }

	onMount(async () => {
		window.Buffer = Buffer
		window.process = process

		let resp
		resp = await fetch(`/api/assets/coin.json`)
		$coin = (await resp.json()).coin.toLowerCase()
		resp = await fetch(`/api/assets/root_asset.json`)
		$root_asset = (await resp.json()).root_asset
		resp = await fetch(`/api/assets/asset_address.json`)
		let asset_address = (await resp.json()).asset_address

		syncWithDB(asset_address)
	})

	async function login() {
		let password = prompt("Enter your password:")
		$authorized = (md5(password) == 'fb1c9e05e53928d05f77f4eab0dc587c')
	}

	async function add_merchant() {
		selected_merchant_name = ''
		state = 'detail'
	}

	async function select_merchant(asset_name) {
		if (merchant_name($assets[asset_name]) != '') {
			selected_merchant_name = asset_name
			state = 'detail'
		}
	}

	function isMerchant(name) {
		return (name.startsWith(`${$root_asset}/`) && name.split('/').length==2)
	}

	function merchant_name(asset) {
		try {
			return asset.info.name || ''
		} catch(err) {
			return ''
		}
	}
</script>

<style>
	.selected { @apply bg-gray-100; }
</style>

<svelte:window bind:innerWidth={window_width}/>

<main>

	<div class="h-screen flex overflow-hidden bg-white">

	  <div class="flex flex-col min-w-0 flex-1 overflow-hidden">
	    <div class="flex-1 relative z-0 flex overflow-hidden">
				{#if window_width >= 768 || state=='detail'}
		      <main class="flex-1 relative z-0 overflow-y-auto focus:outline-none md:order-last" tabindex="0">
						<div class="float-right text-xs text-gray-400 pt-1 pr-1.5">Last block: {$block_count}</div>

		        <!-- Breadcrumb -->
		        <nav class="flex items-start px-4 pt-4 sm:px-6 lg:px-8 md:hidden" aria-label="Breadcrumb">
		          <div on:click="{()=>state='list'}" class="inline-flex items-center space-x-1 text-sm font-medium text-gray-900 cursor-pointer">
		            <!-- Heroicon name: solid/chevron-left -->
		            <svg class="-ml-1.5 h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
		              <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
		            </svg>
		            <span>Merchants</span>
		          </div>
		        </nav>

						{#if (selected_merchant_name == '') || ($assets[selected_merchant_name] != undefined)}
							<Merchant selected_merchant_name={selected_merchant_name} />
						{/if}
		      </main>
				{/if}

				{#if window_width >= 768 || state=='list'}
		      <aside class="order-first flex flex-col flex-shrink-0 w-full max-w-sm sm:w-80 border-r border-gray-200">
						<div class="flex items-between">
			        <div class="pl-4 pt-4 pb-4 w-full">
			          <h2 on:click={login} class="text-xl font-medium text-gray-900">Merchants</h2>
								{#if false}
				          <form class="mt-4 flex space-x-4" action="#">
				            <div class="flex-1 min-w-0">
				              <label for="search" class="sr-only">Search</label>
				              <div class="relative rounded-md shadow-sm">
				                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
				                  <!-- Heroicon name: solid/search -->
				                  <svg class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
				                    <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
				                  </svg>
				                </div>
				                <input type="search" name="search" id="search" class="focus:ring-pink-500 focus:border-pink-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md" placeholder="Search">
				              </div>
				            </div>
				          </form>
								{/if}
			        </div>
							<div>
								<button type="button" on:click="{add_merchant}" class="mt-3 mr-4 w-8 h-8 flex items-center justify-center border border-gray-300 shadow-sm rounded text-green-700 bg-white hover:bg-gray-50 focus:outline-none">
									<!-- Heroicon name: solid/plus -->
									<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
									</svg>
								</button>
							</div>
						</div>

		        <nav class="flex-1 min-h-0 overflow-y-auto border-t border-gray-200" aria-label="Directory">
		          <div class="border-b border-gray-200">
		            <ul class="relative z-0 divide-y divide-gray-200">

									{#each Object.keys($assets).sort() as asset_name}
										{#if isMerchant(asset_name)}
				              <li>
				                <div class="relative px-4 py-3 flex items-center space-x-3 focus-within:bg-gray-200 hover:bg-gray-100" class:selected="{asset_name==selected_merchant_name}">
				                  <div class="flex-1 min-w-0">
				                    <div class="focus:outline-none cursor-pointer" on:click="{()=>select_merchant(asset_name)}">
				                      <!-- Extend touch target to entire panel -->
				                      <span class="absolute inset-0" aria-hidden="true"></span>
															<div class="text-sm font-medium text-gray-900">
																<div class="text-xs text-yellow-600">{asset_name}</div>
																{#if merchant_name($assets[asset_name]) == ''}
																	<div style="float:right"><Spinner color="green" /></div>
																{:else}
																	<div>{merchant_name($assets[asset_name])} &nbsp;</div>
																{/if}
															</div>
				                    </div>
				                  </div>
				                </div>
				              </li>
										{/if}
									{/each}

		            </ul>
		          </div>
		        </nav>
		      </aside>
				{/if}

	    </div>
	  </div>
	</div>

</main>
