Creating shadow database...
Skipping migration 20251001181550_... (file name must match pattern "<timestamp>_name.sql")
Initialising schema...
Seeding globals from roles.sql...
Applying migration 20240914110000_create_user_tables.sql...
Applying migration 20240914120000_create_vendor_adventure_tables.sql...
Applying migration 20240914130000_create_booking_payment_tables.sql...
Applying migration 20240914140000_create_group_compatibility_tables.sql...
Applying migration 20240914150000_add_personality_assessment_indexes.sql...
Applying migration 20240914160000_create_community_social_tables.sql...
Applying migration 20240914170000_create_functions_triggers.sql...
Applying migration 20240914180000_create_ml_model_tables.sql...
Applying migration 20240914190000_create_stripe_connect_tables.sql...
Applying migration 20250914090000_create_notification_tables.sql...
Applying migration 20250914100000_create_whatsapp_tables.sql...
NOTICE (42701): column "phone_number" of relation "profiles" already exists, skipping
Applying migration 20250915010000_create_media_storage.sql...
Applying migration 20250915100000_create_split_payment_tables.sql...
Applying migration 20250915110000_enhance_webhook_system.sql...
NOTICE (42701): column "refunded_amount" of relation "booking_payments" already exists, skipping
NOTICE (42701): column "refund_reason" of relation "booking_payments" already exists, skipping
Applying migration 20250915120000_optimize_compatibility_indexes.sql...
NOTICE (00000): index "idx_compatibility_scores_lookup" does not exist, skipping
NOTICE (00000): index "idx_compatibility_scores_group" does not exist, skipping
NOTICE (00000): index "idx_compatibility_scores_calculated" does not exist, skipping
NOTICE (00000): index "idx_personality_assessments_user" does not exist, skipping
NOTICE (00000): index "idx_profiles_lookup" does not exist, skipping
NOTICE (42P07): relation "idx_profiles_location" already exists, skipping
Applying migration 20250915130000_add_payment_tokens_table.sql...
Applying migration 20250915140000_create_invoice_tables.sql...
Applying migration 20250915150000_create_moderation_system.sql...
Applying migration 20250915160000_create_payment_reconciliation_tables.sql...
NOTICE (00000): trigger "update_payment_reconciliations_updated_at" for relation "payment_reconciliations" does not exist, skipping
NOTICE (00000): trigger "update_payment_discrepancies_updated_at" for relation "payment_discrepancies" does not exist, skipping
NOTICE (00000): trigger "update_payment_refunds_updated_at" for relation "payment_refunds" does not exist, skipping
NOTICE (00000): trigger "update_payout_holds_updated_at" for relation "payout_holds" does not exist, skipping
NOTICE (00000): trigger "update_reconciliation_schedules_updated_at" for relation "reconciliation_schedules" does not exist, skipping
NOTICE (00000): policy "Vendors can view their own reconciliations" for relation "payment_reconciliations" does not exist, skipping
NOTICE (00000): policy "Service can manage reconciliations" for relation "payment_reconciliations" does not exist, skipping
NOTICE (00000): policy "Vendors can view their own discrepancies" for relation "payment_discrepancies" does not exist, skipping
NOTICE (00000): policy "Service can manage discrepancies" for relation "payment_discrepancies" does not exist, skipping
NOTICE (00000): policy "Vendors can view their payment audit trail" for relation "payment_audit_trail" does not exist, skipping
NOTICE (00000): policy "Service can manage audit trail" for relation "payment_audit_trail" does not exist, skipping
NOTICE (00000): policy "Service can manage refunds for reconciliation" for relation "payment_refunds" does not exist, skipping
NOTICE (00000): policy "Vendors can view their holds" for relation "payout_holds" does not exist, skipping
NOTICE (00000): policy "Admin can manage holds" for relation "payout_holds" does not exist, skipping
NOTICE (00000): policy "Vendors can manage their schedules" for relation "reconciliation_schedules" does not exist, skipping
Applying migration 20250915170000_create_payout_system_tables.sql...
Applying migration 20250915180000_create_refund_dispute_tables.sql...
Applying migration 20250915190000_create_vendor_forum_tables.sql...
Applying migration 20250915200000_enhance_connection_system.sql...
NOTICE (00000): trigger "trigger_update_connection_strength" for relation "community_connections" does not exist, skipping
Applying migration 20250915210000_create_engagement_tracking_tables.sql...
Applying migration 20250915220000_create_modification_tables.sql...
NOTICE (42P07): relation "idx_refund_requests_booking_id" already exists, skipping
NOTICE (42P07): relation "idx_refund_requests_user_id" already exists, skipping
NOTICE (42P07): relation "idx_refund_requests_status" already exists, skipping
NOTICE (42701): column "user_id" of relation "payment_disputes" already exists, skipping
NOTICE (42701): column "customer_message" of relation "payment_disputes" already exists, skipping
NOTICE (42P07): relation "idx_payment_disputes_stripe_dispute_id" already exists, skipping
NOTICE (42P07): relation "idx_payment_disputes_booking_id" already exists, skipping
NOTICE (42P07): relation "idx_payment_disputes_status" already exists, skipping
NOTICE (42P07): relation "idx_payment_disputes_evidence_due_by" already exists, skipping
NOTICE (42701): column "refund_policy" of relation "vendors" already exists, skipping
NOTICE (42701): column "cancellation_policy" of relation "adventures" already exists, skipping
NOTICE (42701): column "cancelled_at" of relation "bookings" already exists, skipping
NOTICE (42701): column "cancellation_reason" of relation "bookings" already exists, skipping
NOTICE (42701): column "special_requests" of relation "bookings" already exists, skipping
NOTICE (00000): trigger "update_booking_modifications_updated_at" for relation "booking_modifications" does not exist, skipping
NOTICE (00000): trigger "update_booking_cancellations_updated_at" for relation "booking_cancellations" does not exist, skipping
NOTICE (00000): trigger "update_booking_service_disputes_updated_at" for relation "booking_service_disputes" does not exist, skipping
NOTICE (00000): trigger "modification_status_change_notification" for relation "booking_modifications" does not exist, skipping
Applying migration 20250916000000_fix_auth_trigger_schema_qualification.sql...
Applying migration 20250919115226_remote_schema.sql...
Applying migration 20250920080000_create_age_verification_logs.sql...
Applying migration 20250920081000_add_age_verification_constraints.sql...
Applying migration 20250920083000_add_encrypted_birth_date.sql...
Applying migration 20250920084300_create_compliance_logs_table.sql...
Applying migration 20250920094400_create_cors_violations_table.sql...
NOTICE (00000): trigger "trigger_cors_violations_updated_at" for relation "cors_violations" does not exist, skipping
Applying migration 20250920095000_fix_rls_recursion.sql...
Applying migration 20250920113600_setup_credential_management.sql...
NOTICE (42710): extension "uuid-ossp" already exists, skipping
Applying migration 20250920125000_emergency_rls_fix.sql...
NOTICE (00000): policy "Group members are viewable by group members" for relation "group_members" does not exist, skipping
NOTICE (00000): policy "Group admins can manage members" for relation "group_members" does not exist, skipping
Applying migration 20250920130000_fix_split_payments_rls.sql...
Applying migration 20250920135000_fix_all_split_payment_rls.sql...
NOTICE (00000): policy "Users can view split payments they organize or participate in" for relation "split_payments" does not exist, skipping
NOTICE (00000): policy "Only organizers can create split payments" for relation "split_payments" does not exist, skipping
NOTICE (00000): policy "Only organizers can update their split payments" for relation "split_payments" does not exist, skipping
NOTICE (00000): policy "Users can view their own payments or payments they organize" for relation "individual_payments" does not exist, skipping
NOTICE (00000): policy "System can insert individual payments" for relation "individual_payments" does not exist, skipping
Applying migration 20250920140000_final_rls_recursion_fix.sql...
NOTICE (00000): policy "Users can view split payments they organize or participate in" for relation "split_payments" does not exist, skipping
NOTICE (00000): policy "Only organizers can create split payments" for relation "split_payments" does not exist, skipping
NOTICE (00000): policy "Only organizers can update their split payments" for relation "split_payments" does not exist, skipping
NOTICE (00000): policy "split_payments_organizer_all" for relation "split_payments" does not exist, skipping
NOTICE (00000): policy "Users can view their own payments or payments they organize" for relation "individual_payments" does not exist, skipping
NOTICE (00000): policy "System can insert individual payments" for relation "individual_payments" does not exist, skipping
NOTICE (00000): policy "Users can update their own payment status" for relation "individual_payments" does not exist, skipping
NOTICE (00000): policy "individual_payments_own_read" for relation "individual_payments" does not exist, skipping
NOTICE (00000): policy "individual_payments_own_insert" for relation "individual_payments" does not exist, skipping
NOTICE (00000): policy "individual_payments_own_update" for relation "individual_payments" does not exist, skipping
NOTICE (00000): policy "Users can view reminders for their payments" for relation "payment_reminders" does not exist, skipping
NOTICE (00000): policy "Users can view refunds for their payments" for relation "payment_refunds" does not exist, skipping
NOTICE (00000): policy "Users can update their cancellations" for relation "booking_cancellations" does not exist, skipping
NOTICE (00000): policy "Vendors can manage cancellations" for relation "booking_cancellations" does not exist, skipping
NOTICE (00000): policy "Vendors can manage disputes" for relation "booking_service_disputes" does not exist, skipping
Applying migration 20250920145000_emergency_disable_rls.sql...
Applying migration 20250920150000_ultimate_rls_fix.sql...
Diffing schemas: public,storage
Finished supabase db diff on branch main.

drop trigger if exists "update_adventure_availability_updated_at" on "public"."adventure_availability";

drop trigger if exists "update_adventures_updated_at" on "public"."adventures";

drop trigger if exists "update_booking_cancellations_updated_at" on "public"."booking_cancellations";

drop trigger if exists "update_booking_disputes_updated_at" on "public"."booking_disputes";

drop trigger if exists "modification_status_change_notification" on "public"."booking_modifications";

drop trigger if exists "update_booking_modifications_updated_at" on "public"."booking_modifications";

drop trigger if exists "update_booking_payments_updated_at" on "public"."booking_payments";

drop trigger if exists "update_booking_service_disputes_updated_at" on "public"."booking_service_disputes";

drop trigger if exists "update_bookings_updated_at" on "public"."bookings";

drop trigger if exists "trigger_update_connection_strength" on "public"."community_connections";

drop trigger if exists "update_community_connections_updated_at" on "public"."community_connections";

drop trigger if exists "update_community_posts_updated_at" on "public"."community_posts";

drop trigger if exists "update_compatibility_algorithms_updated_at" on "public"."compatibility_algorithms";

drop trigger if exists "trigger_update_compliance_logs_updated_at" on "public"."compliance_logs";

drop trigger if exists "trigger_filter_rules_updated_at" on "public"."content_filter_rules";

drop trigger if exists "trigger_content_reports_updated_at" on "public"."content_reports";

drop trigger if exists "update_content_scores_updated_at" on "public"."content_scores";

drop trigger if exists "trigger_cors_violations_updated_at" on "public"."cors_violations";

drop trigger if exists "update_engagement_scores_updated_at" on "public"."engagement_scores";

drop trigger if exists "trigger_update_group_member_count" on "public"."group_members";

drop trigger if exists "update_groups_updated_at" on "public"."groups";

drop trigger if exists "update_individual_payments_modtime" on "public"."individual_payments";

drop trigger if exists "update_split_payment_status_trigger" on "public"."individual_payments";

drop trigger if exists "set_invoice_number_trigger" on "public"."invoices";

drop trigger if exists "update_invoices_updated_at" on "public"."invoices";

drop trigger if exists "update_media_files_updated_at" on "public"."media_files";

drop trigger if exists "trigger_moderation_queue_updated_at" on "public"."moderation_queue";

drop trigger if exists "update_notification_templates_updated_at" on "public"."notification_templates";

drop trigger if exists "update_notifications_updated_at" on "public"."notifications";

drop trigger if exists "update_payment_discrepancies_updated_at" on "public"."payment_discrepancies";

drop trigger if exists "update_payment_disputes_updated_at" on "public"."payment_disputes";

drop trigger if exists "update_payment_reconciliations_updated_at" on "public"."payment_reconciliations";

drop trigger if exists "update_payment_refunds_modtime" on "public"."payment_refunds";

drop trigger if exists "update_payment_refunds_updated_at" on "public"."payment_refunds";

drop trigger if exists "update_payment_reminders_modtime" on "public"."payment_reminders";

drop trigger if exists "update_payment_splits_updated_at" on "public"."payment_splits";

drop trigger if exists "update_payment_tokens_modtime" on "public"."payment_tokens";

drop trigger if exists "update_payout_failures_updated_at" on "public"."payout_failures";

drop trigger if exists "update_payout_holds_updated_at" on "public"."payout_holds";

drop trigger if exists "update_payout_holds_system_updated_at" on "public"."payout_holds_system";

drop trigger if exists "update_payout_schedule_jobs_updated_at" on "public"."payout_schedule_jobs";

drop trigger if exists "update_personality_assessments_updated_at" on "public"."personality_assessments";

drop trigger if exists "trigger_update_connection_strength" on "public"."post_comments";

drop trigger if exists "update_comment_counts" on "public"."post_comments";

drop trigger if exists "update_post_comments_updated_at" on "public"."post_comments";

drop trigger if exists "update_reaction_counts" on "public"."post_reactions";

drop trigger if exists "update_share_counts" on "public"."post_shares";

drop trigger if exists "handle_birth_date_encryption_trigger" on "public"."profiles";

drop trigger if exists "update_profiles_updated_at" on "public"."profiles";

drop trigger if exists "validate_age_before_profile_update" on "public"."profiles";

drop trigger if exists "update_reconciliation_schedules_updated_at" on "public"."reconciliation_schedules";

drop trigger if exists "update_refund_requests_updated_at" on "public"."refund_requests";

drop trigger if exists "update_retraining_triggers_updated_at" on "public"."retraining_triggers";

drop trigger if exists "trigger_update_vendor_rating" on "public"."reviews";

drop trigger if exists "update_reviews_updated_at" on "public"."reviews";

drop trigger if exists "update_split_payment_settings_modtime" on "public"."split_payment_settings";

drop trigger if exists "update_split_payments_modtime" on "public"."split_payments";

drop trigger if exists "auto_categorize_webhook_error_trigger" on "public"."stripe_webhook_events";

drop trigger if exists "update_system_settings_updated_at" on "public"."system_settings";

drop trigger if exists "update_training_datasets_updated_at" on "public"."training_datasets";

drop trigger if exists "update_trip_requests_updated_at" on "public"."trip_requests";

drop trigger if exists "update_user_feed_preferences_updated_at" on "public"."user_feed_preferences";

drop trigger if exists "update_user_preferences_updated_at" on "public"."user_preferences";

drop trigger if exists "trigger_update_warning_count" on "public"."user_warnings";

drop trigger if exists "update_vendor_bids_updated_at" on "public"."vendor_bids";

drop trigger if exists "update_thread_reply_stats_trigger" on "public"."vendor_forum_replies";

drop trigger if exists "update_vendor_forum_replies_updated_at" on "public"."vendor_forum_replies";

drop trigger if exists "update_vendor_forum_reputation_updated_at" on "public"."vendor_forum_reputation";

drop trigger if exists "update_vendor_forum_threads_updated_at" on "public"."vendor_forum_threads";

drop trigger if exists "update_vote_counts_trigger" on "public"."vendor_forum_votes";

drop trigger if exists "update_vendor_forums_updated_at" on "public"."vendor_forums";

drop trigger if exists "update_vendor_payouts_updated_at" on "public"."vendor_payouts";

drop trigger if exists "update_vendor_stripe_accounts_updated_at" on "public"."vendor_stripe_accounts";

drop trigger if exists "update_vendors_updated_at" on "public"."vendors";

drop trigger if exists "update_whatsapp_groups_updated_at" on "public"."whatsapp_groups";

drop policy "Users can view their A/B test assignments" on "public"."ab_test_assignments";

drop policy "System users can manage A/B tests" on "public"."ab_test_experiments";

drop policy "Availability is viewable by everyone" on "public"."adventure_availability";

drop policy "Vendors can manage own adventure availability" on "public"."adventure_availability";

drop policy "Media is viewable by everyone" on "public"."adventure_media";

drop policy "Vendors can manage own adventure media" on "public"."adventure_media";

drop policy "Active adventures are viewable by everyone" on "public"."adventures";

drop policy "Vendors can manage own adventures" on "public"."adventures";

drop policy "Only admins can view age verification logs" on "public"."age_verification_logs";

drop policy "Users can manage own responses" on "public"."assessment_responses";

drop policy "Users can view own responses" on "public"."assessment_responses";

drop policy "Admins can view all audit logs" on "public"."booking_audit_logs";

drop policy "System can create audit logs" on "public"."booking_audit_logs";

drop policy "Users can view booking audit logs" on "public"."booking_audit_logs";

drop policy "Vendors can view audit logs" on "public"."booking_audit_logs";

drop policy "Admins can manage cancellations" on "public"."booking_cancellations";

drop policy "Vendors can view cancellations" on "public"."booking_cancellations";

drop policy "booking_cancellations_insert_simple" on "public"."booking_cancellations";

drop policy "booking_cancellations_simple" on "public"."booking_cancellations";

drop policy "booking_cancellations_update_simple" on "public"."booking_cancellations";

drop policy "Users can view disputes for their bookings" on "public"."booking_disputes";

drop policy "Admins can view all modifications" on "public"."booking_modifications";

drop policy "Modifications viewable by booking parties" on "public"."booking_modifications";

drop policy "booking_modifications_insert_simple" on "public"."booking_modifications";

drop policy "booking_modifications_simple" on "public"."booking_modifications";

drop policy "booking_modifications_update_simple" on "public"."booking_modifications";

drop policy "Participants viewable by booking owner and vendor" on "public"."booking_participants";

drop policy "Users can manage participants for own bookings" on "public"."booking_participants";

drop policy "Users can create payments for own bookings" on "public"."booking_payments";

drop policy "Users can view own payments" on "public"."booking_payments";

drop policy "Admins can manage disputes" on "public"."booking_service_disputes";

drop policy "Vendors can view disputes" on "public"."booking_service_disputes";

drop policy "booking_service_disputes_insert_simple" on "public"."booking_service_disputes";

drop policy "booking_service_disputes_simple" on "public"."booking_service_disputes";

drop policy "booking_service_disputes_update_simple" on "public"."booking_service_disputes";

drop policy "Users can create bookings" on "public"."bookings";

drop policy "Users can update own pending bookings" on "public"."bookings";

drop policy "Users can view own bookings" on "public"."bookings";

drop policy "Public posts are viewable by everyone" on "public"."community_posts";

drop policy "Users can create own posts" on "public"."community_posts";

drop policy "Users can delete own posts" on "public"."community_posts";

drop policy "Users can update own posts" on "public"."community_posts";

drop policy "Admin access only for compliance logs" on "public"."compliance_logs";

drop policy "Users can create discovery logs" on "public"."content_discovery_log";

drop policy "Users can view own discovery history" on "public"."content_discovery_log";

drop policy "Admins can update reports" on "public"."content_reports";

drop policy "Admins can view all reports" on "public"."content_reports";

drop policy "Users can create reports" on "public"."content_reports";

drop policy "Users can view their own reports" on "public"."content_reports";

drop policy "Content scores are publicly readable" on "public"."content_scores";

drop policy "Admin users can read CORS violations" on "public"."cors_violations";

drop policy "Service role can manage CORS violations" on "public"."cors_violations";

drop policy "Admins can view all credential logs" on "public"."credential_access_logs";

drop policy "Service can insert credential logs" on "public"."credential_access_logs";

drop policy "Users can view own credential logs" on "public"."credential_access_logs";

drop policy "Admins can view all credential errors" on "public"."credential_errors";

drop policy "Service can insert credential errors" on "public"."credential_errors";

drop policy "Users can view own credential errors" on "public"."credential_errors";

drop policy "Authenticated users can view exchange rates" on "public"."currency_exchange_rates";

drop policy "Admins can manage dispute threads" on "public"."dispute_threads";

drop policy "Users can create dispute messages" on "public"."dispute_threads";

drop policy "Users can view dispute threads" on "public"."dispute_threads";

drop policy "Users can manage own FCM tokens" on "public"."fcm_tokens";

drop policy "Scores viewable by group members" on "public"."group_compatibility_scores";

drop policy "Invitations viewable by relevant parties" on "public"."group_invitations";

drop policy "group_members_own_delete" on "public"."group_members";

drop policy "group_members_own_insert" on "public"."group_members";

drop policy "group_members_own_read" on "public"."group_members";

drop policy "group_members_own_update" on "public"."group_members";

drop policy "Group owners can update their groups" on "public"."groups";

drop policy "Users can create groups" on "public"."groups";

drop policy "groups_owner_all" on "public"."groups";

drop policy "groups_public_read" on "public"."groups";

drop policy "individual_payments_simple" on "public"."individual_payments";

drop policy "Users can manage own invoice line items" on "public"."invoice_line_items";

drop policy "Users can view own invoice line items" on "public"."invoice_line_items";

drop policy "Vendors can view their invoice line items" on "public"."invoice_line_items";

drop policy "Users can create invoices" on "public"."invoices";

drop policy "Users can update own invoices" on "public"."invoices";

drop policy "Users can view own invoices" on "public"."invoices";

drop policy "Vendors can create invoices" on "public"."invoices";

drop policy "Vendors can update their invoices" on "public"."invoices";

drop policy "Vendors can view their invoices" on "public"."invoices";

drop policy "Anyone can view media metadata" on "public"."media_files";

drop policy "Authenticated users can create media records" on "public"."media_files";

drop policy "Users can manage their own media records" on "public"."media_files";

drop policy "Authenticated users can view model metadata" on "public"."ml_models";

drop policy "System users can manage models" on "public"."ml_models";

drop policy "System users can manage performance metrics" on "public"."model_performance_metrics";

drop policy "System users can manage predictions" on "public"."model_predictions";

drop policy "System users can manage training runs" on "public"."model_training_runs";

drop policy "Admins can update appeals" on "public"."moderation_appeals";

drop policy "Admins can view all appeals" on "public"."moderation_appeals";

drop policy "Users can create appeals" on "public"."moderation_appeals";

drop policy "Users can view their own appeals" on "public"."moderation_appeals";

drop policy "Users can view own notification analytics" on "public"."notification_analytics";

drop policy "Users can view own queued notifications" on "public"."notification_queue";

drop policy "Everyone can view active notification templates" on "public"."notification_templates";

drop policy "Users can update own notifications" on "public"."notifications";

drop policy "Users can view own notifications" on "public"."notifications";

drop policy "Service can manage audit trail" on "public"."payment_audit_trail";

drop policy "Vendors can view their payment audit trail" on "public"."payment_audit_trail";

drop policy "Service can manage discrepancies" on "public"."payment_discrepancies";

drop policy "Vendors can view their own discrepancies" on "public"."payment_discrepancies";

drop policy "Admins can view all payment disputes" on "public"."payment_disputes";

drop policy "Vendors can view disputes for their bookings" on "public"."payment_disputes";

drop policy "Service can manage reconciliations" on "public"."payment_reconciliations";

drop policy "Vendors can view their own reconciliations" on "public"."payment_reconciliations";

drop policy "Service can manage refunds for reconciliation" on "public"."payment_refunds";

drop policy "payment_refunds_simple" on "public"."payment_refunds";

drop policy "payment_reminders_simple" on "public"."payment_reminders";

drop policy "Users can update own payment splits" on "public"."payment_splits";

drop policy "Users can view own payment splits" on "public"."payment_splits";

drop policy "Users can view own payout failures" on "public"."payout_failures";

drop policy "Users can view own payout hold logs" on "public"."payout_hold_logs";

drop policy "Admin can manage holds" on "public"."payout_holds";

drop policy "Vendors can view their holds" on "public"."payout_holds";

drop policy "Admins can manage all payout holds" on "public"."payout_holds_system";

drop policy "Users can view own payout holds" on "public"."payout_holds_system";

drop policy "Users can view own payout line items" on "public"."payout_line_items";

drop policy "Users can view own payout schedule jobs" on "public"."payout_schedule_jobs";

drop policy "Users can manage own assessment" on "public"."personality_assessments";

drop policy "Users can view own assessment" on "public"."personality_assessments";

drop policy "Users can manage own interaction sessions" on "public"."post_interaction_sessions";

drop policy "Post saves viewable by post author" on "public"."post_saves";

drop policy "Users can manage own saves" on "public"."post_saves";

drop policy "Post shares viewable by post author" on "public"."post_shares";

drop policy "Users can manage own shares" on "public"."post_shares";

drop policy "Post authors can view post analytics" on "public"."post_views";

drop policy "Users can create view records" on "public"."post_views";

drop policy "Users can view own view history" on "public"."post_views";

drop policy "Users can insert own profile" on "public"."profiles";

drop policy "Vendors can manage their schedules" on "public"."reconciliation_schedules";

drop policy "Admins can view all refund requests" on "public"."refund_requests";

drop policy "Users can create own refund requests" on "public"."refund_requests";

drop policy "Users can view own refund requests" on "public"."refund_requests";

drop policy "Vendors can update refund requests for their adventures" on "public"."refund_requests";

drop policy "Vendors can view refund requests for their adventures" on "public"."refund_requests";

drop policy "Reviews are publicly viewable" on "public"."reviews";

drop policy "Users can create reviews for completed bookings" on "public"."reviews";

drop policy "Users can delete own reviews" on "public"."reviews";

drop policy "Users can update own reviews" on "public"."reviews";

drop policy "split_payments_simple" on "public"."split_payments";

drop policy "Only service role can access webhook events" on "public"."stripe_webhook_events";

drop policy "Only admins can access system settings" on "public"."system_settings";

drop policy "System users can manage training datasets" on "public"."training_datasets";

drop policy "Trending content is publicly readable" on "public"."trending_content";

drop policy "Public requests are viewable" on "public"."trip_requests";

drop policy "Users can manage own requests" on "public"."trip_requests";

drop policy "Users can manage own feed preferences" on "public"."user_feed_preferences";

drop policy "Admins can manage warnings" on "public"."user_warnings";

drop policy "Users can view their own warnings" on "public"."user_warnings";

drop policy "Bids viewable by parties" on "public"."vendor_bids";

drop policy "Vendors can manage own bids" on "public"."vendor_bids";

drop policy "Certifications are viewable by everyone" on "public"."vendor_certifications";

drop policy "Vendors can manage own certifications" on "public"."vendor_certifications";

drop policy "Moderation log viewable by moderators and admins" on "public"."vendor_forum_moderation_log";

drop policy "Moderators can log moderation actions" on "public"."vendor_forum_moderation_log";

drop policy "System can manage forum notifications" on "public"."vendor_forum_notifications";

drop policy "Vendors can view own forum notifications" on "public"."vendor_forum_notifications";

drop policy "Forum replies are viewable by all vendors" on "public"."vendor_forum_replies";

drop policy "Vendors can create forum replies" on "public"."vendor_forum_replies";

drop policy "Vendors can update own forum replies" on "public"."vendor_forum_replies";

drop policy "Forum reputation is viewable by all vendors" on "public"."vendor_forum_reputation";

drop policy "System can manage vendor reputation" on "public"."vendor_forum_reputation";

drop policy "Forum threads are viewable by all vendors" on "public"."vendor_forum_threads";

drop policy "Vendors can create forum threads" on "public"."vendor_forum_threads";

drop policy "Vendors can update own forum threads" on "public"."vendor_forum_threads";

drop policy "Vendors can manage own forum votes" on "public"."vendor_forum_votes";

drop policy "Vendors can view all forum votes" on "public"."vendor_forum_votes";

drop policy "Insurance viewable by vendor and admins" on "public"."vendor_insurance";

drop policy "Vendors can manage own insurance" on "public"."vendor_insurance";

drop policy "Users can view own payouts" on "public"."vendor_payouts";

drop policy "Users can create own Stripe accounts" on "public"."vendor_stripe_accounts";

drop policy "Users can update own Stripe accounts" on "public"."vendor_stripe_accounts";

drop policy "Users can view own Stripe accounts" on "public"."vendor_stripe_accounts";

drop policy "Users can insert own vendor profile" on "public"."vendors";

drop policy "Users can update own vendor profile" on "public"."vendors";

drop policy "Vendors are viewable by everyone" on "public"."vendors";

drop policy "Users can create WhatsApp groups" on "public"."whatsapp_groups";

drop policy "Users can delete their WhatsApp groups" on "public"."whatsapp_groups";

drop policy "Users can update their WhatsApp groups" on "public"."whatsapp_groups";

drop policy "Users can view their WhatsApp groups" on "public"."whatsapp_groups";

drop policy "Users can create WhatsApp messages" on "public"."whatsapp_messages";

drop policy "Users can view their WhatsApp messages" on "public"."whatsapp_messages";

drop policy "Service role can access WhatsApp webhooks" on "public"."whatsapp_webhooks";

revoke delete on table "public"."age_verification_logs" from "anon";

revoke insert on table "public"."age_verification_logs" from "anon";

revoke references on table "public"."age_verification_logs" from "anon";

revoke select on table "public"."age_verification_logs" from "anon";

revoke trigger on table "public"."age_verification_logs" from "anon";

revoke truncate on table "public"."age_verification_logs" from "anon";

revoke update on table "public"."age_verification_logs" from "anon";

revoke delete on table "public"."age_verification_logs" from "authenticated";

revoke insert on table "public"."age_verification_logs" from "authenticated";

revoke references on table "public"."age_verification_logs" from "authenticated";

revoke select on table "public"."age_verification_logs" from "authenticated";

revoke trigger on table "public"."age_verification_logs" from "authenticated";

revoke truncate on table "public"."age_verification_logs" from "authenticated";

revoke update on table "public"."age_verification_logs" from "authenticated";

revoke delete on table "public"."age_verification_logs" from "service_role";

revoke insert on table "public"."age_verification_logs" from "service_role";

revoke references on table "public"."age_verification_logs" from "service_role";

revoke select on table "public"."age_verification_logs" from "service_role";

revoke trigger on table "public"."age_verification_logs" from "service_role";

revoke truncate on table "public"."age_verification_logs" from "service_role";

revoke update on table "public"."age_verification_logs" from "service_role";

revoke delete on table "public"."compliance_logs" from "anon";

revoke insert on table "public"."compliance_logs" from "anon";

revoke references on table "public"."compliance_logs" from "anon";

revoke select on table "public"."compliance_logs" from "anon";

revoke trigger on table "public"."compliance_logs" from "anon";

revoke truncate on table "public"."compliance_logs" from "anon";

revoke update on table "public"."compliance_logs" from "anon";

revoke delete on table "public"."compliance_logs" from "authenticated";

revoke insert on table "public"."compliance_logs" from "authenticated";

revoke references on table "public"."compliance_logs" from "authenticated";

revoke select on table "public"."compliance_logs" from "authenticated";

revoke trigger on table "public"."compliance_logs" from "authenticated";

revoke truncate on table "public"."compliance_logs" from "authenticated";

revoke update on table "public"."compliance_logs" from "authenticated";

revoke delete on table "public"."compliance_logs" from "service_role";

revoke insert on table "public"."compliance_logs" from "service_role";

revoke references on table "public"."compliance_logs" from "service_role";

revoke select on table "public"."compliance_logs" from "service_role";

revoke trigger on table "public"."compliance_logs" from "service_role";

revoke truncate on table "public"."compliance_logs" from "service_role";

revoke update on table "public"."compliance_logs" from "service_role";

revoke delete on table "public"."cors_violations" from "anon";

revoke insert on table "public"."cors_violations" from "anon";

revoke references on table "public"."cors_violations" from "anon";

revoke select on table "public"."cors_violations" from "anon";

revoke trigger on table "public"."cors_violations" from "anon";

revoke truncate on table "public"."cors_violations" from "anon";

revoke update on table "public"."cors_violations" from "anon";

revoke delete on table "public"."cors_violations" from "authenticated";

revoke insert on table "public"."cors_violations" from "authenticated";

revoke references on table "public"."cors_violations" from "authenticated";

revoke select on table "public"."cors_violations" from "authenticated";

revoke trigger on table "public"."cors_violations" from "authenticated";

revoke truncate on table "public"."cors_violations" from "authenticated";

revoke update on table "public"."cors_violations" from "authenticated";

revoke delete on table "public"."cors_violations" from "service_role";

revoke insert on table "public"."cors_violations" from "service_role";

revoke references on table "public"."cors_violations" from "service_role";

revoke select on table "public"."cors_violations" from "service_role";

revoke trigger on table "public"."cors_violations" from "service_role";

revoke truncate on table "public"."cors_violations" from "service_role";

revoke update on table "public"."cors_violations" from "service_role";

revoke delete on table "public"."credential_access_logs" from "anon";

revoke insert on table "public"."credential_access_logs" from "anon";

revoke references on table "public"."credential_access_logs" from "anon";

revoke select on table "public"."credential_access_logs" from "anon";

revoke trigger on table "public"."credential_access_logs" from "anon";

revoke truncate on table "public"."credential_access_logs" from "anon";

revoke update on table "public"."credential_access_logs" from "anon";

revoke delete on table "public"."credential_access_logs" from "authenticated";

revoke insert on table "public"."credential_access_logs" from "authenticated";

revoke references on table "public"."credential_access_logs" from "authenticated";

revoke select on table "public"."credential_access_logs" from "authenticated";

revoke trigger on table "public"."credential_access_logs" from "authenticated";

revoke truncate on table "public"."credential_access_logs" from "authenticated";

revoke update on table "public"."credential_access_logs" from "authenticated";

revoke delete on table "public"."credential_access_logs" from "service_role";

revoke insert on table "public"."credential_access_logs" from "service_role";

revoke references on table "public"."credential_access_logs" from "service_role";

revoke select on table "public"."credential_access_logs" from "service_role";

revoke trigger on table "public"."credential_access_logs" from "service_role";

revoke truncate on table "public"."credential_access_logs" from "service_role";

revoke update on table "public"."credential_access_logs" from "service_role";

revoke delete on table "public"."credential_errors" from "anon";

revoke insert on table "public"."credential_errors" from "anon";

revoke references on table "public"."credential_errors" from "anon";

revoke select on table "public"."credential_errors" from "anon";

revoke trigger on table "public"."credential_errors" from "anon";

revoke truncate on table "public"."credential_errors" from "anon";

revoke update on table "public"."credential_errors" from "anon";

revoke delete on table "public"."credential_errors" from "authenticated";

revoke insert on table "public"."credential_errors" from "authenticated";

revoke references on table "public"."credential_errors" from "authenticated";

revoke select on table "public"."credential_errors" from "authenticated";

revoke trigger on table "public"."credential_errors" from "authenticated";

revoke truncate on table "public"."credential_errors" from "authenticated";

revoke update on table "public"."credential_errors" from "authenticated";

revoke delete on table "public"."credential_errors" from "service_role";

revoke insert on table "public"."credential_errors" from "service_role";

revoke references on table "public"."credential_errors" from "service_role";

revoke select on table "public"."credential_errors" from "service_role";

revoke trigger on table "public"."credential_errors" from "service_role";

revoke truncate on table "public"."credential_errors" from "service_role";

revoke update on table "public"."credential_errors" from "service_role";

alter table "public"."ab_test_assignments" drop constraint "ab_test_assignments_assigned_model_id_fkey";

alter table "public"."ab_test_assignments" drop constraint "ab_test_assignments_experiment_id_fkey";

alter table "public"."ab_test_assignments" drop constraint "ab_test_assignments_experiment_id_user_id_key";

alter table "public"."ab_test_assignments" drop constraint "ab_test_assignments_user_id_fkey";

alter table "public"."ab_test_experiments" drop constraint "ab_test_experiments_control_model_id_fkey";

alter table "public"."ab_test_experiments" drop constraint "ab_test_experiments_created_by_fkey";

alter table "public"."ab_test_experiments" drop constraint "ab_test_experiments_name_key";

alter table "public"."ab_test_experiments" drop constraint "ab_test_experiments_traffic_split_check";

alter table "public"."ab_test_experiments" drop constraint "ab_test_experiments_treatment_model_id_fkey";

alter table "public"."ab_test_experiments" drop constraint "ab_test_experiments_winner_model_id_fkey";

alter table "public"."adventure_availability" drop constraint "adventure_availability_adventure_id_date_start_time_key";

alter table "public"."adventure_availability" drop constraint "adventure_availability_adventure_id_fkey";

alter table "public"."adventure_media" drop constraint "adventure_media_adventure_id_fkey";

alter table "public"."adventure_media" drop constraint "adventure_media_media_type_check";

alter table "public"."adventures" drop constraint "adventures_vendor_id_fkey";

alter table "public"."appeal_notes" drop constraint "appeal_notes_appeal_id_fkey";

alter table "public"."appeal_notes" drop constraint "appeal_notes_moderator_id_fkey";

alter table "public"."appeal_notes" drop constraint "appeal_notes_note_type_check";

alter table "public"."assessment_responses" drop constraint "assessment_responses_response_value_check";

alter table "public"."assessment_responses" drop constraint "assessment_responses_user_id_fkey";

alter table "public"."assessment_responses" drop constraint "assessment_responses_user_id_question_id_key";

alter table "public"."background_job_results" drop constraint "background_job_results_job_id_key";

alter table "public"."bid_messages" drop constraint "bid_messages_bid_id_fkey";

alter table "public"."bid_messages" drop constraint "bid_messages_moderation_status_check";

alter table "public"."bid_messages" drop constraint "bid_messages_sender_id_fkey";

alter table "public"."bid_messages" drop constraint "bid_messages_visibility_check";

alter table "public"."booking_audit_logs" drop constraint "booking_audit_logs_booking_id_fkey";

alter table "public"."booking_audit_logs" drop constraint "booking_audit_logs_modification_request_id_fkey";

alter table "public"."booking_cancellations" drop constraint "booking_cancellations_booking_id_fkey";

alter table "public"."booking_cancellations" drop constraint "booking_cancellations_processed_by_fkey";

alter table "public"."booking_cancellations" drop constraint "booking_cancellations_user_id_fkey";

alter table "public"."booking_disputes" drop constraint "booking_disputes_booking_id_fkey";

alter table "public"."booking_modifications" drop constraint "booking_modifications_approved_by_fkey";

alter table "public"."booking_modifications" drop constraint "booking_modifications_booking_id_fkey";

alter table "public"."booking_modifications" drop constraint "booking_modifications_modification_type_check";

alter table "public"."booking_modifications" drop constraint "booking_modifications_modified_by_fkey";

alter table "public"."booking_participants" drop constraint "booking_participants_booking_id_fkey";

alter table "public"."booking_participants" drop constraint "booking_participants_payment_id_fkey";

alter table "public"."booking_participants" drop constraint "booking_participants_user_id_fkey";

alter table "public"."booking_payments" drop constraint "booking_payments_booking_id_fkey";

alter table "public"."booking_payments" drop constraint "booking_payments_payout_id_fkey";

alter table "public"."booking_payments" drop constraint "booking_payments_user_id_fkey";

alter table "public"."booking_payments" drop constraint "booking_payments_vendor_stripe_account_id_fkey";

alter table "public"."booking_service_disputes" drop constraint "booking_service_disputes_assigned_to_fkey";

alter table "public"."booking_service_disputes" drop constraint "booking_service_disputes_booking_id_fkey";

alter table "public"."booking_service_disputes" drop constraint "booking_service_disputes_related_modification_id_fkey";

alter table "public"."booking_service_disputes" drop constraint "booking_service_disputes_user_id_fkey";

alter table "public"."bookings" drop constraint "bookings_adventure_id_fkey";

alter table "public"."bookings" drop constraint "bookings_availability_id_fkey";

alter table "public"."bookings" drop constraint "bookings_booking_code_key";

alter table "public"."bookings" drop constraint "bookings_cancelled_by_fkey";

alter table "public"."bookings" drop constraint "bookings_user_id_fkey";

alter table "public"."bookings" drop constraint "bookings_vendor_id_fkey";

alter table "public"."community_connections" drop constraint "community_connections_check";

alter table "public"."community_connections" drop constraint "community_connections_connected_user_id_fkey";

alter table "public"."community_connections" drop constraint "community_connections_user_id_connected_user_id_key";

alter table "public"."community_connections" drop constraint "community_connections_user_id_fkey";

alter table "public"."community_posts" drop constraint "community_posts_group_id_fkey";

alter table "public"."community_posts" drop constraint "community_posts_user_id_fkey";

alter table "public"."compatibility_algorithms" drop constraint "compatibility_algorithms_name_key";

alter table "public"."connection_requests" drop constraint "connection_requests_recipient_id_fkey";

alter table "public"."connection_requests" drop constraint "connection_requests_requester_id_fkey";

alter table "public"."connection_requests" drop constraint "connection_requests_requester_id_recipient_id_key";

alter table "public"."connection_requests" drop constraint "connection_requests_status_check";

alter table "public"."content_discovery_log" drop constraint "content_discovery_log_discovery_method_check";

alter table "public"."content_discovery_log" drop constraint "content_discovery_log_post_id_fkey";

alter table "public"."content_discovery_log" drop constraint "content_discovery_log_user_id_fkey";

alter table "public"."content_filter_rules" drop constraint "content_filter_rules_action_check";

alter table "public"."content_filter_rules" drop constraint "content_filter_rules_created_by_fkey";

alter table "public"."content_filter_rules" drop constraint "content_filter_rules_rule_type_check";

alter table "public"."content_filter_rules" drop constraint "content_filter_rules_severity_check";

alter table "public"."content_reports" drop constraint "content_reports_content_type_check";

alter table "public"."content_reports" drop constraint "content_reports_report_category_check";

alter table "public"."content_reports" drop constraint "content_reports_reporter_id_fkey";

alter table "public"."content_reports" drop constraint "content_reports_severity_check";

alter table "public"."content_reports" drop constraint "content_reports_status_check";

alter table "public"."content_scores" drop constraint "content_scores_post_id_fkey";

alter table "public"."content_scores" drop constraint "content_scores_post_id_key";

alter table "public"."cors_violations" drop constraint "cors_violations_severity_check";

alter table "public"."credential_access_logs" drop constraint "credential_access_logs_user_id_fkey";

alter table "public"."credential_errors" drop constraint "credential_errors_user_id_fkey";

alter table "public"."currency_exchange_rates" drop constraint "currency_exchange_rates_base_currency_target_currency_valid_key";

alter table "public"."dispute_threads" drop constraint "dispute_threads_dispute_id_fkey";

alter table "public"."dispute_threads" drop constraint "dispute_threads_user_id_fkey";

alter table "public"."engagement_scores" drop constraint "engagement_scores_user_id_fkey";

alter table "public"."engagement_scores" drop constraint "engagement_scores_user_id_key";

alter table "public"."fcm_tokens" drop constraint "fcm_tokens_device_type_check";

alter table "public"."fcm_tokens" drop constraint "fcm_tokens_token_key";

alter table "public"."fcm_tokens" drop constraint "fcm_tokens_user_id_fkey";

alter table "public"."fcm_tokens" drop constraint "fcm_tokens_user_id_token_key";

alter table "public"."group_compatibility_scores" drop constraint "group_compatibility_scores_compatibility_score_check";

alter table "public"."group_compatibility_scores" drop constraint "group_compatibility_scores_group_id_fkey";

alter table "public"."group_compatibility_scores" drop constraint "group_compatibility_scores_group_id_user_id_key";

alter table "public"."group_compatibility_scores" drop constraint "group_compatibility_scores_user_id_fkey";

alter table "public"."group_invitations" drop constraint "group_invitations_group_id_fkey";

alter table "public"."group_invitations" drop constraint "group_invitations_invitation_code_key";

alter table "public"."group_invitations" drop constraint "group_invitations_invited_by_fkey";

alter table "public"."group_invitations" drop constraint "group_invitations_invited_user_id_fkey";

alter table "public"."group_invitations" drop constraint "group_invitations_status_check";

alter table "public"."group_members" drop constraint "group_members_group_id_fkey";

alter table "public"."group_members" drop constraint "group_members_group_id_user_id_key";

alter table "public"."group_members" drop constraint "group_members_invited_by_fkey";

alter table "public"."group_members" drop constraint "group_members_user_id_fkey";

alter table "public"."groups" drop constraint "groups_owner_id_fkey";

alter table "public"."individual_payments" drop constraint "individual_payments_split_payment_id_fkey";

alter table "public"."individual_payments" drop constraint "individual_payments_user_id_fkey";

alter table "public"."invoice_line_items" drop constraint "invoice_line_items_invoice_id_fkey";

alter table "public"."invoices" drop constraint "invoices_booking_id_fkey";

alter table "public"."invoices" drop constraint "invoices_invoice_number_key";

alter table "public"."invoices" drop constraint "invoices_status_check";

alter table "public"."invoices" drop constraint "invoices_user_id_fkey";

alter table "public"."invoices" drop constraint "invoices_vendor_id_fkey";

alter table "public"."media_files" drop constraint "media_files_file_type_check";

alter table "public"."media_files" drop constraint "media_files_user_id_fkey";

alter table "public"."ml_models" drop constraint "ml_models_created_by_fkey";

alter table "public"."ml_models" drop constraint "ml_models_model_type_check";

alter table "public"."ml_models" drop constraint "ml_models_name_version_key";

alter table "public"."model_performance_metrics" drop constraint "model_performance_metrics_metric_type_check";

alter table "public"."model_performance_metrics" drop constraint "model_performance_metrics_model_id_fkey";

alter table "public"."model_predictions" drop constraint "model_predictions_group_id_fkey";

alter table "public"."model_predictions" drop constraint "model_predictions_model_id_fkey";

alter table "public"."model_predictions" drop constraint "model_predictions_user_id_fkey";

alter table "public"."model_training_runs" drop constraint "model_training_runs_dataset_id_fkey";

alter table "public"."model_training_runs" drop constraint "model_training_runs_model_id_fkey";

alter table "public"."model_training_runs" drop constraint "model_training_runs_status_check";

alter table "public"."moderation_appeals" drop constraint "moderation_appeals_appeal_type_check";

alter table "public"."moderation_appeals" drop constraint "moderation_appeals_assigned_moderator_fkey";

alter table "public"."moderation_appeals" drop constraint "moderation_appeals_original_moderator_fkey";

alter table "public"."moderation_appeals" drop constraint "moderation_appeals_priority_check";

alter table "public"."moderation_appeals" drop constraint "moderation_appeals_status_check";

alter table "public"."moderation_appeals" drop constraint "moderation_appeals_user_id_fkey";

alter table "public"."moderation_logs" drop constraint "moderation_logs_moderator_id_fkey";

alter table "public"."moderation_logs" drop constraint "moderation_logs_user_id_fkey";

alter table "public"."moderation_queue" drop constraint "moderation_queue_assigned_moderator_fkey";

alter table "public"."moderation_queue" drop constraint "moderation_queue_priority_check";

alter table "public"."moderation_queue" drop constraint "moderation_queue_report_id_fkey";

alter table "public"."moderation_queue" drop constraint "moderation_queue_status_check";

alter table "public"."notification_analytics" drop constraint "notification_analytics_event_type_check";

alter table "public"."notification_analytics" drop constraint "notification_analytics_notification_id_fkey";

alter table "public"."notification_analytics" drop constraint "notification_analytics_user_id_fkey";

alter table "public"."notification_queue" drop constraint "notification_queue_status_check";

alter table "public"."notification_queue" drop constraint "notification_queue_user_id_fkey";

alter table "public"."notification_templates" drop constraint "notification_templates_name_key";

alter table "public"."notifications" drop constraint "notifications_user_id_fkey";

alter table "public"."payment_audit_trail" drop constraint "payment_audit_trail_payment_id_fkey";

alter table "public"."payment_discrepancies" drop constraint "payment_discrepancies_reconciliation_id_fkey";

alter table "public"."payment_disputes" drop constraint "payment_disputes_booking_id_fkey";

alter table "public"."payment_disputes" drop constraint "payment_disputes_status_check";

alter table "public"."payment_disputes" drop constraint "payment_disputes_stripe_dispute_id_key";

alter table "public"."payment_disputes" drop constraint "payment_disputes_user_id_fkey";

alter table "public"."payment_reconciliations" drop constraint "payment_reconciliations_vendor_account_id_fkey";

alter table "public"."payment_refunds" drop constraint "payment_refunds_individual_payment_id_fkey";

alter table "public"."payment_refunds" drop constraint "payment_refunds_refund_request_id_fkey";

alter table "public"."payment_refunds" drop constraint "payment_refunds_split_payment_id_fkey";

alter table "public"."payment_reminders" drop constraint "payment_reminders_individual_payment_id_fkey";

alter table "public"."payment_splits" drop constraint "payment_splits_booking_id_fkey";

alter table "public"."payment_splits" drop constraint "payment_splits_payment_id_fkey";

alter table "public"."payment_splits" drop constraint "payment_splits_user_id_fkey";

alter table "public"."payment_tokens" drop constraint "payment_tokens_individual_payment_id_fkey";

alter table "public"."payment_tokens" drop constraint "payment_tokens_token_key";

alter table "public"."payout_failures" drop constraint "payout_failures_vendor_stripe_account_id_fkey";

alter table "public"."payout_hold_logs" drop constraint "payout_hold_logs_hold_id_fkey";

alter table "public"."payout_holds" drop constraint "payout_holds_vendor_stripe_account_id_fkey";

alter table "public"."payout_holds_system" drop constraint "payout_holds_system_vendor_stripe_account_id_fkey";

alter table "public"."payout_holds_system" drop constraint "valid_release_date";

alter table "public"."payout_holds_system" drop constraint "valid_release_timing";

alter table "public"."payout_line_items" drop constraint "payout_line_items_booking_id_fkey";

alter table "public"."payout_line_items" drop constraint "payout_line_items_payment_id_fkey";

alter table "public"."payout_line_items" drop constraint "payout_line_items_payout_id_fkey";

alter table "public"."payout_schedule_jobs" drop constraint "payout_schedule_jobs_vendor_stripe_account_id_fkey";

alter table "public"."personality_assessments" drop constraint "personality_assessments_adventure_style_check";

alter table "public"."personality_assessments" drop constraint "personality_assessments_agreeableness_check";

alter table "public"."personality_assessments" drop constraint "personality_assessments_budget_preference_check";

alter table "public"."personality_assessments" drop constraint "personality_assessments_conscientiousness_check";

alter table "public"."personality_assessments" drop constraint "personality_assessments_extraversion_check";

alter table "public"."personality_assessments" drop constraint "personality_assessments_group_preference_check";

alter table "public"."personality_assessments" drop constraint "personality_assessments_neuroticism_check";

alter table "public"."personality_assessments" drop constraint "personality_assessments_openness_check";

alter table "public"."personality_assessments" drop constraint "personality_assessments_planning_style_check";

alter table "public"."personality_assessments" drop constraint "personality_assessments_user_id_fkey";

alter table "public"."personality_assessments" drop constraint "personality_assessments_user_id_key";

alter table "public"."post_comments" drop constraint "post_comments_parent_comment_id_fkey";

alter table "public"."post_comments" drop constraint "post_comments_post_id_fkey";

alter table "public"."post_comments" drop constraint "post_comments_user_id_fkey";

alter table "public"."post_interaction_sessions" drop constraint "post_interaction_sessions_post_id_fkey";

alter table "public"."post_interaction_sessions" drop constraint "post_interaction_sessions_user_id_fkey";

alter table "public"."post_reactions" drop constraint "post_reactions_post_id_fkey";

alter table "public"."post_reactions" drop constraint "post_reactions_post_id_user_id_key";

alter table "public"."post_reactions" drop constraint "post_reactions_reaction_type_check";

alter table "public"."post_reactions" drop constraint "post_reactions_user_id_fkey";

alter table "public"."post_saves" drop constraint "post_saves_post_id_fkey";

alter table "public"."post_saves" drop constraint "post_saves_post_id_user_id_key";

alter table "public"."post_saves" drop constraint "post_saves_user_id_fkey";

alter table "public"."post_shares" drop constraint "post_shares_post_id_fkey";

alter table "public"."post_shares" drop constraint "post_shares_share_type_check";

alter table "public"."post_shares" drop constraint "post_shares_user_id_fkey";

alter table "public"."post_views" drop constraint "post_views_post_id_fkey";

alter table "public"."post_views" drop constraint "post_views_user_id_fkey";

alter table "public"."profiles" drop constraint "check_minimum_age_or_encrypted";

alter table "public"."profiles" drop constraint "profiles_account_status_check";

alter table "public"."profiles" drop constraint "profiles_username_key";

alter table "public"."reconciliation_schedules" drop constraint "reconciliation_schedules_vendor_account_id_fkey";

alter table "public"."refund_requests" drop constraint "refund_requests_booking_id_fkey";

alter table "public"."refund_requests" drop constraint "refund_requests_reason_category_check";

alter table "public"."refund_requests" drop constraint "refund_requests_requested_amount_type_check";

alter table "public"."refund_requests" drop constraint "refund_requests_reviewed_by_fkey";

alter table "public"."refund_requests" drop constraint "refund_requests_split_payment_id_fkey";

alter table "public"."refund_requests" drop constraint "refund_requests_status_check";

alter table "public"."refund_requests" drop constraint "refund_requests_user_id_fkey";

alter table "public"."request_invitations" drop constraint "request_invitations_invited_by_fkey";

alter table "public"."request_invitations" drop constraint "request_invitations_status_check";

alter table "public"."request_invitations" drop constraint "request_invitations_trip_request_id_fkey";

alter table "public"."request_invitations" drop constraint "request_invitations_trip_request_id_vendor_id_key";

alter table "public"."request_invitations" drop constraint "request_invitations_vendor_id_fkey";

alter table "public"."retraining_jobs" drop constraint "retraining_jobs_model_id_fkey";

alter table "public"."retraining_jobs" drop constraint "retraining_jobs_new_model_id_fkey";

alter table "public"."retraining_jobs" drop constraint "retraining_jobs_status_check";

alter table "public"."retraining_jobs" drop constraint "retraining_jobs_trigger_id_fkey";

alter table "public"."retraining_triggers" drop constraint "retraining_triggers_model_type_check";

alter table "public"."retraining_triggers" drop constraint "retraining_triggers_name_key";

alter table "public"."retraining_triggers" drop constraint "retraining_triggers_trigger_type_check";

alter table "public"."reviews" drop constraint "reviews_adventure_id_fkey";

alter table "public"."reviews" drop constraint "reviews_booking_id_fkey";

alter table "public"."reviews" drop constraint "reviews_booking_id_user_id_key";

alter table "public"."reviews" drop constraint "reviews_rating_check";

alter table "public"."reviews" drop constraint "reviews_user_id_fkey";

alter table "public"."reviews" drop constraint "reviews_vendor_id_fkey";

alter table "public"."split_payment_settings" drop constraint "split_payment_settings_split_payment_id_fkey";

alter table "public"."split_payments" drop constraint "split_payments_booking_id_fkey";

alter table "public"."split_payments" drop constraint "split_payments_organizer_id_fkey";

alter table "public"."stripe_webhook_events" drop constraint "stripe_webhook_events_stripe_event_id_key";

alter table "public"."system_settings" drop constraint "system_settings_setting_key_key";

alter table "public"."trending_content" drop constraint "trending_content_post_id_fkey";

alter table "public"."trending_content" drop constraint "trending_content_post_id_time_window_hours_key";

alter table "public"."trip_requests" drop constraint "trip_requests_status_check";

alter table "public"."trip_requests" drop constraint "trip_requests_user_id_fkey";

alter table "public"."trip_requests" drop constraint "trip_requests_visibility_check";

alter table "public"."user_feed_preferences" drop constraint "user_feed_preferences_algorithm_preference_check";

alter table "public"."user_feed_preferences" drop constraint "user_feed_preferences_diversity_weight_check";

alter table "public"."user_feed_preferences" drop constraint "user_feed_preferences_user_id_fkey";

alter table "public"."user_feed_preferences" drop constraint "user_feed_preferences_user_id_key";

alter table "public"."user_preferences" drop constraint "user_preferences_notification_frequency_check";

alter table "public"."user_preferences" drop constraint "user_preferences_privacy_level_check";

alter table "public"."user_preferences" drop constraint "user_preferences_theme_check";

alter table "public"."user_restrictions" drop constraint "user_restrictions_restricted_by_fkey";

alter table "public"."user_restrictions" drop constraint "user_restrictions_restriction_type_check";

alter table "public"."user_restrictions" drop constraint "user_restrictions_user_id_fkey";

alter table "public"."user_warnings" drop constraint "user_warnings_issued_by_fkey";

alter table "public"."user_warnings" drop constraint "user_warnings_severity_check";

alter table "public"."user_warnings" drop constraint "user_warnings_user_id_fkey";

alter table "public"."vendor_bids" drop constraint "vendor_bids_trip_request_id_fkey";

alter table "public"."vendor_bids" drop constraint "vendor_bids_trip_request_id_vendor_id_key";

alter table "public"."vendor_bids" drop constraint "vendor_bids_vendor_id_fkey";

alter table "public"."vendor_certifications" drop constraint "vendor_certifications_vendor_id_fkey";

alter table "public"."vendor_forum_moderation_log" drop constraint "vendor_forum_moderation_log_action_type_check";

alter table "public"."vendor_forum_moderation_log" drop constraint "vendor_forum_moderation_log_moderator_vendor_id_fkey";

alter table "public"."vendor_forum_moderation_log" drop constraint "vendor_forum_moderation_log_reply_id_fkey";

alter table "public"."vendor_forum_moderation_log" drop constraint "vendor_forum_moderation_log_thread_id_fkey";

alter table "public"."vendor_forum_notifications" drop constraint "vendor_forum_notifications_notification_type_check";

alter table "public"."vendor_forum_notifications" drop constraint "vendor_forum_notifications_reply_id_fkey";

alter table "public"."vendor_forum_notifications" drop constraint "vendor_forum_notifications_thread_id_fkey";

alter table "public"."vendor_forum_notifications" drop constraint "vendor_forum_notifications_vendor_id_fkey";

alter table "public"."vendor_forum_replies" drop constraint "vendor_forum_replies_parent_reply_id_fkey";

alter table "public"."vendor_forum_replies" drop constraint "vendor_forum_replies_thread_id_fkey";

alter table "public"."vendor_forum_replies" drop constraint "vendor_forum_replies_vendor_id_fkey";

alter table "public"."vendor_forum_reputation" drop constraint "vendor_forum_reputation_reputation_level_check";

alter table "public"."vendor_forum_reputation" drop constraint "vendor_forum_reputation_vendor_id_fkey";

alter table "public"."vendor_forum_reputation" drop constraint "vendor_forum_reputation_vendor_id_key";

alter table "public"."vendor_forum_threads" drop constraint "vendor_forum_threads_last_reply_vendor_id_fkey";

alter table "public"."vendor_forum_threads" drop constraint "vendor_forum_threads_vendor_id_fkey";

alter table "public"."vendor_forum_votes" drop constraint "vendor_forum_votes_check";

alter table "public"."vendor_forum_votes" drop constraint "vendor_forum_votes_reply_id_fkey";

alter table "public"."vendor_forum_votes" drop constraint "vendor_forum_votes_thread_id_fkey";

alter table "public"."vendor_forum_votes" drop constraint "vendor_forum_votes_vendor_id_fkey";

alter table "public"."vendor_forum_votes" drop constraint "vendor_forum_votes_vendor_id_reply_id_key";

alter table "public"."vendor_forum_votes" drop constraint "vendor_forum_votes_vendor_id_thread_id_key";

alter table "public"."vendor_forum_votes" drop constraint "vendor_forum_votes_vote_type_check";

alter table "public"."vendor_forums" drop constraint "vendor_forums_vendor_id_fkey";

alter table "public"."vendor_insurance" drop constraint "vendor_insurance_vendor_id_fkey";

alter table "public"."vendor_payouts" drop constraint "vendor_payouts_stripe_payout_id_key";

alter table "public"."vendor_payouts" drop constraint "vendor_payouts_vendor_stripe_account_id_fkey";

alter table "public"."vendor_stripe_accounts" drop constraint "valid_minimum_payout";

alter table "public"."vendor_stripe_accounts" drop constraint "valid_platform_fee";

alter table "public"."vendor_stripe_accounts" drop constraint "vendor_stripe_accounts_stripe_account_id_key";

alter table "public"."vendor_stripe_accounts" drop constraint "vendor_stripe_accounts_user_id_fkey";

alter table "public"."vendor_stripe_accounts" drop constraint "vendor_stripe_accounts_vendor_id_fkey";

alter table "public"."vendors" drop constraint "vendors_user_id_fkey";

alter table "public"."vendors" drop constraint "vendors_user_id_key";

alter table "public"."vendors" drop constraint "vendors_verification_status_check";

alter table "public"."whatsapp_groups" drop constraint "whatsapp_groups_admin_user_id_fkey";

alter table "public"."whatsapp_groups" drop constraint "whatsapp_groups_adventure_id_fkey";

alter table "public"."whatsapp_groups" drop constraint "whatsapp_groups_created_by_fkey";

alter table "public"."whatsapp_groups" drop constraint "whatsapp_groups_status_check";

alter table "public"."whatsapp_messages" drop constraint "whatsapp_messages_message_type_check";

alter table "public"."whatsapp_messages" drop constraint "whatsapp_messages_moderation_status_check";

alter table "public"."whatsapp_messages" drop constraint "whatsapp_messages_status_check";

alter table "public"."whatsapp_messages" drop constraint "whatsapp_messages_user_id_fkey";

alter table "public"."whatsapp_messages" drop constraint "whatsapp_messages_visibility_check";

alter table "public"."user_preferences" drop constraint "user_preferences_user_id_fkey";

drop index if exists "public"."idx_mv_hot_compatibility_score";

drop index if exists "public"."idx_mv_hot_compatibility_unique";

drop function if exists "public"."auto_categorize_webhook_error"();

drop function if exists "public"."calculate_compatibility_score"(p_user1_id uuid, p_user2_id uuid);

drop function if exists "public"."calculate_connection_strength"(p_user_id uuid, p_connected_user_id uuid);

drop function if exists "public"."calculate_platform_fee"(amount integer, vendor_account_id uuid);

drop function if exists "public"."categorize_webhook_error"(error_message text);

drop function if exists "public"."cleanup_expired_notifications"();

drop function if exists "public"."cleanup_expired_payment_tokens"();

drop function if exists "public"."cleanup_expired_restrictions"();

drop function if exists "public"."cleanup_expired_trending_content"();

drop function if exists "public"."cleanup_expired_warnings"();

drop function if exists "public"."cleanup_old_compatibility_scores"(p_days_to_keep integer);

drop function if exists "public"."cleanup_old_cors_violations"();

drop function if exists "public"."cleanup_old_whatsapp_webhooks"();

drop view if exists "public"."compliance_metrics";

drop view if exists "public"."connection_analytics";

drop function if exists "public"."create_vault_secret"(secret_name text, secret_value text);

drop view if exists "public"."credential_status_summary";

drop function if exists "public"."generate_invoice_number"();

drop function if exists "public"."get_adventure_availability"(p_adventure_id uuid, p_date_from date, p_date_to date);

drop function if exists "public"."get_compatibility_score_fast"(p_user_id uuid, p_group_id uuid, p_max_age_hours integer);

drop function if exists "public"."get_connection_recommendations"(p_user_id uuid, p_limit integer);

drop function if exists "public"."get_cors_violation_stats"(timeframe_hours integer);

drop function if exists "public"."get_failed_webhooks"(hours_back integer, max_attempts integer);

drop function if exists "public"."get_latest_exchange_rate"(base_curr character varying, target_curr character varying);

drop function if exists "public"."get_pending_payout_amount"(vendor_account_id uuid);

drop function if exists "public"."get_vault_secret"(secret_name text);

drop function if exists "public"."get_vendor_analytics"(p_vendor_id uuid);

drop function if exists "public"."get_vendor_stripe_account"(vendor_user_id uuid);

drop function if exists "public"."get_webhook_stats"(hours_back integer);

drop function if exists "public"."handle_birth_date_encryption"();

drop function if exists "public"."has_active_payout_hold"(vendor_account_id uuid);

drop view if exists "public"."invoice_stats";

drop function if exists "public"."log_age_verification"(user_id uuid, verification_result boolean, date_of_birth date, encrypted_birth_date text, error_reason text);

drop function if exists "public"."log_age_verification"(user_id uuid, verification_result boolean, date_of_birth date, error_reason text);

drop function if exists "public"."log_cors_violation"(p_origin text, p_endpoint text, p_method text, p_severity text, p_user_agent text, p_ip_address text, p_referer text, p_session_id text);

drop function if exists "public"."log_query_performance"();

drop function if exists "public"."mark_payments_eligible_for_payout"();

drop view if exists "public"."moderation_stats";

drop materialized view if exists "public"."mv_hot_compatibility_scores";

drop function if exists "public"."notify_modification_status_change"();

drop function if exists "public"."process_group_payment"(p_booking_id uuid, p_split_type text);

drop function if exists "public"."process_notification_queue"();

drop function if exists "public"."process_payout_eligibility"();

drop view if exists "public"."profile_encryption_status";

drop function if exists "public"."refresh_content_scores"(p_post_id uuid);

drop function if exists "public"."refresh_hot_compatibility_cache"();

drop view if exists "public"."refund_tracking_view";

drop function if exists "public"."search_adventures"(p_search_text text, p_category adventure_category, p_min_price numeric, p_max_price numeric, p_location text, p_date date);

drop function if exists "public"."set_invoice_number"();

drop view if exists "public"."split_payment_summary";

drop function if exists "public"."update_compliance_logs_updated_at"();

drop function if exists "public"."update_connection_strength"();

drop function if exists "public"."update_connection_strength_trigger"();

drop function if exists "public"."update_cors_violations_updated_at"();

drop function if exists "public"."update_engagement_scores"(p_user_id uuid);

drop function if exists "public"."update_group_member_count"();

drop function if exists "public"."update_modified_column"();

drop function if exists "public"."update_post_engagement_counts"();

drop function if exists "public"."update_split_payment_status"();

drop function if exists "public"."update_thread_reply_stats"();

drop function if exists "public"."update_updated_at_column"();

drop function if exists "public"."update_user_engagement_score"(p_user_id uuid);

drop function if exists "public"."update_user_warning_count"();

drop function if exists "public"."update_vendor_rating"();

drop function if exists "public"."update_vote_counts"();

drop view if exists "public"."v_index_usage_stats";

drop function if exists "public"."validate_age_on_update"();

drop function if exists "public"."warm_compatibility_cache"(p_user_ids uuid[], p_group_id uuid);

drop view if exists "public"."webhook_monitoring_dashboard";

alter table "public"."ab_test_assignments" drop constraint "ab_test_assignments_pkey";

alter table "public"."ab_test_experiments" drop constraint "ab_test_experiments_pkey";

alter table "public"."adventure_availability" drop constraint "adventure_availability_pkey";

alter table "public"."adventure_media" drop constraint "adventure_media_pkey";

alter table "public"."adventures" drop constraint "adventures_pkey";

alter table "public"."age_verification_logs" drop constraint "age_verification_logs_pkey";

alter table "public"."appeal_notes" drop constraint "appeal_notes_pkey";

alter table "public"."assessment_responses" drop constraint "assessment_responses_pkey";

alter table "public"."background_job_results" drop constraint "background_job_results_pkey";

alter table "public"."bid_messages" drop constraint "bid_messages_pkey";

alter table "public"."booking_audit_logs" drop constraint "booking_audit_logs_pkey";

alter table "public"."booking_cancellations" drop constraint "booking_cancellations_pkey";

alter table "public"."booking_disputes" drop constraint "booking_disputes_pkey";

alter table "public"."booking_modifications" drop constraint "booking_modifications_pkey";

alter table "public"."booking_participants" drop constraint "booking_participants_pkey";

alter table "public"."booking_payments" drop constraint "booking_payments_pkey";

alter table "public"."booking_service_disputes" drop constraint "booking_service_disputes_pkey";

alter table "public"."bookings" drop constraint "bookings_pkey";

alter table "public"."community_connections" drop constraint "community_connections_pkey";

alter table "public"."community_posts" drop constraint "community_posts_pkey";

alter table "public"."compatibility_algorithms" drop constraint "compatibility_algorithms_pkey";

alter table "public"."compliance_logs" drop constraint "compliance_logs_pkey";

alter table "public"."connection_requests" drop constraint "connection_requests_pkey";

alter table "public"."content_analysis_results" drop constraint "content_analysis_results_pkey";

alter table "public"."content_discovery_log" drop constraint "content_discovery_log_pkey";

alter table "public"."content_filter_rules" drop constraint "content_filter_rules_pkey";

alter table "public"."content_reports" drop constraint "content_reports_pkey";

alter table "public"."content_scores" drop constraint "content_scores_pkey";

alter table "public"."cors_violations" drop constraint "cors_violations_pkey";

alter table "public"."credential_access_logs" drop constraint "credential_access_logs_pkey";

alter table "public"."credential_errors" drop constraint "credential_errors_pkey";

alter table "public"."currency_exchange_rates" drop constraint "currency_exchange_rates_pkey";

alter table "public"."dispute_threads" drop constraint "dispute_threads_pkey";

alter table "public"."engagement_scores" drop constraint "engagement_scores_pkey";

alter table "public"."fcm_tokens" drop constraint "fcm_tokens_pkey";

alter table "public"."group_compatibility_scores" drop constraint "group_compatibility_scores_pkey";

alter table "public"."group_invitations" drop constraint "group_invitations_pkey";

alter table "public"."group_members" drop constraint "group_members_pkey";

alter table "public"."groups" drop constraint "groups_pkey";

alter table "public"."individual_payments" drop constraint "individual_payments_pkey";

alter table "public"."invoice_line_items" drop constraint "invoice_line_items_pkey";

alter table "public"."invoices" drop constraint "invoices_pkey";

alter table "public"."media_files" drop constraint "media_files_pkey";

alter table "public"."ml_models" drop constraint "ml_models_pkey";

alter table "public"."model_performance_metrics" drop constraint "model_performance_metrics_pkey";

alter table "public"."model_predictions" drop constraint "model_predictions_pkey";

alter table "public"."model_training_runs" drop constraint "model_training_runs_pkey";

alter table "public"."moderation_appeals" drop constraint "moderation_appeals_pkey";

alter table "public"."moderation_logs" drop constraint "moderation_logs_pkey";

alter table "public"."moderation_queue" drop constraint "moderation_queue_pkey";

alter table "public"."notification_analytics" drop constraint "notification_analytics_pkey";

alter table "public"."notification_queue" drop constraint "notification_queue_pkey";

alter table "public"."notification_templates" drop constraint "notification_templates_pkey";

alter table "public"."notifications" drop constraint "notifications_pkey";

alter table "public"."payment_audit_trail" drop constraint "payment_audit_trail_pkey";

alter table "public"."payment_discrepancies" drop constraint "payment_discrepancies_pkey";

alter table "public"."payment_disputes" drop constraint "payment_disputes_pkey";

alter table "public"."payment_reconciliations" drop constraint "payment_reconciliations_pkey";

alter table "public"."payment_refunds" drop constraint "payment_refunds_pkey";

alter table "public"."payment_reminders" drop constraint "payment_reminders_pkey";

alter table "public"."payment_splits" drop constraint "payment_splits_pkey";

alter table "public"."payment_tokens" drop constraint "payment_tokens_pkey";

alter table "public"."payout_failures" drop constraint "payout_failures_pkey";

alter table "public"."payout_hold_logs" drop constraint "payout_hold_logs_pkey";

alter table "public"."payout_holds" drop constraint "payout_holds_pkey";

alter table "public"."payout_holds_system" drop constraint "payout_holds_system_pkey";

alter table "public"."payout_line_items" drop constraint "payout_line_items_pkey";

alter table "public"."payout_schedule_jobs" drop constraint "payout_schedule_jobs_pkey";

alter table "public"."personality_assessments" drop constraint "personality_assessments_pkey";

alter table "public"."post_comments" drop constraint "post_comments_pkey";

alter table "public"."post_interaction_sessions" drop constraint "post_interaction_sessions_pkey";

alter table "public"."post_reactions" drop constraint "post_reactions_pkey";

alter table "public"."post_saves" drop constraint "post_saves_pkey";

alter table "public"."post_shares" drop constraint "post_shares_pkey";

alter table "public"."post_views" drop constraint "post_views_pkey";

alter table "public"."query_performance_logs" drop constraint "query_performance_logs_pkey";

alter table "public"."reconciliation_schedules" drop constraint "reconciliation_schedules_pkey";

alter table "public"."refund_requests" drop constraint "refund_requests_pkey";

alter table "public"."request_invitations" drop constraint "request_invitations_pkey";

alter table "public"."retraining_jobs" drop constraint "retraining_jobs_pkey";

alter table "public"."retraining_triggers" drop constraint "retraining_triggers_pkey";

alter table "public"."reviews" drop constraint "reviews_pkey";

alter table "public"."split_payment_settings" drop constraint "split_payment_settings_pkey";

alter table "public"."split_payments" drop constraint "split_payments_pkey";

alter table "public"."stripe_webhook_events" drop constraint "stripe_webhook_events_pkey";

alter table "public"."system_logs" drop constraint "system_logs_pkey";

alter table "public"."system_settings" drop constraint "system_settings_pkey";

alter table "public"."training_datasets" drop constraint "training_datasets_pkey";

alter table "public"."trending_content" drop constraint "trending_content_pkey";

alter table "public"."trip_requests" drop constraint "trip_requests_pkey";

alter table "public"."user_feed_preferences" drop constraint "user_feed_preferences_pkey";

alter table "public"."user_restrictions" drop constraint "user_restrictions_pkey";

alter table "public"."user_warnings" drop constraint "user_warnings_pkey";

alter table "public"."vendor_bids" drop constraint "vendor_bids_pkey";

alter table "public"."vendor_certifications" drop constraint "vendor_certifications_pkey";

alter table "public"."vendor_forum_moderation_log" drop constraint "vendor_forum_moderation_log_pkey";

alter table "public"."vendor_forum_notifications" drop constraint "vendor_forum_notifications_pkey";

alter table "public"."vendor_forum_replies" drop constraint "vendor_forum_replies_pkey";

alter table "public"."vendor_forum_reputation" drop constraint "vendor_forum_reputation_pkey";

alter table "public"."vendor_forum_threads" drop constraint "vendor_forum_threads_pkey";

alter table "public"."vendor_forum_votes" drop constraint "vendor_forum_votes_pkey";

alter table "public"."vendor_forums" drop constraint "vendor_forums_pkey";

alter table "public"."vendor_insurance" drop constraint "vendor_insurance_pkey";

alter table "public"."vendor_payouts" drop constraint "vendor_payouts_pkey";

alter table "public"."vendor_stripe_accounts" drop constraint "vendor_stripe_accounts_pkey";

alter table "public"."vendors" drop constraint "vendors_pkey";

alter table "public"."whatsapp_groups" drop constraint "whatsapp_groups_pkey";

alter table "public"."whatsapp_messages" drop constraint "whatsapp_messages_pkey";

alter table "public"."whatsapp_webhooks" drop constraint "whatsapp_webhooks_pkey";

drop index if exists "public"."ab_test_assignments_experiment_id_user_id_key";

drop index if exists "public"."ab_test_assignments_pkey";

drop index if exists "public"."ab_test_experiments_name_key";

drop index if exists "public"."ab_test_experiments_pkey";

drop index if exists "public"."adventure_availability_adventure_id_date_start_time_key";

drop index if exists "public"."adventure_availability_pkey";

drop index if exists "public"."adventure_media_pkey";

drop index if exists "public"."adventures_pkey";

drop index if exists "public"."age_verification_logs_pkey";

drop index if exists "public"."appeal_notes_pkey";

drop index if exists "public"."assessment_responses_pkey";

drop index if exists "public"."assessment_responses_user_id_question_id_key";

drop index if exists "public"."background_job_results_job_id_key";

drop index if exists "public"."background_job_results_pkey";

drop index if exists "public"."bid_messages_pkey";

drop index if exists "public"."booking_audit_logs_pkey";

drop index if exists "public"."booking_cancellations_pkey";

drop index if exists "public"."booking_disputes_pkey";

drop index if exists "public"."booking_modifications_pkey";

drop index if exists "public"."booking_participants_pkey";

drop index if exists "public"."booking_payments_pkey";

drop index if exists "public"."booking_service_disputes_pkey";

drop index if exists "public"."bookings_booking_code_key";

drop index if exists "public"."bookings_pkey";

drop index if exists "public"."community_connections_pkey";

drop index if exists "public"."community_connections_user_id_connected_user_id_key";

drop index if exists "public"."community_posts_pkey";

drop index if exists "public"."compatibility_algorithms_name_key";

drop index if exists "public"."compatibility_algorithms_pkey";

drop index if exists "public"."compliance_logs_pkey";

drop index if exists "public"."connection_requests_pkey";

drop index if exists "public"."connection_requests_requester_id_recipient_id_key";

drop index if exists "public"."content_analysis_results_pkey";

drop index if exists "public"."content_discovery_log_pkey";

drop index if exists "public"."content_filter_rules_pkey";

drop index if exists "public"."content_reports_pkey";

drop index if exists "public"."content_scores_pkey";

drop index if exists "public"."content_scores_post_id_key";

drop index if exists "public"."cors_violations_pkey";

drop index if exists "public"."credential_access_logs_pkey";

drop index if exists "public"."credential_errors_pkey";

drop index if exists "public"."currency_exchange_rates_base_currency_target_currency_valid_key";

drop index if exists "public"."currency_exchange_rates_pkey";

drop index if exists "public"."dispute_threads_pkey";

drop index if exists "public"."engagement_scores_pkey";

drop index if exists "public"."engagement_scores_user_id_key";

drop index if exists "public"."fcm_tokens_pkey";

drop index if exists "public"."fcm_tokens_token_key";

drop index if exists "public"."fcm_tokens_user_id_token_key";

drop index if exists "public"."group_compatibility_scores_group_id_user_id_key";

drop index if exists "public"."group_compatibility_scores_pkey";

drop index if exists "public"."group_invitations_invitation_code_key";

drop index if exists "public"."group_invitations_pkey";

drop index if exists "public"."group_members_group_id_user_id_key";

drop index if exists "public"."group_members_pkey";

drop index if exists "public"."groups_pkey";

drop index if exists "public"."idx_ab_test_assignments_experiment_id";

drop index if exists "public"."idx_ab_test_assignments_user_id";

drop index if exists "public"."idx_ab_test_experiments_active";

drop index if exists "public"."idx_adventure_availability_adventure_id";

drop index if exists "public"."idx_adventure_availability_available";

drop index if exists "public"."idx_adventure_availability_composite";

drop index if exists "public"."idx_adventure_availability_date";

drop index if exists "public"."idx_adventures_active";

drop index if exists "public"."idx_adventures_category";

drop index if exists "public"."idx_adventures_location";

drop index if exists "public"."idx_adventures_price";

drop index if exists "public"."idx_adventures_rating";

drop index if exists "public"."idx_adventures_search";

drop index if exists "public"."idx_adventures_vendor_id";

drop index if exists "public"."idx_age_verification_logs_created_at";

drop index if exists "public"."idx_age_verification_logs_user_id";

drop index if exists "public"."idx_appeal_notes_appeal";

drop index if exists "public"."idx_appeal_notes_created";

drop index if exists "public"."idx_appeal_notes_moderator";

drop index if exists "public"."idx_appeals_assigned";

drop index if exists "public"."idx_appeals_status";

drop index if exists "public"."idx_appeals_submitted";

drop index if exists "public"."idx_appeals_user";

drop index if exists "public"."idx_assessment_responses_created_at";

drop index if exists "public"."idx_assessment_responses_user_id";

drop index if exists "public"."idx_assessment_responses_user_question";

drop index if exists "public"."idx_background_job_results_expiry";

drop index if exists "public"."idx_background_job_results_lookup";

drop index if exists "public"."idx_bid_messages_moderation_status";

drop index if exists "public"."idx_bid_messages_visibility";

drop index if exists "public"."idx_booking_audit_logs_action";

drop index if exists "public"."idx_booking_audit_logs_actor";

drop index if exists "public"."idx_booking_audit_logs_booking_id";

drop index if exists "public"."idx_booking_audit_logs_created_at";

drop index if exists "public"."idx_booking_cancellations_booking_id";

drop index if exists "public"."idx_booking_cancellations_status";

drop index if exists "public"."idx_booking_cancellations_type";

drop index if exists "public"."idx_booking_cancellations_user_id";

drop index if exists "public"."idx_booking_disputes_booking_id";

drop index if exists "public"."idx_booking_disputes_charge_id";

drop index if exists "public"."idx_booking_disputes_created_at";

drop index if exists "public"."idx_booking_disputes_evidence_due";

drop index if exists "public"."idx_booking_disputes_status";

drop index if exists "public"."idx_booking_modifications_booking_id";

drop index if exists "public"."idx_booking_modifications_deadline";

drop index if exists "public"."idx_booking_modifications_modified_by";

drop index if exists "public"."idx_booking_modifications_status";

drop index if exists "public"."idx_booking_modifications_type";

drop index if exists "public"."idx_booking_participants_adventure";

drop index if exists "public"."idx_booking_participants_booking_id";

drop index if exists "public"."idx_booking_participants_user_id";

drop index if exists "public"."idx_booking_payments_booking_id";

drop index if exists "public"."idx_booking_payments_payout_id";

drop index if exists "public"."idx_booking_payments_payout_status";

drop index if exists "public"."idx_booking_payments_status";

drop index if exists "public"."idx_booking_payments_user_id";

drop index if exists "public"."idx_booking_payments_vendor_payout_lookup";

drop index if exists "public"."idx_booking_payments_vendor_stripe_account";

drop index if exists "public"."idx_booking_service_disputes_assigned_to";

drop index if exists "public"."idx_booking_service_disputes_booking_id";

drop index if exists "public"."idx_booking_service_disputes_status";

drop index if exists "public"."idx_booking_service_disputes_type";

drop index if exists "public"."idx_booking_service_disputes_urgency";

drop index if exists "public"."idx_booking_service_disputes_user_id";

drop index if exists "public"."idx_bookings_adventure_id";

drop index if exists "public"."idx_bookings_adventure_status";

drop index if exists "public"."idx_bookings_booking_date";

drop index if exists "public"."idx_bookings_composite";

drop index if exists "public"."idx_bookings_created_at";

drop index if exists "public"."idx_bookings_group_id";

drop index if exists "public"."idx_bookings_status";

drop index if exists "public"."idx_bookings_user_id";

drop index if exists "public"."idx_bookings_vendor_id";

drop index if exists "public"."idx_community_connections_connected_status";

drop index if exists "public"."idx_community_connections_connected_user_id";

drop index if exists "public"."idx_community_connections_status";

drop index if exists "public"."idx_community_connections_strength";

drop index if exists "public"."idx_community_connections_user_id";

drop index if exists "public"."idx_community_posts_created_at";

drop index if exists "public"."idx_community_posts_group_id";

drop index if exists "public"."idx_community_posts_search";

drop index if exists "public"."idx_community_posts_user_id";

drop index if exists "public"."idx_community_posts_user_visibility_created";

drop index if exists "public"."idx_community_posts_visibility";

drop index if exists "public"."idx_compatibility_algorithms_active";

drop index if exists "public"."idx_compatibility_scores_group_performance";

drop index if exists "public"."idx_compatibility_scores_high_quality";

drop index if exists "public"."idx_compatibility_scores_range";

drop index if exists "public"."idx_compatibility_scores_recent";

drop index if exists "public"."idx_compatibility_scores_user_group";

drop index if exists "public"."idx_compliance_logs_created_at";

drop index if exists "public"."idx_compliance_logs_event_date";

drop index if exists "public"."idx_compliance_logs_event_type";

drop index if exists "public"."idx_compliance_logs_session_id";

drop index if exists "public"."idx_content_analysis_content";

drop index if exists "public"."idx_content_analysis_overall_score";

drop index if exists "public"."idx_content_analysis_processed";

drop index if exists "public"."idx_content_discovery_created_at";

drop index if exists "public"."idx_content_discovery_method";

drop index if exists "public"."idx_content_discovery_post_id";

drop index if exists "public"."idx_content_discovery_user_id";

drop index if exists "public"."idx_content_reports_category";

drop index if exists "public"."idx_content_reports_created";

drop index if exists "public"."idx_content_reports_reporter";

drop index if exists "public"."idx_content_reports_status";

drop index if exists "public"."idx_content_scores_last_calculated";

drop index if exists "public"."idx_content_scores_post_id";

drop index if exists "public"."idx_content_scores_total_score";

drop index if exists "public"."idx_cors_violations_endpoint";

drop index if exists "public"."idx_cors_violations_ip_address";

drop index if exists "public"."idx_cors_violations_origin";

drop index if exists "public"."idx_cors_violations_severity";

drop index if exists "public"."idx_cors_violations_timestamp";

drop index if exists "public"."idx_credential_access_logs_key";

drop index if exists "public"."idx_credential_access_logs_timestamp";

drop index if exists "public"."idx_credential_access_logs_user";

drop index if exists "public"."idx_credential_errors_key";

drop index if exists "public"."idx_credential_errors_resolved";

drop index if exists "public"."idx_credential_errors_timestamp";

drop index if exists "public"."idx_currency_rates_base_target";

drop index if exists "public"."idx_currency_rates_valid_from";

drop index if exists "public"."idx_dispute_threads_created_at";

drop index if exists "public"."idx_dispute_threads_dispute_id";

drop index if exists "public"."idx_dispute_threads_user_id";

drop index if exists "public"."idx_engagement_scores_user_score";

drop index if exists "public"."idx_fcm_tokens_active";

drop index if exists "public"."idx_fcm_tokens_user_id";

drop index if exists "public"."idx_filter_rules_enabled";

drop index if exists "public"."idx_filter_rules_type";

drop index if exists "public"."idx_forum_notifications_unread";

drop index if exists "public"."idx_forum_notifications_vendor_id";

drop index if exists "public"."idx_forum_replies_created_at";

drop index if exists "public"."idx_forum_replies_parent_reply_id";

drop index if exists "public"."idx_forum_replies_thread_id";

drop index if exists "public"."idx_forum_replies_vendor_id";

drop index if exists "public"."idx_forum_reputation_total_points";

drop index if exists "public"."idx_forum_reputation_vendor_id";

drop index if exists "public"."idx_forum_threads_category";

drop index if exists "public"."idx_forum_threads_created_at";

drop index if exists "public"."idx_forum_threads_last_reply_at";

drop index if exists "public"."idx_forum_threads_tags";

drop index if exists "public"."idx_forum_threads_upvotes";

drop index if exists "public"."idx_forum_threads_vendor_id";

drop index if exists "public"."idx_forum_votes_reply_id";

drop index if exists "public"."idx_forum_votes_thread_id";

drop index if exists "public"."idx_forum_votes_vendor_id";

drop index if exists "public"."idx_group_compatibility_scores_group_id";

drop index if exists "public"."idx_group_compatibility_scores_score";

drop index if exists "public"."idx_group_compatibility_scores_user_id";

drop index if exists "public"."idx_group_members_group_id";

drop index if exists "public"."idx_group_members_group_user";

drop index if exists "public"."idx_group_members_role";

drop index if exists "public"."idx_group_members_user_active";

drop index if exists "public"."idx_group_members_user_group";

drop index if exists "public"."idx_group_members_user_id";

drop index if exists "public"."idx_groups_active";

drop index if exists "public"."idx_groups_active_members";

drop index if exists "public"."idx_groups_owner_id";

drop index if exists "public"."idx_groups_privacy";

drop index if exists "public"."idx_individual_payments_deadline";

drop index if exists "public"."idx_individual_payments_split";

drop index if exists "public"."idx_individual_payments_status";

drop index if exists "public"."idx_individual_payments_stripe";

drop index if exists "public"."idx_individual_payments_user";

drop index if exists "public"."idx_invoice_line_items_invoice_id";

drop index if exists "public"."idx_invoices_booking_id";

drop index if exists "public"."idx_invoices_created_at";

drop index if exists "public"."idx_invoices_currency";

drop index if exists "public"."idx_invoices_due_date";

drop index if exists "public"."idx_invoices_invoice_number";

drop index if exists "public"."idx_invoices_status";

drop index if exists "public"."idx_invoices_stripe_payment_intent";

drop index if exists "public"."idx_invoices_user_id";

drop index if exists "public"."idx_invoices_vendor_id";

drop index if exists "public"."idx_media_files_created_at";

drop index if exists "public"."idx_media_files_file_type";

drop index if exists "public"."idx_media_files_user_id";

drop index if exists "public"."idx_ml_models_created_at";

drop index if exists "public"."idx_ml_models_name";

drop index if exists "public"."idx_ml_models_type_status";

drop index if exists "public"."idx_model_performance_metrics_measured_at";

drop index if exists "public"."idx_model_performance_metrics_metric_name";

drop index if exists "public"."idx_model_performance_metrics_model_id";

drop index if exists "public"."idx_model_predictions_created_at";

drop index if exists "public"."idx_model_predictions_model_id";

drop index if exists "public"."idx_model_predictions_user_id";

drop index if exists "public"."idx_model_training_runs_created_at";

drop index if exists "public"."idx_model_training_runs_model_id";

drop index if exists "public"."idx_model_training_runs_status";

drop index if exists "public"."idx_moderation_logs_content";

drop index if exists "public"."idx_moderation_logs_created";

drop index if exists "public"."idx_moderation_logs_moderator";

drop index if exists "public"."idx_moderation_logs_user";

drop index if exists "public"."idx_moderation_queue_assigned";

drop index if exists "public"."idx_moderation_queue_created";

drop index if exists "public"."idx_moderation_queue_priority";

drop index if exists "public"."idx_moderation_queue_status";

drop index if exists "public"."idx_notification_analytics_event_type";

drop index if exists "public"."idx_notification_analytics_user_id";

drop index if exists "public"."idx_notification_queue_pending";

drop index if exists "public"."idx_notification_queue_scheduled_for";

drop index if exists "public"."idx_notification_queue_status";

drop index if exists "public"."idx_notifications_created_at";

drop index if exists "public"."idx_notifications_expires_at";

drop index if exists "public"."idx_notifications_read";

drop index if exists "public"."idx_notifications_type";

drop index if exists "public"."idx_notifications_user_id";

drop index if exists "public"."idx_notifications_user_type";

drop index if exists "public"."idx_notifications_user_unread";

drop index if exists "public"."idx_payment_audit_trail_action";

drop index if exists "public"."idx_payment_audit_trail_created_at";

drop index if exists "public"."idx_payment_audit_trail_payment";

drop index if exists "public"."idx_payment_discrepancies_reconciliation";

drop index if exists "public"."idx_payment_discrepancies_status";

drop index if exists "public"."idx_payment_discrepancies_transaction";

drop index if exists "public"."idx_payment_discrepancies_type_severity";

drop index if exists "public"."idx_payment_disputes_booking_id";

drop index if exists "public"."idx_payment_disputes_created_at";

drop index if exists "public"."idx_payment_disputes_evidence_due_by";

drop index if exists "public"."idx_payment_disputes_status";

drop index if exists "public"."idx_payment_disputes_stripe_dispute_id";

drop index if exists "public"."idx_payment_reconciliations_date_range";

drop index if exists "public"."idx_payment_reconciliations_status";

drop index if exists "public"."idx_payment_reconciliations_vendor_account";

drop index if exists "public"."idx_payment_refunds_payment";

drop index if exists "public"."idx_payment_refunds_refund_request_id";

drop index if exists "public"."idx_payment_refunds_split";

drop index if exists "public"."idx_payment_refunds_stripe";

drop index if exists "public"."idx_payment_reminders_payment";

drop index if exists "public"."idx_payment_reminders_scheduled";

drop index if exists "public"."idx_payment_reminders_status";

drop index if exists "public"."idx_payment_splits_booking_id";

drop index if exists "public"."idx_payment_splits_status";

drop index if exists "public"."idx_payment_splits_user_id";

drop index if exists "public"."idx_payment_tokens_expires";

drop index if exists "public"."idx_payment_tokens_individual";

drop index if exists "public"."idx_payment_tokens_status";

drop index if exists "public"."idx_payment_tokens_token";

drop index if exists "public"."idx_payout_failures_next_retry_at";

drop index if exists "public"."idx_payout_failures_requires_manual_review";

drop index if exists "public"."idx_payout_failures_resolved";

drop index if exists "public"."idx_payout_failures_vendor_account_id";

drop index if exists "public"."idx_payout_hold_logs_hold_id";

drop index if exists "public"."idx_payout_hold_logs_timestamp";

drop index if exists "public"."idx_payout_holds_status";

drop index if exists "public"."idx_payout_holds_system_placed_at";

drop index if exists "public"."idx_payout_holds_system_release_date";

drop index if exists "public"."idx_payout_holds_system_status";

drop index if exists "public"."idx_payout_holds_system_type";

drop index if exists "public"."idx_payout_holds_system_vendor_account_id";

drop index if exists "public"."idx_payout_holds_vendor_account";

drop index if exists "public"."idx_payout_line_items_booking_id";

drop index if exists "public"."idx_payout_line_items_payment_id";

drop index if exists "public"."idx_payout_line_items_payout_id";

drop index if exists "public"."idx_payout_schedule_jobs_next_execution";

drop index if exists "public"."idx_payout_schedule_jobs_status";

drop index if exists "public"."idx_payout_schedule_jobs_vendor_account_id";

drop index if exists "public"."idx_personality_assessments_completed_at";

drop index if exists "public"."idx_personality_assessments_completed_at_user_id";

drop index if exists "public"."idx_personality_assessments_traits";

drop index if exists "public"."idx_personality_assessments_travel_prefs";

drop index if exists "public"."idx_personality_assessments_updated_at";

drop index if exists "public"."idx_personality_assessments_user_date_range";

drop index if exists "public"."idx_personality_assessments_user_id";

drop index if exists "public"."idx_personality_assessments_user_recent";

drop index if exists "public"."idx_personality_group_pref";

drop index if exists "public"."idx_personality_styles";

drop index if exists "public"."idx_personality_traits";

drop index if exists "public"."idx_post_comments_post_id";

drop index if exists "public"."idx_post_comments_user_id";

drop index if exists "public"."idx_post_interaction_sessions_duration";

drop index if exists "public"."idx_post_interaction_sessions_post_id";

drop index if exists "public"."idx_post_interaction_sessions_user_id";

drop index if exists "public"."idx_post_reactions_post_id";

drop index if exists "public"."idx_post_reactions_user_id";

drop index if exists "public"."idx_post_saves_created_at";

drop index if exists "public"."idx_post_saves_post_id";

drop index if exists "public"."idx_post_saves_user_id";

drop index if exists "public"."idx_post_shares_created_at";

drop index if exists "public"."idx_post_shares_post_id";

drop index if exists "public"."idx_post_shares_user_id";

drop index if exists "public"."idx_post_views_created_at";

drop index if exists "public"."idx_post_views_post_id";

drop index if exists "public"."idx_post_views_unique";

drop index if exists "public"."idx_post_views_user_id";

drop index if exists "public"."idx_profiles_account_status";

drop index if exists "public"."idx_profiles_created_at";

drop index if exists "public"."idx_profiles_date_of_birth_range";

drop index if exists "public"."idx_profiles_demographics";

drop index if exists "public"."idx_profiles_encrypted_birth_date_exists";

drop index if exists "public"."idx_profiles_location";

drop index if exists "public"."idx_profiles_restriction_expires";

drop index if exists "public"."idx_profiles_role";

drop index if exists "public"."idx_profiles_username";

drop index if exists "public"."idx_query_performance_analysis";

drop index if exists "public"."idx_reconciliation_schedules_next_run";

drop index if exists "public"."idx_reconciliation_schedules_vendor_account";

drop index if exists "public"."idx_refund_requests_booking_id";

drop index if exists "public"."idx_refund_requests_created_at";

drop index if exists "public"."idx_refund_requests_split_payment_id";

drop index if exists "public"."idx_refund_requests_status";

drop index if exists "public"."idx_refund_requests_user_id";

drop index if exists "public"."idx_retraining_jobs_created_at";

drop index if exists "public"."idx_retraining_jobs_status";

drop index if exists "public"."idx_retraining_triggers_active";

drop index if exists "public"."idx_retraining_triggers_next_check";

drop index if exists "public"."idx_reviews_adventure_id";

drop index if exists "public"."idx_reviews_rating";

drop index if exists "public"."idx_reviews_user_id";

drop index if exists "public"."idx_reviews_vendor_id";

drop index if exists "public"."idx_split_payment_settings_split";

drop index if exists "public"."idx_split_payments_booking";

drop index if exists "public"."idx_split_payments_deadline";

drop index if exists "public"."idx_split_payments_organizer";

drop index if exists "public"."idx_split_payments_status";

drop index if exists "public"."idx_stripe_webhook_events_created_at";

drop index if exists "public"."idx_stripe_webhook_events_event_id";

drop index if exists "public"."idx_stripe_webhook_events_processed";

drop index if exists "public"."idx_stripe_webhook_events_type";

drop index if exists "public"."idx_system_settings_key";

drop index if exists "public"."idx_training_datasets_created_at";

drop index if exists "public"."idx_training_datasets_data_source";

drop index if exists "public"."idx_trending_content_expires";

drop index if exists "public"."idx_trending_content_score";

drop index if exists "public"."idx_trending_content_time_window";

drop index if exists "public"."idx_trip_requests_dates";

drop index if exists "public"."idx_trip_requests_status";

drop index if exists "public"."idx_trip_requests_user_id";

drop index if exists "public"."idx_user_feed_preferences_user_id";

drop index if exists "public"."idx_user_restrictions_active";

drop index if exists "public"."idx_user_restrictions_expires";

drop index if exists "public"."idx_user_restrictions_type";

drop index if exists "public"."idx_user_restrictions_user";

drop index if exists "public"."idx_user_warnings_expires";

drop index if exists "public"."idx_user_warnings_issued";

drop index if exists "public"."idx_user_warnings_user";

drop index if exists "public"."idx_vendor_bids_status";

drop index if exists "public"."idx_vendor_bids_trip_request_id";

drop index if exists "public"."idx_vendor_bids_vendor_id";

drop index if exists "public"."idx_vendor_payouts_account_id";

drop index if exists "public"."idx_vendor_payouts_arrival_date";

drop index if exists "public"."idx_vendor_payouts_created_at";

drop index if exists "public"."idx_vendor_payouts_status";

drop index if exists "public"."idx_vendor_payouts_stripe_id";

drop index if exists "public"."idx_vendor_stripe_accounts_created_at";

drop index if exists "public"."idx_vendor_stripe_accounts_status";

drop index if exists "public"."idx_vendor_stripe_accounts_stripe_id";

drop index if exists "public"."idx_vendor_stripe_accounts_user_id";

drop index if exists "public"."idx_vendor_stripe_accounts_vendor_id";

drop index if exists "public"."idx_vendors_location";

drop index if exists "public"."idx_vendors_rating";

drop index if exists "public"."idx_vendors_status";

drop index if exists "public"."idx_vendors_user_id";

drop index if exists "public"."idx_webhook_events_alert_sent";

drop index if exists "public"."idx_webhook_events_error_category";

drop index if exists "public"."idx_webhook_events_retry_after";

drop index if exists "public"."idx_whatsapp_groups_admin_user_id";

drop index if exists "public"."idx_whatsapp_groups_adventure_id";

drop index if exists "public"."idx_whatsapp_groups_created_at";

drop index if exists "public"."idx_whatsapp_groups_status";

drop index if exists "public"."idx_whatsapp_messages_message_type";

drop index if exists "public"."idx_whatsapp_messages_moderation_status";

drop index if exists "public"."idx_whatsapp_messages_phone_number";

drop index if exists "public"."idx_whatsapp_messages_sent_at";

drop index if exists "public"."idx_whatsapp_messages_status";

drop index if exists "public"."idx_whatsapp_messages_user_id";

drop index if exists "public"."idx_whatsapp_messages_visibility";

drop index if exists "public"."idx_whatsapp_webhooks_created_at";

drop index if exists "public"."idx_whatsapp_webhooks_event_type";

drop index if exists "public"."idx_whatsapp_webhooks_from_phone";

drop index if exists "public"."idx_whatsapp_webhooks_processed";

drop index if exists "public"."individual_payments_pkey";

drop index if exists "public"."invoice_line_items_pkey";

drop index if exists "public"."invoices_invoice_number_key";

drop index if exists "public"."invoices_pkey";

drop index if exists "public"."media_files_pkey";

drop index if exists "public"."ml_models_name_version_key";

drop index if exists "public"."ml_models_pkey";

drop index if exists "public"."model_performance_metrics_pkey";

drop index if exists "public"."model_predictions_pkey";

drop index if exists "public"."model_training_runs_pkey";

drop index if exists "public"."moderation_appeals_pkey";

drop index if exists "public"."moderation_logs_pkey";

drop index if exists "public"."moderation_queue_pkey";

drop index if exists "public"."notification_analytics_pkey";

drop index if exists "public"."notification_queue_pkey";

drop index if exists "public"."notification_templates_name_key";

drop index if exists "public"."notification_templates_pkey";

drop index if exists "public"."notifications_pkey";

drop index if exists "public"."payment_audit_trail_pkey";

drop index if exists "public"."payment_discrepancies_pkey";

drop index if exists "public"."payment_disputes_pkey";

drop index if exists "public"."payment_disputes_stripe_dispute_id_key";

drop index if exists "public"."payment_reconciliations_pkey";

drop index if exists "public"."payment_refunds_pkey";

drop index if exists "public"."payment_reminders_pkey";

drop index if exists "public"."payment_splits_pkey";

drop index if exists "public"."payment_tokens_pkey";

drop index if exists "public"."payment_tokens_token_key";

drop index if exists "public"."payout_failures_pkey";

drop index if exists "public"."payout_hold_logs_pkey";

drop index if exists "public"."payout_holds_pkey";

drop index if exists "public"."payout_holds_system_pkey";

drop index if exists "public"."payout_line_items_pkey";

drop index if exists "public"."payout_schedule_jobs_pkey";

drop index if exists "public"."personality_assessments_pkey";

drop index if exists "public"."personality_assessments_user_id_key";

drop index if exists "public"."post_comments_pkey";

drop index if exists "public"."post_interaction_sessions_pkey";

drop index if exists "public"."post_reactions_pkey";

drop index if exists "public"."post_reactions_post_id_user_id_key";

drop index if exists "public"."post_saves_pkey";

drop index if exists "public"."post_saves_post_id_user_id_key";

drop index if exists "public"."post_shares_pkey";

drop index if exists "public"."post_views_pkey";

drop index if exists "public"."profiles_username_key";

drop index if exists "public"."query_performance_logs_pkey";

drop index if exists "public"."reconciliation_schedules_pkey";

drop index if exists "public"."refund_requests_pkey";

drop index if exists "public"."request_invitations_pkey";

drop index if exists "public"."request_invitations_trip_request_id_vendor_id_key";

drop index if exists "public"."retraining_jobs_pkey";

drop index if exists "public"."retraining_triggers_name_key";

drop index if exists "public"."retraining_triggers_pkey";

drop index if exists "public"."reviews_booking_id_user_id_key";

drop index if exists "public"."reviews_pkey";

drop index if exists "public"."split_payment_settings_pkey";

drop index if exists "public"."split_payments_pkey";

drop index if exists "public"."stripe_webhook_events_pkey";

drop index if exists "public"."stripe_webhook_events_stripe_event_id_key";

drop index if exists "public"."system_logs_pkey";

drop index if exists "public"."system_settings_pkey";

drop index if exists "public"."system_settings_setting_key_key";

drop index if exists "public"."training_datasets_pkey";

drop index if exists "public"."trending_content_pkey";

drop index if exists "public"."trending_content_post_id_time_window_hours_key";

drop index if exists "public"."trip_requests_pkey";

drop index if exists "public"."user_feed_preferences_pkey";

drop index if exists "public"."user_feed_preferences_user_id_key";

drop index if exists "public"."user_restrictions_pkey";

drop index if exists "public"."user_warnings_pkey";

drop index if exists "public"."vendor_bids_pkey";

drop index if exists "public"."vendor_bids_trip_request_id_vendor_id_key";

drop index if exists "public"."vendor_certifications_pkey";

drop index if exists "public"."vendor_forum_moderation_log_pkey";

drop index if exists "public"."vendor_forum_notifications_pkey";

drop index if exists "public"."vendor_forum_replies_pkey";

drop index if exists "public"."vendor_forum_reputation_pkey";

drop index if exists "public"."vendor_forum_reputation_vendor_id_key";

drop index if exists "public"."vendor_forum_threads_pkey";

drop index if exists "public"."vendor_forum_votes_pkey";

drop index if exists "public"."vendor_forum_votes_vendor_id_reply_id_key";

drop index if exists "public"."vendor_forum_votes_vendor_id_thread_id_key";

drop index if exists "public"."vendor_forums_pkey";

drop index if exists "public"."vendor_insurance_pkey";

drop index if exists "public"."vendor_payouts_pkey";

drop index if exists "public"."vendor_payouts_stripe_payout_id_key";

drop index if exists "public"."vendor_stripe_accounts_pkey";

drop index if exists "public"."vendor_stripe_accounts_stripe_account_id_key";

drop index if exists "public"."vendors_pkey";

drop index if exists "public"."vendors_user_id_key";

drop index if exists "public"."whatsapp_groups_pkey";

drop index if exists "public"."whatsapp_messages_pkey";

drop index if exists "public"."whatsapp_webhooks_pkey";

drop table "public"."ab_test_assignments";

drop table "public"."ab_test_experiments";

drop table "public"."adventure_availability";

drop table "public"."adventure_media";

drop table "public"."adventures";

drop table "public"."age_verification_logs";

drop table "public"."appeal_notes";

drop table "public"."assessment_responses";

drop table "public"."background_job_results";

drop table "public"."bid_messages";

drop table "public"."booking_audit_logs";

drop table "public"."booking_cancellations";

drop table "public"."booking_disputes";

drop table "public"."booking_modifications";

drop table "public"."booking_participants";

drop table "public"."booking_payments";

drop table "public"."booking_service_disputes";

drop table "public"."bookings";

drop table "public"."community_connections";

drop table "public"."community_posts";

drop table "public"."compatibility_algorithms";

drop table "public"."compliance_logs";

drop table "public"."connection_requests";

drop table "public"."content_analysis_results";

drop table "public"."content_discovery_log";

drop table "public"."content_filter_rules";

drop table "public"."content_reports";

drop table "public"."content_scores";

drop table "public"."cors_violations";

drop table "public"."credential_access_logs";

drop table "public"."credential_errors";

drop table "public"."currency_exchange_rates";

drop table "public"."dispute_threads";

drop table "public"."engagement_scores";

drop table "public"."fcm_tokens";

drop table "public"."group_compatibility_scores";

drop table "public"."group_invitations";

drop table "public"."group_members";

drop table "public"."groups";

drop table "public"."individual_payments";

drop table "public"."invoice_line_items";

drop table "public"."invoices";

drop table "public"."media_files";

drop table "public"."ml_models";

drop table "public"."model_performance_metrics";

drop table "public"."model_predictions";

drop table "public"."model_training_runs";

drop table "public"."moderation_appeals";

drop table "public"."moderation_logs";

drop table "public"."moderation_queue";

drop table "public"."notification_analytics";

drop table "public"."notification_queue";

drop table "public"."notification_templates";

drop table "public"."notifications";

drop table "public"."payment_audit_trail";

drop table "public"."payment_discrepancies";

drop table "public"."payment_disputes";

drop table "public"."payment_reconciliations";

drop table "public"."payment_refunds";

drop table "public"."payment_reminders";

drop table "public"."payment_splits";

drop table "public"."payment_tokens";

drop table "public"."payout_failures";

drop table "public"."payout_hold_logs";

drop table "public"."payout_holds";

drop table "public"."payout_holds_system";

drop table "public"."payout_line_items";

drop table "public"."payout_schedule_jobs";

drop table "public"."personality_assessments";

drop table "public"."post_comments";

drop table "public"."post_interaction_sessions";

drop table "public"."post_reactions";

drop table "public"."post_saves";

drop table "public"."post_shares";

drop table "public"."post_views";

drop table "public"."query_performance_logs";

drop table "public"."reconciliation_schedules";

drop table "public"."refund_requests";

drop table "public"."request_invitations";

drop table "public"."retraining_jobs";

drop table "public"."retraining_triggers";

drop table "public"."reviews";

drop table "public"."split_payment_settings";

drop table "public"."split_payments";

drop table "public"."stripe_webhook_events";

drop table "public"."system_logs";

drop table "public"."system_settings";

drop table "public"."training_datasets";

drop table "public"."trending_content";

drop table "public"."trip_requests";

drop table "public"."user_feed_preferences";

drop table "public"."user_restrictions";

drop table "public"."user_warnings";

drop table "public"."vendor_bids";

drop table "public"."vendor_certifications";

drop table "public"."vendor_forum_moderation_log";

drop table "public"."vendor_forum_notifications";

drop table "public"."vendor_forum_replies";

drop table "public"."vendor_forum_reputation";

drop table "public"."vendor_forum_threads";

drop table "public"."vendor_forum_votes";

drop table "public"."vendor_forums";

drop table "public"."vendor_insurance";

drop table "public"."vendor_payouts";

drop table "public"."vendor_stripe_accounts";

drop table "public"."vendors";

drop table "public"."whatsapp_groups";

drop table "public"."whatsapp_messages";

drop table "public"."whatsapp_webhooks";

create table "public"."achievements" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "achievement_type" text not null,
    "earned_at" timestamp with time zone default now()
);


alter table "public"."achievements" enable row level security;

create table "public"."application_documents" (
    "id" uuid not null default gen_random_uuid(),
    "application_id" uuid,
    "user_id" uuid,
    "document_type" text not null,
    "document_name" text not null,
    "file_id" uuid,
    "file_url" text,
    "version" integer default 1,
    "is_tailored" boolean default false,
    "notes" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."application_documents" enable row level security;

create table "public"."career_pathways" (
    "id" uuid not null default gen_random_uuid(),
    "title" text not null,
    "description" text not null,
    "duration_weeks" integer,
    "difficulty_level" text,
    "industry" text,
    "skills_developed" text[],
    "learning_objectives" jsonb,
    "prerequisites" text[],
    "is_published" boolean default false,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."career_pathways" enable row level security;

create table "public"."companies" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "industry" text,
    "website" text,
    "description" text,
    "logo_url" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."companies" enable row level security;

create table "public"."file_uploads" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "filename" text not null,
    "file_size" integer,
    "mime_type" text,
    "storage_path" text not null,
    "bucket_name" text not null,
    "is_public" boolean default false,
    "metadata" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone default now()
);


alter table "public"."file_uploads" enable row level security;

create table "public"."job_applications" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "position_title" text not null,
    "company_name" text not null,
    "status" text default 'draft'::text,
    "applied_date" date,
    "deadline" date,
    "notes" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."job_applications" enable row level security;

create table "public"."learning_analytics" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "total_workshops_completed" integer default 0,
    "total_hours_learned" integer default 0,
    "current_streak_days" integer default 0,
    "longest_streak_days" integer default 0,
    "last_activity_date" date,
    "skills_assessed" integer default 0,
    "achievements_earned" integer default 0,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."learning_analytics" enable row level security;

create table "public"."mentors" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "title" text,
    "expertise" text[],
    "bio" text,
    "avatar_url" text,
    "is_available" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."mentors" enable row level security;

create table "public"."quick_guides" (
    "id" uuid not null default gen_random_uuid(),
    "title" text not null,
    "description" text,
    "content" text not null,
    "category" text,
    "difficulty_level" text,
    "is_published" boolean default false,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."quick_guides" enable row level security;

create table "public"."readiness_scores" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "skills_score" numeric(3,1) default 0,
    "confidence_score" numeric(3,1) default 0,
    "experience_score" numeric(3,1) default 0,
    "portfolio_score" numeric(3,1) default 0,
    "network_score" numeric(3,1) default 0,
    "overall_score" numeric(3,1) generated always as ((((((skills_score + confidence_score) + experience_score) + portfolio_score) + network_score) / (5)::numeric)) stored,
    "calculated_at" timestamp with time zone default now(),
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."readiness_scores" enable row level security;

create table "public"."resource_categories" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "description" text,
    "icon" text,
    "parent_id" uuid,
    "order_index" integer
);


alter table "public"."resource_categories" enable row level security;

create table "public"."resource_ratings" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "resource_id" uuid not null,
    "rating" integer,
    "created_at" timestamp with time zone default now()
);


alter table "public"."resource_ratings" enable row level security;

create table "public"."resources" (
    "id" uuid not null default gen_random_uuid(),
    "title" text not null,
    "description" text,
    "resource_type" text not null,
    "content_url" text,
    "category" text,
    "tags" text[],
    "difficulty_level" text,
    "is_published" boolean default false,
    "created_at" timestamp with time zone default now()
);


alter table "public"."resources" enable row level security;

create table "public"."skills_assessments" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "skill_id" uuid,
    "confidence_level" integer,
    "assessment_date" timestamp with time zone default now(),
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."skills_assessments" enable row level security;

create table "public"."skills_taxonomy" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "category" text not null,
    "subcategory" text,
    "description" text,
    "difficulty_level" integer,
    "industry_relevance" text[],
    "created_at" timestamp with time zone default now()
);


alter table "public"."skills_taxonomy" enable row level security;

create table "public"."success_stories" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "title" text not null,
    "story" text not null,
    "outcome" text,
    "is_featured" boolean default false,
    "is_published" boolean default false,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."success_stories" enable row level security;

create table "public"."user_bookmarks" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "resource_id" uuid,
    "workshop_id" uuid,
    "bookmarked_at" timestamp with time zone default now(),
    "notes" text,
    "created_at" timestamp with time zone default now()
);


alter table "public"."user_bookmarks" enable row level security;

create table "public"."user_documents" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "document_type" text not null,
    "title" text not null,
    "content" jsonb not null,
    "version" integer default 1,
    "is_current" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."user_documents" enable row level security;

create table "public"."user_progress" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "workshop_id" uuid,
    "started_at" timestamp with time zone default now(),
    "completed_at" timestamp with time zone,
    "progress_percentage" integer default 0,
    "modules_completed" jsonb default '[]'::jsonb,
    "activities_completed" jsonb default '[]'::jsonb,
    "notes" text,
    "bookmarks" jsonb default '[]'::jsonb
);


alter table "public"."user_progress" enable row level security;

create table "public"."user_sessions" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "workshop_id" uuid,
    "session_start" timestamp with time zone default now(),
    "session_end" timestamp with time zone,
    "duration_minutes" integer,
    "activities_completed" integer default 0,
    "notes" text
);


alter table "public"."user_sessions" enable row level security;

create table "public"."user_skills_confidence" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "skill_id" uuid,
    "confidence_level" integer,
    "proficiency_level" text,
    "assessment_source" text,
    "evidence_notes" text,
    "last_assessed" timestamp with time zone default now(),
    "created_at" timestamp with time zone default now()
);


alter table "public"."user_skills_confidence" enable row level security;

create table "public"."workshop_activities" (
    "id" uuid not null default gen_random_uuid(),
    "workshop_id" uuid,
    "module_id" uuid,
    "title" text not null,
    "activity_type" text not null,
    "content" jsonb not null,
    "instructions" text,
    "passing_score" integer,
    "max_attempts" integer,
    "created_at" timestamp with time zone default now()
);


alter table "public"."workshop_activities" enable row level security;

create table "public"."workshop_modules" (
    "id" uuid not null default gen_random_uuid(),
    "workshop_id" uuid,
    "title" text not null,
    "description" text,
    "content" jsonb not null,
    "order_index" integer not null,
    "duration_minutes" integer,
    "module_type" text,
    "is_required" boolean default true,
    "created_at" timestamp with time zone default now()
);


alter table "public"."workshop_modules" enable row level security;

create table "public"."workshop_resources" (
    "id" uuid not null default gen_random_uuid(),
    "workshop_id" uuid not null,
    "resource_id" uuid,
    "title" text not null,
    "description" text,
    "resource_type" text not null,
    "url" text,
    "is_required" boolean default false,
    "order_index" integer,
    "created_at" timestamp with time zone default now()
);


alter table "public"."workshop_resources" enable row level security;

create table "public"."workshops" (
    "id" uuid not null default gen_random_uuid(),
    "pathway_id" uuid,
    "title" text not null,
    "description" text not null,
    "duration_minutes" integer,
    "difficulty_level" text,
    "learning_objectives" jsonb,
    "prerequisites" text[],
    "skills_addressed" text[],
    "is_published" boolean default false,
    "accessibility_features" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."workshops" enable row level security;

alter table "public"."profiles" drop column "account_status";

alter table "public"."profiles" drop column "avatar_url";

alter table "public"."profiles" drop column "bio";

alter table "public"."profiles" drop column "date_of_birth";

alter table "public"."profiles" drop column "email_verified";

alter table "public"."profiles" drop column "encrypted_birth_date";

alter table "public"."profiles" drop column "full_name";

alter table "public"."profiles" drop column "is_verified";

alter table "public"."profiles" drop column "location";

alter table "public"."profiles" drop column "phone_number";

alter table "public"."profiles" drop column "phone_verified";

alter table "public"."profiles" drop column "reputation_score";

alter table "public"."profiles" drop column "restriction_expires";

alter table "public"."profiles" drop column "role";

alter table "public"."profiles" drop column "updated_at";

alter table "public"."profiles" drop column "username";

alter table "public"."profiles" drop column "warning_count";

alter table "public"."profiles" add column "avatar_file_id" uuid;

alter table "public"."profiles" add column "cv_completed" boolean default false;

alter table "public"."profiles" add column "email" text not null;

alter table "public"."profiles" add column "name" text;

alter table "public"."profiles" add column "onboarding_data" jsonb default '{}'::jsonb;

alter table "public"."profiles" alter column "created_at" drop not null;

alter table "public"."user_preferences" drop column "booking_notifications";

alter table "public"."user_preferences" drop column "currency";

alter table "public"."user_preferences" drop column "email_notifications";

alter table "public"."user_preferences" drop column "group_notifications";

alter table "public"."user_preferences" drop column "language";

alter table "public"."user_preferences" drop column "marketing_emails";

alter table "public"."user_preferences" drop column "marketing_notifications";

alter table "public"."user_preferences" drop column "notification_frequency";

alter table "public"."user_preferences" drop column "privacy_level";

alter table "public"."user_preferences" drop column "push_notifications";

alter table "public"."user_preferences" drop column "sms_notifications";

alter table "public"."user_preferences" drop column "theme";

alter table "public"."user_preferences" drop column "timezone";

alter table "public"."user_preferences" drop column "vendor_offers_notifications";

alter table "public"."user_preferences" drop column "whatsapp_notifications";

alter table "public"."user_preferences" drop column "whatsapp_preferences";

alter table "public"."user_preferences" add column "accessibility_needs" jsonb default '{}'::jsonb;

alter table "public"."user_preferences" add column "learning_style" text;

alter table "public"."user_preferences" alter column "created_at" drop not null;

alter table "public"."user_preferences" alter column "updated_at" drop not null;

drop type "public"."adventure_category";

drop type "public"."bid_status";

drop type "public"."booking_status";

drop type "public"."connection_status";

drop type "public"."difficulty_level";

drop type "public"."forum_category";

drop type "public"."group_member_role";

drop type "public"."group_privacy";

drop type "public"."model_status";

drop type "public"."notification_type";

drop type "public"."payment_method";

drop type "public"."payment_status";

drop type "public"."payout_hold_status";

drop type "public"."payout_hold_type";

drop type "public"."payout_status";

drop type "public"."post_visibility";

drop type "public"."stripe_account_status";

drop type "public"."stripe_account_type";

drop type "public"."training_data_source";

drop type "public"."user_role";

drop type "public"."vendor_status";

CREATE UNIQUE INDEX achievements_pkey ON public.achievements USING btree (id);

CREATE UNIQUE INDEX application_documents_pkey ON public.application_documents USING btree (id);

CREATE UNIQUE INDEX career_pathways_pkey ON public.career_pathways USING btree (id);

CREATE UNIQUE INDEX companies_pkey ON public.companies USING btree (id);

CREATE UNIQUE INDEX file_uploads_pkey ON public.file_uploads USING btree (id);

CREATE INDEX idx_achievements_user_id ON public.achievements USING btree (user_id);

CREATE INDEX idx_application_documents_application_id ON public.application_documents USING btree (application_id);

CREATE INDEX idx_application_documents_user_id ON public.application_documents USING btree (user_id);

CREATE INDEX idx_file_uploads_user_id ON public.file_uploads USING btree (user_id);

CREATE INDEX idx_job_applications_user_id ON public.job_applications USING btree (user_id);

CREATE INDEX idx_learning_analytics_user_id ON public.learning_analytics USING btree (user_id);

CREATE INDEX idx_mentors_is_available ON public.mentors USING btree (is_available);

CREATE INDEX idx_profiles_email ON public.profiles USING btree (email);

CREATE INDEX idx_quick_guides_category ON public.quick_guides USING btree (category);

CREATE INDEX idx_quick_guides_published ON public.quick_guides USING btree (is_published);

CREATE INDEX idx_readiness_scores_user_id ON public.readiness_scores USING btree (user_id);

CREATE INDEX idx_resource_ratings_resource_id ON public.resource_ratings USING btree (resource_id);

CREATE INDEX idx_resource_ratings_user_id ON public.resource_ratings USING btree (user_id);

CREATE INDEX idx_resources_category ON public.resources USING btree (category);

CREATE INDEX idx_resources_published ON public.resources USING btree (is_published);

CREATE INDEX idx_skills_assessments_skill_id ON public.skills_assessments USING btree (skill_id);

CREATE INDEX idx_skills_assessments_user_id ON public.skills_assessments USING btree (user_id);

CREATE INDEX idx_success_stories_is_featured ON public.success_stories USING btree (is_featured);

CREATE INDEX idx_success_stories_is_published ON public.success_stories USING btree (is_published);

CREATE INDEX idx_user_bookmarks_resource_id ON public.user_bookmarks USING btree (resource_id);

CREATE INDEX idx_user_bookmarks_user_id ON public.user_bookmarks USING btree (user_id);

CREATE INDEX idx_user_bookmarks_workshop_id ON public.user_bookmarks USING btree (workshop_id);

CREATE INDEX idx_user_documents_user_id ON public.user_documents USING btree (user_id);

CREATE INDEX idx_user_preferences_user_id ON public.user_preferences USING btree (user_id);

CREATE INDEX idx_user_progress_user_id ON public.user_progress USING btree (user_id);

CREATE INDEX idx_user_progress_workshop_id ON public.user_progress USING btree (workshop_id);

CREATE INDEX idx_user_sessions_user_id ON public.user_sessions USING btree (user_id);

CREATE INDEX idx_user_sessions_workshop_id ON public.user_sessions USING btree (workshop_id);

CREATE INDEX idx_user_skills_skill_id ON public.user_skills_confidence USING btree (skill_id);

CREATE INDEX idx_user_skills_user_id ON public.user_skills_confidence USING btree (user_id);

CREATE INDEX idx_workshop_activities_module_id ON public.workshop_activities USING btree (module_id);

CREATE INDEX idx_workshop_activities_workshop_id ON public.workshop_activities USING btree (workshop_id);

CREATE INDEX idx_workshop_modules_workshop_id ON public.workshop_modules USING btree (workshop_id);

CREATE INDEX idx_workshop_resources_resource_id ON public.workshop_resources USING btree (resource_id);

CREATE INDEX idx_workshop_resources_workshop_id ON public.workshop_resources USING btree (workshop_id);

CREATE INDEX idx_workshops_pathway_id ON public.workshops USING btree (pathway_id);

CREATE INDEX idx_workshops_published ON public.workshops USING btree (is_published);

CREATE UNIQUE INDEX job_applications_pkey ON public.job_applications USING btree (id);

CREATE UNIQUE INDEX learning_analytics_pkey ON public.learning_analytics USING btree (id);

CREATE UNIQUE INDEX learning_analytics_user_id_key ON public.learning_analytics USING btree (user_id);

CREATE UNIQUE INDEX mentors_pkey ON public.mentors USING btree (id);

CREATE UNIQUE INDEX quick_guides_pkey ON public.quick_guides USING btree (id);

CREATE UNIQUE INDEX readiness_scores_pkey ON public.readiness_scores USING btree (id);

CREATE UNIQUE INDEX readiness_scores_user_id_key ON public.readiness_scores USING btree (user_id);

CREATE UNIQUE INDEX resource_categories_name_key ON public.resource_categories USING btree (name);

CREATE UNIQUE INDEX resource_categories_pkey ON public.resource_categories USING btree (id);

CREATE UNIQUE INDEX resource_ratings_pkey ON public.resource_ratings USING btree (id);

CREATE UNIQUE INDEX resource_ratings_user_id_resource_id_key ON public.resource_ratings USING btree (user_id, resource_id);

CREATE UNIQUE INDEX resources_pkey ON public.resources USING btree (id);

CREATE UNIQUE INDEX skills_assessments_pkey ON public.skills_assessments USING btree (id);

CREATE UNIQUE INDEX skills_taxonomy_pkey ON public.skills_taxonomy USING btree (id);

CREATE UNIQUE INDEX success_stories_pkey ON public.success_stories USING btree (id);

CREATE UNIQUE INDEX user_bookmarks_pkey ON public.user_bookmarks USING btree (id);

CREATE UNIQUE INDEX user_documents_pkey ON public.user_documents USING btree (id);

CREATE UNIQUE INDEX user_progress_pkey ON public.user_progress USING btree (id);

CREATE UNIQUE INDEX user_progress_user_id_workshop_id_key ON public.user_progress USING btree (user_id, workshop_id);

CREATE UNIQUE INDEX user_sessions_pkey ON public.user_sessions USING btree (id);

CREATE UNIQUE INDEX user_skills_confidence_pkey ON public.user_skills_confidence USING btree (id);

CREATE UNIQUE INDEX user_skills_confidence_user_id_skill_id_key ON public.user_skills_confidence USING btree (user_id, skill_id);

CREATE UNIQUE INDEX workshop_activities_pkey ON public.workshop_activities USING btree (id);

CREATE UNIQUE INDEX workshop_modules_pkey ON public.workshop_modules USING btree (id);

CREATE UNIQUE INDEX workshop_resources_pkey ON public.workshop_resources USING btree (id);

CREATE UNIQUE INDEX workshops_pkey ON public.workshops USING btree (id);

alter table "public"."achievements" add constraint "achievements_pkey" PRIMARY KEY using index "achievements_pkey";

alter table "public"."application_documents" add constraint "application_documents_pkey" PRIMARY KEY using index "application_documents_pkey";

alter table "public"."career_pathways" add constraint "career_pathways_pkey" PRIMARY KEY using index "career_pathways_pkey";

alter table "public"."companies" add constraint "companies_pkey" PRIMARY KEY using index "companies_pkey";

alter table "public"."file_uploads" add constraint "file_uploads_pkey" PRIMARY KEY using index "file_uploads_pkey";

alter table "public"."job_applications" add constraint "job_applications_pkey" PRIMARY KEY using index "job_applications_pkey";

alter table "public"."learning_analytics" add constraint "learning_analytics_pkey" PRIMARY KEY using index "learning_analytics_pkey";

alter table "public"."mentors" add constraint "mentors_pkey" PRIMARY KEY using index "mentors_pkey";

alter table "public"."quick_guides" add constraint "quick_guides_pkey" PRIMARY KEY using index "quick_guides_pkey";

alter table "public"."readiness_scores" add constraint "readiness_scores_pkey" PRIMARY KEY using index "readiness_scores_pkey";

alter table "public"."resource_categories" add constraint "resource_categories_pkey" PRIMARY KEY using index "resource_categories_pkey";

alter table "public"."resource_ratings" add constraint "resource_ratings_pkey" PRIMARY KEY using index "resource_ratings_pkey";

alter table "public"."resources" add constraint "resources_pkey" PRIMARY KEY using index "resources_pkey";

alter table "public"."skills_assessments" add constraint "skills_assessments_pkey" PRIMARY KEY using index "skills_assessments_pkey";

alter table "public"."skills_taxonomy" add constraint "skills_taxonomy_pkey" PRIMARY KEY using index "skills_taxonomy_pkey";

alter table "public"."success_stories" add constraint "success_stories_pkey" PRIMARY KEY using index "success_stories_pkey";

alter table "public"."user_bookmarks" add constraint "user_bookmarks_pkey" PRIMARY KEY using index "user_bookmarks_pkey";

alter table "public"."user_documents" add constraint "user_documents_pkey" PRIMARY KEY using index "user_documents_pkey";

alter table "public"."user_progress" add constraint "user_progress_pkey" PRIMARY KEY using index "user_progress_pkey";

alter table "public"."user_sessions" add constraint "user_sessions_pkey" PRIMARY KEY using index "user_sessions_pkey";

alter table "public"."user_skills_confidence" add constraint "user_skills_confidence_pkey" PRIMARY KEY using index "user_skills_confidence_pkey";

alter table "public"."workshop_activities" add constraint "workshop_activities_pkey" PRIMARY KEY using index "workshop_activities_pkey";

alter table "public"."workshop_modules" add constraint "workshop_modules_pkey" PRIMARY KEY using index "workshop_modules_pkey";

alter table "public"."workshop_resources" add constraint "workshop_resources_pkey" PRIMARY KEY using index "workshop_resources_pkey";

alter table "public"."workshops" add constraint "workshops_pkey" PRIMARY KEY using index "workshops_pkey";

alter table "public"."achievements" add constraint "achievements_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."achievements" validate constraint "achievements_user_id_fkey";

alter table "public"."application_documents" add constraint "application_documents_application_id_fkey" FOREIGN KEY (application_id) REFERENCES job_applications(id) ON DELETE CASCADE not valid;

alter table "public"."application_documents" validate constraint "application_documents_application_id_fkey";

alter table "public"."application_documents" add constraint "application_documents_file_id_fkey" FOREIGN KEY (file_id) REFERENCES file_uploads(id) not valid;

alter table "public"."application_documents" validate constraint "application_documents_file_id_fkey";

alter table "public"."application_documents" add constraint "application_documents_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."application_documents" validate constraint "application_documents_user_id_fkey";

alter table "public"."career_pathways" add constraint "career_pathways_difficulty_level_check" CHECK ((difficulty_level = ANY (ARRAY['beginner'::text, 'intermediate'::text, 'advanced'::text]))) not valid;

alter table "public"."career_pathways" validate constraint "career_pathways_difficulty_level_check";

alter table "public"."file_uploads" add constraint "file_uploads_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."file_uploads" validate constraint "file_uploads_user_id_fkey";

alter table "public"."job_applications" add constraint "job_applications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."job_applications" validate constraint "job_applications_user_id_fkey";

alter table "public"."learning_analytics" add constraint "learning_analytics_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."learning_analytics" validate constraint "learning_analytics_user_id_fkey";

alter table "public"."learning_analytics" add constraint "learning_analytics_user_id_key" UNIQUE using index "learning_analytics_user_id_key";

alter table "public"."readiness_scores" add constraint "readiness_scores_confidence_score_check" CHECK (((confidence_score >= (0)::numeric) AND (confidence_score <= (10)::numeric))) not valid;

alter table "public"."readiness_scores" validate constraint "readiness_scores_confidence_score_check";

alter table "public"."readiness_scores" add constraint "readiness_scores_experience_score_check" CHECK (((experience_score >= (0)::numeric) AND (experience_score <= (10)::numeric))) not valid;

alter table "public"."readiness_scores" validate constraint "readiness_scores_experience_score_check";

alter table "public"."readiness_scores" add constraint "readiness_scores_network_score_check" CHECK (((network_score >= (0)::numeric) AND (network_score <= (10)::numeric))) not valid;

alter table "public"."readiness_scores" validate constraint "readiness_scores_network_score_check";

alter table "public"."readiness_scores" add constraint "readiness_scores_portfolio_score_check" CHECK (((portfolio_score >= (0)::numeric) AND (portfolio_score <= (10)::numeric))) not valid;

alter table "public"."readiness_scores" validate constraint "readiness_scores_portfolio_score_check";

alter table "public"."readiness_scores" add constraint "readiness_scores_skills_score_check" CHECK (((skills_score >= (0)::numeric) AND (skills_score <= (10)::numeric))) not valid;

alter table "public"."readiness_scores" validate constraint "readiness_scores_skills_score_check";

alter table "public"."readiness_scores" add constraint "readiness_scores_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."readiness_scores" validate constraint "readiness_scores_user_id_fkey";

alter table "public"."readiness_scores" add constraint "readiness_scores_user_id_key" UNIQUE using index "readiness_scores_user_id_key";

alter table "public"."resource_categories" add constraint "resource_categories_name_key" UNIQUE using index "resource_categories_name_key";

alter table "public"."resource_categories" add constraint "resource_categories_parent_id_fkey" FOREIGN KEY (parent_id) REFERENCES resource_categories(id) ON DELETE SET NULL not valid;

alter table "public"."resource_categories" validate constraint "resource_categories_parent_id_fkey";

alter table "public"."resource_ratings" add constraint "resource_ratings_rating_check" CHECK (((rating >= 1) AND (rating <= 5))) not valid;

alter table "public"."resource_ratings" validate constraint "resource_ratings_rating_check";

alter table "public"."resource_ratings" add constraint "resource_ratings_resource_id_fkey" FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE not valid;

alter table "public"."resource_ratings" validate constraint "resource_ratings_resource_id_fkey";

alter table "public"."resource_ratings" add constraint "resource_ratings_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."resource_ratings" validate constraint "resource_ratings_user_id_fkey";

alter table "public"."resource_ratings" add constraint "resource_ratings_user_id_resource_id_key" UNIQUE using index "resource_ratings_user_id_resource_id_key";

alter table "public"."skills_assessments" add constraint "skills_assessments_confidence_level_check" CHECK (((confidence_level >= 1) AND (confidence_level <= 5))) not valid;

alter table "public"."skills_assessments" validate constraint "skills_assessments_confidence_level_check";

alter table "public"."skills_assessments" add constraint "skills_assessments_skill_id_fkey" FOREIGN KEY (skill_id) REFERENCES skills_taxonomy(id) ON DELETE CASCADE not valid;

alter table "public"."skills_assessments" validate constraint "skills_assessments_skill_id_fkey";

alter table "public"."skills_assessments" add constraint "skills_assessments_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."skills_assessments" validate constraint "skills_assessments_user_id_fkey";

alter table "public"."skills_taxonomy" add constraint "skills_taxonomy_difficulty_level_check" CHECK (((difficulty_level >= 1) AND (difficulty_level <= 5))) not valid;

alter table "public"."skills_taxonomy" validate constraint "skills_taxonomy_difficulty_level_check";

alter table "public"."success_stories" add constraint "success_stories_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."success_stories" validate constraint "success_stories_user_id_fkey";

alter table "public"."user_bookmarks" add constraint "user_bookmarks_check" CHECK ((((resource_id IS NOT NULL) AND (workshop_id IS NULL)) OR ((resource_id IS NULL) AND (workshop_id IS NOT NULL)))) not valid;

alter table "public"."user_bookmarks" validate constraint "user_bookmarks_check";

alter table "public"."user_bookmarks" add constraint "user_bookmarks_resource_id_fkey" FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE not valid;

alter table "public"."user_bookmarks" validate constraint "user_bookmarks_resource_id_fkey";

alter table "public"."user_bookmarks" add constraint "user_bookmarks_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_bookmarks" validate constraint "user_bookmarks_user_id_fkey";

alter table "public"."user_bookmarks" add constraint "user_bookmarks_workshop_id_fkey" FOREIGN KEY (workshop_id) REFERENCES workshops(id) ON DELETE CASCADE not valid;

alter table "public"."user_bookmarks" validate constraint "user_bookmarks_workshop_id_fkey";

alter table "public"."user_documents" add constraint "user_documents_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_documents" validate constraint "user_documents_user_id_fkey";

alter table "public"."user_progress" add constraint "user_progress_progress_percentage_check" CHECK (((progress_percentage >= 0) AND (progress_percentage <= 100))) not valid;

alter table "public"."user_progress" validate constraint "user_progress_progress_percentage_check";

alter table "public"."user_progress" add constraint "user_progress_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_progress" validate constraint "user_progress_user_id_fkey";

alter table "public"."user_progress" add constraint "user_progress_user_id_workshop_id_key" UNIQUE using index "user_progress_user_id_workshop_id_key";

alter table "public"."user_progress" add constraint "user_progress_workshop_id_fkey" FOREIGN KEY (workshop_id) REFERENCES workshops(id) ON DELETE CASCADE not valid;

alter table "public"."user_progress" validate constraint "user_progress_workshop_id_fkey";

alter table "public"."user_sessions" add constraint "user_sessions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_sessions" validate constraint "user_sessions_user_id_fkey";

alter table "public"."user_sessions" add constraint "user_sessions_workshop_id_fkey" FOREIGN KEY (workshop_id) REFERENCES workshops(id) not valid;

alter table "public"."user_sessions" validate constraint "user_sessions_workshop_id_fkey";

alter table "public"."user_skills_confidence" add constraint "user_skills_confidence_confidence_level_check" CHECK (((confidence_level >= 1) AND (confidence_level <= 5))) not valid;

alter table "public"."user_skills_confidence" validate constraint "user_skills_confidence_confidence_level_check";

alter table "public"."user_skills_confidence" add constraint "user_skills_confidence_proficiency_level_check" CHECK ((proficiency_level = ANY (ARRAY['beginner'::text, 'intermediate'::text, 'advanced'::text, 'expert'::text]))) not valid;

alter table "public"."user_skills_confidence" validate constraint "user_skills_confidence_proficiency_level_check";

alter table "public"."user_skills_confidence" add constraint "user_skills_confidence_skill_id_fkey" FOREIGN KEY (skill_id) REFERENCES skills_taxonomy(id) ON DELETE CASCADE not valid;

alter table "public"."user_skills_confidence" validate constraint "user_skills_confidence_skill_id_fkey";

alter table "public"."user_skills_confidence" add constraint "user_skills_confidence_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_skills_confidence" validate constraint "user_skills_confidence_user_id_fkey";

alter table "public"."user_skills_confidence" add constraint "user_skills_confidence_user_id_skill_id_key" UNIQUE using index "user_skills_confidence_user_id_skill_id_key";

alter table "public"."workshop_activities" add constraint "workshop_activities_module_id_fkey" FOREIGN KEY (module_id) REFERENCES workshop_modules(id) ON DELETE CASCADE not valid;

alter table "public"."workshop_activities" validate constraint "workshop_activities_module_id_fkey";

alter table "public"."workshop_activities" add constraint "workshop_activities_workshop_id_fkey" FOREIGN KEY (workshop_id) REFERENCES workshops(id) ON DELETE CASCADE not valid;

alter table "public"."workshop_activities" validate constraint "workshop_activities_workshop_id_fkey";

alter table "public"."workshop_modules" add constraint "workshop_modules_module_type_check" CHECK ((module_type = ANY (ARRAY['video'::text, 'text'::text, 'interactive'::text, 'quiz'::text, 'exercise'::text]))) not valid;

alter table "public"."workshop_modules" validate constraint "workshop_modules_module_type_check";

alter table "public"."workshop_modules" add constraint "workshop_modules_workshop_id_fkey" FOREIGN KEY (workshop_id) REFERENCES workshops(id) ON DELETE CASCADE not valid;

alter table "public"."workshop_modules" validate constraint "workshop_modules_workshop_id_fkey";

alter table "public"."workshop_resources" add constraint "workshop_resources_resource_id_fkey" FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE not valid;

alter table "public"."workshop_resources" validate constraint "workshop_resources_resource_id_fkey";

alter table "public"."workshop_resources" add constraint "workshop_resources_workshop_id_fkey" FOREIGN KEY (workshop_id) REFERENCES workshops(id) ON DELETE CASCADE not valid;

alter table "public"."workshop_resources" validate constraint "workshop_resources_workshop_id_fkey";

alter table "public"."workshops" add constraint "workshops_difficulty_level_check" CHECK ((difficulty_level = ANY (ARRAY['beginner'::text, 'intermediate'::text, 'advanced'::text]))) not valid;

alter table "public"."workshops" validate constraint "workshops_difficulty_level_check";

alter table "public"."workshops" add constraint "workshops_pathway_id_fkey" FOREIGN KEY (pathway_id) REFERENCES career_pathways(id) ON DELETE SET NULL not valid;

alter table "public"."workshops" validate constraint "workshops_pathway_id_fkey";

alter table "public"."user_preferences" add constraint "user_preferences_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_preferences" validate constraint "user_preferences_user_id_fkey";

set check_function_bodies = off;

create or replace view "public"."complete_profiles" as  SELECT p.id,
    p.email,
    p.name,
    p.avatar_file_id,
    p.cv_completed,
    p.onboarding_data,
    p.created_at AS profile_created_at,
    up.learning_style,
    up.accessibility_needs,
    up.created_at AS preferences_created_at,
    up.updated_at AS preferences_updated_at
   FROM (profiles p
     LEFT JOIN user_preferences up ON ((p.id = up.user_id)));


CREATE OR REPLACE FUNCTION public.ensure_user_setup(user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    profile_exists boolean := false;
    preferences_exist boolean := false;
    result jsonb := '{}';
BEGIN
    -- Check if profile exists
    SELECT EXISTS (
        SELECT 1 FROM public.profiles WHERE profiles.id = user_id
    ) INTO profile_exists;

    -- Check if preferences exist
    SELECT EXISTS (
        SELECT 1 FROM public.user_preferences WHERE user_preferences.user_id = user_id
    ) INTO preferences_exist;

    -- Create profile if missing (shouldn't happen, but safety net)
    IF NOT profile_exists THEN
        INSERT INTO public.profiles (id, email, name, created_at)
        SELECT user_id, au.email, COALESCE(au.raw_user_meta_data->>'name', ''), NOW()
        FROM auth.users au WHERE au.id = user_id
        ON CONFLICT (id) DO NOTHING;

        result := result || jsonb_build_object('created_profile', true);
    END IF;

    -- Create preferences if missing
    IF NOT preferences_exist THEN
        INSERT INTO public.user_preferences (user_id, learning_style, accessibility_needs, created_at, updated_at)
        VALUES (user_id, 'visual', '{}'::jsonb, NOW(), NOW())
        ON CONFLICT (user_id) DO NOTHING;

        result := result || jsonb_build_object('created_preferences', true);
    END IF;

    result := result || jsonb_build_object('profile_exists', profile_exists, 'preferences_exist', preferences_exist);

    RETURN result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.fix_orphaned_profiles()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    fixed_count int := 0;
    profile_record RECORD;
BEGIN
    -- Find profiles without preferences and create them
    INSERT INTO public.user_preferences (user_id, learning_style, accessibility_needs, created_at, updated_at)
    SELECT
        p.id,
        'visual',
        '{}'::jsonb,
        NOW(),
        NOW()
    FROM public.profiles p
    LEFT JOIN public.user_preferences up ON p.id = up.user_id
    WHERE up.user_id IS NULL
    ON CONFLICT (user_id) DO NOTHING;

    -- Get the count of how many we fixed
    GET DIAGNOSTICS fixed_count = ROW_COUNT;

    RETURN fixed_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_email_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  UPDATE public.profiles
  SET email = NEW.email
  WHERE id = NEW.id;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_user_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  UPDATE public.learning_analytics
  SET last_activity_date = NOW()::DATE,
      updated_at = NOW()
  WHERE user_id = NEW.user_id;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    profile_exists boolean := false;
    preferences_exist boolean := false;
BEGIN
    -- Check if profile already exists
    SELECT EXISTS (
        SELECT 1 FROM public.profiles WHERE id = NEW.id
    ) INTO profile_exists;

    -- Check if preferences already exist
    SELECT EXISTS (
        SELECT 1 FROM public.user_preferences WHERE user_id = NEW.id
    ) INTO preferences_exist;

    -- Create profile if it doesn't exist
    IF NOT profile_exists THEN
        INSERT INTO public.profiles (id, email, name, created_at)
        VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', ''), NOW())
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            name = COALESCE(EXCLUDED.name, profiles.name);
    END IF;

    -- Create default user preferences if they don't exist
    IF NOT preferences_exist THEN
        INSERT INTO public.user_preferences (user_id, learning_style, accessibility_needs, created_at, updated_at)
        VALUES (NEW.id, 'visual', '{}'::jsonb, NOW(), NOW())
        ON CONFLICT (user_id) DO NOTHING;
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the user creation
        RAISE LOG 'Error in handle_new_user trigger for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$function$
;

grant delete on table "public"."achievements" to "anon";

grant insert on table "public"."achievements" to "anon";

grant references on table "public"."achievements" to "anon";

grant select on table "public"."achievements" to "anon";

grant trigger on table "public"."achievements" to "anon";

grant truncate on table "public"."achievements" to "anon";

grant update on table "public"."achievements" to "anon";

grant delete on table "public"."achievements" to "authenticated";

grant insert on table "public"."achievements" to "authenticated";

grant references on table "public"."achievements" to "authenticated";

grant select on table "public"."achievements" to "authenticated";

grant trigger on table "public"."achievements" to "authenticated";

grant truncate on table "public"."achievements" to "authenticated";

grant update on table "public"."achievements" to "authenticated";

grant delete on table "public"."achievements" to "service_role";

grant insert on table "public"."achievements" to "service_role";

grant references on table "public"."achievements" to "service_role";

grant select on table "public"."achievements" to "service_role";

grant trigger on table "public"."achievements" to "service_role";

grant truncate on table "public"."achievements" to "service_role";

grant update on table "public"."achievements" to "service_role";

grant delete on table "public"."application_documents" to "anon";

grant insert on table "public"."application_documents" to "anon";

grant references on table "public"."application_documents" to "anon";

grant select on table "public"."application_documents" to "anon";

grant trigger on table "public"."application_documents" to "anon";

grant truncate on table "public"."application_documents" to "anon";

grant update on table "public"."application_documents" to "anon";

grant delete on table "public"."application_documents" to "authenticated";

grant insert on table "public"."application_documents" to "authenticated";

grant references on table "public"."application_documents" to "authenticated";

grant select on table "public"."application_documents" to "authenticated";

grant trigger on table "public"."application_documents" to "authenticated";

grant truncate on table "public"."application_documents" to "authenticated";

grant update on table "public"."application_documents" to "authenticated";

grant delete on table "public"."application_documents" to "service_role";

grant insert on table "public"."application_documents" to "service_role";

grant references on table "public"."application_documents" to "service_role";

grant select on table "public"."application_documents" to "service_role";

grant trigger on table "public"."application_documents" to "service_role";

grant truncate on table "public"."application_documents" to "service_role";

grant update on table "public"."application_documents" to "service_role";

grant delete on table "public"."career_pathways" to "anon";

grant insert on table "public"."career_pathways" to "anon";

grant references on table "public"."career_pathways" to "anon";

grant select on table "public"."career_pathways" to "anon";

grant trigger on table "public"."career_pathways" to "anon";

grant truncate on table "public"."career_pathways" to "anon";

grant update on table "public"."career_pathways" to "anon";

grant delete on table "public"."career_pathways" to "authenticated";

grant insert on table "public"."career_pathways" to "authenticated";

grant references on table "public"."career_pathways" to "authenticated";

grant select on table "public"."career_pathways" to "authenticated";

grant trigger on table "public"."career_pathways" to "authenticated";

grant truncate on table "public"."career_pathways" to "authenticated";

grant update on table "public"."career_pathways" to "authenticated";

grant delete on table "public"."career_pathways" to "service_role";

grant insert on table "public"."career_pathways" to "service_role";

grant references on table "public"."career_pathways" to "service_role";

grant select on table "public"."career_pathways" to "service_role";

grant trigger on table "public"."career_pathways" to "service_role";

grant truncate on table "public"."career_pathways" to "service_role";

grant update on table "public"."career_pathways" to "service_role";

grant delete on table "public"."companies" to "anon";

grant insert on table "public"."companies" to "anon";

grant references on table "public"."companies" to "anon";

grant select on table "public"."companies" to "anon";

grant trigger on table "public"."companies" to "anon";

grant truncate on table "public"."companies" to "anon";

grant update on table "public"."companies" to "anon";

grant delete on table "public"."companies" to "authenticated";

grant insert on table "public"."companies" to "authenticated";

grant references on table "public"."companies" to "authenticated";

grant select on table "public"."companies" to "authenticated";

grant trigger on table "public"."companies" to "authenticated";

grant truncate on table "public"."companies" to "authenticated";

grant update on table "public"."companies" to "authenticated";

grant delete on table "public"."companies" to "service_role";

grant insert on table "public"."companies" to "service_role";

grant references on table "public"."companies" to "service_role";

grant select on table "public"."companies" to "service_role";

grant trigger on table "public"."companies" to "service_role";

grant truncate on table "public"."companies" to "service_role";

grant update on table "public"."companies" to "service_role";

grant delete on table "public"."file_uploads" to "anon";

grant insert on table "public"."file_uploads" to "anon";

grant references on table "public"."file_uploads" to "anon";

grant select on table "public"."file_uploads" to "anon";

grant trigger on table "public"."file_uploads" to "anon";

grant truncate on table "public"."file_uploads" to "anon";

grant update on table "public"."file_uploads" to "anon";

grant delete on table "public"."file_uploads" to "authenticated";

grant insert on table "public"."file_uploads" to "authenticated";

grant references on table "public"."file_uploads" to "authenticated";

grant select on table "public"."file_uploads" to "authenticated";

grant trigger on table "public"."file_uploads" to "authenticated";

grant truncate on table "public"."file_uploads" to "authenticated";

grant update on table "public"."file_uploads" to "authenticated";

grant delete on table "public"."file_uploads" to "service_role";

grant insert on table "public"."file_uploads" to "service_role";

grant references on table "public"."file_uploads" to "service_role";

grant select on table "public"."file_uploads" to "service_role";

grant trigger on table "public"."file_uploads" to "service_role";

grant truncate on table "public"."file_uploads" to "service_role";

grant update on table "public"."file_uploads" to "service_role";

grant delete on table "public"."job_applications" to "anon";

grant insert on table "public"."job_applications" to "anon";

grant references on table "public"."job_applications" to "anon";

grant select on table "public"."job_applications" to "anon";

grant trigger on table "public"."job_applications" to "anon";

grant truncate on table "public"."job_applications" to "anon";

grant update on table "public"."job_applications" to "anon";

grant delete on table "public"."job_applications" to "authenticated";

grant insert on table "public"."job_applications" to "authenticated";

grant references on table "public"."job_applications" to "authenticated";

grant select on table "public"."job_applications" to "authenticated";

grant trigger on table "public"."job_applications" to "authenticated";

grant truncate on table "public"."job_applications" to "authenticated";

grant update on table "public"."job_applications" to "authenticated";

grant delete on table "public"."job_applications" to "service_role";

grant insert on table "public"."job_applications" to "service_role";

grant references on table "public"."job_applications" to "service_role";

grant select on table "public"."job_applications" to "service_role";

grant trigger on table "public"."job_applications" to "service_role";

grant truncate on table "public"."job_applications" to "service_role";

grant update on table "public"."job_applications" to "service_role";

grant delete on table "public"."learning_analytics" to "anon";

grant insert on table "public"."learning_analytics" to "anon";

grant references on table "public"."learning_analytics" to "anon";

grant select on table "public"."learning_analytics" to "anon";

grant trigger on table "public"."learning_analytics" to "anon";

grant truncate on table "public"."learning_analytics" to "anon";

grant update on table "public"."learning_analytics" to "anon";

grant delete on table "public"."learning_analytics" to "authenticated";

grant insert on table "public"."learning_analytics" to "authenticated";

grant references on table "public"."learning_analytics" to "authenticated";

grant select on table "public"."learning_analytics" to "authenticated";

grant trigger on table "public"."learning_analytics" to "authenticated";

grant truncate on table "public"."learning_analytics" to "authenticated";

grant update on table "public"."learning_analytics" to "authenticated";

grant delete on table "public"."learning_analytics" to "service_role";

grant insert on table "public"."learning_analytics" to "service_role";

grant references on table "public"."learning_analytics" to "service_role";

grant select on table "public"."learning_analytics" to "service_role";

grant trigger on table "public"."learning_analytics" to "service_role";

grant truncate on table "public"."learning_analytics" to "service_role";

grant update on table "public"."learning_analytics" to "service_role";

grant delete on table "public"."mentors" to "anon";

grant insert on table "public"."mentors" to "anon";

grant references on table "public"."mentors" to "anon";

grant select on table "public"."mentors" to "anon";

grant trigger on table "public"."mentors" to "anon";

grant truncate on table "public"."mentors" to "anon";

grant update on table "public"."mentors" to "anon";

grant delete on table "public"."mentors" to "authenticated";

grant insert on table "public"."mentors" to "authenticated";

grant references on table "public"."mentors" to "authenticated";

grant select on table "public"."mentors" to "authenticated";

grant trigger on table "public"."mentors" to "authenticated";

grant truncate on table "public"."mentors" to "authenticated";

grant update on table "public"."mentors" to "authenticated";

grant delete on table "public"."mentors" to "service_role";

grant insert on table "public"."mentors" to "service_role";

grant references on table "public"."mentors" to "service_role";

grant select on table "public"."mentors" to "service_role";

grant trigger on table "public"."mentors" to "service_role";

grant truncate on table "public"."mentors" to "service_role";

grant update on table "public"."mentors" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

grant delete on table "public"."quick_guides" to "anon";

grant insert on table "public"."quick_guides" to "anon";

grant references on table "public"."quick_guides" to "anon";

grant select on table "public"."quick_guides" to "anon";

grant trigger on table "public"."quick_guides" to "anon";

grant truncate on table "public"."quick_guides" to "anon";

grant update on table "public"."quick_guides" to "anon";

grant delete on table "public"."quick_guides" to "authenticated";

grant insert on table "public"."quick_guides" to "authenticated";

grant references on table "public"."quick_guides" to "authenticated";

grant select on table "public"."quick_guides" to "authenticated";

grant trigger on table "public"."quick_guides" to "authenticated";

grant truncate on table "public"."quick_guides" to "authenticated";

grant update on table "public"."quick_guides" to "authenticated";

grant delete on table "public"."quick_guides" to "service_role";

grant insert on table "public"."quick_guides" to "service_role";

grant references on table "public"."quick_guides" to "service_role";

grant select on table "public"."quick_guides" to "service_role";

grant trigger on table "public"."quick_guides" to "service_role";

grant truncate on table "public"."quick_guides" to "service_role";

grant update on table "public"."quick_guides" to "service_role";

grant delete on table "public"."readiness_scores" to "anon";

grant insert on table "public"."readiness_scores" to "anon";

grant references on table "public"."readiness_scores" to "anon";

grant select on table "public"."readiness_scores" to "anon";

grant trigger on table "public"."readiness_scores" to "anon";

grant truncate on table "public"."readiness_scores" to "anon";

grant update on table "public"."readiness_scores" to "anon";

grant delete on table "public"."readiness_scores" to "authenticated";

grant insert on table "public"."readiness_scores" to "authenticated";

grant references on table "public"."readiness_scores" to "authenticated";

grant select on table "public"."readiness_scores" to "authenticated";

grant trigger on table "public"."readiness_scores" to "authenticated";

grant truncate on table "public"."readiness_scores" to "authenticated";

grant update on table "public"."readiness_scores" to "authenticated";

grant delete on table "public"."readiness_scores" to "service_role";

grant insert on table "public"."readiness_scores" to "service_role";

grant references on table "public"."readiness_scores" to "service_role";

grant select on table "public"."readiness_scores" to "service_role";

grant trigger on table "public"."readiness_scores" to "service_role";

grant truncate on table "public"."readiness_scores" to "service_role";

grant update on table "public"."readiness_scores" to "service_role";

grant delete on table "public"."resource_categories" to "anon";

grant insert on table "public"."resource_categories" to "anon";

grant references on table "public"."resource_categories" to "anon";

grant select on table "public"."resource_categories" to "anon";

grant trigger on table "public"."resource_categories" to "anon";

grant truncate on table "public"."resource_categories" to "anon";

grant update on table "public"."resource_categories" to "anon";

grant delete on table "public"."resource_categories" to "authenticated";

grant insert on table "public"."resource_categories" to "authenticated";

grant references on table "public"."resource_categories" to "authenticated";

grant select on table "public"."resource_categories" to "authenticated";

grant trigger on table "public"."resource_categories" to "authenticated";

grant truncate on table "public"."resource_categories" to "authenticated";

grant update on table "public"."resource_categories" to "authenticated";

grant delete on table "public"."resource_categories" to "service_role";

grant insert on table "public"."resource_categories" to "service_role";

grant references on table "public"."resource_categories" to "service_role";

grant select on table "public"."resource_categories" to "service_role";

grant trigger on table "public"."resource_categories" to "service_role";

grant truncate on table "public"."resource_categories" to "service_role";

grant update on table "public"."resource_categories" to "service_role";

grant delete on table "public"."resource_ratings" to "anon";

grant insert on table "public"."resource_ratings" to "anon";

grant references on table "public"."resource_ratings" to "anon";

grant select on table "public"."resource_ratings" to "anon";

grant trigger on table "public"."resource_ratings" to "anon";

grant truncate on table "public"."resource_ratings" to "anon";

grant update on table "public"."resource_ratings" to "anon";

grant delete on table "public"."resource_ratings" to "authenticated";

grant insert on table "public"."resource_ratings" to "authenticated";

grant references on table "public"."resource_ratings" to "authenticated";

grant select on table "public"."resource_ratings" to "authenticated";

grant trigger on table "public"."resource_ratings" to "authenticated";

grant truncate on table "public"."resource_ratings" to "authenticated";

grant update on table "public"."resource_ratings" to "authenticated";

grant delete on table "public"."resource_ratings" to "service_role";

grant insert on table "public"."resource_ratings" to "service_role";

grant references on table "public"."resource_ratings" to "service_role";

grant select on table "public"."resource_ratings" to "service_role";

grant trigger on table "public"."resource_ratings" to "service_role";

grant truncate on table "public"."resource_ratings" to "service_role";

grant update on table "public"."resource_ratings" to "service_role";

grant delete on table "public"."resources" to "anon";

grant insert on table "public"."resources" to "anon";

grant references on table "public"."resources" to "anon";

grant select on table "public"."resources" to "anon";

grant trigger on table "public"."resources" to "anon";

grant truncate on table "public"."resources" to "anon";

grant update on table "public"."resources" to "anon";

grant delete on table "public"."resources" to "authenticated";

grant insert on table "public"."resources" to "authenticated";

grant references on table "public"."resources" to "authenticated";

grant select on table "public"."resources" to "authenticated";

grant trigger on table "public"."resources" to "authenticated";

grant truncate on table "public"."resources" to "authenticated";

grant update on table "public"."resources" to "authenticated";

grant delete on table "public"."resources" to "service_role";

grant insert on table "public"."resources" to "service_role";

grant references on table "public"."resources" to "service_role";

grant select on table "public"."resources" to "service_role";

grant trigger on table "public"."resources" to "service_role";

grant truncate on table "public"."resources" to "service_role";

grant update on table "public"."resources" to "service_role";

grant delete on table "public"."skills_assessments" to "anon";

grant insert on table "public"."skills_assessments" to "anon";

grant references on table "public"."skills_assessments" to "anon";

grant select on table "public"."skills_assessments" to "anon";

grant trigger on table "public"."skills_assessments" to "anon";

grant truncate on table "public"."skills_assessments" to "anon";

grant update on table "public"."skills_assessments" to "anon";

grant delete on table "public"."skills_assessments" to "authenticated";

grant insert on table "public"."skills_assessments" to "authenticated";

grant references on table "public"."skills_assessments" to "authenticated";

grant select on table "public"."skills_assessments" to "authenticated";

grant trigger on table "public"."skills_assessments" to "authenticated";

grant truncate on table "public"."skills_assessments" to "authenticated";

grant update on table "public"."skills_assessments" to "authenticated";

grant delete on table "public"."skills_assessments" to "service_role";

grant insert on table "public"."skills_assessments" to "service_role";

grant references on table "public"."skills_assessments" to "service_role";

grant select on table "public"."skills_assessments" to "service_role";

grant trigger on table "public"."skills_assessments" to "service_role";

grant truncate on table "public"."skills_assessments" to "service_role";

grant update on table "public"."skills_assessments" to "service_role";

grant delete on table "public"."skills_taxonomy" to "anon";

grant insert on table "public"."skills_taxonomy" to "anon";

grant references on table "public"."skills_taxonomy" to "anon";

grant select on table "public"."skills_taxonomy" to "anon";

grant trigger on table "public"."skills_taxonomy" to "anon";

grant truncate on table "public"."skills_taxonomy" to "anon";

grant update on table "public"."skills_taxonomy" to "anon";

grant delete on table "public"."skills_taxonomy" to "authenticated";

grant insert on table "public"."skills_taxonomy" to "authenticated";

grant references on table "public"."skills_taxonomy" to "authenticated";

grant select on table "public"."skills_taxonomy" to "authenticated";

grant trigger on table "public"."skills_taxonomy" to "authenticated";

grant truncate on table "public"."skills_taxonomy" to "authenticated";

grant update on table "public"."skills_taxonomy" to "authenticated";

grant delete on table "public"."skills_taxonomy" to "service_role";

grant insert on table "public"."skills_taxonomy" to "service_role";

grant references on table "public"."skills_taxonomy" to "service_role";

grant select on table "public"."skills_taxonomy" to "service_role";

grant trigger on table "public"."skills_taxonomy" to "service_role";

grant truncate on table "public"."skills_taxonomy" to "service_role";

grant update on table "public"."skills_taxonomy" to "service_role";

grant delete on table "public"."success_stories" to "anon";

grant insert on table "public"."success_stories" to "anon";

grant references on table "public"."success_stories" to "anon";

grant select on table "public"."success_stories" to "anon";

grant trigger on table "public"."success_stories" to "anon";

grant truncate on table "public"."success_stories" to "anon";

grant update on table "public"."success_stories" to "anon";

grant delete on table "public"."success_stories" to "authenticated";

grant insert on table "public"."success_stories" to "authenticated";

grant references on table "public"."success_stories" to "authenticated";

grant select on table "public"."success_stories" to "authenticated";

grant trigger on table "public"."success_stories" to "authenticated";

grant truncate on table "public"."success_stories" to "authenticated";

grant update on table "public"."success_stories" to "authenticated";

grant delete on table "public"."success_stories" to "service_role";

grant insert on table "public"."success_stories" to "service_role";

grant references on table "public"."success_stories" to "service_role";

grant select on table "public"."success_stories" to "service_role";

grant trigger on table "public"."success_stories" to "service_role";

grant truncate on table "public"."success_stories" to "service_role";

grant update on table "public"."success_stories" to "service_role";

grant delete on table "public"."user_bookmarks" to "anon";

grant insert on table "public"."user_bookmarks" to "anon";

grant references on table "public"."user_bookmarks" to "anon";

grant select on table "public"."user_bookmarks" to "anon";

grant trigger on table "public"."user_bookmarks" to "anon";

grant truncate on table "public"."user_bookmarks" to "anon";

grant update on table "public"."user_bookmarks" to "anon";

grant delete on table "public"."user_bookmarks" to "authenticated";

grant insert on table "public"."user_bookmarks" to "authenticated";

grant references on table "public"."user_bookmarks" to "authenticated";

grant select on table "public"."user_bookmarks" to "authenticated";

grant trigger on table "public"."user_bookmarks" to "authenticated";

grant truncate on table "public"."user_bookmarks" to "authenticated";

grant update on table "public"."user_bookmarks" to "authenticated";

grant delete on table "public"."user_bookmarks" to "service_role";

grant insert on table "public"."user_bookmarks" to "service_role";

grant references on table "public"."user_bookmarks" to "service_role";

grant select on table "public"."user_bookmarks" to "service_role";

grant trigger on table "public"."user_bookmarks" to "service_role";

grant truncate on table "public"."user_bookmarks" to "service_role";

grant update on table "public"."user_bookmarks" to "service_role";

grant delete on table "public"."user_documents" to "anon";

grant insert on table "public"."user_documents" to "anon";

grant references on table "public"."user_documents" to "anon";

grant select on table "public"."user_documents" to "anon";

grant trigger on table "public"."user_documents" to "anon";

grant truncate on table "public"."user_documents" to "anon";

grant update on table "public"."user_documents" to "anon";

grant delete on table "public"."user_documents" to "authenticated";

grant insert on table "public"."user_documents" to "authenticated";

grant references on table "public"."user_documents" to "authenticated";

grant select on table "public"."user_documents" to "authenticated";

grant trigger on table "public"."user_documents" to "authenticated";

grant truncate on table "public"."user_documents" to "authenticated";

grant update on table "public"."user_documents" to "authenticated";

grant delete on table "public"."user_documents" to "service_role";

grant insert on table "public"."user_documents" to "service_role";

grant references on table "public"."user_documents" to "service_role";

grant select on table "public"."user_documents" to "service_role";

grant trigger on table "public"."user_documents" to "service_role";

grant truncate on table "public"."user_documents" to "service_role";

grant update on table "public"."user_documents" to "service_role";

grant delete on table "public"."user_preferences" to "anon";

grant insert on table "public"."user_preferences" to "anon";

grant references on table "public"."user_preferences" to "anon";

grant select on table "public"."user_preferences" to "anon";

grant trigger on table "public"."user_preferences" to "anon";

grant truncate on table "public"."user_preferences" to "anon";

grant update on table "public"."user_preferences" to "anon";

grant delete on table "public"."user_preferences" to "authenticated";

grant insert on table "public"."user_preferences" to "authenticated";

grant references on table "public"."user_preferences" to "authenticated";

grant select on table "public"."user_preferences" to "authenticated";

grant trigger on table "public"."user_preferences" to "authenticated";

grant truncate on table "public"."user_preferences" to "authenticated";

grant update on table "public"."user_preferences" to "authenticated";

grant delete on table "public"."user_preferences" to "service_role";

grant insert on table "public"."user_preferences" to "service_role";

grant references on table "public"."user_preferences" to "service_role";

grant select on table "public"."user_preferences" to "service_role";

grant trigger on table "public"."user_preferences" to "service_role";

grant truncate on table "public"."user_preferences" to "service_role";

grant update on table "public"."user_preferences" to "service_role";

grant delete on table "public"."user_progress" to "anon";

grant insert on table "public"."user_progress" to "anon";

grant references on table "public"."user_progress" to "anon";

grant select on table "public"."user_progress" to "anon";

grant trigger on table "public"."user_progress" to "anon";

grant truncate on table "public"."user_progress" to "anon";

grant update on table "public"."user_progress" to "anon";

grant delete on table "public"."user_progress" to "authenticated";

grant insert on table "public"."user_progress" to "authenticated";

grant references on table "public"."user_progress" to "authenticated";

grant select on table "public"."user_progress" to "authenticated";

grant trigger on table "public"."user_progress" to "authenticated";

grant truncate on table "public"."user_progress" to "authenticated";

grant update on table "public"."user_progress" to "authenticated";

grant delete on table "public"."user_progress" to "service_role";

grant insert on table "public"."user_progress" to "service_role";

grant references on table "public"."user_progress" to "service_role";

grant select on table "public"."user_progress" to "service_role";

grant trigger on table "public"."user_progress" to "service_role";

grant truncate on table "public"."user_progress" to "service_role";

grant update on table "public"."user_progress" to "service_role";

grant delete on table "public"."user_sessions" to "anon";

grant insert on table "public"."user_sessions" to "anon";

grant references on table "public"."user_sessions" to "anon";

grant select on table "public"."user_sessions" to "anon";

grant trigger on table "public"."user_sessions" to "anon";

grant truncate on table "public"."user_sessions" to "anon";

grant update on table "public"."user_sessions" to "anon";

grant delete on table "public"."user_sessions" to "authenticated";

grant insert on table "public"."user_sessions" to "authenticated";

grant references on table "public"."user_sessions" to "authenticated";

grant select on table "public"."user_sessions" to "authenticated";

grant trigger on table "public"."user_sessions" to "authenticated";

grant truncate on table "public"."user_sessions" to "authenticated";

grant update on table "public"."user_sessions" to "authenticated";

grant delete on table "public"."user_sessions" to "service_role";

grant insert on table "public"."user_sessions" to "service_role";

grant references on table "public"."user_sessions" to "service_role";

grant select on table "public"."user_sessions" to "service_role";

grant trigger on table "public"."user_sessions" to "service_role";

grant truncate on table "public"."user_sessions" to "service_role";

grant update on table "public"."user_sessions" to "service_role";

grant delete on table "public"."user_skills_confidence" to "anon";

grant insert on table "public"."user_skills_confidence" to "anon";

grant references on table "public"."user_skills_confidence" to "anon";

grant select on table "public"."user_skills_confidence" to "anon";

grant trigger on table "public"."user_skills_confidence" to "anon";

grant truncate on table "public"."user_skills_confidence" to "anon";

grant update on table "public"."user_skills_confidence" to "anon";

grant delete on table "public"."user_skills_confidence" to "authenticated";

grant insert on table "public"."user_skills_confidence" to "authenticated";

grant references on table "public"."user_skills_confidence" to "authenticated";

grant select on table "public"."user_skills_confidence" to "authenticated";

grant trigger on table "public"."user_skills_confidence" to "authenticated";

grant truncate on table "public"."user_skills_confidence" to "authenticated";

grant update on table "public"."user_skills_confidence" to "authenticated";

grant delete on table "public"."user_skills_confidence" to "service_role";

grant insert on table "public"."user_skills_confidence" to "service_role";

grant references on table "public"."user_skills_confidence" to "service_role";

grant select on table "public"."user_skills_confidence" to "service_role";

grant trigger on table "public"."user_skills_confidence" to "service_role";

grant truncate on table "public"."user_skills_confidence" to "service_role";

grant update on table "public"."user_skills_confidence" to "service_role";

grant delete on table "public"."workshop_activities" to "anon";

grant insert on table "public"."workshop_activities" to "anon";

grant references on table "public"."workshop_activities" to "anon";

grant select on table "public"."workshop_activities" to "anon";

grant trigger on table "public"."workshop_activities" to "anon";

grant truncate on table "public"."workshop_activities" to "anon";

grant update on table "public"."workshop_activities" to "anon";

grant delete on table "public"."workshop_activities" to "authenticated";

grant insert on table "public"."workshop_activities" to "authenticated";

grant references on table "public"."workshop_activities" to "authenticated";

grant select on table "public"."workshop_activities" to "authenticated";

grant trigger on table "public"."workshop_activities" to "authenticated";

grant truncate on table "public"."workshop_activities" to "authenticated";

grant update on table "public"."workshop_activities" to "authenticated";

grant delete on table "public"."workshop_activities" to "service_role";

grant insert on table "public"."workshop_activities" to "service_role";

grant references on table "public"."workshop_activities" to "service_role";

grant select on table "public"."workshop_activities" to "service_role";

grant trigger on table "public"."workshop_activities" to "service_role";

grant truncate on table "public"."workshop_activities" to "service_role";

grant update on table "public"."workshop_activities" to "service_role";

grant delete on table "public"."workshop_modules" to "anon";

grant insert on table "public"."workshop_modules" to "anon";

grant references on table "public"."workshop_modules" to "anon";

grant select on table "public"."workshop_modules" to "anon";

grant trigger on table "public"."workshop_modules" to "anon";

grant truncate on table "public"."workshop_modules" to "anon";

grant update on table "public"."workshop_modules" to "anon";

grant delete on table "public"."workshop_modules" to "authenticated";

grant insert on table "public"."workshop_modules" to "authenticated";

grant references on table "public"."workshop_modules" to "authenticated";

grant select on table "public"."workshop_modules" to "authenticated";

grant trigger on table "public"."workshop_modules" to "authenticated";

grant truncate on table "public"."workshop_modules" to "authenticated";

grant update on table "public"."workshop_modules" to "authenticated";

grant delete on table "public"."workshop_modules" to "service_role";

grant insert on table "public"."workshop_modules" to "service_role";

grant references on table "public"."workshop_modules" to "service_role";

grant select on table "public"."workshop_modules" to "service_role";

grant trigger on table "public"."workshop_modules" to "service_role";

grant truncate on table "public"."workshop_modules" to "service_role";

grant update on table "public"."workshop_modules" to "service_role";

grant delete on table "public"."workshop_resources" to "anon";

grant insert on table "public"."workshop_resources" to "anon";

grant references on table "public"."workshop_resources" to "anon";

grant select on table "public"."workshop_resources" to "anon";

grant trigger on table "public"."workshop_resources" to "anon";

grant truncate on table "public"."workshop_resources" to "anon";

grant update on table "public"."workshop_resources" to "anon";

grant delete on table "public"."workshop_resources" to "authenticated";

grant insert on table "public"."workshop_resources" to "authenticated";

grant references on table "public"."workshop_resources" to "authenticated";

grant select on table "public"."workshop_resources" to "authenticated";

grant trigger on table "public"."workshop_resources" to "authenticated";

grant truncate on table "public"."workshop_resources" to "authenticated";

grant update on table "public"."workshop_resources" to "authenticated";

grant delete on table "public"."workshop_resources" to "service_role";

grant insert on table "public"."workshop_resources" to "service_role";

grant references on table "public"."workshop_resources" to "service_role";

grant select on table "public"."workshop_resources" to "service_role";

grant trigger on table "public"."workshop_resources" to "service_role";

grant truncate on table "public"."workshop_resources" to "service_role";

grant update on table "public"."workshop_resources" to "service_role";

grant delete on table "public"."workshops" to "anon";

grant insert on table "public"."workshops" to "anon";

grant references on table "public"."workshops" to "anon";

grant select on table "public"."workshops" to "anon";

grant trigger on table "public"."workshops" to "anon";

grant truncate on table "public"."workshops" to "anon";

grant update on table "public"."workshops" to "anon";

grant delete on table "public"."workshops" to "authenticated";

grant insert on table "public"."workshops" to "authenticated";

grant references on table "public"."workshops" to "authenticated";

grant select on table "public"."workshops" to "authenticated";

grant trigger on table "public"."workshops" to "authenticated";

grant truncate on table "public"."workshops" to "authenticated";

grant update on table "public"."workshops" to "authenticated";

grant delete on table "public"."workshops" to "service_role";

grant insert on table "public"."workshops" to "service_role";

grant references on table "public"."workshops" to "service_role";

grant select on table "public"."workshops" to "service_role";

grant trigger on table "public"."workshops" to "service_role";

grant truncate on table "public"."workshops" to "service_role";

grant update on table "public"."workshops" to "service_role";

create policy "System can insert achievements"
on "public"."achievements"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can view own achievements"
on "public"."achievements"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can delete own application documents"
on "public"."application_documents"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can insert own application documents"
on "public"."application_documents"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can update own application documents"
on "public"."application_documents"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view own application documents"
on "public"."application_documents"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Published pathways viewable by everyone"
on "public"."career_pathways"
as permissive
for select
to public
using ((is_published = true));


create policy "Companies viewable by everyone"
on "public"."companies"
as permissive
for select
to public
using (true);


create policy "Users can delete own files"
on "public"."file_uploads"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can update own files"
on "public"."file_uploads"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can upload own files"
on "public"."file_uploads"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can view own files"
on "public"."file_uploads"
as permissive
for select
to public
using (((auth.uid() = user_id) OR (is_public = true)));


create policy "Users can delete own applications"
on "public"."job_applications"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can insert own applications"
on "public"."job_applications"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can update own applications"
on "public"."job_applications"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view own applications"
on "public"."job_applications"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can update own analytics"
on "public"."learning_analytics"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view own analytics"
on "public"."learning_analytics"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Mentors viewable by everyone"
on "public"."mentors"
as permissive
for select
to public
using (true);


create policy "Users can insert their own profile"
on "public"."profiles"
as permissive
for insert
to public
with check ((auth.uid() = id));


create policy "Published guides viewable by everyone"
on "public"."quick_guides"
as permissive
for select
to public
using ((is_published = true));


create policy "Users can insert own readiness scores"
on "public"."readiness_scores"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can update own readiness scores"
on "public"."readiness_scores"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view own readiness scores"
on "public"."readiness_scores"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Resource categories viewable by everyone"
on "public"."resource_categories"
as permissive
for select
to public
using (true);


create policy "Users can create own ratings"
on "public"."resource_ratings"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can delete own ratings"
on "public"."resource_ratings"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can update own ratings"
on "public"."resource_ratings"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view all ratings"
on "public"."resource_ratings"
as permissive
for select
to public
using (true);


create policy "Published resources viewable by everyone"
on "public"."resources"
as permissive
for select
to public
using ((is_published = true));


create policy "Users can create own assessments"
on "public"."skills_assessments"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can delete own assessments"
on "public"."skills_assessments"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can update own assessments"
on "public"."skills_assessments"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view own assessments"
on "public"."skills_assessments"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Skills taxonomy viewable by everyone"
on "public"."skills_taxonomy"
as permissive
for select
to public
using (true);


create policy "Published stories viewable by everyone"
on "public"."success_stories"
as permissive
for select
to public
using ((is_published = true));


create policy "Users can create own stories"
on "public"."success_stories"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can update own stories"
on "public"."success_stories"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view own stories"
on "public"."success_stories"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can create own bookmarks"
on "public"."user_bookmarks"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can delete own bookmarks"
on "public"."user_bookmarks"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can update own bookmarks"
on "public"."user_bookmarks"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view own bookmarks"
on "public"."user_bookmarks"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can delete own documents"
on "public"."user_documents"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can insert own documents"
on "public"."user_documents"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can update own documents"
on "public"."user_documents"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view own documents"
on "public"."user_documents"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can insert own progress"
on "public"."user_progress"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can update own progress"
on "public"."user_progress"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view own progress"
on "public"."user_progress"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can insert own sessions"
on "public"."user_sessions"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can update own sessions"
on "public"."user_sessions"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view own sessions"
on "public"."user_sessions"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can delete own skills"
on "public"."user_skills_confidence"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can insert own skills"
on "public"."user_skills_confidence"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can update own skills"
on "public"."user_skills_confidence"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view own skills"
on "public"."user_skills_confidence"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Activities viewable if workshop is published"
on "public"."workshop_activities"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM workshops
  WHERE ((workshops.id = workshop_activities.workshop_id) AND (workshops.is_published = true)))));


create policy "Modules viewable if workshop is published"
on "public"."workshop_modules"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM workshops
  WHERE ((workshops.id = workshop_modules.workshop_id) AND (workshops.is_published = true)))));


create policy "Workshop resources viewable if workshop is published"
on "public"."workshop_resources"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM workshops
  WHERE ((workshops.id = workshop_resources.workshop_id) AND (workshops.is_published = true)))));


create policy "Published workshops viewable by everyone"
on "public"."workshops"
as permissive
for select
to public
using ((is_published = true));


CREATE TRIGGER on_user_progress_update AFTER INSERT OR UPDATE ON public.user_progress FOR EACH ROW EXECUTE FUNCTION update_user_activity();

CREATE TRIGGER on_user_session_update AFTER INSERT OR UPDATE ON public.user_sessions FOR EACH ROW EXECUTE FUNCTION update_user_activity();


create type "storage"."buckettype" as enum ('STANDARD', 'ANALYTICS');

drop policy "Admins can upload dispute evidence" on "storage"."objects";

drop policy "Admins can view all dispute evidence" on "storage"."objects";

drop policy "Anyone can view media files" on "storage"."objects";

drop policy "Authenticated users can upload media" on "storage"."objects";

drop policy "Users can manage their own media" on "storage"."objects";

drop policy "Users can upload dispute evidence" on "storage"."objects";

drop policy "Users can view their dispute evidence" on "storage"."objects";

alter table "storage"."buckets" drop constraint "buckets_owner_fkey";

alter table "storage"."objects" drop constraint "objects_owner_fkey";

drop function if exists "storage"."search"(prefix text, bucketname text, limits integer, levels integer, offsets integer);

create table "storage"."buckets_analytics" (
    "id" text not null,
    "type" storage.buckettype not null default 'ANALYTICS'::storage.buckettype,
    "format" text not null default 'ICEBERG'::text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "storage"."buckets_analytics" enable row level security;

create table "storage"."iceberg_namespaces" (
    "id" uuid not null default gen_random_uuid(),
    "bucket_id" text not null,
    "name" text not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "storage"."iceberg_namespaces" enable row level security;

create table "storage"."iceberg_tables" (
    "id" uuid not null default gen_random_uuid(),
    "namespace_id" uuid not null,
    "bucket_id" text not null,
    "name" text not null,
    "location" text not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "storage"."iceberg_tables" enable row level security;

create table "storage"."prefixes" (
    "bucket_id" text not null,
    "name" text not null,
    "level" integer not null generated always as (storage.get_level(name)) stored,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "storage"."prefixes" enable row level security;

create table "storage"."s3_multipart_uploads" (
    "id" text not null,
    "in_progress_size" bigint not null default 0,
    "upload_signature" text not null,
    "bucket_id" text not null,
    "key" text not null,
    "version" text not null,
    "owner_id" text,
    "created_at" timestamp with time zone not null default now(),
    "user_metadata" jsonb
);


alter table "storage"."s3_multipart_uploads" enable row level security;

create table "storage"."s3_multipart_uploads_parts" (
    "id" uuid not null default gen_random_uuid(),
    "upload_id" text not null,
    "size" bigint not null default 0,
    "part_number" integer not null,
    "bucket_id" text not null,
    "key" text not null,
    "etag" text not null,
    "owner_id" text,
    "version" text not null,
    "created_at" timestamp with time zone not null default now()
);


alter table "storage"."s3_multipart_uploads_parts" enable row level security;

alter table "storage"."buckets" add column "allowed_mime_types" text[];

alter table "storage"."buckets" add column "avif_autodetection" boolean default false;

alter table "storage"."buckets" add column "file_size_limit" bigint;

alter table "storage"."buckets" add column "owner_id" text;

alter table "storage"."buckets" add column "public" boolean default false;

alter table "storage"."buckets" add column "type" storage.buckettype not null default 'STANDARD'::storage.buckettype;

alter table "storage"."buckets" enable row level security;

alter table "storage"."migrations" enable row level security;

alter table "storage"."objects" add column "level" integer;

alter table "storage"."objects" add column "owner_id" text;

alter table "storage"."objects" add column "path_tokens" text[] generated always as (string_to_array(name, '/'::text)) stored;

alter table "storage"."objects" add column "user_metadata" jsonb;

alter table "storage"."objects" add column "version" text;

alter table "storage"."objects" alter column "id" set default gen_random_uuid();

CREATE UNIQUE INDEX buckets_analytics_pkey ON storage.buckets_analytics USING btree (id);

CREATE UNIQUE INDEX iceberg_namespaces_pkey ON storage.iceberg_namespaces USING btree (id);

CREATE UNIQUE INDEX iceberg_tables_pkey ON storage.iceberg_tables USING btree (id);

CREATE UNIQUE INDEX idx_iceberg_namespaces_bucket_id ON storage.iceberg_namespaces USING btree (bucket_id, name);

CREATE UNIQUE INDEX idx_iceberg_tables_namespace_id ON storage.iceberg_tables USING btree (namespace_id, name);

CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);

CREATE UNIQUE INDEX idx_name_bucket_level_unique ON storage.objects USING btree (name COLLATE "C", bucket_id, level);

CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");

CREATE INDEX idx_objects_lower_name ON storage.objects USING btree ((path_tokens[level]), lower(name) text_pattern_ops, bucket_id, level);

CREATE INDEX idx_prefixes_lower_name ON storage.prefixes USING btree (bucket_id, level, ((string_to_array(name, '/'::text))[level]), lower(name) text_pattern_ops);

CREATE UNIQUE INDEX objects_bucket_id_level_idx ON storage.objects USING btree (bucket_id, level, name COLLATE "C");

CREATE UNIQUE INDEX prefixes_pkey ON storage.prefixes USING btree (bucket_id, level, name);

CREATE UNIQUE INDEX s3_multipart_uploads_parts_pkey ON storage.s3_multipart_uploads_parts USING btree (id);

CREATE UNIQUE INDEX s3_multipart_uploads_pkey ON storage.s3_multipart_uploads USING btree (id);

alter table "storage"."buckets_analytics" add constraint "buckets_analytics_pkey" PRIMARY KEY using index "buckets_analytics_pkey";

alter table "storage"."iceberg_namespaces" add constraint "iceberg_namespaces_pkey" PRIMARY KEY using index "iceberg_namespaces_pkey";

alter table "storage"."iceberg_tables" add constraint "iceberg_tables_pkey" PRIMARY KEY using index "iceberg_tables_pkey";

alter table "storage"."prefixes" add constraint "prefixes_pkey" PRIMARY KEY using index "prefixes_pkey";

alter table "storage"."s3_multipart_uploads" add constraint "s3_multipart_uploads_pkey" PRIMARY KEY using index "s3_multipart_uploads_pkey";

alter table "storage"."s3_multipart_uploads_parts" add constraint "s3_multipart_uploads_parts_pkey" PRIMARY KEY using index "s3_multipart_uploads_parts_pkey";

alter table "storage"."iceberg_namespaces" add constraint "iceberg_namespaces_bucket_id_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets_analytics(id) ON DELETE CASCADE not valid;

alter table "storage"."iceberg_namespaces" validate constraint "iceberg_namespaces_bucket_id_fkey";

alter table "storage"."iceberg_tables" add constraint "iceberg_tables_bucket_id_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets_analytics(id) ON DELETE CASCADE not valid;

alter table "storage"."iceberg_tables" validate constraint "iceberg_tables_bucket_id_fkey";

alter table "storage"."iceberg_tables" add constraint "iceberg_tables_namespace_id_fkey" FOREIGN KEY (namespace_id) REFERENCES storage.iceberg_namespaces(id) ON DELETE CASCADE not valid;

alter table "storage"."iceberg_tables" validate constraint "iceberg_tables_namespace_id_fkey";

alter table "storage"."prefixes" add constraint "prefixes_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id) not valid;

alter table "storage"."prefixes" validate constraint "prefixes_bucketId_fkey";

alter table "storage"."s3_multipart_uploads" add constraint "s3_multipart_uploads_bucket_id_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id) not valid;

alter table "storage"."s3_multipart_uploads" validate constraint "s3_multipart_uploads_bucket_id_fkey";

alter table "storage"."s3_multipart_uploads_parts" add constraint "s3_multipart_uploads_parts_bucket_id_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id) not valid;

alter table "storage"."s3_multipart_uploads_parts" validate constraint "s3_multipart_uploads_parts_bucket_id_fkey";

alter table "storage"."s3_multipart_uploads_parts" add constraint "s3_multipart_uploads_parts_upload_id_fkey" FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE not valid;

alter table "storage"."s3_multipart_uploads_parts" validate constraint "s3_multipart_uploads_parts_upload_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION storage.add_prefixes(_bucket_id text, _name text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    prefixes text[];
BEGIN
    prefixes := "storage"."get_prefixes"("_name");

    IF array_length(prefixes, 1) > 0 THEN
        INSERT INTO storage.prefixes (name, bucket_id)
        SELECT UNNEST(prefixes) as name, "_bucket_id" ON CONFLICT DO NOTHING;
    END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$function$
;

CREATE OR REPLACE FUNCTION storage.delete_leaf_prefixes(bucket_ids text[], names text[])
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_rows_deleted integer;
BEGIN
    LOOP
        WITH candidates AS (
            SELECT DISTINCT t.bucket_id,
                unnest(storage.get_prefixes(t.name)) AS name
            FROM unnest(bucket_ids, names) AS t(bucket_id, name)
        ),
        uniq AS (
            SELECT bucket_id,
                   name,
                   storage.get_level(name) AS level
             FROM candidates
             WHERE name <> ''
             GROUP BY bucket_id, name
        ),
        leaf AS (
            SELECT p.bucket_id, p.name, p.level
            FROM storage.prefixes AS p
            JOIN uniq AS u
              ON u.bucket_id = p.bucket_id
                  AND u.name = p.name
                  AND u.level = p.level
            WHERE NOT EXISTS (
                SELECT 1
                FROM storage.objects AS o
                WHERE o.bucket_id = p.bucket_id
                  AND storage.get_level(o.name) = p.level + 1
                  AND o.name COLLATE "C" LIKE p.name || '/%'
            )
            AND NOT EXISTS (
                SELECT 1
                FROM storage.prefixes AS c
                WHERE c.bucket_id = p.bucket_id
                  AND c.level = p.level + 1
                  AND c.name COLLATE "C" LIKE p.name || '/%'
            )
        )
        DELETE FROM storage.prefixes AS p
        USING leaf AS l
        WHERE p.bucket_id = l.bucket_id
          AND p.name = l.name
          AND p.level = l.level;

        GET DIAGNOSTICS v_rows_deleted = ROW_COUNT;
        EXIT WHEN v_rows_deleted = 0;
    END LOOP;
END;
$function$
;

CREATE OR REPLACE FUNCTION storage.delete_prefix(_bucket_id text, _name text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Check if we can delete the prefix
    IF EXISTS(
        SELECT FROM "storage"."prefixes"
        WHERE "prefixes"."bucket_id" = "_bucket_id"
          AND level = "storage"."get_level"("_name") + 1
          AND "prefixes"."name" COLLATE "C" LIKE "_name" || '/%'
        LIMIT 1
    )
    OR EXISTS(
        SELECT FROM "storage"."objects"
        WHERE "objects"."bucket_id" = "_bucket_id"
          AND "storage"."get_level"("objects"."name") = "storage"."get_level"("_name") + 1
          AND "objects"."name" COLLATE "C" LIKE "_name" || '/%'
        LIMIT 1
    ) THEN
    -- There are sub-objects, skip deletion
    RETURN false;
    ELSE
        DELETE FROM "storage"."prefixes"
        WHERE "prefixes"."bucket_id" = "_bucket_id"
          AND level = "storage"."get_level"("_name")
          AND "prefixes"."name" = "_name";
        RETURN true;
    END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION storage.delete_prefix_hierarchy_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    prefix text;
BEGIN
    prefix := "storage"."get_prefix"(OLD."name");

    IF coalesce(prefix, '') != '' THEN
        PERFORM "storage"."delete_prefix"(OLD."bucket_id", prefix);
    END IF;

    RETURN OLD;
END;
$function$
;

CREATE OR REPLACE FUNCTION storage.enforce_bucket_name_length()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
    if length(new.name) > 100 then
        raise exception 'bucket name "%" is too long (% characters). Max is 100.', new.name, length(new.name);
    end if;
    return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION storage.get_level(name text)
 RETURNS integer
 LANGUAGE sql
 IMMUTABLE STRICT
AS $function$
SELECT array_length(string_to_array("name", '/'), 1);
$function$
;

CREATE OR REPLACE FUNCTION storage.get_prefix(name text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE STRICT
AS $function$
SELECT
    CASE WHEN strpos("name", '/') > 0 THEN
             regexp_replace("name", '[\/]{1}[^\/]+\/?$', '')
         ELSE
             ''
        END;
$function$
;

CREATE OR REPLACE FUNCTION storage.get_prefixes(name text)
 RETURNS text[]
 LANGUAGE plpgsql
 IMMUTABLE STRICT
AS $function$
DECLARE
    parts text[];
    prefixes text[];
    prefix text;
BEGIN
    -- Split the name into parts by '/'
    parts := string_to_array("name", '/');
    prefixes := '{}';

    -- Construct the prefixes, stopping one level below the last part
    FOR i IN 1..array_length(parts, 1) - 1 LOOP
            prefix := array_to_string(parts[1:i], '/');
            prefixes := array_append(prefixes, prefix);
    END LOOP;

    RETURN prefixes;
END;
$function$
;

CREATE OR REPLACE FUNCTION storage.get_size_by_bucket()
 RETURNS TABLE(size bigint, bucket_id text)
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
    return query
        select sum((metadata->>'size')::bigint) as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$function$
;

CREATE OR REPLACE FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, next_key_token text DEFAULT ''::text, next_upload_token text DEFAULT ''::text)
 RETURNS TABLE(key text, id text, created_at timestamp with time zone)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$function$
;

CREATE OR REPLACE FUNCTION storage.list_objects_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text)
 RETURNS TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(name COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                        substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1)))
                    ELSE
                        name
                END AS name, id, metadata, updated_at
            FROM
                storage.objects
            WHERE
                bucket_id = $5 AND
                name ILIKE $1 || ''%'' AND
                CASE
                    WHEN $6 != '''' THEN
                    name COLLATE "C" > $6
                ELSE true END
                AND CASE
                    WHEN $4 != '''' THEN
                        CASE
                            WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                                substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                name COLLATE "C" > $4
                            END
                    ELSE
                        true
                END
            ORDER BY
                name COLLATE "C" ASC) as e order by name COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_token, bucket_id, start_after;
END;
$function$
;

CREATE OR REPLACE FUNCTION storage.lock_top_prefixes(bucket_ids text[], names text[])
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_bucket text;
    v_top text;
BEGIN
    FOR v_bucket, v_top IN
        SELECT DISTINCT t.bucket_id,
            split_part(t.name, '/', 1) AS top
        FROM unnest(bucket_ids, names) AS t(bucket_id, name)
        WHERE t.name <> ''
        ORDER BY 1, 2
        LOOP
            PERFORM pg_advisory_xact_lock(hashtextextended(v_bucket || '/' || v_top, 0));
        END LOOP;
END;
$function$
;

CREATE OR REPLACE FUNCTION storage.objects_delete_cleanup()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_bucket_ids text[];
    v_names      text[];
BEGIN
    IF current_setting('storage.gc.prefixes', true) = '1' THEN
        RETURN NULL;
    END IF;

    PERFORM set_config('storage.gc.prefixes', '1', true);

    SELECT COALESCE(array_agg(d.bucket_id), '{}'),
           COALESCE(array_agg(d.name), '{}')
    INTO v_bucket_ids, v_names
    FROM deleted AS d
    WHERE d.name <> '';

    PERFORM storage.lock_top_prefixes(v_bucket_ids, v_names);
    PERFORM storage.delete_leaf_prefixes(v_bucket_ids, v_names);

    RETURN NULL;
END;
$function$
;

CREATE OR REPLACE FUNCTION storage.objects_insert_prefix_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    NEW.level := "storage"."get_level"(NEW."name");

    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION storage.objects_update_cleanup()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    -- NEW - OLD (destinations to create prefixes for)
    v_add_bucket_ids text[];
    v_add_names      text[];

    -- OLD - NEW (sources to prune)
    v_src_bucket_ids text[];
    v_src_names      text[];
BEGIN
    IF TG_OP <> 'UPDATE' THEN
        RETURN NULL;
    END IF;

    -- 1) Compute NEW−OLD (added paths) and OLD−NEW (moved-away paths)
    WITH added AS (
        SELECT n.bucket_id, n.name
        FROM new_rows n
        WHERE n.name <> '' AND position('/' in n.name) > 0
        EXCEPT
        SELECT o.bucket_id, o.name FROM old_rows o WHERE o.name <> ''
    ),
    moved AS (
         SELECT o.bucket_id, o.name
         FROM old_rows o
         WHERE o.name <> ''
         EXCEPT
         SELECT n.bucket_id, n.name FROM new_rows n WHERE n.name <> ''
    )
    SELECT
        -- arrays for ADDED (dest) in stable order
        COALESCE( (SELECT array_agg(a.bucket_id ORDER BY a.bucket_id, a.name) FROM added a), '{}' ),
        COALESCE( (SELECT array_agg(a.name      ORDER BY a.bucket_id, a.name) FROM added a), '{}' ),
        -- arrays for MOVED (src) in stable order
        COALESCE( (SELECT array_agg(m.bucket_id ORDER BY m.bucket_id, m.name) FROM moved m), '{}' ),
        COALESCE( (SELECT array_agg(m.name      ORDER BY m.bucket_id, m.name) FROM moved m), '{}' )
    INTO v_add_bucket_ids, v_add_names, v_src_bucket_ids, v_src_names;

    -- Nothing to do?
    IF (array_length(v_add_bucket_ids, 1) IS NULL) AND (array_length(v_src_bucket_ids, 1) IS NULL) THEN
        RETURN NULL;
    END IF;

    -- 2) Take per-(bucket, top) locks: ALL prefixes in consistent global order to prevent deadlocks
    DECLARE
        v_all_bucket_ids text[];
        v_all_names text[];
    BEGIN
        -- Combine source and destination arrays for consistent lock ordering
        v_all_bucket_ids := COALESCE(v_src_bucket_ids, '{}') || COALESCE(v_add_bucket_ids, '{}');
        v_all_names := COALESCE(v_src_names, '{}') || COALESCE(v_add_names, '{}');

        -- Single lock call ensures consistent global ordering across all transactions
        IF array_length(v_all_bucket_ids, 1) IS NOT NULL THEN
            PERFORM storage.lock_top_prefixes(v_all_bucket_ids, v_all_names);
        END IF;
    END;

    -- 3) Create destination prefixes (NEW−OLD) BEFORE pruning sources
    IF array_length(v_add_bucket_ids, 1) IS NOT NULL THEN
        WITH candidates AS (
            SELECT DISTINCT t.bucket_id, unnest(storage.get_prefixes(t.name)) AS name
            FROM unnest(v_add_bucket_ids, v_add_names) AS t(bucket_id, name)
            WHERE name <> ''
        )
        INSERT INTO storage.prefixes (bucket_id, name)
        SELECT c.bucket_id, c.name
        FROM candidates c
        ON CONFLICT DO NOTHING;
    END IF;

    -- 4) Prune source prefixes bottom-up for OLD−NEW
    IF array_length(v_src_bucket_ids, 1) IS NOT NULL THEN
        -- re-entrancy guard so DELETE on prefixes won't recurse
        IF current_setting('storage.gc.prefixes', true) <> '1' THEN
            PERFORM set_config('storage.gc.prefixes', '1', true);
        END IF;

        PERFORM storage.delete_leaf_prefixes(v_src_bucket_ids, v_src_names);
    END IF;

    RETURN NULL;
END;
$function$
;

CREATE OR REPLACE FUNCTION storage.objects_update_prefix_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    old_prefixes TEXT[];
BEGIN
    -- Ensure this is an update operation and the name has changed
    IF TG_OP = 'UPDATE' AND (NEW."name" <> OLD."name" OR NEW."bucket_id" <> OLD."bucket_id") THEN
        -- Retrieve old prefixes
        old_prefixes := "storage"."get_prefixes"(OLD."name");

        -- Remove old prefixes that are only used by this object
        WITH all_prefixes as (
            SELECT unnest(old_prefixes) as prefix
        ),
        can_delete_prefixes as (
             SELECT prefix
             FROM all_prefixes
             WHERE NOT EXISTS (
                 SELECT 1 FROM "storage"."objects"
                 WHERE "bucket_id" = OLD."bucket_id"
                   AND "name" <> OLD."name"
                   AND "name" LIKE (prefix || '%')
             )
         )
        DELETE FROM "storage"."prefixes" WHERE name IN (SELECT prefix FROM can_delete_prefixes);

        -- Add new prefixes
        PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    END IF;
    -- Set the new level
    NEW."level" := "storage"."get_level"(NEW."name");

    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION storage.operation()
 RETURNS text
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$function$
;

CREATE OR REPLACE FUNCTION storage.prefixes_delete_cleanup()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_bucket_ids text[];
    v_names      text[];
BEGIN
    IF current_setting('storage.gc.prefixes', true) = '1' THEN
        RETURN NULL;
    END IF;

    PERFORM set_config('storage.gc.prefixes', '1', true);

    SELECT COALESCE(array_agg(d.bucket_id), '{}'),
           COALESCE(array_agg(d.name), '{}')
    INTO v_bucket_ids, v_names
    FROM deleted AS d
    WHERE d.name <> '';

    PERFORM storage.lock_top_prefixes(v_bucket_ids, v_names);
    PERFORM storage.delete_leaf_prefixes(v_bucket_ids, v_names);

    RETURN NULL;
END;
$function$
;

CREATE OR REPLACE FUNCTION storage.prefixes_insert_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text)
 RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
 LANGUAGE plpgsql
AS $function$
declare
    can_bypass_rls BOOLEAN;
begin
    SELECT rolbypassrls
    INTO can_bypass_rls
    FROM pg_roles
    WHERE rolname = coalesce(nullif(current_setting('role', true), 'none'), current_user);

    IF can_bypass_rls THEN
        RETURN QUERY SELECT * FROM storage.search_v1_optimised(prefix, bucketname, limits, levels, offsets, search, sortcolumn, sortorder);
    ELSE
        RETURN QUERY SELECT * FROM storage.search_legacy_v1(prefix, bucketname, limits, levels, offsets, search, sortcolumn, sortorder);
    END IF;
end;
$function$
;

CREATE OR REPLACE FUNCTION storage.search_legacy_v1(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text)
 RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
 LANGUAGE plpgsql
 STABLE
AS $function$
declare
    v_order_by text;
    v_sort_order text;
begin
    case
        when sortcolumn = 'name' then
            v_order_by = 'name';
        when sortcolumn = 'updated_at' then
            v_order_by = 'updated_at';
        when sortcolumn = 'created_at' then
            v_order_by = 'created_at';
        when sortcolumn = 'last_accessed_at' then
            v_order_by = 'last_accessed_at';
        else
            v_order_by = 'name';
        end case;

    case
        when sortorder = 'asc' then
            v_sort_order = 'asc';
        when sortorder = 'desc' then
            v_sort_order = 'desc';
        else
            v_sort_order = 'asc';
        end case;

    v_order_by = v_order_by || ' ' || v_sort_order;

    return query execute
        'with folders as (
           select path_tokens[$1] as folder
           from storage.objects
             where objects.name ilike $2 || $3 || ''%''
               and bucket_id = $4
               and array_length(objects.path_tokens, 1) <> $1
           group by folder
           order by folder ' || v_sort_order || '
     )
     (select folder as "name",
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[$1] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where objects.name ilike $2 || $3 || ''%''
       and bucket_id = $4
       and array_length(objects.path_tokens, 1) = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$function$
;

CREATE OR REPLACE FUNCTION storage.search_v1_optimised(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text)
 RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
 LANGUAGE plpgsql
 STABLE
AS $function$
declare
    v_order_by text;
    v_sort_order text;
begin
    case
        when sortcolumn = 'name' then
            v_order_by = 'name';
        when sortcolumn = 'updated_at' then
            v_order_by = 'updated_at';
        when sortcolumn = 'created_at' then
            v_order_by = 'created_at';
        when sortcolumn = 'last_accessed_at' then
            v_order_by = 'last_accessed_at';
        else
            v_order_by = 'name';
        end case;

    case
        when sortorder = 'asc' then
            v_sort_order = 'asc';
        when sortorder = 'desc' then
            v_sort_order = 'desc';
        else
            v_sort_order = 'asc';
        end case;

    v_order_by = v_order_by || ' ' || v_sort_order;

    return query execute
        'with folders as (
           select (string_to_array(name, ''/''))[level] as name
           from storage.prefixes
             where lower(prefixes.name) like lower($2 || $3) || ''%''
               and bucket_id = $4
               and level = $1
           order by name ' || v_sort_order || '
     )
     (select name,
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[level] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where lower(objects.name) like lower($2 || $3) || ''%''
       and bucket_id = $4
       and level = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$function$
;

CREATE OR REPLACE FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer DEFAULT 100, levels integer DEFAULT 1, start_after text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text, sort_column text DEFAULT 'name'::text, sort_column_after text DEFAULT ''::text)
 RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
 LANGUAGE plpgsql
 STABLE
AS $function$
DECLARE
    sort_col text;
    sort_ord text;
    cursor_op text;
    cursor_expr text;
    sort_expr text;
BEGIN
    -- Validate sort_order
    sort_ord := lower(sort_order);
    IF sort_ord NOT IN ('asc', 'desc') THEN
        sort_ord := 'asc';
    END IF;

    -- Determine cursor comparison operator
    IF sort_ord = 'asc' THEN
        cursor_op := '>';
    ELSE
        cursor_op := '<';
    END IF;
    
    sort_col := lower(sort_column);
    -- Validate sort column  
    IF sort_col IN ('updated_at', 'created_at') THEN
        cursor_expr := format(
            '($5 = '''' OR ROW(date_trunc(''milliseconds'', %I), name COLLATE "C") %s ROW(COALESCE(NULLIF($6, '''')::timestamptz, ''epoch''::timestamptz), $5))',
            sort_col, cursor_op
        );
        sort_expr := format(
            'COALESCE(date_trunc(''milliseconds'', %I), ''epoch''::timestamptz) %s, name COLLATE "C" %s',
            sort_col, sort_ord, sort_ord
        );
    ELSE
        cursor_expr := format('($5 = '''' OR name COLLATE "C" %s $5)', cursor_op);
        sort_expr := format('name COLLATE "C" %s', sort_ord);
    END IF;

    RETURN QUERY EXECUTE format(
        $sql$
        SELECT * FROM (
            (
                SELECT
                    split_part(name, '/', $4) AS key,
                    name,
                    NULL::uuid AS id,
                    updated_at,
                    created_at,
                    NULL::timestamptz AS last_accessed_at,
                    NULL::jsonb AS metadata
                FROM storage.prefixes
                WHERE name COLLATE "C" LIKE $1 || '%%'
                    AND bucket_id = $2
                    AND level = $4
                    AND %s
                ORDER BY %s
                LIMIT $3
            )
            UNION ALL
            (
                SELECT
                    split_part(name, '/', $4) AS key,
                    name,
                    id,
                    updated_at,
                    created_at,
                    last_accessed_at,
                    metadata
                FROM storage.objects
                WHERE name COLLATE "C" LIKE $1 || '%%'
                    AND bucket_id = $2
                    AND level = $4
                    AND %s
                ORDER BY %s
                LIMIT $3
            )
        ) obj
        ORDER BY %s
        LIMIT $3
        $sql$,
        cursor_expr,    -- prefixes WHERE
        sort_expr,      -- prefixes ORDER BY
        cursor_expr,    -- objects WHERE
        sort_expr,      -- objects ORDER BY
        sort_expr       -- final ORDER BY
    )
    USING prefix, bucket_name, limits, levels, start_after, sort_column_after;
END;
$function$
;

CREATE OR REPLACE FUNCTION storage.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$function$
;

CREATE OR REPLACE FUNCTION storage.extension(name text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
DECLARE
    _parts text[];
    _filename text;
BEGIN
    SELECT string_to_array(name, '/') INTO _parts;
    SELECT _parts[array_length(_parts,1)] INTO _filename;
    RETURN reverse(split_part(reverse(_filename), '.', 1));
END
$function$
;

CREATE OR REPLACE FUNCTION storage.foldername(name text)
 RETURNS text[]
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
DECLARE
    _parts text[];
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Return everything except the last segment
    RETURN _parts[1 : array_length(_parts,1) - 1];
END
$function$
;

grant delete on table "storage"."buckets_analytics" to "anon";

grant insert on table "storage"."buckets_analytics" to "anon";

grant references on table "storage"."buckets_analytics" to "anon";

grant select on table "storage"."buckets_analytics" to "anon";

grant trigger on table "storage"."buckets_analytics" to "anon";

grant truncate on table "storage"."buckets_analytics" to "anon";

grant update on table "storage"."buckets_analytics" to "anon";

grant delete on table "storage"."buckets_analytics" to "authenticated";

grant insert on table "storage"."buckets_analytics" to "authenticated";

grant references on table "storage"."buckets_analytics" to "authenticated";

grant select on table "storage"."buckets_analytics" to "authenticated";

grant trigger on table "storage"."buckets_analytics" to "authenticated";

grant truncate on table "storage"."buckets_analytics" to "authenticated";

grant update on table "storage"."buckets_analytics" to "authenticated";

grant delete on table "storage"."buckets_analytics" to "service_role";

grant insert on table "storage"."buckets_analytics" to "service_role";

grant references on table "storage"."buckets_analytics" to "service_role";

grant select on table "storage"."buckets_analytics" to "service_role";

grant trigger on table "storage"."buckets_analytics" to "service_role";

grant truncate on table "storage"."buckets_analytics" to "service_role";

grant update on table "storage"."buckets_analytics" to "service_role";

grant select on table "storage"."iceberg_namespaces" to "anon";

grant select on table "storage"."iceberg_namespaces" to "authenticated";

grant delete on table "storage"."iceberg_namespaces" to "service_role";

grant insert on table "storage"."iceberg_namespaces" to "service_role";

grant references on table "storage"."iceberg_namespaces" to "service_role";

grant select on table "storage"."iceberg_namespaces" to "service_role";

grant trigger on table "storage"."iceberg_namespaces" to "service_role";

grant truncate on table "storage"."iceberg_namespaces" to "service_role";

grant update on table "storage"."iceberg_namespaces" to "service_role";

grant select on table "storage"."iceberg_tables" to "anon";

grant select on table "storage"."iceberg_tables" to "authenticated";

grant delete on table "storage"."iceberg_tables" to "service_role";

grant insert on table "storage"."iceberg_tables" to "service_role";

grant references on table "storage"."iceberg_tables" to "service_role";

grant select on table "storage"."iceberg_tables" to "service_role";

grant trigger on table "storage"."iceberg_tables" to "service_role";

grant truncate on table "storage"."iceberg_tables" to "service_role";

grant update on table "storage"."iceberg_tables" to "service_role";

grant delete on table "storage"."prefixes" to "anon";

grant insert on table "storage"."prefixes" to "anon";

grant references on table "storage"."prefixes" to "anon";

grant select on table "storage"."prefixes" to "anon";

grant trigger on table "storage"."prefixes" to "anon";

grant truncate on table "storage"."prefixes" to "anon";

grant update on table "storage"."prefixes" to "anon";

grant delete on table "storage"."prefixes" to "authenticated";

grant insert on table "storage"."prefixes" to "authenticated";

grant references on table "storage"."prefixes" to "authenticated";

grant select on table "storage"."prefixes" to "authenticated";

grant trigger on table "storage"."prefixes" to "authenticated";

grant truncate on table "storage"."prefixes" to "authenticated";

grant update on table "storage"."prefixes" to "authenticated";

grant delete on table "storage"."prefixes" to "service_role";

grant insert on table "storage"."prefixes" to "service_role";

grant references on table "storage"."prefixes" to "service_role";

grant select on table "storage"."prefixes" to "service_role";

grant trigger on table "storage"."prefixes" to "service_role";

grant truncate on table "storage"."prefixes" to "service_role";

grant update on table "storage"."prefixes" to "service_role";

grant select on table "storage"."s3_multipart_uploads" to "anon";

grant select on table "storage"."s3_multipart_uploads" to "authenticated";

grant delete on table "storage"."s3_multipart_uploads" to "service_role";

grant insert on table "storage"."s3_multipart_uploads" to "service_role";

grant references on table "storage"."s3_multipart_uploads" to "service_role";

grant select on table "storage"."s3_multipart_uploads" to "service_role";

grant trigger on table "storage"."s3_multipart_uploads" to "service_role";

grant truncate on table "storage"."s3_multipart_uploads" to "service_role";

grant update on table "storage"."s3_multipart_uploads" to "service_role";

grant select on table "storage"."s3_multipart_uploads_parts" to "anon";

grant select on table "storage"."s3_multipart_uploads_parts" to "authenticated";

grant delete on table "storage"."s3_multipart_uploads_parts" to "service_role";

grant insert on table "storage"."s3_multipart_uploads_parts" to "service_role";

grant references on table "storage"."s3_multipart_uploads_parts" to "service_role";

grant select on table "storage"."s3_multipart_uploads_parts" to "service_role";

grant trigger on table "storage"."s3_multipart_uploads_parts" to "service_role";

grant truncate on table "storage"."s3_multipart_uploads_parts" to "service_role";

grant update on table "storage"."s3_multipart_uploads_parts" to "service_role";

CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length();

CREATE TRIGGER objects_delete_cleanup AFTER DELETE ON storage.objects REFERENCING OLD TABLE AS deleted FOR EACH STATEMENT EXECUTE FUNCTION storage.objects_delete_cleanup();

CREATE TRIGGER objects_insert_create_prefix BEFORE INSERT ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.objects_insert_prefix_trigger();

CREATE TRIGGER objects_update_cleanup AFTER UPDATE ON storage.objects REFERENCING OLD TABLE AS old_rows NEW TABLE AS new_rows FOR EACH STATEMENT EXECUTE FUNCTION storage.objects_update_cleanup();

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();

CREATE TRIGGER prefixes_create_hierarchy BEFORE INSERT ON storage.prefixes FOR EACH ROW WHEN ((pg_trigger_depth() < 1)) EXECUTE FUNCTION storage.prefixes_insert_trigger();

CREATE TRIGGER prefixes_delete_cleanup AFTER DELETE ON storage.prefixes REFERENCING OLD TABLE AS deleted FOR EACH STATEMENT EXECUTE FUNCTION storage.prefixes_delete_cleanup();



Found drop statements in schema diff. Please double check if these are expected:
drop trigger if exists "update_adventure_availability_updated_at" on "public"."adventure_availability"                                                                                        
drop trigger if exists "update_adventures_updated_at" on "public"."adventures"                                                                                                                
drop trigger if exists "update_booking_cancellations_updated_at" on "public"."booking_cancellations"                                                                                          
drop trigger if exists "update_booking_disputes_updated_at" on "public"."booking_disputes"                                                                                                    
drop trigger if exists "modification_status_change_notification" on "public"."booking_modifications"                                                                                          
drop trigger if exists "update_booking_modifications_updated_at" on "public"."booking_modifications"                                                                                          
drop trigger if exists "update_booking_payments_updated_at" on "public"."booking_payments"                                                                                                    
drop trigger if exists "update_booking_service_disputes_updated_at" on "public"."booking_service_disputes"                                                                                    
drop trigger if exists "update_bookings_updated_at" on "public"."bookings"                                                                                                                    
drop trigger if exists "trigger_update_connection_strength" on "public"."community_connections"                                                                                               
drop trigger if exists "update_community_connections_updated_at" on "public"."community_connections"                                                                                          
drop trigger if exists "update_community_posts_updated_at" on "public"."community_posts"                                                                                                      
drop trigger if exists "update_compatibility_algorithms_updated_at" on "public"."compatibility_algorithms"                                                                                    
drop trigger if exists "trigger_update_compliance_logs_updated_at" on "public"."compliance_logs"                                                                                              
drop trigger if exists "trigger_filter_rules_updated_at" on "public"."content_filter_rules"                                                                                                   
drop trigger if exists "trigger_content_reports_updated_at" on "public"."content_reports"                                                                                                     
drop trigger if exists "update_content_scores_updated_at" on "public"."content_scores"                                                                                                        
drop trigger if exists "trigger_cors_violations_updated_at" on "public"."cors_violations"                                                                                                     
drop trigger if exists "update_engagement_scores_updated_at" on "public"."engagement_scores"                                                                                                  
drop trigger if exists "trigger_update_group_member_count" on "public"."group_members"                                                                                                        
drop trigger if exists "update_groups_updated_at" on "public"."groups"                                                                                                                        
drop trigger if exists "update_individual_payments_modtime" on "public"."individual_payments"                                                                                                 
drop trigger if exists "update_split_payment_status_trigger" on "public"."individual_payments"                                                                                                
drop trigger if exists "set_invoice_number_trigger" on "public"."invoices"                                                                                                                    
drop trigger if exists "update_invoices_updated_at" on "public"."invoices"                                                                                                                    
drop trigger if exists "update_media_files_updated_at" on "public"."media_files"                                                                                                              
drop trigger if exists "trigger_moderation_queue_updated_at" on "public"."moderation_queue"                                                                                                   
drop trigger if exists "update_notification_templates_updated_at" on "public"."notification_templates"                                                                                        
drop trigger if exists "update_notifications_updated_at" on "public"."notifications"                                                                                                          
drop trigger if exists "update_payment_discrepancies_updated_at" on "public"."payment_discrepancies"                                                                                          
drop trigger if exists "update_payment_disputes_updated_at" on "public"."payment_disputes"                                                                                                    
drop trigger if exists "update_payment_reconciliations_updated_at" on "public"."payment_reconciliations"                                                                                      
drop trigger if exists "update_payment_refunds_modtime" on "public"."payment_refunds"                                                                                                         
drop trigger if exists "update_payment_refunds_updated_at" on "public"."payment_refunds"                                                                                                      
drop trigger if exists "update_payment_reminders_modtime" on "public"."payment_reminders"                                                                                                     
drop trigger if exists "update_payment_splits_updated_at" on "public"."payment_splits"                                                                                                        
drop trigger if exists "update_payment_tokens_modtime" on "public"."payment_tokens"                                                                                                           
drop trigger if exists "update_payout_failures_updated_at" on "public"."payout_failures"                                                                                                      
drop trigger if exists "update_payout_holds_updated_at" on "public"."payout_holds"                                                                                                            
drop trigger if exists "update_payout_holds_system_updated_at" on "public"."payout_holds_system"                                                                                              
drop trigger if exists "update_payout_schedule_jobs_updated_at" on "public"."payout_schedule_jobs"                                                                                            
drop trigger if exists "update_personality_assessments_updated_at" on "public"."personality_assessments"                                                                                      
drop trigger if exists "trigger_update_connection_strength" on "public"."post_comments"                                                                                                       
drop trigger if exists "update_comment_counts" on "public"."post_comments"                                                                                                                    
drop trigger if exists "update_post_comments_updated_at" on "public"."post_comments"                                                                                                          
drop trigger if exists "update_reaction_counts" on "public"."post_reactions"                                                                                                                  
drop trigger if exists "update_share_counts" on "public"."post_shares"                                                                                                                        
drop trigger if exists "handle_birth_date_encryption_trigger" on "public"."profiles"                                                                                                          
drop trigger if exists "update_profiles_updated_at" on "public"."profiles"                                                                                                                    
drop trigger if exists "validate_age_before_profile_update" on "public"."profiles"                                                                                                            
drop trigger if exists "update_reconciliation_schedules_updated_at" on "public"."reconciliation_schedules"                                                                                    
drop trigger if exists "update_refund_requests_updated_at" on "public"."refund_requests"                                                                                                      
drop trigger if exists "update_retraining_triggers_updated_at" on "public"."retraining_triggers"                                                                                              
drop trigger if exists "trigger_update_vendor_rating" on "public"."reviews"                                                                                                                   
drop trigger if exists "update_reviews_updated_at" on "public"."reviews"                                                                                                                      
drop trigger if exists "update_split_payment_settings_modtime" on "public"."split_payment_settings"                                                                                           
drop trigger if exists "update_split_payments_modtime" on "public"."split_payments"                                                                                                           
drop trigger if exists "auto_categorize_webhook_error_trigger" on "public"."stripe_webhook_events"                                                                                            
drop trigger if exists "update_system_settings_updated_at" on "public"."system_settings"                                                                                                      
drop trigger if exists "update_training_datasets_updated_at" on "public"."training_datasets"                                                                                                  
drop trigger if exists "update_trip_requests_updated_at" on "public"."trip_requests"                                                                                                          
drop trigger if exists "update_user_feed_preferences_updated_at" on "public"."user_feed_preferences"                                                                                          
drop trigger if exists "update_user_preferences_updated_at" on "public"."user_preferences"                                                                                                    
drop trigger if exists "trigger_update_warning_count" on "public"."user_warnings"                                                                                                             
drop trigger if exists "update_vendor_bids_updated_at" on "public"."vendor_bids"                                                                                                              
drop trigger if exists "update_thread_reply_stats_trigger" on "public"."vendor_forum_replies"                                                                                                 
drop trigger if exists "update_vendor_forum_replies_updated_at" on "public"."vendor_forum_replies"                                                                                            
drop trigger if exists "update_vendor_forum_reputation_updated_at" on "public"."vendor_forum_reputation"                                                                                      
drop trigger if exists "update_vendor_forum_threads_updated_at" on "public"."vendor_forum_threads"                                                                                            
drop trigger if exists "update_vote_counts_trigger" on "public"."vendor_forum_votes"                                                                                                          
drop trigger if exists "update_vendor_forums_updated_at" on "public"."vendor_forums"                                                                                                          
drop trigger if exists "update_vendor_payouts_updated_at" on "public"."vendor_payouts"                                                                                                        
drop trigger if exists "update_vendor_stripe_accounts_updated_at" on "public"."vendor_stripe_accounts"                                                                                        
drop trigger if exists "update_vendors_updated_at" on "public"."vendors"                                                                                                                      
drop trigger if exists "update_whatsapp_groups_updated_at" on "public"."whatsapp_groups"                                                                                                      
drop policy "Users can view their A/B test assignments" on "public"."ab_test_assignments"                                                                                                     
drop policy "System users can manage A/B tests" on "public"."ab_test_experiments"                                                                                                             
drop policy "Availability is viewable by everyone" on "public"."adventure_availability"                                                                                                       
drop policy "Vendors can manage own adventure availability" on "public"."adventure_availability"                                                                                              
drop policy "Media is viewable by everyone" on "public"."adventure_media"                                                                                                                     
drop policy "Vendors can manage own adventure media" on "public"."adventure_media"                                                                                                            
drop policy "Active adventures are viewable by everyone" on "public"."adventures"                                                                                                             
drop policy "Vendors can manage own adventures" on "public"."adventures"                                                                                                                      
drop policy "Only admins can view age verification logs" on "public"."age_verification_logs"                                                                                                  
drop policy "Users can manage own responses" on "public"."assessment_responses"                                                                                                               
drop policy "Users can view own responses" on "public"."assessment_responses"                                                                                                                 
drop policy "Admins can view all audit logs" on "public"."booking_audit_logs"                                                                                                                 
drop policy "System can create audit logs" on "public"."booking_audit_logs"                                                                                                                   
drop policy "Users can view booking audit logs" on "public"."booking_audit_logs"                                                                                                              
drop policy "Vendors can view audit logs" on "public"."booking_audit_logs"                                                                                                                    
drop policy "Admins can manage cancellations" on "public"."booking_cancellations"                                                                                                             
drop policy "Vendors can view cancellations" on "public"."booking_cancellations"                                                                                                              
drop policy "booking_cancellations_insert_simple" on "public"."booking_cancellations"                                                                                                         
drop policy "booking_cancellations_simple" on "public"."booking_cancellations"                                                                                                                
drop policy "booking_cancellations_update_simple" on "public"."booking_cancellations"                                                                                                         
drop policy "Users can view disputes for their bookings" on "public"."booking_disputes"                                                                                                       
drop policy "Admins can view all modifications" on "public"."booking_modifications"                                                                                                           
drop policy "Modifications viewable by booking parties" on "public"."booking_modifications"                                                                                                   
drop policy "booking_modifications_insert_simple" on "public"."booking_modifications"                                                                                                         
drop policy "booking_modifications_simple" on "public"."booking_modifications"                                                                                                                
drop policy "booking_modifications_update_simple" on "public"."booking_modifications"                                                                                                         
drop policy "Participants viewable by booking owner and vendor" on "public"."booking_participants"                                                                                            
drop policy "Users can manage participants for own bookings" on "public"."booking_participants"                                                                                               
drop policy "Users can create payments for own bookings" on "public"."booking_payments"                                                                                                       
drop policy "Users can view own payments" on "public"."booking_payments"                                                                                                                      
drop policy "Admins can manage disputes" on "public"."booking_service_disputes"                                                                                                               
drop policy "Vendors can view disputes" on "public"."booking_service_disputes"                                                                                                                
drop policy "booking_service_disputes_insert_simple" on "public"."booking_service_disputes"                                                                                                   
drop policy "booking_service_disputes_simple" on "public"."booking_service_disputes"                                                                                                          
drop policy "booking_service_disputes_update_simple" on "public"."booking_service_disputes"                                                                                                   
drop policy "Users can create bookings" on "public"."bookings"                                                                                                                                
drop policy "Users can update own pending bookings" on "public"."bookings"                                                                                                                    
drop policy "Users can view own bookings" on "public"."bookings"                                                                                                                              
drop policy "Public posts are viewable by everyone" on "public"."community_posts"                                                                                                             
drop policy "Users can create own posts" on "public"."community_posts"                                                                                                                        
drop policy "Users can delete own posts" on "public"."community_posts"                                                                                                                        
drop policy "Users can update own posts" on "public"."community_posts"                                                                                                                        
drop policy "Admin access only for compliance logs" on "public"."compliance_logs"                                                                                                             
drop policy "Users can create discovery logs" on "public"."content_discovery_log"                                                                                                             
drop policy "Users can view own discovery history" on "public"."content_discovery_log"                                                                                                        
drop policy "Admins can update reports" on "public"."content_reports"                                                                                                                         
drop policy "Admins can view all reports" on "public"."content_reports"                                                                                                                       
drop policy "Users can create reports" on "public"."content_reports"                                                                                                                          
drop policy "Users can view their own reports" on "public"."content_reports"                                                                                                                  
drop policy "Content scores are publicly readable" on "public"."content_scores"                                                                                                               
drop policy "Admin users can read CORS violations" on "public"."cors_violations"                                                                                                              
drop policy "Service role can manage CORS violations" on "public"."cors_violations"                                                                                                           
drop policy "Admins can view all credential logs" on "public"."credential_access_logs"                                                                                                        
drop policy "Service can insert credential logs" on "public"."credential_access_logs"                                                                                                         
drop policy "Users can view own credential logs" on "public"."credential_access_logs"                                                                                                         
drop policy "Admins can view all credential errors" on "public"."credential_errors"                                                                                                           
drop policy "Service can insert credential errors" on "public"."credential_errors"                                                                                                            
drop policy "Users can view own credential errors" on "public"."credential_errors"                                                                                                            
drop policy "Authenticated users can view exchange rates" on "public"."currency_exchange_rates"                                                                                               
drop policy "Admins can manage dispute threads" on "public"."dispute_threads"                                                                                                                 
drop policy "Users can create dispute messages" on "public"."dispute_threads"                                                                                                                 
drop policy "Users can view dispute threads" on "public"."dispute_threads"                                                                                                                    
drop policy "Users can manage own FCM tokens" on "public"."fcm_tokens"                                                                                                                        
drop policy "Scores viewable by group members" on "public"."group_compatibility_scores"                                                                                                       
drop policy "Invitations viewable by relevant parties" on "public"."group_invitations"                                                                                                        
drop policy "group_members_own_delete" on "public"."group_members"                                                                                                                            
drop policy "group_members_own_insert" on "public"."group_members"                                                                                                                            
drop policy "group_members_own_read" on "public"."group_members"                                                                                                                              
drop policy "group_members_own_update" on "public"."group_members"                                                                                                                            
drop policy "Group owners can update their groups" on "public"."groups"                                                                                                                       
drop policy "Users can create groups" on "public"."groups"                                                                                                                                    
drop policy "groups_owner_all" on "public"."groups"                                                                                                                                           
drop policy "groups_public_read" on "public"."groups"                                                                                                                                         
drop policy "individual_payments_simple" on "public"."individual_payments"                                                                                                                    
drop policy "Users can manage own invoice line items" on "public"."invoice_line_items"                                                                                                        
drop policy "Users can view own invoice line items" on "public"."invoice_line_items"                                                                                                          
drop policy "Vendors can view their invoice line items" on "public"."invoice_line_items"                                                                                                      
drop policy "Users can create invoices" on "public"."invoices"                                                                                                                                
drop policy "Users can update own invoices" on "public"."invoices"                                                                                                                            
drop policy "Users can view own invoices" on "public"."invoices"                                                                                                                              
drop policy "Vendors can create invoices" on "public"."invoices"                                                                                                                              
drop policy "Vendors can update their invoices" on "public"."invoices"                                                                                                                        
drop policy "Vendors can view their invoices" on "public"."invoices"                                                                                                                          
drop policy "Anyone can view media metadata" on "public"."media_files"                                                                                                                        
drop policy "Authenticated users can create media records" on "public"."media_files"                                                                                                          
drop policy "Users can manage their own media records" on "public"."media_files"                                                                                                              
drop policy "Authenticated users can view model metadata" on "public"."ml_models"                                                                                                             
drop policy "System users can manage models" on "public"."ml_models"                                                                                                                          
drop policy "System users can manage performance metrics" on "public"."model_performance_metrics"                                                                                             
drop policy "System users can manage predictions" on "public"."model_predictions"                                                                                                             
drop policy "System users can manage training runs" on "public"."model_training_runs"                                                                                                         
drop policy "Admins can update appeals" on "public"."moderation_appeals"                                                                                                                      
drop policy "Admins can view all appeals" on "public"."moderation_appeals"                                                                                                                    
drop policy "Users can create appeals" on "public"."moderation_appeals"                                                                                                                       
drop policy "Users can view their own appeals" on "public"."moderation_appeals"                                                                                                               
drop policy "Users can view own notification analytics" on "public"."notification_analytics"                                                                                                  
drop policy "Users can view own queued notifications" on "public"."notification_queue"                                                                                                        
drop policy "Everyone can view active notification templates" on "public"."notification_templates"                                                                                            
drop policy "Users can update own notifications" on "public"."notifications"                                                                                                                  
drop policy "Users can view own notifications" on "public"."notifications"                                                                                                                    
drop policy "Service can manage audit trail" on "public"."payment_audit_trail"                                                                                                                
drop policy "Vendors can view their payment audit trail" on "public"."payment_audit_trail"                                                                                                    
drop policy "Service can manage discrepancies" on "public"."payment_discrepancies"                                                                                                            
drop policy "Vendors can view their own discrepancies" on "public"."payment_discrepancies"                                                                                                    
drop policy "Admins can view all payment disputes" on "public"."payment_disputes"                                                                                                             
drop policy "Vendors can view disputes for their bookings" on "public"."payment_disputes"                                                                                                     
drop policy "Service can manage reconciliations" on "public"."payment_reconciliations"                                                                                                        
drop policy "Vendors can view their own reconciliations" on "public"."payment_reconciliations"                                                                                                
drop policy "Service can manage refunds for reconciliation" on "public"."payment_refunds"                                                                                                     
drop policy "payment_refunds_simple" on "public"."payment_refunds"                                                                                                                            
drop policy "payment_reminders_simple" on "public"."payment_reminders"                                                                                                                        
drop policy "Users can update own payment splits" on "public"."payment_splits"                                                                                                                
drop policy "Users can view own payment splits" on "public"."payment_splits"                                                                                                                  
drop policy "Users can view own payout failures" on "public"."payout_failures"                                                                                                                
drop policy "Users can view own payout hold logs" on "public"."payout_hold_logs"                                                                                                              
drop policy "Admin can manage holds" on "public"."payout_holds"                                                                                                                               
drop policy "Vendors can view their holds" on "public"."payout_holds"                                                                                                                         
drop policy "Admins can manage all payout holds" on "public"."payout_holds_system"                                                                                                            
drop policy "Users can view own payout holds" on "public"."payout_holds_system"                                                                                                               
drop policy "Users can view own payout line items" on "public"."payout_line_items"                                                                                                            
drop policy "Users can view own payout schedule jobs" on "public"."payout_schedule_jobs"                                                                                                      
drop policy "Users can manage own assessment" on "public"."personality_assessments"                                                                                                           
drop policy "Users can view own assessment" on "public"."personality_assessments"                                                                                                             
drop policy "Users can manage own interaction sessions" on "public"."post_interaction_sessions"                                                                                               
drop policy "Post saves viewable by post author" on "public"."post_saves"                                                                                                                     
drop policy "Users can manage own saves" on "public"."post_saves"                                                                                                                             
drop policy "Post shares viewable by post author" on "public"."post_shares"                                                                                                                   
drop policy "Users can manage own shares" on "public"."post_shares"                                                                                                                           
drop policy "Post authors can view post analytics" on "public"."post_views"                                                                                                                   
drop policy "Users can create view records" on "public"."post_views"                                                                                                                          
drop policy "Users can view own view history" on "public"."post_views"                                                                                                                        
drop policy "Users can insert own profile" on "public"."profiles"                                                                                                                             
drop policy "Vendors can manage their schedules" on "public"."reconciliation_schedules"                                                                                                       
drop policy "Admins can view all refund requests" on "public"."refund_requests"                                                                                                               
drop policy "Users can create own refund requests" on "public"."refund_requests"                                                                                                              
drop policy "Users can view own refund requests" on "public"."refund_requests"                                                                                                                
drop policy "Vendors can update refund requests for their adventures" on "public"."refund_requests"                                                                                           
drop policy "Vendors can view refund requests for their adventures" on "public"."refund_requests"                                                                                             
drop policy "Reviews are publicly viewable" on "public"."reviews"                                                                                                                             
drop policy "Users can create reviews for completed bookings" on "public"."reviews"                                                                                                           
drop policy "Users can delete own reviews" on "public"."reviews"                                                                                                                              
drop policy "Users can update own reviews" on "public"."reviews"                                                                                                                              
drop policy "split_payments_simple" on "public"."split_payments"                                                                                                                              
drop policy "Only service role can access webhook events" on "public"."stripe_webhook_events"                                                                                                 
drop policy "Only admins can access system settings" on "public"."system_settings"                                                                                                            
drop policy "System users can manage training datasets" on "public"."training_datasets"                                                                                                       
drop policy "Trending content is publicly readable" on "public"."trending_content"                                                                                                            
drop policy "Public requests are viewable" on "public"."trip_requests"                                                                                                                        
drop policy "Users can manage own requests" on "public"."trip_requests"                                                                                                                       
drop policy "Users can manage own feed preferences" on "public"."user_feed_preferences"                                                                                                       
drop policy "Admins can manage warnings" on "public"."user_warnings"                                                                                                                          
drop policy "Users can view their own warnings" on "public"."user_warnings"                                                                                                                   
drop policy "Bids viewable by parties" on "public"."vendor_bids"                                                                                                                              
drop policy "Vendors can manage own bids" on "public"."vendor_bids"                                                                                                                           
drop policy "Certifications are viewable by everyone" on "public"."vendor_certifications"                                                                                                     
drop policy "Vendors can manage own certifications" on "public"."vendor_certifications"                                                                                                       
drop policy "Moderation log viewable by moderators and admins" on "public"."vendor_forum_moderation_log"                                                                                      
drop policy "Moderators can log moderation actions" on "public"."vendor_forum_moderation_log"                                                                                                 
drop policy "System can manage forum notifications" on "public"."vendor_forum_notifications"                                                                                                  
drop policy "Vendors can view own forum notifications" on "public"."vendor_forum_notifications"                                                                                               
drop policy "Forum replies are viewable by all vendors" on "public"."vendor_forum_replies"                                                                                                    
drop policy "Vendors can create forum replies" on "public"."vendor_forum_replies"                                                                                                             
drop policy "Vendors can update own forum replies" on "public"."vendor_forum_replies"                                                                                                         
drop policy "Forum reputation is viewable by all vendors" on "public"."vendor_forum_reputation"                                                                                               
drop policy "System can manage vendor reputation" on "public"."vendor_forum_reputation"                                                                                                       
drop policy "Forum threads are viewable by all vendors" on "public"."vendor_forum_threads"                                                                                                    
drop policy "Vendors can create forum threads" on "public"."vendor_forum_threads"                                                                                                             
drop policy "Vendors can update own forum threads" on "public"."vendor_forum_threads"                                                                                                         
drop policy "Vendors can manage own forum votes" on "public"."vendor_forum_votes"                                                                                                             
drop policy "Vendors can view all forum votes" on "public"."vendor_forum_votes"                                                                                                               
drop policy "Insurance viewable by vendor and admins" on "public"."vendor_insurance"                                                                                                          
drop policy "Vendors can manage own insurance" on "public"."vendor_insurance"                                                                                                                 
drop policy "Users can view own payouts" on "public"."vendor_payouts"                                                                                                                         
drop policy "Users can create own Stripe accounts" on "public"."vendor_stripe_accounts"                                                                                                       
drop policy "Users can update own Stripe accounts" on "public"."vendor_stripe_accounts"                                                                                                       
drop policy "Users can view own Stripe accounts" on "public"."vendor_stripe_accounts"                                                                                                         
drop policy "Users can insert own vendor profile" on "public"."vendors"                                                                                                                       
drop policy "Users can update own vendor profile" on "public"."vendors"                                                                                                                       
drop policy "Vendors are viewable by everyone" on "public"."vendors"                                                                                                                          
drop policy "Users can create WhatsApp groups" on "public"."whatsapp_groups"                                                                                                                  
drop policy "Users can delete their WhatsApp groups" on "public"."whatsapp_groups"                                                                                                            
drop policy "Users can update their WhatsApp groups" on "public"."whatsapp_groups"                                                                                                            
drop policy "Users can view their WhatsApp groups" on "public"."whatsapp_groups"                                                                                                              
drop policy "Users can create WhatsApp messages" on "public"."whatsapp_messages"                                                                                                              
drop policy "Users can view their WhatsApp messages" on "public"."whatsapp_messages"                                                                                                          
drop policy "Service role can access WhatsApp webhooks" on "public"."whatsapp_webhooks"                                                                                                       
alter table "public"."ab_test_assignments" drop constraint "ab_test_assignments_assigned_model_id_fkey"                                                                                       
alter table "public"."ab_test_assignments" drop constraint "ab_test_assignments_experiment_id_fkey"                                                                                           
alter table "public"."ab_test_assignments" drop constraint "ab_test_assignments_experiment_id_user_id_key"                                                                                    
alter table "public"."ab_test_assignments" drop constraint "ab_test_assignments_user_id_fkey"                                                                                                 
alter table "public"."ab_test_experiments" drop constraint "ab_test_experiments_control_model_id_fkey"                                                                                        
alter table "public"."ab_test_experiments" drop constraint "ab_test_experiments_created_by_fkey"                                                                                              
alter table "public"."ab_test_experiments" drop constraint "ab_test_experiments_name_key"                                                                                                     
alter table "public"."ab_test_experiments" drop constraint "ab_test_experiments_traffic_split_check"                                                                                          
alter table "public"."ab_test_experiments" drop constraint "ab_test_experiments_treatment_model_id_fkey"                                                                                      
alter table "public"."ab_test_experiments" drop constraint "ab_test_experiments_winner_model_id_fkey"                                                                                         
alter table "public"."adventure_availability" drop constraint "adventure_availability_adventure_id_date_start_time_key"                                                                       
alter table "public"."adventure_availability" drop constraint "adventure_availability_adventure_id_fkey"                                                                                      
alter table "public"."adventure_media" drop constraint "adventure_media_adventure_id_fkey"                                                                                                    
alter table "public"."adventure_media" drop constraint "adventure_media_media_type_check"                                                                                                     
alter table "public"."adventures" drop constraint "adventures_vendor_id_fkey"                                                                                                                 
alter table "public"."appeal_notes" drop constraint "appeal_notes_appeal_id_fkey"                                                                                                             
alter table "public"."appeal_notes" drop constraint "appeal_notes_moderator_id_fkey"                                                                                                          
alter table "public"."appeal_notes" drop constraint "appeal_notes_note_type_check"                                                                                                            
alter table "public"."assessment_responses" drop constraint "assessment_responses_response_value_check"                                                                                       
alter table "public"."assessment_responses" drop constraint "assessment_responses_user_id_fkey"                                                                                               
alter table "public"."assessment_responses" drop constraint "assessment_responses_user_id_question_id_key"                                                                                    
alter table "public"."background_job_results" drop constraint "background_job_results_job_id_key"                                                                                             
alter table "public"."bid_messages" drop constraint "bid_messages_bid_id_fkey"                                                                                                                
alter table "public"."bid_messages" drop constraint "bid_messages_moderation_status_check"                                                                                                    
alter table "public"."bid_messages" drop constraint "bid_messages_sender_id_fkey"                                                                                                             
alter table "public"."bid_messages" drop constraint "bid_messages_visibility_check"                                                                                                           
alter table "public"."booking_audit_logs" drop constraint "booking_audit_logs_booking_id_fkey"                                                                                                
alter table "public"."booking_audit_logs" drop constraint "booking_audit_logs_modification_request_id_fkey"                                                                                   
alter table "public"."booking_cancellations" drop constraint "booking_cancellations_booking_id_fkey"                                                                                          
alter table "public"."booking_cancellations" drop constraint "booking_cancellations_processed_by_fkey"                                                                                        
alter table "public"."booking_cancellations" drop constraint "booking_cancellations_user_id_fkey"                                                                                             
alter table "public"."booking_disputes" drop constraint "booking_disputes_booking_id_fkey"                                                                                                    
alter table "public"."booking_modifications" drop constraint "booking_modifications_approved_by_fkey"                                                                                         
alter table "public"."booking_modifications" drop constraint "booking_modifications_booking_id_fkey"                                                                                          
alter table "public"."booking_modifications" drop constraint "booking_modifications_modification_type_check"                                                                                  
alter table "public"."booking_modifications" drop constraint "booking_modifications_modified_by_fkey"                                                                                         
alter table "public"."booking_participants" drop constraint "booking_participants_booking_id_fkey"                                                                                            
alter table "public"."booking_participants" drop constraint "booking_participants_payment_id_fkey"                                                                                            
alter table "public"."booking_participants" drop constraint "booking_participants_user_id_fkey"                                                                                               
alter table "public"."booking_payments" drop constraint "booking_payments_booking_id_fkey"                                                                                                    
alter table "public"."booking_payments" drop constraint "booking_payments_payout_id_fkey"                                                                                                     
alter table "public"."booking_payments" drop constraint "booking_payments_user_id_fkey"                                                                                                       
alter table "public"."booking_payments" drop constraint "booking_payments_vendor_stripe_account_id_fkey"                                                                                      
alter table "public"."booking_service_disputes" drop constraint "booking_service_disputes_assigned_to_fkey"                                                                                   
alter table "public"."booking_service_disputes" drop constraint "booking_service_disputes_booking_id_fkey"                                                                                    
alter table "public"."booking_service_disputes" drop constraint "booking_service_disputes_related_modification_id_fkey"                                                                       
alter table "public"."booking_service_disputes" drop constraint "booking_service_disputes_user_id_fkey"                                                                                       
alter table "public"."bookings" drop constraint "bookings_adventure_id_fkey"                                                                                                                  
alter table "public"."bookings" drop constraint "bookings_availability_id_fkey"                                                                                                               
alter table "public"."bookings" drop constraint "bookings_booking_code_key"                                                                                                                   
alter table "public"."bookings" drop constraint "bookings_cancelled_by_fkey"                                                                                                                  
alter table "public"."bookings" drop constraint "bookings_user_id_fkey"                                                                                                                       
alter table "public"."bookings" drop constraint "bookings_vendor_id_fkey"                                                                                                                     
alter table "public"."community_connections" drop constraint "community_connections_check"                                                                                                    
alter table "public"."community_connections" drop constraint "community_connections_connected_user_id_fkey"                                                                                   
alter table "public"."community_connections" drop constraint "community_connections_user_id_connected_user_id_key"                                                                            
alter table "public"."community_connections" drop constraint "community_connections_user_id_fkey"                                                                                             
alter table "public"."community_posts" drop constraint "community_posts_group_id_fkey"                                                                                                        
alter table "public"."community_posts" drop constraint "community_posts_user_id_fkey"                                                                                                         
alter table "public"."compatibility_algorithms" drop constraint "compatibility_algorithms_name_key"                                                                                           
alter table "public"."connection_requests" drop constraint "connection_requests_recipient_id_fkey"                                                                                            
alter table "public"."connection_requests" drop constraint "connection_requests_requester_id_fkey"                                                                                            
alter table "public"."connection_requests" drop constraint "connection_requests_requester_id_recipient_id_key"                                                                                
alter table "public"."connection_requests" drop constraint "connection_requests_status_check"                                                                                                 
alter table "public"."content_discovery_log" drop constraint "content_discovery_log_discovery_method_check"                                                                                   
alter table "public"."content_discovery_log" drop constraint "content_discovery_log_post_id_fkey"                                                                                             
alter table "public"."content_discovery_log" drop constraint "content_discovery_log_user_id_fkey"                                                                                             
alter table "public"."content_filter_rules" drop constraint "content_filter_rules_action_check"                                                                                               
alter table "public"."content_filter_rules" drop constraint "content_filter_rules_created_by_fkey"                                                                                            
alter table "public"."content_filter_rules" drop constraint "content_filter_rules_rule_type_check"                                                                                            
alter table "public"."content_filter_rules" drop constraint "content_filter_rules_severity_check"                                                                                             
alter table "public"."content_reports" drop constraint "content_reports_content_type_check"                                                                                                   
alter table "public"."content_reports" drop constraint "content_reports_report_category_check"                                                                                                
alter table "public"."content_reports" drop constraint "content_reports_reporter_id_fkey"                                                                                                     
alter table "public"."content_reports" drop constraint "content_reports_severity_check"                                                                                                       
alter table "public"."content_reports" drop constraint "content_reports_status_check"                                                                                                         
alter table "public"."content_scores" drop constraint "content_scores_post_id_fkey"                                                                                                           
alter table "public"."content_scores" drop constraint "content_scores_post_id_key"                                                                                                            
alter table "public"."cors_violations" drop constraint "cors_violations_severity_check"                                                                                                       
alter table "public"."credential_access_logs" drop constraint "credential_access_logs_user_id_fkey"                                                                                           
alter table "public"."credential_errors" drop constraint "credential_errors_user_id_fkey"                                                                                                     
alter table "public"."currency_exchange_rates" drop constraint "currency_exchange_rates_base_currency_target_currency_valid_key"                                                              
alter table "public"."dispute_threads" drop constraint "dispute_threads_dispute_id_fkey"                                                                                                      
alter table "public"."dispute_threads" drop constraint "dispute_threads_user_id_fkey"                                                                                                         
alter table "public"."engagement_scores" drop constraint "engagement_scores_user_id_fkey"                                                                                                     
alter table "public"."engagement_scores" drop constraint "engagement_scores_user_id_key"                                                                                                      
alter table "public"."fcm_tokens" drop constraint "fcm_tokens_device_type_check"                                                                                                              
alter table "public"."fcm_tokens" drop constraint "fcm_tokens_token_key"                                                                                                                      
alter table "public"."fcm_tokens" drop constraint "fcm_tokens_user_id_fkey"                                                                                                                   
alter table "public"."fcm_tokens" drop constraint "fcm_tokens_user_id_token_key"                                                                                                              
alter table "public"."group_compatibility_scores" drop constraint "group_compatibility_scores_compatibility_score_check"                                                                      
alter table "public"."group_compatibility_scores" drop constraint "group_compatibility_scores_group_id_fkey"                                                                                  
alter table "public"."group_compatibility_scores" drop constraint "group_compatibility_scores_group_id_user_id_key"                                                                           
alter table "public"."group_compatibility_scores" drop constraint "group_compatibility_scores_user_id_fkey"                                                                                   
alter table "public"."group_invitations" drop constraint "group_invitations_group_id_fkey"                                                                                                    
alter table "public"."group_invitations" drop constraint "group_invitations_invitation_code_key"                                                                                              
alter table "public"."group_invitations" drop constraint "group_invitations_invited_by_fkey"                                                                                                  
alter table "public"."group_invitations" drop constraint "group_invitations_invited_user_id_fkey"                                                                                             
alter table "public"."group_invitations" drop constraint "group_invitations_status_check"                                                                                                     
alter table "public"."group_members" drop constraint "group_members_group_id_fkey"                                                                                                            
alter table "public"."group_members" drop constraint "group_members_group_id_user_id_key"                                                                                                     
alter table "public"."group_members" drop constraint "group_members_invited_by_fkey"                                                                                                          
alter table "public"."group_members" drop constraint "group_members_user_id_fkey"                                                                                                             
alter table "public"."groups" drop constraint "groups_owner_id_fkey"                                                                                                                          
alter table "public"."individual_payments" drop constraint "individual_payments_split_payment_id_fkey"                                                                                        
alter table "public"."individual_payments" drop constraint "individual_payments_user_id_fkey"                                                                                                 
alter table "public"."invoice_line_items" drop constraint "invoice_line_items_invoice_id_fkey"                                                                                                
alter table "public"."invoices" drop constraint "invoices_booking_id_fkey"                                                                                                                    
alter table "public"."invoices" drop constraint "invoices_invoice_number_key"                                                                                                                 
alter table "public"."invoices" drop constraint "invoices_status_check"                                                                                                                       
alter table "public"."invoices" drop constraint "invoices_user_id_fkey"                                                                                                                       
alter table "public"."invoices" drop constraint "invoices_vendor_id_fkey"                                                                                                                     
alter table "public"."media_files" drop constraint "media_files_file_type_check"                                                                                                              
alter table "public"."media_files" drop constraint "media_files_user_id_fkey"                                                                                                                 
alter table "public"."ml_models" drop constraint "ml_models_created_by_fkey"                                                                                                                  
alter table "public"."ml_models" drop constraint "ml_models_model_type_check"                                                                                                                 
alter table "public"."ml_models" drop constraint "ml_models_name_version_key"                                                                                                                 
alter table "public"."model_performance_metrics" drop constraint "model_performance_metrics_metric_type_check"                                                                                
alter table "public"."model_performance_metrics" drop constraint "model_performance_metrics_model_id_fkey"                                                                                    
alter table "public"."model_predictions" drop constraint "model_predictions_group_id_fkey"                                                                                                    
alter table "public"."model_predictions" drop constraint "model_predictions_model_id_fkey"                                                                                                    
alter table "public"."model_predictions" drop constraint "model_predictions_user_id_fkey"                                                                                                     
alter table "public"."model_training_runs" drop constraint "model_training_runs_dataset_id_fkey"                                                                                              
alter table "public"."model_training_runs" drop constraint "model_training_runs_model_id_fkey"                                                                                                
alter table "public"."model_training_runs" drop constraint "model_training_runs_status_check"                                                                                                 
alter table "public"."moderation_appeals" drop constraint "moderation_appeals_appeal_type_check"                                                                                              
alter table "public"."moderation_appeals" drop constraint "moderation_appeals_assigned_moderator_fkey"                                                                                        
alter table "public"."moderation_appeals" drop constraint "moderation_appeals_original_moderator_fkey"                                                                                        
alter table "public"."moderation_appeals" drop constraint "moderation_appeals_priority_check"                                                                                                 
alter table "public"."moderation_appeals" drop constraint "moderation_appeals_status_check"                                                                                                   
alter table "public"."moderation_appeals" drop constraint "moderation_appeals_user_id_fkey"                                                                                                   
alter table "public"."moderation_logs" drop constraint "moderation_logs_moderator_id_fkey"                                                                                                    
alter table "public"."moderation_logs" drop constraint "moderation_logs_user_id_fkey"                                                                                                         
alter table "public"."moderation_queue" drop constraint "moderation_queue_assigned_moderator_fkey"                                                                                            
alter table "public"."moderation_queue" drop constraint "moderation_queue_priority_check"                                                                                                     
alter table "public"."moderation_queue" drop constraint "moderation_queue_report_id_fkey"                                                                                                     
alter table "public"."moderation_queue" drop constraint "moderation_queue_status_check"                                                                                                       
alter table "public"."notification_analytics" drop constraint "notification_analytics_event_type_check"                                                                                       
alter table "public"."notification_analytics" drop constraint "notification_analytics_notification_id_fkey"                                                                                   
alter table "public"."notification_analytics" drop constraint "notification_analytics_user_id_fkey"                                                                                           
alter table "public"."notification_queue" drop constraint "notification_queue_status_check"                                                                                                   
alter table "public"."notification_queue" drop constraint "notification_queue_user_id_fkey"                                                                                                   
alter table "public"."notification_templates" drop constraint "notification_templates_name_key"                                                                                               
alter table "public"."notifications" drop constraint "notifications_user_id_fkey"                                                                                                             
alter table "public"."payment_audit_trail" drop constraint "payment_audit_trail_payment_id_fkey"                                                                                              
alter table "public"."payment_discrepancies" drop constraint "payment_discrepancies_reconciliation_id_fkey"                                                                                   
alter table "public"."payment_disputes" drop constraint "payment_disputes_booking_id_fkey"                                                                                                    
alter table "public"."payment_disputes" drop constraint "payment_disputes_status_check"                                                                                                       
alter table "public"."payment_disputes" drop constraint "payment_disputes_stripe_dispute_id_key"                                                                                              
alter table "public"."payment_disputes" drop constraint "payment_disputes_user_id_fkey"                                                                                                       
alter table "public"."payment_reconciliations" drop constraint "payment_reconciliations_vendor_account_id_fkey"                                                                               
alter table "public"."payment_refunds" drop constraint "payment_refunds_individual_payment_id_fkey"                                                                                           
alter table "public"."payment_refunds" drop constraint "payment_refunds_refund_request_id_fkey"                                                                                               
alter table "public"."payment_refunds" drop constraint "payment_refunds_split_payment_id_fkey"                                                                                                
alter table "public"."payment_reminders" drop constraint "payment_reminders_individual_payment_id_fkey"                                                                                       
alter table "public"."payment_splits" drop constraint "payment_splits_booking_id_fkey"                                                                                                        
alter table "public"."payment_splits" drop constraint "payment_splits_payment_id_fkey"                                                                                                        
alter table "public"."payment_splits" drop constraint "payment_splits_user_id_fkey"                                                                                                           
alter table "public"."payment_tokens" drop constraint "payment_tokens_individual_payment_id_fkey"                                                                                             
alter table "public"."payment_tokens" drop constraint "payment_tokens_token_key"                                                                                                              
alter table "public"."payout_failures" drop constraint "payout_failures_vendor_stripe_account_id_fkey"                                                                                        
alter table "public"."payout_hold_logs" drop constraint "payout_hold_logs_hold_id_fkey"                                                                                                       
alter table "public"."payout_holds" drop constraint "payout_holds_vendor_stripe_account_id_fkey"                                                                                              
alter table "public"."payout_holds_system" drop constraint "payout_holds_system_vendor_stripe_account_id_fkey"                                                                                
alter table "public"."payout_holds_system" drop constraint "valid_release_date"                                                                                                               
alter table "public"."payout_holds_system" drop constraint "valid_release_timing"                                                                                                             
alter table "public"."payout_line_items" drop constraint "payout_line_items_booking_id_fkey"                                                                                                  
alter table "public"."payout_line_items" drop constraint "payout_line_items_payment_id_fkey"                                                                                                  
alter table "public"."payout_line_items" drop constraint "payout_line_items_payout_id_fkey"                                                                                                   
alter table "public"."payout_schedule_jobs" drop constraint "payout_schedule_jobs_vendor_stripe_account_id_fkey"                                                                              
alter table "public"."personality_assessments" drop constraint "personality_assessments_adventure_style_check"                                                                                
alter table "public"."personality_assessments" drop constraint "personality_assessments_agreeableness_check"                                                                                  
alter table "public"."personality_assessments" drop constraint "personality_assessments_budget_preference_check"                                                                              
alter table "public"."personality_assessments" drop constraint "personality_assessments_conscientiousness_check"                                                                              
alter table "public"."personality_assessments" drop constraint "personality_assessments_extraversion_check"                                                                                   
alter table "public"."personality_assessments" drop constraint "personality_assessments_group_preference_check"                                                                               
alter table "public"."personality_assessments" drop constraint "personality_assessments_neuroticism_check"                                                                                    
alter table "public"."personality_assessments" drop constraint "personality_assessments_openness_check"                                                                                       
alter table "public"."personality_assessments" drop constraint "personality_assessments_planning_style_check"                                                                                 
alter table "public"."personality_assessments" drop constraint "personality_assessments_user_id_fkey"                                                                                         
alter table "public"."personality_assessments" drop constraint "personality_assessments_user_id_key"                                                                                          
alter table "public"."post_comments" drop constraint "post_comments_parent_comment_id_fkey"                                                                                                   
alter table "public"."post_comments" drop constraint "post_comments_post_id_fkey"                                                                                                             
alter table "public"."post_comments" drop constraint "post_comments_user_id_fkey"                                                                                                             
alter table "public"."post_interaction_sessions" drop constraint "post_interaction_sessions_post_id_fkey"                                                                                     
alter table "public"."post_interaction_sessions" drop constraint "post_interaction_sessions_user_id_fkey"                                                                                     
alter table "public"."post_reactions" drop constraint "post_reactions_post_id_fkey"                                                                                                           
alter table "public"."post_reactions" drop constraint "post_reactions_post_id_user_id_key"                                                                                                    
alter table "public"."post_reactions" drop constraint "post_reactions_reaction_type_check"                                                                                                    
alter table "public"."post_reactions" drop constraint "post_reactions_user_id_fkey"                                                                                                           
alter table "public"."post_saves" drop constraint "post_saves_post_id_fkey"                                                                                                                   
alter table "public"."post_saves" drop constraint "post_saves_post_id_user_id_key"                                                                                                            
alter table "public"."post_saves" drop constraint "post_saves_user_id_fkey"                                                                                                                   
alter table "public"."post_shares" drop constraint "post_shares_post_id_fkey"                                                                                                                 
alter table "public"."post_shares" drop constraint "post_shares_share_type_check"                                                                                                             
alter table "public"."post_shares" drop constraint "post_shares_user_id_fkey"                                                                                                                 
alter table "public"."post_views" drop constraint "post_views_post_id_fkey"                                                                                                                   
alter table "public"."post_views" drop constraint "post_views_user_id_fkey"                                                                                                                   
alter table "public"."profiles" drop constraint "check_minimum_age_or_encrypted"                                                                                                              
alter table "public"."profiles" drop constraint "profiles_account_status_check"                                                                                                               
alter table "public"."profiles" drop constraint "profiles_username_key"                                                                                                                       
alter table "public"."reconciliation_schedules" drop constraint "reconciliation_schedules_vendor_account_id_fkey"                                                                             
alter table "public"."refund_requests" drop constraint "refund_requests_booking_id_fkey"                                                                                                      
alter table "public"."refund_requests" drop constraint "refund_requests_reason_category_check"                                                                                                
alter table "public"."refund_requests" drop constraint "refund_requests_requested_amount_type_check"                                                                                          
alter table "public"."refund_requests" drop constraint "refund_requests_reviewed_by_fkey"                                                                                                     
alter table "public"."refund_requests" drop constraint "refund_requests_split_payment_id_fkey"                                                                                                
alter table "public"."refund_requests" drop constraint "refund_requests_status_check"                                                                                                         
alter table "public"."refund_requests" drop constraint "refund_requests_user_id_fkey"                                                                                                         
alter table "public"."request_invitations" drop constraint "request_invitations_invited_by_fkey"                                                                                              
alter table "public"."request_invitations" drop constraint "request_invitations_status_check"                                                                                                 
alter table "public"."request_invitations" drop constraint "request_invitations_trip_request_id_fkey"                                                                                         
alter table "public"."request_invitations" drop constraint "request_invitations_trip_request_id_vendor_id_key"                                                                                
alter table "public"."request_invitations" drop constraint "request_invitations_vendor_id_fkey"                                                                                               
alter table "public"."retraining_jobs" drop constraint "retraining_jobs_model_id_fkey"                                                                                                        
alter table "public"."retraining_jobs" drop constraint "retraining_jobs_new_model_id_fkey"                                                                                                    
alter table "public"."retraining_jobs" drop constraint "retraining_jobs_status_check"                                                                                                         
alter table "public"."retraining_jobs" drop constraint "retraining_jobs_trigger_id_fkey"                                                                                                      
alter table "public"."retraining_triggers" drop constraint "retraining_triggers_model_type_check"                                                                                             
alter table "public"."retraining_triggers" drop constraint "retraining_triggers_name_key"                                                                                                     
alter table "public"."retraining_triggers" drop constraint "retraining_triggers_trigger_type_check"                                                                                           
alter table "public"."reviews" drop constraint "reviews_adventure_id_fkey"                                                                                                                    
alter table "public"."reviews" drop constraint "reviews_booking_id_fkey"                                                                                                                      
alter table "public"."reviews" drop constraint "reviews_booking_id_user_id_key"                                                                                                               
alter table "public"."reviews" drop constraint "reviews_rating_check"                                                                                                                         
alter table "public"."reviews" drop constraint "reviews_user_id_fkey"                                                                                                                         
alter table "public"."reviews" drop constraint "reviews_vendor_id_fkey"                                                                                                                       
alter table "public"."split_payment_settings" drop constraint "split_payment_settings_split_payment_id_fkey"                                                                                  
alter table "public"."split_payments" drop constraint "split_payments_booking_id_fkey"                                                                                                        
alter table "public"."split_payments" drop constraint "split_payments_organizer_id_fkey"                                                                                                      
alter table "public"."stripe_webhook_events" drop constraint "stripe_webhook_events_stripe_event_id_key"                                                                                      
alter table "public"."system_settings" drop constraint "system_settings_setting_key_key"                                                                                                      
alter table "public"."trending_content" drop constraint "trending_content_post_id_fkey"                                                                                                       
alter table "public"."trending_content" drop constraint "trending_content_post_id_time_window_hours_key"                                                                                      
alter table "public"."trip_requests" drop constraint "trip_requests_status_check"                                                                                                             
alter table "public"."trip_requests" drop constraint "trip_requests_user_id_fkey"                                                                                                             
alter table "public"."trip_requests" drop constraint "trip_requests_visibility_check"                                                                                                         
alter table "public"."user_feed_preferences" drop constraint "user_feed_preferences_algorithm_preference_check"                                                                               
alter table "public"."user_feed_preferences" drop constraint "user_feed_preferences_diversity_weight_check"                                                                                   
alter table "public"."user_feed_preferences" drop constraint "user_feed_preferences_user_id_fkey"                                                                                             
alter table "public"."user_feed_preferences" drop constraint "user_feed_preferences_user_id_key"                                                                                              
alter table "public"."user_preferences" drop constraint "user_preferences_notification_frequency_check"                                                                                       
alter table "public"."user_preferences" drop constraint "user_preferences_privacy_level_check"                                                                                                
alter table "public"."user_preferences" drop constraint "user_preferences_theme_check"                                                                                                        
alter table "public"."user_restrictions" drop constraint "user_restrictions_restricted_by_fkey"                                                                                               
alter table "public"."user_restrictions" drop constraint "user_restrictions_restriction_type_check"                                                                                           
alter table "public"."user_restrictions" drop constraint "user_restrictions_user_id_fkey"                                                                                                     
alter table "public"."user_warnings" drop constraint "user_warnings_issued_by_fkey"                                                                                                           
alter table "public"."user_warnings" drop constraint "user_warnings_severity_check"                                                                                                           
alter table "public"."user_warnings" drop constraint "user_warnings_user_id_fkey"                                                                                                             
alter table "public"."vendor_bids" drop constraint "vendor_bids_trip_request_id_fkey"                                                                                                         
alter table "public"."vendor_bids" drop constraint "vendor_bids_trip_request_id_vendor_id_key"                                                                                                
alter table "public"."vendor_bids" drop constraint "vendor_bids_vendor_id_fkey"                                                                                                               
alter table "public"."vendor_certifications" drop constraint "vendor_certifications_vendor_id_fkey"                                                                                           
alter table "public"."vendor_forum_moderation_log" drop constraint "vendor_forum_moderation_log_action_type_check"                                                                            
alter table "public"."vendor_forum_moderation_log" drop constraint "vendor_forum_moderation_log_moderator_vendor_id_fkey"                                                                     
alter table "public"."vendor_forum_moderation_log" drop constraint "vendor_forum_moderation_log_reply_id_fkey"                                                                                
alter table "public"."vendor_forum_moderation_log" drop constraint "vendor_forum_moderation_log_thread_id_fkey"                                                                               
alter table "public"."vendor_forum_notifications" drop constraint "vendor_forum_notifications_notification_type_check"                                                                        
alter table "public"."vendor_forum_notifications" drop constraint "vendor_forum_notifications_reply_id_fkey"                                                                                  
alter table "public"."vendor_forum_notifications" drop constraint "vendor_forum_notifications_thread_id_fkey"                                                                                 
alter table "public"."vendor_forum_notifications" drop constraint "vendor_forum_notifications_vendor_id_fkey"                                                                                 
alter table "public"."vendor_forum_replies" drop constraint "vendor_forum_replies_parent_reply_id_fkey"                                                                                       
alter table "public"."vendor_forum_replies" drop constraint "vendor_forum_replies_thread_id_fkey"                                                                                             
alter table "public"."vendor_forum_replies" drop constraint "vendor_forum_replies_vendor_id_fkey"                                                                                             
alter table "public"."vendor_forum_reputation" drop constraint "vendor_forum_reputation_reputation_level_check"                                                                               
alter table "public"."vendor_forum_reputation" drop constraint "vendor_forum_reputation_vendor_id_fkey"                                                                                       
alter table "public"."vendor_forum_reputation" drop constraint "vendor_forum_reputation_vendor_id_key"                                                                                        
alter table "public"."vendor_forum_threads" drop constraint "vendor_forum_threads_last_reply_vendor_id_fkey"                                                                                  
alter table "public"."vendor_forum_threads" drop constraint "vendor_forum_threads_vendor_id_fkey"                                                                                             
alter table "public"."vendor_forum_votes" drop constraint "vendor_forum_votes_check"                                                                                                          
alter table "public"."vendor_forum_votes" drop constraint "vendor_forum_votes_reply_id_fkey"                                                                                                  
alter table "public"."vendor_forum_votes" drop constraint "vendor_forum_votes_thread_id_fkey"                                                                                                 
alter table "public"."vendor_forum_votes" drop constraint "vendor_forum_votes_vendor_id_fkey"                                                                                                 
alter table "public"."vendor_forum_votes" drop constraint "vendor_forum_votes_vendor_id_reply_id_key"                                                                                         
alter table "public"."vendor_forum_votes" drop constraint "vendor_forum_votes_vendor_id_thread_id_key"                                                                                        
alter table "public"."vendor_forum_votes" drop constraint "vendor_forum_votes_vote_type_check"                                                                                                
alter table "public"."vendor_forums" drop constraint "vendor_forums_vendor_id_fkey"                                                                                                           
alter table "public"."vendor_insurance" drop constraint "vendor_insurance_vendor_id_fkey"                                                                                                     
alter table "public"."vendor_payouts" drop constraint "vendor_payouts_stripe_payout_id_key"                                                                                                   
alter table "public"."vendor_payouts" drop constraint "vendor_payouts_vendor_stripe_account_id_fkey"                                                                                          
alter table "public"."vendor_stripe_accounts" drop constraint "valid_minimum_payout"                                                                                                          
alter table "public"."vendor_stripe_accounts" drop constraint "valid_platform_fee"                                                                                                            
alter table "public"."vendor_stripe_accounts" drop constraint "vendor_stripe_accounts_stripe_account_id_key"                                                                                  
alter table "public"."vendor_stripe_accounts" drop constraint "vendor_stripe_accounts_user_id_fkey"                                                                                           
alter table "public"."vendor_stripe_accounts" drop constraint "vendor_stripe_accounts_vendor_id_fkey"                                                                                         
alter table "public"."vendors" drop constraint "vendors_user_id_fkey"                                                                                                                         
alter table "public"."vendors" drop constraint "vendors_user_id_key"                                                                                                                          
alter table "public"."vendors" drop constraint "vendors_verification_status_check"                                                                                                            
alter table "public"."whatsapp_groups" drop constraint "whatsapp_groups_admin_user_id_fkey"                                                                                                   
alter table "public"."whatsapp_groups" drop constraint "whatsapp_groups_adventure_id_fkey"                                                                                                    
alter table "public"."whatsapp_groups" drop constraint "whatsapp_groups_created_by_fkey"                                                                                                      
alter table "public"."whatsapp_groups" drop constraint "whatsapp_groups_status_check"                                                                                                         
alter table "public"."whatsapp_messages" drop constraint "whatsapp_messages_message_type_check"                                                                                               
alter table "public"."whatsapp_messages" drop constraint "whatsapp_messages_moderation_status_check"                                                                                          
alter table "public"."whatsapp_messages" drop constraint "whatsapp_messages_status_check"                                                                                                     
alter table "public"."whatsapp_messages" drop constraint "whatsapp_messages_user_id_fkey"                                                                                                     
alter table "public"."whatsapp_messages" drop constraint "whatsapp_messages_visibility_check"                                                                                                 
alter table "public"."user_preferences" drop constraint "user_preferences_user_id_fkey"                                                                                                       
drop index if exists "public"."idx_mv_hot_compatibility_score"                                                                                                                                
drop index if exists "public"."idx_mv_hot_compatibility_unique"                                                                                                                               
drop function if exists "public"."auto_categorize_webhook_error"()                                                                                                                            
drop function if exists "public"."calculate_compatibility_score"(p_user1_id uuid, p_user2_id uuid)                                                                                            
drop function if exists "public"."calculate_connection_strength"(p_user_id uuid, p_connected_user_id uuid)                                                                                    
drop function if exists "public"."calculate_platform_fee"(amount integer, vendor_account_id uuid)                                                                                             
drop function if exists "public"."categorize_webhook_error"(error_message text)                                                                                                               
drop function if exists "public"."cleanup_expired_notifications"()                                                                                                                            
drop function if exists "public"."cleanup_expired_payment_tokens"()                                                                                                                           
drop function if exists "public"."cleanup_expired_restrictions"()                                                                                                                             
drop function if exists "public"."cleanup_expired_trending_content"()                                                                                                                         
drop function if exists "public"."cleanup_expired_warnings"()                                                                                                                                 
drop function if exists "public"."cleanup_old_compatibility_scores"(p_days_to_keep integer)                                                                                                   
drop function if exists "public"."cleanup_old_cors_violations"()                                                                                                                              
drop function if exists "public"."cleanup_old_whatsapp_webhooks"()                                                                                                                            
drop view if exists "public"."compliance_metrics"                                                                                                                                             
drop view if exists "public"."connection_analytics"                                                                                                                                           
drop function if exists "public"."create_vault_secret"(secret_name text, secret_value text)                                                                                                   
drop view if exists "public"."credential_status_summary"                                                                                                                                      
drop function if exists "public"."generate_invoice_number"()                                                                                                                                  
drop function if exists "public"."get_adventure_availability"(p_adventure_id uuid, p_date_from date, p_date_to date)                                                                          
drop function if exists "public"."get_compatibility_score_fast"(p_user_id uuid, p_group_id uuid, p_max_age_hours integer)                                                                     
drop function if exists "public"."get_connection_recommendations"(p_user_id uuid, p_limit integer)                                                                                            
drop function if exists "public"."get_cors_violation_stats"(timeframe_hours integer)                                                                                                          
drop function if exists "public"."get_failed_webhooks"(hours_back integer, max_attempts integer)                                                                                              
drop function if exists "public"."get_latest_exchange_rate"(base_curr character varying, target_curr character varying)                                                                       
drop function if exists "public"."get_pending_payout_amount"(vendor_account_id uuid)                                                                                                          
drop function if exists "public"."get_vault_secret"(secret_name text)                                                                                                                         
drop function if exists "public"."get_vendor_analytics"(p_vendor_id uuid)                                                                                                                     
drop function if exists "public"."get_vendor_stripe_account"(vendor_user_id uuid)                                                                                                             
drop function if exists "public"."get_webhook_stats"(hours_back integer)                                                                                                                      
drop function if exists "public"."handle_birth_date_encryption"()                                                                                                                             
drop function if exists "public"."has_active_payout_hold"(vendor_account_id uuid)                                                                                                             
drop view if exists "public"."invoice_stats"                                                                                                                                                  
drop function if exists "public"."log_age_verification"(user_id uuid, verification_result boolean, date_of_birth date, encrypted_birth_date text, error_reason text)                          
drop function if exists "public"."log_age_verification"(user_id uuid, verification_result boolean, date_of_birth date, error_reason text)                                                     
drop function if exists "public"."log_cors_violation"(p_origin text, p_endpoint text, p_method text, p_severity text, p_user_agent text, p_ip_address text, p_referer text, p_session_id text)
drop function if exists "public"."log_query_performance"()                                                                                                                                    
drop function if exists "public"."mark_payments_eligible_for_payout"()                                                                                                                        
drop view if exists "public"."moderation_stats"                                                                                                                                               
drop materialized view if exists "public"."mv_hot_compatibility_scores"                                                                                                                       
drop function if exists "public"."notify_modification_status_change"()                                                                                                                        
drop function if exists "public"."process_group_payment"(p_booking_id uuid, p_split_type text)                                                                                                
drop function if exists "public"."process_notification_queue"()                                                                                                                               
drop function if exists "public"."process_payout_eligibility"()                                                                                                                               
drop view if exists "public"."profile_encryption_status"                                                                                                                                      
drop function if exists "public"."refresh_content_scores"(p_post_id uuid)                                                                                                                     
drop function if exists "public"."refresh_hot_compatibility_cache"()                                                                                                                          
drop view if exists "public"."refund_tracking_view"                                                                                                                                           
drop function if exists "public"."search_adventures"(p_search_text text, p_category adventure_category, p_min_price numeric, p_max_price numeric, p_location text, p_date date)               
drop function if exists "public"."set_invoice_number"()                                                                                                                                       
drop view if exists "public"."split_payment_summary"                                                                                                                                          
drop function if exists "public"."update_compliance_logs_updated_at"()                                                                                                                        
drop function if exists "public"."update_connection_strength"()                                                                                                                               
drop function if exists "public"."update_connection_strength_trigger"()                                                                                                                       
drop function if exists "public"."update_cors_violations_updated_at"()                                                                                                                        
drop function if exists "public"."update_engagement_scores"(p_user_id uuid)                                                                                                                   
drop function if exists "public"."update_group_member_count"()                                                                                                                                
drop function if exists "public"."update_modified_column"()                                                                                                                                   
drop function if exists "public"."update_post_engagement_counts"()                                                                                                                            
drop function if exists "public"."update_split_payment_status"()                                                                                                                              
drop function if exists "public"."update_thread_reply_stats"()                                                                                                                                
drop function if exists "public"."update_updated_at_column"()                                                                                                                                 
drop function if exists "public"."update_user_engagement_score"(p_user_id uuid)                                                                                                               
drop function if exists "public"."update_user_warning_count"()                                                                                                                                
drop function if exists "public"."update_vendor_rating"()                                                                                                                                     
drop function if exists "public"."update_vote_counts"()                                                                                                                                       
drop view if exists "public"."v_index_usage_stats"                                                                                                                                            
drop function if exists "public"."validate_age_on_update"()                                                                                                                                   
drop function if exists "public"."warm_compatibility_cache"(p_user_ids uuid[], p_group_id uuid)                                                                                               
drop view if exists "public"."webhook_monitoring_dashboard"                                                                                                                                   
alter table "public"."ab_test_assignments" drop constraint "ab_test_assignments_pkey"                                                                                                         
alter table "public"."ab_test_experiments" drop constraint "ab_test_experiments_pkey"                                                                                                         
alter table "public"."adventure_availability" drop constraint "adventure_availability_pkey"                                                                                                   
alter table "public"."adventure_media" drop constraint "adventure_media_pkey"                                                                                                                 
alter table "public"."adventures" drop constraint "adventures_pkey"                                                                                                                           
alter table "public"."age_verification_logs" drop constraint "age_verification_logs_pkey"                                                                                                     
alter table "public"."appeal_notes" drop constraint "appeal_notes_pkey"                                                                                                                       
alter table "public"."assessment_responses" drop constraint "assessment_responses_pkey"                                                                                                       
alter table "public"."background_job_results" drop constraint "background_job_results_pkey"                                                                                                   
alter table "public"."bid_messages" drop constraint "bid_messages_pkey"                                                                                                                       
alter table "public"."booking_audit_logs" drop constraint "booking_audit_logs_pkey"                                                                                                           
alter table "public"."booking_cancellations" drop constraint "booking_cancellations_pkey"                                                                                                     
alter table "public"."booking_disputes" drop constraint "booking_disputes_pkey"                                                                                                               
alter table "public"."booking_modifications" drop constraint "booking_modifications_pkey"                                                                                                     
alter table "public"."booking_participants" drop constraint "booking_participants_pkey"                                                                                                       
alter table "public"."booking_payments" drop constraint "booking_payments_pkey"                                                                                                               
alter table "public"."booking_service_disputes" drop constraint "booking_service_disputes_pkey"                                                                                               
alter table "public"."bookings" drop constraint "bookings_pkey"                                                                                                                               
alter table "public"."community_connections" drop constraint "community_connections_pkey"                                                                                                     
alter table "public"."community_posts" drop constraint "community_posts_pkey"                                                                                                                 
alter table "public"."compatibility_algorithms" drop constraint "compatibility_algorithms_pkey"                                                                                               
alter table "public"."compliance_logs" drop constraint "compliance_logs_pkey"                                                                                                                 
alter table "public"."connection_requests" drop constraint "connection_requests_pkey"                                                                                                         
alter table "public"."content_analysis_results" drop constraint "content_analysis_results_pkey"                                                                                               
alter table "public"."content_discovery_log" drop constraint "content_discovery_log_pkey"                                                                                                     
alter table "public"."content_filter_rules" drop constraint "content_filter_rules_pkey"                                                                                                       
alter table "public"."content_reports" drop constraint "content_reports_pkey"                                                                                                                 
alter table "public"."content_scores" drop constraint "content_scores_pkey"                                                                                                                   
alter table "public"."cors_violations" drop constraint "cors_violations_pkey"                                                                                                                 
alter table "public"."credential_access_logs" drop constraint "credential_access_logs_pkey"                                                                                                   
alter table "public"."credential_errors" drop constraint "credential_errors_pkey"                                                                                                             
alter table "public"."currency_exchange_rates" drop constraint "currency_exchange_rates_pkey"                                                                                                 
alter table "public"."dispute_threads" drop constraint "dispute_threads_pkey"                                                                                                                 
alter table "public"."engagement_scores" drop constraint "engagement_scores_pkey"                                                                                                             
alter table "public"."fcm_tokens" drop constraint "fcm_tokens_pkey"                                                                                                                           
alter table "public"."group_compatibility_scores" drop constraint "group_compatibility_scores_pkey"                                                                                           
alter table "public"."group_invitations" drop constraint "group_invitations_pkey"                                                                                                             
alter table "public"."group_members" drop constraint "group_members_pkey"                                                                                                                     
alter table "public"."groups" drop constraint "groups_pkey"                                                                                                                                   
alter table "public"."individual_payments" drop constraint "individual_payments_pkey"                                                                                                         
alter table "public"."invoice_line_items" drop constraint "invoice_line_items_pkey"                                                                                                           
alter table "public"."invoices" drop constraint "invoices_pkey"                                                                                                                               
alter table "public"."media_files" drop constraint "media_files_pkey"                                                                                                                         
alter table "public"."ml_models" drop constraint "ml_models_pkey"                                                                                                                             
alter table "public"."model_performance_metrics" drop constraint "model_performance_metrics_pkey"                                                                                             
alter table "public"."model_predictions" drop constraint "model_predictions_pkey"                                                                                                             
alter table "public"."model_training_runs" drop constraint "model_training_runs_pkey"                                                                                                         
alter table "public"."moderation_appeals" drop constraint "moderation_appeals_pkey"                                                                                                           
alter table "public"."moderation_logs" drop constraint "moderation_logs_pkey"                                                                                                                 
alter table "public"."moderation_queue" drop constraint "moderation_queue_pkey"                                                                                                               
alter table "public"."notification_analytics" drop constraint "notification_analytics_pkey"                                                                                                   
alter table "public"."notification_queue" drop constraint "notification_queue_pkey"                                                                                                           
alter table "public"."notification_templates" drop constraint "notification_templates_pkey"                                                                                                   
alter table "public"."notifications" drop constraint "notifications_pkey"                                                                                                                     
alter table "public"."payment_audit_trail" drop constraint "payment_audit_trail_pkey"                                                                                                         
alter table "public"."payment_discrepancies" drop constraint "payment_discrepancies_pkey"                                                                                                     
alter table "public"."payment_disputes" drop constraint "payment_disputes_pkey"                                                                                                               
alter table "public"."payment_reconciliations" drop constraint "payment_reconciliations_pkey"                                                                                                 
alter table "public"."payment_refunds" drop constraint "payment_refunds_pkey"                                                                                                                 
alter table "public"."payment_reminders" drop constraint "payment_reminders_pkey"                                                                                                             
alter table "public"."payment_splits" drop constraint "payment_splits_pkey"                                                                                                                   
alter table "public"."payment_tokens" drop constraint "payment_tokens_pkey"                                                                                                                   
alter table "public"."payout_failures" drop constraint "payout_failures_pkey"                                                                                                                 
alter table "public"."payout_hold_logs" drop constraint "payout_hold_logs_pkey"                                                                                                               
alter table "public"."payout_holds" drop constraint "payout_holds_pkey"                                                                                                                       
alter table "public"."payout_holds_system" drop constraint "payout_holds_system_pkey"                                                                                                         
alter table "public"."payout_line_items" drop constraint "payout_line_items_pkey"                                                                                                             
alter table "public"."payout_schedule_jobs" drop constraint "payout_schedule_jobs_pkey"                                                                                                       
alter table "public"."personality_assessments" drop constraint "personality_assessments_pkey"                                                                                                 
alter table "public"."post_comments" drop constraint "post_comments_pkey"                                                                                                                     
alter table "public"."post_interaction_sessions" drop constraint "post_interaction_sessions_pkey"                                                                                             
alter table "public"."post_reactions" drop constraint "post_reactions_pkey"                                                                                                                   
alter table "public"."post_saves" drop constraint "post_saves_pkey"                                                                                                                           
alter table "public"."post_shares" drop constraint "post_shares_pkey"                                                                                                                         
alter table "public"."post_views" drop constraint "post_views_pkey"                                                                                                                           
alter table "public"."query_performance_logs" drop constraint "query_performance_logs_pkey"                                                                                                   
alter table "public"."reconciliation_schedules" drop constraint "reconciliation_schedules_pkey"                                                                                               
alter table "public"."refund_requests" drop constraint "refund_requests_pkey"                                                                                                                 
alter table "public"."request_invitations" drop constraint "request_invitations_pkey"                                                                                                         
alter table "public"."retraining_jobs" drop constraint "retraining_jobs_pkey"                                                                                                                 
alter table "public"."retraining_triggers" drop constraint "retraining_triggers_pkey"                                                                                                         
alter table "public"."reviews" drop constraint "reviews_pkey"                                                                                                                                 
alter table "public"."split_payment_settings" drop constraint "split_payment_settings_pkey"                                                                                                   
alter table "public"."split_payments" drop constraint "split_payments_pkey"                                                                                                                   
alter table "public"."stripe_webhook_events" drop constraint "stripe_webhook_events_pkey"                                                                                                     
alter table "public"."system_logs" drop constraint "system_logs_pkey"                                                                                                                         
alter table "public"."system_settings" drop constraint "system_settings_pkey"                                                                                                                 
alter table "public"."training_datasets" drop constraint "training_datasets_pkey"                                                                                                             
alter table "public"."trending_content" drop constraint "trending_content_pkey"                                                                                                               
alter table "public"."trip_requests" drop constraint "trip_requests_pkey"                                                                                                                     
alter table "public"."user_feed_preferences" drop constraint "user_feed_preferences_pkey"                                                                                                     
alter table "public"."user_restrictions" drop constraint "user_restrictions_pkey"                                                                                                             
alter table "public"."user_warnings" drop constraint "user_warnings_pkey"                                                                                                                     
alter table "public"."vendor_bids" drop constraint "vendor_bids_pkey"                                                                                                                         
alter table "public"."vendor_certifications" drop constraint "vendor_certifications_pkey"                                                                                                     
alter table "public"."vendor_forum_moderation_log" drop constraint "vendor_forum_moderation_log_pkey"                                                                                         
alter table "public"."vendor_forum_notifications" drop constraint "vendor_forum_notifications_pkey"                                                                                           
alter table "public"."vendor_forum_replies" drop constraint "vendor_forum_replies_pkey"                                                                                                       
alter table "public"."vendor_forum_reputation" drop constraint "vendor_forum_reputation_pkey"                                                                                                 
alter table "public"."vendor_forum_threads" drop constraint "vendor_forum_threads_pkey"                                                                                                       
alter table "public"."vendor_forum_votes" drop constraint "vendor_forum_votes_pkey"                                                                                                           
alter table "public"."vendor_forums" drop constraint "vendor_forums_pkey"                                                                                                                     
alter table "public"."vendor_insurance" drop constraint "vendor_insurance_pkey"                                                                                                               
alter table "public"."vendor_payouts" drop constraint "vendor_payouts_pkey"                                                                                                                   
alter table "public"."vendor_stripe_accounts" drop constraint "vendor_stripe_accounts_pkey"                                                                                                   
alter table "public"."vendors" drop constraint "vendors_pkey"                                                                                                                                 
alter table "public"."whatsapp_groups" drop constraint "whatsapp_groups_pkey"                                                                                                                 
alter table "public"."whatsapp_messages" drop constraint "whatsapp_messages_pkey"                                                                                                             
alter table "public"."whatsapp_webhooks" drop constraint "whatsapp_webhooks_pkey"                                                                                                             
drop index if exists "public"."ab_test_assignments_experiment_id_user_id_key"                                                                                                                 
drop index if exists "public"."ab_test_assignments_pkey"                                                                                                                                      
drop index if exists "public"."ab_test_experiments_name_key"                                                                                                                                  
drop index if exists "public"."ab_test_experiments_pkey"                                                                                                                                      
drop index if exists "public"."adventure_availability_adventure_id_date_start_time_key"                                                                                                       
drop index if exists "public"."adventure_availability_pkey"                                                                                                                                   
drop index if exists "public"."adventure_media_pkey"                                                                                                                                          
drop index if exists "public"."adventures_pkey"                                                                                                                                               
drop index if exists "public"."age_verification_logs_pkey"                                                                                                                                    
drop index if exists "public"."appeal_notes_pkey"                                                                                                                                             
drop index if exists "public"."assessment_responses_pkey"                                                                                                                                     
drop index if exists "public"."assessment_responses_user_id_question_id_key"                                                                                                                  
drop index if exists "public"."background_job_results_job_id_key"                                                                                                                             
drop index if exists "public"."background_job_results_pkey"                                                                                                                                   
drop index if exists "public"."bid_messages_pkey"                                                                                                                                             
drop index if exists "public"."booking_audit_logs_pkey"                                                                                                                                       
drop index if exists "public"."booking_cancellations_pkey"                                                                                                                                    
drop index if exists "public"."booking_disputes_pkey"                                                                                                                                         
drop index if exists "public"."booking_modifications_pkey"                                                                                                                                    
drop index if exists "public"."booking_participants_pkey"                                                                                                                                     
drop index if exists "public"."booking_payments_pkey"                                                                                                                                         
drop index if exists "public"."booking_service_disputes_pkey"                                                                                                                                 
drop index if exists "public"."bookings_booking_code_key"                                                                                                                                     
drop index if exists "public"."bookings_pkey"                                                                                                                                                 
drop index if exists "public"."community_connections_pkey"                                                                                                                                    
drop index if exists "public"."community_connections_user_id_connected_user_id_key"                                                                                                           
drop index if exists "public"."community_posts_pkey"                                                                                                                                          
drop index if exists "public"."compatibility_algorithms_name_key"                                                                                                                             
drop index if exists "public"."compatibility_algorithms_pkey"                                                                                                                                 
drop index if exists "public"."compliance_logs_pkey"                                                                                                                                          
drop index if exists "public"."connection_requests_pkey"                                                                                                                                      
drop index if exists "public"."connection_requests_requester_id_recipient_id_key"                                                                                                             
drop index if exists "public"."content_analysis_results_pkey"                                                                                                                                 
drop index if exists "public"."content_discovery_log_pkey"                                                                                                                                    
drop index if exists "public"."content_filter_rules_pkey"                                                                                                                                     
drop index if exists "public"."content_reports_pkey"                                                                                                                                          
drop index if exists "public"."content_scores_pkey"                                                                                                                                           
drop index if exists "public"."content_scores_post_id_key"                                                                                                                                    
drop index if exists "public"."cors_violations_pkey"                                                                                                                                          
drop index if exists "public"."credential_access_logs_pkey"                                                                                                                                   
drop index if exists "public"."credential_errors_pkey"                                                                                                                                        
drop index if exists "public"."currency_exchange_rates_base_currency_target_currency_valid_key"                                                                                               
drop index if exists "public"."currency_exchange_rates_pkey"                                                                                                                                  
drop index if exists "public"."dispute_threads_pkey"                                                                                                                                          
drop index if exists "public"."engagement_scores_pkey"                                                                                                                                        
drop index if exists "public"."engagement_scores_user_id_key"                                                                                                                                 
drop index if exists "public"."fcm_tokens_pkey"                                                                                                                                               
drop index if exists "public"."fcm_tokens_token_key"                                                                                                                                          
drop index if exists "public"."fcm_tokens_user_id_token_key"                                                                                                                                  
drop index if exists "public"."group_compatibility_scores_group_id_user_id_key"                                                                                                               
drop index if exists "public"."group_compatibility_scores_pkey"                                                                                                                               
drop index if exists "public"."group_invitations_invitation_code_key"                                                                                                                         
drop index if exists "public"."group_invitations_pkey"                                                                                                                                        
drop index if exists "public"."group_members_group_id_user_id_key"                                                                                                                            
drop index if exists "public"."group_members_pkey"                                                                                                                                            
drop index if exists "public"."groups_pkey"                                                                                                                                                   
drop index if exists "public"."idx_ab_test_assignments_experiment_id"                                                                                                                         
drop index if exists "public"."idx_ab_test_assignments_user_id"                                                                                                                               
drop index if exists "public"."idx_ab_test_experiments_active"                                                                                                                                
drop index if exists "public"."idx_adventure_availability_adventure_id"                                                                                                                       
drop index if exists "public"."idx_adventure_availability_available"                                                                                                                          
drop index if exists "public"."idx_adventure_availability_composite"                                                                                                                          
drop index if exists "public"."idx_adventure_availability_date"                                                                                                                               
drop index if exists "public"."idx_adventures_active"                                                                                                                                         
drop index if exists "public"."idx_adventures_category"                                                                                                                                       
drop index if exists "public"."idx_adventures_location"                                                                                                                                       
drop index if exists "public"."idx_adventures_price"                                                                                                                                          
drop index if exists "public"."idx_adventures_rating"                                                                                                                                         
drop index if exists "public"."idx_adventures_search"                                                                                                                                         
drop index if exists "public"."idx_adventures_vendor_id"                                                                                                                                      
drop index if exists "public"."idx_age_verification_logs_created_at"                                                                                                                          
drop index if exists "public"."idx_age_verification_logs_user_id"                                                                                                                             
drop index if exists "public"."idx_appeal_notes_appeal"                                                                                                                                       
drop index if exists "public"."idx_appeal_notes_created"                                                                                                                                      
drop index if exists "public"."idx_appeal_notes_moderator"                                                                                                                                    
drop index if exists "public"."idx_appeals_assigned"                                                                                                                                          
drop index if exists "public"."idx_appeals_status"                                                                                                                                            
drop index if exists "public"."idx_appeals_submitted"                                                                                                                                         
drop index if exists "public"."idx_appeals_user"                                                                                                                                              
drop index if exists "public"."idx_assessment_responses_created_at"                                                                                                                           
drop index if exists "public"."idx_assessment_responses_user_id"                                                                                                                              
drop index if exists "public"."idx_assessment_responses_user_question"                                                                                                                        
drop index if exists "public"."idx_background_job_results_expiry"                                                                                                                             
drop index if exists "public"."idx_background_job_results_lookup"                                                                                                                             
drop index if exists "public"."idx_bid_messages_moderation_status"                                                                                                                            
drop index if exists "public"."idx_bid_messages_visibility"                                                                                                                                   
drop index if exists "public"."idx_booking_audit_logs_action"                                                                                                                                 
drop index if exists "public"."idx_booking_audit_logs_actor"                                                                                                                                  
drop index if exists "public"."idx_booking_audit_logs_booking_id"                                                                                                                             
drop index if exists "public"."idx_booking_audit_logs_created_at"                                                                                                                             
drop index if exists "public"."idx_booking_cancellations_booking_id"                                                                                                                          
drop index if exists "public"."idx_booking_cancellations_status"                                                                                                                              
drop index if exists "public"."idx_booking_cancellations_type"                                                                                                                                
drop index if exists "public"."idx_booking_cancellations_user_id"                                                                                                                             
drop index if exists "public"."idx_booking_disputes_booking_id"                                                                                                                               
drop index if exists "public"."idx_booking_disputes_charge_id"                                                                                                                                
drop index if exists "public"."idx_booking_disputes_created_at"                                                                                                                               
drop index if exists "public"."idx_booking_disputes_evidence_due"                                                                                                                             
drop index if exists "public"."idx_booking_disputes_status"                                                                                                                                   
drop index if exists "public"."idx_booking_modifications_booking_id"                                                                                                                          
drop index if exists "public"."idx_booking_modifications_deadline"                                                                                                                            
drop index if exists "public"."idx_booking_modifications_modified_by"                                                                                                                         
drop index if exists "public"."idx_booking_modifications_status"                                                                                                                              
drop index if exists "public"."idx_booking_modifications_type"                                                                                                                                
drop index if exists "public"."idx_booking_participants_adventure"                                                                                                                            
drop index if exists "public"."idx_booking_participants_booking_id"                                                                                                                           
drop index if exists "public"."idx_booking_participants_user_id"                                                                                                                              
drop index if exists "public"."idx_booking_payments_booking_id"                                                                                                                               
drop index if exists "public"."idx_booking_payments_payout_id"                                                                                                                                
drop index if exists "public"."idx_booking_payments_payout_status"                                                                                                                            
drop index if exists "public"."idx_booking_payments_status"                                                                                                                                   
drop index if exists "public"."idx_booking_payments_user_id"                                                                                                                                  
drop index if exists "public"."idx_booking_payments_vendor_payout_lookup"                                                                                                                     
drop index if exists "public"."idx_booking_payments_vendor_stripe_account"                                                                                                                    
drop index if exists "public"."idx_booking_service_disputes_assigned_to"                                                                                                                      
drop index if exists "public"."idx_booking_service_disputes_booking_id"                                                                                                                       
drop index if exists "public"."idx_booking_service_disputes_status"                                                                                                                           
drop index if exists "public"."idx_booking_service_disputes_type"                                                                                                                             
drop index if exists "public"."idx_booking_service_disputes_urgency"                                                                                                                          
drop index if exists "public"."idx_booking_service_disputes_user_id"                                                                                                                          
drop index if exists "public"."idx_bookings_adventure_id"                                                                                                                                     
drop index if exists "public"."idx_bookings_adventure_status"                                                                                                                                 
drop index if exists "public"."idx_bookings_booking_date"                                                                                                                                     
drop index if exists "public"."idx_bookings_composite"                                                                                                                                        
drop index if exists "public"."idx_bookings_created_at"                                                                                                                                       
drop index if exists "public"."idx_bookings_group_id"                                                                                                                                         
drop index if exists "public"."idx_bookings_status"                                                                                                                                           
drop index if exists "public"."idx_bookings_user_id"                                                                                                                                          
drop index if exists "public"."idx_bookings_vendor_id"                                                                                                                                        
drop index if exists "public"."idx_community_connections_connected_status"                                                                                                                    
drop index if exists "public"."idx_community_connections_connected_user_id"                                                                                                                   
drop index if exists "public"."idx_community_connections_status"                                                                                                                              
drop index if exists "public"."idx_community_connections_strength"                                                                                                                            
drop index if exists "public"."idx_community_connections_user_id"                                                                                                                             
drop index if exists "public"."idx_community_posts_created_at"                                                                                                                                
drop index if exists "public"."idx_community_posts_group_id"                                                                                                                                  
drop index if exists "public"."idx_community_posts_search"                                                                                                                                    
drop index if exists "public"."idx_community_posts_user_id"                                                                                                                                   
drop index if exists "public"."idx_community_posts_user_visibility_created"                                                                                                                   
drop index if exists "public"."idx_community_posts_visibility"                                                                                                                                
drop index if exists "public"."idx_compatibility_algorithms_active"                                                                                                                           
drop index if exists "public"."idx_compatibility_scores_group_performance"                                                                                                                    
drop index if exists "public"."idx_compatibility_scores_high_quality"                                                                                                                         
drop index if exists "public"."idx_compatibility_scores_range"                                                                                                                                
drop index if exists "public"."idx_compatibility_scores_recent"                                                                                                                               
drop index if exists "public"."idx_compatibility_scores_user_group"                                                                                                                           
drop index if exists "public"."idx_compliance_logs_created_at"                                                                                                                                
drop index if exists "public"."idx_compliance_logs_event_date"                                                                                                                                
drop index if exists "public"."idx_compliance_logs_event_type"                                                                                                                                
drop index if exists "public"."idx_compliance_logs_session_id"                                                                                                                                
drop index if exists "public"."idx_content_analysis_content"                                                                                                                                  
drop index if exists "public"."idx_content_analysis_overall_score"                                                                                                                            
drop index if exists "public"."idx_content_analysis_processed"                                                                                                                                
drop index if exists "public"."idx_content_discovery_created_at"                                                                                                                              
drop index if exists "public"."idx_content_discovery_method"                                                                                                                                  
drop index if exists "public"."idx_content_discovery_post_id"                                                                                                                                 
drop index if exists "public"."idx_content_discovery_user_id"                                                                                                                                 
drop index if exists "public"."idx_content_reports_category"                                                                                                                                  
drop index if exists "public"."idx_content_reports_created"                                                                                                                                   
drop index if exists "public"."idx_content_reports_reporter"                                                                                                                                  
drop index if exists "public"."idx_content_reports_status"                                                                                                                                    
drop index if exists "public"."idx_content_scores_last_calculated"                                                                                                                            
drop index if exists "public"."idx_content_scores_post_id"                                                                                                                                    
drop index if exists "public"."idx_content_scores_total_score"                                                                                                                                
drop index if exists "public"."idx_cors_violations_endpoint"                                                                                                                                  
drop index if exists "public"."idx_cors_violations_ip_address"                                                                                                                                
drop index if exists "public"."idx_cors_violations_origin"                                                                                                                                    
drop index if exists "public"."idx_cors_violations_severity"                                                                                                                                  
drop index if exists "public"."idx_cors_violations_timestamp"                                                                                                                                 
drop index if exists "public"."idx_credential_access_logs_key"                                                                                                                                
drop index if exists "public"."idx_credential_access_logs_timestamp"                                                                                                                          
drop index if exists "public"."idx_credential_access_logs_user"                                                                                                                               
drop index if exists "public"."idx_credential_errors_key"                                                                                                                                     
drop index if exists "public"."idx_credential_errors_resolved"                                                                                                                                
drop index if exists "public"."idx_credential_errors_timestamp"                                                                                                                               
drop index if exists "public"."idx_currency_rates_base_target"                                                                                                                                
drop index if exists "public"."idx_currency_rates_valid_from"                                                                                                                                 
drop index if exists "public"."idx_dispute_threads_created_at"                                                                                                                                
drop index if exists "public"."idx_dispute_threads_dispute_id"                                                                                                                                
drop index if exists "public"."idx_dispute_threads_user_id"                                                                                                                                   
drop index if exists "public"."idx_engagement_scores_user_score"                                                                                                                              
drop index if exists "public"."idx_fcm_tokens_active"                                                                                                                                         
drop index if exists "public"."idx_fcm_tokens_user_id"                                                                                                                                        
drop index if exists "public"."idx_filter_rules_enabled"                                                                                                                                      
drop index if exists "public"."idx_filter_rules_type"                                                                                                                                         
drop index if exists "public"."idx_forum_notifications_unread"                                                                                                                                
drop index if exists "public"."idx_forum_notifications_vendor_id"                                                                                                                             
drop index if exists "public"."idx_forum_replies_created_at"                                                                                                                                  
drop index if exists "public"."idx_forum_replies_parent_reply_id"                                                                                                                             
drop index if exists "public"."idx_forum_replies_thread_id"                                                                                                                                   
drop index if exists "public"."idx_forum_replies_vendor_id"                                                                                                                                   
drop index if exists "public"."idx_forum_reputation_total_points"                                                                                                                             
drop index if exists "public"."idx_forum_reputation_vendor_id"                                                                                                                                
drop index if exists "public"."idx_forum_threads_category"                                                                                                                                    
drop index if exists "public"."idx_forum_threads_created_at"                                                                                                                                  
drop index if exists "public"."idx_forum_threads_last_reply_at"                                                                                                                               
drop index if exists "public"."idx_forum_threads_tags"                                                                                                                                        
drop index if exists "public"."idx_forum_threads_upvotes"                                                                                                                                     
drop index if exists "public"."idx_forum_threads_vendor_id"                                                                                                                                   
drop index if exists "public"."idx_forum_votes_reply_id"                                                                                                                                      
drop index if exists "public"."idx_forum_votes_thread_id"                                                                                                                                     
drop index if exists "public"."idx_forum_votes_vendor_id"                                                                                                                                     
drop index if exists "public"."idx_group_compatibility_scores_group_id"                                                                                                                       
drop index if exists "public"."idx_group_compatibility_scores_score"                                                                                                                          
drop index if exists "public"."idx_group_compatibility_scores_user_id"                                                                                                                        
drop index if exists "public"."idx_group_members_group_id"                                                                                                                                    
drop index if exists "public"."idx_group_members_group_user"                                                                                                                                  
drop index if exists "public"."idx_group_members_role"                                                                                                                                        
drop index if exists "public"."idx_group_members_user_active"                                                                                                                                 
drop index if exists "public"."idx_group_members_user_group"                                                                                                                                  
drop index if exists "public"."idx_group_members_user_id"                                                                                                                                     
drop index if exists "public"."idx_groups_active"                                                                                                                                             
drop index if exists "public"."idx_groups_active_members"                                                                                                                                     
drop index if exists "public"."idx_groups_owner_id"                                                                                                                                           
drop index if exists "public"."idx_groups_privacy"                                                                                                                                            
drop index if exists "public"."idx_individual_payments_deadline"                                                                                                                              
drop index if exists "public"."idx_individual_payments_split"                                                                                                                                 
drop index if exists "public"."idx_individual_payments_status"                                                                                                                                
drop index if exists "public"."idx_individual_payments_stripe"                                                                                                                                
drop index if exists "public"."idx_individual_payments_user"                                                                                                                                  
drop index if exists "public"."idx_invoice_line_items_invoice_id"                                                                                                                             
drop index if exists "public"."idx_invoices_booking_id"                                                                                                                                       
drop index if exists "public"."idx_invoices_created_at"                                                                                                                                       
drop index if exists "public"."idx_invoices_currency"                                                                                                                                         
drop index if exists "public"."idx_invoices_due_date"                                                                                                                                         
drop index if exists "public"."idx_invoices_invoice_number"                                                                                                                                   
drop index if exists "public"."idx_invoices_status"                                                                                                                                           
drop index if exists "public"."idx_invoices_stripe_payment_intent"                                                                                                                            
drop index if exists "public"."idx_invoices_user_id"                                                                                                                                          
drop index if exists "public"."idx_invoices_vendor_id"                                                                                                                                        
drop index if exists "public"."idx_media_files_created_at"                                                                                                                                    
drop index if exists "public"."idx_media_files_file_type"                                                                                                                                     
drop index if exists "public"."idx_media_files_user_id"                                                                                                                                       
drop index if exists "public"."idx_ml_models_created_at"                                                                                                                                      
drop index if exists "public"."idx_ml_models_name"                                                                                                                                            
drop index if exists "public"."idx_ml_models_type_status"                                                                                                                                     
drop index if exists "public"."idx_model_performance_metrics_measured_at"                                                                                                                     
drop index if exists "public"."idx_model_performance_metrics_metric_name"                                                                                                                     
drop index if exists "public"."idx_model_performance_metrics_model_id"                                                                                                                        
drop index if exists "public"."idx_model_predictions_created_at"                                                                                                                              
drop index if exists "public"."idx_model_predictions_model_id"                                                                                                                                
drop index if exists "public"."idx_model_predictions_user_id"                                                                                                                                 
drop index if exists "public"."idx_model_training_runs_created_at"                                                                                                                            
drop index if exists "public"."idx_model_training_runs_model_id"                                                                                                                              
drop index if exists "public"."idx_model_training_runs_status"                                                                                                                                
drop index if exists "public"."idx_moderation_logs_content"                                                                                                                                   
drop index if exists "public"."idx_moderation_logs_created"                                                                                                                                   
drop index if exists "public"."idx_moderation_logs_moderator"                                                                                                                                 
drop index if exists "public"."idx_moderation_logs_user"                                                                                                                                      
drop index if exists "public"."idx_moderation_queue_assigned"                                                                                                                                 
drop index if exists "public"."idx_moderation_queue_created"                                                                                                                                  
drop index if exists "public"."idx_moderation_queue_priority"                                                                                                                                 
drop index if exists "public"."idx_moderation_queue_status"                                                                                                                                   
drop index if exists "public"."idx_notification_analytics_event_type"                                                                                                                         
drop index if exists "public"."idx_notification_analytics_user_id"                                                                                                                            
drop index if exists "public"."idx_notification_queue_pending"                                                                                                                                
drop index if exists "public"."idx_notification_queue_scheduled_for"                                                                                                                          
drop index if exists "public"."idx_notification_queue_status"                                                                                                                                 
drop index if exists "public"."idx_notifications_created_at"                                                                                                                                  
drop index if exists "public"."idx_notifications_expires_at"                                                                                                                                  
drop index if exists "public"."idx_notifications_read"                                                                                                                                        
drop index if exists "public"."idx_notifications_type"                                                                                                                                        
drop index if exists "public"."idx_notifications_user_id"                                                                                                                                     
drop index if exists "public"."idx_notifications_user_type"                                                                                                                                   
drop index if exists "public"."idx_notifications_user_unread"                                                                                                                                 
drop index if exists "public"."idx_payment_audit_trail_action"                                                                                                                                
drop index if exists "public"."idx_payment_audit_trail_created_at"                                                                                                                            
drop index if exists "public"."idx_payment_audit_trail_payment"                                                                                                                               
drop index if exists "public"."idx_payment_discrepancies_reconciliation"                                                                                                                      
drop index if exists "public"."idx_payment_discrepancies_status"                                                                                                                              
drop index if exists "public"."idx_payment_discrepancies_transaction"                                                                                                                         
drop index if exists "public"."idx_payment_discrepancies_type_severity"                                                                                                                       
drop index if exists "public"."idx_payment_disputes_booking_id"                                                                                                                               
drop index if exists "public"."idx_payment_disputes_created_at"                                                                                                                               
drop index if exists "public"."idx_payment_disputes_evidence_due_by"                                                                                                                          
drop index if exists "public"."idx_payment_disputes_status"                                                                                                                                   
drop index if exists "public"."idx_payment_disputes_stripe_dispute_id"                                                                                                                        
drop index if exists "public"."idx_payment_reconciliations_date_range"                                                                                                                        
drop index if exists "public"."idx_payment_reconciliations_status"                                                                                                                            
drop index if exists "public"."idx_payment_reconciliations_vendor_account"                                                                                                                    
drop index if exists "public"."idx_payment_refunds_payment"                                                                                                                                   
drop index if exists "public"."idx_payment_refunds_refund_request_id"                                                                                                                         
drop index if exists "public"."idx_payment_refunds_split"                                                                                                                                     
drop index if exists "public"."idx_payment_refunds_stripe"                                                                                                                                    
drop index if exists "public"."idx_payment_reminders_payment"                                                                                                                                 
drop index if exists "public"."idx_payment_reminders_scheduled"                                                                                                                               
drop index if exists "public"."idx_payment_reminders_status"                                                                                                                                  
drop index if exists "public"."idx_payment_splits_booking_id"                                                                                                                                 
drop index if exists "public"."idx_payment_splits_status"                                                                                                                                     
drop index if exists "public"."idx_payment_splits_user_id"                                                                                                                                    
drop index if exists "public"."idx_payment_tokens_expires"                                                                                                                                    
drop index if exists "public"."idx_payment_tokens_individual"                                                                                                                                 
drop index if exists "public"."idx_payment_tokens_status"                                                                                                                                     
drop index if exists "public"."idx_payment_tokens_token"                                                                                                                                      
drop index if exists "public"."idx_payout_failures_next_retry_at"                                                                                                                             
drop index if exists "public"."idx_payout_failures_requires_manual_review"                                                                                                                    
drop index if exists "public"."idx_payout_failures_resolved"                                                                                                                                  
drop index if exists "public"."idx_payout_failures_vendor_account_id"                                                                                                                         
drop index if exists "public"."idx_payout_hold_logs_hold_id"                                                                                                                                  
drop index if exists "public"."idx_payout_hold_logs_timestamp"                                                                                                                                
drop index if exists "public"."idx_payout_holds_status"                                                                                                                                       
drop index if exists "public"."idx_payout_holds_system_placed_at"                                                                                                                             
drop index if exists "public"."idx_payout_holds_system_release_date"                                                                                                                          
drop index if exists "public"."idx_payout_holds_system_status"                                                                                                                                
drop index if exists "public"."idx_payout_holds_system_type"                                                                                                                                  
drop index if exists "public"."idx_payout_holds_system_vendor_account_id"                                                                                                                     
drop index if exists "public"."idx_payout_holds_vendor_account"                                                                                                                               
drop index if exists "public"."idx_payout_line_items_booking_id"                                                                                                                              
drop index if exists "public"."idx_payout_line_items_payment_id"                                                                                                                              
drop index if exists "public"."idx_payout_line_items_payout_id"                                                                                                                               
drop index if exists "public"."idx_payout_schedule_jobs_next_execution"                                                                                                                       
drop index if exists "public"."idx_payout_schedule_jobs_status"                                                                                                                               
drop index if exists "public"."idx_payout_schedule_jobs_vendor_account_id"                                                                                                                    
drop index if exists "public"."idx_personality_assessments_completed_at"                                                                                                                      
drop index if exists "public"."idx_personality_assessments_completed_at_user_id"                                                                                                              
drop index if exists "public"."idx_personality_assessments_traits"                                                                                                                            
drop index if exists "public"."idx_personality_assessments_travel_prefs"                                                                                                                      
drop index if exists "public"."idx_personality_assessments_updated_at"                                                                                                                        
drop index if exists "public"."idx_personality_assessments_user_date_range"                                                                                                                   
drop index if exists "public"."idx_personality_assessments_user_id"                                                                                                                           
drop index if exists "public"."idx_personality_assessments_user_recent"                                                                                                                       
drop index if exists "public"."idx_personality_group_pref"                                                                                                                                    
drop index if exists "public"."idx_personality_styles"                                                                                                                                        
drop index if exists "public"."idx_personality_traits"                                                                                                                                        
drop index if exists "public"."idx_post_comments_post_id"                                                                                                                                     
drop index if exists "public"."idx_post_comments_user_id"                                                                                                                                     
drop index if exists "public"."idx_post_interaction_sessions_duration"                                                                                                                        
drop index if exists "public"."idx_post_interaction_sessions_post_id"                                                                                                                         
drop index if exists "public"."idx_post_interaction_sessions_user_id"                                                                                                                         
drop index if exists "public"."idx_post_reactions_post_id"                                                                                                                                    
drop index if exists "public"."idx_post_reactions_user_id"                                                                                                                                    
drop index if exists "public"."idx_post_saves_created_at"                                                                                                                                     
drop index if exists "public"."idx_post_saves_post_id"                                                                                                                                        
drop index if exists "public"."idx_post_saves_user_id"                                                                                                                                        
drop index if exists "public"."idx_post_shares_created_at"                                                                                                                                    
drop index if exists "public"."idx_post_shares_post_id"                                                                                                                                       
drop index if exists "public"."idx_post_shares_user_id"                                                                                                                                       
drop index if exists "public"."idx_post_views_created_at"                                                                                                                                     
drop index if exists "public"."idx_post_views_post_id"                                                                                                                                        
drop index if exists "public"."idx_post_views_unique"                                                                                                                                         
drop index if exists "public"."idx_post_views_user_id"                                                                                                                                        
drop index if exists "public"."idx_profiles_account_status"                                                                                                                                   
drop index if exists "public"."idx_profiles_created_at"                                                                                                                                       
drop index if exists "public"."idx_profiles_date_of_birth_range"                                                                                                                              
drop index if exists "public"."idx_profiles_demographics"                                                                                                                                     
drop index if exists "public"."idx_profiles_encrypted_birth_date_exists"                                                                                                                      
drop index if exists "public"."idx_profiles_location"                                                                                                                                         
drop index if exists "public"."idx_profiles_restriction_expires"                                                                                                                              
drop index if exists "public"."idx_profiles_role"                                                                                                                                             
drop index if exists "public"."idx_profiles_username"                                                                                                                                         
drop index if exists "public"."idx_query_performance_analysis"                                                                                                                                
drop index if exists "public"."idx_reconciliation_schedules_next_run"                                                                                                                         
drop index if exists "public"."idx_reconciliation_schedules_vendor_account"                                                                                                                   
drop index if exists "public"."idx_refund_requests_booking_id"                                                                                                                                
drop index if exists "public"."idx_refund_requests_created_at"                                                                                                                                
drop index if exists "public"."idx_refund_requests_split_payment_id"                                                                                                                          
drop index if exists "public"."idx_refund_requests_status"                                                                                                                                    
drop index if exists "public"."idx_refund_requests_user_id"                                                                                                                                   
drop index if exists "public"."idx_retraining_jobs_created_at"                                                                                                                                
drop index if exists "public"."idx_retraining_jobs_status"                                                                                                                                    
drop index if exists "public"."idx_retraining_triggers_active"                                                                                                                                
drop index if exists "public"."idx_retraining_triggers_next_check"                                                                                                                            
drop index if exists "public"."idx_reviews_adventure_id"                                                                                                                                      
drop index if exists "public"."idx_reviews_rating"                                                                                                                                            
drop index if exists "public"."idx_reviews_user_id"                                                                                                                                           
drop index if exists "public"."idx_reviews_vendor_id"                                                                                                                                         
drop index if exists "public"."idx_split_payment_settings_split"                                                                                                                              
drop index if exists "public"."idx_split_payments_booking"                                                                                                                                    
drop index if exists "public"."idx_split_payments_deadline"                                                                                                                                   
drop index if exists "public"."idx_split_payments_organizer"                                                                                                                                  
drop index if exists "public"."idx_split_payments_status"                                                                                                                                     
drop index if exists "public"."idx_stripe_webhook_events_created_at"                                                                                                                          
drop index if exists "public"."idx_stripe_webhook_events_event_id"                                                                                                                            
drop index if exists "public"."idx_stripe_webhook_events_processed"                                                                                                                           
drop index if exists "public"."idx_stripe_webhook_events_type"                                                                                                                                
drop index if exists "public"."idx_system_settings_key"                                                                                                                                       
drop index if exists "public"."idx_training_datasets_created_at"                                                                                                                              
drop index if exists "public"."idx_training_datasets_data_source"                                                                                                                             
drop index if exists "public"."idx_trending_content_expires"                                                                                                                                  
drop index if exists "public"."idx_trending_content_score"                                                                                                                                    
drop index if exists "public"."idx_trending_content_time_window"                                                                                                                              
drop index if exists "public"."idx_trip_requests_dates"                                                                                                                                       
drop index if exists "public"."idx_trip_requests_status"                                                                                                                                      
drop index if exists "public"."idx_trip_requests_user_id"                                                                                                                                     
drop index if exists "public"."idx_user_feed_preferences_user_id"                                                                                                                             
drop index if exists "public"."idx_user_restrictions_active"                                                                                                                                  
drop index if exists "public"."idx_user_restrictions_expires"                                                                                                                                 
drop index if exists "public"."idx_user_restrictions_type"                                                                                                                                    
drop index if exists "public"."idx_user_restrictions_user"                                                                                                                                    
drop index if exists "public"."idx_user_warnings_expires"                                                                                                                                     
drop index if exists "public"."idx_user_warnings_issued"                                                                                                                                      
drop index if exists "public"."idx_user_warnings_user"                                                                                                                                        
drop index if exists "public"."idx_vendor_bids_status"                                                                                                                                        
drop index if exists "public"."idx_vendor_bids_trip_request_id"                                                                                                                               
drop index if exists "public"."idx_vendor_bids_vendor_id"                                                                                                                                     
drop index if exists "public"."idx_vendor_payouts_account_id"                                                                                                                                 
drop index if exists "public"."idx_vendor_payouts_arrival_date"                                                                                                                               
drop index if exists "public"."idx_vendor_payouts_created_at"                                                                                                                                 
drop index if exists "public"."idx_vendor_payouts_status"                                                                                                                                     
drop index if exists "public"."idx_vendor_payouts_stripe_id"                                                                                                                                  
drop index if exists "public"."idx_vendor_stripe_accounts_created_at"                                                                                                                         
drop index if exists "public"."idx_vendor_stripe_accounts_status"                                                                                                                             
drop index if exists "public"."idx_vendor_stripe_accounts_stripe_id"                                                                                                                          
drop index if exists "public"."idx_vendor_stripe_accounts_user_id"                                                                                                                            
drop index if exists "public"."idx_vendor_stripe_accounts_vendor_id"                                                                                                                          
drop index if exists "public"."idx_vendors_location"                                                                                                                                          
drop index if exists "public"."idx_vendors_rating"                                                                                                                                            
drop index if exists "public"."idx_vendors_status"                                                                                                                                            
drop index if exists "public"."idx_vendors_user_id"                                                                                                                                           
drop index if exists "public"."idx_webhook_events_alert_sent"                                                                                                                                 
drop index if exists "public"."idx_webhook_events_error_category"                                                                                                                             
drop index if exists "public"."idx_webhook_events_retry_after"                                                                                                                                
drop index if exists "public"."idx_whatsapp_groups_admin_user_id"                                                                                                                             
drop index if exists "public"."idx_whatsapp_groups_adventure_id"                                                                                                                              
drop index if exists "public"."idx_whatsapp_groups_created_at"                                                                                                                                
drop index if exists "public"."idx_whatsapp_groups_status"                                                                                                                                    
drop index if exists "public"."idx_whatsapp_messages_message_type"                                                                                                                            
drop index if exists "public"."idx_whatsapp_messages_moderation_status"                                                                                                                       
drop index if exists "public"."idx_whatsapp_messages_phone_number"                                                                                                                            
drop index if exists "public"."idx_whatsapp_messages_sent_at"                                                                                                                                 
drop index if exists "public"."idx_whatsapp_messages_status"                                                                                                                                  
drop index if exists "public"."idx_whatsapp_messages_user_id"                                                                                                                                 
drop index if exists "public"."idx_whatsapp_messages_visibility"                                                                                                                              
drop index if exists "public"."idx_whatsapp_webhooks_created_at"                                                                                                                              
drop index if exists "public"."idx_whatsapp_webhooks_event_type"                                                                                                                              
drop index if exists "public"."idx_whatsapp_webhooks_from_phone"                                                                                                                              
drop index if exists "public"."idx_whatsapp_webhooks_processed"                                                                                                                               
drop index if exists "public"."individual_payments_pkey"                                                                                                                                      
drop index if exists "public"."invoice_line_items_pkey"                                                                                                                                       
drop index if exists "public"."invoices_invoice_number_key"                                                                                                                                   
drop index if exists "public"."invoices_pkey"                                                                                                                                                 
drop index if exists "public"."media_files_pkey"                                                                                                                                              
drop index if exists "public"."ml_models_name_version_key"                                                                                                                                    
drop index if exists "public"."ml_models_pkey"                                                                                                                                                
drop index if exists "public"."model_performance_metrics_pkey"                                                                                                                                
drop index if exists "public"."model_predictions_pkey"                                                                                                                                        
drop index if exists "public"."model_training_runs_pkey"                                                                                                                                      
drop index if exists "public"."moderation_appeals_pkey"                                                                                                                                       
drop index if exists "public"."moderation_logs_pkey"                                                                                                                                          
drop index if exists "public"."moderation_queue_pkey"                                                                                                                                         
drop index if exists "public"."notification_analytics_pkey"                                                                                                                                   
drop index if exists "public"."notification_queue_pkey"                                                                                                                                       
drop index if exists "public"."notification_templates_name_key"                                                                                                                               
drop index if exists "public"."notification_templates_pkey"                                                                                                                                   
drop index if exists "public"."notifications_pkey"                                                                                                                                            
drop index if exists "public"."payment_audit_trail_pkey"                                                                                                                                      
drop index if exists "public"."payment_discrepancies_pkey"                                                                                                                                    
drop index if exists "public"."payment_disputes_pkey"                                                                                                                                         
drop index if exists "public"."payment_disputes_stripe_dispute_id_key"                                                                                                                        
drop index if exists "public"."payment_reconciliations_pkey"                                                                                                                                  
drop index if exists "public"."payment_refunds_pkey"                                                                                                                                          
drop index if exists "public"."payment_reminders_pkey"                                                                                                                                        
drop index if exists "public"."payment_splits_pkey"                                                                                                                                           
drop index if exists "public"."payment_tokens_pkey"                                                                                                                                           
drop index if exists "public"."payment_tokens_token_key"                                                                                                                                      
drop index if exists "public"."payout_failures_pkey"                                                                                                                                          
drop index if exists "public"."payout_hold_logs_pkey"                                                                                                                                         
drop index if exists "public"."payout_holds_pkey"                                                                                                                                             
drop index if exists "public"."payout_holds_system_pkey"                                                                                                                                      
drop index if exists "public"."payout_line_items_pkey"                                                                                                                                        
drop index if exists "public"."payout_schedule_jobs_pkey"                                                                                                                                     
drop index if exists "public"."personality_assessments_pkey"                                                                                                                                  
drop index if exists "public"."personality_assessments_user_id_key"                                                                                                                           
drop index if exists "public"."post_comments_pkey"                                                                                                                                            
drop index if exists "public"."post_interaction_sessions_pkey"                                                                                                                                
drop index if exists "public"."post_reactions_pkey"                                                                                                                                           
drop index if exists "public"."post_reactions_post_id_user_id_key"                                                                                                                            
drop index if exists "public"."post_saves_pkey"                                                                                                                                               
drop index if exists "public"."post_saves_post_id_user_id_key"                                                                                                                                
drop index if exists "public"."post_shares_pkey"                                                                                                                                              
drop index if exists "public"."post_views_pkey"                                                                                                                                               
drop index if exists "public"."profiles_username_key"                                                                                                                                         
drop index if exists "public"."query_performance_logs_pkey"                                                                                                                                   
drop index if exists "public"."reconciliation_schedules_pkey"                                                                                                                                 
drop index if exists "public"."refund_requests_pkey"                                                                                                                                          
drop index if exists "public"."request_invitations_pkey"                                                                                                                                      
drop index if exists "public"."request_invitations_trip_request_id_vendor_id_key"                                                                                                             
drop index if exists "public"."retraining_jobs_pkey"                                                                                                                                          
drop index if exists "public"."retraining_triggers_name_key"                                                                                                                                  
drop index if exists "public"."retraining_triggers_pkey"                                                                                                                                      
drop index if exists "public"."reviews_booking_id_user_id_key"                                                                                                                                
drop index if exists "public"."reviews_pkey"                                                                                                                                                  
drop index if exists "public"."split_payment_settings_pkey"                                                                                                                                   
drop index if exists "public"."split_payments_pkey"                                                                                                                                           
drop index if exists "public"."stripe_webhook_events_pkey"                                                                                                                                    
drop index if exists "public"."stripe_webhook_events_stripe_event_id_key"                                                                                                                     
drop index if exists "public"."system_logs_pkey"                                                                                                                                              
drop index if exists "public"."system_settings_pkey"                                                                                                                                          
drop index if exists "public"."system_settings_setting_key_key"                                                                                                                               
drop index if exists "public"."training_datasets_pkey"                                                                                                                                        
drop index if exists "public"."trending_content_pkey"                                                                                                                                         
drop index if exists "public"."trending_content_post_id_time_window_hours_key"                                                                                                                
drop index if exists "public"."trip_requests_pkey"                                                                                                                                            
drop index if exists "public"."user_feed_preferences_pkey"                                                                                                                                    
drop index if exists "public"."user_feed_preferences_user_id_key"                                                                                                                             
drop index if exists "public"."user_restrictions_pkey"                                                                                                                                        
drop index if exists "public"."user_warnings_pkey"                                                                                                                                            
drop index if exists "public"."vendor_bids_pkey"                                                                                                                                              
drop index if exists "public"."vendor_bids_trip_request_id_vendor_id_key"                                                                                                                     
drop index if exists "public"."vendor_certifications_pkey"                                                                                                                                    
drop index if exists "public"."vendor_forum_moderation_log_pkey"                                                                                                                              
drop index if exists "public"."vendor_forum_notifications_pkey"                                                                                                                               
drop index if exists "public"."vendor_forum_replies_pkey"                                                                                                                                     
drop index if exists "public"."vendor_forum_reputation_pkey"                                                                                                                                  
drop index if exists "public"."vendor_forum_reputation_vendor_id_key"                                                                                                                         
drop index if exists "public"."vendor_forum_threads_pkey"                                                                                                                                     
drop index if exists "public"."vendor_forum_votes_pkey"                                                                                                                                       
drop index if exists "public"."vendor_forum_votes_vendor_id_reply_id_key"                                                                                                                     
drop index if exists "public"."vendor_forum_votes_vendor_id_thread_id_key"                                                                                                                    
drop index if exists "public"."vendor_forums_pkey"                                                                                                                                            
drop index if exists "public"."vendor_insurance_pkey"                                                                                                                                         
drop index if exists "public"."vendor_payouts_pkey"                                                                                                                                           
drop index if exists "public"."vendor_payouts_stripe_payout_id_key"                                                                                                                           
drop index if exists "public"."vendor_stripe_accounts_pkey"                                                                                                                                   
drop index if exists "public"."vendor_stripe_accounts_stripe_account_id_key"                                                                                                                  
drop index if exists "public"."vendors_pkey"                                                                                                                                                  
drop index if exists "public"."vendors_user_id_key"                                                                                                                                           
drop index if exists "public"."whatsapp_groups_pkey"                                                                                                                                          
drop index if exists "public"."whatsapp_messages_pkey"                                                                                                                                        
drop index if exists "public"."whatsapp_webhooks_pkey"                                                                                                                                        
drop table "public"."ab_test_assignments"                                                                                                                                                     
drop table "public"."ab_test_experiments"                                                                                                                                                     
drop table "public"."adventure_availability"                                                                                                                                                  
drop table "public"."adventure_media"                                                                                                                                                         
drop table "public"."adventures"                                                                                                                                                              
drop table "public"."age_verification_logs"                                                                                                                                                   
drop table "public"."appeal_notes"                                                                                                                                                            
drop table "public"."assessment_responses"                                                                                                                                                    
drop table "public"."background_job_results"                                                                                                                                                  
drop table "public"."bid_messages"                                                                                                                                                            
drop table "public"."booking_audit_logs"                                                                                                                                                      
drop table "public"."booking_cancellations"                                                                                                                                                   
drop table "public"."booking_disputes"                                                                                                                                                        
drop table "public"."booking_modifications"                                                                                                                                                   
drop table "public"."booking_participants"                                                                                                                                                    
drop table "public"."booking_payments"                                                                                                                                                        
drop table "public"."booking_service_disputes"                                                                                                                                                
drop table "public"."bookings"                                                                                                                                                                
drop table "public"."community_connections"                                                                                                                                                   
drop table "public"."community_posts"                                                                                                                                                         
drop table "public"."compatibility_algorithms"                                                                                                                                                
drop table "public"."compliance_logs"                                                                                                                                                         
drop table "public"."connection_requests"                                                                                                                                                     
drop table "public"."content_analysis_results"                                                                                                                                                
drop table "public"."content_discovery_log"                                                                                                                                                   
drop table "public"."content_filter_rules"                                                                                                                                                    
drop table "public"."content_reports"                                                                                                                                                         
drop table "public"."content_scores"                                                                                                                                                          
drop table "public"."cors_violations"                                                                                                                                                         
drop table "public"."credential_access_logs"                                                                                                                                                  
drop table "public"."credential_errors"                                                                                                                                                       
drop table "public"."currency_exchange_rates"                                                                                                                                                 
drop table "public"."dispute_threads"                                                                                                                                                         
drop table "public"."engagement_scores"                                                                                                                                                       
drop table "public"."fcm_tokens"                                                                                                                                                              
drop table "public"."group_compatibility_scores"                                                                                                                                              
drop table "public"."group_invitations"                                                                                                                                                       
drop table "public"."group_members"                                                                                                                                                           
drop table "public"."groups"                                                                                                                                                                  
drop table "public"."individual_payments"                                                                                                                                                     
drop table "public"."invoice_line_items"                                                                                                                                                      
drop table "public"."invoices"                                                                                                                                                                
drop table "public"."media_files"                                                                                                                                                             
drop table "public"."ml_models"                                                                                                                                                               
drop table "public"."model_performance_metrics"                                                                                                                                               
drop table "public"."model_predictions"                                                                                                                                                       
drop table "public"."model_training_runs"                                                                                                                                                     
drop table "public"."moderation_appeals"                                                                                                                                                      
drop table "public"."moderation_logs"                                                                                                                                                         
drop table "public"."moderation_queue"                                                                                                                                                        
drop table "public"."notification_analytics"                                                                                                                                                  
drop table "public"."notification_queue"                                                                                                                                                      
drop table "public"."notification_templates"                                                                                                                                                  
drop table "public"."notifications"                                                                                                                                                           
drop table "public"."payment_audit_trail"                                                                                                                                                     
drop table "public"."payment_discrepancies"                                                                                                                                                   
drop table "public"."payment_disputes"                                                                                                                                                        
drop table "public"."payment_reconciliations"                                                                                                                                                 
drop table "public"."payment_refunds"                                                                                                                                                         
drop table "public"."payment_reminders"                                                                                                                                                       
drop table "public"."payment_splits"                                                                                                                                                          
drop table "public"."payment_tokens"                                                                                                                                                          
drop table "public"."payout_failures"                                                                                                                                                         
drop table "public"."payout_hold_logs"                                                                                                                                                        
drop table "public"."payout_holds"                                                                                                                                                            
drop table "public"."payout_holds_system"                                                                                                                                                     
drop table "public"."payout_line_items"                                                                                                                                                       
drop table "public"."payout_schedule_jobs"                                                                                                                                                    
drop table "public"."personality_assessments"                                                                                                                                                 
drop table "public"."post_comments"                                                                                                                                                           
drop table "public"."post_interaction_sessions"                                                                                                                                               
drop table "public"."post_reactions"                                                                                                                                                          
drop table "public"."post_saves"                                                                                                                                                              
drop table "public"."post_shares"                                                                                                                                                             
drop table "public"."post_views"                                                                                                                                                              
drop table "public"."query_performance_logs"                                                                                                                                                  
drop table "public"."reconciliation_schedules"                                                                                                                                                
drop table "public"."refund_requests"                                                                                                                                                         
drop table "public"."request_invitations"                                                                                                                                                     
drop table "public"."retraining_jobs"                                                                                                                                                         
drop table "public"."retraining_triggers"                                                                                                                                                     
drop table "public"."reviews"                                                                                                                                                                 
drop table "public"."split_payment_settings"                                                                                                                                                  
drop table "public"."split_payments"                                                                                                                                                          
drop table "public"."stripe_webhook_events"                                                                                                                                                   
drop table "public"."system_logs"                                                                                                                                                             
drop table "public"."system_settings"                                                                                                                                                         
drop table "public"."training_datasets"                                                                                                                                                       
drop table "public"."trending_content"                                                                                                                                                        
drop table "public"."trip_requests"                                                                                                                                                           
drop table "public"."user_feed_preferences"                                                                                                                                                   
drop table "public"."user_restrictions"                                                                                                                                                       
drop table "public"."user_warnings"                                                                                                                                                           
drop table "public"."vendor_bids"                                                                                                                                                             
drop table "public"."vendor_certifications"                                                                                                                                                   
drop table "public"."vendor_forum_moderation_log"                                                                                                                                             
drop table "public"."vendor_forum_notifications"                                                                                                                                              
drop table "public"."vendor_forum_replies"                                                                                                                                                    
drop table "public"."vendor_forum_reputation"                                                                                                                                                 
drop table "public"."vendor_forum_threads"                                                                                                                                                    
drop table "public"."vendor_forum_votes"                                                                                                                                                      
drop table "public"."vendor_forums"                                                                                                                                                           
drop table "public"."vendor_insurance"                                                                                                                                                        
drop table "public"."vendor_payouts"                                                                                                                                                          
drop table "public"."vendor_stripe_accounts"                                                                                                                                                  
drop table "public"."vendors"                                                                                                                                                                 
drop table "public"."whatsapp_groups"                                                                                                                                                         
drop table "public"."whatsapp_messages"                                                                                                                                                       
drop table "public"."whatsapp_webhooks"                                                                                                                                                       
alter table "public"."profiles" drop column "account_status"                                                                                                                                  
alter table "public"."profiles" drop column "avatar_url"                                                                                                                                      
alter table "public"."profiles" drop column "bio"                                                                                                                                             
alter table "public"."profiles" drop column "date_of_birth"                                                                                                                                   
alter table "public"."profiles" drop column "email_verified"                                                                                                                                  
alter table "public"."profiles" drop column "encrypted_birth_date"                                                                                                                            
alter table "public"."profiles" drop column "full_name"                                                                                                                                       
alter table "public"."profiles" drop column "is_verified"                                                                                                                                     
alter table "public"."profiles" drop column "location"                                                                                                                                        
alter table "public"."profiles" drop column "phone_number"                                                                                                                                    
alter table "public"."profiles" drop column "phone_verified"                                                                                                                                  
alter table "public"."profiles" drop column "reputation_score"                                                                                                                                
alter table "public"."profiles" drop column "restriction_expires"                                                                                                                             
alter table "public"."profiles" drop column "role"                                                                                                                                            
alter table "public"."profiles" drop column "updated_at"                                                                                                                                      
alter table "public"."profiles" drop column "username"                                                                                                                                        
alter table "public"."profiles" drop column "warning_count"                                                                                                                                   
alter table "public"."profiles" alter column "created_at" drop not null                                                                                                                       
alter table "public"."user_preferences" drop column "booking_notifications"                                                                                                                   
alter table "public"."user_preferences" drop column "currency"                                                                                                                                
alter table "public"."user_preferences" drop column "email_notifications"                                                                                                                     
alter table "public"."user_preferences" drop column "group_notifications"                                                                                                                     
alter table "public"."user_preferences" drop column "language"                                                                                                                                
alter table "public"."user_preferences" drop column "marketing_emails"                                                                                                                        
alter table "public"."user_preferences" drop column "marketing_notifications"                                                                                                                 
alter table "public"."user_preferences" drop column "notification_frequency"                                                                                                                  
alter table "public"."user_preferences" drop column "privacy_level"                                                                                                                           
alter table "public"."user_preferences" drop column "push_notifications"                                                                                                                      
alter table "public"."user_preferences" drop column "sms_notifications"                                                                                                                       
alter table "public"."user_preferences" drop column "theme"                                                                                                                                   
alter table "public"."user_preferences" drop column "timezone"                                                                                                                                
alter table "public"."user_preferences" drop column "vendor_offers_notifications"                                                                                                             
alter table "public"."user_preferences" drop column "whatsapp_notifications"                                                                                                                  
alter table "public"."user_preferences" drop column "whatsapp_preferences"                                                                                                                    
alter table "public"."user_preferences" alter column "created_at" drop not null                                                                                                               
alter table "public"."user_preferences" alter column "updated_at" drop not null                                                                                                               
drop type "public"."adventure_category"                                                                                                                                                       
drop type "public"."bid_status"                                                                                                                                                               
drop type "public"."booking_status"                                                                                                                                                           
drop type "public"."connection_status"                                                                                                                                                        
drop type "public"."difficulty_level"                                                                                                                                                         
drop type "public"."forum_category"                                                                                                                                                           
drop type "public"."group_member_role"                                                                                                                                                        
drop type "public"."group_privacy"                                                                                                                                                            
drop type "public"."model_status"                                                                                                                                                             
drop type "public"."notification_type"                                                                                                                                                        
drop type "public"."payment_method"                                                                                                                                                           
drop type "public"."payment_status"                                                                                                                                                           
drop type "public"."payout_hold_status"                                                                                                                                                       
drop type "public"."payout_hold_type"                                                                                                                                                         
drop type "public"."payout_status"                                                                                                                                                            
drop type "public"."post_visibility"                                                                                                                                                          
drop type "public"."stripe_account_status"                                                                                                                                                    
drop type "public"."stripe_account_type"                                                                                                                                                      
drop type "public"."training_data_source"                                                                                                                                                     
drop type "public"."user_role"                                                                                                                                                                
drop type "public"."vendor_status"                                                                                                                                                            
drop policy "Admins can upload dispute evidence" on "storage"."objects"                                                                                                                       
drop policy "Admins can view all dispute evidence" on "storage"."objects"                                                                                                                     
drop policy "Anyone can view media files" on "storage"."objects"                                                                                                                              
drop policy "Authenticated users can upload media" on "storage"."objects"                                                                                                                     
drop policy "Users can manage their own media" on "storage"."objects"                                                                                                                         
drop policy "Users can upload dispute evidence" on "storage"."objects"                                                                                                                        
drop policy "Users can view their dispute evidence" on "storage"."objects"                                                                                                                    
alter table "storage"."buckets" drop constraint "buckets_owner_fkey"                                                                                                                          
alter table "storage"."objects" drop constraint "objects_owner_fkey"                                                                                                                          
drop function if exists "storage"."search"(prefix text, bucketname text, limits integer, levels integer, offsets integer)                                                                     
A new version of Supabase CLI is available: v2.47.2 (currently installed v2.39.2)
We recommend updating regularly for new features and bug fixes: https://supabase.com/docs/guides/cli/getting-started#updating-the-supabase-cli
