/**
 * Carga Playwright desde el proyecto o, si no está, desde la instalación
 * global de npm (require no busca ahí por sí solo). Devuelve null si no hay.
 */
const path = require('path');
const { execSync } = require('child_process');

module.exports = function cargarPlaywright() {
  try {
    return require('playwright');
  } catch (e) {}
  try {
    const raizGlobal = execSync('npm root -g', { encoding: 'utf8' }).trim();
    return require(path.join(raizGlobal, 'playwright'));
  } catch (e) {
    return null;
  }
};
