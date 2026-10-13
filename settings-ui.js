// Common settings controller; the worker owns writes and network rule updates.
globalThis.createSettingsUI = async function ({ render, status }) {
  const { mergeSettings } = globalThis.BilibiliLessSettings;
  let settings;
  const pending = new Set();
  const inputs = [...document.querySelectorAll('input[type="checkbox"]')];
  const paint = () => {
    inputs.forEach(input => {
      if (pending.has(input.id)) return;
      input.checked = input.id === 'enabled' ? settings.enabled
        : settings.modules[input.id.replace('module-', '')];
    });
    render(settings);
  };
  async function load() {
    settings = mergeSettings((await chrome.storage.local.get('settings')).settings);
    paint();
  }
  async function write(patch, reset = false) {
    status('正在保存…');
    try {
      const response = await chrome.runtime.sendMessage({
        type: reset ? 'BILIBILI_LESS_RESET_MODULES' : 'BILIBILI_LESS_PATCH_SETTINGS', patch
      });
      if (!response?.ok) throw new Error(response?.error || '后台未响应，请重新加载扩展。');
      await load();
      status('已保存');
      return settings;
    } catch (error) {
      status(`保存失败：${error.message}`, true);
      throw error;
    }
  }
  try {
    await load();
    document.getElementById('settings-controls').disabled = false;
    status('设置自动保存');
  } catch (error) {
    status(`读取失败：${error.message}。请重新打开。`, true);
    return null;
  }
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !changes.settings) return;
    settings = mergeSettings(changes.settings.newValue);
    paint();
  });
  inputs.forEach(input => input.addEventListener('change', async () => {
    const patch = input.id === 'enabled' ? { enabled: input.checked }
      : { modules: { [input.id.replace('module-', '')]: input.checked } };
    pending.add(input.id);
    input.disabled = true;
    try { await write(patch); } catch { /* Error remains visible. */ }
    finally { pending.delete(input.id); input.disabled = false; paint(); }
  }));
  return { write, getSettings: () => settings };
};
