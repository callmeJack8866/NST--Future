export default () => ({
    port: parseInt(process.env.PORT || '3003', 10) || 3003,
    database: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10) || 5432,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
    },
    blockchain: {
      rpcUrl: process.env.RPC_URL,
      contractAddress: process.env.CONTRACT_ADDRESS,
      chainId: parseInt(process.env.CHAIN_ID || '97', 10) || 97,
      startBlock: parseInt(process.env.START_BLOCK || '77256600', 10) || 77256600,
      batchSize: parseInt(process.env.INDEXER_BATCH_SIZE || '1000', 10) || 1000,
      pollInterval: parseInt(process.env.INDEXER_POLL_INTERVAL || '5000', 10) || 5000,
      usdtAddress: process.env.USDT_ADDRESS || '0x0D2bD51872384C5c1Dc169581a2A8Aa9Df701Db7',
      usdcAddress: process.env.USDC_ADDRESS || '0x3c1b8f4712B6282d4ace3361EC618A4cAA2D3A2b',
    },
    frontend: {
      url: process.env.FRONTEND_URL || 'http://localhost:3002',
    },
  });