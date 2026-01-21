const { args, _d, _p } = require("../core");
const ejsbuild = require("../src/build");
const nodemon = require("nodemon");
const { config, getConfig } = require("../core/lib");

async function ejsbuild_dev() {
  await getConfig();

  const toWatch = [
    config.pages.dir,
    config.components.dir,
    config.data.dir,
    ".env",
    "tailwind.config.js",
  ];

  _d("Watching :", toWatch.map((d) => `'${d}'`).join(", "));
  ejsbuild(); // no more needs await

  nodemon({
    watch: toWatch.map(_p),
    delay: config.build.interval,
    ext: "*",
    exec: "",
  });

  nodemon.on("restart", (files) => {
    ejsbuild(1);
  });

  nodemon.on("quit", () => {
    _d("Session ended 🛑");
    process.exit();
  });
}

module.exports = ejsbuild_dev;
