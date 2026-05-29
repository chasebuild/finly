/** @type {import('@babel/core').TransformOptions} */
module.exports = function (api) {
  api.cache(true)
  const plugins = []

  try {
    require.resolve("@tamagui/babel-plugin")
    plugins.push([
      "@tamagui/babel-plugin",
      {
        components: ["tamagui"],
        config: "./src/design-system/tamagui/tamagui.config.ts",
      },
    ])
  } catch {
    // Tamagui plugin is optional until dependencies are installed in this environment.
  }

  return {
    presets: ["babel-preset-expo", "nativewind/babel"],
    plugins,
  }
}
