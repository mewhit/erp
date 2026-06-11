CREATE TABLE "chat_messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "from_user_id" uuid NOT NULL,
  "to_user_id" uuid NOT NULL,
  "text" varchar(2000) NOT NULL,
  "client_message_id" varchar(255),
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_from_user_id_users_id_fk" FOREIGN KEY ("from_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_to_user_id_users_id_fk" FOREIGN KEY ("to_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "chat_messages_organization_id_index" ON "chat_messages" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX "chat_messages_from_user_id_index" ON "chat_messages" USING btree ("from_user_id");
--> statement-breakpoint
CREATE INDEX "chat_messages_to_user_id_index" ON "chat_messages" USING btree ("to_user_id");
--> statement-breakpoint
CREATE INDEX "chat_messages_created_at_index" ON "chat_messages" USING btree ("created_at");
