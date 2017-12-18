insert into meta.migrations (id, description) values ('0054', 'Add platform to promotions');

alter table dtl.promotions add column platform text not null default 'publisher' references dtl.publisher_platforms(platform);
