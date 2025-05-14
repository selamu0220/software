import { useEffect } from 'react';
import { useLocation } from 'wouter';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  type?: 'website' | 'article';
  noindex?: boolean;
}

/**
 * Componente SEO para gestionar los metadatos de cada página
 * Uso: <SEO title="Título de la página" description="Descripción para SEO" />
 */
export function SEO({
  title = '',
  description = '',
  keywords = '',
  image = '/og-image.jpg',
  type = 'website',
  noindex = false
}: SEOProps) {
  const [location] = useLocation();
  const fullTitle = title ? `${title} | Red Creativa Gen` : 'Red Creativa Gen | Generador de Ideas para Creadores de Contenido';
  const metaDescription = description || 'Plataforma premium para creadores de contenido. Genera ideas de videos, scripts completos, planificación de contenido y recursos creativos para YouTube.';
  const metaKeywords = keywords || 'ideas para videos, generador IA, creadores de contenido, YouTube, guiones, scripts, teleprompter, recursos creativos, planificación de contenido';
  const currentUrl = `https://redcreativagen.com${location}`;
  
  useEffect(() => {
    // Actualizar el título de la página
    document.title = fullTitle;
    
    // Actualizar meta tags
    updateMetaTag('description', metaDescription);
    updateMetaTag('keywords', metaKeywords);
    
    // Actualizar meta robots
    updateMetaTag('robots', noindex ? 'noindex, nofollow' : 'index, follow');
    
    // Actualizar tags de Open Graph
    updateMetaTag('og:title', fullTitle, true);
    updateMetaTag('og:description', metaDescription, true);
    updateMetaTag('og:url', currentUrl, true);
    updateMetaTag('og:image', image, true);
    updateMetaTag('og:type', type, true);
    
    // Actualizar tags de Twitter
    updateMetaTag('twitter:title', fullTitle, true);
    updateMetaTag('twitter:description', metaDescription, true);
    updateMetaTag('twitter:image', image, true);
    updateMetaTag('twitter:card', 'summary_large_image', true);
    
    // Actualizar el canonical URL
    updateLinkTag('canonical', currentUrl);
  }, [fullTitle, metaDescription, metaKeywords, currentUrl, image, type, noindex]);
  
  return null;
}

// Función auxiliar para actualizar meta tags
function updateMetaTag(name: string, content: string, isProperty = false) {
  // Determinar si es una propiedad (para Open Graph) o un nombre (para meta tags estándar)
  const attr = isProperty ? 'property' : 'name';
  
  // Buscar la etiqueta existente
  let element = document.querySelector(`meta[${attr}="${name}"]`);
  
  // Si no existe, crearla
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attr, name);
    document.head.appendChild(element);
  }
  
  // Actualizar el contenido
  element.setAttribute('content', content);
}

// Función auxiliar para actualizar link tags (como el canonical)
function updateLinkTag(rel: string, href: string) {
  // Buscar el link tag existente
  let element = document.querySelector(`link[rel="${rel}"]`);
  
  // Si no existe, crearlo
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }
  
  // Actualizar el href
  element.setAttribute('href', href);
}