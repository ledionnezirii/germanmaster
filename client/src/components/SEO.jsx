import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SEO = ({ 
  title, 
  description, 
  keywords, 
  ogImage, 
  canonicalUrl,
  type = 'website',
  noIndex = false 
}) => {
  const location = useLocation();

  useEffect(() => {
    // Default values
    const defaultTitle = 'Gjuha Gjermane - Mësoni Gjuhën Gjermane Online';
    const defaultDescription = 'Mësoni gjuhën gjermane online me kursa interaktive, ushtrime, teste dhe më shumë.';
    const baseUrl = 'https://gjuhagjermane.com';
    
    // Set page title
    document.title = title || defaultTitle;
    
    // Update or create meta tags
    const updateMetaTag = (name, content, property = null) => {
      const tag = property 
        ? document.querySelector(`meta[property="${property}"]`) 
        : document.querySelector(`meta[name="${name}"]`);
      
      if (tag) {
        tag.setAttribute('content', content);
      } else {
        const meta = document.createElement('meta');
        if (property) {
          meta.setAttribute('property', property);
        } else {
          meta.setAttribute('name', name);
        }
        meta.setAttribute('content', content);
        meta.setAttribute('data-seo', 'true');
        document.head.appendChild(meta);
      }
    };

    const updateLinkTag = (rel, href) => {
      const tag = document.querySelector(`link[rel="${rel}"]`);
      
      if (tag) {
        tag.setAttribute('href', href);
      } else {
        const link = document.createElement('link');
        link.setAttribute('rel', rel);
        link.setAttribute('href', href);
        link.setAttribute('data-seo', 'true');
        document.head.appendChild(link);
      }
    };

    // Update meta tags
    updateMetaTag('description', description || defaultDescription);
    updateMetaTag('keywords', keywords || 'gjuha gjermane, mesimi gjermanishtes, kursa gjermane');
    
    // Open Graph tags
    updateMetaTag('og:type', type, 'og:type');
    updateMetaTag('og:title', title || defaultTitle, 'og:title');
    updateMetaTag('og:description', description || defaultDescription, 'og:description');
    updateMetaTag('og:image', ogImage || `${baseUrl}/og-image.jpg`, 'og:image');
    updateMetaTag('og:url', canonicalUrl || `${baseUrl}${location.pathname}`, 'og:url');
    
    // Twitter tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', title || defaultTitle, 'twitter:title');
    updateMetaTag('twitter:description', description || defaultDescription, 'twitter:description');
    updateMetaTag('twitter:image', ogImage || `${baseUrl}/twitter-image.jpg`, 'twitter:image');
    
    // Canonical URL
    updateLinkTag('canonical', canonicalUrl || `${baseUrl}${location.pathname}`);
    
    // Robots
    if (noIndex) {
      updateMetaTag('robots', 'noindex, nofollow');
    } else {
      updateMetaTag('robots', 'index, follow');
    }

    // Cleanup function to remove added meta and link tags
    return () => {
      const addedMetaTags = document.head.querySelectorAll('meta[data-seo="true"]');
      const addedLinkTags = document.head.querySelectorAll('link[data-seo="true"]');
      addedMetaTags.forEach(tag => tag.remove());
      addedLinkTags.forEach(tag => tag.remove());
    };
  }, [title, description, keywords, ogImage, canonicalUrl, type, noIndex, location.pathname]);

  return null; // This component doesn't render anything
};

export default SEO;
