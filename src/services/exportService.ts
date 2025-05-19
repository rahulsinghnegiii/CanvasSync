import jsPDF from 'jspdf';

class ExportService {
  // Export canvas as PNG
  exportToPNG(dataUrl: string, filename: string = 'whiteboard'): void {
    const link = document.createElement('a');
    const cleanFilename = this.sanitizeFilename(`${filename}-${this.getTimestamp()}.png`);
    link.download = cleanFilename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Export canvas as PDF
  exportToPDF(dataUrl: string, filename: string = 'whiteboard'): void {
    try {
      // Create a new PDF document
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
      });
      
      // Calculate dimensions to fit the image properly
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate the ratio to fit the image within the PDF page with margins
      const margin = 10; // 10mm margin
      const maxWidth = pdfWidth - (margin * 2);
      const maxHeight = pdfHeight - (margin * 2);
      
      let imgWidth = imgProps.width;
      let imgHeight = imgProps.height;
      
      // Scale the image to fit the PDF while maintaining aspect ratio
      if (imgWidth > maxWidth) {
        const ratio = maxWidth / imgWidth;
        imgWidth = maxWidth;
        imgHeight = imgHeight * ratio;
      }
      
      if (imgHeight > maxHeight) {
        const ratio = maxHeight / imgHeight;
        imgHeight = maxHeight;
        imgWidth = imgWidth * ratio;
      }
      
      // Calculate position to center the image
      const x = (pdfWidth - imgWidth) / 2;
      const y = (pdfHeight - imgHeight) / 2;
      
      // Add the image to the PDF
      pdf.addImage(dataUrl, 'PNG', x, y, imgWidth, imgHeight);
      
      // Add title and timestamp
      pdf.setFontSize(12);
      pdf.text('Collaborative Whiteboard', pdfWidth / 2, margin / 2, { align: 'center' });
      pdf.setFontSize(8);
      pdf.text(`Exported on ${new Date().toLocaleString()}`, pdfWidth / 2, margin, { align: 'center' });
      
      // Save the PDF
      const cleanFilename = this.sanitizeFilename(`${filename}-${this.getTimestamp()}.pdf`);
      pdf.save(cleanFilename);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      throw new Error('Failed to export as PDF. Please try again or use PNG format.');
    }
  }

  // Export multiple pages as PDF (for larger canvases)
  exportMultiPagePDF(dataUrl: string, filename: string = 'whiteboard'): void {
    // Implementation for multi-page PDF export
    // This would split a large canvas into multiple pages
    // For now, we'll just call the regular PDF export
    this.exportToPDF(dataUrl, filename);
  }

  // Helper method to get a timestamp string for filenames
  private getTimestamp(): string {
    const now = new Date();
    return now.toISOString().slice(0, 10);
  }

  // Helper method to sanitize filename
  private sanitizeFilename(filename: string): string {
    return filename.replace(/[/\\?%*:|"<>]/g, '-');
  }
}

export default new ExportService(); 