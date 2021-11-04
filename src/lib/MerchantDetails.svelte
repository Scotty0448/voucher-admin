<script>
  import { authorized }         from '$lib/local_stores.js'
  import { root_asset, assets } from '$lib/stores.js'
  import Spinner                from '$lib/Spinner.svelte'

  export let selected_merchant_name
  export let state

  let asset
  let message = ''
  let error_message = ''
  let wait = false

  let files

  $: init(selected_merchant_name)

  function init(selected_merchant_name) {
    asset = { name:`${$root_asset}/`, info:{} }
    if (selected_merchant_name != '') {
      asset = $assets[selected_merchant_name]
      if (!asset.info) {
        asset.info = {}
      }
    }
    message = ''
    error_message = ''
  }

  async function getLogoDataURL() {
    return new Promise((resolve, reject) => {
      try {
        const reader = new FileReader()
        reader.onload = () => {
          resolve(reader.result)
        }
        reader.readAsDataURL(files[0])
      } catch(err) {
        console.log(err)
        reject(err)
      }
    })
  }

  async function addMerchant() {
    if (!$authorized) {
      error_message = 'You are not authorized to add a merchant.'
      message = ''
      return
    }
    try {
      wait = true
      error_message = ''
      message = ''
      if (files && files[0]) {
        asset.info.logo = await getLogoDataURL()
      }
      let resp = await fetch('/api/assets.json', { method:'POST', body:JSON.stringify(asset) })
      let result = await resp.json()
      if (resp.status == 201) {
        document.getElementById('logo_file').value = ''
        asset = {name:`${$root_asset}/`, info:{name:'', address1:'', address2:'', phone:'', logo:''}}
        message = 'Added successfully'
      } else {
        error_message = result.message
      }
    } catch(err) {
      error_message = err.message
    }
    wait = false
  }

  async function updateMerchant() {
    if (!$authorized) {
      error_message = 'You are not authorized to update a merchant.'
      message = ''
      return
    }
    try {
      wait = true
      error_message = ''
      message = ''
      if (files) {
        asset.info.logo = await getLogoDataURL()
      }
      let resp = await fetch(`/api/assets/${asset.name.replace( /\//g, '|' )}.json`, { method:'PUT', body:JSON.stringify(asset) })
      let result = await resp.json()
      if (resp.status == 200) {
        if (files) {
          document.getElementById('logo_file').value = ''
          files = ''
        }
        message = 'Updated successfully'
      } else {
        error_message = result.message
      }
    } catch(err) {
      error_message = err.message
    }
    wait = false
  }
</script>

{#if asset.info}
  <div class="mt-6 max-w-2xl px-4 sm:px-6 lg:px-8">
    <div class="mt-6 sm:mt-5 space-y-6 sm:space-y-3">
      {#if state == 'add'}
        <div class="sm:grid sm:grid-cols-5 sm:gap-4 sm:items-start sm:pt-2 sm:pb-3">
          <label for="asset_name" class="block text-sm font-medium text-gray-800 sm:mt-px sm:pt-2">
            Asset Name
          </label>
          <div class="mt-1 sm:mt-0 sm:col-span-4">
            <input id="asset_name" type="text" bind:value="{asset.name}" class="max-w-lg block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:max-w-xs sm:text-sm border-gray-300 rounded-md">
          </div>
        </div>
      {/if}

      <div class="sm:grid sm:grid-cols-5 sm:gap-4 sm:items-start sm:pt-2">
        <label for="merchant_name" class="block text-sm font-medium text-gray-800 sm:mt-px sm:pt-2">
          Merchant Name
        </label>
        <div class="mt-1 sm:mt-0 sm:col-span-4">
          <input id="merchant_name" type="text" bind:value="{asset.info.name}" class="max-w-lg block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:max-w-xs sm:text-sm border-gray-300 rounded-md">
        </div>
      </div>

      <div class="sm:grid sm:grid-cols-5 sm:gap-4 sm:items-start sm:pt-5">
        <label for="address" class="block text-sm font-medium text-gray-800 sm:mt-px sm:pt-2">
          Address
        </label>
        <div if="address" class="mt-1 sm:mt-0 sm:col-span-4">
          <input type="text" bind:value="{asset.info.address1}" placeholder="Street" class="placeholder-gray-500 placeholder-opacity-50 max-w-lg block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:max-w-xs sm:text-sm border-gray-300 rounded-md">
          <input type="text" bind:value="{asset.info.address2}" placeholder="City, State Zip" class="placeholder-gray-500 placeholder-opacity-50 max-w-lg block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:max-w-xs sm:text-sm border-gray-300 rounded-md mt-2">
        </div>
      </div>

      <div class="sm:grid sm:grid-cols-5 sm:gap-4 sm:items-start sm:pt-5">
        <label for="phone" class="block text-sm font-medium text-gray-800 sm:mt-px sm:pt-2">
          Phone
        </label>
        <div class="mt-1 sm:mt-0 sm:col-span-4">
          <input id="phone" type="text" bind:value="{asset.info.phone}" class="max-w-lg block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:max-w-xs sm:text-sm border-gray-300 rounded-md">
        </div>
      </div>

      <div class="sm:grid sm:grid-cols-5 sm:gap-4 sm:items-center sm:pt-4">
        <label for="logo_ipfs_id" class="block text-sm font-medium text-gray-800">
          Logo
        </label>
        <div class="mt-1 sm:mt-0 sm:col-span-4">
          <div class="flex items-center">
            <input id="logo_file" type="file" bind:files />
            {#if asset.info.logo}
              <span class="h-12 w-16 ml-6">
                <img src="{asset.info.logo}" alt="">
              </span>
            {/if}
          </div>
        </div>
      </div>

      <div class="sm:grid sm:grid-cols-5 sm:gap-4 sm:items-start sm:pt-5">
        <label for="none"></label>
        <div class="mt-1 sm:mt-0 sm:col-span-4">
          {#if state == 'add'}
            <button on:click={addMerchant} disabled={wait} class="inline-flex justify-center px-4 py-2 shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none">
              <div hidden={!wait} class="pr-2"><Spinner color="white" /></div>
              Add Merchant
            </button>
          {:else}
            <button on:click={updateMerchant} disabled={wait} class="inline-flex justify-center px-4 py-2 shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none">
              <div hidden={!wait} class="pr-2"><Spinner color="white" /></div>
              Update Merchant
            </button>
          {/if}
          <div class="mt-6 text-sm">
            <div class="text-green-700">
              {message}
            </div>
            <div class="text-red-600">
              {error_message}
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
{/if}
