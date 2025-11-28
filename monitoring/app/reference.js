/*
Complete single-file Node.js + Express server with:
- Structured logging (winston + morgan integration + daily rotate)
- Request ID middleware
- Basic JWT auth stub
- Monitoring (Prometheus metrics using prom-client)
- Health checks and /metrics endpoint
- Common middlewares: helmet, compression, rate-limit, cors
- Graceful shutdown
- Example REST endpoints (CRUD in-memory) and an analytics endpoint

Install dependencies:

npm init -y
npm install express helmet compression cors morgan winston winston-daily-rotate-file express-rate-limit prom-client uuid jsonwebtoken body-parser express-validator multer swagger-ui-express

Run:
node server.js

Notes:
- This is a demo single-file server meant for learning and testing. Replace in-memory stores and secrets with production-grade DB and secret management for real apps.
*/

/* ===================== IMPORTS & CONFIG ===================== */
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const morgan = require('morgan');
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const rateLimit = require('express-rate-limit');
const promClient = require('prom-client');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const { body, param, validationResult } = require('express-validator');
const multer = require('multer');
const swaggerUi = require('swagger-ui-express');

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

/* ===================== LOGGER (winston) ===================== */
const logger = winston.createLogger({
  level: NODE_ENV === 'development' ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'example-express-service' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d',
      level: 'info'
    }),
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxFiles: '30d'
    })
  ]
});

/* integrate morgan with winston */
const morganStream = {
  write: (message) => logger.info(message.trim())
};

/* ===================== PROMETHEUS METRICS ===================== */
const collectDefaultMetrics = promClient.collectDefaultMetrics;
collectDefaultMetrics({ timeout: 5000 }); // collect node metrics

const httpRequestDurationMicroseconds = new promClient.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'code'],
  // buckets for response time from 0.1ms to 5s
  buckets: [0.1, 5, 15, 50, 100, 300, 500, 1000, 3000, 5000]
});

const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'code']
});

/* ===================== APP SETUP ===================== */
const app = express();

app.use(helmet());
app.use(compression());
app.use(cors());
app.use(bodyParser.json({ limit: '5mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

/* rate limiter */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

/* request id middleware */
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || uuidv4();
  res.setHeader('X-Request-Id', req.id);
  next();
});

/* morgan for access logs */
app.use(morgan(':remote-addr - :remote-user [:date[clf]] ":method :url" :status :res[content-length] - :response-time ms - req_id=:req[id]', { stream: morganStream }));

/* attach req.id token to morgan tokens */
morgan.token('id', function getId(req) { return req.id; });

/* metrics middleware to measure durations */
app.use((req, res, next) => {
  const end = httpRequestDurationMicroseconds.startTimer();
  res.on('finish', () => {
    const route = req.route && req.route.path ? req.route.path : req.path;
    end({ method: req.method, route, code: res.statusCode });
    httpRequestsTotal.inc({ method: req.method, route, code: res.statusCode });
  });
  next();
});

/* ===================== SIMPLE AUTH (JWT) ===================== */
function createToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

function authMiddleware(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth) return res.status(401).json({ message: 'Missing Authorization header' });
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ message: 'Invalid Authorization format' });
  const token = parts[1];
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Invalid token', error: err.message });
    req.user = decoded;
    next();
  });
}

/* ===================== IN-MEMORY DATA STORES (demo only) ===================== */
let users = {}; // id -> { id, username, name }
let items = {}; // id -> { id, ownerId, name, description }

/* generate sample data */
for (let i = 1; i <= 3; i++) {
  const uid = `u${i}`;
  users[uid] = { id: uid, username: `user${i}`, name: `User ${i}` };
}
for (let i = 1; i <= 5; i++) {
  const id = `it${i}`;
  items[id] = { id, ownerId: `u${(i % 3) + 1}`, name: `Item ${i}`, description: `A demo item ${i}` };
}

/* ===================== UPLOAD CONFIG (multer) ===================== */
const upload = multer({ dest: 'uploads/', limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

/* ===================== ROUTES ===================== */

// Basic health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), id: req.id });
});

// Metrics endpoint for Prometheus
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', promClient.register.contentType);
    const metrics = await promClient.register.metrics();
    res.send(metrics);
  } catch (err) {
    logger.error('Failed to collect metrics: %o', err);
    res.status(500).send(err.toString());
  }
});

/* --- AUTH --- */
app.post('/auth/login',
  body('username').isString().notEmpty(),
  body('password').isString().notEmpty(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { username } = req.body;
    // demo: accept any username/password, issue token
    const user = Object.values(users).find(u => u.username === username) || { id: 'anonymous', username };
    const token = createToken({ id: user.id, username: user.username });
    logger.info('Issued token for user %s req_id=%s', user.username, req.id);
    res.json({ token });
  }
);

/* --- USERS API --- */
app.get('/api/users', (req, res) => {
  res.json(Object.values(users));
});

app.get('/api/users/:id', param('id').isString(), (req, res) => {
  const user = users[req.params.id];
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

app.post('/api/users',
  body('username').isString().notEmpty(),
  body('name').isString().optional(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const id = `u${Date.now()}`;
    const user = { id, username: req.body.username, name: req.body.name || '' };
    users[id] = user;
    logger.info('Created user %s id=%s req_id=%s', user.username, id, req.id);
    res.status(201).json(user);
  }
);

app.put('/api/users/:id', param('id').isString(), (req, res) => {
  const user = users[req.params.id];
  if (!user) return res.status(404).json({ message: 'User not found' });
  user.name = req.body.name || user.name;
  logger.info('Updated user id=%s req_id=%s', user.id, req.id);
  res.json(user);
});

app.delete('/api/users/:id', param('id').isString(), (req, res) => {
  const user = users[req.params.id];
  if (!user) return res.status(404).json({ message: 'User not found' });
  delete users[req.params.id];
  logger.info('Deleted user id=%s req_id=%s', req.params.id, req.id);
  res.status(204).send();
});

/* --- ITEMS API (requires auth) --- */
app.get('/api/items', authMiddleware, (req, res) => {
  res.json(Object.values(items));
});

app.post('/api/items', authMiddleware,
  body('name').isString().notEmpty(),
  body('description').isString().optional(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const id = `it${Date.now()}`;
    const item = { id, ownerId: req.user.id || 'unknown', name: req.body.name, description: req.body.description || '' };
    items[id] = item;
    logger.info('Created item id=%s owner=%s req_id=%s', id, req.user.id, req.id);
    res.status(201).json(item);
  }
);

app.get('/api/items/:id', authMiddleware, param('id').isString(), (req, res) => {
  const item = items[req.params.id];
  if (!item) return res.status(404).json({ message: 'Item not found' });
  res.json(item);
});

app.put('/api/items/:id', authMiddleware, param('id').isString(), (req, res) => {
  const item = items[req.params.id];
  if (!item) return res.status(404).json({ message: 'Item not found' });
  if (req.user.id !== item.ownerId) return res.status(403).json({ message: 'Not allowed to edit this item' });
  item.name = req.body.name || item.name;
  item.description = req.body.description || item.description;
  res.json(item);
});

app.delete('/api/items/:id', authMiddleware, param('id').isString(), (req, res) => {
  const item = items[req.params.id];
  if (!item) return res.status(404).json({ message: 'Item not found' });
  if (req.user.id !== item.ownerId) return res.status(403).json({ message: 'Not allowed to delete this item' });
  delete items[req.params.id];
  res.status(204).send();
});

/* --- SEARCH (simple text search) --- */
app.get('/api/search', (req, res) => {
  const q = (req.query.q || '').toLowerCase();
  if (!q) return res.json({ results: [] });
  const results = Object.values(items).filter(it => (it.name + ' ' + it.description).toLowerCase().includes(q));
  res.json({ query: q, results });
});

/* --- FILE UPLOAD EXAMPLE --- */
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  // Note: file stored in ./uploads with random filename. In production, move to S3 or other storage.
  logger.info('Uploaded file %s original=%s size=%d req_id=%s', req.file.filename, req.file.originalname, req.file.size, req.id);
  res.json({ filename: req.file.filename, originalname: req.file.originalname });
});

/* --- ANALYTICS example: a simple histogram of created items per minute (in-memory) --- */
const itemCreationTimes = [];
app.get('/api/analytics/items-per-minute', (req, res) => {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  const countLastHour = itemCreationTimes.filter(t => t >= oneHourAgo).length;
  res.json({ lastHourCount: countLastHour, totalItems: Object.keys(items).length });
});

app.post('/api/items-with-analytics', authMiddleware, body('name').isString().notEmpty(), (req, res) => {
  const id = `it${Date.now()}`;
  const item = { id, ownerId: req.user.id || 'unknown', name: req.body.name, description: req.body.description || '' };
  items[id] = item;
  itemCreationTimes.push(Date.now());
  res.status(201).json(item);
});

/* --- Minimal OpenAPI JSON (served as docs) --- */
const openApi = {
  openapi: '3.0.1',
  info: { title: 'Demo API', version: '1.0.0', description: 'Single-file demo API with monitoring and logging' },
  paths: {
    '/health': { get: { responses: { '200': { description: 'OK' } } } },
    '/metrics': { get: { responses: { '200': { description: 'Prometheus metrics' } } } },
    '/auth/login': { post: { requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { username: { type: 'string' }, password: { type: 'string' } }, required: ['username','password'] } } } }, responses: { '200': { description: 'Token' } } } }
  }
};
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApi));

/* ===================== ERROR HANDLING ===================== */
// 404
app.use((req, res, next) => {
  res.status(404).json({ message: 'Not Found' });
});

// centralized error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error: %o req_id=%s', err, req.id);
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Internal Server Error' });
});

/* ===================== GRACEFUL SHUTDOWN ===================== */
const server = app.listen(PORT, () => {
  logger.info('Server listening on port %d in %s mode', PORT, NODE_ENV);
});

function shutdown(signal) {
  logger.info('Received %s - shutting down gracefully', signal);
  server.close(err => {
    if (err) {
      logger.error('Error during shutdown: %o', err);
      process.exit(1);
    }
    logger.info('Shutdown complete');
    process.exit(0);
  });
  // force exit after 10s
  setTimeout(() => {
    logger.warn('Forcing shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

/* ===================== EXPORT FOR TESTING (optional) ===================== */
module.exports = { app, server, logger };
