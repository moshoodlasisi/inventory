export const inventoryQueries = {
    getAll: `SELECT * FROM inventory WHERE owner = $1`,
    getById: `SELECT * FROM inventory WHERE id = $1`,
    create: `INSERT INTO inventory (name, quantity, owner) VALUES ($1, $2, $3)`,
    update: `UPDATE inventory
    SET quantity = CASE 
        WHEN action = 'add' THEN quantity + :quantity
        WHEN action = 'remove' THEN quantity - :quantity
        ELSE quantity
    END,
    updated_at = NOW()
    WHERE id = :id;`,
    delete: `DELETE FROM inventory WHERE id = $1`
}