/**
 * Query Parser Service for Saved Searches
 *
 * Parses query strings into an Abstract Syntax Tree (AST) for semantic search.
 *
 * Supported operators:
 * - `,` (OR): Matches articles containing any of the terms
 * - `+` (AND): Requires term to be present
 * - `-` (NOT): Excludes term from results
 * - `"..."` (phrase): Exact phrase matching
 * - `()` (grouping): Groups expressions for precedence
 *
 * Operator precedence (highest to lowest):
 * 1. Phrases (quoted strings)
 * 2. Exclusions (- prefix)
 * 3. Requirements (+ prefix)
 * 4. Alternatives (, separator)
 *
 * Examples:
 * - `machine learning, AI` - Articles about machine learning OR AI
 * - `+python -java` - Articles that must contain python but not java
 * - `"climate change" +policy` - Articles with exact phrase "climate change" and word "policy"
 * - `(AI, ML) +ethics` - Articles about (AI OR ML) AND ethics
 */

export interface QueryNode {
  type: 'term' | 'phrase' | 'and' | 'or' | 'not' | 'group';
  value?: string;
  children?: QueryNode[];
  required?: boolean;  // For + prefix
  excluded?: boolean;  // For - prefix
}

export interface ParseResult {
  ast: QueryNode;
  errors: string[];
  valid: boolean;
}

interface Token {
  type: 'term' | 'phrase' | 'and' | 'or' | 'not' | 'lparen' | 'rparen' | 'eof';
  value: string;
  position: number;
}

/**
 * Tokenizes the input query string
 */
function tokenize(query: string): Token[] {
  const tokens: Token[] = [];
  let position = 0;

  while (position < query.length) {
    const char = query[position];
    if (!char) {
      position++;
      continue;
    }

    // Skip whitespace
    if (/\s/.test(char)) {
      position++;
      continue;
    }

    // Phrase (quoted string)
    if (char === '"') {
      const start = position;
      position++; // Skip opening quote
      let value = '';
      let escaped = false;

      while (position < query.length) {
        const c = query[position];
        if (!c) {
          position++;
          continue;
        }

        if (escaped) {
          value += c;
          escaped = false;
        } else if (c === '\\') {
          escaped = true;
        } else if (c === '"') {
          position++; // Skip closing quote
          break;
        } else {
          value += c;
        }
        position++;
      }

      tokens.push({ type: 'phrase', value, position: start });
      continue;
    }

    // Operators
    if (char === ',') {
      tokens.push({ type: 'or', value: ',', position });
      position++;
      continue;
    }

    if (char === '+') {
      tokens.push({ type: 'and', value: '+', position });
      position++;
      continue;
    }

    if (char === '-') {
      tokens.push({ type: 'not', value: '-', position });
      position++;
      continue;
    }

    if (char === '(') {
      tokens.push({ type: 'lparen', value: '(', position });
      position++;
      continue;
    }

    if (char === ')') {
      tokens.push({ type: 'rparen', value: ')', position });
      position++;
      continue;
    }

    // Term (word)
    const start = position;
    let value = '';
    while (position < query.length) {
      const termChar = query[position];
      if (!termChar || /[\s,+\-()"]/.test(termChar)) break;
      value += termChar;
      position++;
    }

    if (value) {
      tokens.push({ type: 'term', value, position: start });
    }
  }

  tokens.push({ type: 'eof', value: '', position: query.length });
  return tokens;
}

/**
 * Parser class using recursive descent
 */
class Parser {
  private tokens: Token[];
  private current = 0;
  private errors: string[] = [];

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): ParseResult {
    try {
      const ast = this.parseExpression();

      // Check for unbalanced parentheses
      if (this.currentToken().type !== 'eof') {
        this.errors.push(`Unexpected token at position ${this.currentToken().position}: ${this.currentToken().value}`);
      }

      return {
        ast,
        errors: this.errors,
        valid: this.errors.length === 0,
      };
    } catch (error) {
      this.errors.push(error instanceof Error ? error.message : 'Unknown parsing error');
      return {
        ast: { type: 'term', value: '' },
        errors: this.errors,
        valid: false,
      };
    }
  }

  private currentToken(): Token {
    return this.tokens[this.current] || this.tokens[this.tokens.length - 1] || { type: 'eof', value: '', position: 0 };
  }

  private advance(): Token {
    const token = this.currentToken();
    if (token.type !== 'eof') {
      this.current++;
    }
    return token;
  }

  private peek(): Token {
    return this.tokens[this.current + 1] || this.tokens[this.tokens.length - 1] || { type: 'eof', value: '', position: 0 };
  }

  /**
   * Parse expression with OR operators (lowest precedence)
   */
  private parseExpression(): QueryNode {
    const left = this.parseAndExpression();

    // Check for OR operators (,)
    if (this.currentToken().type === 'or') {
      const children: QueryNode[] = [left];

      while (this.currentToken().type === 'or') {
        this.advance(); // consume ','
        const right = this.parseAndExpression();
        children.push(right);
      }

      return {
        type: 'or',
        children,
      };
    }

    return left;
  }

  /**
   * Parse AND expressions (implicit AND or + prefix)
   */
  private parseAndExpression(): QueryNode {
    const terms: QueryNode[] = [];

    while (true) {
      const token = this.currentToken();

      // Stop at OR, closing paren, or EOF
      if (token.type === 'or' || token.type === 'rparen' || token.type === 'eof') {
        break;
      }

      terms.push(this.parsePrimary());
    }

    if (terms.length === 0) {
      this.errors.push('Expected term or expression');
      return { type: 'term', value: '' };
    }

    if (terms.length === 1 && terms[0]) {
      return terms[0];
    }

    // Multiple terms are implicitly ANDed together
    return {
      type: 'and',
      children: terms,
    };
  }

  /**
   * Parse primary expressions (terms, phrases, groups, NOT)
   */
  private parsePrimary(): QueryNode {
    const token = this.currentToken();

    // NOT operator
    if (token.type === 'not') {
      this.advance();
      const child = this.parsePrimary();
      return {
        type: 'not',
        children: [child],
        excluded: true,
      };
    }

    // AND operator (required term)
    if (token.type === 'and') {
      this.advance();
      const child = this.parsePrimary();
      return {
        ...child,
        required: true,
      };
    }

    // Grouped expression
    if (token.type === 'lparen') {
      this.advance(); // consume '('
      const expr = this.parseExpression();

      if (this.currentToken().type !== 'rparen') {
        this.errors.push(`Expected closing parenthesis at position ${this.currentToken().position}`);
      } else {
        this.advance(); // consume ')'
      }

      return {
        type: 'group',
        children: [expr],
      };
    }

    // Phrase
    if (token.type === 'phrase') {
      this.advance();
      return {
        type: 'phrase',
        value: token.value,
      };
    }

    // Term
    if (token.type === 'term') {
      this.advance();
      return {
        type: 'term',
        value: token.value,
      };
    }

    // Unexpected token
    this.errors.push(`Unexpected token at position ${token.position}: ${token.value}`);
    this.advance();
    return { type: 'term', value: '' };
  }
}

/**
 * Parses a query string into an AST
 */
export function parseQuery(query: string): ParseResult {
  // Handle empty query
  if (!query || query.trim().length === 0) {
    return {
      ast: { type: 'term', value: '' },
      errors: ['Query cannot be empty'],
      valid: false,
    };
  }

  const tokens = tokenize(query);
  const parser = new Parser(tokens);
  return parser.parse();
}

/**
 * Validates a query string without full parsing
 */
export function validateQuery(query: string): { valid: boolean; errors: string[] } {
  const result = parseQuery(query);
  return {
    valid: result.valid,
    errors: result.errors,
  };
}

/**
 * Generates a human-readable explanation of the query
 */
export function explainQuery(ast: QueryNode): string {
  switch (ast.type) {
    case 'term':
      return `articles containing "${ast.value}"`;

    case 'phrase':
      return `articles with the exact phrase "${ast.value}"`;

    case 'and':
      if (!ast.children || ast.children.length === 0) return '';
      const andTerms = ast.children.map(explainQuery).join(' AND ');
      return `(${andTerms})`;

    case 'or':
      if (!ast.children || ast.children.length === 0) return '';
      const orTerms = ast.children.map(explainQuery).join(' OR ');
      return `(${orTerms})`;

    case 'not':
      if (!ast.children || ast.children.length === 0) return '';
      const notChild = ast.children[0];
      if (!notChild) return '';
      return `NOT ${explainQuery(notChild)}`;

    case 'group':
      if (!ast.children || ast.children.length === 0) return '';
      const groupChild = ast.children[0];
      if (!groupChild) return '';
      return `(${explainQuery(groupChild)})`;

    default:
      return '';
  }
}

/**
 * Extracts all terms from the AST (for matching)
 */
export function extractTerms(ast: QueryNode): string[] {
  const terms: string[] = [];

  function traverse(node: QueryNode) {
    if (node.value) {
      terms.push(node.value);
    }

    if (node.children) {
      node.children.forEach(traverse);
    }
  }

  traverse(ast);
  return terms;
}
