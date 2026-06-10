# MisFinanzasApp - Avance 70% Ionic Angular

Proyecto móvil desarrollado con Ionic + Angular. Incluye registro de usuario, inicio de sesión con LocalStorage, navegación principal, dashboard, ingresos, gastos, presupuestos, reportes, notificaciones, configuración y menú lateral.

## Ejecutar

```bash
npm install
ionic serve
```

Si no tienes Ionic CLI:

```bash
npm install -g @ionic/cli
```

Luego abre `http://localhost:8100`. Para visualizarlo como móvil en Chrome presiona `F12` y luego `Ctrl + Shift + M`.

## Usuario

Puedes crear un usuario en la pantalla de registro y luego ingresar con ese correo y contraseña.

## APK

Cuando esté listo para generar APK:

```bash
ionic build
ionic capacitor add android
ionic capacitor open android
```

## Estructura recomendada

La base actual del proyecto es valida. Para escalar mejor, se recomienda organizar `src/app` asi:

```text
src/app/
	core/       # singleton services, guards, interceptors, bootstrap
	shared/     # componentes/directivas/pipes reutilizables
	features/   # modulos o pantallas por dominio
	pages/      # estructura actual (puede migrarse gradualmente a features)
	components/ # estructura actual (puede migrarse gradualmente a shared)
	services/   # estructura actual (puede migrarse gradualmente a core/features)
```

## Control de archivos generados

Se agrego un `.gitignore` para evitar versionar dependencias y artefactos compilados (`node_modules`, `www`, `.angular`, etc.).

Si esos directorios ya estaban en Git, deja de rastrearlos con:

```bash
git rm -r --cached node_modules www .angular
git commit -m "chore: aplicar gitignore para archivos generados"
```
