# Fast EJS Builder

![Fast EJS](logo.png)

[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://img.shields.io/npm/v/fast-ejs-builder.svg)](https://www.npmjs.com/package/fast-ejs-builder)

A fast and lightweight static site generator that combines EJS templating with Tailwind CSS for rapid web development.

## Features

- **Fast Builds**: Optimized build process with configurable intervals
- **Tailwind CSS Integration**: Automatic CSS generation and processing
- **Component System**: Reusable EJS components for modular development
- **Data Injection**: Support for JavaScript and JSON data files
- **Development Mode**: Live reloading with watch functionality
- **Flexible Configuration**: JSON-based configuration with schema validation
- **Index Routing**: Automatic `index.html` generation for clean URLs

## Installation

### Global Installation (Recommended)

```bash
npm install -g fast-ejs-builder
```

### Local Installation

```bash
npm install fast-ejs-builder --save-dev
```

## Quick Start

1. **Initialize your project:**

   ```bash
   mkdir my-site && cd my-site
   ```

2. **Create your project structure:**
   This is the recommended structure. You can use your own.

   ```txt
   my-site/
   ├── components/     # Reusable EJS components
   ├── data/          # Global and local data files
   └── pages/         # EJS templates
   │       └── public/            # Static assets
   └── fast.ejs.json      # Configuration file
   ```

3. **Configure your site** in `fast.ejs.json`:

   ```json
   {
     "build": {
       "output": "build",
       "interval": 100,
       "useIndexRouting": true
     },
     "components": {
       "dir": "components",
       "autoGenerate": false
     },
     "data": {
       "dir": "data",
       "allow": "all"
     },
     "pages": {
       "dir": "pages"
     },
     "tailwind": {
       "output": "public/app.css",
       "imports": []
     }
   }
   ```

4. **Start development:**

   ```bash
   fast-ejs dev
   ```

5. **Build for production:**

   ```bash
   fast-ejs build
   ```

### With local Installation

- Add fast-ejs-builder to your dev dependencies

```bash
npm install fast-ejs-builder --save-dev
```

- Add the build and dev scripts in your `package.json`

```json
{
  "scripts:": {
    "dev": "fast-ejs dev",
    "build": "fast-ejs build"
  }
}
```

- Run your package

```bash
npm run dev
npm run build
```

## Configuration

The `fast.ejs.json` (occasionnally called _the FEJ_) file controls all aspects of your site generation. Here's a complete configuration example:

```json
{
  "build": {
    "output": "build",
    "interval": 100,
    "useIndexRouting": true
  },
  "components": {
    "dir": "components",
    "autoGenerate": false
  },
  "data": {
    "dir": "data",
    "allow": "all"
  },
  "pages": {
    "dir": "pages"
  },
  "tailwind": {
    "output": "public/app.css",
    "imports": [
      "public/style.css",
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap"
    ]
  }
}
```

### Configuration Options

- **`build.output`**: Directory where generated HTML files are saved
- **`build.interval`**: Milliseconds between rebuilds in development mode
- **`build.useIndexRouting`**: Generate `route/index.html` instead of `route.html`
- **`components.dir`**: Directory containing reusable EJS components
- **`components.autoGenerate`**: Generate missing components. Default is `false`
- **`data.dir`**: Directory for global and page-specific data files
- **`data.allow`**: Data file format (`"js"`, `"json"`, or `"all"`)
- **`pages.dir`**: Directory containing your EJS page templates. **Here is where you should mainly work**.
- **`tailwind.output`**: Path to generated Tailwind CSS file
- **`tailwind.imports`**: Array of external CSS URLs to include

## Usage Examples

### Creating Pages

Create EJS templates in your `pages.dir` directory:

```ejs
<!-- pages/index.ejs -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title><%= title %></title>
  <link rel="stylesheet" href="<%= tailwindCss %>" />
</head>
<body class="bg-gray-100">
  <div class="container mx-auto px-4 py-8">
    <%- include('../components/header') %>
    <!-- or <%- $('header') %> -->
    <main>
      <h1 class="text-4xl font-bold text-gray-900 mb-4"><%= title %></h1>
      <p class="text-lg text-gray-700"><%= description %></p>
    </main>
    <%- $('footer') %>
  </div>
</body>
</html>
```

### Using Components

Create reusable components in your `components.dir`:

```ejs
<!-- components/header.ejs -->
<header class="bg-white shadow-sm">
  <nav class="container mx-auto px-4 py-4">
    <div class="flex items-center justify-between">
      <a href="/" class="text-xl font-bold text-gray-900"><%= siteName %> | <%= $0 %> </a>
      <ul class="flex space-x-4">
        <% navItems.forEach(item => { %>
        <li>
          <a
            href="<%= item.url %>"
            class="text-gray-600 hover:text-gray-900 <%= $cls($route==item.url && 'underline decoration-2 underline-offset-4') %>"
          >
            <%= $if($route === item.url,"»") %>
            <%= item.label %>
          </a>
        </li>
        <% }) %>
      </ul>
    </div>
  </nav>
</header>
```

And use it inside a page or another component by calling:

```ejs
<%- $("header","Some arg") %>
```

Here `$0` has the value of `"Some arg"`. You can pass many args and access them through `$1`,`$2`,...\
Remember that only components can access args data `$x`.

### Passing data to pages

#### 1. Using base data

Fast EJS comes with default data that can't be overrided.

- `$` : _function_\
  Imports a component by its name. Like a 'super include'.

  ```ejs
  <%- $("users/avatar","https://placehold.co/400") %>
  ```

- `$0`,`$1`,... :\
  Return the args passed to a component. **Can be accessed only inside a component, not a page**.\
  In the previous example, we can access `"https://placehold.co/400"` by using `$0` (`0` for the first arg).

  ```ejs
  <!--components/users/avatar.ejs-->
  <img src="<%= $0 %>" class="w-10 aspect-square rounded-full"/>
  ```

- `$async` : _Promise function_\
  Asynchronously imports a component.

  ```ejs
  <%- await $async("dashboard") %>
  ```

- `$route` :\
  Returns the current route relative to the `pages.dir`. In this example, it will return `/home`

  ```ejs
  <!--pages/home.ejs-->
  <%= $route %>
  ```

- `$css` :\
  Automatically imports the relative path of generated tailwind css from `tailwind.output` inside a page. No need to manually write the css path and change everytime.\
  \
  For example, inside `pages/users/profile.ejs`, it can return something like `../../public/app.css`\
  while inside `pages/index.ejs`, it will return something like `./public/app.css`

  ```ejs
  <%- $css %>
  ```

- `$date` :\
  Returns a new Date object.\
  Stop writing year manually.

  ```ejs
  <%= $date.getFullYear() %>
  ```

- `$env` : _function_\
  Get a env variable from `process.env`. Useful to build env based pages.

  ```ejs
  <%= $env("NODE_ENV") %>
  ```

- `$cls` : _function_\
  Same behavior as `tailwind clsx`. Useful to write conditions based classes.

  ```ejs
  <%= $cls(isActive && "text-primary", "bg-gray-100") %>
  ```

- `$if` : _function_\
  Returns a value based on a condition or a default value if set. Can also works with components :=)

  ```ejs
  <%- $if(isActive, $("active-bar")) %>
  <%= $if($env("NODE_ENV")=="prod", "Hello","World") %>
  ```

- `$debug` : _function_\
  Prints anything in the console during build. Use it to debug your pages or components

  ```ejs
  <!--components/header.ejs-->
  <%- $debug("Header component says hi !") %>
  ```

- `$upper`,`$lower` and `$trim` : _functions_
  Utils for strings.

  ```ejs
  <%- $trim($upper(user.name)) %>
  ```

#### 2. Using your own data

Fill data files in `data.dir` (generated automatically if missing).

- **Global data** : Can be accessed inside every pages and components

If `data.allow` is `all` or `js` (recommended)

```javascript
// data/global.data.js
module.exports = {
  siteName: "My Awesome Site",
  navItems: [
    { label: "Home", url: "/" },
    { label: "About", url: "/about" },
    { label: "Contact", url: "/contact" },
  ],
  add: (a, b) => a + b,
  getUsers: async () => await db.getUsers(),
};
```

If `data.allow` is `all` or `json`

```js
// data/global.data.json
 {
  "siteName": "My Awesome Site",
  "navItems": [
    { "label": "Home", "url": "/" },
    { "label": "About", "url": "/about" },
    { "label": "Contact", "url": "/contact" },
  ],
}
```

- **Local data** : Can be accessed only in the target page

```javascript
// data/local.data.js
module.exports = {
  // for page "pages/users/profile.ejs"
  "users/profile": {
    title: "Welcome to My Site",
    description: "This is a fast-ejs powered website with Tailwind CSS.",
  },
};
```

**Note that all JS data can be asynchronous, and each asynchronous data will affect the build time.**

## Commands

- **`fast-ejs dev`**: Start development server with live reloading
- **`fast-ejs build`**: Build static files for production

## How it works

Here is the real building flow :

- Get the data inside `data.dir` that match the `data.allow`.
- Scan the specified `pages.dir`.
  - All empty folder will be ignored
  - If any `.ejs` file is found, render the html with the corresponding data and generate the right file inside `build.output` depending on `build.useIndexRouting`.
  - For any other file, just copy it inside the `build.output`.
- Generate the css with tailwind at `tailwind.output` along with `tailwind.imports` if specified.
- Scan the `build.output` and clean all junk files and folders (files from previous build and empty folders).

Notice that all empty folders inside `pages.dir` will be ignored in the build.

## Usage tips

- **Prefer using JS data**

By setting `data.allow` to `json`, you allow only json data. But in real case you'll mostly need js data because you can write logic inside.\
By example, using this:

```json
{
  "year": 2026
}
```

is less effective that using:

```js
module.exports = {
  year: new Date().getFullYear(),
};
```

because in the second case, `year` can change at build time.\
Also js data can be async which is useful to get data from a database. So prefer setting `data.allow` to `all` or `js` when you need dynamic data.

- **Duplicate data**
  - If `data.allow` is `all`, js data are prioritized over json data.
    In the [previous example](#usage-tips), if `year` is in both js and json file, the js one will be used.
  - You can't override base data. For example, declaring `$route` will have no effect.

- **Don't misuse EJS tags**

```ejs
<!-- Avoid this ❌ -->
<% $("header")%>
<%= $css %>
<%- user.name %>
```

Using `<%` means you're not expecting an output but `$("header")` should return a component.
Using `<%=` means you're expecting an escaped value but `$css` requires to be unescaped.
Using `<%-` means you're expecting an unescaped but `user.name` may return a string.

- **Don't put components or data directory inside the pages directory**

Any file inside the pages dir is considered a static file cause this directory is scanned to find ejs files and other files to generate an output.

`pages.dir` contains files that will be built (ejs, images, css, etc..)
`components.dir` contains parts of pages. Not pages.
`data.dir` contains data that will be used by the pages.

Therefore, adding components dir inside the pages dir, means components will be generated as pages and data dir files will be generated as static files.

- **Fast EJS is a builder / generator. Not a framework**

Because of some features like access of the current route (`$route`) or usage of async data, you might think you're using a kind of framework. But no. You're basically coding ejs templates with 'super powers', and something is generating the html and css files for you.

When someone visit your site, he will just see the static files early built. Even if some of your data are retrieved at build time, they can't change once the build is done.

So, you're not using a big framework that will run your SaaS.\
Please consider using this for small projects like static portfolios or landing pages.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

If you have any questions or need help, please open an issue on [GitHub](https://github.com/D3R50N/fast-ejs/issues).
