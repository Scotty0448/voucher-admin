<script>
  import { onMount } from 'svelte'

  export let recipient_address
  export let state

  let html5QrCode

  function onSuccess(qrMessage) {
    html5QrCode.stop()
    recipient_address = qrMessage
    state = ''
  }

  function onError(error) {
  	console.warn('QR scan error: ', error)
  }

  function cancelSend() {
    html5QrCode.stop()
    state = ''
  }

  onMount(async function() {
    html5QrCode = new Html5Qrcode("reader")
    html5QrCode.start({ facingMode: "environment" }, { fps:10, qrbox:250 }, onSuccess, onError)
  })
</script>

<div id="scanner" class="bg-white text-center">
  <div id="reader"></div>
  <button class="w-32 mt-4 mb-1 bg-gray-100 rounded font-medium border border-gray-300 py-1 px-4 text-sm focus:outline-none border:outline-none text-gray-800 mx-1" on:click={cancelSend}>Cancel Scan</button>
</div>
