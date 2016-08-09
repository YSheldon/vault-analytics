CREATE FUNCTION sp.canonical_platform(_platform TEXT, _cpu TEXT) RETURNS TEXT AS $$
BEGIN
  IF _platform = 'win32' THEN
    IF _cpu = 'amd64' THEN
      RETURN 'winx64';
    ELSE
      RETURN 'winia32';
    END IF;
  ELSIF _platform = 'darwin' THEN
    RETURN 'osx';
  ELSEIF _platform = 'linux' THEN
    RETURN 'linux';
  ELSE
    RETURN _platform;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
