module.exports = () => ({
  // index.ejs
  index: {
    title: process.env.APP_NAME,
  },
  "contact/menu": {}, // contact/menu.ejs

  "blog/$id": (params) => ({
    blogId: params.id,
  }), // blog/$id.ejs

  "article/$name": ({ name }) => ({
    name,
  }), // blog/$id.ejs
});
