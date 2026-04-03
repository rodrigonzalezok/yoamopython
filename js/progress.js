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

export function exportProgress() {
  const state = readProgress();
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
  const dlAnchorElem = document.createElement('a');
  dlAnchorElem.setAttribute("href", dataStr);
  dlAnchorElem.setAttribute("download", "quiero_programar_progreso.json");
  document.body.appendChild(dlAnchorElem);
  dlAnchorElem.click();
  document.body.removeChild(dlAnchorElem);
}

export function importProgress(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    if (data && typeof data === 'object' && data.lessons && data.exercises && data.streak) {
      saveProgress(data);
      return true;
    }
  } catch (e) {
    console.error("Invalid progress file");
  }
  return false;
}

export function getDashboardProps(catalog) {
  const state = readProgress();
  const stats = computeStats(catalog);
  
  let nextLesson = catalog[0];
  for (let i = 0; i < catalog.length; i++) {
    if (!state.lessons[catalog[i].id]) {
      nextLesson = catalog[i];
      break;
    }
  }

  const completedIds = Object.keys(state.lessons).filter(k => state.lessons[k]);
  const recentIds = completedIds.slice(-3).reverse();
  const recentLessons = recentIds.map(id => catalog.find(c => c.id === id)).filter(Boolean);

  const today = new Date().toISOString().slice(0, 10);
  let streakActive = false;
  if (state.streak.last) {
    const last = state.streak.last;
    if (last === today) {
      streakActive = true;
    } else {
      const diff = Math.round((new Date(today) - new Date(last)) / (1000 * 60 * 60 * 24));
      streakActive = diff === 1;
    }
  }

  return {
    nextLesson,
    recentLessons,
    streakActive,
    stats
  };
}
