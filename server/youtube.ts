import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

// Configuración de Google OAuth
const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.NODE_ENV === 'production' 
    ? 'https://yourdomain.com/api/youtube/callback'
    : `${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS}` : 'http://localhost:5000'}/api/youtube/callback`
);

// YouTube API
const youtube = google.youtube('v3');

/**
 * Generar URL de autorización para Google OAuth
 */
export function getAuthUrl(): string {
  const scopes = [
    'https://www.googleapis.com/auth/youtube',
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube.readonly'
  ];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    include_granted_scopes: true,
    prompt: 'consent' // Siempre pedir consentimiento para obtener refresh_token
  });

  return authUrl;
}

/**
 * Intercambiar código de autorización por tokens
 */
export async function getTokensFromCode(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}> {
  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.access_token) {
    throw new Error('No se recibió token de acceso');
  }

  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token || '',
    expiresAt: tokens.expiry_date || Date.now() + 3600 * 1000
  };
}

/**
 * Refrescar token de acceso usando el refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}> {
  oauth2Client.setCredentials({
    refresh_token: refreshToken
  });

  const { credentials } = await oauth2Client.refreshAccessToken();

  return {
    accessToken: credentials.access_token || '',
    refreshToken: credentials.refresh_token || refreshToken,
    expiresAt: credentials.expiry_date || Date.now() + 3600 * 1000
  };
}

/**
 * Configurar cliente con tokens existentes
 */
export function setTokens(accessToken: string, refreshToken: string): void {
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken
  });
}

/**
 * Obtener información del canal de YouTube
 */
export async function getChannelInfo(): Promise<{
  id: string;
  title: string;
  customUrl?: string;
  thumbnailUrl?: string;
  subscriberCount?: number;
  videoCount?: number;
}> {
  try {
    // Obtener lista de canales del usuario autenticado
    const channelsResponse = await youtube.channels.list({
      auth: oauth2Client,
      part: ['snippet', 'statistics'],
      mine: true
    });

    const channel = channelsResponse.data.items?.[0];

    if (!channel) {
      throw new Error('No se encontró información del canal');
    }

    return {
      id: channel.id || '',
      title: channel.snippet?.title || '',
      customUrl: channel.snippet?.customUrl,
      thumbnailUrl: channel.snippet?.thumbnails?.default?.url,
      subscriberCount: channel.statistics?.subscriberCount 
        ? parseInt(channel.statistics.subscriberCount) 
        : undefined,
      videoCount: channel.statistics?.videoCount 
        ? parseInt(channel.statistics.videoCount) 
        : undefined
    };
  } catch (error) {
    console.error('Error al obtener información del canal:', error);
    throw error;
  }
}

/**
 * Subir video a YouTube
 */
export async function uploadVideoToYouTube(
  videoBuffer: Buffer,
  filename: string,
  title: string,
  description: string,
  tags: string[] = [],
  isPrivate: boolean = true
): Promise<{ videoId: string; url: string }> {
  try {
    // Configurar metadatos del video
    const requestBody = {
      snippet: {
        title,
        description,
        tags,
        categoryId: '22' // Categoría People & Blogs
      },
      status: {
        privacyStatus: isPrivate ? 'private' : 'public',
        selfDeclaredMadeForKids: false
      }
    };

    // Realizar la subida
    const uploadResponse = await youtube.videos.insert({
      auth: oauth2Client,
      part: ['snippet', 'status'],
      requestBody,
      media: {
        body: videoBuffer
      }
    });

    const videoId = uploadResponse.data.id;
    
    if (!videoId) {
      throw new Error('No se recibió ID del video');
    }

    return {
      videoId,
      url: `https://www.youtube.com/watch?v=${videoId}`
    };
  } catch (error) {
    console.error('Error al subir video a YouTube:', error);
    throw error;
  }
}