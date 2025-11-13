import { useEffect } from 'react';

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  keywords?: string;
  noindex?: boolean;
}

export function SEO({
  title,
  description,
  canonical,
  ogImage = 'https://getvoztra.com/og-image.png',
  ogType = 'website',
  keywords,
  noindex = false,
}: SEOProps) {
  useEffect(() => {
    // Update document title
    document.title = `${title} | Voztra`;

    // Update or create meta tags
    const updateMeta = (name: string, content: string, property?: boolean) => {
      const attr = property ? 'property' : 'name';
      let element = document.querySelector(`meta[${attr}="${name}"]`);
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attr, name);
        document.head.appendChild(element);
      }
      
      element.setAttribute('content', content);
    };

    // Basic meta tags
    updateMeta('description', description);
    if (keywords) {
      updateMeta('keywords', keywords);
    }
    
    // Robots - only update if explicitly noindex, otherwise leave existing
    if (noindex) {
      updateMeta('robots', 'noindex, nofollow');
    }

    // Open Graph tags
    updateMeta('og:title', `${title} | Voztra`, true);
    updateMeta('og:description', description, true);
    updateMeta('og:type', ogType, true);
    updateMeta('og:image', ogImage, true);
    updateMeta('og:site_name', 'Voztra', true);
    
    if (canonical) {
      updateMeta('og:url', canonical, true);
    }

    // Twitter Card tags
    updateMeta('twitter:card', 'summary_large_image');
    updateMeta('twitter:title', `${title} | Voztra`);
    updateMeta('twitter:description', description);
    updateMeta('twitter:image', ogImage);

    // Canonical URL
    if (canonical) {
      let linkElement = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      
      if (!linkElement) {
        linkElement = document.createElement('link');
        linkElement.setAttribute('rel', 'canonical');
        document.head.appendChild(linkElement);
      }
      
      linkElement.setAttribute('href', canonical);
    }
  }, [title, description, canonical, ogImage, ogType, keywords, noindex]);

  return null;
}
