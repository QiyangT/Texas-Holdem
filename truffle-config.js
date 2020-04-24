require('babel-register');
require('babel-polyfill');

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7546,
      network_id: "*", // Match any network id
	  gas: 0x1fffffffffffff,  // 9007199254740991
	  gasPrice: 0
    },
  },
  compilers: {
    solc: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  }
}
