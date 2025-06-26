import { Document as DocxDocument, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import { Document, DocumentSection } from './types';

export async function exportToPDF(document: Document, sections: DocumentSection[]) {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;
  
  let yPosition = margin;
  
  // Title
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text(document.title, margin, yPosition);
  yPosition += 15;
  
  // Company info
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, yPosition);
  yPosition += 20;
  
  // Sections
  const sortedSections = sections.sort((a, b) => a.order_index - b.order_index);
  
  for (const section of sortedSections) {
    // Check if we need a new page
    if (yPosition > pdf.internal.pageSize.getHeight() - 40) {
      pdf.addPage();
      yPosition = margin;
    }
    
    // Section title
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(section.section_name, margin, yPosition);
    yPosition += 10;
    
    // Section content
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    
    const lines = pdf.splitTextToSize(section.content, maxWidth);
    for (const line of lines) {
      if (yPosition > pdf.internal.pageSize.getHeight() - 20) {
        pdf.addPage();
        yPosition = margin;
      }
      pdf.text(line, margin, yPosition);
      yPosition += 6;
    }
    yPosition += 10;
  }
  
  pdf.save(`${document.title}.pdf`);
}

export async function exportToDocx(document: Document, sections: DocumentSection[]) {
  const sortedSections = sections.sort((a, b) => a.order_index - b.order_index);
  
  const children = [
    new Paragraph({
      text: document.title,
      heading: HeadingLevel.TITLE,
    }),
    new Paragraph({
      text: `Generated on: ${new Date().toLocaleDateString()}`,
      spacing: { after: 400 },
    }),
  ];
  
  for (const section of sortedSections) {
    children.push(
      new Paragraph({
        text: section.section_name,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      })
    );
    
    // Split content into paragraphs
    const paragraphs = section.content.split('\n\n');
    for (const paragraph of paragraphs) {
      if (paragraph.trim()) {
        children.push(
          new Paragraph({
            children: [new TextRun(paragraph.trim())],
            spacing: { after: 200 },
          })
        );
      }
    }
  }
  
  const doc = new DocxDocument({
    sections: [{
      properties: {},
      children,
    }],
  });
  
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${document.title}.docx`);
}