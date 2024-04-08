const bundlerPlugin = require("@11ty/eleventy-plugin-bundle");
const htmlMinifier = require("html-minifier");
const { inspect } = require("util");
const { minify } = require("terser");

const { compileString } = require("sass");
const { env } = require("process");
const { join, dirname, basename, normalize } = require("path");
const { readFile, writeFile, mkdir, readdir } = require("fs/promises");

/** @typedef {'html'|'liquid'|'ejs'|'md'|'hbs'|'mustache'|'haml'|'pug'|'njk'|'11ty.js'} TemplateShortName */

/**
 * @typedef {object} EleventyOptions
 * @prop {{ input?: string, includes?: string, layouts?: string, data?: string, output?: string }} [dir]
 * @prop {TemplateShortName|false} [htmlTemplateEngine]
 * @prop {TemplateShortName[]} [templateFormats]
 * @prop {string} [pathPrefix]
 * @prop {string} [htmlOutputSuffix]
 */

/** @typedef {<T>(config: EleventyConfig, options: T) => void} EleventyPlugin */

/**
 * @typedef {object} RecursiveCopyOptions
 * @prop {boolean} overwrite
 * @prop {boolean} expand
 * @prop {boolean} dot
 * @prop {boolean} junk
 * @prop {function|RegExp|string|string[]} filter
 * @prop {(original: string) => string} rename
 * @prop {(src: string, dest: string, stats) => Promise<string>} transform
 * @prop {boolean} results
 * @prop {number} concurrency
 * @prop {boolean} debug
 */

/**
 * @typedef {object} PageContext
 * @prop {string|false} url
 * @prop {string} fileSlug
 * @prop {string} filePathStem
 * @prop {Date} date
 * @prop {string} inputPath
 * @prop {string} outputPath
 * @prop {string} outputFileExtension
 * @prop {string} lang
 */

/**
 * @typedef {object} EleventyContext
 * @prop {string} version
 * @prop {string} generator
 * @prop {{ root: string, config: string, source: 'cli'|'script', runMode: 'serve'|'watch'|'build' }} env
 * @prop {{ path: Record<string, string|number>, query: Record<string, string|number> }} serverless
 */

/**
 * @typedef {object} TemplateContext
 * @prop {PageContext} page
 * @prop {EleventyContext} eleventy
 */

/**
 * @typedef {object} TransformContext
 * @prop {string} url
 * @prop {PageContext} page
 */

/**
 * @typedef {object} EventData
 * @prop {{ input: string, output: string, includes: string, data: string, layouts: string }} dir
 * @prop {'fs'|'json'|'ndjson'} outputMode
 * @prop {'build'|'watch'|'serve'} runMode
 * @prop {Array<{ inputPath: string, outputPath: string, url: string, content: string }>} results
 */

/**
 * @typedef {object} EleventyConfig
 * @prop {(fileOrDir: string|object, copyOptions?: Partial<RecursiveCopyOptions>) => this} addPassthroughCopy
 * @prop {<T>(plugin: EleventyPlugin<T>, options?: T) => void} addPlugin
 * @prop {(code: string, callback: (this: TemplateContext, ...args: any[]) => string) => void} addFilter
 * @prop {(name: string, callback: (this: TransformContext, content: string) => void) => void} addLinter
 * @prop {(code: string, callback: (this: TemplateContext, ...args: any[]) => string) => void} addPairedShortcode
 * @prop {(code: string, callback: (this: TemplateContext, ...args: any[]) => string) => void} addShortcode
 * @prop {(name: string, callback: (this: TransformContext, content: string, outputPath: string) => string) => void} addTransform
 * @prop {(pattern: string) => void} addWatchTarget
 * @prop {(name: string, callback: (data: EventData)) => void} on
 * @prop {(name: string) => void} setDataFileBaseName
 * @prop {(suffixes: string[]) => void} setDataFileSuffixes
 * @prop {(mode: boolean) => void} setQuietMode
 * @prop {(formats: TemplateShortName[]) => void} setTemplateFormats
 */

/**
 * @param {EleventyConfig} eleventyConfig
 */
function componentsPlugin(eleventyConfig) {
  /** @type {Map<string, Set<string>>} */
  const pageComponents = new Map();

  eleventyConfig.addShortcode("component", function (name) {
    const key = this.page.outputPath;
    const components = pageComponents.get(key) || new Set();
    components.add(name);
    pageComponents.set(key, components);
    return name;
  });

  eleventyConfig.addShortcode("componentScripts", function () {
    const components = pageComponents.get(this.page.outputPath);
    if (components)
      return Array.from(components).map(
        (name) =>
          `<script type="module" src="${eleventyConfig.pathPrefix}js/${name}.js"></script>`
      );
  });

  eleventyConfig.on("eleventy.before", function () {
    pageComponents.clear();
  });

  // compile and copy js
  eleventyConfig.on("eleventy.after", async function ({ dir }) {
    const sourceRoot = join(dir.input, "js");
    const destinationRoot = join(dir.output, "js");
    const encoding = "utf-8";

    for (const name of await readdir(sourceRoot, { recursive: true })) {
      const sourcePath = join(sourceRoot, name);
      const destinationPath = join(destinationRoot, name);
      const destinationMapPath = destinationPath + ".map";
      const destinationDir = dirname(destinationPath);
      await mkdir(destinationDir, { recursive: true });

      const canonicalName = normalize("../" + sourcePath).replace(/\\/g, "/");
      const raw = await readFile(sourcePath, { encoding });
      const { code, map } = await minify(
        { [canonicalName]: raw },
        {
          sourceMap: {
            url: basename(destinationMapPath),
            includeSources: true,
          },
        }
      );

      if (code) {
        await writeFile(destinationPath, code, { encoding });
        console.log(`[js] Writing ${sourcePath} to ${destinationPath}`);
      }

      if (map) {
        await writeFile(destinationMapPath, map, { encoding });
        console.log(`[js] Writing ${destinationMapPath}`);
      }
    }
  });

  eleventyConfig.addWatchTarget("src/js/**/*");
}

/**
 * @param {EleventyConfig} eleventyConfig
 * @returns {EleventyOptions}
 */
module.exports = function (eleventyConfig) {
  eleventyConfig.addPlugin(bundlerPlugin, {
    transforms: [
      async function (content) {
        if (this.type === "css")
          return compileString(content, {
            style: "compressed",
            loadPaths: [
              join(eleventyConfig.dir.input, eleventyConfig.dir.includes),
            ],
          }).css;

        return content;
      },
    ],
  });

  eleventyConfig.addPlugin(componentsPlugin);

  eleventyConfig.addPassthroughCopy("src/images");

  eleventyConfig.addShortcode("inspect", inspect);

  eleventyConfig.addShortcode("cur", function (url) {
    const match = url.endsWith("/")
      ? this.page.url === url
      : this.page.url.startsWith(url);
    if (match) return 'aria-current="page"';
  });

  eleventyConfig.addPairedShortcode("vercel", function (content) {
    if (env.VERCEL) return content;
  });

  eleventyConfig.addTransform("html-minifier", function (content) {
    if (this.page.outputPath && this.page.outputPath.endsWith(".html"))
      return htmlMinifier.minify(content, {
        useShortDoctype: true,
        removeComments: true,
        collapseWhitespace: true,
      });

    return content;
  });

  eleventyConfig.addWatchTarget("./src/**/*.scss");

  return {
    dir: { input: "src" },
  };
};
