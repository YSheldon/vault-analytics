CREATE TABLE dw.fc_ios_usage_month (
    ymd date NOT NULL,
    platform text NOT NULL,
    version text NOT NULL,
    channel text NOT NULL,
    woi     date not null,
    ref     text not null default 'none',
    total bigint DEFAULT 0 NOT NULL,
    CONSTRAINT valid_platforms CHECK ((platform = ANY (ARRAY['osx'::text, 'winx64'::text, 'winia32'::text, 'android'::text, 'ios'::text, 'unknown'::text, 'linux'::text, 'androidbrowser'::text]))),
    CONSTRAINT version_format CHECK ((version ~ '^\d+\.\d+\.\d+$'::text))
);

ALTER TABLE ONLY dw.fc_ios_usage_month
    ADD CONSTRAINT fc_ios_usage_month_pkey PRIMARY KEY (ymd, platform, version, channel, woi, ref);

ALTER TABLE ONLY dw.fc_ios_usage_month
    ADD CONSTRAINT valid_channels_fk FOREIGN KEY (channel) REFERENCES dtl.channels(channel);

