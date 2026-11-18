// Helper to draw a crisp volleyball court on canvas (Full 18x9m or Half 9x9m)
export type CourtViewMode = 'FULL' | 'HALF';

export function drawVolleyballCourt(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  view: CourtViewMode
) {
  // 1. Tło hali sportowej
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, width, height);

  if (view === 'FULL') {
    // Proporcje 18m x 9m (FIVB 2:1)
    const marginX = 25;
    const marginY = 35;
    const courtW = 550;
    const courtH = 270;
    const halfW = courtW / 2; // 275
    const centerX = marginX + halfW; // 300

    // Parkiet - Lewa połowa (Nasza drużyna / Angels ZTP)
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(marginX, marginY, halfW, courtH);

    // Parkiet - Prawa połowa (Rywale / Druga strona)
    ctx.fillStyle = '#1d4ed8';
    ctx.fillRect(centerX, marginY, halfW, courtH);

    // Białe linie obrysowe boiska (FIVB)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(marginX, marginY, courtW, courtH);

    // Linie 3. metra (92px od siatki)
    const attackOffset = Math.round(courtW / 6); // 92px
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);

    // Lewa linia 3m
    ctx.beginPath();
    ctx.moveTo(centerX - attackOffset, marginY);
    ctx.lineTo(centerX - attackOffset, marginY + courtH);
    ctx.stroke();

    // Prawa linia 3m
    ctx.beginPath();
    ctx.moveTo(centerX + attackOffset, marginY);
    ctx.lineTo(centerX + attackOffset, marginY + courtH);
    ctx.stroke();
    ctx.setLineDash([]);

    // Linia środkowa pod siatką
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX, marginY);
    ctx.lineTo(centerX, marginY + courtH);
    ctx.stroke();

    // Siatka siatkarska (wyrazista biała taśma)
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(centerX, marginY - 14);
    ctx.lineTo(centerX, marginY + courtH + 14);
    ctx.stroke();

    // Antenki siatkarskie (czerwono-białe paski)
    // Górna antenka
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(centerX - 2, marginY - 16, 4, 8);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(centerX - 2, marginY - 8, 4, 8);

    // Dolna antenka
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(centerX - 2, marginY + courtH, 4, 8);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(centerX - 2, marginY + courtH + 8, 4, 8);

    // Słupki siatki poza boiskiem
    ctx.fillStyle = '#64748b';
    ctx.fillRect(centerX - 4, marginY - 20, 8, 4);
    ctx.fillRect(centerX - 4, marginY + courtH + 16, 8, 4);

    // Znaczniki strefy zagrywki (linie z tyłu)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(marginX - 10, marginY);
    ctx.lineTo(marginX, marginY);
    ctx.moveTo(marginX - 10, marginY + courtH);
    ctx.lineTo(marginX, marginY + courtH);
    ctx.moveTo(marginX + courtW, marginY);
    ctx.lineTo(marginX + courtW + 10, marginY);
    ctx.moveTo(marginX + courtW, marginY + courtH);
    ctx.lineTo(marginX + courtW + 10, marginY + courtH);
    ctx.stroke();

    // Etykiety tekstowe
    ctx.font = 'bold 10px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.textAlign = 'center';
    ctx.fillText('NASZA POŁOWA', marginX + halfW / 2, marginY + 20);
    ctx.fillText('POŁOWA RYWALA', centerX + halfW / 2, marginY + 20);
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('SIATKA', centerX, marginY - 20);
  } else {
    // Połowa boiska (9m x 9m kwadrat)
    const courtSize = 270;
    const marginX = (width - courtSize) / 2; // 165
    const marginY = 35;

    // Parkiet
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(marginX, marginY, courtSize, courtSize);

    // Linie obrysowe
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(marginX, marginY, courtSize, courtSize);

    // Siatka u góry
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(marginX - 15, marginY);
    ctx.lineTo(marginX + courtSize + 15, marginY);
    ctx.stroke();

    // Antenki
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(marginX - 2, marginY - 12, 4, 12);
    ctx.fillRect(marginX + courtSize - 2, marginY - 12, 4, 12);

    // Linia 3. metra (90px od siatki)
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(marginX, marginY + 90);
    ctx.lineTo(marginX + courtSize, marginY + 90);
    ctx.stroke();
    ctx.setLineDash([]);

    // Etykiety
    ctx.font = 'bold 10px sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'center';
    ctx.fillText('SIATKA', width / 2, marginY - 8);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillText('LINIA 3 METRA', width / 2, marginY + 84);
    ctx.fillText('LINIA KOŃCOWA', width / 2, marginY + courtSize - 8);
  }
}
