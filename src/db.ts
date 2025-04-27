import mongoose from 'mongoose';

const DB_URI = 'mongodb://127.0.0.1:27017/leaky-bucket';

export async function connectDatabase() {
    try {
      await mongoose.connect(DB_URI);
      console.log('MongoDB connected successfully');
      
      if (mongoose.connection.db) {
        const collections = await mongoose.connection.db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);
        
        if (!collectionNames.includes('users')) {
          await mongoose.connection.db.createCollection('users');
          console.log('Users collection created');
        }
      }
      
      return mongoose.connection;
    } catch (error) {
      console.error('MongoDB connection error:', error);
      process.exit(1);
    }
}