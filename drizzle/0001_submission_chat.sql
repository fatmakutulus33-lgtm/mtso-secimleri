CREATE TABLE submissions (id text PRIMARY KEY NOT NULL, group_id integer NOT NULL, list_name text NOT NULL, candidates text NOT NULL, contact_name text NOT NULL, image_data text, status text NOT NULL DEFAULT 'pending', created_at text NOT NULL);
--> statement-breakpoint
CREATE INDEX idx_submissions_status ON submissions(status);
--> statement-breakpoint
CREATE TABLE chat_messages (id text PRIMARY KEY NOT NULL, display_name text NOT NULL, message text NOT NULL, created_at text NOT NULL);
--> statement-breakpoint
CREATE INDEX idx_chat_messages_created ON chat_messages(created_at);
