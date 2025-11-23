import { useEffect, useRef } from 'react';

/**
 * Hook to linkify plain text URLs in HTML content on the client side
 * This finds URLs in text nodes and converts them to clickable links
 *
 * @param contentRef - Ref to the DOM element containing the content
 */
export function useLinkifyContent(contentRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!contentRef.current) return;

    linkifyElement(contentRef.current);
  }, [contentRef]);
}

/**
 * Linkify all text nodes within an element
 * @param element - The DOM element to process
 */
function linkifyElement(element: HTMLElement) {
  // URL pattern for matching http/https URLs
  const urlPattern = /(https?:\/\/[^\s<>"]+)/gi;

  // Walk through all text nodes
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        // Skip if parent is already a link, script, style, or code
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;

        const tagName = parent.tagName.toLowerCase();
        if (['a', 'script', 'style', 'code', 'pre'].includes(tagName)) {
          return NodeFilter.FILTER_REJECT;
        }

        // Only process if text contains URLs
        if (urlPattern.test(node.textContent || '')) {
          urlPattern.lastIndex = 0; // Reset regex
          return NodeFilter.FILTER_ACCEPT;
        }

        return NodeFilter.FILTER_REJECT;
      }
    }
  );

  const nodesToProcess: Text[] = [];
  let currentNode: Node | null;

  // Collect all text nodes first (to avoid modifying while iterating)
  while ((currentNode = walker.nextNode())) {
    nodesToProcess.push(currentNode as Text);
  }

  // Process each text node
  nodesToProcess.forEach(textNode => {
    linkifyTextNode(textNode);
  });
}

/**
 * Convert a text node with URLs into a document fragment with links
 * @param textNode - The text node to process
 */
function linkifyTextNode(textNode: Text) {
  const text = textNode.textContent || '';
  const urlPattern = /(https?:\/\/[^\s<>"]+)/gi;

  const fragment = document.createDocumentFragment();
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = urlPattern.exec(text)) !== null) {
    const url = match[0];
    const startIndex = match.index;

    // Add text before the URL
    if (startIndex > lastIndex) {
      fragment.appendChild(
        document.createTextNode(text.slice(lastIndex, startIndex))
      );
    }

    // Clean URL (remove trailing punctuation)
    let cleanUrl = url;
    let suffix = '';
    const trailingPunctuation = /[.,;:!?)]$/;

    while (trailingPunctuation.test(cleanUrl)) {
      suffix = cleanUrl[cleanUrl.length - 1] + suffix;
      cleanUrl = cleanUrl.slice(0, -1);
    }

    // Create link element
    const link = document.createElement('a');
    link.href = cleanUrl;
    link.textContent = cleanUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.className = 'text-blue-600 hover:underline dark:text-blue-400';
    fragment.appendChild(link);

    // Add trailing punctuation as text
    if (suffix) {
      fragment.appendChild(document.createTextNode(suffix));
    }

    lastIndex = startIndex + url.length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
  }

  // Replace the text node with the fragment
  if (textNode.parentNode && fragment.hasChildNodes()) {
    textNode.parentNode.replaceChild(fragment, textNode);
  }
}
