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
  async register(ctx) {
    // ... (previous code)

    // Validate and extract data from the request
    const params = {
      ..._.pick(ctx.request.body, allowedKeys),
      provider: "local",
    };

    await validateRegisterBody(params);

    // New code here
    const { role: roleName } = ctx.request.body;
    console.log(roleName);

    // Use a new variable name if 'role' is already taken
    let userRole;
    if (roleName && roleName !== "admin") {
      userRole = await strapi
        .query("plugin::users-permissions.role")
        .findOne({ where: { name: roleName } });
      console.log(userRole);
    }
    if (!userRole) {
      userRole = await strapi
        .query("plugin::users-permissions.role")
        .findOne({ where: { type: settings.default_role } });
    }

    // Create a new user
    const newUser = {
      ...params,
      role: userRole.id, // Use the new variable 'userRole'
      email: params.email.toLowerCase(),
      username: params.username,
      confirmed: !settings.email_confirmation,
    };

    const user = await getService("user").add(newUser);

    const sanitizedUser = await sanitizeUser(user, ctx);

    if (settings.email_confirmation) {
      try {
        await getService("user").sendConfirmationEmail(sanitizedUser);
      } catch (err) {
        strapi.log.error(err);
        throw new ApplicationError("Error sending confirmation email");
      }

      return ctx.send({ user: sanitizedUser });
    }

    const mode = strapi.config.get(
      "plugin::users-permissions.jwtManagement",
      "legacy-support",
    );
    if (mode === "refresh") {
      const deviceId = extractDeviceId(ctx.request.body) || crypto.randomUUID();

      const refresh = await strapi
        .sessionManager("users-permissions")
        .generateRefreshToken(String(user.id), deviceId, { type: "refresh" });

      const access = await strapi
        .sessionManager("users-permissions")
        .generateAccessToken(refresh.token);
      if ("error" in access) {
        throw new ApplicationError("Invalid credentials");
      }

      return ctx.send({
        jwt: access.token,
        refreshToken: refresh.token,
        user: sanitizedUser,
      });
    }

    const jwt = getService("jwt").issue(_.pick(user, ["id"]));
    return ctx.send({ jwt, user: sanitizedUser });
  },
};
