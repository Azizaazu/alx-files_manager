import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class FilesController {
    static async postUpload(req, res) {
        const { 'x-token': token } = req.headers;
        const { name, type, parentId = '0', isPublic = false, data } = req.body;

        if (!token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const userId = await redisClient.get(`auth_${token}`);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const user = await dbClient.db.collection('users').findOne({ _id: ObjectId(userId) });
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!name) {
            return res.status(400).json({ error: 'Missing name' });
        }

        if (!type || !['folder', 'file', 'image'].includes(type)) {
            return res.status(400).json({ error: 'Missing type' });
        }

        if ((type !== 'folder') && !data) {
            return res.status(400).json({ error: 'Missing data' });
        }

        let parentIdObject = '0';
        if (parentId !== '0') {
            const parentFile = await dbClient.db.collection('files').findOne({ _id: ObjectId(parentId) });
            if (!parentFile) {
                return res.status(400).json({ error: 'Parent not found' });
            }
            if (parentFile.type !== 'folder') {
                return res.status(400).json({ error: 'Parent is not a folder' });
            }
            parentIdObject = ObjectId(parentId);
        }

        let localPath = '';
        if (type !== 'folder') {
            const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
            if (!fs.existsSync(folderPath)) {
                fs.mkdirSync(folderPath, { recursive: true });
            }
            localPath = path.join(folderPath, uuidv4());
            const buffer = Buffer.from(data, 'base64');
            fs.writeFileSync(localPath, buffer);
        }

        const newFile = {
            userId: ObjectId(userId),
            name,
            type,
            isPublic,
            parentId: parentIdObject,
            localPath: (type !== 'folder') ? localPath : undefined,
        };

        const result = await dbClient.db.collection('files').insertOne(newFile);
        const fileId = result.insertedId;

        return res.status(201).json({
            id: fileId,
            userId,
            name,
            type,
            isPublic,
            parentId,
        });
    }
static async getShow(req, res) {
        const { 'x-token': token } = req.headers;
        const { id } = req.params;

        if (!token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const userId = await redisClient.get(`auth_${token}`);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        try {
            const file = await dbClient.db.collection('files').findOne({ _id: ObjectId(id), userId: ObjectId(userId) });

            if (!file) {
                return res.status(404).json({ error: 'Not found' });
            }

            return res.json(file);
        } catch (err) {
            return res.status(404).json({ error: 'Not found' });
        }
    }

    static async getIndex(req, res) {
        const { 'x-token': token } = req.headers;
        const { parentId = '0', page = '0' } = req.query;

        if (!token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const userId = await redisClient.get(`auth_${token}`);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        try {
            const pipeline = [
                {
                    $match: {
                        userId: ObjectId(userId),
                        parentId: parentId === '0' ? parentId : ObjectId(parentId),
                    },
                },
                {
                    $skip: parseInt(page) * 20,
                },
                {
                    $limit: 20,
                },
            ];

            const files = await dbClient.db.collection('files').aggregate(pipeline).toArray();

            return res.json(files);
        } catch (err) {
            return res.status(404).json({ error: 'Not found' });
        }
    }
static async putPublish(req, res) {
        const { 'x-token': token } = req.headers;
        const { id } = req.params;

        if (!token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const userId = await redisClient.get(`auth_${token}`);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        try {
            const query = { _id: ObjectId(id), userId: ObjectId(userId) };
            const update = { $set: { isPublic: true } };
            const options = { returnOriginal: false };
            const result = await dbClient.db.collection('files').findOneAndUpdate(query, update, options);

            if (!result.value) {
                return res.status(404).json({ error: 'Not found' });
            }

            return res.json(result.value);
        } catch (err) {
            return res.status(404).json({ error: 'Not found' });
        }
    }

    static async putUnpublish(req, res) {
        const { 'x-token': token } = req.headers;
        const { id } = req.params;

        if (!token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const userId = await redisClient.get(`auth_${token}`);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        try {
            const query = { _id: ObjectId(id), userId: ObjectId(userId) };
            const update = { $set: { isPublic: false } };
            const options = { returnOriginal: false };
            const result = await dbClient.db.collection('files').findOneAndUpdate(query, update, options);

            if (!result.value) {
                return res.status(404).json({ error: 'Not found' });
            }

            return res.json(result.value);
        } catch (err) {
            return res.status(404).json({ error: 'Not found' });
        }
    }
	 static async getFile(req, res) {
        const { 'x-token': token } = req.headers;
        const { id } = req.params;

        if (!token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const userId = await redisClient.get(`auth_${token}`);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        try {
            const query = { _id: ObjectId(id) };
            const file = await dbClient.db.collection('files').findOne(query);

            if (!file || (!file.isPublic && file.userId !== ObjectId(userId))) {
                return res.status(404).json({ error: 'Not found' });
            }

            if (file.type === 'folder') {
                return res.status(400).json({ error: "A folder doesn't have content" });
            }

            if (!fs.existsSync(file.localPath)) {
                return res.status(404).json({ error: 'Not found' });
            }

            const mimeType = mimeTypes.lookup(file.name);
            const fileContent = fs.readFileSync(file.localPath, 'utf-8');

            res.setHeader('Content-Type', mimeType);
            res.send(fileContent);
        } catch (error) {
            return res.status(404).json({ error: 'Not found' });
        }
    }
}
export default FilesController;
