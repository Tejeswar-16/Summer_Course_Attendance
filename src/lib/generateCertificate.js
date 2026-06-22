/**
 * Certificate Generator Utility
 * ─────────────────────────────
 * Generates a certificate PDF by overlaying the student's Name and District
 * onto the certificate template image (/public/certificate_template.jpg).
 *
 * ⚙️  ADJUST THESE CONSTANTS if the text appears misaligned on your template:
 *
 *   NAME_X_RATIO  — how far from the LEFT edge the name starts (0.0 → 1.0)
 *   NAME_Y_RATIO  — how far from the TOP edge the name sits   (0.0 → 1.0)
 *   DIST_X_RATIO  — how far from the LEFT edge the district starts
 *   DIST_Y_RATIO  — how far from the TOP edge the district sits
 *
 * The font size is also relative to the image height (FONT_SIZE_RATIO).
 */

// ── Position constants (fraction of template image dimensions) ──────────────
// NAME: positioned after the "Selvan/Selvi" honorific text on the first body line
const NAME_X_RATIO   = 0.586;   // ~58.6% from left — starts after "Selvan/Selvi"
const NAME_Y_RATIO   = 0.454;   // ~46.3% from top  — aligned with first line baseline

// DISTRICT: positioned in the blank space after "from" on the second body line
const DIST_X_RATIO   = 0.404;   // ~40.4% from left — center-aligned in the space
const DIST_Y_RATIO   = 0.512;   // ~52.0% from top  — aligned with second line baseline

// Font size as a fraction of image height (e.g. 0.036 × 750px ≈ 27px)
const FONT_SIZE_RATIO = 0.036;

// Text color: dark maroon to match the printed text on the template
const TEXT_COLOR = '#3d0a0a';
// ────────────────────────────────────────────────────────────────────────────

/**
 * Generates and downloads a certificate PDF for the given student.
 *
 * @param {string} studentName - The student's full name (will be UPPERCASE)
 * @param {string} district    - The student's district   (will be UPPERCASE)
 */
export async function generateCertificatePDF(studentName, district) {
  // jsPDF must be dynamically imported (it's a client-side-only library)
  const { jsPDF } = await import('jspdf');

  return new Promise((resolve, reject) => {
    const templateImg = new Image();
    templateImg.crossOrigin = 'anonymous';

    templateImg.onload = () => {
      try {
        const imgW = templateImg.naturalWidth;
        const imgH = templateImg.naturalHeight;

        // 1. Create an off-screen canvas at the full template resolution
        const canvas = document.createElement('canvas');
        canvas.width  = imgW;
        canvas.height = imgH;
        const ctx = canvas.getContext('2d');

        // 2. Draw the background certificate template
        ctx.drawImage(templateImg, 0, 0, imgW, imgH);

        // 3. Configure text rendering
        const fontSize = Math.round(imgH * FONT_SIZE_RATIO);
        ctx.font          = `bold ${fontSize}px 'Times New Roman', Times, serif`;
        ctx.fillStyle     = TEXT_COLOR;
        ctx.textBaseline  = 'alphabetic';

        // 4. Overlay the student's NAME (after "Selvan/Selvi")
        ctx.textAlign     = 'left';
        ctx.fillText(
          studentName.toUpperCase(),
          Math.round(imgW * NAME_X_RATIO),
          Math.round(imgH * NAME_Y_RATIO)
        );

        // 5. Overlay the DISTRICT (after "from")
        ctx.textAlign     = 'center';
        ctx.fillText(
          district.toUpperCase(),
          Math.round(imgW * DIST_X_RATIO),
          Math.round(imgH * DIST_Y_RATIO)
        );

        // 6. Convert the canvas to a JPEG data URL
        const imgData = canvas.toDataURL('image/jpeg', 0.95);

        // 7. Create an A4-landscape PDF and embed the certificate image
        const pdf = new jsPDF({
          orientation : 'landscape',
          unit        : 'mm',
          format      : 'a4'       // 297 × 210 mm
        });
        pdf.addImage(imgData, 'JPEG', 0, 0, 297, 210);

        // 8. Download the PDF — file name: STUDENTNAME_certificate.pdf
        const safeName = studentName
          .replace(/[^a-zA-Z0-9 ]/g, '')
          .trim()
          .replace(/\s+/g, '_');
        pdf.save(`${safeName}_certificate.pdf`);

        resolve();
      } catch (err) {
        console.error('Certificate generation error:', err);
        reject(err);
      }
    };

    templateImg.onerror = () => {
      reject(new Error(
        'Certificate template not found. ' +
        'Please save your template as: public/certificate_template.jpg'
      ));
    };

    // Load from Next.js public folder
    templateImg.src = '/certificate_template.jpg?' + Date.now(); // cache-bust
  });
}
