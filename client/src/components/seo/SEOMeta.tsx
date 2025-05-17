import React from 'react';
import { Helmet } from 'react-helmet';

interface SEOMetaProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogUrl?: string;
  ogType?: 'website' | 'article';
  twitterCard?: 'summary' | 'summary_large_image';
  canonicalUrl?: string;
  lang?: string;
  schema?: Record<string, any>;
  author?: string;
  datePublished?: string;
  dateModified?: string;
  category?: string;
}

const SEOMeta: React.FC<SEOMetaProps> = ({
  title = 'Red Creativa Pro - Plataforma AI para Creadores de Contenido en YouTube',
  description = 'Herramienta de IA para creadores de YouTube. Genera ideas para videos, guiones optimizados, y gestiona tu estrategia de contenido con inteligencia artificial.',
  keywords = 'YouTube AI, generador de ideas YouTube, guiones para YouTube, estrategia de contenido, creador de contenido, SEO YouTube, ideas de vídeos, calendario de contenido, contenido viral',
  ogImage = '/logo-og.png',
  ogUrl = 'https://redcreativa.pro',
  ogType = 'website',
  twitterCard = 'summary_large_image',
  canonicalUrl = 'https://redcreativa.pro',
  lang = 'es',
  schema,
  author = 'Red Creativa Pro',
  datePublished,
  dateModified,
  category
}) => {
  // Asegurar que el title siempre incluya el nombre del sitio
  const fullTitle = title.includes('Red Creativa Pro') 
    ? title 
    : `${title} | Red Creativa Pro`;
  
  // Schema por defecto para la organización
  const defaultSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Red Creativa Pro",
    "url": "https://redcreativa.pro",
    "logo": "https://redcreativa.pro/logo.png",
    "description": "Plataforma de IA para creadores de contenido en YouTube",
    "sameAs": [
      "https://instagram.com/redcreativapro",
      "https://twitter.com/redcreativapro",
      "https://youtube.com/c/redcreativapro"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "email": "contacto@redcreativa.pro",
      "contactType": "customer support"
    }
  };

  // Schema específico para artículos si es necesario
  const articleSchema = ogType === 'article' && datePublished ? {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": title,
    "image": ogImage,
    "author": {
      "@type": "Person",
      "name": author
    },
    "publisher": {
      "@type": "Organization",
      "name": "Red Creativa Pro",
      "logo": {
        "@type": "ImageObject",
        "url": "https://redcreativa.pro/logo.png"
      }
    },
    "datePublished": datePublished,
    "dateModified": dateModified || datePublished,
    "mainEntityOfPage": canonicalUrl,
    "description": description,
    "articleSection": category
  } : null;
    
  return (
    <Helmet>
      <html lang={lang} prefix="og: https://ogp.me/ns#" />
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      <meta name="language" content="Spanish" />
      <meta name="geo.region" content="ES" />
      <meta name="geo.placename" content="España" />
      
      {/* Hreflang para diferentes idiomas - actualmente solo español */}
      <link rel="alternate" href={canonicalUrl} hrefLang="es" />
      <link rel="alternate" href={canonicalUrl} hrefLang="x-default" />
      
      {/* Open Graph / Facebook - Mejorado */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={ogUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content="es_ES" />
      <meta property="og:site_name" content="Red Creativa Pro" />
      
      {/* Twitter - Mejorado */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:site" content="@redcreativapro" />
      <meta name="twitter:creator" content="@redcreativapro" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      
      {/* Canonical URL - Siempre presente para evitar contenido duplicado */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Favicon y otros iconos */}
      <link rel="icon" href="/favicon.ico" sizes="any" />
      <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      <link rel="manifest" href="/manifest.json" />
      
      {/* Structured Data Schema.org - Mejorado */}
      <script type="application/ld+json">
        {JSON.stringify(schema || articleSchema || defaultSchema)}
      </script>
    </Helmet>
  );
};

export default SEOMeta;