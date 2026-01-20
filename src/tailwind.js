const fs = require("fs");
const path = require("path");
const postcss = require("postcss");
const tailwindcss = require("tailwindcss");
const autoprefixer = require("autoprefixer");
const { _p, _e, _w, _js, _ce } = require("../core");
const { config, configTailwindOutput } = require("../core/lib");

const twConfigPath = "tailwind.config.js";
function loadUserTailwindConfig() {
  if (!_e(twConfigPath)) return null;

  const resolved = require.resolve(_p(twConfigPath));
  delete require.cache[resolved];

  return require(resolved);
}

function mergeTailwindConfig(base, user) {
  if (!user) return base;

  return {
    ...base,
    ...user,

    content: Array.from(
      new Set([...(base.content || []), ...(user.content || [])]),
    ),

    theme: {
      ...base.theme,
      ...user.theme,

      extend: {
        ...(base.theme?.extend || {}),
        ...(user.theme?.extend || {}),
      },
    },

    plugins: [...(base.plugins || []), ...(user.plugins || [])],
  };
}

async function buildTailwind() {
  const inputCss = path.join(__dirname, "../templates/tailwind.css");
  const outputCss = configTailwindOutput();

  const tracker = (dir, ext = "ejs,html") => {
    const oneExt = ext.split(",").length == 1;
    const suffix = oneExt ? ext : `{${ext}}`;

    return `./${dir}/**/*.${suffix}`;
  };
  const baseConfig = {
    darkMode: "class",
    content: [
      tracker(config.pages.dir),
      tracker(config.components.dir),
      tracker(
        config.data.dir,
        ["js", "json"].includes(config.data.allow)
          ? config.data.allow
          : "js,json",
      ),
    ],
    theme: {
      extend: {},
    },
    plugins: [],
  };

  if (!_e(twConfigPath))
    _w(
      twConfigPath,
      `/** @type {import('tailwindcss').Config} */
module.exports = ${_js(baseConfig)};
`,
    );

  const userConfig = loadUserTailwindConfig();
  const finalConfig = mergeTailwindConfig(baseConfig, userConfig);

  let css = fs.readFileSync(inputCss, "utf8");
  const tailwindOutput = path.dirname(configTailwindOutput());
  let imported = "";
  for (let style of config.tailwind.imports) {
    const style_path = _p(`${config.build.output}/${style}`);
    const relative_path = path.relative(tailwindOutput, style_path);
    imported += `@import "./${relative_path}";\n`;
  }
  css = `${imported}\n${css}`;

  const result = await postcss([
    tailwindcss(finalConfig),
    autoprefixer(),
  ]).process(css, {
    from: inputCss,
    to: outputCss,
  });

  fs.mkdirSync(path.dirname(outputCss), { recursive: true });
  fs.writeFileSync(outputCss, result.css);
}

module.exports = buildTailwind;
