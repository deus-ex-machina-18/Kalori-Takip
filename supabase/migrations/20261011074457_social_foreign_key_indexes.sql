-- Cover foreign keys used by membership cleanup and account deletion.
create index challenge_creator on kalori_private.challenges(creator);
create index invites_group on kalori_private.invites(group_id);
create index redemptions_user on kalori_private.redemptions(user_id,invite_id);
create index notifications_actor on kalori_private.notifications(actor);
