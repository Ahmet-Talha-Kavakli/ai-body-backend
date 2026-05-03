/**
 * Medya & Dosya Yükleme — V3 Faz B
 *
 * Galeri'den fotoğraf/video, dosya seçimi, ardından backend'e upload.
 */

import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

export type AttachmentKind = 'image' | 'video' | 'document';

export interface UploadResult {
  messageId: string;
  attachment: {
    kind: AttachmentKind;
    url: string;
    filename: string;
    size: number;
    mime: string;
    uploadedAt: string;
  };
}

/**
 * Galeriden foto/video seç, backend'e yükle
 */
export async function pickAndUploadMedia(args: {
  apiUrl: string;
  conversationId: string;
  token: string;
  kind: 'image' | 'video' | 'mixed';
  caption?: string;
}): Promise<UploadResult | null> {
  const { apiUrl, conversationId, token, kind, caption } = args;

  // İzin kontrolü
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;

  // Picker
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes:
      kind === 'image' ? ['images'] : kind === 'video' ? ['videos'] : ['images', 'videos'],
    quality: 0.85,
    allowsEditing: false,
    videoMaxDuration: 30,
  });

  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];

  return uploadAsset({
    apiUrl,
    conversationId,
    token,
    uri: asset.uri,
    filename: asset.fileName ?? `media-${Date.now()}.${asset.type === 'video' ? 'mp4' : 'jpg'}`,
    mime: asset.mimeType ?? (asset.type === 'video' ? 'video/mp4' : 'image/jpeg'),
    kind: asset.type === 'video' ? 'video' : 'image',
    caption,
  });
}

/**
 * Kameradan foto çek, yükle
 */
export async function captureAndUploadPhoto(args: {
  apiUrl: string;
  conversationId: string;
  token: string;
  caption?: string;
}): Promise<UploadResult | null> {
  const { apiUrl, conversationId, token, caption } = args;

  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) return null;

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    quality: 0.85,
    allowsEditing: false,
  });

  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];

  return uploadAsset({
    apiUrl,
    conversationId,
    token,
    uri: asset.uri,
    filename: asset.fileName ?? `photo-${Date.now()}.jpg`,
    mime: asset.mimeType ?? 'image/jpeg',
    kind: 'image',
    caption,
  });
}

/**
 * Doküman seç (PDF, Word, Excel, PPT, txt, csv), yükle
 */
export async function pickAndUploadDocument(args: {
  apiUrl: string;
  conversationId: string;
  token: string;
  caption?: string;
}): Promise<UploadResult | null> {
  const { apiUrl, conversationId, token, caption } = args;

  const result = await DocumentPicker.getDocumentAsync({
    type: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
    ],
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];

  return uploadAsset({
    apiUrl,
    conversationId,
    token,
    uri: asset.uri,
    filename: asset.name,
    mime: asset.mimeType ?? 'application/octet-stream',
    kind: 'document',
    caption,
  });
}

// ─── Internal: gerçek upload ──────────────────────────────────────────────────

async function uploadAsset(args: {
  apiUrl: string;
  conversationId: string;
  token: string;
  uri: string;
  filename: string;
  mime: string;
  kind: AttachmentKind;
  caption?: string;
}): Promise<UploadResult | null> {
  const { apiUrl, conversationId, token, uri, filename, mime, kind, caption } = args;

  try {
    const formData = new FormData();
    formData.append('file', {
      uri,
      name: filename,
      type: mime,
    } as unknown as Blob);
    formData.append('kind', kind);
    if (caption) formData.append('caption', caption);

    const res = await fetch(`${apiUrl}/api/assistant/conversations/${conversationId}/attachment`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error('[attachment/upload]', res.status, txt);
      return null;
    }

    return (await res.json()) as UploadResult;
  } catch (e) {
    console.error('[attachment/upload]', e);
    return null;
  }
}
