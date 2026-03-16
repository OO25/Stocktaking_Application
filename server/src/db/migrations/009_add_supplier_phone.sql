-- Add phone column to suppliers table
ALTER TABLE suppliers
  ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
