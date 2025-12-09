
-- Add atomic equipment swap RPC function
CREATE OR REPLACE FUNCTION swap_equipment_items(
  updates_json JSONB -- Array of {id: uuid, location: text}
) RETURNS void AS $$
DECLARE
  item_update JSONB;
BEGIN
  -- All updates happen in a single transaction
  -- If any fails, all rollback automatically
  FOR item_update IN SELECT * FROM jsonb_array_elements(updates_json)
  LOOP
    UPDATE character_inventory
    SET location = (item_update->>'location')::text
    WHERE id = (item_update->>'id')::uuid;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
