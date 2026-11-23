// Generates a minimal, valid text PDF for exercising the upload/parse path.
// Not part of the deployed site; run with: node scripts/make-test-pdf.mjs <outPath>
import { writeFileSync } from "node:fs";

const out = process.argv[2] || "test-paper.pdf";

const lines = [
  "Attention Residual Networks for Efficient Sequence Modeling.",
  "We propose a lightweight architecture that reduces the computational cost of self-attention while preserving representational capacity.",
  "Our method replaces the full quadratic attention matrix with a structured low-rank approximation that scales linearly with sequence length.",
  "Experiments on standard translation benchmarks show that the proposed model matches the quality of a full Transformer baseline at a fraction of the training cost.",
  "We further demonstrate that the approximation error is bounded and does not accumulate across layers.",
  "These results suggest that careful structural priors can recover most of the benefit of dense attention without its prohibitive cost.",
];

// Build the content stream: each line gets its own BT/ET block with explicit Td
// positioning so text extraction is unambiguous (mimics real PDF layout).
let stream = "";
let y = 720;
for (const line of lines) {
  const escaped = line.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  stream += `BT /F1 11 Tf 72 ${y} Td (${escaped}) Tj ET\n`;
  y -= 20;
}
stream = stream.trimEnd();

const objects = [];
objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
objects[2] = "<< /Type /Pages /Kids [3 0 R] /Count 1 >>";
objects[3] =
  "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 900 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>";
objects[4] = `<< /Length ${Buffer.byteLength(stream, "latin1")} >>\nstream\n${stream}\nendstream`;
objects[5] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";

let pdf = "%PDF-1.4\n";
const offsets = [0];
for (let i = 1; i < objects.length; i++) {
  offsets[i] = Buffer.byteLength(pdf, "latin1");
  pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`;
}
const xrefPos = Buffer.byteLength(pdf, "latin1");
pdf += "xref\n";
pdf += `0 ${objects.length}\n`;
pdf += "0000000000 65535 f \n";
for (let i = 1; i < objects.length; i++) {
  pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
}
pdf += "trailer\n";
pdf += `<< /Size ${objects.length} /Root 1 0 R >>\n`;
pdf += "startxref\n";
pdf += `${xrefPos}\n`;
pdf += "%%EOF\n";

writeFileSync(out, Buffer.from(pdf, "latin1"));
console.log(`Wrote ${out} (${Buffer.byteLength(pdf, "latin1")} bytes)`);