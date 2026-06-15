const storageKey = 'workeasy-state';
const taskForm = document.querySelector('#taskForm');
const taskInput = document.querySelector('#taskInput');
const taskList = document.querySelector('#taskList');
const totalTasks = document.querySelector('#totalTasks');
const doneTasks = document.querySelector('#doneTasks');
const focusSessions = document.querySelector('#focusSessions');
const focusTotal = document.querySelector('#focusTotal');
const focusMinutes = document.querySelector('#focusMinutes');
const timerDisplay = document.querySelector('#timerDisplay');
const startPauseBtn = document.querySelector('#startPauseBtn');
const resetBtn = document.querySelector('#resetBtn');
const minutesInput = document.querySelector('#minutesInput');
const aiInput = document.querySelector('#aiInput');
const aiOutput = document.querySelector('#aiOutput');
const providerInput = document.querySelector('#providerInput');
const apiBaseInput = document.querySelector('#apiBaseInput');
const modelInput = document.querySelector('#modelInput');
const apiKeyInput = document.querySelector('#apiKeyInput');
const generatePromptBtn = document.querySelector('#generatePromptBtn');
const askAiBtn = document.querySelector('#askAiBtn');
const copyPromptBtn = document.querySelector('#copyPromptBtn');

let timerId = null;
let remainingSeconds = 25 * 60;
let state = loadState();

function loadState() {
  const fallback = {
    tasks: [],
    focusSessions: 0,
    focusTotal: 0,
    focusMinutes: 25,
    provider: 'claude',
    apiBase: 'https://api.openai.com/v1',
    model: 'claude-opus-4-7',
    apiKey: ''
  };

  try {
    return { ...fallback, ...JSON.parse(localStorage.getItem(storageKey)) };
  } catch {
    return fallback;
  }
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function render() {
  taskList.innerHTML = '';

  state.tasks.forEach((task) => {
    const item = document.createElement('li');
    item.className = `task-item${task.done ? ' done' : ''}`;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.done;
    checkbox.addEventListener('change', () => toggleTask(task.id));

    const label = document.createElement('span');
    label.textContent = task.title;

    const removeButton = document.createElement('button');
    removeButton.className = 'secondary';
    removeButton.textContent = '删除';
    removeButton.addEventListener('click', () => removeTask(task.id));

    item.append(checkbox, label, removeButton);
    taskList.append(item);
  });

  totalTasks.textContent = state.tasks.length;
  doneTasks.textContent = state.tasks.filter((task) => task.done).length;
  focusSessions.textContent = state.focusSessions;
  focusTotal.textContent = state.focusTotal;
  focusMinutes.textContent = state.focusMinutes;
  minutesInput.value = state.focusMinutes;
  providerInput.value = state.provider;
  apiBaseInput.value = state.apiBase;
  modelInput.value = state.model;
  apiKeyInput.value = state.apiKey;
  updateProviderFields();
  updateTimerDisplay();
}

function addTask(title) {
  state.tasks.unshift({
    id: crypto.randomUUID(),
    title,
    done: false
  });
  saveState();
  render();
}

function toggleTask(id) {
  state.tasks = state.tasks.map((task) => task.id === id ? { ...task, done: !task.done } : task);
  saveState();
  render();
}

function removeTask(id) {
  state.tasks = state.tasks.filter((task) => task.id !== id);
  saveState();
  render();
}

function updateTimerDisplay() {
  const minutes = Math.floor(remainingSeconds / 60).toString().padStart(2, '0');
  const seconds = (remainingSeconds % 60).toString().padStart(2, '0');
  timerDisplay.textContent = `${minutes}:${seconds}`;
}

function startTimer() {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
    startPauseBtn.textContent = '继续';
    return;
  }

  startPauseBtn.textContent = '暂停';
  timerId = setInterval(() => {
    remainingSeconds -= 1;
    updateTimerDisplay();

    if (remainingSeconds <= 0) {
      clearInterval(timerId);
      timerId = null;
      state.focusSessions += 1;
      state.focusTotal += state.focusMinutes;
      saveState();
      resetTimer();
      render();
    }
  }, 1000);
}

function resetTimer() {
  clearInterval(timerId);
  timerId = null;
  remainingSeconds = state.focusMinutes * 60;
  startPauseBtn.textContent = '开始';
  updateTimerDisplay();
}

function setFocusMinutes(value) {
  const minutes = Math.min(90, Math.max(5, Number(value) || 25));
  state.focusMinutes = minutes;
  saveState();
  resetTimer();
  render();
}

function buildWorkPrompt() {
  const activeTasks = state.tasks.filter((task) => !task.done).map((task) => `- ${task.title}`).join('\n') || '- 暂无未完成任务';
  const context = aiInput.value.trim() || '我需要整理今天的工作优先级。';

  return `你是我的 WorkEasy 工作助手。请基于以下信息，帮我输出：1）最重要的 3 个下一步；2）一个 25 分钟专注计划；3）需要我补充的信息。\n\n当前背景：\n${context}\n\n未完成任务：\n${activeTasks}`;
}

function generatePrompt() {
  aiOutput.textContent = buildWorkPrompt();
}

function saveAiSettings() {
  state.provider = providerInput.value;
  state.apiBase = apiBaseInput.value.trim();
  state.model = modelInput.value.trim();
  state.apiKey = apiKeyInput.value.trim();
  saveState();
}

function updateProviderFields() {
  const isClaude = providerInput.value === 'claude';
  apiBaseInput.disabled = isClaude;
  apiBaseInput.placeholder = isClaude ? 'Claude 官方 API 不需要填写地址' : 'API 地址，例如：https://api.openai.com/v1';
  modelInput.placeholder = isClaude ? '模型名，例如：claude-opus-4-7' : '模型名，例如：gpt-4o-mini / deepseek-chat';

  if (isClaude && (!modelInput.value || modelInput.value === 'gpt-4o-mini')) {
    modelInput.value = 'claude-opus-4-7';
  }

  if (!isClaude && !apiBaseInput.value) {
    apiBaseInput.value = 'https://api.openai.com/v1';
  }

  saveAiSettings();
}

async function askLargeModel() {
  saveAiSettings();

  if (!state.apiKey || !state.model || (state.provider !== 'claude' && !state.apiBase)) {
    aiOutput.textContent = '请先选择提供商，并填写模型名和 API Key。';
    return;
  }

  askAiBtn.disabled = true;
  askAiBtn.textContent = '调用中...';
  aiOutput.textContent = '正在请求大模型，请稍候...';

  try {
    aiOutput.textContent = await window.workbuddy.askLargeModel({
      provider: state.provider,
      apiBase: state.apiBase,
      model: state.model,
      apiKey: state.apiKey,
      messages: [
        { role: 'system', content: '你是一个简洁、可靠的中文工作效率助手。' },
        { role: 'user', content: buildWorkPrompt() }
      ]
    });
  } catch (error) {
    aiOutput.textContent = `调用失败：${error.message}`;
  } finally {
    askAiBtn.disabled = false;
    askAiBtn.textContent = '调用大模型';
  }
}

taskForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const title = taskInput.value.trim();

  if (!title) {
    return;
  }

  addTask(title);
  taskInput.value = '';
});

startPauseBtn.addEventListener('click', startTimer);
resetBtn.addEventListener('click', resetTimer);
minutesInput.addEventListener('change', (event) => setFocusMinutes(event.target.value));
providerInput.addEventListener('change', updateProviderFields);
apiBaseInput.addEventListener('change', saveAiSettings);
modelInput.addEventListener('change', saveAiSettings);
apiKeyInput.addEventListener('change', saveAiSettings);
generatePromptBtn.addEventListener('click', generatePrompt);
askAiBtn.addEventListener('click', askLargeModel);
copyPromptBtn.addEventListener('click', async () => {
  await navigator.clipboard.writeText(aiOutput.textContent);
  copyPromptBtn.textContent = '已复制';
  setTimeout(() => {
    copyPromptBtn.textContent = '复制提示词';
  }, 1200);
});

remainingSeconds = state.focusMinutes * 60;
render();
