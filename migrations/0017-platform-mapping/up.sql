CREATE FUNCTION sp.platform_mapping(_platform TEXT) RETURNS TEXT AS $$
BEGIN
  -- This is meant to be updated as new platforms are added
  IF _platform = 'unknown' THEN
    RETURN 'linux';
  ELSE
    RETURN _platform;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
