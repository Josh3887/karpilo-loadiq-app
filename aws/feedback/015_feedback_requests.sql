BEGIN;
CREATE TABLE IF NOT EXISTS karpilo.feedback_requests (
 owner_id text PRIMARY KEY,
 campaign text NOT NULL DEFAULT 'first-three-loads-v1',
 created_at timestamptz NOT NULL DEFAULT now(),
 shown_at timestamptz,
 responded_at timestamptz,
 dismissed_at timestamptz,
 rating integer CHECK(rating BETWEEN 1 AND 5),
 comment text CHECK(length(comment)<=4000),
 response_source text CHECK(response_source IN ('app','email')),
 reminder_sent_at timestamptz,
 reminder_provider_id text,
 reminder_attempts integer NOT NULL DEFAULT 0,
 reminder_first_attempt_at timestamptz,
 reminder_next_attempt_at timestamptz,
 reminder_payload jsonb,
 reminder_failed boolean NOT NULL DEFAULT false
);
ALTER TABLE karpilo.feedback_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE karpilo.feedback_requests FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS feedback_owner ON karpilo.feedback_requests;
CREATE POLICY feedback_owner ON karpilo.feedback_requests TO karpilo_runtime
 USING(owner_id=current_setting('karpilo.owner_id',true))
 WITH CHECK(owner_id=current_setting('karpilo.owner_id',true));
REVOKE ALL ON karpilo.feedback_requests FROM PUBLIC;
GRANT SELECT,INSERT,UPDATE,DELETE ON karpilo.feedback_requests TO karpilo_runtime;
DROP POLICY IF EXISTS feedback_dispatch ON karpilo.feedback_requests;
CREATE POLICY feedback_dispatch ON karpilo.feedback_requests TO karpilo_support
 USING(current_setting('karpilo.owner_id',true)='feedback-dispatch');
GRANT SELECT(owner_id,shown_at,responded_at,dismissed_at,reminder_sent_at,reminder_next_attempt_at,reminder_failed) ON karpilo.feedback_requests TO karpilo_support;
DROP POLICY IF EXISTS feedback_review ON karpilo.feedback_requests;
CREATE POLICY feedback_review ON karpilo.feedback_requests TO karpilo_support
 USING(current_setting('karpilo.owner_id',true)='feedback-review');
GRANT SELECT(campaign,created_at,rating,comment,response_source) ON karpilo.feedback_requests TO karpilo_support;
COMMIT;
