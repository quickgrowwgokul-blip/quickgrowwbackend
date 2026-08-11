const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const AdminDetails = require('./models/Admindetails');
const startCronJobs = require('./utils/cronJobs');

// Load environment variables
dotenv.config();

const app = express();

// Standard middlewares
app.use(cors());
app.use(express.json());

// Connect to MongoDB Atlas and Seed Admin
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB Atlas connected successfully, bro!');
    
    // Auto-seed Admin if it doesn't exist
    const adminExists = await AdminDetails.findOne({ username: 'Admin' });
    if (!adminExists) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('GrowwPark123', salt);
      await AdminDetails.create({ username: 'Admin', password: hashedPassword });
      console.log('Admin account (Admin / GrowwPark123) successfully seeded!');
    }
  })
  .catch((err) => console.error('MongoDB connection error:', err));

// --- ROUTES ---
app.use('/api/auth', require('./routes/authentication'));
app.use('/api/wallet', require('./routes/userwalletmanagement'));
app.use('/api/admin/wallet', require('./routes/adminwalletmanagement')); 
app.use('/api/bank', require('./routes/bankmanagement'));
app.use('/api/admin/users', require('./routes/adminusertransactions'));
app.use('/api/admin-bank', require('./routes/adminbankmanagement'));
app.use('/api/investment', require('./routes/userinvestmentmanagement'));
app.use('/api/admin-investment', require('./routes/admininvestmentmanagement'));
// --------------
// --------------

// Start the server
const PORT = process.env.PORT || 5000;
startCronJobs();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});