import { put } from '@vercel/blob';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const form = formidable();
  
  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: '파일 파싱 중 요류가 발생했습니다.' });
    }

    const file = files.file[0];
    const fileStream = fs.createReadStream(file.filepath);

    try {
      const blob = await put(`signatures/${file.originalFilename}`, fileStream, {
        access: 'public',
      });
      return res.status(200).json({ url: blob.url });
    } catch (uploadError) {
      console.error(uploadError);
      return res.status(500).json({ error: 'Vercel Blob 업로드 실패' });
    }
  });
}