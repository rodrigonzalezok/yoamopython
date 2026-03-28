let pyodideReady = null;
let sqlReady = null;

export async function ensurePyodide() {
  if (pyodideReady) return pyodideReady;
  pyodideReady = (async () => {
    const pyodide = await loadPyodide();
    await pyodide.loadPackage(['pandas', 'numpy']);
    return pyodide;
  })();
  return pyodideReady;
}

export async function runPython(code) {
  let py;
  try {
    py = await ensurePyodide();
  } catch (err) {
    return '⏳ El motor Python aún se está cargando. Esperá unos segundos e intentá de nuevo.';
  }
  py.runPython(`import sys, io\n_buf = io.StringIO()\nsys.stdout = _buf\nsys.stderr = _buf`);
  try {
    py.runPython(code);
    const out = py.runPython('_buf.getvalue()');
    return out || '✅ Ejecutado sin salida';
  } catch (err) {
    const msg = String(err.message || err);
    // Clean up Pyodide internals from error message
    const lines = msg.split('\n').filter(l => !l.includes('pyodide') && !l.includes('wasm'));
    return `❌ ${lines.join('\n') || msg}`;
  } finally {
    py.runPython('sys.stdout = sys.__stdout__\nsys.stderr = sys.__stderr__');
  }
}

export async function ensureSql() {
  if (sqlReady) return sqlReady;
  sqlReady = (async () => {
    const SQL = await initSqlJs({ locateFile: (file) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}` });
    return SQL;
  })();
  return sqlReady;
}

export async function runSql(query) {
  let SQL;
  try {
    SQL = await ensureSql();
  } catch (err) {
    return '⏳ El motor SQL aún se está cargando. Esperá unos segundos.';
  }
  // Create fresh DB for each run so CREATE TABLE doesn't conflict
  const db = new SQL.Database();
  try {
    const statements = query.split(';').filter(s => s.trim() && !s.trim().startsWith('--'));
    let output = '';
    for (const stmt of statements) {
      const trimmed = stmt.trim();
      if (!trimmed) continue;
      try {
        const res = db.exec(trimmed);
        for (const r of res) {
          const colWidths = r.columns.map((col, i) => {
            const vals = r.values.map(row => String(row[i] === null ? 'NULL' : row[i]).length);
            return Math.max(col.length, ...vals);
          });
          const header = r.columns.map((c, i) => c.padEnd(colWidths[i])).join(' │ ');
          const sep = colWidths.map(w => '─'.repeat(w)).join('─┼─');
          const rows = r.values.map(row =>
            row.map((v, i) => String(v === null ? 'NULL' : v).padEnd(colWidths[i])).join(' │ ')
          ).join('\n');
          if (output) output += '\n\n';
          output += header + '\n' + sep + '\n' + rows;
        }
      } catch (e) {
        if (output) output += '\n';
        output += `❌ ${e.message}`;
      }
    }
    db.close();
    return output || '✅ Query ejecutada (sin filas devueltas)';
  } catch (err) {
    db.close();
    return `❌ ${err.message}`;
  }
}
