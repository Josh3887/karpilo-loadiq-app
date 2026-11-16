BEGIN;
DO $$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='karpilo_feedback_moderator') THEN
 CREATE ROLE karpilo_feedback_moderator NOLOGIN NOSUPERUSER NOBYPASSRLS; END IF; END $$;
GRANT USAGE ON SCHEMA karpilo TO karpilo_feedback_moderator;
-- AWS is the only authoritative store. Existing invitation responses stay private.
CREATE TABLE karpilo.feedback_threads (
 id uuid PRIMARY KEY,
 owner_id text NOT NULL,
 request_id uuid NOT NULL,
 kind text NOT NULL CHECK(kind IN ('feedback','review')),
 display_name text NOT NULL CHECK(length(display_name) BETWEEN 1 AND 80),
 rating integer CHECK(rating BETWEEN 1 AND 5),
 body text NOT NULL CHECK(length(body) BETWEEN 1 AND 4000),
 public_consent boolean NOT NULL DEFAULT false,
 publication text NOT NULL DEFAULT 'private' CHECK(publication IN ('private','pending','published','withheld')),
 moderation_reason text,
 version integer NOT NULL DEFAULT 1,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(owner_id,request_id),
 CHECK(kind='review' OR (NOT public_consent AND publication='private')),
 CHECK(publication NOT IN ('pending','published') OR (public_consent AND rating IS NOT NULL))
);
CREATE INDEX feedback_thread_queue ON karpilo.feedback_threads(created_at DESC,id DESC);
CREATE TABLE karpilo.feedback_replies (
 id uuid PRIMARY KEY,
 thread_id uuid NOT NULL REFERENCES karpilo.feedback_threads(id),
 owner_id text NOT NULL,
 request_id uuid NOT NULL,
 actor text NOT NULL,
 body text NOT NULL CHECK(length(body) BETWEEN 1 AND 4000),
 created_at timestamptz NOT NULL DEFAULT now(),
 read_at timestamptz,
 UNIQUE(thread_id,request_id)
);
CREATE INDEX feedback_reply_inbox ON karpilo.feedback_replies(owner_id,created_at DESC);
CREATE TABLE karpilo.feedback_audit (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 thread_id uuid NOT NULL REFERENCES karpilo.feedback_threads(id),
 actor text NOT NULL,
 action text NOT NULL,
 version integer NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE karpilo.feedback_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE karpilo.feedback_threads FORCE ROW LEVEL SECURITY;
ALTER TABLE karpilo.feedback_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE karpilo.feedback_replies FORCE ROW LEVEL SECURITY;
ALTER TABLE karpilo.feedback_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE karpilo.feedback_audit FORCE ROW LEVEL SECURITY;
REVOKE ALL ON karpilo.feedback_threads,karpilo.feedback_replies,karpilo.feedback_audit FROM PUBLIC;
CREATE POLICY feedback_threads_owner ON karpilo.feedback_threads TO karpilo_runtime
 USING(owner_id=current_setting('karpilo.owner_id',true)) WITH CHECK(owner_id=current_setting('karpilo.owner_id',true));
CREATE POLICY feedback_replies_owner ON karpilo.feedback_replies TO karpilo_runtime
 USING(owner_id=current_setting('karpilo.owner_id',true)) WITH CHECK(owner_id=current_setting('karpilo.owner_id',true));
GRANT SELECT,INSERT ON karpilo.feedback_threads TO karpilo_runtime;
GRANT UPDATE(public_consent,publication,version,updated_at) ON karpilo.feedback_threads TO karpilo_runtime;
GRANT SELECT ON karpilo.feedback_replies TO karpilo_runtime;
GRANT UPDATE(read_at) ON karpilo.feedback_replies TO karpilo_runtime;
CREATE POLICY feedback_threads_moderator ON karpilo.feedback_threads TO karpilo_support,karpilo_feedback_moderator
 USING(current_setting('karpilo.owner_id',true)='feedback-review') WITH CHECK(current_setting('karpilo.owner_id',true)='feedback-review');
CREATE POLICY feedback_replies_moderator ON karpilo.feedback_replies TO karpilo_support,karpilo_feedback_moderator
 USING(current_setting('karpilo.owner_id',true)='feedback-review') WITH CHECK(current_setting('karpilo.owner_id',true)='feedback-review');
CREATE POLICY feedback_audit_moderator ON karpilo.feedback_audit TO karpilo_support,karpilo_feedback_moderator
 USING(current_setting('karpilo.owner_id',true)='feedback-review') WITH CHECK(current_setting('karpilo.owner_id',true)='feedback-review');
GRANT SELECT ON karpilo.feedback_threads TO karpilo_support,karpilo_feedback_moderator;
GRANT UPDATE(publication,moderation_reason,version,updated_at) ON karpilo.feedback_threads TO karpilo_support,karpilo_feedback_moderator;
GRANT SELECT,INSERT ON karpilo.feedback_replies,karpilo.feedback_audit TO karpilo_support,karpilo_feedback_moderator;
GRANT USAGE ON SEQUENCE karpilo.feedback_audit_id_seq TO karpilo_support,karpilo_feedback_moderator;
-- Public access gets a dedicated role with no grants on private tables/replies.
DO $$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='karpilo_reviews_public') THEN
 CREATE ROLE karpilo_reviews_public NOLOGIN NOSUPERUSER NOBYPASSRLS; END IF; END $$;
GRANT USAGE ON SCHEMA karpilo TO karpilo_reviews_public;
GRANT SELECT(id,display_name,rating,body,created_at,kind,publication,public_consent) ON karpilo.feedback_threads TO karpilo_reviews_public;
CREATE POLICY feedback_public ON karpilo.feedback_threads FOR SELECT TO karpilo_reviews_public
 USING(kind='review' AND publication='published' AND public_consent);
GRANT karpilo_reviews_public TO karpilo_support,karpilo_feedback_moderator;
-- Existing invitation responses are imported as private feedback, never public reviews.
INSERT INTO karpilo.feedback_threads(id,owner_id,request_id,kind,display_name,rating,body,public_consent,publication,created_at)
SELECT md5(owner_id||':'||campaign)::uuid,owner_id,md5(owner_id||':'||campaign)::uuid,'feedback','Subscriber',rating,
 coalesce(nullif(trim(comment),''),'Rating submitted without a written comment.'),false,'private',responded_at
FROM karpilo.feedback_requests WHERE responded_at IS NOT NULL
ON CONFLICT(owner_id,request_id) DO NOTHING;
COMMIT;
