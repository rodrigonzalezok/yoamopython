"""
Servidor local para QuieroProgramar.
Configura los headers COOP/COEP necesarios para que Pyodide
(SharedArrayBuffer) funcione correctamente en Chrome/Edge/Firefox.

Uso:
    python server.py

Abre http://localhost:8080 en tu navegador.
"""

import http.server
import os
import sys

PORT = 8080

# Mapa explícito de extensiones a MIME types.
# En Windows, Python a veces hereda del registro del SO y envía
# .js como text/plain, lo que rompe los ES modules del navegador.
MIME_OVERRIDES = {
    ".js": "application/javascript",
    ".mjs": "application/javascript",
    ".css": "text/css",
    ".html": "text/html",
    ".json": "application/json",
    ".wasm": "application/wasm",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".woff2": "font/woff2",
    ".woff": "font/woff",
    ".ttf": "font/ttf",
}


class COOPCOEPHandler(http.server.SimpleHTTPRequestHandler):
    """Extiende el servidor estático de Python para inyectar los headers
    de cross-origin isolation que requiere Pyodide y corregir MIME types."""

    def guess_type(self, path):
        """Forzar MIME types correctos sin depender del registro de Windows."""
        _, ext = os.path.splitext(path)
        if ext.lower() in MIME_OVERRIDES:
            return MIME_OVERRIDES[ext.lower()]
        return super().guess_type(path)

    def end_headers(self):
        self.send_header("Cross-Origin-Opener-Policy", "same-origin")
        self.send_header("Cross-Origin-Embedder-Policy", "credentialless")
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def send_header(self, keyword, value):
        """Eliminar Last-Modified para evitar 304 con MIME viejo cacheado."""
        if keyword.lower() == "last-modified":
            return  # No enviar Last-Modified → el browser no puede hacer 304
        super().send_header(keyword, value)


def main():
    with http.server.HTTPServer(("", PORT), COOPCOEPHandler) as httpd:
        print(f"\n  🚀  QuieroProgramar corriendo en http://localhost:{PORT}")
        print(f"  📂  Sirviendo archivos desde: {os.getcwd()}")
        print(f"  🛑  Presioná Ctrl+C para detener\n")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n  👋  Servidor detenido.")
            sys.exit(0)


if __name__ == "__main__":
    main()
