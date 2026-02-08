export default {
  routes: [
    {
      method: "POST",
      path: "/register",
      handler: "auth.create",
      config: {
        auth: false,
      },
    },
  ],
  /* routes: [
    // {
    //  method: 'GET',
    //  path: '/auth',
    //  handler: 'auth.exampleAction',
    //  config: {
    //    policies: [],
    //    middlewares: [],
    //  },
    // },
  ], */
};
