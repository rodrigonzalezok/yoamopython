import { runPython, runSql } from './engine.js';
import { markExerciseDone } from './progress.js';

function lineNumbers(textarea, lines) {
  const count = (textarea.value.match(/\n/g)?.length || 0) + 1;
  lines.textContent = Array.from({ length: count }, (_, i) => i + 1).join('\n');
}

export function mountEditors() {
  document.querySelectorAll('.editor').forEach((el) => {
    const textarea = el.querySelector('textarea.code');
    const lines = el.querySelector('.lines');
    const output = el.querySelector('.output');
    const runBtn = el.querySelector('[data-run]');
    const resetBtn = el.querySelector('[data-reset]');
    const original = textarea.value;

    lineNumbers(textarea, lines);
    textarea.addEventListener('input', () => lineNumbers(textarea, lines));
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = textarea.selectionStart;
        textarea.value = textarea.value.slice(0, start) + '    ' + textarea.value.slice(textarea.selectionEnd);
        textarea.selectionStart = textarea.selectionEnd = start + 4;
        lineNumbers(textarea, lines);
      }
    });

    runBtn.addEventListener('click', async () => {
      output.textContent = '⏳ Ejecutando...';
      const mode = el.dataset.mode;
      const code = textarea.value;
      const result = mode === 'sql' ? await runSql(code) : await runPython(code);
      output.textContent = result;

      const expected = el.dataset.expected;
      if (expected && result.includes(expected)) {
        output.textContent += '\n\n🎉 Validación: correcto.';
        const lesson = el.dataset.lesson;
        const exercise = el.dataset.exercise;
        if (lesson && exercise) markExerciseDone(lesson, exercise);
      }
      window.dispatchEvent(new CustomEvent('progress-updated'));
    });

    resetBtn.addEventListener('click', () => {
      textarea.value = original;
      output.textContent = 'Output limpio.';
      lineNumbers(textarea, lines);
    });
  });

  document.querySelectorAll('[data-hint-btn]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const box = document.getElementById(btn.dataset.hintBtn);
      const step = Number(box.dataset.step || 0) + 1;
      box.dataset.step = step;
      const hints = JSON.parse(box.dataset.hints);
      box.style.display = 'block';
      box.textContent = hints[Math.min(step - 1, hints.length - 1)];
    });
  });
}
