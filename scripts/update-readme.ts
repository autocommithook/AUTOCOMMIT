import { ROOT } from '../machine/config.ts';
import { updateReadme } from '../machine/readme.ts';
try { console.log(updateReadme(ROOT) ? 'Updated README live state.' : 'README already matches live state.'); }
catch (error) { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; }
