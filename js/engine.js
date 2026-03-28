let pyodideReady = null;
let sqlReady = null;
let db = null;

export async function ensurePyodide() {
  if (pyodideReady) return pyodideReady;
  pyodideReady = (async () => {
    const pyodide = await loadPyodide();
    return pyodide;
  })();
  return pyodideReady;
}

export async function runPython(code) {
  const py = await ensurePyodide();
  py.runPython(`import sys, io\n_buf = io.StringIO()\nsys.stdout = _buf\nsys.stderr = _buf`);
  try {
    py.runPython(code);
    return py.runPython('_buf.getvalue()') || '✅ Ejecutado sin salida';
  } catch (err) {
    return `❌ ${err}`;
  }
}

export async function ensureSql() {
  if (sqlReady) return { SQL: await sqlReady, db };
  sqlReady = initSqlJs({ locateFile: (file) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}` });
  const SQL = await sqlReady;
  db = new SQL.Database();
  return { SQL, db };
}

export async function runSql(query) {
  const ctx = await ensureSql();
  try {
    const res = ctx.db.exec(query);
    if (!res.length) return '✅ Query ejecutada (sin filas devueltas)';
    const first = res[0];
    const rows = [first.columns.join(' | ')].concat(first.values.map((r) => r.join(' | ')));
    return rows.join('\n');
  } catch (err) {
    return `❌ ${err.message}`;
  }
}
