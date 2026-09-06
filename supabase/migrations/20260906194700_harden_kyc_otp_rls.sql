alter table public.kyc_face_otp_challenges enable row level security;
revoke all on table public.kyc_face_otp_challenges from anon,authenticated;
