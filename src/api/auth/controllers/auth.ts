/**
 * A set of functions called "actions" for `auth`
 */

export default {
  // exampleAction: async (ctx, next) => {
  //   try {
  //     ctx.body = 'ok';
  //   } catch (err) {
  //     ctx.body = err;
  //   }
  // }
  create: async (ctx, next) => {
    const { username, email, password, accountType, name, last_name, phone } =
      ctx.request.body;

    if (
      !username ||
      !email ||
      !password ||
      !accountType ||
      !name ||
      !last_name ||
      !phone
    ) {
      return ctx.throw(400, "Faltan datos");
    }

    let roleType;

    if (accountType === "medic") roleType = "medics";
    else if (accountType === "store") roleType = "stores";
    else return ctx.throw(400, "Tipo de cuenta inválido");

    const role = await strapi.db
      .query("plugin::users-permissions.role")
      .findOne({ where: { type: roleType } });

    if (!role) {
      return ctx.throw(400, "Rol no encontrado");
    }

    // Crear usuario
    const user = await strapi.plugin("users-permissions").service("user").add({
      username,
      email,
      password,
      name,
      last_name,
      phone,
      role: role.id,
      confirmed: true,
    });

    // Emitir JWT como Strapi
    const jwt = strapi
      .plugin("users-permissions")
      .service("jwt")
      .issue({ id: user.id });

    return {
      jwt,
      user,
    };
  },
};
