const { z } = require('zod');

const albumSchema = z.object({
  titulo: z.string().min(1, 'El titulo es obligatorio'),
  artista: z.string().min(1, 'El artista es obligatorio'),
  genero: z.string().min(1, 'El genero es obligatorio'),
  anio: z.number().int('El anio debe ser un numero entero').min(1900, 'El anio debe ser valido'),
  sello: z.string().min(1, 'El sello es obligatorio'),
  pistas: z.number().int('Las pistas deben ser un numero entero').positive('La cantidad de pistas debe ser positiva'),
  imagen: z.string().min(1, 'La imagen es obligatoria'),
  resumen: z.string().min(1, 'El resumen es obligatorio'),
  descripcion: z.string().min(1, 'La descripcion es obligatoria')
});

module.exports = {
  albumSchema
};
