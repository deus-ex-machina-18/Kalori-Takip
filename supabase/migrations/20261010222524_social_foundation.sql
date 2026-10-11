-- All data is in an unexposed schema. One authenticated invoker RPC delegates to
-- a deliberately privileged transaction with explicit authorization per action.
create schema kalori_private;
revoke all on schema kalori_private from public, anon, authenticated;
create table kalori_private.accounts (
 id uuid primary key references auth.users(id) on delete cascade,
 username text unique not null check(username ~ '^[a-z0-9_]{3,24}$'),
 name text not null check(length(name) between 1 and 40),
 bio text not null default '' check(length(bio)<=160),
 avatar text not null default 'cat' check(avatar in ('cat','shoe','bike','water','target')),
 code uuid unique not null default gen_random_uuid(),
 prefs jsonb not null default '{"enabled":false,"audience":"friends","ids":[],"fields":[]}',
 created_at timestamptz not null default now()
);
create table kalori_private.snapshots (
 user_id uuid primary key references auth.users(id) on delete cascade,
 revision bigint not null default 0, data jsonb not null default '{}'
);
create table kalori_private.operations (
 user_id uuid references auth.users(id) on delete cascade, id uuid,
 request_hash text not null, response jsonb not null, created_at timestamptz not null default now(),
 primary key(user_id,id)
);
create index operations_time on kalori_private.operations(user_id,created_at);
create table kalori_private.friendships (
 sender uuid not null references kalori_private.accounts(id) on delete cascade,
 recipient uuid not null references kalori_private.accounts(id) on delete cascade,
 status text not null default 'pending' check(status in ('pending','accepted')),
 created_at timestamptz not null default now(), check(sender<>recipient),
 primary key(sender,recipient)
);
create unique index friendship_pair on kalori_private.friendships(least(sender,recipient),greatest(sender,recipient));
create index friendship_recipient on kalori_private.friendships(recipient,status);
create table kalori_private.blocks (
 owner uuid references kalori_private.accounts(id) on delete cascade,
 target uuid references kalori_private.accounts(id) on delete cascade,
 primary key(owner,target), check(owner<>target)
);
create index blocks_target on kalori_private.blocks(target,owner);
create table kalori_private.groups (
 id uuid primary key default gen_random_uuid(),
 owner uuid not null references kalori_private.accounts(id),
 name text not null check(length(name) between 1 and 60),
 zone text not null default 'Europe/Istanbul', created_at timestamptz not null default now()
);
create index groups_owner on kalori_private.groups(owner);
create table kalori_private.members (
 group_id uuid references kalori_private.groups(id) on delete cascade,
 user_id uuid references kalori_private.accounts(id) on delete cascade,
 role text not null check(role in ('owner','admin','member')), primary key(group_id,user_id)
);
create index members_user on kalori_private.members(user_id,group_id);
create table kalori_private.invites (
 id uuid primary key default gen_random_uuid(), token uuid unique not null default gen_random_uuid(),
 owner uuid not null references kalori_private.accounts(id) on delete cascade,
 group_id uuid references kalori_private.groups(id) on delete cascade,
 expires_at timestamptz not null default now()+interval '7 days',
 uses integer not null default 0, max_uses integer not null default 1,
 revoked boolean not null default false
);
create index invites_owner on kalori_private.invites(owner);
create table kalori_private.redemptions (
 invite_id uuid references kalori_private.invites(id) on delete cascade,
 user_id uuid references kalori_private.accounts(id) on delete cascade, primary key(invite_id,user_id)
);
create table kalori_private.challenges (
 id uuid primary key default gen_random_uuid(), group_id uuid not null references kalori_private.groups(id) on delete cascade,
 creator uuid not null references kalori_private.accounts(id),
 name text not null check(length(name) between 1 and 60),
 kind text not null check(kind in ('record','movement','water')),
 mode text not null check(mode in ('together','race')),
 starts date not null, ends date not null, zone text not null,
 target integer not null check(target between 1 and 180),
 check(ends>=starts and ends-starts between 0 and 29)
);
create index challenge_group on kalori_private.challenges(group_id,starts);
create table kalori_private.participants (
 challenge_id uuid references kalori_private.challenges(id) on delete cascade,
 user_id uuid references kalori_private.accounts(id) on delete cascade,
 target integer not null check(target between 1 and 10000), joined_at timestamptz not null default now(),
 primary key(challenge_id,user_id)
);
create index participants_user on kalori_private.participants(user_id,challenge_id);
create table kalori_private.progress (
 challenge_id uuid, user_id uuid, day date, completed boolean not null,
 primary key(challenge_id,user_id,day),
 foreign key(challenge_id,user_id) references kalori_private.participants(challenge_id,user_id) on delete cascade
);
create table kalori_private.notifications (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references kalori_private.accounts(id) on delete cascade,
 actor uuid references kalori_private.accounts(id) on delete cascade,
 kind text not null, label text not null, read boolean not null default false,
 created_at timestamptz not null default now()
);
create index notifications_user on kalori_private.notifications(user_id,created_at desc);
-- RLS defense in depth. No table grants or direct policies: only checked RPC access.
do $$ declare t text; begin
 for t in select tablename from pg_tables where schemaname='kalori_private' loop
 execute format('alter table kalori_private.%I enable row level security',t);
 execute format('revoke all on kalori_private.%I from public, anon, authenticated',t);
 end loop;
end $$;
create function kalori_private.blocked(a uuid,b uuid) returns boolean language sql stable set search_path='' as $$
 select exists(select 1 from kalori_private.blocks where (owner=a and target=b) or(owner=b and target=a));
$$;
create function kalori_private.friends(a uuid,b uuid) returns boolean language sql stable set search_path='' as $$
 select not kalori_private.blocked(a,b) and exists(select 1 from kalori_private.friendships where status='accepted' and ((sender=a and recipient=b)or(sender=b and recipient=a)));
$$;
create function kalori_private.card(who uuid) returns jsonb language sql stable set search_path='' as $$
 select jsonb_build_object('id',id,'username',username,'name',name,'bio',bio,'avatar',avatar) from kalori_private.accounts where id=who;
$$;
create function kalori_private.notify(who uuid,actor_id uuid,event_kind text,event_label text) returns void language sql set search_path='' as $$
 insert into kalori_private.notifications(user_id,actor,kind,label) values(who,actor_id,event_kind,event_label);
$$;
create function kalori_private.summary(viewer uuid,who uuid) returns jsonb language plpgsql stable set search_path='' as $$
 declare p jsonb; d jsonb; f text; result jsonb='{}'; today date; allowed boolean=false; fields jsonb;
 begin
 if kalori_private.blocked(viewer,who) then return '{}'; end if;
 select prefs into p from kalori_private.accounts where id=who;
 if coalesce((p->>'enabled')::boolean,false)=false then return '{}'; end if;
 if p->>'audience'='friends' then allowed=kalori_private.friends(viewer,who);
 elsif p->>'audience'='selected' then allowed=kalori_private.friends(viewer,who) and (p->'ids') ? viewer::text;
 elsif p->>'audience'='groups' then
 allowed=exists(select 1 from kalori_private.members a join kalori_private.members b using(group_id) where a.user_id=viewer and b.user_id=who and (p->'ids') ? a.group_id::text);
 end if;
 if not allowed then return '{}'; end if;
 select data into d from kalori_private.snapshots where user_id=who;
 today=(now() at time zone coalesce(d->'profile'->>'timeZone','Europe/Istanbul'))::date;
 fields=p->'fields';
 if fields ? 'record' then result=result||jsonb_build_object('record',coalesce((select e->>'status' from jsonb_array_elements(coalesce(d->'days','[]')) e where e->>'date'=today::text),'missing')); end if;
 if fields ? 'calories' then
 result=result||jsonb_build_object('calories',(select case when e->'calories'->>'mode'='total' then (e->'calories'->>'totalKcal')::numeric when e->'calories'->>'mode'='entries' then (select sum((v->>'kcal')::numeric) from jsonb_array_elements(e->'calories'->'entries') v) end from jsonb_array_elements(coalesce(d->'days','[]')) e where e->>'date'=today::text));
 end if;
 if fields ? 'movement' then result=result||jsonb_build_object('movement',coalesce((select sum((e->>'durationMinutes')::numeric) from jsonb_array_elements(coalesce(d->'activities','[]')) e where (e->>'date')::date between today-6 and today),0)); end if;
 if fields ? 'water' then result=result||jsonb_build_object('water',coalesce((d->'water'->'days'->>today::text)::numeric,0)>=coalesce((d->'water'->>'target')::numeric,2500)); end if;
 if fields ? 'weight' then result=result||jsonb_build_object('weight',(select e->'weightKg' from jsonb_array_elements(coalesce(d->'weights','[]')) e order by e->>'date' desc,e->>'measuredAt' desc limit 1)); end if;
 return result;
 end $$;
-- Score is derived from stored records, not client-supplied points. Old days freeze
-- after the two-day correction window; updates/retries replace a day, never add points.
create function kalori_private.score(who uuid,d jsonb) returns void language plpgsql set search_path='' as $$
 declare c record; day date; today date; ok boolean;
 begin
 for c in select x.*,p.target as personal_target from kalori_private.challenges x join kalori_private.participants p on p.challenge_id=x.id where p.user_id=who loop
 today=(now() at time zone c.zone)::date;
 if today>c.ends+2 then continue; end if;
 for day in select generate_series(greatest(c.starts,today-2)::timestamp,least(c.ends,today)::timestamp,interval '1 day')::date loop
 ok=false;
 if c.kind='record' then ok=exists(select 1 from jsonb_array_elements(coalesce(d->'days','[]')) e where e->>'date'=day::text and e->>'status'='completed');
 elsif c.kind='movement' then select coalesce(sum((e->>'durationMinutes')::numeric),0)>=c.personal_target into ok from jsonb_array_elements(coalesce(d->'activities','[]')) e where e->>'date'=day::text;
 elsif c.kind='water' then ok=coalesce((d->'water'->'days'->>day::text)::numeric,0)>=c.personal_target;
 end if;
 insert into kalori_private.progress values(c.id,who,day,ok) on conflict on constraint progress_pkey do update set completed=excluded.completed;
 end loop;
 end loop;
 end $$;
create function kalori_private.validate_snapshot(who uuid,d jsonb) returns void language plpgsql set search_path='' as $$
 declare e jsonb; k text; today date; v numeric;
 begin
 if jsonb_typeof(d) is distinct from 'object' or octet_length(d::text)>2000000 then raise exception 'Geçersiz veya çok büyük kayıt paketi.'; end if;
 if d->'profile' is not null and d->'profile'<>'null' then
 if d->'profile'->>'userId' is distinct from who::text then raise exception 'Profil başka hesaba ait.'; end if;
 if not exists(select 1 from pg_timezone_names where name=d->'profile'->>'timeZone') then raise exception 'Geçersiz saat dilimi.'; end if;
 if (d->'profile'->>'weightKg')::numeric not between 20 and 400 or (d->'profile'->>'heightCm')::numeric not between 100 and 250 then raise exception 'Geçersiz profil ölçüsü.'; end if;
 end if;
 today=(now() at time zone coalesce(d->'profile'->>'timeZone','Europe/Istanbul'))::date;
 foreach k in array array['plans','days','activities','weights'] loop
 if jsonb_typeof(d->k) is distinct from 'array' then raise exception 'Eksik kayıt listesi: %',k; end if;
 for e in select value from jsonb_array_elements(d->k) loop
 if e->>'userId' is distinct from who::text then raise exception 'Kayıt başka hesaba ait.'; end if;
 if e->>'id' is null then raise exception 'Kayıt kimliği eksik.'; end if;
 if k<>'plans' and (e->>'date')::date>today then raise exception 'Gelecek tarihli kayıt olamaz.'; end if;
 if k='activities' and ((e->>'durationMinutes')::numeric not between 1 and 600) then raise exception 'Hareket süresi geçersiz.'; end if;
 if k='weights' and (e->>'weightKg')::numeric not between 20 and 400 then raise exception 'Kilo geçersiz.'; end if;
 if k='days' then
 if e->>'status' not in ('missing','partial','completed') then raise exception 'Gün durumu geçersiz.'; end if;
 if e->>'status'='completed' and (e->'calories' is null or e->'calories'='null') then raise exception 'Eksik gün tamamlanamaz.'; end if;
 if e->'calories'->>'mode'='total' and (e->'calories'->>'totalKcal')::numeric not between 0 and 30000 then raise exception 'Kalori geçersiz.'; end if;
 if e->'calories'->>'mode'='entries' then
 for v in select (value->>'kcal')::numeric from jsonb_array_elements(e->'calories'->'entries') loop
 if v not between 0 and 30000 then raise exception 'Kalori geçersiz.'; end if; end loop;
 end if;
 end if;
 end loop;
 if (select count(*) from jsonb_array_elements(d->k))<>(select count(distinct value->>'id') from jsonb_array_elements(d->k)) then raise exception 'Tekrarlı kayıt kimliği.'; end if;
 end loop;
 if (select count(*) from jsonb_array_elements(d->'days'))<>(select count(distinct value->>'date') from jsonb_array_elements(d->'days')) then raise exception 'Tekrarlı gün.'; end if;
 if jsonb_typeof(d->'water') is distinct from 'object' or jsonb_typeof(d->'water'->'days') is distinct from 'object' or d->'water'->>'target' is null or (d->'water'->>'target')::numeric not between 250 and 10000 then raise exception 'Su hedefi geçersiz.'; end if;
 for k,e in select key,value from jsonb_each(coalesce(d->'water'->'days','{}')) loop
 if k::date>today or (e::text)::numeric not between 0 and 20000 then raise exception 'Su kaydı geçersiz.'; end if;
 end loop;
 if d->'catPreferences' is not null and d->'catPreferences'<>'null' and d->'catPreferences'->>'userId' is distinct from who::text then raise exception 'Kedi ayarı başka hesaba ait.'; end if;
 end $$;
create function kalori_private.state(me uuid) returns jsonb language plpgsql stable set search_path='' as $$
 declare result jsonb; g jsonb; c jsonb;
 begin
 select coalesce(jsonb_agg(jsonb_build_object('id',x.id,'name',x.name,'owner',x.owner,'zone',x.zone,'role',m.role,
 'members',(select coalesce(jsonb_agg(kalori_private.card(n.user_id)||jsonb_build_object('role',n.role,'summary',kalori_private.summary(me,n.user_id))),'[]') from kalori_private.members n where n.group_id=x.id and not kalori_private.blocked(me,n.user_id)))),'[]') into g
 from kalori_private.groups x join kalori_private.members m on m.group_id=x.id where m.user_id=me;
 select coalesce(jsonb_agg(jsonb_build_object('id',x.id,'groupId',x.group_id,'name',x.name,'kind',x.kind,'mode',x.mode,'starts',x.starts,'ends',x.ends,'zone',x.zone,'target',x.target,
 'joined',exists(select 1 from kalori_private.participants p where p.challenge_id=x.id and p.user_id=me),
 'joinOpen',(now() at time zone x.zone)::date<=x.starts,
 'final',(now() at time zone x.zone)::date>x.ends+2,
 'scores',(select coalesce(jsonb_agg(kalori_private.card(p.user_id)||jsonb_build_object('target',p.target,'days',(select count(*) from kalori_private.progress r where r.challenge_id=x.id and r.user_id=p.user_id and r.completed),'total',x.ends-x.starts+1)),'[]') from kalori_private.participants p where p.challenge_id=x.id and not kalori_private.blocked(me,p.user_id)))),'[]') into c
 from kalori_private.challenges x where exists(select 1 from kalori_private.members m where m.group_id=x.group_id and m.user_id=me);
 result=jsonb_build_object('account',(select kalori_private.card(me)||jsonb_build_object('code',code,'prefs',prefs) from kalori_private.accounts where id=me),
 'friends',(select coalesce(jsonb_agg(kalori_private.card(case when sender=me then recipient else sender end)||jsonb_build_object('summary',kalori_private.summary(me,case when sender=me then recipient else sender end))),'[]') from kalori_private.friendships where status='accepted' and (sender=me or recipient=me) and not kalori_private.blocked(sender,recipient)),
 'requests',(select coalesce(jsonb_agg(kalori_private.card(case when sender=me then recipient else sender end)||jsonb_build_object('incoming',recipient=me)),'[]') from kalori_private.friendships where status='pending' and (sender=me or recipient=me) and not kalori_private.blocked(sender,recipient)),
 'blocks',(select coalesce(jsonb_agg(kalori_private.card(target)),'[]') from kalori_private.blocks where owner=me),
 'groups',g,'challenges',c,
 'invites',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'groupId',group_id,'expiresAt',expires_at,'uses',uses,'maxUses',max_uses)),'[]') from kalori_private.invites where owner=me and not revoked and expires_at>now()),
 'notifications',(select coalesce(jsonb_agg(to_jsonb(n)),'[]') from (select id,kind,label,read,created_at from kalori_private.notifications where user_id=me and (actor is null or not kalori_private.blocked(me,actor)) order by created_at desc limit 50) n));
 return result;
 end $$;
create function kalori_private.run(action text,payload jsonb,operation_id uuid) returns jsonb
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
 if saved.request_hash<>md5(jsonb_build_object('action',action,'payload',payload)::text) then raise exception 'İşlem kimliği başka veri için kullanılmış.' using errcode='40001'; end if;
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
 if snap.revision<>(payload->>'revision')::bigint then raise exception 'Kayıtlar başka cihazda değişti. Güncel kayıtları yükle.' using errcode='40001'; end if;
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
-- Remove implicit function EXECUTE grants. Only run is reachable by an authenticated wrapper.
revoke all on all functions in schema kalori_private from public,anon,authenticated;
grant usage on schema kalori_private to authenticated;
grant execute on function kalori_private.run(text,jsonb,uuid) to authenticated;
create function public.kalori_rpc(action text,payload jsonb default '{}',operation_id uuid default null)
 returns jsonb language sql security invoker set search_path='' as $$
 select kalori_private.run(action,payload,operation_id);
$$;
revoke all on function public.kalori_rpc(text,jsonb,uuid) from public,anon;
grant execute on function public.kalori_rpc(text,jsonb,uuid) to authenticated;
