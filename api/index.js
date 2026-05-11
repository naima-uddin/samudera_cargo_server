let cachedApp = null;

const allowedOrigins = [
	'https://samuderathai.com',
	'https://api.samuderathai.com',
	'https://remarkable-flan-2a9036.netlify.app',
	'https://samuderathai.com',
	'http://localhost:3001',
	'http://localhost:3000'
];

const isAllowedOrigin = (origin) => {
	if (!origin) {
		return true;
	}

	if (allowedOrigins.includes(origin)) {
		return true;
	}

	if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)) {
		return true;
	}

	if (/^http:\/\/localhost:\d+$/i.test(origin)) {
		return true;
	}

	if (/^http:\/\/127\.0\.0\.1:\d+$/i.test(origin)) {
		return true;
	}

	if (/^https:\/\/[a-z0-9-]+\.netlify\.app$/i.test(origin)) {
		return true;
	}

	if (/^https:\/\/(?:[a-z0-9-]+\.)?samuderathai\.com$/i.test(origin)) {
		return true;
	}

	return false;
};

const applyCorsHeaders = (req, res) => {
	const origin = req.headers.origin;

	if (origin && isAllowedOrigin(origin)) {
		res.setHeader('Access-Control-Allow-Origin', origin);
	}

	res.setHeader('Vary', 'Origin');
	res.setHeader('Access-Control-Allow-Credentials', 'true');
	res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
};

module.exports = async (req, res) => {
	try {
		applyCorsHeaders(req, res);

		if (req.method === 'OPTIONS') {
			return res.status(204).end();
		}

		if (!cachedApp) {
			cachedApp = require('../app');
		}

		if (typeof cachedApp.ensureDbConnection === 'function') {
			await cachedApp.ensureDbConnection();
		} else if (cachedApp.dbConnectPromise) {
			await cachedApp.dbConnectPromise;
		}

		return cachedApp(req, res);
	} catch (error) {
		applyCorsHeaders(req, res);

		console.error('❌ Database initialization failed:', error.message);
		return res.status(503).json({
			success: false,
			message: 'Service temporarily unavailable. Please try again shortly.',
			error: process.env.NODE_ENV === 'development' ? error.message : undefined
		});
	}
};
