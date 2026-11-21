CREATE TABLE IF NOT EXISTS images (
  id SERIAL PRIMARY KEY,
  filename TEXT NOT NULL,
  title TEXT DEFAULT '(no title)',
  content_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO images (filename, title, content_type, size_bytes)
VALUES
  ('1.png', 'Example Image 1', 'image/png', 1),
  ('2.jpg', 'Example Image 2', 'image/jpg', 1),
  ('3.jpeg', 'Example Image 3', 'image/jpeg', 1),
  ('4.png', 'Example Image 4', 'image/png', 1),
  ('5.jpg', 'Example Image 5', 'image/jpg', 1),
  ('6.jpg', 'Example Image 6', 'image/jpg', 1),
  ('7.jpeg', 'Example Image 7', 'image/jpeg', 1),
  ('2.jpg', 'Example Image 8', 'image/jpg', 1),
  ('5.jpg', 'Example Image 9', 'image/jpg', 1),
  ('3.jpeg', 'Example Image 10', 'image/jpeg', 1);