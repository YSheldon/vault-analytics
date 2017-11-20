CREATE TABLE dtl.publisher_platforms (
  platform text    not null primary key,
  label    text    not null,
  ord      integer not null,
  icon_url text    not null
);

INSERT INTO dtl.publisher_platforms ( platform, label, ord, icon_url ) VALUES
  ( 'publisher', 'Publishers', 0, 'internet.svg' ),
  ( 'youtube', 'YouTube', 1, 'youtube.svg' ),
  ( 'twitch', 'Twitch', 2, 'twitch.svg' )
;

CREATE TABLE dtl.publishers (
  publisher      text    not null primary key,
  name           text,
  url            text    not null,
  created        bigint  not null,
  created_at     date    not null,
  verified       boolean not null,
  authorized     boolean not null,
  alexa_rank     bigint,
  platform       text    not null references dtl.publisher_platforms(platform),
  audience       bigint,
  last_inspected timestamp
);
