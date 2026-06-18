const fs = require('fs');
const path = require('path');
const express = require('express');
const { ZodError } = require('zod');
const db = require('./db');
const { albumSchema } = require('./validation');

const app = express();

function cargarEnv() {
  const envPath = path.join(__dirname, '..', '.env');

  if (!fs.existsSync(envPath)) {
    return;
  }

  const lineas = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);

  lineas.forEach((linea) => {
    const texto = linea.trim();

    if (!texto || texto.startsWith('#')) {
      return;
    }

    const posicion = texto.indexOf('=');

    if (posicion === -1) {
      return;
    }

    const nombre = texto.slice(0, posicion);
    const valor = texto.slice(posicion + 1);

    if (!process.env[nombre]) {
      process.env[nombre] = valor;
    }
  });
}

function crearSlug(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function consultar(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (error, filas) => {
      if (error) {
        reject(error);
      } else {
        resolve(filas);
      }
    });
  });
}

function consultarUno(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (error, fila) => {
      if (error) {
        reject(error);
      } else {
        resolve(fila);
      }
    });
  });
}

function ejecutar(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (error) {
      if (error) {
        reject(error);
      } else {
        resolve(this);
      }
    });
  });
}

cargarEnv();

const HOST = process.env.HOST || 'localhost';
const PORT = process.env.PORT || 4321;

app.use(express.json());
app.use('/imagenes', express.static(path.join(__dirname, '..', 'imagenes')));

app.get('/', (req, res) => {
  res.json({
    nombre: 'API DiscoStore',
    version: '1.0.0',
    rutas: [
      '/albumes',
      '/album/:slug',
      '/genero/:genero',
      '/search/:text',
      '/imagenes/*'
    ]
  });
});

app.get('/albumes', async (req, res, next) => {
  try {
    const albumes = await consultar('SELECT * FROM albumes ORDER BY anio DESC');
    res.json(albumes);
  } catch (error) {
    next(error);
  }
});

app.get('/album/:slug', async (req, res, next) => {
  try {
    const album = await consultarUno('SELECT * FROM albumes WHERE slug = ?', [
      req.params.slug
    ]);

    if (!album) {
      return res.status(404).json({ error: 'Album no encontrado' });
    }

    res.json(album);
  } catch (error) {
    next(error);
  }
});

app.get('/genero/:genero', async (req, res, next) => {
  try {
    const albumes = await consultar(
      'SELECT slug FROM albumes WHERE LOWER(genero) = LOWER(?) ORDER BY anio DESC',
      [req.params.genero]
    );

    res.json(albumes);
  } catch (error) {
    next(error);
  }
});

app.get('/search/:text', async (req, res, next) => {
  try {
    if (req.params.text.length < 3) {
      return res.status(400).json({ error: 'El texto debe tener al menos 3 caracteres' });
    }

    const texto = `%${req.params.text.toLowerCase()}%`;

    const albumes = await consultar(
      `
      SELECT * FROM albumes
      WHERE LOWER(titulo) LIKE ?
         OR LOWER(resumen) LIKE ?
         OR LOWER(descripcion) LIKE ?
      ORDER BY anio DESC
      `,
      [texto, texto, texto]
    );

    res.json(albumes);
  } catch (error) {
    next(error);
  }
});

app.post('/albumes', async (req, res, next) => {
  try {
    const datos = albumSchema.parse(req.body);
    const slug = crearSlug(datos.titulo);

    const existe = await consultarUno('SELECT slug FROM albumes WHERE slug = ?', [
      slug
    ]);

    if (existe) {
      return res.status(409).json({ error: 'Ya existe un album con ese slug' });
    }

    await ejecutar(
      `
      INSERT INTO albumes (
        titulo, artista, genero, anio, sello, pistas,
        imagen, slug, resumen, descripcion
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        datos.titulo,
        datos.artista,
        datos.genero,
        datos.anio,
        datos.sello,
        datos.pistas,
        datos.imagen,
        slug,
        datos.resumen,
        datos.descripcion
      ]
    );

    const album = await consultarUno('SELECT * FROM albumes WHERE slug = ?', [
      slug
    ]);

    res.location(`/album/${slug}`);
    res.status(201).json(album);
  } catch (error) {
    next(error);
  }
});

app.put('/album/:slug', async (req, res, next) => {
  try {
    const existe = await consultarUno('SELECT * FROM albumes WHERE slug = ?', [
      req.params.slug
    ]);

    if (!existe) {
      return res.status(404).json({ error: 'Album no encontrado' });
    }

    const datos = albumSchema.parse(req.body);
    const nuevoSlug = crearSlug(datos.titulo);

    const otro = await consultarUno(
      'SELECT slug FROM albumes WHERE slug = ? AND slug != ?',
      [nuevoSlug, req.params.slug]
    );

    if (otro) {
      return res.status(409).json({ error: 'Ya existe un album con ese slug' });
    }

    await ejecutar(
      `
      UPDATE albumes
      SET titulo = ?,
          artista = ?,
          genero = ?,
          anio = ?,
          sello = ?,
          pistas = ?,
          imagen = ?,
          slug = ?,
          resumen = ?,
          descripcion = ?
      WHERE slug = ?
      `,
      [
        datos.titulo,
        datos.artista,
        datos.genero,
        datos.anio,
        datos.sello,
        datos.pistas,
        datos.imagen,
        nuevoSlug,
        datos.resumen,
        datos.descripcion,
        req.params.slug
      ]
    );

    const album = await consultarUno('SELECT * FROM albumes WHERE slug = ?', [
      nuevoSlug
    ]);

    res.json(album);
  } catch (error) {
    next(error);
  }
});

app.delete('/album/:slug', async (req, res, next) => {
  try {
    const existe = await consultarUno('SELECT * FROM albumes WHERE slug = ?', [
      req.params.slug
    ]);

    if (!existe) {
      return res.status(404).json({ error: 'Album no encontrado' });
    }

    await ejecutar('DELETE FROM albumes WHERE slug = ?', [req.params.slug]);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.use((error, req, res, next) => {
  if (error instanceof ZodError) {
    return res.status(400).json({ error: error.errors[0].message });
  }

  console.error(error);
  res.status(500).json({ error: 'Error interno del servidor' });
});

if (require.main === module) {
  app.listen(PORT, HOST, () => {
    console.log(`Servidor escuchando en http://${HOST}:${PORT}`);
  });
}

module.exports = app;
