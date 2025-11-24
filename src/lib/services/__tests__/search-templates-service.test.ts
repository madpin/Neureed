/**
 * Unit Tests: Search Templates Service
 *
 * Tests template management and search functionality
 */

import { describe, it, expect } from '@jest/globals';
import {
  getAllTemplates,
  getTemplatesByCategory,
  getTemplateById,
  searchTemplates,
  getTemplateCategories,
  getPopularTemplates,
  suggestTemplates,
  customizeTemplate,
  validateTemplate,
  exportTemplate,
  importTemplate,
} from '../search-templates-service';

describe('Search Templates Service', () => {
  describe('getAllTemplates', () => {
    it('should return all templates', () => {
      const templates = getAllTemplates();

      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
    });

    it('should return templates with required fields', () => {
      const templates = getAllTemplates();

      templates.forEach((template) => {
        expect(template.id).toBeDefined();
        expect(template.name).toBeDefined();
        expect(template.description).toBeDefined();
        expect(template.category).toBeDefined();
        expect(template.query).toBeDefined();
        expect(template.icon).toBeDefined();
        expect(Array.isArray(template.tags)).toBe(true);
      });
    });
  });

  describe('getTemplatesByCategory', () => {
    it('should return templates for technology category', () => {
      const templates = getTemplatesByCategory('technology');

      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
      expect(templates.every((t) => t.category === 'technology')).toBe(true);
    });

    it('should return templates for news category', () => {
      const templates = getTemplatesByCategory('news');

      expect(templates.every((t) => t.category === 'news')).toBe(true);
    });

    it('should return templates for research category', () => {
      const templates = getTemplatesByCategory('research');

      expect(templates.every((t) => t.category === 'research')).toBe(true);
    });

    it('should return templates for jobs category', () => {
      const templates = getTemplatesByCategory('jobs');

      expect(templates.every((t) => t.category === 'jobs')).toBe(true);
    });

    it('should return empty array for custom category', () => {
      const templates = getTemplatesByCategory('custom');

      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBe(0);
    });
  });

  describe('getTemplateById', () => {
    it('should return template by valid ID', () => {
      const allTemplates = getAllTemplates();
      const firstTemplate = allTemplates[0];

      const template = getTemplateById(firstTemplate.id);

      expect(template).toBeDefined();
      expect(template?.id).toBe(firstTemplate.id);
    });

    it('should return undefined for invalid ID', () => {
      const template = getTemplateById('non-existent-id');

      expect(template).toBeUndefined();
    });
  });

  describe('searchTemplates', () => {
    it('should find templates by name keyword', () => {
      const results = searchTemplates('machine learning');

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      expect(
        results.some((t) => t.name.toLowerCase().includes('machine learning'))
      ).toBe(true);
    });

    it('should find templates by description keyword', () => {
      const results = searchTemplates('security');

      expect(results.length).toBeGreaterThan(0);
      expect(
        results.some(
          (t) =>
            t.name.toLowerCase().includes('security') ||
            t.description.toLowerCase().includes('security')
        )
      ).toBe(true);
    });

    it('should find templates by tag', () => {
      const results = searchTemplates('technology');

      expect(results.length).toBeGreaterThan(0);
    });

    it('should be case-insensitive', () => {
      const lower = searchTemplates('machine');
      const upper = searchTemplates('MACHINE');
      const mixed = searchTemplates('MaChInE');

      expect(lower.length).toBe(upper.length);
      expect(lower.length).toBe(mixed.length);
    });

    it('should return empty array for non-matching keyword', () => {
      const results = searchTemplates('xyz-nonexistent-keyword-123');

      expect(results).toEqual([]);
    });
  });

  describe('getTemplateCategories', () => {
    it('should return all categories with counts', () => {
      const categories = getTemplateCategories();

      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBe(5); // technology, news, research, jobs, custom

      categories.forEach((cat) => {
        expect(cat.category).toBeDefined();
        expect(cat.label).toBeDefined();
        expect(cat.icon).toBeDefined();
        expect(typeof cat.count).toBe('number');
      });
    });

    it('should have correct counts', () => {
      const categories = getTemplateCategories();
      const allTemplates = getAllTemplates();

      const technologyCount = allTemplates.filter(
        (t) => t.category === 'technology'
      ).length;
      const technologyCategory = categories.find(
        (c) => c.category === 'technology'
      );

      expect(technologyCategory?.count).toBe(technologyCount);
    });
  });

  describe('getPopularTemplates', () => {
    it('should return limited number of templates', () => {
      const templates = getPopularTemplates(5);

      expect(templates.length).toBeLessThanOrEqual(5);
    });

    it('should return default 5 templates', () => {
      const templates = getPopularTemplates();

      expect(templates.length).toBe(5);
    });
  });

  describe('suggestTemplates', () => {
    it('should suggest templates based on topics', () => {
      const suggestions = suggestTemplates(['ai', 'machine learning']);

      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('should return popular templates for empty topics', () => {
      const suggestions = suggestTemplates([]);

      expect(suggestions.length).toBe(5);
    });

    it('should match topics to template tags', () => {
      const suggestions = suggestTemplates(['security', 'cybersecurity']);

      expect(
        suggestions.some((t) =>
          t.tags.some((tag) => ['security', 'infosec'].includes(tag))
        )
      ).toBe(true);
    });

    it('should return at most 5 suggestions', () => {
      const suggestions = suggestTemplates(['technology', 'programming', 'ai']);

      expect(suggestions.length).toBeLessThanOrEqual(5);
    });
  });

  describe('customizeTemplate', () => {
    it('should create customized template', () => {
      const original = getAllTemplates()[0];
      const customized = customizeTemplate(original, {
        name: 'My Custom Search',
        threshold: 0.8,
      });

      expect(customized.name).toBe('My Custom Search');
      expect(customized.threshold).toBe(0.8);
      expect(customized.category).toBe('custom');
      expect(customized.query).toBe(original.query);
    });

    it('should generate new ID for customized template', () => {
      const original = getAllTemplates()[0];
      const customized = customizeTemplate(original, {
        name: 'Custom',
      });

      expect(customized.id).not.toBe(original.id);
      expect(customized.id).toContain('custom');
    });

    it('should allow query customization', () => {
      const original = getAllTemplates()[0];
      const customized = customizeTemplate(original, {
        query: 'custom query',
      });

      expect(customized.query).toBe('custom query');
    });
  });

  describe('validateTemplate', () => {
    it('should validate template with valid query', () => {
      const template = getAllTemplates()[0];
      const validation = validateTemplate(template);

      expect(validation.valid).toBe(true);
      expect(validation.errors.length).toBe(0);
    });

    it('should reject template with invalid query', () => {
      const template = {
        ...getAllTemplates()[0],
        query: '((unbalanced',
      };

      const validation = validateTemplate(template);

      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('exportTemplate', () => {
    it('should export template to JSON string', () => {
      const template = getAllTemplates()[0];
      const exported = exportTemplate(template);

      expect(typeof exported).toBe('string');
      expect(() => JSON.parse(exported)).not.toThrow();
    });

    it('should preserve all template fields', () => {
      const template = getAllTemplates()[0];
      const exported = exportTemplate(template);
      const parsed = JSON.parse(exported);

      expect(parsed.id).toBe(template.id);
      expect(parsed.name).toBe(template.name);
      expect(parsed.query).toBe(template.query);
      expect(parsed.category).toBe(template.category);
    });
  });

  describe('importTemplate', () => {
    it('should import valid template JSON', () => {
      const original = getAllTemplates()[0];
      const exported = exportTemplate(original);
      const imported = importTemplate(exported);

      expect(imported.id).toBe(original.id);
      expect(imported.name).toBe(original.name);
      expect(imported.query).toBe(original.query);
    });

    it('should reject invalid JSON', () => {
      expect(() => importTemplate('not valid json')).toThrow(/Failed to import/);
    });

    it('should reject JSON missing required fields', () => {
      const invalid = JSON.stringify({ name: 'Test' });

      expect(() => importTemplate(invalid)).toThrow(/missing required fields/);
    });

    it('should reject template with invalid query', () => {
      const invalid = JSON.stringify({
        id: 'test',
        name: 'Test',
        query: '((invalid',
        category: 'custom',
        icon: '🔍',
        tags: [],
        description: 'Test',
      });

      expect(() => importTemplate(invalid)).toThrow(/Invalid template query/);
    });
  });

  describe('Template Quality', () => {
    it('should have unique template IDs', () => {
      const templates = getAllTemplates();
      const ids = templates.map((t) => t.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(templates.length);
    });

    it('should have all templates with non-empty queries', () => {
      const templates = getAllTemplates();

      templates.forEach((template) => {
        expect(template.query.trim().length).toBeGreaterThan(0);
      });
    });

    it('should have all templates with valid thresholds', () => {
      const templates = getAllTemplates();

      templates.forEach((template) => {
        if (template.threshold !== undefined) {
          expect(template.threshold).toBeGreaterThanOrEqual(0);
          expect(template.threshold).toBeLessThanOrEqual(1);
        }
      });
    });

    it('should have all templates with valid recency bias', () => {
      const templates = getAllTemplates();

      templates.forEach((template) => {
        if (template.recencyBias !== undefined) {
          expect(template.recencyBias).toBeGreaterThanOrEqual(0);
          expect(template.recencyBias).toBeLessThanOrEqual(1);
        }
      });
    });

    it('should have all templates with at least one tag', () => {
      const templates = getAllTemplates();

      templates.forEach((template) => {
        expect(template.tags.length).toBeGreaterThan(0);
      });
    });
  });
});
