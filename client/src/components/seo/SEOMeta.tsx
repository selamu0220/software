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
}

const SEOMeta: React.FC<SEOMetaProps> = ({
  title = 'Red Creativa Pro - Herramientas para creadores de contenido',
  description = 'Potencia tu creación de contenido en YouTube con Red Creativa Pro. Genera ideas, guiones y planes de contenido mediante inteligencia artificial.',
  keywords = 'creador de contenido, YouTube, ideas para videos, generador de guiones, AI, estrategia de contenido',
  ogImage = '/images/og-image.svg',
  ogUrl = 'https://redcreativa.pro',
  ogType = 'website',
  twitterCard = 'summary_large_image',
  canonicalUrl,
  lang = 'es',
  schema
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
    "logo": "https://redcreativa.pro/images/logo.svg",
    "description": "Plataforma para creadores de contenido con herramientas de IA para YouTube"
  };
    
  return (
    <Helmet>
      <html lang={lang} />
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={ogUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:locale" content="es_ES" />
      
      {/* Twitter */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      
      {/* Canonical URL */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      
      {/* Favicon */}
      <link rel="icon" href="/favicon.ico" />
      
      {/* Structured Data Schema.org */}
      <script type="application/ld+json">
        {JSON.stringify(schema || defaultSchema)}
      </script>
    </Helmet>
  );
};

export default SEOMeta;