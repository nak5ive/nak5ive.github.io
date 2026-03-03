// src/types.ts
// TypeScript interfaces mirroring the YAML schemas in content/*.yaml
// These are the single source of truth for data shapes used by all components.

export interface ShowcaseItem {
  name: string;
  description?: string;
  bullets?: string[];
  screenshots: string[];
}

export interface Company {
  company: string;
  role: string;
  start: string;
  end: string;
  location: string;
  logo: string;
  responsibilities?: string[];
  entries: ShowcaseItem[];
}

export interface ProjectLinks {
  github?: string;
  demo?: string;
}

export interface Project {
  name: string;
  description: string;
  tech: string[];
  links: ProjectLinks;
  screenshots: string[];
}

export interface SkillCategory {
  category: string;
  skills: string[];
}

export interface Education {
  institution: string;
  logo?: string;
  degree: string;
  field: string;
  start: string;
  end: string;
  location: string;
  gpa?: string;
  notes?: string;
}

export interface SocialLink {
  platform: string;
  url: string;
  label: string;
}

export interface Contact {
  email: string;
  phone: string;
}

export interface Meta {
  name: string;
  preferredName?: string;
  title: string;
  bio: string;
  location: string;
  photo?: string;
  photoThumb?: string;
  contact: Contact;
  social: SocialLink[];
}
