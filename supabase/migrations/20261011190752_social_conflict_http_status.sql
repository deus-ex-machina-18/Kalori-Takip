-- Expected application conflicts return HTTP 409. SQLSTATE 40001 causes
-- PostgREST 14 to retry these transactions indefinitely. Keep applied history intact.
create or replace function kalori_private.run(action text,payload jsonb,operation_id uuid) returns jsonb
 language plpgsql security definer set search_path='' as $$
 #variable_conflict use_variable
 declare me uuid=auth.uid(); target uuid; gid uuid; cid uuid; token uuid; response jsonb; saved record;
 acct kalori_private.accounts; inv kalori_private.invites; ch kalori_private.challenges; snap kalori_private.snapshots;
 role_name text; p jsonb; d jsonb; today date; personal integer; label_name text; item jsonb;
 begin
 if me is null or not exists(select 1 from auth.users where id=me) then raise exception 'Oturum açmalısın.' using errcode='42501'; end if;
 if octet_length(coalesce(payload,'{}')::text)>2100000 then raise exception 'İstek çok büyük.'; end if;
 -- Serialize a user's writes and protect account creation/operation replay.
 perform pg_advisory_xact_lock(hashtextextended(me::text,0));
 if action in ('state','snapshot_get') then
 if action='state' then return kalori_private.state(me); end if;
 select * into snap from kalori_private.snapshots where user_id=me;
 return jsonb_build_object('revision',coalesce(snap.revision,0),'data',coalesce(snap.data,'{}'));
 end if;
 if operation_id is null then raise exception 'İşlem kimliği gerekli.'; end if;
 select * into saved from kalori_private.operations where user_id=me and id=operation_id;
 if found then
 if saved.request_hash<>md5(jsonb_build_object('action',action,'payload',payload)::text) then raise exception 'İşlem kimliği başka veri için kullanılmış.' using errcode='PT409'; end if;
 if action='snapshot_save' then select * into snap from kalori_private.snapshots where user_id=me; return jsonb_build_object('revision',snap.revision,'data',snap.data); end if;
 return saved.response;
 end if;
 if (select count(*) from kalori_private.operations where user_id=me and created_at>now()-interval '1 hour')>=300 then raise exception 'İşlem sınırına ulaştın. Bir süre sonra tekrar dene.'; end if;
 if action='account_save' then
 if exists(select 1 from kalori_private.accounts where username=lower(payload->>'username') and id<>me) then raise exception 'Bu kullanıcı adı alınmış.'; end if;
 insert into kalori_private.accounts(id,username,name,bio,avatar) values(me,lower(payload->>'username'),trim(payload->>'name'),coalesce(payload->>'bio',''),coalesce(payload->>'avatar','cat'))
 on conflict(id) do update set username=excluded.username,name=excluded.name,bio=excluded.bio,avatar=excluded.avatar;
 response=kalori_private.card(me);
 else
 select * into acct from kalori_private.accounts where id=me;
 if not found then raise exception 'Önce sosyal profilini oluştur.'; end if;
 target=case when action in ('friend_request','friend_accept','friend_remove','block','unblock','member_remove','member_role','support') then nullif(payload->>'target','')::uuid else null end; gid=nullif(payload->>'groupId','')::uuid; cid=nullif(payload->>'challengeId','')::uuid;
 label_name=acct.name;
 if action='snapshot_save' then
 d=payload->'data'; perform kalori_private.validate_snapshot(me,d);
 insert into kalori_private.snapshots(user_id) values(me) on conflict do nothing;
 select * into snap from kalori_private.snapshots where user_id=me for update;
 if snap.revision<>(payload->>'revision')::bigint then raise exception 'Kayıtlar başka cihazda değişti. Güncel kayıtları yükle.' using errcode='PT409'; end if;
 update kalori_private.snapshots set revision=revision+1,data=d where user_id=me returning * into snap;
 perform kalori_private.score(me,d);
 response=jsonb_build_object('revision',snap.revision,'data',d);
 elsif action='prefs_save' then
 p=payload;
 if p->>'audience' is null or p->>'audience' not in ('friends','selected','groups') or jsonb_typeof(p->'ids') is distinct from 'array' or jsonb_typeof(p->'fields') is distinct from 'array' or jsonb_typeof(p->'enabled') is distinct from 'boolean' then raise exception 'Paylaşım ayarları geçersiz.'; end if;
 if exists(select 1 from jsonb_array_elements_text(p->'fields') f where f not in ('record','calories','movement','water','weight')) then raise exception 'Paylaşım alanı geçersiz.'; end if;
 if jsonb_array_length(p->'ids')>100 then raise exception 'Çok fazla paylaşım hedefi.'; end if;
 update kalori_private.accounts set prefs=p where id=me; response=p;
 elsif action='friend_request' then
 if target is null then select id into target from kalori_private.accounts where username=lower(payload->>'query') or code::text=payload->>'query'; end if;
 if target is null or target=me or kalori_private.blocked(me,target) then raise exception 'Kullanıcı bulunamadı veya istek gönderilemiyor.'; end if;
 insert into kalori_private.friendships(sender,recipient) values(me,target) on conflict do nothing;
 if found then perform kalori_private.notify(target,me,'friend',label_name||' arkadaşlık isteği gönderdi.'); end if; response='{}';
 elsif action='friend_accept' then
 update kalori_private.friendships set status='accepted' where sender=target and recipient=me and status='pending' and not kalori_private.blocked(me,target);
 if not found then raise exception 'Bu arkadaşlık isteği artık geçerli değil.'; end if;
 perform kalori_private.notify(target,me,'friend',label_name||' arkadaşlık isteğini kabul etti.'); response='{}';
 elsif action='friend_remove' then
 delete from kalori_private.friendships where (sender=me and recipient=target)or(sender=target and recipient=me); response='{}';
 elsif action='block' then
 if target=me or not exists(select 1 from kalori_private.accounts where id=target) then raise exception 'Geçersiz kullanıcı.'; end if;
 insert into kalori_private.blocks values(me,target) on conflict do nothing;
 delete from kalori_private.friendships where (sender=me and recipient=target)or(sender=target and recipient=me);
 response='{}';
 elsif action='unblock' then delete from kalori_private.blocks b where b.owner=me and b.target=target; response='{}';
 elsif action='group_create' then
 if (select count(*) from kalori_private.members where user_id=me)>=20 then raise exception 'Grup sınırına ulaştın.'; end if;
 if not exists(select 1 from pg_timezone_names where name=coalesce(payload->>'zone','Europe/Istanbul')) then raise exception 'Saat dilimi geçersiz.'; end if;
 insert into kalori_private.groups(owner,name,zone) values(me,trim(payload->>'name'),coalesce(payload->>'zone','Europe/Istanbul')) returning id into gid;
 insert into kalori_private.members values(gid,me,'owner'); response=jsonb_build_object('groupId',gid);
 elsif action in ('group_leave','member_remove','member_role') then
 select role into role_name from kalori_private.members where group_id=gid and user_id=me;
 if role_name is null then raise exception 'Bu gruba erişimin yok.' using errcode='42501'; end if;
 if action='group_leave' then
 if role_name='owner' then raise exception 'Grup sahibi ayrılmadan önce sahipliği devretmeli.'; end if;
 delete from kalori_private.members where group_id=gid and user_id=me;
 delete from kalori_private.participants where user_id=me and challenge_id in(select id from kalori_private.challenges where group_id=gid);
 elsif action='member_remove' then
 if role_name not in ('owner','admin') or (select role from kalori_private.members where group_id=gid and user_id=target)='owner' or (role_name='admin' and (select role from kalori_private.members where group_id=gid and user_id=target)='admin') then raise exception 'Bu üyeyi çıkaramazsın.' using errcode='42501'; end if;
 delete from kalori_private.members where group_id=gid and user_id=target;
 delete from kalori_private.participants where user_id=target and challenge_id in(select id from kalori_private.challenges where group_id=gid);
 else
 if role_name<>'owner' or target=me or payload->>'role' not in ('admin','member','owner') then raise exception 'Rolü değiştiremezsin.' using errcode='42501'; end if;
 if not exists(select 1 from kalori_private.members where group_id=gid and user_id=target) then raise exception 'Üye bulunamadı.'; end if;
 if payload->>'role'='owner' then
 update kalori_private.members set role='admin' where group_id=gid and user_id=me;
 update kalori_private.groups set owner=target where id=gid;
 end if;
 update kalori_private.members set role=payload->>'role' where group_id=gid and user_id=target;
 end if; response='{}';
 elsif action='invite_create' then
 if gid is not null and not exists(select 1 from kalori_private.members where group_id=gid and user_id=me and role in ('owner','admin')) then raise exception 'Grup daveti oluşturamazsın.' using errcode='42501'; end if;
 insert into kalori_private.invites(owner,group_id,max_uses) values(me,gid,case when gid is null then 1 else 20 end) returning * into inv;
 response=jsonb_build_object('token',inv.token,'id',inv.id,'expiresAt',inv.expires_at);
 elsif action='invite_revoke' then
 update kalori_private.invites set revoked=true where id=(payload->>'id')::uuid and owner=me; response='{}';
 elsif action='invite_redeem' then
 token=(payload->>'token')::uuid;
 select * into inv from kalori_private.invites i where i.token=token for update;
 if not found or inv.revoked or inv.expires_at<=now() or inv.owner=me or kalori_private.blocked(me,inv.owner) then raise exception 'Davet geçersiz veya süresi dolmuş.'; end if;
 if exists(select 1 from kalori_private.redemptions where invite_id=inv.id and user_id=me) then response='{}';
 else
 if inv.uses>=inv.max_uses then raise exception 'Davet kullanım sınırına ulaştı.'; end if;
 if inv.group_id is null then
 insert into kalori_private.friendships(sender,recipient) values(me,inv.owner) on conflict do nothing;
 perform kalori_private.notify(inv.owner,me,'friend',label_name||' davetinden arkadaşlık isteği gönderdi.');
 else
 if not exists(select 1 from kalori_private.members where group_id=inv.group_id and user_id=inv.owner and role in ('owner','admin')) then raise exception 'Davet yetkisi sona ermiş.'; end if;
 if (select count(*) from kalori_private.members where group_id=inv.group_id)>=50 or (select count(*) from kalori_private.members where user_id=me)>=20 then raise exception 'Grup üye sınırına ulaşıldı.'; end if;
 insert into kalori_private.members values(inv.group_id,me,'member') on conflict do nothing;
 perform kalori_private.notify(inv.owner,me,'group',label_name||' grubuna katıldı.');
 end if;
 insert into kalori_private.redemptions values(inv.id,me);
 update kalori_private.invites set uses=uses+1 where id=inv.id; response='{}';
 end if;
 elsif action='challenge_create' then
 if not exists(select 1 from kalori_private.members where group_id=gid and user_id=me) then raise exception 'Grup üyesi olmalısın.' using errcode='42501'; end if;
 if (select count(*) from kalori_private.challenges where group_id=gid and ends>=current_date)>=10 then raise exception 'Aktif challenge sınırına ulaşıldı.'; end if;
 select zone into role_name from kalori_private.groups where id=gid;
 today=(now() at time zone role_name)::date;
 if (payload->>'starts')::date<today or (payload->>'starts')::date>today+30 then raise exception 'Başlangıç bugün ile 30 gün sonrası arasında olmalı.'; end if;
 insert into kalori_private.challenges(group_id,creator,name,kind,mode,starts,ends,zone,target)
 values(gid,me,trim(payload->>'name'),payload->>'kind',payload->>'mode',(payload->>'starts')::date,(payload->>'starts')::date+(payload->>'duration')::integer-1,role_name,case when payload->>'kind'='movement' then (payload->>'target')::integer else 1 end) returning * into ch;
 response=jsonb_build_object('challengeId',ch.id);
 for target in select user_id from kalori_private.members where group_id=gid and user_id<>me and not kalori_private.blocked(me,user_id) loop
 perform kalori_private.notify(target,me,'challenge',label_name||' yeni bir challenge başlattı.'); end loop;
 elsif action='challenge_join' then
 select * into ch from kalori_private.challenges where id=cid;
 if not found or not exists(select 1 from kalori_private.members where group_id=ch.group_id and user_id=me) then raise exception 'Challenge erişimi yok.' using errcode='42501'; end if;
 if (now() at time zone ch.zone)::date>ch.starts then raise exception 'Katılım süresi doldu.'; end if;
 select data into d from kalori_private.snapshots where user_id=me;
 personal=case when ch.kind='water' then coalesce((d->'water'->>'target')::integer,2500) else ch.target end;
 insert into kalori_private.participants values(ch.id,me,personal,now()) on conflict do nothing;
 perform kalori_private.score(me,coalesce(d,'{}')); response='{}';
 elsif action='notifications_read' then update kalori_private.notifications set read=true where user_id=me; response='{}';
 elsif action='support' then
 if not kalori_private.friends(me,target) then raise exception 'Arkadaşına destek gönderebilirsin.'; end if;
 if not exists(select 1 from kalori_private.notifications where user_id=target and actor=me and kind='support' and created_at::date=current_date) then perform kalori_private.notify(target,me,'support',label_name||' sana alkış gönderdi!'); end if; response='{}';
 else raise exception 'Bilinmeyen işlem.'; end if;
 end if;
 insert into kalori_private.operations(user_id,id,request_hash,response) values(me,operation_id,md5(jsonb_build_object('action',action,'payload',payload)::text),case when action='snapshot_save' then response-'data' else response end);
 return response;
 end $$;
