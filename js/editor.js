import { runPython, runSql } from './engine.js';
import { markExerciseDone } from './progress.js';

/**
 * Sync line numbers with textarea content.
 * Both elements share identical font-size, line-height and padding
 * (enforced in CSS with !important), so we just need matching text lines.
 */
function syncLines(textarea, linesEl) {
  const count = (textarea.value.match(/\n/g) || []).length + 1;
  linesEl.textContent = Array.from({ length: count }, (_, i) => i + 1).join('\n');
}

/**
 * Keep line numbers scroll-synced with the textarea.
 */
function syncScroll(textarea, linesEl) {
  linesEl.scrollTop = textarea.scrollTop;
}

export function mountEditors() {
  document.querySelectorAll('.editor').forEach((el) => {
    const textarea = el.querySelector('textarea.code');
    const linesEl = el.querySelector('.lines');
    const output = el.querySelector('.output');
    const runBtn = el.querySelector('[data-run]');
    const resetBtn = el.querySelector('[data-reset]');
    const original = textarea.value;

    // Initial line number render
    syncLines(textarea, linesEl);

    // Keep lines updated on input
    textarea.addEventListener('input', () => syncLines(textarea, linesEl));

    // Keep line numbers scroll-synced
    textarea.addEventListener('scroll', () => syncScroll(textarea, linesEl));

    // Tab support (4 spaces)
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = textarea.selectionStart;
        textarea.value = textarea.value.slice(0, start) + '    ' + textarea.value.slice(textarea.selectionEnd);
        textarea.selectionStart = textarea.selectionEnd = start + 4;
        syncLines(textarea, linesEl);
      }
    });

    // Run button
    runBtn.addEventListener('click', async () => {
      runBtn.disabled = true;
      runBtn.textContent = 'Cargando...';
      output.textContent = 'Ejecutando...';
      output.style.color = '';

      const mode = el.dataset.mode;
      const code = textarea.value;
      let rawResult = mode === 'sql' ? await runSql(code) : await runPython(code);
      
      let outText = typeof rawResult === 'string' ? rawResult : rawResult.text;
      let outImage = typeof rawResult === 'object' ? rawResult.image : null;
      
      output.textContent = outText;

      // Color output on error
      if (outText.startsWith('Error:')) {
        output.style.color = 'var(--red)';
      } else {
        output.style.color = '';
      }

      // Validate exercise
      const expected = el.dataset.expected;
      if (expected && outText.includes(expected)) {
        output.textContent += '\n\n\u2714 \u00a1Correcto!';
        const lesson = el.dataset.lesson;
        const exercise = el.dataset.exercise;
        if (lesson && exercise) markExerciseDone(lesson, exercise);
      }

      // Render image if matplotlib output was captured
      if (outImage) {
        const img = document.createElement('img');
        img.src = 'data:image/png;base64,' + outImage;
        output.appendChild(img);
      }

      runBtn.disabled = false;
      runBtn.textContent = '▶ Ejecutar';
      window.dispatchEvent(new CustomEvent('progress-updated'));
    });

    // Reset button
    resetBtn.addEventListener('click', () => {
      textarea.value = original;
      output.textContent = 'Hacé clic en ▶ Ejecutar';
      output.style.color = '';
      syncLines(textarea, linesEl);
    });
  });

  // Hint system
  document.querySelectorAll('[data-hint-btn]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const box = document.getElementById(btn.dataset.hintBtn);
      if (!box) return;
      const step = Number(box.dataset.step || 0) + 1;
      box.dataset.step = step;
      try {
        const hints = JSON.parse(box.dataset.hints);
        box.style.display = 'block';
        box.textContent = `Pista ${Math.min(step, hints.length)}/${hints.length}: ${hints[Math.min(step - 1, hints.length - 1)]}`;
      } catch (e) {
        box.style.display = 'block';
        box.textContent = 'No hay pistas disponibles.';
      }
    });
  });
}
