import { StudyModule } from '../types/study';
import { SAMPLE_MODULES } from '../data/sampleModules';

const STORAGE_KEY = 'synapse_study_modules_v1';
const ACTIVE_ID_KEY = 'synapse_active_module_id_v1';

export function getSavedModules(): StudyModule[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Initialize with sample modules on first launch
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_MODULES));
      return SAMPLE_MODULES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SAMPLE_MODULES;
  } catch (err) {
    console.error('Failed to read modules from localStorage', err);
    return SAMPLE_MODULES;
  }
}

export function saveModules(modules: StudyModule[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(modules));
  } catch (err) {
    console.error('Failed to save modules to localStorage', err);
  }
}

export function getActiveModuleId(): string {
  try {
    const id = localStorage.getItem(ACTIVE_ID_KEY);
    if (id) return id;
    const modules = getSavedModules();
    return modules[0]?.id || 'sample-cellular-respiration';
  } catch {
    return 'sample-cellular-respiration';
  }
}

export function setActiveModuleId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_ID_KEY, id);
  } catch (err) {
    console.error('Failed to set active module id', err);
  }
}

export function saveModule(module: StudyModule): StudyModule[] {
  const current = getSavedModules();
  const index = current.findIndex((m) => m.id === module.id);
  let updated: StudyModule[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = module;
  } else {
    updated = [module, ...current];
  }
  saveModules(updated);
  return updated;
}

export function deleteModule(id: string): StudyModule[] {
  const current = getSavedModules();
  const updated = current.filter((m) => m.id !== id);
  saveModules(updated);
  return updated;
}
