module.exports = {
  async beforeUpdate(event) {
    const { data } = event.params;
    console.log(event);

    // Si viene el campo logo en la actualización
    if (data.document) {
      data.status_vet = "success";
    }
  },
};
