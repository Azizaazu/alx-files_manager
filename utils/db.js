import { MongoClient } from 'mongodb';

class DBClient {
    constructor() {
        const HOST = process.env.DB_HOST || 'localhost';
        const PORT = process.env.DB_PORT || 27017;
        const DATABASE = process.env.DB_DATABASE || 'files_manager';
        const url = `mongodb://${HOST}:${PORT}`;

        this.client = new MongoClient(uri, { useUnifiedTopology: true, useNewUrlParser: true });
        this.client.connect().then(() => {
		 this.db = this.client.db(`${DATABASE}`);
	}).catch((err) => {
		console.log(err);
	});
    }

    isAlive() {
        return this.client.isConnected();
    }

    async nbUsers() {
        const users = this.db.collection('user');
        const usersNum = await users.countDocuments();
        return usersNum;
    }

    async nbFiles() {
        const files = this.db.collection('files');
        const filesNum = await files.countDocuments();
	return filesNum;
    }
}

const dbClient = new DBClient();

module.exports = dbClient;
