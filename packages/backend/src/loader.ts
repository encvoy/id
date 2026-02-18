import { Type } from '@nestjs/common';
import * as path from 'path';
import { loadModules } from './helpers';

/**
 * Loads extensions from the extensions folder
 */
export class ExtensionsLoader {
  static async load(pathFolder: string): Promise<Type<any>[]> {
    const modules: Type<any>[] = [];
    const fullPath = path.join(__dirname, pathFolder);
    await loadModules(fullPath, async (module) => {
      // Check for presence of Module class
      const moduleKey = Object.keys(module).find((key) => key.endsWith('Module'));

      if (moduleKey && module[moduleKey]) {
        const ModuleClass = module[moduleKey];

        // Run bootstrap if present
        if (ModuleClass.bootstrap) {
          await ModuleClass.bootstrap();
        }

        modules.push(ModuleClass);
      }
    });

    return modules;
  }
}
