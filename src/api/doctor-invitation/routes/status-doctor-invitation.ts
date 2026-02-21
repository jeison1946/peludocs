export default {
  routes: [
    {
      method: "POST",
      path: "/doctor-invitations/:id/accept",
      handler: "doctor-invitation.accept",
      config: {
        auth: false,
      },
    },
  ],
};
