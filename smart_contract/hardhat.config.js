require('@nomiclabs/hardhat-waffle');

module.exports = {
  solidity: '0.8.0',
  networks: {
    ropsten: {
      url: 'https://eth-ropsten.alchemyapi.io/v2/YNqju12yV-KT6sIzN39I-OpPqP1rg1Ug',
      accounts: ['05c17edea4d9be706ca328de6aa18a4ff766dc483a218c9a8c107503495adb96']
    }
  }
}