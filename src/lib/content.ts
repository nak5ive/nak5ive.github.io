// src/lib/content.ts
// Typed loaders for all content YAML files.
// Called only at build time — never in the browser.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import yaml from 'js-yaml';
import type { Company, Project, SkillCategory, Education, Meta } from '../types';

const contentDir = join(process.cwd(), 'content');

function load<T>(filename: string): T {
  const raw = readFileSync(join(contentDir, filename), 'utf-8');
  return yaml.load(raw) as T;
}

export const getExperience  = (): Company[]       => load('experience.yaml');
export const getProjects    = (): Project[]        => (load('projects.yaml') ?? []);
export const getSkills      = (): SkillCategory[]  => load('skills.yaml');
export const getEducation   = (): Education[]      => load('education.yaml');
export const getMeta        = (): Meta             => load('meta.yaml');
