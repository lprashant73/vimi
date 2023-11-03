const mongoose = require('mongoose');
mongoose.connect(process.env.DATA_BASE, ({ useNewUrlParser: true
}))
  .then(() => console.log(`Server is connected to the database now.`)).catch(err => console.log(err));
mongoose.connection.on('error', err => {
  logError(err);
});
process.on('warning', e => console.warn(e.stack));
