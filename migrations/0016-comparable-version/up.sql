CREATE FUNCTION sp.comparable_version(_version TEXT) RETURNS BIGINT AS $$
DECLARE
  tokens TEXT[];
BEGIN
  tokens := regexp_split_to_array(_version, '\.');
  RETURN tokens[1]::INT * 10000000 +
         tokens[2]::INT * 10000 +
         tokens[3]::INT;
END;
$$ LANGUAGE 'plpgsql' IMMUTABLE;
