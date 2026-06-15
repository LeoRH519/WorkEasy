const { app, BrowserWindow, ipcMain } = require('electron');
const Anthropic = require('@anthropic-ai/sdk');
const path = require('path');

async function callOpenAiCompatible({ apiBase, apiKey, model, messages }) {
  const endpoint = `${apiBase.replace(/\/$/, '')}/chat/completions`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`模型接口返回 ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || '模型没有返回内容。';
}

async function callClaude({ apiKey, model, messages }) {
  const client = new Anthropic({ apiKey });
  const system = messages.find((message) => message.role === 'system')?.content;
  const claudeMessages = messages
    .filter((message) => message.role !== 'system')
    .map((message) => ({ role: message.role, content: message.content }));

  const response = await client.messages.create({
    model,
    max_tokens: 4096,
    system,
    messages: claudeMessages
  });

  return response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim() || 'Claude 没有返回内容。';
}

async function callLargeModel(payload) {
  if (payload.provider === 'claude') {
    return callClaude(payload);
  }

  return callOpenAiCompatible(payload);
}

ipcMain.handle('ask-large-model', async (_event, payload) => callLargeModel(payload));

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1180,
    height: 780,
    minWidth: 960,
    minHeight: 650,
    title: 'WorkEasy',
    backgroundColor: '#eef2ff',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
