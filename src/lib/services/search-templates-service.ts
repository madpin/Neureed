/**
 * Search Templates Service
 *
 * Provides pre-defined search templates for common use cases.
 * Templates help users quickly create effective saved searches without
 * needing to learn the query syntax.
 */

export interface SearchTemplate {
  id: string;
  name: string;
  description: string;
  category: 'technology' | 'news' | 'research' | 'jobs' | 'custom';
  query: string;
  icon: string;
  threshold?: number;
  recencyBias?: number;
  tags: string[];
  usageCount?: number;
}

/**
 * Pre-defined search templates
 */
export const SEARCH_TEMPLATES: SearchTemplate[] = [
  // Technology Templates
  {
    id: 'ai-ml-general',
    name: 'AI & Machine Learning',
    description: 'Articles about artificial intelligence, machine learning, and neural networks',
    category: 'technology',
    query: '(artificial intelligence, machine learning, deep learning, neural network) -advertising',
    icon: '🤖',
    threshold: 0.65,
    recencyBias: 0.1,
    tags: ['ai', 'ml', 'technology'],
  },
  {
    id: 'cybersecurity',
    name: 'Cybersecurity News',
    description: 'Security breaches, vulnerabilities, and cybersecurity updates',
    category: 'technology',
    query: '(cybersecurity, security breach, vulnerability, hacking, ransomware) +security -marketing',
    icon: '🔒',
    threshold: 0.7,
    recencyBias: 0.15,
    tags: ['security', 'technology', 'infosec'],
  },
  {
    id: 'web-development',
    name: 'Web Development',
    description: 'Frontend, backend, and full-stack web development news',
    category: 'technology',
    query: '(web development, frontend, backend, javascript, typescript, react, vue, angular) -job',
    icon: '💻',
    threshold: 0.6,
    tags: ['webdev', 'programming', 'technology'],
  },
  {
    id: 'blockchain-crypto',
    name: 'Blockchain & Cryptocurrency',
    description: 'Blockchain technology, cryptocurrencies, and decentralized systems',
    category: 'technology',
    query: '(blockchain, cryptocurrency, bitcoin, ethereum, "web3", DeFi) -scam -advertisement',
    icon: '⛓️',
    threshold: 0.65,
    tags: ['blockchain', 'crypto', 'technology'],
  },
  {
    id: 'cloud-devops',
    name: 'Cloud & DevOps',
    description: 'Cloud computing, DevOps practices, and infrastructure',
    category: 'technology',
    query: '(cloud computing, AWS, Azure, GCP, kubernetes, docker, devops, CI/CD)',
    icon: '☁️',
    threshold: 0.6,
    tags: ['cloud', 'devops', 'infrastructure'],
  },

  // News Templates
  {
    id: 'breaking-news',
    name: 'Breaking News',
    description: 'Important and urgent news stories',
    category: 'news',
    query: '(breaking, urgent, "just in", developing) +news',
    icon: '🚨',
    threshold: 0.75,
    recencyBias: 0.3,
    tags: ['news', 'urgent', 'breaking'],
  },
  {
    id: 'climate-environment',
    name: 'Climate & Environment',
    description: 'Climate change, environmental issues, and sustainability',
    category: 'news',
    query: '("climate change", "global warming", environment, sustainability, renewable energy, carbon)',
    icon: '🌍',
    threshold: 0.65,
    tags: ['climate', 'environment', 'sustainability'],
  },
  {
    id: 'politics-policy',
    name: 'Politics & Policy',
    description: 'Political news and policy developments',
    category: 'news',
    query: '(politics, policy, government, legislation, election) -entertainment',
    icon: '🏛️',
    threshold: 0.6,
    tags: ['politics', 'policy', 'government'],
  },
  {
    id: 'health-medicine',
    name: 'Health & Medicine',
    description: 'Medical breakthroughs, health news, and wellness',
    category: 'news',
    query: '(health, medicine, medical, disease, treatment, vaccine, wellness)',
    icon: '⚕️',
    threshold: 0.65,
    tags: ['health', 'medicine', 'wellness'],
  },

  // Research Templates
  {
    id: 'academic-papers',
    name: 'Academic Research',
    description: 'Academic papers, research findings, and scientific studies',
    category: 'research',
    query: '(research, study, paper, journal, findings, "peer reviewed") +(science, technology)',
    icon: '📚',
    threshold: 0.7,
    tags: ['research', 'academic', 'science'],
  },
  {
    id: 'space-astronomy',
    name: 'Space & Astronomy',
    description: 'Space exploration, astronomy discoveries, and astrophysics',
    category: 'research',
    query: '(space, astronomy, astrophysics, NASA, "space exploration", planet, galaxy, telescope)',
    icon: '🚀',
    threshold: 0.65,
    tags: ['space', 'astronomy', 'science'],
  },
  {
    id: 'biotechnology',
    name: 'Biotechnology',
    description: 'Biotech innovations, genetic engineering, and life sciences',
    category: 'research',
    query: '(biotechnology, biotech, "genetic engineering", CRISPR, genetics, genomics)',
    icon: '🧬',
    threshold: 0.7,
    tags: ['biotech', 'genetics', 'science'],
  },

  // Jobs Templates
  {
    id: 'tech-jobs-remote',
    name: 'Remote Tech Jobs',
    description: 'Remote technology job opportunities',
    category: 'jobs',
    query: '(job, hiring, position, career) +(remote, "work from home") +(developer, engineer, programmer)',
    icon: '💼',
    threshold: 0.65,
    recencyBias: 0.2,
    tags: ['jobs', 'remote', 'technology'],
  },
  {
    id: 'senior-positions',
    name: 'Senior Engineering Roles',
    description: 'Senior and lead engineering positions',
    category: 'jobs',
    query: '(job, hiring) +(senior, lead, principal, staff) +(engineer, developer, architect)',
    icon: '👔',
    threshold: 0.7,
    recencyBias: 0.2,
    tags: ['jobs', 'senior', 'engineering'],
  },
];

/**
 * Get all search templates
 */
export function getAllTemplates(): SearchTemplate[] {
  return SEARCH_TEMPLATES;
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(
  category: SearchTemplate['category']
): SearchTemplate[] {
  return SEARCH_TEMPLATES.filter(t => t.category === category);
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): SearchTemplate | undefined {
  return SEARCH_TEMPLATES.find(t => t.id === id);
}

/**
 * Search templates by keyword
 */
export function searchTemplates(keyword: string): SearchTemplate[] {
  const lowerKeyword = keyword.toLowerCase();
  return SEARCH_TEMPLATES.filter(
    t =>
      t.name.toLowerCase().includes(lowerKeyword) ||
      t.description.toLowerCase().includes(lowerKeyword) ||
      t.tags.some(tag => tag.toLowerCase().includes(lowerKeyword))
  );
}

/**
 * Get template categories with counts
 */
export function getTemplateCategories(): Array<{
  category: SearchTemplate['category'];
  count: number;
  label: string;
  icon: string;
}> {
  const categories = {
    technology: { label: 'Technology', icon: '💻', count: 0 },
    news: { label: 'News', icon: '📰', count: 0 },
    research: { label: 'Research', icon: '🔬', count: 0 },
    jobs: { label: 'Jobs', icon: '💼', count: 0 },
    custom: { label: 'Custom', icon: '⚙️', count: 0 },
  };

  SEARCH_TEMPLATES.forEach(template => {
    categories[template.category].count++;
  });

  return Object.entries(categories).map(([category, data]) => ({
    category: category as SearchTemplate['category'],
    ...data,
  }));
}

/**
 * Get popular templates (by usage count)
 * In a real implementation, this would query the database
 */
export function getPopularTemplates(limit: number = 5): SearchTemplate[] {
  return SEARCH_TEMPLATES.slice(0, limit);
}

/**
 * Customize a template with user-specific values
 */
export function customizeTemplate(
  template: SearchTemplate,
  customizations: {
    name?: string;
    query?: string;
    threshold?: number;
    recencyBias?: number;
    icon?: string;
  }
): SearchTemplate {
  return {
    ...template,
    id: `${template.id}-custom-${Date.now()}`,
    ...customizations,
    category: 'custom',
  };
}

/**
 * Suggest templates based on user's feeds or interests
 * This is a simple implementation - could be enhanced with ML
 */
export function suggestTemplates(
  userFeedTopics: string[]
): SearchTemplate[] {
  if (userFeedTopics.length === 0) {
    return getPopularTemplates();
  }

  const suggestions: SearchTemplate[] = [];
  const lowerTopics = userFeedTopics.map(t => t.toLowerCase());

  // Find templates matching user's feed topics
  SEARCH_TEMPLATES.forEach(template => {
    const matchScore = template.tags.filter(tag =>
      lowerTopics.some(topic => topic.includes(tag) || tag.includes(topic))
    ).length;

    if (matchScore > 0) {
      suggestions.push(template);
    }
  });

  // If we found matching templates, return them
  if (suggestions.length > 0) {
    return suggestions.slice(0, 5);
  }

  // Otherwise return popular templates
  return getPopularTemplates();
}

/**
 * Validate that a template query is still valid
 */
export function validateTemplate(template: SearchTemplate): {
  valid: boolean;
  errors: string[];
} {
  // Import parseQuery only when needed to avoid circular dependencies
  const { parseQuery } = require('./search-query-parser');
  const result = parseQuery(template.query);

  return {
    valid: result.valid,
    errors: result.errors,
  };
}

/**
 * Export template to JSON format
 */
export function exportTemplate(template: SearchTemplate): string {
  return JSON.stringify(template, null, 2);
}

/**
 * Import template from JSON format
 */
export function importTemplate(json: string): SearchTemplate {
  try {
    const template = JSON.parse(json);

    // Validate required fields
    if (!template.id || !template.name || !template.query || !template.category) {
      throw new Error('Invalid template format: missing required fields');
    }

    // Validate the query
    const validation = validateTemplate(template);
    if (!validation.valid) {
      throw new Error(`Invalid template query: ${validation.errors.join(', ')}`);
    }

    return template as SearchTemplate;
  } catch (error) {
    throw new Error(
      `Failed to import template: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
