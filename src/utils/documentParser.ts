import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// 采用 CDN worker 加载 pdfjs 的 worker (解决 Vite 打包 worker 路径复杂的问题)
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export const parseDocumentToText = async (file: File): Promise<string> => {
  const extension = file.name.split('.').pop()?.toLowerCase();

  try {
    // 1. 纯文本文档
    if (extension === 'txt' || extension === 'md' || extension === 'csv' || extension === 'json') {
      return await file.text();
    }

    // 2. PDF 文档
    if (extension === 'pdf') {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += `\n--- Page ${i} ---\n${pageText}`;
      }
      return fullText;
    }

    // 3. Word 文档 (docx)
    if (extension === 'docx') {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    }

    throw new Error(`暂不支持该文件格式解析: ${extension}`);
  } catch (error) {
    console.error('Document parsing error:', error);
    throw new Error('文档内容提取失败，请检查文件是否损坏。');
  }
};
