const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const root = process.cwd();
const host = '127.0.0.1';
const port = Number(process.env.PORT || 4173);
const shouldOpen = process.argv.includes('--open');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function send(res, status, body, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type });
  res.end(body);
}

function openBrowser(url) {
  const child = spawn('cmd', ['/c', 'start', '', url], {
    stdio: 'ignore',
    windowsHide: true
  });
  child.unref();
}

const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(req.url.split('?')[0]);
  const requestPath = pathname === '/' ? '/index.html' : pathname;
  const safePath = path.normalize(path.join(root, requestPath));

  if (!safePath.startsWith(root)) {
    send(res, 403, 'Forbidden');
    return;
  }

  fs.readFile(safePath, (error, data) => {
    if (error) {
      send(res, error.code === 'ENOENT' ? 404 : 500, error.code === 'ENOENT' ? 'Not found' : 'Server error');
      return;
    }

    const ext = path.extname(safePath).toLowerCase();
    send(res, 200, data, mimeTypes[ext] || 'application/octet-stream');
  });
});

server.listen(port, host, () => {
  const url = `http://${host}:${port}/?debug=1`;
  console.log(`Preview running at ${url}`);
  console.log('Use Ctrl+C to stop.');

  if (shouldOpen) {
    openBrowser(url);
  }
});
