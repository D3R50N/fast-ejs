const fs = require("fs");
const path = require("path");

const root = process.cwd();
const args = process.argv.slice(2);

const _p = (pathname) => path.join(root, path.relative(root, pathname ?? ""));
const _e = (pathname) => fs.existsSync(_p(pathname));
const _ext = (pathname) => path.extname(pathname).slice(1);
const _name = (pathname) => path.parse(pathname).name;
const _rd = (dirname) => {
  try {
    dirname ??= "";
    const f = fs.readdirSync(_p(dirname));

    return f.map((s) => {
      const fullpath = _p(`${dirname}/${s}`);
      const _ = path.join(dirname, s);
      const stats = fs.statSync(_);
      return {
        name: _name(s),
        fullpath,
        path: _,
        isDir: stats.isDirectory(),
        ext: _ext(s),
      };
    });
  } catch (e) {
    return [];
  }
};
const _tree = (dirname) => {
  const files = _rd(dirname);
  if (files.length == 0) return [];

  for (let dir of files.filter((f) => f.isDir)) {
    files.push(..._tree(dir.path));
  }

  return files;
};
const _ce = (pathname, message = "") => {
  if (!_e(pathname)) {
    _d(`\x1b[33m${message} '${pathname}' not found`);
    return false;
  }
  return true;
};

const _js = (data) => JSON.stringify(data, null, 2);

const _md = (pathname, isDir = true) => {
  const p = _p(pathname);
  const dir = isDir ? p : path.dirname(p);
  fs.mkdirSync(dir, { recursive: true });
};

const _w = (pathname, data, force = false) => {
  if (!force && _e(pathname)) return false;
  try {
    const parsed = typeof data == "object" ? _js(data) : data;
    _md(pathname, false);
    fs.writeFileSync(_p(pathname), parsed, { encoding: "utf8" });
    return true;
  } catch (error) {
    return false;
  }
};

const _r = (pathname, json = true) => {
  if (_e(pathname)) {
    const data = fs.readFileSync(_p(pathname), { encoding: "utf8" });
    return json ? JSON.parse(data) : data;
  }
  return null;
};
const _d = (...messages) => {
  let obj = "";
  for (let message of messages) {
    obj += typeof message == "object" ? _js(message) : message;
    obj += " ";
  }
  obj = obj.trim();
  console.log(`\x1b[1m\x1b[35m[Fast EJS]\x1b[0m \x1b[1m${obj}\x1b[0m`);
};

const _ds = (...messages) => _d("\x1b[32m✔\x1b[0m\x1b[1m", ...messages);

const _cp = (i, o) => fs.copyFileSync(_p(i), _p(o));

const _has = (obj, k) => Object.hasOwn(obj, k);

const _v = async (v, ...args) =>
  typeof v === "function" ? await v(...args) : v;

module.exports = {
  _ce,
  _cp,

  _d,
  _ds,
  _e,
  _ext,
  _has,
  _js,
  _md,
  _p,
  _r,
  _rd,
  _tree,
  _name,
  _v,
  _w,
  args,
  root,
};
