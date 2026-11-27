// Helper to draw a crisp, authentic volleyball court on canvas (Full 18x9m or Half 9x9m)
export type CourtViewMode = 'FULL' | 'HALF';

export function drawVolleyballCourt(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  view: CourtViewMode
) {
  // 1. Tło hali sportowej / strefa wolna (Free zone)
  ctx.fillStyle = '#0a0f1d';
  ctx.fillRect(0, 0, width, height);

  if (view === 'FULL') {
    // Proporcje 18m x 9m (FIVB 2:1)
    const marginX = 25;
    const marginY = 35;
    const courtW = 550;
    const courtH = 270;
    const halfW = courtW / 2; // 275
    const centerX = marginX + halfW; // 300

    // Parkiet Taraflex - Lewa połowa (Angels ZTP - Royal Blue)
    const gradAngels = ctx.createLinearGradient(marginX, marginY, centerX, marginY + courtH);
    gradAngels.addColorStop(0, '#1e40af');
    gradAngels.addColorStop(1, '#2563eb');
    ctx.fillStyle = gradAngels;
    ctx.fillRect(marginX, marginY, halfW, courtH);

    // Parkiet Taraflex - Prawa połowa (Rywale - Navy Blue)
    const gradOpponent = ctx.createLinearGradient(centerX, marginY, marginX + courtW, marginY + courtH);
    gradOpponent.addColorStop(0, '#1d3d8f');
    gradOpponent.addColorStop(1, '#1a3375');
    ctx.fillStyle = gradOpponent;
    ctx.fillRect(centerX, marginY, halfW, courtH);

    // Białe linie obrysowe boiska (FIVB 5cm)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(marginX, marginY, courtW, courtH);

    // Linie 3. metra (92px od siatki)
    const attackOffset = Math.round(courtW / 6); // ~92px
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

    // Przerywane przedłużenia linii ataku poza boisko (FIVB)
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 4]);
    // Lewa strona góra/dół
    ctx.beginPath();
    ctx.moveTo(centerX - attackOffset, marginY - 10);
    ctx.lineTo(centerX - attackOffset, marginY);
    ctx.moveTo(centerX - attackOffset, marginY + courtH);
    ctx.lineTo(centerX - attackOffset, marginY + courtH + 10);
    // Prawa strona góra/dół
    ctx.moveTo(centerX + attackOffset, marginY - 10);
    ctx.lineTo(centerX + attackOffset, marginY);
    ctx.moveTo(centerX + attackOffset, marginY + courtH);
    ctx.lineTo(centerX + attackOffset, marginY + courtH + 10);
    ctx.stroke();
    ctx.setLineDash([]);

    // Linia środkowa pod siatką
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX, marginY);
    ctx.lineTo(centerX, marginY + courtH);
    ctx.stroke();

    // Siatka siatkarska: Realistyczna struktura (splot oczek + białe taśmy)
    const netWidth = 10;
    // Ciemne tło splotu siatki
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(centerX - netWidth / 2, marginY - 14, netWidth, courtH + 28);

    // Oczka siatki (mesh grid)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1;
    for (let y = marginY - 14; y <= marginY + courtH + 14; y += 6) {
      ctx.beginPath();
      ctx.moveTo(centerX - netWidth / 2, y);
      ctx.lineTo(centerX + netWidth / 2, y);
      ctx.stroke();
    }

    // Taśma lewa (biała)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(centerX - netWidth / 2, marginY - 14, 2, courtH + 28);
    // Taśma prawa (biała)
    ctx.fillRect(centerX + netWidth / 2 - 2, marginY - 14, 2, courtH + 28);

    // Słupki siatki poza boiskiem
    ctx.fillStyle = '#64748b';
    ctx.fillRect(centerX - 6, marginY - 24, 12, 10);
    ctx.fillRect(centerX - 6, marginY + courtH + 14, 12, 10);

    // Antenki siatkarskie FIVB (czerwono-białe paski co 10cm)
    // Górna antenka (na linii bocznej)
    const drawAntenna = (x: number, yStart: number) => {
      const segmentH = 4;
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#ef4444' : '#ffffff';
        ctx.fillRect(x - 2, yStart + i * segmentH, 4, segmentH);
      }
    };
    drawAntenna(centerX, marginY - 18);
    drawAntenna(centerX, marginY + courtH - 6);

    // Znaczniki strefy zagrywki (linie z tyłu)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(marginX - 12, marginY);
    ctx.lineTo(marginX, marginY);
    ctx.moveTo(marginX - 12, marginY + courtH);
    ctx.lineTo(marginX, marginY + courtH);
    ctx.moveTo(marginX + courtW, marginY);
    ctx.lineTo(marginX + courtW + 12, marginY);
    ctx.moveTo(marginX + courtW, marginY + courtH);
    ctx.lineTo(marginX + courtW + 12, marginY + courtH);
    ctx.stroke();

    // Dyskretne oznaczenia połówek (minimalistyczne i eleganckie)
    ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.textAlign = 'center';
    ctx.fillText('ANGELS ZTP', marginX + halfW / 2, marginY + 22);
    ctx.fillText('RYWAL', centerX + halfW / 2, marginY + 22);

  } else {
    // Połowa boiska (9m x 9m kwadrat)
    const courtSize = 270;
    const marginX = (width - courtSize) / 2; // ~165
    const marginY = 35;

    // Parkiet Taraflex Royal Blue
    const gradHalf = ctx.createLinearGradient(marginX, marginY, marginX + courtSize, marginY + courtSize);
    gradHalf.addColorStop(0, '#1e40af');
    gradHalf.addColorStop(1, '#2563eb');
    ctx.fillStyle = gradHalf;
    ctx.fillRect(marginX, marginY, courtSize, courtSize);

    // Linie obrysowe
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(marginX, marginY, courtSize, courtSize);

    // Linia 3. metra (90px od siatki)
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(marginX, marginY + 90);
    ctx.lineTo(marginX + courtSize, marginY + 90);
    ctx.stroke();
    ctx.setLineDash([]);

    // Przerywane przedłużenia linii ataku na zewnątrz
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(marginX - 10, marginY + 90);
    ctx.lineTo(marginX, marginY + 90);
    ctx.moveTo(marginX + courtSize, marginY + 90);
    ctx.lineTo(marginX + courtSize + 10, marginY + 90);
    ctx.stroke();
    ctx.setLineDash([]);

    // Siatka u góry (z oczkami i taśmą)
    const netHeight = 10;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(marginX - 15, marginY - netHeight / 2, courtSize + 30, netHeight);

    // Oczka siatki
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1;
    for (let x = marginX - 15; x <= marginX + courtSize + 15; x += 6) {
      ctx.beginPath();
      ctx.moveTo(x, marginY - netHeight / 2);
      ctx.lineTo(x, marginY + netHeight / 2);
      ctx.stroke();
    }

    // Taśmy siatki (górna i dolna)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(marginX - 15, marginY - netHeight / 2, courtSize + 30, 2);
    ctx.fillRect(marginX - 15, marginY + netHeight / 2 - 2, courtSize + 30, 2);

    // Antenki
    const drawAntennaV = (x: number, y: number) => {
      const segW = 4;
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#ef4444' : '#ffffff';
        ctx.fillRect(x - 2, y + i * 3, segW, 3);
      }
    };
    drawAntennaV(marginX, marginY - 14);
    drawAntennaV(marginX + courtSize, marginY - 14);

    // Dyskretna linia końcowa i strefa zagrywki
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(marginX, marginY + courtSize + 10);
    ctx.lineTo(marginX, marginY + courtSize);
    ctx.moveTo(marginX + courtSize, marginY + courtSize + 10);
    ctx.lineTo(marginX + courtSize, marginY + courtSize);
    ctx.stroke();

    // Dyskretna etykieta
    ctx.font = 'bold 10px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.textAlign = 'center';
    ctx.fillText('STREFA BOISKA (9 × 9 M)', width / 2, marginY + courtSize - 8);
  }
}
