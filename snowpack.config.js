// Snowpack Configuration File
// See all supported options: https://www.snowpack.dev/reference/configuration

/** @type {import("snowpack").SnowpackUserConfig } */
module.exports = {
  mount: {
    /* ... */
  },
  plugins: [
    ['@snowpack/plugin-typescript'],  
    ['@snowpack/plugin-webpack',
      {
        extendConfig: (config) => {
            config.module.rules = [];
            return config;
        },
      }
    ]
  ],
  packageOptions: {
    /* ... */
  },
  devOptions: {
    open: 'none',
    port: 2022,
    hostname: '0.0.0.0',
  },
  buildOptions: {
    /* ... */
  },
};
