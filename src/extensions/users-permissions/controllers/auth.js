"use strict";

const utils = require("@strapi/utils");
const {
  validateCallbackBody,
} = require("@strapi/plugin-users-permissions/server/controllers/validation/auth");
const { ApplicationError } = utils.errors;

module.exports = {
  async callback(ctx) {
    const provider = ctx.params.provider || "local";

    if (provider === "local") {
      await validateCallbackBody(ctx.request.body);

      const { identifier, password } = ctx.request.body;

      const user = await strapi
        .plugin("users-permissions")
        .service("user")
        .fetch({ identifier });

      if (!user) {
        throw new ApplicationError("Invalid identifier or password");
      }

      const validPassword = await strapi
        .plugin("users-permissions")
        .service("user")
        .validatePassword(password, user.password);

      if (!validPassword) {
        throw new ApplicationError("Invalid identifier or password");
      }

      // ⭐ NEW: cargar relación del rol
      const fullUser = await strapi.db
        .query("plugin::users-permissions.user")
        .findOne({
          where: { id: user.id },
          populate: ["role"],
        });

      const jwt = strapi
        .plugin("users-permissions")
        .service("jwt")
        .issue({ id: user.id });

      return {
        jwt,
        user: fullUser, // ← aquí incluirá el role
      };
    }
  },
};
