import express from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';
import FilesController from '../controllers/FilesController';
import { basicAuthenticate, xTokenAuthenticate } from '../middlewares/auth';
import { APIError, errorResponse } from '../middlewares/error';


const router = (api) => {
	api.get('/status', AppController.getStatus);
	api.get('/stats', AppController.getStats);
	api.post('/users', UsersController.postNew);
	api.get('/connect', basicAuthenticate, AuthController.getConnect);
	api.get('/disconnect', xTokenAuthenticate, AuthController.getDisconnect);
	api.get('/users/me', xTokenAuthenticate, UsersController.getMe);
	api.post('/files', xTokenAuthenticate, FilesController.postUpload);
	api.get('/files/:id', xTokenAuthenticate, FilesController.getShow);
	api.get('/files', xTokenAuthenticate, FilesController.getIndex);
	api.put('/files/:id/publish', xTokenAuthenticate, FilesController.putPublish);
	api.put('/files/:id/unpublish', xTokenAuthenticate, FilesController.putUnpublish);
	api.get('/files/:id/data', FilesController.getFile);

	api.all('*', (req, res, next) => {
		errorResponse(new APIError(404, `Cannot ${req.method} ${req.url}`), req, res, next);
	});
	api.use(errorResponse);
};

module.exports = router;
