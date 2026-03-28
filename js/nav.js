import { computeStats } from './progress.js';

export const CATALOG = [
  ...Array.from({ length: 27 }, (_, i) => ({ id: `python-${String(i + 1).padStart(2, '0')}`, track: 'Python', url: `/python/${String(i + 1).padStart(2, '0')}-${[
'que-es-python','instalacion','tipos-de-datos','variables-constantes','operaciones','condicionales','comentarios-indentacion','listas','tuplas','diccionarios','sets','metodos-strings','metodos-listas','metodos-diccionarios','anidacion','while','for','funciones-basicas','funciones-avanzadas','modulos-stdlib','modulos-pip','scope-variables','strings-avanzado','archivos','excepciones-errores','clases-objetos-intro','proyecto-integrador-python'][i]}.html`, label: `${i + 1}. ${['Qué es Python','Instalación','Tipos de datos','Variables y constantes','Operaciones','Condicionales','Comentarios e indentación','Listas','Tuplas','Diccionarios','Sets','Métodos de strings','Métodos de listas','Métodos de diccionarios','Anidación','While','For','Funciones básicas','Funciones avanzadas','Módulos stdlib','Módulos pip','Scope de variables','Strings avanzado','Archivos','Excepciones y errores','Clases y objetos intro','Proyecto integrador'][i]}` })),
  ...Array.from({ length: 15 }, (_, i) => ({ id: `sql-${String(i + 1).padStart(2, '0')}`, track: 'SQL', url: `/sql/${String(i + 1).padStart(2, '0')}-${['que-es-sql','select-from-where','operadores-filtros','order-limit-distinct','funciones-agregacion','group-by-having','joins-inner','joins-left-right-full','subconsultas','ctes-with','window-functions','insert-update-delete','create-table-tipos','caso-practico-sql','proyecto-integrador-sql'][i]}.html`, label: `${i + 1}. ${['Qué es SQL','SELECT FROM WHERE','Operadores y filtros','ORDER LIMIT DISTINCT','Funciones de agregación','GROUP BY HAVING','INNER JOIN','LEFT RIGHT FULL JOIN','Subconsultas','CTEs con WITH','Window functions','INSERT UPDATE DELETE','CREATE TABLE y tipos','Caso práctico SQL','Proyecto integrador SQL'][i]}` })),
  ...Array.from({ length: 19 }, (_, i) => ({ id: `data-analysis-${String(i + 1).padStart(2, '0')}`, track: 'Data Analysis', url: `/data-analysis/${String(i + 1).padStart(2, '0')}-${['que-es-data-analysis','pandas-series-dataframes','pandas-lectura-datos','pandas-seleccion-filtrado','pandas-limpieza','pandas-transformaciones','pandas-groupby-pivot','pandas-merge-join-concat','estadistica-descriptiva','matplotlib-basico','seaborn-visualizacion','eda-completo','numpy-fundamentos','intro-machine-learning','regresion-clasificacion','power-bi-tableau-intro','sql-python-integracion','portfolio-proyecto-final','preparacion-entrevistas'][i]}.html`, label: `${i + 1}. ${['Qué es Data Analysis','Pandas: Series/DataFrames','Pandas: lectura de datos','Pandas: selección y filtrado','Pandas: limpieza','Pandas: transformaciones','Pandas: groupby y pivot','Pandas: merge/join/concat','Estadística descriptiva','Matplotlib básico','Seaborn visualización','EDA completo','NumPy fundamentos','Intro ML','Regresión y clasificación','Power BI/Tableau intro','Integración SQL+Python','Portfolio y proyecto final','Preparación entrevistas'][i]}` }))
];

export function renderSidebar(currentPath) {
  const mount = document.getElementById('sidebar-mount');
  if (!mount) return;
  const groups = ['Python', 'SQL', 'Data Analysis'];
  const stats = computeStats(CATALOG);
  mount.innerHTML = groups.map((group) => {
    const links = CATALOG.filter((l) => l.track === group).map((l, idx) => {
      const done = stats.state.lessons[l.id] ? 'done' : '';
      const active = currentPath.endsWith(l.url.replace(/^\//,'')) ? 'active' : '';
      return `<a class="nav-link ${done} ${active}" href="${l.url}"><span class="dot">${idx+1}</span><span>${l.label.replace(/^\d+\.\s/, '')}</span></a>`;
    }).join('');
    return `<div class="side-title">${group}</div>${links}`;
  }).join('');

  const fill = document.getElementById('global-progress-fill');
  const stat = document.getElementById('global-progress-text');
  if (fill) fill.style.width = `${stats.pct}%`;
  if (stat) stat.textContent = `${stats.completedLessons}/${stats.totalLessons} lecciones · ${stats.solvedExercises}/${stats.totalExercises} ejercicios · racha ${stats.streak} días`;
}
