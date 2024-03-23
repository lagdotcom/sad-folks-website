const bundlerPlugin = require("@11ty/eleventy-plugin-bundle");
const { inspect } = require("util");

const sass = require("sass");

/** @arg {import('@11ty/eleventy').UserConfig} eleventyConfig */
module.exports = function (eleventyConfig) {
  eleventyConfig.addPlugin(bundlerPlugin, {
    transforms: [
      async function (content) {
        if (this.type === "css") return sass.compileString(content).css;

        return content;
      },
    ],
  });

  eleventyConfig.addPassthroughCopy("src/images");

  eleventyConfig.addShortcode("inspect", inspect);

  eleventyConfig.addShortcode("cur", function (url) {
    const match = url.endsWith("/")
      ? this.page.url === url
      : this.page.url.startsWith(url);
    if (match) return 'aria-current="page"';
  });

  return {
    dir: { input: "src" },
  };
};
