DROP TABLE IF EXISTS albumes;

CREATE TABLE albumes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo TEXT,
  artista TEXT,
  genero TEXT,
  anio INTEGER,
  sello TEXT,
  pistas INTEGER,
  imagen TEXT,
  slug TEXT UNIQUE,
  resumen TEXT,
  descripcion TEXT
);
