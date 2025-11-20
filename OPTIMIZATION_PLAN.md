3. Memoización del contexto
Problema: getClosestContext() se ejecuta en cada connectedCallback sin cachear.
Archivo: component.ts (líneas 113-129)
Solución: Cachear el contexto y invalidar solo cuando sea necesario.
6. Optimización de creación de Signals en Context
Problema: _stringToSignals crea nuevos Signals incluso si ya existen.
Archivo: context.ts (líneas 33-41)
Solución: Reutilizar Signals existentes cuando el valor no cambia.
7. Prevención de re-renders innecesarios
Problema: update() puede disparar renders sin verificar cambios.
Archivo: component.ts (líneas 131-134)
Solución: Comparar valores antes de renderizar.
8. Optimización de bindings en ElmComponent
Problema: _addBindAttribute manipula strings de forma ineficiente.
Archivo: elm.ts (líneas 75-91)
Solución: Usar parsing más eficiente y cachear expresiones procesadas.
9. Manejo de errores mejorado
Problema: Errores silenciosos o con console.error sin recuperación.
Archivos:
if.ts (línea 9)
component.ts (línea 167)
context.ts (línea 28)
Solución: Implementar error boundaries y manejo de errores consistente.
10. Optimización de event listeners
Problema: Los listeners pueden acumularse si no se limpian correctamente.
Archivo: component.ts (líneas 79-84)
Solución: Usar AbortSignal para cleanup automático (ya soportado por Signal).
11. Lazy evaluation de expresiones
Problema: Se evalúan expresiones incluso cuando no son necesarias.
Archivo: component.ts (líneas 142-170)
Solución: Implementar lazy evaluation para expresiones complejas.
12. Optimización de clonado de nodos
Problema: copyDefaultContent() clona nodos múltiples veces.
Archivo: component.ts (líneas 109-111)
Solución: Cachear clones o usar templates más eficientes.