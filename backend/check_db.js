require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const User = require('./src/models/User');
  const pending = await User.find({ status: { $regex: 'pending', $options: 'i' } });
  console.log('Pending Users Count (case-insensitive):', pending.length);
  console.log(pending.map(u => ({ email: u.email, status: u.status, role: u.role })));
  
  const allUsers = await User.find({});
  console.log('All users count:', allUsers.length);
  console.log('All statuses:', [...new Set(allUsers.map(u => u.status))]);

  process.exit(0);
}).catch(console.error);
