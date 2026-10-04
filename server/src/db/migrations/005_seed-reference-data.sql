-- Food groups stolen from excel sheet
INSERT INTO food_groups (code, name, sort_order) VALUES
    ('01', 'Meat',            1),
    ('02', 'Poultry',         2),
    ('03', 'Seafood',         3),
    ('04', 'Dairy',           4),
    ('05', 'Dry Goods',       5),
    ('06', 'Frozen Goods',    6),
    ('07', 'Fresh Produce',   7),
    ('08', 'Pastry & Bakery', 8),
    ('09', 'Alcohol',         9),
    ('10', 'Cold Drinks',    10),
    ('11', 'Hot Drinks',     11),
    ('12', 'Confectionery',  12);

-- Packaging types
INSERT INTO packaging_types (name, sort_order) VALUES
    ('Serviettes',             1),
    ('Cups/Lids/Holders',      2),
    ('Container/Noodle Boxes', 3),
    ('Bags',                   4),
    ('Cleaning',               5),
    ('Cutlery',                6),
    ('Gloves',                 7),
    ('Consumable & Papers',    8),
    ('Drop-off & Pizza Boxes', 9);

-- Outlets 
INSERT INTO outlets (name, cost_centre) VALUES
    ('Refuel',             '195'),
    ('Groove',             '196'),
    ('Production Kitchen', '194'),
    ('Catering FOH',       '194b'),
    ('KaiFe',              '198'),
    ('Millennium/MISH',    '199'),
    ('Newsfeed',           '197'),
    ('Kokihi',             '555'),
    ('K101',               '556'),
    ('BPL',                '557');
