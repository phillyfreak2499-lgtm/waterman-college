-- Video links and category tags on Be Remarkable posts.
create table if not exists cms_news_media (
  news_id    text primary key,
  video_url  text,
  tags       text not null default '[]',
  updated_at timestamptz not null default now()
);

create index if not exists cms_news_media_tags_idx on cms_news_media (tags);
