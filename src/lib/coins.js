export const coins = {
  RITO: {
    issueAssetBurnAmount: 500,
    reissueAssetBurnAmount: 100,
    issueSubAssetBurnAmount: 100,
    issueUniqueAssetBurnAmount: 5,

    txFeePerKb: 0.01,

    issueAssetBurnAddress: 'BRissueAssetxxxxxxxxxxxxxxxy3AdkDQ',
    reissueAssetBurnAddress: 'BRreissueAssetxxxxxxxxxxxxxxyHdtdA',
    issueSubAssetBurnAddress: 'BRissueSubAssetxxxxxxxxxxxxxynEXEA',
    issueUniqueAssetBurnAddress: 'BRissueUniqueAssetxxxxxxxxxxuNqFtY',

    network: {
      messagePrefix: '\x15Rito Signed Message:\n',
      bip32: {
        public: 0x0534E7CA,
        private: 0x05347EAC,
      },
      pubKeyHash: 0x19,
      scriptHash: 0x69,
      wif: 0x8B
    }
  },
  TRITO: {
    issueAssetBurnAmount: 500,
    reissueAssetBurnAmount: 100,
    issueSubAssetBurnAmount: 100,
    issueUniqueAssetBurnAmount: 5,

    txFeePerKb: 0.01,

    issueAssetBurnAddress: 'n1issueAssetXXXXXXXXXXXXXXXXWdnemQ',
    reissueAssetBurnAddress: 'n1ReissueAssetXXXXXXXXXXXXXXWG9NLd',
    issueSubAssetBurnAddress: 'n1issueSubAssetXXXXXXXXXXXXXbNiH6v',
    issueUniqueAssetBurnAddress: 'n1issueUniqueAssetXXXXXXXXXXS4695i',

    network: {
      messagePrefix: '\x15Rito Signed Message:\n',
      bip32: {
        public: 0x043587CD,
        private: 0x04358391,
      },
      pubKeyHash: 0x6F,
      scriptHash: 0xC4,
      wif: 0xEF
    }
  }
}
