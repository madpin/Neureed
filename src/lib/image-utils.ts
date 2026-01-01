/**
 * Image utility functions for detecting and filtering placeholder images
 */

/**
 * Known placeholder image URL patterns
 * These patterns match common placeholder/lazy-load images from various sources
 */
const PLACEHOLDER_URL_PATTERNS: RegExp[] = [
  // BBC placeholders
  /grey-placeholder\.png$/i,
  /placeholder\.png$/i,
  /placeholder\.jpg$/i,
  /placeholder\.gif$/i,
  /placeholder\.svg$/i,
  /placeholder\.webp$/i,
  
  // Common placeholder naming patterns
  /\/placeholder[_-]?/i,
  /\/lazy[_-]?load/i,
  /\/loading[_-]?/i,
  /\/blank\.(png|jpg|gif|svg|webp)$/i,
  /\/empty\.(png|jpg|gif|svg|webp)$/i,
  /\/spacer\.(png|jpg|gif|svg|webp)$/i,
  /\/pixel\.(png|jpg|gif|svg|webp)$/i,
  /\/1x1\.(png|jpg|gif|svg|webp)$/i,
  /\/transparent\.(png|gif|svg|webp)$/i,
  
  // Common CDN placeholder patterns
  /via\.placeholder\.com/i,
  /placehold\.it/i,
  /placeholdit\.imgix\.net/i,
  /dummyimage\.com/i,
  /placeholder\.pics/i,
  /fakeimg\.pl/i,
  /lorempixel\.com/i,
  /placekitten\.com/i,
  /placeimg\.com/i,
  
  // Data URIs that are likely placeholders (very small base64 images)
  /^data:image\/[^;]+;base64,.{0,200}$/i,
];

/**
 * Known placeholder image hostnames/domains
 */
const PLACEHOLDER_DOMAINS: string[] = [
  'via.placeholder.com',
  'placehold.it',
  'placeholdit.imgix.net',
  'dummyimage.com',
  'placeholder.pics',
  'fakeimg.pl',
  'lorempixel.com',
  'placekitten.com',
  'placeimg.com',
];

/**
 * Keywords in URL paths that indicate placeholder images
 */
const PLACEHOLDER_PATH_KEYWORDS: string[] = [
  'placeholder',
  'grey-placeholder',
  'gray-placeholder',
  'lazy-load',
  'lazyload',
  'loading',
  'blank',
  'empty',
  'spacer',
  'pixel',
  '1x1',
  'transparent',
  'default-image',
  'no-image',
  'noimage',
  'missing',
];

/**
 * Check if an image URL is likely a placeholder image
 * 
 * @param url - The image URL to check
 * @returns true if the URL appears to be a placeholder image
 */
export function isPlaceholderImage(url: string | null | undefined): boolean {
  if (!url) return true; // Treat null/undefined as placeholder
  
  const trimmedUrl = url.trim();
  if (!trimmedUrl) return true;
  
  // Check against URL patterns
  for (const pattern of PLACEHOLDER_URL_PATTERNS) {
    if (pattern.test(trimmedUrl)) {
      return true;
    }
  }
  
  // Parse URL for more detailed checks
  try {
    // Handle data URIs separately
    if (trimmedUrl.startsWith('data:')) {
      // Very small base64 images are likely placeholders
      // A typical 1x1 pixel PNG is about 68 characters in base64
      // Allow up to ~500 chars which would be a very small image
      return trimmedUrl.length < 500;
    }
    
    const urlObj = new URL(trimmedUrl);
    
    // Check hostname against known placeholder domains
    const hostname = urlObj.hostname.toLowerCase();
    if (PLACEHOLDER_DOMAINS.some(domain => hostname.includes(domain))) {
      return true;
    }
    
    // Check path for placeholder keywords
    const pathname = urlObj.pathname.toLowerCase();
    for (const keyword of PLACEHOLDER_PATH_KEYWORDS) {
      if (pathname.includes(keyword)) {
        return true;
      }
    }
    
    // Check for very small dimension indicators in URL
    // e.g., /1x1.png, /1/1.png, ?w=1&h=1
    if (/[\/\?&]1x1[\/\.\?&]|[\/\?&]w=1[&$]|[\/\?&]h=1[&$]/i.test(trimmedUrl)) {
      return true;
    }
    
  } catch {
    // If URL parsing fails, check the raw string
    const lowerUrl = trimmedUrl.toLowerCase();
    for (const keyword of PLACEHOLDER_PATH_KEYWORDS) {
      if (lowerUrl.includes(keyword)) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Filter out placeholder images from a URL, returning undefined if it's a placeholder
 * 
 * @param url - The image URL to check
 * @returns The URL if it's not a placeholder, undefined otherwise
 */
export function filterPlaceholderImage(url: string | null | undefined): string | undefined {
  if (isPlaceholderImage(url)) {
    return undefined;
  }
  return url || undefined;
}

/**
 * Get the first non-placeholder image from a list of URLs
 * 
 * @param urls - Array of image URLs to check
 * @returns The first non-placeholder URL, or undefined if all are placeholders
 */
export function getFirstValidImage(urls: (string | null | undefined)[]): string | undefined {
  for (const url of urls) {
    if (!isPlaceholderImage(url)) {
      return url || undefined;
    }
  }
  return undefined;
}

/**
 * Remove placeholder images from HTML content
 * This removes img tags that have placeholder src attributes
 * 
 * @param html - HTML content to process
 * @returns HTML with placeholder images removed
 */
export function removePlaceholderImagesFromHtml(html: string): string {
  if (!html) return html;
  
  // Match img tags and check their src
  return html.replace(
    /<img\s+([^>]*?)>/gi,
    (match, attributes) => {
      // Extract src attribute
      const srcMatch = attributes.match(/src\s*=\s*["']([^"']+)["']/i);
      if (srcMatch && srcMatch[1]) {
        const src = srcMatch[1];
        if (isPlaceholderImage(src)) {
          // Remove the entire img tag if it's a placeholder
          return '';
        }
      }
      
      // Also check data-src for lazy-loaded images that might be placeholders
      const dataSrcMatch = attributes.match(/data-src\s*=\s*["']([^"']+)["']/i);
      if (dataSrcMatch && dataSrcMatch[1]) {
        // If data-src exists and is valid, replace src with data-src
        const dataSrc = dataSrcMatch[1];
        if (!isPlaceholderImage(dataSrc)) {
          // Replace placeholder src with data-src
          const newAttributes = attributes
            .replace(/src\s*=\s*["'][^"']+["']/i, `src="${dataSrc}"`)
            .replace(/data-src\s*=\s*["'][^"']+["']/i, '');
          return `<img ${newAttributes.trim()}>`;
        }
      }
      
      return match;
    }
  );
}

/**
 * Extract the first valid (non-placeholder) image from HTML content
 * 
 * @param html - HTML content to search
 * @returns The first valid image URL, or null if none found
 */
export function extractFirstValidImageFromHtml(html: string): string | null {
  if (!html) return null;
  
  // Match all img tags
  const imgRegex = /<img\s+([^>]*?)>/gi;
  let match;
  
  while ((match = imgRegex.exec(html)) !== null) {
    const attributes = match[1];
    if (!attributes) continue;
    
    // Try src first
    const srcMatch = attributes.match(/src\s*=\s*["']([^"']+)["']/i);
    if (srcMatch && srcMatch[1] && !isPlaceholderImage(srcMatch[1])) {
      return srcMatch[1];
    }
    
    // Try data-src for lazy-loaded images
    const dataSrcMatch = attributes.match(/data-src\s*=\s*["']([^"']+)["']/i);
    if (dataSrcMatch && dataSrcMatch[1] && !isPlaceholderImage(dataSrcMatch[1])) {
      return dataSrcMatch[1];
    }
    
    // Try srcset (get the first URL)
    const srcsetMatch = attributes.match(/srcset\s*=\s*["']([^"']+)["']/i);
    if (srcsetMatch && srcsetMatch[1]) {
      const firstSrcset = srcsetMatch[1].split(',')[0]?.trim().split(/\s+/)[0];
      if (firstSrcset && !isPlaceholderImage(firstSrcset)) {
        return firstSrcset;
      }
    }
  }
  
  return null;
}
