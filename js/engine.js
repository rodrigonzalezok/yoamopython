let pyodideReady = null;
let sqlReady = null;
// Track which optional packages have already been loaded
const loadedOptional = new Set();

export async function ensurePyodide() {
  if (pyodideReady) return pyodideReady;
  pyodideReady = (async () => {
    const pyodide = await loadPyodide();
    // Only load core packages at startup (fast: ~10-15s)
    await pyodide.loadPackage(['pandas', 'numpy']);
    return pyodide;
  })();
  return pyodideReady;
}

/**
 * Lazily load optional heavy packages only when user code imports them.
 * This keeps initial load fast while still supporting matplotlib/seaborn/sklearn.
 */
const OPTIONAL_PACKAGES = {
  'matplotlib': 'matplotlib',
  'seaborn': 'seaborn',
  'sklearn': 'scikit-learn',
};

async function ensureOptionalPackages(code, py) {
  const needed = [];
  for (const [importName, pkgName] of Object.entries(OPTIONAL_PACKAGES)) {
    if (!loadedOptional.has(pkgName) && code.includes(importName)) {
      needed.push(pkgName);
    }
  }
  if (needed.length > 0) {
    await py.loadPackage(needed);
    needed.forEach(p => loadedOptional.add(p));
  }
}

export async function runPython(code) {
  let py;
  try {
    py = await ensurePyodide();
  } catch (err) {
    return { text: 'El motor Python aún se está cargando. Esperá unos segundos e intentá de nuevo.', image: null };
  }
  // Load optional heavy packages only if user code references them
  await ensureOptionalPackages(code, py);
  const setupCode = `
import sys, io, base64
_buf = io.StringIO()
sys.stdout = _buf
sys.stderr = _buf
`;
  py.runPython(setupCode);
  try {
    py.runPython(code);
    
    // Check for matplotlib figures and render to base64
    const renderCode = `
_b64 = None
if 'matplotlib.pyplot' in sys.modules:
    import matplotlib.pyplot as plt
    if plt.get_fignums():
        _img_buf = io.BytesIO()
        plt.savefig(_img_buf, format='png', bbox_inches='tight')
        plt.close('all')
        _b64 = base64.b64encode(_img_buf.getvalue()).decode('utf-8')
`;
    py.runPython(renderCode);

    const outText = py.runPython('_buf.getvalue()') || 'Ejecutado sin salida.';
    const outImg = py.runPython('_b64');
    
    return { text: outText, image: outImg };
  } catch (err) {
    const msg = String(err.message || err);
    // Clean up Pyodide internals from error message
    const lines = msg.split('\n').filter(l => !l.includes('pyodide') && !l.includes('wasm'));
    return { text: `Error: ${lines.join('\n') || msg}`, image: null };
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
    return 'El motor SQL aún se está cargando. Esperá unos segundos.';
  }
  // Create fresh DB for each run so CREATE TABLE doesn't conflict
  const db = new SQL.Database();
  try {
    const statements = query.split(';').filter(s => s.trim());
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
        output += `Error: ${e.message}`;
      }
    }
    db.close();
    return output || 'Query ejecutada (sin filas devueltas).';
  } catch (err) {
    db.close();
    return `Error: ${err.message}`;
  }
}
