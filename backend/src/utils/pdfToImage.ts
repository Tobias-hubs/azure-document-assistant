//import { fromPath } from "pdf2pic";
/*
export async function pdfToImage(pdfPath: string, dpi = 60): Promise<string[]> {
  
    const convert = fromPath(pdfPath, {
    density: dpi,
    format: "png",
    width: 1024,
    height: 1024,
  });

  const images = [];
  for (let i = 1; i <= convert.getNumberOfPages(); i++) {
    const image = await convert(i);
    images.push(image.path);
  }

  return images;
} */