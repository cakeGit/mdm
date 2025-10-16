const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const PORT = process.env.PORT || 3001;
const ERROR_HTML_PATH = path.join(__dirname, 'error.html');
const SERVER_SCRIPT = path.join(__dirname, 'dist', 'index.js');

let errorLog = '';
let serverFailed = false;
let serverProcess = null;
let errorServerStarted = false;

// Read the error.html template
const errorTemplate = fs.readFileSync(ERROR_HTML_PATH, 'utf8');

// Function to serve error page
function serveErrorPage(res) {
  const errorPage = errorTemplate.replace('{ERROR_LOG}', escapeHtml(errorLog));
  res.writeHead(500, { 'Content-Type': 'text/html' });
  res.end(errorPage);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// Create HTTP server that serves error page if startup failed
const httpServer = http.createServer((req, res) => {
  if (serverFailed) {
    serveErrorPage(res);
  } else {
    // If server hasn't failed yet but also hasn't started, wait a moment
    res.writeHead(503, { 'Content-Type': 'text/plain' });
    res.end('Server is starting... Please refresh in a moment.');
  }
});

// Helper function to notify that error server is active
function notifyErrorServer() {
  if (errorServerStarted) {
    return; // Already notified
  }
  errorServerStarted = true;
  console.log(`\n🔴 Error page now available on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to see the error details`);
}

// Function to start the main server
function startMainServer() {
  console.log('Starting server...');
  
  serverProcess = spawn('node', [SERVER_SCRIPT], {
    stdio: ['inherit', 'pipe', 'pipe'],
    env: process.env
  });

  let serverStarted = false;
  let wrapperServerClosed = false;

  serverProcess.stdout.on('data', (data) => {
    const message = data.toString();
    process.stdout.write(message);
    
    // Check if server started successfully
    if (message.includes('Server running on port') || message.includes('Database initialized successfully')) {
      serverStarted = true;
      // Close the wrapper HTTP server since the real server is running
      if (!wrapperServerClosed && httpServer.listening) {
        wrapperServerClosed = true;
        httpServer.close(() => {
          console.log('Wrapper server closed - main server is running');
        });
      }
    }
  });

  serverProcess.stderr.on('data', (data) => {
    const message = data.toString();
    process.stderr.write(message);
    errorLog += message;
  });

  serverProcess.on('close', (code) => {
    if (code !== 0 && !serverStarted) {
      console.error(`\n❌ Server failed to start with exit code ${code}`);
      serverFailed = true;
      notifyErrorServer();
    } else if (code !== 0) {
      console.error(`\n⚠️ Server crashed with exit code ${code}`);
      serverFailed = true;
      errorLog += `\n\nServer crashed with exit code ${code}`;
      notifyErrorServer();
    }
  });

  serverProcess.on('error', (err) => {
    console.error('Failed to start server process:', err);
    errorLog += `\nFailed to start server process: ${err.message}`;
    serverFailed = true;
    notifyErrorServer();
  });
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
  }
  httpServer.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down...');
  if (serverProcess) {
    serverProcess.kill('SIGINT');
  }
  httpServer.close();
  process.exit(0);
});

// Start with wrapper server listening, will be closed if main server starts successfully
httpServer.listen(PORT, () => {
  console.log(`Wrapper server listening on port ${PORT} (will be replaced if startup succeeds)`);
  startMainServer();
});
