# Supabase database notes

Both frontend codebases now use the existing shared production schema in the `RTCrackers` project (`hhbpyxhtksgbkaigeutl`). No new tables are required for the catalogue integrations in this delivery.

The folders `review_only_not_for_db_push/` and `legacy_reference_not_for_current_schema/` preserve SQL from earlier iterations. They are deliberately outside the Supabase CLI `migrations/` directory because their versions do not match the remote migration history or their table assumptions do not match the verified production schema. **Do not apply them directly.** Review/rebase any desired change against the current live schema and its migration history first.

The live database changes made during this update were limited to SEO/page-content data (`web_seo`, `web_pages`, `web_page_sections`); no DDL, policy or order-RPC migration was applied.
