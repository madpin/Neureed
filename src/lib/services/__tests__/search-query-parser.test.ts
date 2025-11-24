/**
 * Tests for search query parser
 */

import { parseQuery, validateQuery, explainQuery, extractTerms } from '../search-query-parser';

describe('Search Query Parser', () => {
  describe('parseQuery', () => {
    test('parses simple term', () => {
      const result = parseQuery('machine learning');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.ast.type).toBe('and');
      expect(result.ast.children).toHaveLength(2);
    });

    test('parses phrase', () => {
      const result = parseQuery('"machine learning"');
      expect(result.valid).toBe(true);
      expect(result.ast.type).toBe('phrase');
      expect(result.ast.value).toBe('machine learning');
    });

    test('parses OR operator', () => {
      const result = parseQuery('AI, ML');
      expect(result.valid).toBe(true);
      expect(result.ast.type).toBe('or');
      expect(result.ast.children).toHaveLength(2);
    });

    test('parses AND operator', () => {
      const result = parseQuery('+python +django');
      expect(result.valid).toBe(true);
      expect(result.ast.type).toBe('and');
      expect(result.ast.children).toHaveLength(2);
      expect(result.ast.children?.[0].required).toBe(true);
      expect(result.ast.children?.[1].required).toBe(true);
    });

    test('parses NOT operator', () => {
      const result = parseQuery('python -java');
      expect(result.valid).toBe(true);
      expect(result.ast.type).toBe('and');
      expect(result.ast.children).toHaveLength(2);
      expect(result.ast.children?.[1].excluded).toBe(true);
    });

    test('parses grouped expression', () => {
      const result = parseQuery('(AI, ML) +ethics');
      expect(result.valid).toBe(true);
      expect(result.ast.type).toBe('and');
      expect(result.ast.children).toHaveLength(2);
      expect(result.ast.children?.[0].type).toBe('group');
    });

    test('parses complex nested query', () => {
      const result = parseQuery('(machine learning, AI) +python -java "deep learning"');
      expect(result.valid).toBe(true);
      expect(result.ast.type).toBe('and');
      expect(result.ast.children?.length).toBeGreaterThan(0);
    });

    test('handles empty query', () => {
      const result = parseQuery('');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Query cannot be empty');
    });

    test('detects unbalanced parentheses', () => {
      const result = parseQuery('(AI, ML');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateQuery', () => {
    test('validates correct query', () => {
      const result = validateQuery('machine learning, AI');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('invalidates empty query', () => {
      const result = validateQuery('');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('explainQuery', () => {
    test('explains simple term', () => {
      const result = parseQuery('machine learning');
      const explanation = explainQuery(result.ast);
      expect(explanation).toContain('machine');
      expect(explanation).toContain('learning');
    });

    test('explains phrase', () => {
      const result = parseQuery('"machine learning"');
      const explanation = explainQuery(result.ast);
      expect(explanation).toContain('exact phrase');
      expect(explanation).toContain('machine learning');
    });

    test('explains OR expression', () => {
      const result = parseQuery('AI, ML');
      const explanation = explainQuery(result.ast);
      expect(explanation).toContain('OR');
    });

    test('explains NOT expression', () => {
      const result = parseQuery('-java');
      const explanation = explainQuery(result.ast);
      expect(explanation).toContain('NOT');
    });
  });

  describe('extractTerms', () => {
    test('extracts terms from simple query', () => {
      const result = parseQuery('machine learning');
      const terms = extractTerms(result.ast);
      expect(terms).toContain('machine');
      expect(terms).toContain('learning');
      expect(terms).toHaveLength(2);
    });

    test('extracts terms from complex query', () => {
      const result = parseQuery('(AI, ML) +python -java "deep learning"');
      const terms = extractTerms(result.ast);
      expect(terms).toContain('AI');
      expect(terms).toContain('ML');
      expect(terms).toContain('python');
      expect(terms).toContain('java');
      expect(terms).toContain('deep learning');
    });

    test('extracts phrases', () => {
      const result = parseQuery('"machine learning"');
      const terms = extractTerms(result.ast);
      expect(terms).toContain('machine learning');
      expect(terms).toHaveLength(1);
    });
  });

  describe('Operator precedence', () => {
    test('handles OR with lower precedence than AND', () => {
      const result = parseQuery('AI, ML +python');
      expect(result.valid).toBe(true);
      expect(result.ast.type).toBe('or');
    });

    test('groups work correctly', () => {
      const result = parseQuery('(AI, ML)');
      expect(result.valid).toBe(true);
      expect(result.ast.type).toBe('group');
      expect(result.ast.children?.[0].type).toBe('or');
    });
  });

  describe('Edge cases', () => {
    test('handles escaped quotes in phrases', () => {
      const result = parseQuery('"machine \\"learning\\""');
      expect(result.valid).toBe(true);
      expect(result.ast.value).toContain('machine "learning"');
    });

    test('handles whitespace', () => {
      const result = parseQuery('  machine   learning  ');
      expect(result.valid).toBe(true);
    });

    test('handles special characters in terms', () => {
      const result = parseQuery('C++ .NET');
      expect(result.valid).toBe(true);
    });

    test('handles multiple OR operators', () => {
      const result = parseQuery('AI, ML, deep learning, neural networks');
      expect(result.valid).toBe(true);
      expect(result.ast.type).toBe('or');
      expect(result.ast.children?.length).toBe(4);
    });
  });
});
