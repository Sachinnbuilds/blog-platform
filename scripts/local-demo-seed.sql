-- Local V3 prototype demo data.
-- Password for all demo accounts: DemoPass123!
-- This file is intentionally manual and is not part of Flyway.

begin;

insert into users (
    username, email, password, is_admin, token_version,
    display_name, bio, website, location, joined_at,
    follower_count, following_count
) values
    ('admin', 'admin@demo.local', '$2a$10$4.LC5FUK3PePS.GuI/ToQuXTbpVXu6nrDVshRZYrmFNffvbeSAriy', true, 0,
     'Admin Demo', 'Prototype admin for moderation flows.', 'https://example.com/admin', 'Demo HQ', current_date - interval '90 days', 0, 0),
    ('maya', 'maya@demo.local', '$2a$10$4.LC5FUK3PePS.GuI/ToQuXTbpVXu6nrDVshRZYrmFNffvbeSAriy', false, 0,
     'Maya Rao', 'Writes about product craft, publishing systems, and thoughtful software.', 'https://example.com/maya', 'Bengaluru', current_date - interval '62 days', 0, 0),
    ('devon', 'devon@demo.local', '$2a$10$4.LC5FUK3PePS.GuI/ToQuXTbpVXu6nrDVshRZYrmFNffvbeSAriy', false, 0,
     'Devon Lee', 'Backend engineer exploring search, feeds, and resilient product platforms.', 'https://example.com/devon', 'San Francisco', current_date - interval '48 days', 0, 0),
    ('reader', 'reader@demo.local', '$2a$10$4.LC5FUK3PePS.GuI/ToQuXTbpVXu6nrDVshRZYrmFNffvbeSAriy', false, 0,
     'Reader Demo', 'Demo reader account with onboarding interests and follows.', null, 'Localhost', current_date - interval '21 days', 0, 0)
on conflict (username) do update set
    email = excluded.email,
    password = excluded.password,
    is_admin = excluded.is_admin,
    display_name = excluded.display_name,
    bio = excluded.bio,
    website = excluded.website,
    location = excluded.location,
    joined_at = excluded.joined_at;

insert into tags (name, slug, post_count, created_at) values
    ('publishing', 'publishing', 0, now() - interval '30 days'),
    ('product', 'product', 0, now() - interval '29 days'),
    ('backend', 'backend', 0, now() - interval '28 days'),
    ('react', 'react', 0, now() - interval '27 days'),
    ('design', 'design', 0, now() - interval '26 days'),
    ('startups', 'startups', 0, now() - interval '25 days'),
    ('search', 'search', 0, now() - interval '24 days'),
    ('writing', 'writing', 0, now() - interval '23 days')
on conflict (slug) do update set
    name = excluded.name;

insert into posts (
    title, slug, content, summary, thumbnail, created_at, updated_at,
    likes, read_time, view_count, comment_count, status, user_id
)
select
    'Designing a feed people can trust',
    'designing-a-feed-people-can-trust',
    'A useful feed starts with clear contracts: what is fresh, what is popular, and what is personally relevant. The V3 prototype keeps those surfaces separate so readers can understand why a story appears.',
    'A practical look at feed surfaces, trust, and ranking boundaries.',
    null,
    now() - interval '6 days',
    now() - interval '5 days',
    0,
    '2 min read',
    128,
    0,
    'PUBLISHED',
    u.id
from users u where u.username = 'maya'
on conflict (slug) do update set
    title = excluded.title,
    content = excluded.content,
    summary = excluded.summary,
    thumbnail = excluded.thumbnail,
    created_at = excluded.created_at,
    updated_at = excluded.updated_at,
    read_time = excluded.read_time,
    view_count = excluded.view_count,
    status = excluded.status,
    user_id = excluded.user_id;

insert into posts (
    title, slug, content, summary, thumbnail, created_at, updated_at,
    likes, read_time, view_count, comment_count, status, user_id
)
select
    'What writers need from a publishing workflow',
    'what-writers-need-from-a-publishing-workflow',
    'Drafts, summaries, tags, and predictable previews are the core of a comfortable writing workflow. The prototype keeps drafting private and publishing explicit.',
    'A writer-centered pass through drafts, tags, summaries, and publishing.',
    null,
    now() - interval '4 days',
    now() - interval '4 days',
    0,
    '2 min read',
    94,
    0,
    'PUBLISHED',
    u.id
from users u where u.username = 'maya'
on conflict (slug) do update set
    title = excluded.title,
    content = excluded.content,
    summary = excluded.summary,
    thumbnail = excluded.thumbnail,
    created_at = excluded.created_at,
    updated_at = excluded.updated_at,
    read_time = excluded.read_time,
    view_count = excluded.view_count,
    status = excluded.status,
    user_id = excluded.user_id;

insert into posts (
    title, slug, content, summary, thumbnail, created_at, updated_at,
    likes, read_time, view_count, comment_count, status, user_id
)
select
    'Search that respects the shape of content',
    'search-that-respects-the-shape-of-content',
    'Search works better when posts, people, and tags are treated as different result types. Unified search in the prototype groups those results instead of flattening them.',
    'Why grouped search is a better fit for a publishing platform.',
    null,
    now() - interval '3 days',
    now() - interval '2 days',
    0,
    '2 min read',
    156,
    0,
    'PUBLISHED',
    u.id
from users u where u.username = 'devon'
on conflict (slug) do update set
    title = excluded.title,
    content = excluded.content,
    summary = excluded.summary,
    thumbnail = excluded.thumbnail,
    created_at = excluded.created_at,
    updated_at = excluded.updated_at,
    read_time = excluded.read_time,
    view_count = excluded.view_count,
    status = excluded.status,
    user_id = excluded.user_id;

insert into posts (
    title, slug, content, summary, thumbnail, created_at, updated_at,
    likes, read_time, view_count, comment_count, status, user_id
)
select
    'A backend checklist for social publishing',
    'a-backend-checklist-for-social-publishing',
    'Feeds, follows, drafts, counters, and moderation all depend on boring integrity rules. The prototype favors explicit DTOs and denormalized counts guarded by tests.',
    'Backend concerns that make publishing flows feel reliable.',
    null,
    now() - interval '1 day',
    now() - interval '1 day',
    0,
    '3 min read',
    203,
    0,
    'PUBLISHED',
    u.id
from users u where u.username = 'devon'
on conflict (slug) do update set
    title = excluded.title,
    content = excluded.content,
    summary = excluded.summary,
    thumbnail = excluded.thumbnail,
    created_at = excluded.created_at,
    updated_at = excluded.updated_at,
    read_time = excluded.read_time,
    view_count = excluded.view_count,
    status = excluded.status,
    user_id = excluded.user_id;

insert into posts (
    title, slug, content, summary, thumbnail, created_at, updated_at,
    likes, read_time, view_count, comment_count, status, user_id
)
select
    'Draft: notes on a calmer editor',
    'draft-notes-on-a-calmer-editor',
    'This private draft exists to verify that drafts stay out of public feeds, profiles, search, likes, and comments while remaining editable by the author.',
    'Private draft for demo and QA flows.',
    null,
    now() - interval '12 hours',
    now() - interval '12 hours',
    0,
    '1 min read',
    0,
    0,
    'DRAFT',
    u.id
from users u where u.username = 'maya'
on conflict (slug) do update set
    title = excluded.title,
    content = excluded.content,
    summary = excluded.summary,
    thumbnail = excluded.thumbnail,
    created_at = excluded.created_at,
    updated_at = excluded.updated_at,
    read_time = excluded.read_time,
    view_count = excluded.view_count,
    status = excluded.status,
    user_id = excluded.user_id;

insert into post_tags (post_id, tag_id)
select p.id, t.id
from posts p
join tags t on t.slug in ('publishing', 'product', 'design')
where p.slug = 'designing-a-feed-people-can-trust'
on conflict do nothing;

insert into post_tags (post_id, tag_id)
select p.id, t.id
from posts p
join tags t on t.slug in ('publishing', 'writing', 'product')
where p.slug = 'what-writers-need-from-a-publishing-workflow'
on conflict do nothing;

insert into post_tags (post_id, tag_id)
select p.id, t.id
from posts p
join tags t on t.slug in ('search', 'react', 'publishing')
where p.slug = 'search-that-respects-the-shape-of-content'
on conflict do nothing;

insert into post_tags (post_id, tag_id)
select p.id, t.id
from posts p
join tags t on t.slug in ('backend', 'startups', 'publishing')
where p.slug = 'a-backend-checklist-for-social-publishing'
on conflict do nothing;

insert into post_tags (post_id, tag_id)
select p.id, t.id
from posts p
join tags t on t.slug in ('design', 'writing')
where p.slug = 'draft-notes-on-a-calmer-editor'
on conflict do nothing;

insert into follows (follower_id, following_id, created_at)
select follower.id, following.id, now() - interval '2 days'
from users follower
join users following on following.username = 'maya'
where follower.username = 'reader'
on conflict do nothing;

insert into follows (follower_id, following_id, created_at)
select follower.id, following.id, now() - interval '1 day'
from users follower
join users following on following.username = 'devon'
where follower.username = 'reader'
on conflict do nothing;

insert into follows (follower_id, following_id, created_at)
select follower.id, following.id, now() - interval '18 hours'
from users follower
join users following on following.username = 'devon'
where follower.username = 'maya'
on conflict do nothing;

insert into user_interests (user_id, interest)
select u.id, v.interest
from users u
cross join (values ('publishing'), ('product'), ('backend'), ('search')) as v(interest)
where u.username = 'reader'
on conflict do nothing;

insert into post_likes (user_id, post_id)
select u.id, p.id
from users u
join posts p on p.slug in (
    'designing-a-feed-people-can-trust',
    'search-that-respects-the-shape-of-content',
    'a-backend-checklist-for-social-publishing'
)
where u.username = 'reader'
on conflict do nothing;

insert into post_likes (user_id, post_id)
select u.id, p.id
from users u
join posts p on p.slug in (
    'search-that-respects-the-shape-of-content',
    'a-backend-checklist-for-social-publishing'
)
where u.username = 'maya'
on conflict do nothing;

insert into post_likes (user_id, post_id)
select u.id, p.id
from users u
join posts p on p.slug in (
    'designing-a-feed-people-can-trust',
    'what-writers-need-from-a-publishing-workflow'
)
where u.username = 'devon'
on conflict do nothing;

delete from comments
where content in (
    'This makes the feed tabs easy to explain in a demo.',
    'The grouped search behavior feels much clearer than a flat list.',
    'The draft privacy rule is the right default for writers.'
)
and post_id in (
    select id from posts where slug in (
        'designing-a-feed-people-can-trust',
        'search-that-respects-the-shape-of-content',
        'what-writers-need-from-a-publishing-workflow'
    )
);

insert into comments (content, created_at, post_id, user_id)
select 'This makes the feed tabs easy to explain in a demo.', now() - interval '36 hours', p.id, u.id
from posts p
join users u on u.username = 'reader'
where p.slug = 'designing-a-feed-people-can-trust';

insert into comments (content, created_at, post_id, user_id)
select 'The grouped search behavior feels much clearer than a flat list.', now() - interval '20 hours', p.id, u.id
from posts p
join users u on u.username = 'maya'
where p.slug = 'search-that-respects-the-shape-of-content';

insert into comments (content, created_at, post_id, user_id)
select 'The draft privacy rule is the right default for writers.', now() - interval '12 hours', p.id, u.id
from posts p
join users u on u.username = 'devon'
where p.slug = 'what-writers-need-from-a-publishing-workflow';

update posts p
set likes = coalesce(like_counts.count, 0)
from (
    select p.id, count(pl.id)::integer as count
    from posts p
    left join post_likes pl on pl.post_id = p.id
    group by p.id
) like_counts
where p.id = like_counts.id;

update posts p
set comment_count = coalesce(comment_counts.count, 0)
from (
    select p.id, count(c.id)::integer as count
    from posts p
    left join comments c on c.post_id = p.id
    group by p.id
) comment_counts
where p.id = comment_counts.id;

update tags t
set post_count = coalesce(tag_counts.count, 0)
from (
    select t.id, count(distinct p.id)::integer as count
    from tags t
    left join post_tags pt on pt.tag_id = t.id
    left join posts p on p.id = pt.post_id and p.status = 'PUBLISHED'
    group by t.id
) tag_counts
where t.id = tag_counts.id;

update users u
set follower_count = coalesce(follower_counts.count, 0)
from (
    select u.id, count(f.id)::integer as count
    from users u
    left join follows f on f.following_id = u.id
    group by u.id
) follower_counts
where u.id = follower_counts.id;

update users u
set following_count = coalesce(following_counts.count, 0)
from (
    select u.id, count(f.id)::integer as count
    from users u
    left join follows f on f.follower_id = u.id
    group by u.id
) following_counts
where u.id = following_counts.id;

commit;
