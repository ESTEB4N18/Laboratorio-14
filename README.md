# Laboratorio-14

API REST DiscoStore creada con Node.js, Express, SQLite y Zod. Administra el catalogo de albumes de una tienda de musica.

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

Modo normal:

```bash
npm start
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

## Pruebas con xh

```bash
xh GET :4321/
xh GET :4321/albumes
xh GET :4321/album/thriller
xh GET :4321/album/inexistente
xh GET :4321/genero/Rock
xh GET :4321/search/pop
xh POST :4321/albumes titulo="Discovery" artista="Daft Punk" genero="Electronic" anio:=2001 sello="Virgin" pistas:=14 imagen="discovery.avif" resumen="Album clave de la musica electronica." descripcion="Disco de Daft Punk con mezcla de house, pop y sonidos retro."
xh PUT :4321/album/discovery titulo="Discovery" artista="Daft Punk" genero="Electronic" anio:=2001 sello="Virgin" pistas:=14 imagen="discovery.avif" resumen="Album actualizado." descripcion="Version actualizada del album Discovery."
xh DELETE :4321/album/discovery
```

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

## Propuesta de commits incrementales

1. Inicializar proyecto Node
2. Configurar Express
3. Configurar variables de entorno
4. Crear base SQLite
5. Cargar datos desde JSON
6. Endpoint GET /
7. Endpoint GET /albumes
8. Endpoint GET /album/:slug
9. Endpoint GET /genero/:genero
10. Endpoint GET /search/:text
11. Endpoint POST /albumes
12. Endpoint PUT /album/:slug
13. Endpoint DELETE /album/:slug
14. Validaciones con Zod
15. Imagenes estaticas
16. README y referencias
