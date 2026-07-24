import { factories } from "@strapi/strapi";

export default factories.createCoreController(
  "api::doctor-invitation.doctor-invitation",
  ({ strapi }) => ({
    async accept(ctx) {
      const { id } = ctx.params;
      const { data } = ctx.request.body;

      const invitation = await strapi
        .documents("api::doctor-invitation.doctor-invitation")
        .findOne({
          documentId: id,
          status: "published",
          populate: {
            headquarter: true,
            doctor: true,
            veterinarian: true,
          },
        });
      if (!invitation) {
        return ctx.notFound("Invitación no encontrada");
      }

      await strapi
        .documents("api::doctor-invitation.doctor-invitation")
        .update({
          documentId: id,
          data: {
            status: data.status,
          },
        });

      if (data.status == "accepted") {
        const doctor = await strapi.documents("api::doctor.doctor").findFirst({
          filters: {
            user: {
              id: invitation.doctor.id,
            },
          },
        });
        // actualizar doctor
        await strapi.documents("api::doctor.doctor").update({
          documentId: doctor.documentId,
          data: {
            headquarter: invitation.headquarter.id,
            veterinarian: invitation.veterinarian.id,
          },
        });
      }
      await strapi
        .documents("api::doctor-invitation.doctor-invitation")
        .delete({
          documentId: invitation.documentId,
        });

      return { message: "Invitación actualizada con exito" };
    },
  }),
);
