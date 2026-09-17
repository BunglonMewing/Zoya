/** @type {import('@capacitor/cli').CapacitorConfig} */
const config = {
  appId: 'com.zoyaai.app',
  appName: 'Zoya AI',
  webDir: 'dist',
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
  },
  server: {
    androidScheme: 'https',
    cleartext: true,
    allowNavigation: [
      'zoyanz-api.vercel.app',
      'api.cobalt.tools',
      'noembed.com',
      'corsproxy.io',
    ],
  },
  plugins: {
    CapacitorHttp: { enabled: true },
  },
};

module.exports = config;
