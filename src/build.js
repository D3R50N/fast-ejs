/**
 * @typedef { {name: string, fullpath: string, path: string, isDir: boolean; ext: string} } File
 */

const fs = require("fs");
const ejs = require("ejs");
const path = require("path");
const {
  _has,
  args,
  _d,
  _e,
  _p,
  _r,
  root,
  _tree,
  _md,
  _w,
  _ds,
  _cp,
} = require("../core");
const {
  getConfig,
  generateBaseDirs,
  config,
  getDatas,
  configTailwindOutput,
} = require("../core/lib");
const buildTailwind = require("./tailwind");
const formatHtml = require("./prettier");

async function ejsbuild(code = 0) {
  require("dotenv").config({ quiet: true, override: true });

  const rebuilt = code != 0;
  await getConfig();

  if (rebuilt) _d("◌ Rebuilding...");
  else _d(`◌ Building HTML to '${config.build.output}'`);
  const start = new Date();

  generateBaseDirs();
  const { globalData, localData } = await getDatas();

  /** @param {File } file */
  function getOutputName(file) {
    let normalized = path
      .relative(config.pages.dir, file.path)
      .replaceAll(path.sep, "/");
    if (file.ext != "ejs") return { normalized, original: normalized };
    normalized = normalized.replace(path.extname(normalized), "");

    const original = normalized;
    if (
      config.build.useIndexRouting &&
      normalized != "index" &&
      !normalized.endsWith("/index")
    )
      normalized += "/index";

    return { normalized, original };
  }

  // generate tailwind file only if detected any view
  if (
    _tree(config.pages.dir).filter((f) => !f.isDir && f.ext == "ejs").length > 0
  ) {
    await buildTailwind();
  }

  const pages_files = _tree(config.pages.dir).filter((f) => !f.isDir);

  const allOutputNames = pages_files.map((f) => getOutputName(f));
  const built = [];

  /** @param {File } file */
  async function writeFile(file) {
    const outputName = getOutputName(file);
    const hasConflict = !!allOutputNames.find(
      (f) => f.original == outputName.normalized,
    );

    const outputBase = hasConflict
      ? outputName.original
      : outputName.normalized;
    let output = _p(`${config.build.output}/${outputBase}`);
    if (file.ext != "ejs") {
      _md(output, false);
      _cp(file.fullpath, output);
      built.push(output);
      return;
    }
    output += ".html";
    try {
      const data = {
        ...globalData,
        ...(localData[outputName.original] ?? {}),
      };

      const getComponent = (component, ...args) => {
        if (!component.endsWith(".ejs")) component += ".ejs";
        const content = _r(`${config.components.dir}/${component}`, false);
        if (!content) throw new Error("Component not found.");
        const component_data = {};
        for (let i in args) {
          component_data[`$${i}`] = args[i];
        }

        return { content, component_data };
      };
      // NOTE - Reserved keywords
      const context = (d = {}) =>
        new Proxy(d, {
          get(target, prop) {
            if (prop in target) return target[prop];
            return null;
          },
        });

      const defaultData = {
        $: (component, ...args) => {
          try {
            const { content, component_data } = getComponent(
              component,
              ...args,
            );
            const comp_render = ejs.render(
              content,
              context({
                ...data,
                ...component_data,
                ...defaultData, // auto ref
              }),
            );
            return comp_render;
          } catch (error) {
            _d(`\x1b[31mFailed to build component '${component}'`);
            console.log("\x1b[31m", error.message, "\x1b[0m");
          }
        },
        $async: async (component, ...args) => {
          try {
            const { content, component_data } = getComponent(
              component,
              ...args,
            );
            const comp_render = await ejs.render(
              content,
              context({
                ...data,
                ...component_data,
                ...defaultData, // auto ref
              }),
              { async: true },
            );
            return comp_render;
          } catch (error) {
            _d(`\x1b[31mFailed to build component '${component}'`);
            console.log("\x1b[31m", error.message, "\x1b[0m");
          }
        },
        $env: (k) => process.env[k],
        $upper: (v = "") => String(v).toUpperCase(),
        $lower: (v = "") => String(v).toLowerCase(),
        $trim: (v = "") => String(v).trim(),
        $if: (b, y, n) => (Boolean(b) ? y : n),
        $cls: (...classes) => classes.filter(Boolean).join(" "),
        $debug: (...args) => {
          console.log(...args);
          return "";
        },

        get $route() {
          return (
            "/" + path.relative(_p(config.build.output), path.dirname(output))
          );
        },

        get $css() {
          let o = path
            .relative(path.dirname(_p(output)), configTailwindOutput())
            .replaceAll("\\", "/");

          return `<link rel="stylesheet" href="${o}" />`;
        },
        get $date() {
          return new Date();
        },
      };
      const out = await ejs.renderFile(
        file.fullpath,
        context({
          ...data,
          ...defaultData,
        }),
        { async: true, beautify: false },
      );
      _w(
        `${output}`,
        (await formatHtml(out)).replace(/^\s*[\r\n]/gm, ""),
        true,
      );
      built.push(`${output}`);
    } catch (error) {
      _d(`\x1b[31mFailed to build page '${file.name}.html'`);
      console.log("\x1b[31m", error.message, "\x1b[0m");
    }
  }

  await Promise.all(pages_files.map((file) => writeFile(file)));

  const end = new Date();

  const time = `\x1b[35m${end - start}ms\x1b[0m`;

  const suffix = (arr = [], s = "file") =>
    arr.length + " " + (arr.length > 1 ? `${s}s` : s);

  if (rebuilt) {
    _ds(`Rebuilt ${suffix(built)} in ${time}`);
  } else {
    if (built.length > 0) {
      _ds(`Built ${suffix(built)} in ${time}`);
    } else {
      _d(`😢 Nothing to build. Ended in ${time}`);
    }
  }

  const junk = _tree(config.build.output).filter(
    (f) =>
      !f.isDir &&
      f.fullpath != _p(configTailwindOutput()) &&
      !built.find((b) => b == f.fullpath),
  );

  for (let file of junk) {
    fs.rmSync(file.fullpath, { force: true, recursive: true });
  }

  const empty_folders = _tree(config.build.output).filter(
    (f) => f.isDir && fs.readdirSync(f.fullpath).length == 0,
  );
  for (let f of empty_folders) {
    fs.rmSync(f.fullpath, { force: true, recursive: true });
  }
  const junk_files = junk.filter((f) => !f.isDir);
  const cleaned_1 =
    junk_files.length > 0 ? `${suffix(junk_files, "junk file")}` : "";

  const cleaned_2 =
    empty_folders.length > 0
      ? `${(cleaned_1 != "" ? " and " : "") + suffix(empty_folders, "empty folder")}`
      : "";

  const cleaned_text = `${cleaned_1}${cleaned_2}`;
  if (cleaned_text != "") {
    _ds(`Cleaned ${cleaned_text}.`);
  }
}

module.exports = ejsbuild;
