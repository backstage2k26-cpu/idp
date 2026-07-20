import express from 'express';
import Router from 'express-promise-router';
import { DevLakeService } from './services/devlakeService';
import { db } from './db';

export async function createRouter(): Promise<express.Router> {
  const router = Router();
  router.use(express.json());

  const devLakeService = new DevLakeService('http://localhost:8080');

  router.get('/dora/:repo', async (req, res) => {
  try {
    console.log('Query:', req.query);

    const application =
      req.query.application as string | undefined;

    console.log('Application from query:', application);

    const metrics = await devLakeService.getMetrics(
      req.params.repo,
      application,
    );

    res.json(metrics);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});
  router.get('/db-test', async (_, res) => {
  try {
    const [rows] = await db.query('SELECT NOW() AS currentTime');

    res.json(rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});
  return router;
}