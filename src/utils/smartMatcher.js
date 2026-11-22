/**
 * Smart Fuzzy Matcher for NBC Stock
 * Matches OCR scanned text from camera against warehouse inventory & registered items
 * Computes probability/confidence scores (0-99%) based on lot numbers, agreements, and item names.
 */

// Calculate Levenshtein distance between two strings
function levenshteinDistance(s1, s2) {
  const m = s1.length;
  const n = s2.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

// Normalized similarity between 0 and 1
function stringSimilarity(s1, s2) {
  if (!s1 || !s2) return 0;
  const clean1 = s1.trim().toLowerCase();
  const clean2 = s2.trim().toLowerCase();
  if (clean1 === clean2) return 1;
  const maxLen = Math.max(clean1.length, clean2.length);
  if (maxLen === 0) return 1;
  const dist = levenshteinDistance(clean1, clean2);
  return Math.max(0, 1 - dist / maxLen);
}

// Clean and tokenize text into words
function tokenize(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u0E00-\u0E7F/.-]+/g, ' ')
    .split(/\s+/)
    .filter(t => t.length >= 2);
}

/**
 * Match scanned text against inventory lots and registered items
 * @param {string} rawScannedText - Raw text output from OCR
 * @param {Array} inventory - List of inventory items
 * @param {Array} registeredItems - List of items in ProductRegistry
 * @returns {Array} Ranked list of matched items with confidence scores
 */
export function matchScannedText(rawScannedText, inventory = [], registeredItems = []) {
  if (!rawScannedText || typeof rawScannedText !== 'string' || !rawScannedText.trim()) {
    return [];
  }

  const cleanScanned = rawScannedText.trim().toLowerCase();
  const scannedTokens = tokenize(cleanScanned);

  if (scannedTokens.length === 0) return [];

  // Build candidate pool from inventory lots and registered items
  const candidatesMap = new Map();

  // 1. Process inventory lots
  (inventory || []).forEach(lot => {
    if (!lot || !lot.itemName) return;
    const key = `${lot.itemName}_${lot.supplierLot || ''}_${lot.inhouseLot || ''}`;
    if (!candidatesMap.has(key)) {
      candidatesMap.set(key, {
        id: lot.id,
        itemName: lot.itemName,
        supplierLot: lot.supplierLot || '',
        inhouseLot: lot.inhouseLot || '',
        agreementId: lot.agreementId || '',
        location: lot.location || '',
        remainingQty: lot.remainingQty ?? lot.quantity ?? 0,
        unit: lot.unit || 'ชิ้น',
        qcStatus: lot.qcStatus || '',
        isLot: true,
        source: lot
      });
    }
  });

  // 2. Add registered items if not already covered by inventory
  (registeredItems || []).forEach(item => {
    if (!item || !item.name) return;
    const existsInInv = (inventory || []).some(lot => lot && lot.itemName === item.name);
    if (!existsInInv) {
      const key = `${item.name}__`;
      if (!candidatesMap.has(key)) {
        candidatesMap.set(key, {
          itemName: item.name,
          supplierLot: '',
          inhouseLot: '',
          agreementId: '',
          location: '',
          remainingQty: 0,
          unit: item.unit || 'ชิ้น',
          qcStatus: '',
          isLot: false,
          source: item
        });
      }
    }
  });

  const scoredResults = [];

  for (const candidate of candidatesMap.values()) {
    let score = 0;
    const reasons = [];
    let bestSearchTerm = candidate.itemName;

    // A. Check Supplier Lot match (High value signal)
    if (candidate.supplierLot) {
      const sLotClean = candidate.supplierLot.trim().toLowerCase();
      if (sLotClean.length >= 3) {
        if (cleanScanned.includes(sLotClean)) {
          score += 75;
          reasons.push(`ตรงกับ Supplier Lot: "${candidate.supplierLot}"`);
          bestSearchTerm = candidate.supplierLot;
        } else {
          // Check token similarity for lot number (allow 1 typo)
          const lotMatches = scannedTokens.some(t => {
            if (Math.abs(t.length - sLotClean.length) <= 1) {
              return stringSimilarity(t, sLotClean) >= 0.85;
            }
            return false;
          });
          if (lotMatches) {
            score += 60;
            reasons.push(`ใกล้เคียงกับ Supplier Lot: "${candidate.supplierLot}"`);
            bestSearchTerm = candidate.supplierLot;
          }
        }
      }
    }

    // B. Check In-house QC Lot match
    if (candidate.inhouseLot) {
      const inLotClean = candidate.inhouseLot.trim().toLowerCase();
      if (inLotClean.length >= 3 && cleanScanned.includes(inLotClean)) {
        score += 65;
        reasons.push(`ตรงกับ QC Lot: "${candidate.inhouseLot}"`);
        if (!bestSearchTerm || bestSearchTerm === candidate.itemName) {
          bestSearchTerm = candidate.inhouseLot;
        }
      }
    }

    // C. Check Agreement ID match
    if (candidate.agreementId) {
      const agClean = candidate.agreementId.trim().toLowerCase();
      if (agClean.length >= 4 && cleanScanned.includes(agClean)) {
        score += 55;
        reasons.push(`ตรงกับสัญญา: "${candidate.agreementId}"`);
      }
    }

    // D. Check Item Name match (Token overlap + N-gram)
    const nameClean = candidate.itemName.trim().toLowerCase();
    const nameTokens = tokenize(nameClean);

    if (nameTokens.length > 0) {
      let matchedTokenCount = 0;
      const matchedWords = [];

      nameTokens.forEach(nt => {
        const isStopWord = ['mm', 'cm', 'x', 'and', 'or', 'for', 'the'].includes(nt);
        if (isStopWord) return;

        if (scannedTokens.includes(nt) || cleanScanned.includes(nt)) {
          matchedTokenCount++;
          matchedWords.push(nt);
        } else {
          const fuzzy = scannedTokens.some(st => stringSimilarity(st, nt) >= 0.85);
          if (fuzzy) {
            matchedTokenCount += 0.8;
            matchedWords.push(nt);
          }
        }
      });

      const effectiveTokens = nameTokens.filter(t => !['mm', 'cm', 'x'].includes(t));
      const matchRatio = matchedTokenCount / (effectiveTokens.length || 1);

      // Check how much of the scanned query is satisfied by this item name
      const queryTokensInName = scannedTokens.filter(st => {
        if (['lot', 'exp', 'date', 'no', 'qty', 'mfg'].includes(st)) return false;
        return nameTokens.some(nt => nt === st || stringSimilarity(nt, st) >= 0.85);
      });
      const queryMatchRatio = scannedTokens.length > 0 ? (queryTokensInName.length / scannedTokens.length) : 0;

      if (cleanScanned.includes(nameClean)) {
        score += 75;
        reasons.push(`พบชื่อพัสดุครบถ้วน`);
      } else if (matchRatio >= 0.75) {
        score += 60;
        reasons.push(`พบชื่อพัสดุส่วนใหญ่ (${matchedWords.slice(0, 3).join(' ')})`);
      } else if (queryMatchRatio >= 0.8 && queryTokensInName.length >= 2) {
        // Almost all user scanned text words are inside this product name! (e.g. "membrane port" inside "BLOOD BAG MEMBRANE PORT")
        score += 70;
        reasons.push(`คำค้นหาตรงกับชื่อสินค้า (${queryTokensInName.join(' ')})`);
      } else if (matchRatio >= 0.4 || matchedTokenCount >= 2) {
        score += 45;
        reasons.push(`พบคำสำคัญ: ${matchedWords.slice(0, 3).join(' ')}`);
      } else if (matchedTokenCount >= 1 && matchedWords[0].length >= 5) {
        score += 25;
        reasons.push(`พบคีย์เวิร์ด: ${matchedWords[0]}`);
      }
    }

    // Normalize confidence to 0-99 range
    const confidence = Math.min(99, Math.round(score));

    if (confidence >= 30) {
      scoredResults.push({
        ...candidate,
        confidence,
        matchReason: reasons.join(' + ') || 'มีความคล้ายคลึงกับพัสดุในคลัง',
        searchKeyword: bestSearchTerm || candidate.itemName
      });
    }
  }

  // Sort by confidence descending, then by remainingQty
  scoredResults.sort((a, b) => {
    if (b.confidence !== a.confidence) {
      return b.confidence - a.confidence;
    }
    return (b.remainingQty || 0) - (a.remainingQty || 0);
  });

  return scoredResults.slice(0, 5); // Return top 5 best matches
}
