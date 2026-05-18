import { client } from './client'

export interface UploadedAsset {
  id: string
  public_url: string
  mime_type: string
  size_bytes: number
}

export const mediaApi = {
  upload: async (file: File): Promise<UploadedAsset> => {
    const form = new FormData()
    form.append('file', file)
    const { data } = await client.post<UploadedAsset>('/media/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  addImageToPart: (partId: string, assetId: string, position: number, isPrimary: boolean) =>
    client
      .post(`/parts/${partId}/images`, {
        asset_id: assetId,
        position,
        is_primary: isPrimary,
      })
      .then((r) => r.data),

  removeImageFromPart: (partId: string, imageId: string) =>
    client.delete(`/parts/${partId}/images/${imageId}`),
}
