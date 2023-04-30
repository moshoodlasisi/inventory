require('dotenv').config()
const express = require('express');
const { v4: uuid } = require('uuid');
const app = express();
const jwt = require('jsonwebtoken')
app.use(express.json());

const inventory = [];

const users = [
    { username: 'user1', password: 'password1' }, 
    { username: 'user2', password: 'password2' } 
];

app.post('/login', (req, res) => {
    //Authenticate User
    const { username, password } = req.body;

    // Does a user with the username exists
    const user = users.find((u) => u.username === username);

    if(!user){
        return res.status(401).json({ error: 'User not found'})
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
        if (err) return res.sendStatus(403)
        req.user = user
        next()
    })
}

//Get All Inventory
app.get('/inventory', authenticateToken, (req, res) => {
    const userName = req.user.username;
    const userInventories = inventory.filter(inv => inv.owner.userName === userName);
    res.json(userInventories);
  });

//Create Inventory
app.post('/inventory', authenticateToken, (req, res) => {
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

    inventory.push(newInventory);
    res.json(newInventory);
});

//Read Inventory
app.get('/inventory/:id', authenticateToken, (req, res) => {
    const id = req.params.id;
    const foundInventory = inventory.find(item => item.id === id);
    if (!foundInventory) {
        return res.status(404).json({ error: 'Inventory not found'});
    }
    res.json(foundInventory);
});

//Update Inventory
app.put('/inventory/:id', authenticateToken, (req, res) => {
    const id = req.params.id;
    const { action, quantity } = req.body;
    const foundInventory = inventory.find(item => item.id === id);
    if (!foundInventory) {
        return res.status(404).json({ error: 'Inventory not found' });
    }
    if (action === 'add') {
        foundInventory.quantity += quantity;
    } else if (action === 'remove') {
        if (foundInventory.quantity < quantity) {
            return res.status(400).json({ error: 'Insufficient quantity' });
        }
        foundInventory.quantity -= quantity;
    } else {
        return res.status(400).json({ error: 'Invalid action' });
    }
    res.json(foundInventory);
});

//Delete Inventory
app.delete('/inventory/:id', authenticateToken, (req, res) => {
    const id = req.params.id;
    const foundInventoryIndex = inventory.findIndex(item => item.id === id);
    if (foundInventoryIndex === -1) {
        return res.status(404).json({ error: 'Inventory not found' });
    }
    inventory.splice(foundInventoryIndex, 1);
    res.json({ success: true });
});

app.listen(8000, () => {
    console.log('SERVER RUNNING ON PORT 8000...')
});
