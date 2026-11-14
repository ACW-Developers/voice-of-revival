import type { PaymentReceipt } from "./receipts";
import logo from "@/assets/vor_logo.png";

export async function receiptPdf(receipt: PaymentReceipt) {
  const [{ PDFDocument, StandardFonts, rgb }, QRCode] = await Promise.all([import("pdf-lib"), import("qrcode")]);
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const image = await pdf.embedPng(await (await fetch(logo)).arrayBuffer());
  const d = receipt.details;
  const safe = (s: string) => s.replace(/[^\x20-\x7e]/g, "?");
  const money = new Intl.NumberFormat("en-US", { style: "currency", currency: d.currency }).format(d.amount_cents / 100);
  const admissions = receipt.kind === "ticket" ? receipt.admissions : [null];
  for (const admission of admissions) {
    const page = pdf.addPage([595, 842]);
    const primary = rgb(0.65, 0.09, 0.12);
    const text = (value: string, y: number, size = 12, strong = false) => {
      const words = safe(value).split(" "); let line = ""; let row = y;
      for (const word of words) {
        const next = line ? `${line} ${word}` : word;
        if ((strong ? bold : font).widthOfTextAtSize(next, size) > 475 && line) {
          page.drawText(line, { x: 60, y: row, size, font: strong ? bold : font }); row -= size + 7; line = word;
        } else line = next;
      }
      page.drawText(line, { x: 60, y: row, size, font: strong ? bold : font });
    };
    page.drawRectangle({ x: 0, y: 828, width: 595, height: 14, color: primary });
    const scale = 170 / image.width;
    page.drawImage(image, { x: 60, y: 755, width: 170, height: image.height * scale });
    text(receipt.kind === "ticket" ? "EVENT TICKET & PAYMENT RECEIPT" : "DONATION RECEIPT", 708, 19, true);
    text(`Receipt ${receipt.id}`, 671, 10);
    text(`Payment status: ${receipt.status.toUpperCase()}`, 645, 12, true);
    text(d.event?.title ?? "Voice of Revival - Ministry Gift", 602, 17, true);
    text(`Name: ${d.buyer_name ?? d.donor?.name ?? "Guest"}`, 555);
    text(`Email: ${d.buyer_email ?? d.donor?.email ?? "-"}`, 529);
    text(`Amount received: ${money}`, 493, 15, true);
    text(`Paid: ${new Date(d.paid_at ?? d.created_at).toLocaleString("en-US")}`, 462);
    if (d.event) {
      text(`Event: ${new Date(d.event.starts_at).toLocaleString("en-US")}`, 426);
      text(`Venue: ${d.event.venue}`, 400);
      text(`Ticket ${d.ticket_code} - Admission ${admission?.seat} of ${d.quantity}`, 374, 12, true);
    } else text(`Giving: ${d.donor?.frequency === "monthly" ? "Monthly" : "One-time"}`, 426);
    const payload = admission ? `vor:ticket:${admission.token}` : `${window.location.origin}/receipts/${receipt.access_token}`;
    const qr = await pdf.embedPng(await QRCode.toDataURL(payload, { errorCorrectionLevel: "M", margin: 2, width: 320 }));
    page.drawImage(qr, { x: 60, y: 160, width: 164, height: 164 });
    text(admission ? "One unique QR code per attendee. Valid for one entry only." : "Private receipt verification QR code. Not an admission ticket.", 125, 10);
    text("VOICE OF REVIVAL | Different voices. One sound for His glory.", 75, 10);
    text("Keep this receipt and its QR code private.", 55, 10);
  }
  return new Blob([new Uint8Array(await pdf.save())], { type: "application/pdf" });
}
export async function deliverReceipt(blob: Blob, filename: string) {
  const file = new File([blob], filename, { type: "application/pdf" });
  if (matchMedia("(pointer: coarse)").matches && navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file] }); return; } catch (e) { if ((e as DOMException).name === "AbortError") return; }
  }
  const url = URL.createObjectURL(blob); const a = document.createElement("a");
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}