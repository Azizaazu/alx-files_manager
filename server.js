import express from 'express';
import routes from './routes';
import injectMiddlewares from './libs/middlewares';
import startServer from './libs/boot';

const server = express();

injectMiddlewares(server);
injectRoutes(server);
startServer(server);

export default server;
