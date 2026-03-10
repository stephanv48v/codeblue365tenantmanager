import { useState, useCallback } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { useBranding, hexToRgb } from '../contexts/BrandingContext';

type StatItem = { label: string; value: string | number };

type TableSection = {
    type: 'table';
    title?: string;
    headers: string[];
    rows: (string | number)[][];
};

type ChartSection = {
    type: 'chart';
    elementId: string;
    title?: string;
};

type StatsSection = {
    type: 'stats';
    data: StatItem[];
};

type ReportConfig = {
    title: string;
    subtitle?: string;
    orientation?: 'portrait' | 'landscape';
    sections: (TableSection | ChartSection | StatsSection)[];
};

function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

function formatDate(): string {
    const now = new Date();
    return now.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

function formatDateShort(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/** Load an image URL as a base64 data URL for jsPDF embedding */
async function loadImageAsDataUrl(url: string): Promise<string | null> {
    try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = url;
        await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject();
        });
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext('2d')!.drawImage(img, 0, 0);
        return canvas.toDataURL('image/png');
    } catch {
        return null;
    }
}

export function usePdfReport(): {
    generating: boolean;
    generateReport: (config: ReportConfig) => Promise<void>;
} {
    const [generating, setGenerating] = useState(false);
    const branding = useBranding();

    const generateReport = useCallback(async (config: ReportConfig) => {
        setGenerating(true);

        try {
            const orientation = config.orientation ?? 'portrait';
            const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });

            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 15;
            let cursorY = margin;

            const brandColor = hexToRgb(branding.primary_color);
            const companyName = branding.company_name || 'CodeBlue 365';

            // --- Load logo if available ---
            let logoDataUrl: string | null = null;
            if (branding.logo_url) {
                logoDataUrl = await loadImageAsDataUrl(branding.logo_url);
            }

            // --- Branded Header ---
            let textStartX = margin;

            // Logo
            if (logoDataUrl) {
                const logoSize = 10;
                doc.addImage(logoDataUrl, 'PNG', margin, cursorY - 1, logoSize, logoSize);
                textStartX = margin + logoSize + 3;
            }

            // Company name
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(18);
            doc.setTextColor(brandColor[0], brandColor[1], brandColor[2]);
            doc.text(companyName, textStartX, cursorY + 6);

            // Date in top-right corner
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.setTextColor(148, 163, 184); // slate-400
            const dateStr = `Generated: ${formatDate()}`;
            const dateWidth = doc.getTextWidth(dateStr);
            doc.text(dateStr, pageWidth - margin - dateWidth, cursorY + 6);

            cursorY += 12;

            // Report title
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.setTextColor(15, 23, 42); // slate-900 #0f172a
            doc.text(config.title, margin, cursorY);
            cursorY += 6;

            // Subtitle
            if (config.subtitle) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(10);
                doc.setTextColor(100, 116, 139); // slate-500 #64748b
                doc.text(config.subtitle, margin, cursorY);
                cursorY += 5;
            }

            // Thin separator line in brand color
            cursorY += 2;
            doc.setDrawColor(brandColor[0], brandColor[1], brandColor[2]);
            doc.setLineWidth(0.5);
            doc.line(margin, cursorY, pageWidth - margin, cursorY);
            cursorY += 8;

            // --- Render Sections ---
            for (const section of config.sections) {
                // Check if we need a new page (less than 40mm left)
                if (cursorY > pageHeight - 40) {
                    doc.addPage();
                    cursorY = margin;
                }

                if (section.type === 'stats') {
                    cursorY = renderStatsSection(doc, section, cursorY, margin, pageWidth);
                } else if (section.type === 'chart') {
                    cursorY = await renderChartSection(doc, section, cursorY, margin, pageWidth, pageHeight);
                } else if (section.type === 'table') {
                    cursorY = renderTableSection(doc, section, cursorY, margin, brandColor);
                }
            }

            // --- Page Numbers ---
            const totalPages = doc.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8);
                doc.setTextColor(148, 163, 184);
                const pageText = `Page ${i} of ${totalPages}`;
                const textWidth = doc.getTextWidth(pageText);
                doc.text(pageText, (pageWidth - textWidth) / 2, pageHeight - 8);
            }

            // --- Save ---
            const filename = `${slugify(config.title)}_${formatDateShort()}.pdf`;
            doc.save(filename);
        } catch (error) {
            console.error('PDF generation failed:', error);
        } finally {
            setGenerating(false);
        }
    }, [branding]);

    return { generating, generateReport };
}

function renderStatsSection(
    doc: jsPDF,
    section: StatsSection,
    startY: number,
    margin: number,
    pageWidth: number,
): number {
    const items = section.data;
    const availableWidth = pageWidth - margin * 2;
    const maxPerRow = Math.min(items.length, 4);
    const cardWidth = (availableWidth - (maxPerRow - 1) * 4) / maxPerRow;
    const cardHeight = 18;

    let cursorY = startY;

    for (let i = 0; i < items.length; i++) {
        const col = i % maxPerRow;
        const row = Math.floor(i / maxPerRow);

        if (col === 0 && row > 0) {
            cursorY += cardHeight + 4;
        }

        const x = margin + col * (cardWidth + 4);
        const y = cursorY;

        // Card background
        doc.setFillColor(248, 250, 252); // slate-50
        doc.setDrawColor(226, 232, 240); // slate-200
        doc.roundedRect(x, y, cardWidth, cardHeight, 2, 2, 'FD');

        // Label
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139); // slate-500
        doc.text(items[i].label, x + 4, y + 6);

        // Value
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(15, 23, 42); // slate-900
        doc.text(String(items[i].value), x + 4, y + 14);
    }

    const totalRows = Math.ceil(items.length / maxPerRow);
    return cursorY + totalRows * (cardHeight + 4) + 4;
}

async function renderChartSection(
    doc: jsPDF,
    section: ChartSection,
    startY: number,
    margin: number,
    pageWidth: number,
    pageHeight: number,
): Promise<number> {
    let cursorY = startY;

    // Section title
    if (section.title) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text(section.title, margin, cursorY);
        cursorY += 6;
    }

    const element = document.getElementById(section.elementId);
    if (!element) {
        // Skip gracefully if element not found
        return cursorY;
    }

    try {
        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
        });

        const imgData = canvas.toDataURL('image/png');
        const availableWidth = pageWidth - margin * 2;
        const aspectRatio = canvas.height / canvas.width;
        const imgWidth = availableWidth;
        const imgHeight = imgWidth * aspectRatio;

        // Check if chart fits on current page
        if (cursorY + imgHeight > pageHeight - 20) {
            doc.addPage();
            cursorY = margin;

            if (section.title) {
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(11);
                doc.setTextColor(15, 23, 42);
                doc.text(section.title, margin, cursorY);
                cursorY += 6;
            }
        }

        doc.addImage(imgData, 'PNG', margin, cursorY, imgWidth, imgHeight);
        cursorY += imgHeight + 8;
    } catch (error) {
        console.error(`Failed to capture chart element "${section.elementId}":`, error);
    }

    return cursorY;
}

function renderTableSection(
    doc: jsPDF,
    section: TableSection,
    startY: number,
    margin: number,
    brandColor: [number, number, number] = [59, 130, 246],
): number {
    let cursorY = startY;

    // Section title
    if (section.title) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text(section.title, margin, cursorY);
        cursorY += 6;
    }

    autoTable(doc, {
        startY: cursorY,
        head: [section.headers],
        body: section.rows.map((row) => row.map((cell) => String(cell))),
        margin: { left: margin, right: margin },
        styles: {
            fontSize: 8,
            cellPadding: 3,
            textColor: [51, 65, 85], // slate-700
        },
        headStyles: {
            fillColor: brandColor,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 8,
        },
        alternateRowStyles: {
            fillColor: [248, 250, 252], // slate-50
        },
        theme: 'grid',
    });

    // Get the final Y position after the table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const finalY = (doc as any).lastAutoTable?.finalY ?? cursorY + 20;
    return finalY + 8;
}
