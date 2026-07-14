import { test, expect } from '@playwright/test';

test.describe('Prueba de Sistema de Extremo a Extremo (E2E) - SEIOT', () => {

  test('Flujo Completo: Login, Crear Visita y Completar los 6 Módulos', async ({ page }) => {
    // Aumentar el tiempo límite para este test completo
    test.setTimeout(60000);

    // Escuchador para manejar los cuadros de diálogo (alerts) automáticos de la UI
    page.on('dialog', async dialog => {
      console.log(`[ALERT DIALOG]: ${dialog.message()}`);
      await dialog.accept();
    });

    // ── STEP 1: LOGIN ──
    console.log('Iniciando sesión...');
    await page.goto('/login');
    await page.fill('#login-usuario', 'admin');
    await page.fill('#login-password', 'admin123');
    await page.click('button[type="submit"]');

    // Validar acceso al Dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('h2:has-text("1. IDENTIFICACIÓN DEL PSG")')).toBeVisible();

    // ── STEP 2: CREAR NUEVA VISITA ──
    console.log('Buscando PSG e iniciando nueva visita...');
    // Escribir la clave PSG
    await page.fill('#psg-input', '18-017-0002-P02');
    
    // Esperar a que la búsqueda por API devuelva datos y muestre el titular
    await expect(page.locator('text=TITULAR:')).toBeVisible({ timeout: 10000 });

    // Seleccionar supervisor (índice 1, ya que solo hay 4 supervisores activos ahora)
    await page.selectOption('#supervisor-select', { index: 1 });

    // Clic en generar nuevo folio (desencadenará el alert de visita iniciada)
    await page.click('button:has-text("GENERAR NUEVO FOLIO")');

    // Validar que se muestre la zona de documentación requerida (indicando folio activo)
    await expect(page.locator('text=3. DOCUMENTACIÓN REQUERIDA')).toBeVisible();
    
    // ── STEP 3: MÓDULO 1 ──
    console.log('Completando Módulo 1 (Oficio de Notificación)...');
    await page.click('text=Oficio de Notificación');
    await expect(page).toHaveURL(/\/modulo1/);
    
    // Guardar módulo 1 (regresa al Dashboard y marca como completado)
    await page.click('button:has-text("PÁGINA SIGUIENTE")');
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('text=Completado').first()).toBeVisible();

    // ── STEP 4: MÓDULO 2 ──
    console.log('Completando Módulo 2 (Orden de Supervisión)...');
    await page.click('text=Orden de Supervisión');
    await expect(page).toHaveURL(/\/modulo2/);
    
    // Guardar módulo 2
    await page.click('button:has-text("PÁGINA SIGUIENTE")');
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('text=Completado').nth(1)).toBeVisible();

    // ── STEP 5: MÓDULO 3 ──
    console.log('Completando Módulo 3 (Lista de Verificación)...');
    await page.click('text=Lista de Verificación');
    await expect(page).toHaveURL(/\/modulo3/);
    
    // Navegar por las 6 subpáginas de la lista de verificación
    for (let i = 1; i <= 5; i++) {
      await page.click('button:has-text("SIGUIENTE")');
    }
    
    // Seleccionar conclusión en página 6
    await page.click('#conclusion-cumple');
    
    // Guardar checklist
    await page.click('button:has-text("GUARDAR CHECKLIST")');
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('text=Completado').nth(2)).toBeVisible();

    // ── STEP 6: MÓDULO 4 ──
    console.log('Completando Módulo 4 (Acta de Hechos)...');
    await page.click('text=Acta de Hechos');
    await expect(page).toHaveURL(/\/modulo4/);
    
    // Navegar por las 3 subpáginas
    await page.click('button:has-text("PÁGINA SIGUIENTE")');
    await page.click('button:has-text("PÁGINA SIGUIENTE")');
    
    // Guardar módulo 4
    await page.click('button:has-text("GUARDAR")');
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('text=Completado').nth(3)).toBeVisible();

    // ── STEP 7: MÓDULO 5 ──
    console.log('Completando Módulo 5 (Acta de Supervisión)...');
    await page.click('text=Acta de Supervisión');
    await expect(page).toHaveURL(/\/modulo5/);
    
    // Ir a página 2
    await page.click('button:has-text("PÁGINA SIGUIENTE")');
    
    // Seleccionar conclusión (está en la página 2)
    await page.click('#conclusion-cumple-m5');
    
    // Navegar por las páginas 3 y 4
    await page.click('button:has-text("PÁGINA SIGUIENTE")');
    await page.click('button:has-text("PÁGINA SIGUIENTE")');
    
    // Guardar módulo 5
    await page.click('button:has-text("GUARDAR")');
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('text=Completado').nth(4)).toBeVisible();

    // ── STEP 8: MÓDULO 6 ──
    console.log('Completando Módulo 6 (Acta Circunstanciada)...');
    await page.click('text=Acta Circunstanciada');
    await expect(page).toHaveURL(/\/modulo6/);
    
    // Navegar por las 5 subpáginas
    await page.click('button:has-text("PÁGINA SIGUIENTE")');
    await page.click('button:has-text("PÁGINA SIGUIENTE")');
    await page.click('button:has-text("PÁGINA SIGUIENTE")');
    await page.click('button:has-text("PÁGINA SIGUIENTE")');
    
    // Guardar módulo 6
    await page.click('button:has-text("GUARDAR")');
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Validar que todos los 6 módulos muestren "Completado"
    console.log('Validando que todos los 6 módulos estén completados...');
    const badgesCompletado = page.locator('text=Completado');
    await expect(badgesCompletado).toHaveCount(6);

    console.log('¡Prueba de integración de extremo a extremo finalizada con ÉXITO!');
  });

});
