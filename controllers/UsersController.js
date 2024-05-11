import { ObjectId } from 'mongodb';
import sha1 from 'sha1';
import dbClient from '../utils/db';
import Queue from 'bull';
import redisClient from '../utils/redis';

const userQueue = new Queue('userQueue', 'redis://127.0.0.1:6379');

class UsersController {
    static postNew(req, res) {
        const { email, password } = req.body;

        if (!email) {
            res.status(400).json({ error: 'Missing email' });
        }

        if (!password) {
            res.status(400).json({ error: 'Missing password' });
        }

        const userExists = await dbClient.db.collection('users').findOne({ email });
        if (userExists) {
            return res.status(400).json({ error: 'Already exist' });
        }

        const hashedPassword = sha1(password);

        const result = await dbClient.db.collection('users').insertOne({
            email,
            password: hashedPassword,
        });

        const newUser = {
            id: result.insertedId,
            email,
        };

        return res.status(201).json(newUser);
    }
}

export default UsersController;
