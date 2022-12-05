/* config-overrides.js */
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");

module.exports = function override(config, env) {
  // console.log("override");
  // console.log(config);
  // //do stuff with the webpack config...

  // config.resolve = {
  //   fallback: {
  //     fs: false,
  //   },
  // };

  // config.define = {
  //   "process.env": {},
  // };

  config.plugins = [...config.plugins, new NodePolyfillPlugin()];

  // config.node = {
  //   fs: "empty",
  // };

  return config;
};
