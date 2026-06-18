import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import app from '../src/app.js';
import db from '../src/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const sqlPath = path.join(rootDir, 'src', 'data.sql');
const albumesPath = path.join(rootDir, 'database', 'albumes.json');

function crearSlug(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
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

function ejecutarScript(sql) {
  return new Promise((resolve, reject) => {
    db.exec(sql, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

function cerrarDb() {
  return new Promise((resolve, reject) => {
    db.close((error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

async function resetDatabase() {
  const sql = await fs.readFile(sqlPath, 'utf8');
  const albumes = JSON.parse(await fs.readFile(albumesPath, 'utf8'));

  await ejecutarScript(sql);

  const insertSql = `
    INSERT INTO albumes (
      titulo, artista, genero, anio, sello, pistas,
      imagen, slug, resumen, descripcion
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  for (const album of albumes) {
    await ejecutar(insertSql, [
      album.titulo,
      album.artista,
      album.genero,
      album.anio,
      album.sello,
      album.pistas,
      album.imagen,
      crearSlug(album.titulo),
      album.resumen,
      album.descripcion
    ]);
  }
}

const albumValido = {
  titulo: 'Kind of Blue',
  artista: 'Miles Davis',
  genero: 'Jazz',
  anio: 1959,
  sello: 'Columbia',
  pistas: 5,
  imagen: 'kind-of-blue.avif',
  resumen: 'Album esencial del jazz modal.',
  descripcion: 'Una grabacion influyente de Miles Davis con un ensamble historico.'
};

describe('API de albumes', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await cerrarDb();
  });

  it('GET /albumes responde 200 y un arreglo que contiene un slug sembrado', async () => {
    const response = await request(app).get('/albumes');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ slug: 'thriller' })
      ])
    );
  });

  it('GET /album/:slug responde 200 y el objeto del album si el slug existe', async () => {
    const response = await request(app).get('/album/thriller');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        titulo: 'Thriller',
        artista: 'Michael Jackson',
        slug: 'thriller'
      })
    );
  });

  it('GET /album/:slug responde 404 en JSON si el slug no existe', async () => {
    const response = await request(app).get('/album/no-existe');

    expect(response.status).toBe(404);
    expect(response.type).toMatch(/json/);
    expect(response.body).toEqual({ error: expect.any(String) });
  });

  it('GET /search/:text responde 400 en JSON si el texto tiene menos de 3 caracteres', async () => {
    const response = await request(app).get('/search/ab');

    expect(response.status).toBe(400);
    expect(response.type).toMatch(/json/);
    expect(response.body).toEqual({ error: expect.any(String) });
  });

  it('POST /albumes responde 201, Location y el objeto creado con cuerpo valido', async () => {
    const response = await request(app).post('/albumes').send(albumValido);

    expect(response.status).toBe(201);
    expect(response.headers.location).toBe('/album/kind-of-blue');
    expect(response.body).toEqual(
      expect.objectContaining({
        titulo: albumValido.titulo,
        artista: albumValido.artista,
        slug: 'kind-of-blue'
      })
    );
  });

  it('POST /albumes responde 400 en JSON con cuerpo invalido', async () => {
    const response = await request(app).post('/albumes').send({
      titulo: ''
    });

    expect(response.status).toBe(400);
    expect(response.type).toMatch(/json/);
    expect(response.body).toEqual({ error: expect.any(String) });
  });

  it('POST /albumes responde 409 en JSON con slug duplicado', async () => {
    const response = await request(app).post('/albumes').send({
      ...albumValido,
      titulo: 'Thriller'
    });

    expect(response.status).toBe(409);
    expect(response.type).toMatch(/json/);
    expect(response.body).toEqual({ error: expect.any(String) });
  });

  it('PUT /album/:slug responde 200 y el objeto actualizado si existe y el cuerpo es valido', async () => {
    const cambios = {
      ...albumValido,
      titulo: 'Thriller Updated',
      artista: 'Michael Jackson'
    };

    const response = await request(app).put('/album/thriller').send(cambios);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        titulo: 'Thriller Updated',
        artista: 'Michael Jackson',
        slug: 'thriller-updated'
      })
    );
  });

  it('PUT /album/:slug responde 404 en JSON si no existe', async () => {
    const response = await request(app).put('/album/no-existe').send(albumValido);

    expect(response.status).toBe(404);
    expect(response.type).toMatch(/json/);
    expect(response.body).toEqual({ error: expect.any(String) });
  });

  it('DELETE /album/:slug responde 204 sin cuerpo si existe', async () => {
    const response = await request(app).delete('/album/thriller');

    expect(response.status).toBe(204);
    expect(response.text).toBe('');
  });

  it('DELETE /album/:slug responde 404 en JSON si no existe', async () => {
    const response = await request(app).delete('/album/no-existe');

    expect(response.status).toBe(404);
    expect(response.type).toMatch(/json/);
    expect(response.body).toEqual({ error: expect.any(String) });
  });
});
