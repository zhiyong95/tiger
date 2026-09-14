/**
 * 报告导出工具：支持将报告 DOM/HTML 导出为 PDF 与 Word 文档。
 * - PDF：html2canvas 截图保证中文字体、图表与页面排版一致，再按 A4 分页写入 jsPDF。
 * - Word：生成带 Word 命名空间的 HTML 文档（.doc），可被 Microsoft Word / WPS 直接打开编辑。
 */
import { saveAs } from 'file-saver'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

function sanitizeFileName(name: string): string {
  return (name || '报告').replace(/[\\/:*?"<>|]/g, '_').trim() || '报告'
}

/**
 * 将页面中的报告节点导出为分页 PDF。
 * @param element 报告根节点（如 .report-card）
 * @param fileName 文件名（不含扩展名）
 */
export async function exportElementToPdf(element: HTMLElement, fileName: string): Promise<void> {
  // 克隆节点并隐藏其中的操作按钮，避免把「下载/导出」按钮截进 PDF
  const clone = element.cloneNode(true) as HTMLElement
  clone.querySelectorAll('.no-export, .report-actions, .export-actions').forEach((n) => n.parentNode?.removeChild(n))
  const host = document.createElement('div')
  host.style.cssText = 'position:fixed;left:-99999px;top:0;width:' + element.offsetWidth + 'px;background:#ffffff;padding:24px;box-sizing:border-box;'
  host.appendChild(clone)
  document.body.appendChild(host)

  try {
    const canvas = await html2canvas(host, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: host.scrollWidth
    })

    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 10
    const usableWidth = pageWidth - margin * 2
    const imgHeight = (canvas.height * usableWidth) / canvas.width
    let position = margin

    const pageCanvas = document.createElement('canvas')
    const ctx = pageCanvas.getContext('2d')
    const ratio = canvas.width / usableWidth
    const pageContentHeightPx = (pageHeight - margin * 2) * ratio

    if (imgHeight <= pageHeight - margin * 2) {
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', margin, position, usableWidth, imgHeight)
    } else {
      let renderedHeight = 0
      let pageIndex = 0
      while (renderedHeight < canvas.height) {
        const sliceHeight = Math.min(pageContentHeightPx, canvas.height - renderedHeight)
        pageCanvas.width = canvas.width
        pageCanvas.height = sliceHeight
        ctx?.drawImage(
          canvas,
          0, renderedHeight, canvas.width, sliceHeight,
          0, 0, canvas.width, sliceHeight
        )
        if (pageIndex > 0) pdf.addPage()
        pdf.addImage(
          pageCanvas.toDataURL('image/jpeg', 0.92),
          'JPEG',
          margin,
          margin,
          usableWidth,
          sliceHeight / ratio
        )
        renderedHeight += sliceHeight
        pageIndex += 1
      }
    }

    pdf.save(`${sanitizeFileName(fileName)}.pdf`)
  } finally {
    document.body.removeChild(host)
  }
}

/**
 * 将报告 HTML 导出为 Word 可打开的 .doc 文档。
 * @param html 报告正文 HTML（含内联结构，样式通过下方 <style> 统一控制）
 * @param fileName 文件名（不含扩展名）
 */
export function exportHtmlToWord(html: string, fileName: string): void {
  const styles = `
    body { font-family: SimSun, '宋体', serif; font-size: 14px; color: #1f2937; line-height: 1.8; }
    h2.report-doc-title { font-family: 'Microsoft YaHei', SimHei, sans-serif; font-size: 22px; text-align: center; margin: 0 0 8px; }
    .report-doc-meta { text-align: center; color: #6b7280; font-size: 12px; margin-bottom: 20px; }
    h3, h4 { font-family: 'Microsoft YaHei', SimHei, sans-serif; color: #0a2480; margin: 18px 0 8px; }
    table { border-collapse: collapse; width: 100%; margin: 8px 0 16px; }
    th, td { border: 1px solid #cbd5e1; padding: 6px 10px; font-size: 13px; text-align: left; }
    th { background: #e8f0fe; }
    ul { margin: 6px 0; padding-left: 24px; }
    .report-doc-disclaimer { margin-top: 24px; color: #9ca3af; font-size: 12px; text-align: center; }
  `
  const docHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="utf-8"><title>${sanitizeFileName(fileName)}</title>
    <!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->
    <style>${styles}</style></head>
    <body>${html}</body></html>`

  const blob = new Blob(['﻿', docHtml], { type: 'application/msword;charset=utf-8' })
  saveAs(blob, `${sanitizeFileName(fileName)}.doc`)
}
