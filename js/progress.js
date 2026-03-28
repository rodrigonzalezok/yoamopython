const PROGRESS_KEY = 'quiero-programar-progress-v1';

export function readProgress() {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || { lessons: {}, exercises: {}, streak: { last: null, days: 0 } };
  } catch {
    return { lessons: {}, exercises: {}, streak: { last: null, days: 0 } };
  }
}

export function saveProgress(state) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(state));
}

export function markExerciseDone(lessonId, exerciseId) {
  const state = readProgress();
  if (!state.exercises[lessonId]) state.exercises[lessonId] = {};
  state.exercises[lessonId][exerciseId] = true;

  const solved = Object.values(state.exercises[lessonId]).filter(Boolean).length;
  if (solved >= 7) state.lessons[lessonId] = true;

  const today = new Date().toISOString().slice(0, 10);
  if (state.streak.last !== today) {
    const last = state.streak.last;
    if (last) {
      const diff = Math.round((new Date(today) - new Date(last)) / (1000 * 60 * 60 * 24));
      state.streak.days = diff === 1 ? state.streak.days + 1 : 1;
    } else {
      state.streak.days = 1;
    }
    state.streak.last = today;
  }

  saveProgress(state);
  return state;
}

export function computeStats(catalog) {
  const state = readProgress();
  const totalLessons = catalog.length;
  const totalExercises = totalLessons * 10;
  const completedLessons = Object.values(state.lessons).filter(Boolean).length;
  const solvedExercises = Object.values(state.exercises).reduce((acc, lesson) => acc + Object.values(lesson).filter(Boolean).length, 0);
  return {
    totalLessons,
    totalExercises,
    completedLessons,
    solvedExercises,
    streak: state.streak?.days || 0,
    pct: totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0,
    state,
  };
}
