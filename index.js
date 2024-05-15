const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const cors = require('cors');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const port = process.env.PORT || 500;

// MiddleWare
const corsConfig = {
  origin: ['http://localhost:5173', 'https://alt-forum.web.app', 'https://alt-forum.firebaseapp.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
};
app.use(cors(corsConfig));
app.use(express.json());
app.use(cookieParser());

const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;
  console.log('token', token);
  if (!token) return res.status(401).send({ message: 'Forbidden' });
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    //errr
    if (err) {
      return res.status(401).send({ message: 'unauthrized' });
    }
    req.user = decoded;
    next();
  });
};

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_USRPASS}@cluster0.mal3t53.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const queriesCollction = client.db('AltForum').collection('queries');
    const recommendCollection = client.db('AltForum').collection('recommend');

    //Auth Related API

    //Login Token
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
      console.log('seris', user);
      res
        .cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        })
        .send({ success: true });
    });

    //Logout Token
    app.post('/logout', async (req, res) => {
      const user = req.body;
      console.log('logging out user', user);
      res.clearCookie('token', { maxAge: 0 }).send({ success: true });
    });

    //Data related API
    app.get('/', verifyToken, async (req, res) => {
      res.send('Server is Running');
    });

    //Add User Query
    app.post('/addqueries', verifyToken, async (req, res) => {
      const query = req.body;
      const result = await queriesCollction.insertOne(query);
      res.send(result);
    });

    //Load All Query
    app.get('/allqueries', async (req, res) => {
      const search = req.query.search;
      let query = {};
      if (search) {
        query = {
          productName: { $regex: search, $options: 'i' },
        };
      }
      const result = await queriesCollction.find(query).sort({ $natural: -1 }).toArray();
      res.send(result);
      console.log(search);
    });

    // User Query By Email
    app.get('/myqueries', verifyToken, async (req, res) => {
      const email = req.query.email;
      console.log(req.user);
      query = { user_email: email };
      const result = await queriesCollction.find(query).toArray();
      res.send(result);
    });

    //User Single Query by ID
    app.get('/myqueries/:id', verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await queriesCollction.findOne(query);
      res.send(result);
    });

    //Load  All Recommendation
    app.get('/recommendation/:id', verifyToken, async (req, res) => {
      const id = req.params.id;
      const filter = { query_id: id };
      const result = await recommendCollection.find(filter).toArray();
      res.send(result);
    });

    //Load Recommendation by Recommender Email
    app.get('/recommendation', verifyToken, async (req, res) => {
      const email = req.query.email;
      const filter = { recommender_email: email };
      const result = await recommendCollection.find(filter).toArray();
      res.send(result);
    });

    //Load Recommendation by Recommender Email
    app.get('/recommendation2', verifyToken, async (req, res) => {
      const email = req.query.email;
      const filter = { user_email: email };
      const result = await recommendCollection.find(filter).toArray();
      res.send(result);
    });

    //Update Recommed Count  Inc
    app.patch('/updaterecommend/:id', verifyToken, async (req, res) => {
      const id = req.params.id;
      const result = await queriesCollction.updateOne({ _id: new ObjectId(id) }, { $inc: { recommendationCount: 1 } });
      res.send(result);
    });

    // Update Recommend Count Dec
    app.patch('/updaterecommend2/:id', verifyToken, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await queriesCollction.updateOne({ _id: new ObjectId(id) }, { $inc: { recommendationCount: -1 } });
      res.send(result);
    });

    //Update post api
    app.patch('/myqueries/:id', verifyToken, async (req, res) => {
      const id = req.params.id;
      const details = req.body;
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedDetails = {
        $set: {
          productName: details.productName,
          productBrand: details.productBrand,
          productIMG: details.productIMG,
          queryTitle: details.queryTitle,
          reason: details.reason,
        },
      };
      const result = await queriesCollction.updateOne(query, updatedDetails, options);
      res.send(result);
    });

    //Delete Post API
    app.delete('/myqueries/:id', verifyToken, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await queriesCollction.deleteOne(filter);
      res.send(result);
    });

    //Delete Recommendation api
    app.delete('/recommend/:id', verifyToken, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await recommendCollection.deleteOne(filter);
      res.send(result);
    });

    //Add Recommend API
    app.post('/recommend', verifyToken, async (req, res) => {
      const query = req.body;
      const result = await recommendCollection.insertOne(query);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    // await client.db('admin').command({ ping: 1 });
    // console.log('Pinged your deployment. You successfully connected to MongoDB!');
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Server is Running');
});

app.listen(port, () => {
  console.log(`Server is running port : ${port}`);
});
