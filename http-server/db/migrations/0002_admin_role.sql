INSERT INTO roles (name, code)
VALUES ('Admin', 'ADMIN')
ON CONFLICT (code) DO NOTHING;
