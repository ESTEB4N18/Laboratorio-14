# Laboratorio-14

## Instalacion

```bash
npm install
```

## Variables de entorno

El proyecto usa el archivo `.env`:

```env
HOST=localhost
PORT=4321
```

## Poblar la base de datos

```bash
node database/seed.js
```

Este comando crea `database/database.sqlite`, crea la tabla `albumes` y carga los datos obligatoriamente desde `database/albumes.json`.

## Ejecutar el servidor

Modo desarrollo:

```bash
npm run dev
```


Por defecto la API queda disponible en:

```text
http://localhost:4321
```

## Rutas

- `GET /`
- `GET /albumes`
- `GET /album/:slug`
- `GET /genero/:genero`
- `GET /search/:text`
- `POST /albumes`
- `PUT /album/:slug`
- `DELETE /album/:slug`
- `GET /imagenes/*`


## Codigos HTTP

- `200 OK`: lectura exitosa o actualizacion con `PUT`.
- `201 Created`: creacion exitosa con `POST`. Incluye cabecera `Location`.
- `204 No Content`: eliminacion exitosa con `DELETE`.
- `400 Bad Request`: validacion del cuerpo con Zod fallida.
- `404 Not Found`: album o ruta no encontrada.
- `409 Conflict`: ya existe un album con el mismo slug.

## Ejemplo de album

```json
{
  "titulo": "Thriller",
  "artista": "Michael Jackson",
  "genero": "Pop",
  "anio": 1982,
  "sello": "Epic",
  "pistas": 9,
  "imagen": "thriller.avif",
  "slug": "thriller",
  "resumen": "El album mas vendido de la historia.",
  "descripcion": "Album de Michael Jackson que redefinio la musica pop de los anos 80."
}
```
