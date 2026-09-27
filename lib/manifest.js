(function () {
  "use strict";
  /* Datos de la fotógrafa (FICTICIOS: web de demostración). */
  window.__BRAND__ = {
    name: "Irene Casals · Fotografía",
    city: "Barcelona",
    phone: "+34 000 000 000",
    email: "hola@irenecasals.example",

    /* Calculadora del formulario de presupuesto: precio base por tipo de sesión */
    quote: {
      retrato:   { base: 180,  label: "Retrato",            perHour: 60,  unit: "sesión de 1 h" },
      boda:      { base: 1400, label: "Boda",               perHour: 120, unit: "8 h de cobertura" },
      producto:  { base: 320,  label: "Producto",           perHour: 0,   unit: "hasta 15 productos" },
      marca:     { base: 450,  label: "Marca personal",     perHour: 80,  unit: "media jornada" },
      evento:    { base: 380,  label: "Evento",             perHour: 90,  unit: "3 h de cobertura" },
      arquitectura: { base: 520, label: "Arquitectura e interiores", perHour: 0, unit: "hasta 25 fotos" }
    },
    extras: { album: 290, video: 450, express: 120, desplazamiento: 60 }
  };
})();
