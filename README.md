# Quiero Programar

Plataforma educativa multipágina para formarte como Data Analyst con rutas de Python, SQL y Data Analysis.

- Autor: Rodri Gonzalez
- Comunidad: @yoamopython
- Sitio: rodrigonzalez.com.ar

## Si el PR aparece con conflictos (GitHub)

Si ves el mensaje **"This branch has conflicts that must be resolved"**, seguí este flujo en local:

```bash
git checkout work
# Traé cambios remotos
git fetch origin

# Rebase sobre la rama destino (ajustá main/master según tu repo)
git rebase origin/main

# Si hay conflictos: resolvé archivo por archivo, luego:
git add <archivo>
git rebase --continue

# Repetí hasta terminar. Si querés cancelar:
# git rebase --abort

# Empujá la rama actualizada
git push --force-with-lease origin work
```

### Recomendación para evitar conflictos masivos

Para avanzar "lento pero bien" (una página a la vez), usá ramas chicas por lección:

```bash
git checkout -b feat/python-01-profundo origin/main
# Editás solo python/01-que-es-python.html (y assets mínimos)
git add python/01-que-es-python.html css/styles.css
git commit -m "Profundiza Python 01 con ejemplos y ejercicios reales"
git push -u origin feat/python-01-profundo
```

Esto reduce muchísimo la chance de conflictos en PR.
