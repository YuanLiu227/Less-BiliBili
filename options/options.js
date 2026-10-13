document.addEventListener('DOMContentLoaded', async () => {
  const textarea = document.getElementById('whitelist-allowed-urls');
  const errorText = document.getElementById('whitelist-error');
  let dirty = false;
  const controller = await createSettingsUI({
    render(settings) {
      // Changing a module must not erase an unfinished exception-page edit.
      if (!dirty) textarea.value = settings.whitelist.allowedUrls.join('\n');
    },
    status(text, error = false) {
      const el = document.getElementById('save-status');
      el.textContent = text;
      el.classList.toggle('error', error);
    }
  });
  if (!controller) return;
  textarea.addEventListener('input', () => {
    dirty = true;
    errorText.textContent = '';
    textarea.removeAttribute('aria-invalid');
  });
  document.getElementById('save-whitelist').addEventListener('click', async event => {
    const draft = textarea.value;
    try {
      const allowedUrls = BilibiliLessSettings.parseWhitelist(draft);
      event.target.disabled = true;
      await controller.write({ whitelist: { allowedUrls } });
      if (textarea.value === draft) {
        dirty = false;
        textarea.value = controller.getSettings().whitelist.allowedUrls.join('\n');
      }
      errorText.textContent = '';
      textarea.removeAttribute('aria-invalid');
    } catch (error) {
      errorText.textContent = error.message;
      textarea.setAttribute('aria-invalid', 'true');
    } finally { event.target.disabled = false; }
  });
  document.getElementById('reset-modules').addEventListener('click', async event => {
    event.target.disabled = true;
    try { await controller.write({}, true); } catch { /* Error remains visible. */ }
    finally { event.target.disabled = false; }
  });
});
