CREATE OR REPLACE FUNCTION crash_trg() RETURNS trigger AS $$
DECLARE
  buf TEXT;
  _row RECORD;
BEGIN
  buf := NEW.id;
  buf := buf || ' ' || COALESCE(NEW.contents->>'guid', '');
  buf := buf || ' ' || COALESCE(NEW.contents->>'platform', '');
  buf := buf || ' ' || COALESCE(NEW.contents->>'year_month_day', '');
  buf := buf || ' ' || COALESCE(NEW.contents->>'_version', '');
  buf := buf || ' ' || COALESCE(NEW.contents->>'ver', '');
  buf := buf || ' ' || COALESCE(NEW.contents->>'crash_reason', '');
  buf := buf || ' ' || COALESCE(NEW.contents->>'list_annotations', '');
  buf := buf || ' ' || COALESCE(NEW.contents->>'process_type', 'unknown');
  IF NEW.contents->'metadata' IS NOT NULL THEN
    buf := buf || ' ' || COALESCE(NEW.contents->'metadata'->>'operating_system_version', '');
    buf := buf || ' ' || COALESCE(NEW.contents->'metadata'->>'operating_system_name', '');
    buf := buf || ' ' || COALESCE(NEW.contents->'metadata'->>'operating_system', '');
    buf := buf || ' ' || COALESCE(NEW.contents->'metadata'->>'cpu', '');
    buf := buf || ' ' || COALESCE(NEW.contents->'metadata'->>'crash_reason', '');
    buf := buf || ' ' || COALESCE(NEW.contents->'metadata'->>'cpu_family', '');
    buf := buf || ' ' || COALESCE(NEW.contents->'metadata'->>'signature', '');
  END IF;

  FOR _row IN SELECT tag FROM dtl.crash_tags WHERE crash_id = NEW.id LOOP
    buf := buf || ' ' || _row.tag;
  END LOOP;

  INSERT INTO dtl.fti (object_type, object_id, searchable)
  VALUES ('crash', NEW.id, to_tsvector('simple', buf))
  ON CONFLICT (object_type, object_id) DO UPDATE SET searchable = to_tsvector('simple', buf);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
