ALTER TABLE authentications ADD COLUMN IF NOT EXISTS email varchar(255);
--> statement-breakpoint
UPDATE authentications
SET email = users.email
FROM users
WHERE authentications.user_id = users.id
  AND authentications.email IS NULL;
--> statement-breakpoint
ALTER TABLE authentications ALTER COLUMN email SET NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS authentications_email_unique ON authentications(email);
