const express = require('express');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 5500;

// MiddleWare
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Server is Running');
});

app.listen(port, () => {
  console.log(`Server is running port : ${port}`);
});
