import { google } from 'googleapis';
import { Readable } from 'stream';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Configuración de Google OAuth
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/youtube/callback'
);

// Definir los scopes necesarios para YouTube
const SCOPES = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube.readonly'
];

/**
 * Generar URL de autorización para Google OAuth
 */
export function getAuthUrl(): string {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent' // Para asegurar que siempre se reciba un refresh token
  });
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
  
  if (!tokens.access_token || !tokens.expiry_date) {
    throw new Error('No se pudieron obtener tokens válidos');
  }
  
  // Guardar los tokens para este cliente
  oauth2Client.setCredentials(tokens);
  
  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token || '',
    expiresAt: tokens.expiry_date
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
  
  if (!credentials.access_token || !credentials.expiry_date) {
    throw new Error('No se pudo refrescar el token');
  }
  
  return {
    accessToken: credentials.access_token,
    refreshToken: credentials.refresh_token || refreshToken,
    expiresAt: credentials.expiry_date
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
  name: string;
  thumbnail: string;
  id: string;
}> {
  const youtube = google.youtube({
    version: 'v3',
    auth: oauth2Client
  });
  
  const response = await youtube.channels.list({
    part: ['snippet'],
    mine: true
  });
  
  if (!response.data.items || response.data.items.length === 0) {
    throw new Error('No se pudo obtener información del canal');
  }
  
  const channel = response.data.items[0];
  const snippet = channel.snippet;
  
  if (!snippet) {
    throw new Error('No se pudo obtener información del canal');
  }
  
  return {
    name: snippet.title || 'Canal sin nombre',
    thumbnail: snippet.thumbnails?.default?.url || '',
    id: channel.id || ''
  };
}

/**
 * Subir video a YouTube
 */
export async function uploadVideoToYouTube(
  videoBuffer: Buffer,
  fileName: string,
  title: string,
  description: string,
  tags: string[],
  isPrivate: boolean
): Promise<{ videoId: string; url: string }> {
  // Crear archivo temporal
  const tempDir = os.tmpdir();
  const tempFilePath = path.join(tempDir, fileName);
  
  try {
    // Escribir el buffer al archivo temporal
    fs.writeFileSync(tempFilePath, videoBuffer);
    
    // Inicializar el cliente de YouTube
    const youtube = google.youtube({
      version: 'v3',
      auth: oauth2Client
    });
    
    // Crear stream para leer el archivo
    const fileStream = fs.createReadStream(tempFilePath);
    
    // Configurar los metadatos del video
    const requestBody = {
      snippet: {
        title,
        description,
        tags,
        categoryId: '22' // Categoría "People & Blogs"
      },
      status: {
        privacyStatus: isPrivate ? 'private' : 'public'
      }
    };
    
    // Realizar la subida del video
    const response = await youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody,
      media: {
        body: fileStream
      }
    });
    
    if (!response.data.id) {
      throw new Error('No se pudo obtener el ID del video subido');
    }
    
    const videoId = response.data.id;
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    return { videoId, url: videoUrl };
  } catch (error) {
    console.error('Error al subir video a YouTube:', error);
    throw error;
  } finally {
    // Eliminar el archivo temporal
    try {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    } catch (err) {
      console.error('Error al eliminar archivo temporal:', err);
    }
  }
}