import express from 'express';
import routes from './routes/index';

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 5000;

app.use('/', routes);
app.use(express.json());

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

export default app;
