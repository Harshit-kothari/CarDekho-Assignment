import type { Express, Request, Response } from 'express';

/**
 * Legacy Chat API setup. 
 * Now proxies to the Python backend to ensure consistency and keep configuration in Python.
 */
export function setupChatApi(app: Express): void {
  app.post('/api/chat', async (req: Request, res: Response) => {
    const pythonBackendUrl = process.env['PYTHON_BACKEND_URL'] ?? 'http://127.0.0.1:8000';
    
    try {
      const response = await fetch(`${pythonBackendUrl.replace(/\/$/, '')}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body)
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        res.status(response.status).json(errData);
        return;
      }

      const data = await response.json();
      res.json(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      res.status(503).json({
        error: `Cannot reach Python backend at ${pythonBackendUrl}. (${msg})`
      });
    }
  });
}
