import axios from 'axios';

// Define the type for route check results
interface RouteCheckResult {
  method: string;
  path: string;
  status: number;
  exists: boolean;
  requiresAuth: boolean;
}

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const AUTH_TOKEN = process.env.AUTH_TOKEN || '';

// Common paths to check
const paths = [
  '/',
  '/api',
  '/users',
  '/users/1',
  '/auth/login',
  '/auth/register',
  '/auth/profile',
  '/health',
  // Add more paths you want to check
];

// HTTP methods to try
const methods = ['GET', 'POST', 'PUT', 'DELETE'];

async function checkRoute(method: string, path: string): Promise<RouteCheckResult> {
  try {
    const url = `${API_BASE_URL}${path}`;
    const config = {
      method,
      url,
      headers: {
        Authorization: AUTH_TOKEN ? `Bearer ${AUTH_TOKEN}` : '',
      },
      // For POST/PUT, we'd need a body, but we're just checking if routes exist
      validateStatus: () => true, // Don't throw on any status code
    };

    const response = await axios(config);

    // 404 means route doesn't exist
    // 401 means route exists but requires auth
    // Other codes suggest the route exists
    const exists = response.status !== 404;
    const requiresAuth = response.status === 401;

    console.log(
      `${method.padEnd(7)} ${path.padEnd(20)} | ${response.status} ${response.statusText.padEnd(15)} | ${exists ? '✅' : '❌'} ${requiresAuth ? '🔒' : '  '}`,
    );

    return { method, path, status: response.status, exists, requiresAuth };
  } catch (error: any) {
    console.error(`Error checking ${method} ${path}:`, error.message);
    return { method, path, status: 0, exists: false, requiresAuth: false };
  }
}

async function main() {
  console.log('\nAPI Route Checker');
  console.log(`Base URL: ${API_BASE_URL}`);
  console.log('Auth Token:', AUTH_TOKEN ? '✅ Provided' : '❌ Not provided');
  console.log('\nChecking routes...');
  console.log(
    'METHOD  PATH                | STATUS           | EXISTS REQUIRES_AUTH',
  );
  console.log(
    '-----------------------------------------------------------------------',
  );

  const results: RouteCheckResult[] = [];

  // Check GET for all paths
  for (const path of paths) {
    results.push(await checkRoute('GET', path));
  }

  // Check POST, PUT, DELETE only for key paths to avoid too many requests
  const writePaths = ['/users', '/auth/login', '/auth/register'];
  for (const path of writePaths) {
    for (const method of ['POST', 'PUT', 'DELETE']) {
      results.push(await checkRoute(method, path));
    }
  }

  console.log('\nSummary:');
  const existingRoutes = results.filter((r) => r.exists);
  console.log(
    `Found ${existingRoutes.length} existing routes out of ${results.length} checked`,
  );

  const authRoutes = existingRoutes.filter((r) => r.requiresAuth);
  console.log(`${authRoutes.length} routes require authentication`);

  console.log('\nExisting routes:');
  existingRoutes.forEach((r) => {
    console.log(
      `${r.method.padEnd(7)} ${r.path.padEnd(20)} ${r.requiresAuth ? '🔒' : '  '}`,
    );
  });
}

main().catch(console.error);
