WITH upsert_user AS (
  INSERT INTO users (
    email,
    display_name,
    is_active,
    deleted_at,
    updated_at,
    created_at
  )
  VALUES (
    'mikewhittom27@gmail.com',
    'Mike',
    true,
    NULL,
    now(),
    now()
  )
  ON CONFLICT (email) DO UPDATE
  SET
    display_name = COALESCE(users.display_name, EXCLUDED.display_name),
    is_active = true,
    deleted_at = NULL,
    updated_at = now()
  RETURNING id
),
updated_authentication AS (
  UPDATE authentications
  SET
    email = 'mikewhittom27@gmail.com',
    password_hash = 'pbkdf2_sha256$310000$gqHqmuADbyIo68ESwPvCfA$AUZU8FRE3HtiKgu6qb-zmh0UWWvFXNi6YRHUgV0AoxI',
    password_updated_at = now(),
    failed_login_attempts = 0,
    locked_until = NULL,
    updated_at = now()
  WHERE user_id = (SELECT id FROM upsert_user)
  RETURNING user_id
)
INSERT INTO authentications (
  user_id,
  email,
  password_hash,
  password_updated_at,
  failed_login_attempts,
  locked_until,
  updated_at,
  created_at
)
SELECT
  id,
  'mikewhittom27@gmail.com',
  'pbkdf2_sha256$310000$gqHqmuADbyIo68ESwPvCfA$AUZU8FRE3HtiKgu6qb-zmh0UWWvFXNi6YRHUgV0AoxI',
  now(),
  0,
  NULL,
  now(),
  now()
FROM upsert_user
WHERE NOT EXISTS (SELECT 1 FROM updated_authentication)
ON CONFLICT (email) DO UPDATE
SET
  user_id = EXCLUDED.user_id,
  password_hash = EXCLUDED.password_hash,
  password_updated_at = now(),
  failed_login_attempts = 0,
  locked_until = NULL,
  updated_at = now();
