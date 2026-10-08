// MathFrame — Доска: настольная офлайн-версия (Electron).
// Страница доски и все её файлы лежат в app/ (см. scripts/copy-site.js) и отдаются по схеме mf://board/,
// чтобы абсолютные пути /assets/... работали как на сайте. /api/* проксируется на сайт (если есть сеть).
'use strict';
const { app, BrowserWindow, Menu, protocol, net, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

const SITE = 'https://math-frame.vercel.app';
const SCHEME = 'mf';
const HOST = 'board';
const START = `${SCHEME}://${HOST}/board/`;
const APP_DIR = path.join(__dirname, 'app');
const DEV = process.argv.includes('--dev') || !app.isPackaged;

protocol.registerSchemesAsPrivileged([{
  scheme: SCHEME,
  privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true, codeCache: true },
}]);

if (!app.requestSingleInstanceLock()) app.quit();

function json(status, obj) {
  return new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });
}

async function handle(req) {
  const u = new URL(req.url);
  if (u.pathname.startsWith('/api/')) {
    try {
      const init = { method: req.method, headers: req.headers };
      if (req.method !== 'GET' && req.method !== 'HEAD') { init.body = await req.arrayBuffer(); }
      return await net.fetch(SITE + u.pathname + u.search, init);
    } catch (e) {
      return json(503, { error: 'Нет подключения к интернету — эта функция работает только онлайн' });
    }
  }
  let rel = decodeURIComponent(u.pathname);
  if (rel === '/' || rel === '') rel = '/board/';
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.normalize(path.join(APP_DIR, rel));
  if (!file.startsWith(APP_DIR + path.sep)) return new Response('Forbidden', { status: 403 });
  if (!fs.existsSync(file)) return new Response('Not found', { status: 404 });
  return net.fetch(pathToFileURL(file).toString());
}

function createWindow() {
  const win = new BrowserWindow({
    title: 'MathFrame — Доска',
    icon: path.join(__dirname, 'build', 'icon.png'),
    width: 1280, height: 800, show: false,
    backgroundColor: '#0f1220',
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, spellcheck: false },
  });
  win.setMenuBarVisibility(false);
  win.once('ready-to-show', () => { win.maximize(); win.show(); });
  win.on('page-title-updated', (e) => { e.preventDefault(); win.setTitle('MathFrame — Доска'); });

  // Внешние ссылки — в системном браузере, внутри окна остаётся только доска
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => {
    if (url.startsWith(`${SCHEME}://${HOST}/board/`)) return;
    e.preventDefault();
    if (/^https?:/i.test(url)) shell.openExternal(url);
  });

  win.webContents.on('before-input-event', (e, input) => {
    if (input.type !== 'keyDown') return;
    if (input.key === 'F11') { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
    else if (DEV && (input.control || input.meta) && input.key.toLowerCase() === 'r') { win.webContents.reload(); e.preventDefault(); }
    else if (DEV && input.key === 'F12') { win.webContents.toggleDevTools(); e.preventDefault(); }
  });

  win.loadURL(START);
  return win;
}

app.on('second-instance', () => {
  const w = BrowserWindow.getAllWindows()[0];
  if (w) { if (w.isMinimized()) w.restore(); w.focus(); }
});

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  protocol.handle(SCHEME, handle);
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
