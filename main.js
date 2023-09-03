require('dotenv').config()
const express = require('express');
const { v4: uuid } = require('uuid');
const fs = require('fs').promises;
const cors = require('cors')
const bodyParser = require('body-parser')
const app = express();
const jwt = require('jsonwebtoken');

// Going forward you should be using import syntax not require anymore.
// I've added esm module to compile it for us
import { db } from './utils/database';
import { userQueries } from './queries/user';
import { inventoryQueries } from './queries/inventory';

app.use(cors());
app.use(bodyParser.json());

//Access Control
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Origin, Content-Type, Accept');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

app.use(express.json());



const users = [
    { username: 'user1', password: 'password1' }, 
    { username: 'user2', password: 'password2' } 
];


/******************
 * TEST ROUTE
 ******************/
app.get('/inventory/test-user', async (req, res) => {
    /***
     * DB insert random user example
     */
    
    const userName = `John ${uuid()}`;
    let users = []

    try{
        // None means you're not expecting the database to return any result
        await db.none(userQueries.saveUser, [ userName ])

        // Fetch list of users
        users = await db.manyOrNone(userQueries.fetchAllUsers)
    }catch(e){
        console.log(':::: DB ERROR ::::', e)
        res.status(500).json({message: 'internal error'})
    }

    res.json({users})
})


app.post('/login', async (req, res) => {
    //Authenticate User
    const { username, password } = req.body;

    //Does a user with the username exist?
    try {
        // await db.none(userQueries.saveUser, [ username, password ])

        const user = await db.oneOrNone(userQueries.fetchAllUsers, username);

        if (!user) {
            return res.status(401).json({ error: 'User not found' })
        }

        if (user.username === username && user.password === password) {
            const accessToken = jwt.sign({ username }, process.env.ACCESS_TOKEN_SECRET);
            res.json({ accessToken: accessToken });
        } else {
            res.status(401).json({ error: 'Invalid username or password'})
        }
    } catch (err) {
        console.log('Error authenticating user', err);
    }
});


function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (token == null) return res.sendStatus(401)

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    })
}

//Get All Inventory
app.get('/inventory', authenticateToken, async (req, res) => {
    const owner = req.user.username;
    try {
        const inventories = await db.any(inventoryQueries.getAll, owner);
        res.json(inventories);
    } catch (err) {
        console.log('Error fetching inventory data', err);
        res.status(500).json({ message: 'Internal server error' });
    }
  });

//Create Inventory
app.post('/inventory', authenticateToken, async (req, res) => {
    /**
     * - Extract the user creating the inventory
     * - Store the user along with the inventory
     */
    const { name, quantity } = req.body;
    const owner = req.user.username;

    try {
        await db.none(inventoryQueries.create, [name, quantity, owner]);
        res.json({ message: 'Inventory item created successfully' });
    } catch (err) {
        console.log('Error creating inventory item', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

//Read Inventory
app.get('/inventory/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const owner = req.user.username;
    try {
        const inventory = await db.oneOrNone(inventoryQueries.getById, id);
        if (inventory) {
            res.json(inventory);
        } else {
            res.status(404).json({ message: 'Inventory item not found' });
        }
    } catch (err) {
        console.log(`Error fetching inventory item with ID ${id}`, err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

//Update Inventory
app.put('/inventory/:id', authenticateToken, async (req, res) => {
    const id = req.params.id;
    const { action, quantity } = req.body;
    const owner = req.user.username;

    try {
        let queryText, queryParams;
        if (action === 'add') {
            queryText = 'UPDATE inventory SET quantity = quantity + $1, updated_at = NOW() WHERE id = $2';
            queryParams = [quantity, id];
        } else if (action === 'remove') {
            queryText = 'UPDATE inventory SET quantity = quantity - $1, updated_at = NOW() WHERE id = $2 AND quantity >= $1';
            queryParams = [quantity, id];
        } else {
            return res.status(400).json({ error: 'Invalid action' });
        }
        const { rowCount } = await db.query(queryText, queryParams);
        if (rowCount === 0) {
            return res.status(404).json({ error: 'Inventory not found' });
        }
        res.json({ message: 'update successful'});
    } catch (error) {
        console.log(`Error updating inventory item with ID ${id}`, error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

//Delete Inventory
app.delete('/inventory/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.result(inventoryQueries.delete, id, r => r.rowCount);
        if (result === 1) {
            res.json({ message: `Inventory item with ID ${id} deleted successfully` });
        } else {
            res.status(404).json({ message: 'Inventory item not found' });
        }
    } catch (err) {
        console.log(`Error deleting inventory item with ID ${id}`, err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.listen(8000, () => {
    console.log('SERVER RUNNING ON PORT 8000...')
});
