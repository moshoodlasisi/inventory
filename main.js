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

const inventoryFile = './inventory.json';

//write the inventory data from the JSON file
const saveInventoryData = async (data) => {
    const stringifyData = JSON.stringify(data);
    await fs.writeFile(inventoryFile, stringifyData);
};

//read the inventory data from the JSON file
const getInventoryData = async () => {
    try {
     const jsonData = await fs.readFile(inventoryFile);
     return JSON.parse(jsonData);
    } catch (err) {
        console.log('Error reading file', err);
        return [];
    }
};

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

app.post('/login', (req, res) => {
    //Authenticate User
    const { username, password } = req.body;

    //Does a user with the username exist?
    const user = users.find((u) => u.username === username);

    if (!user) {
        return res.status(401).json({ error: 'User not found' })
    }

    if (user.username === username && user.password === password) {
        const accessToken = jwt.sign({ username }, process.env.ACCESS_TOKEN_SECRET);
        res.json({ accessToken: accessToken });
    } else {
        res.status(401).json({ error: 'Invalid username or password'})
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
    const userName = req.user.username;
    const inventories = await getInventoryData();
    const userInventories = inventories.filter((inv) => inv.owner.userName === userName);
    res.json(userInventories);
  });

//Create Inventory
app.post('/inventory', authenticateToken, async (req, res) => {
    /**
     * - Extract the user creating the inventory
     * - Store the user along with the inventory
     */
    const { name, quantity } = req.body;
    const { user } = req;

    const id = uuid();
    const newInventory = { 
        id, 
        name, 
        quantity,
        owner: { userName: user.username },
        createdAt: new Date(),
        updatedAt: new Date() 
    };
    const inventories = await getInventoryData();
    inventories.push(newInventory);
    await saveInventoryData(inventories);
    res.json(newInventory);
});

//Read Inventory
app.get('/inventory/:id', authenticateToken, async (req, res) => {
    const id = req.params.id;
    const inventories = await getInventoryData();
    const foundInventory = inventories.find((item) => item.id === id);
    if (!foundInventory) {
        return res.status(404).json({ error: 'Inventory not found'});
    }
    res.json(foundInventory);
});

//Update Inventory
app.put('/inventory/:id', authenticateToken, async (req, res) => {
    const id = req.params.id;
    const { action, quantity } = req.body;

    const inventories = await getInventoryData();
    const foundInventory = inventories.find(item => item.id === id);
    if (!foundInventory) {
        return res.status(404).json({ error: 'Inventory not found' });
    }
    if (action === 'add') {
        foundInventory.quantity += parseInt(quantity);
    } else if (action === 'remove') {
        if (foundInventory.quantity < quantity) {
            return res.status(400).json({ error: 'Insufficient quantity' });
        }
        foundInventory.quantity -= parseInt(quantity);
    } else {
        return res.status(400).json({ error: 'Invalid action' });
    }
    foundInventory.updatedAt = new Date();
    await saveInventoryData(inventories);
    res.json(foundInventory);
});

//Delete Inventory
app.delete('/inventory/:id', authenticateToken, async (req, res) => {
    const id = req.params.id;

    const inventories = await getInventoryData();
    const foundInventoryIndex = inventories.findIndex(item => item.id === id);
    if (foundInventoryIndex === -1) {
        return res.status(404).json({ error: 'Inventory not found' });
    }
    inventories.splice(foundInventoryIndex, 1);
    await saveInventoryData(inventories);
    res.json({ success: true });
});

app.listen(8000, () => {
    console.log('SERVER RUNNING ON PORT 8000...')
});
