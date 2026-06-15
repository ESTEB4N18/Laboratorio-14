const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

function crearSlug(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const dbPath = path.join(__dirname, 'database.sqlite');
const sqlPath = path.join(__dirname, '..', 'src', 'data.sql');
const jsonPath = path.join(__dirname, 'albumes.json');

if (!fs.existsSync(jsonPath)) {
  console.error('Error: el archivo database/albumes.json es obligatorio');
  process.exit(1);
}

const sql = fs.readFileSync(sqlPath, 'utf8');
const albumes = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.exec(sql);

  const insert = db.prepare(`
    INSERT INTO albumes (
      titulo, artista, genero, anio, sello, pistas,
      imagen, slug, resumen, descripcion
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  albumes.forEach((album) => {
    const slug = crearSlug(album.titulo);

    insert.run(
      album.titulo,
      album.artista,
      album.genero,
      album.anio,
      album.sello,
      album.pistas,
      album.imagen,
      slug,
      album.resumen,
      album.descripcion
    );
  });

  insert.finalize();
});

db.close((error) => {
  if (error) {
    console.error('Error al poblar la base de datos:', error.message);
  } else {
    console.log('Base de datos creada y poblada desde JSON correctamente');
  }
});
