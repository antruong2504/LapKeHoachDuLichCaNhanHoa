import { removeDiacritics } from '../controllers/categoryController.js';

/**
 * Chuẩn hóa chuỗi tiếng Việt: bỏ dấu, chuyển đ->d, bỏ ký tự đặc biệt, gộp khoảng trắng
 */
export const normalizeViText = (str) => {
  if (!str) return '';
  return removeDiacritics(String(str))
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Kiểm tra khớp nguyên từ (word boundary) trong chuỗi đã chuẩn hóa
 */
const hasWholeWord = (normText, phrase) => {
  if (!normText || !phrase) return false;
  const regex = new RegExp(`(?:^|\\s)${escapeRegex(phrase)}(?:$|\\s)`);
  return regex.test(normText);
};

/**
 * Kiểm tra khớp tiền tố từ (word prefix) - chỉ dùng cho từ >= 2 ký tự
 */
const hasWordPrefix = (normText, token) => {
  if (!normText || !token || token.length < 2) return false;
  const regex = new RegExp(`(?:^|\\s)${escapeRegex(token)}`);
  return regex.test(normText);
};

/**
 * Khoảng cách Levenshtein để chịu lỗi chính tả nhẹ (gõ thiếu/nhầm 1 ký tự)
 */
const levenshtein = (a, b) => {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matrix = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[a.length][b.length];
};

const hasFuzzyWord = (words, token) => {
  if (!token || token.length < 5) return false;
  const maxDist = token.length >= 8 ? 2 : 1;
  return words.some((w) => {
    if (Math.abs(w.length - token.length) > maxDist) return false;
    return levenshtein(w, token) <= maxDist;
  });
};

/**
 * Chấm điểm mức độ liên quan của 1 địa điểm với từ khóa tìm kiếm bất kỳ
 * Hỗ trợ: có dấu/không dấu, viết hoa lộn xộn, nhiều từ kết hợp (VD: "biển đà nẵng", "chùa huế"),
 * tìm theo tên, tỉnh/thành, địa chỉ, danh mục, mô tả, và chịu lỗi gõ nhầm nhẹ.
 */
export const scoreDestinationSearch = (dest, rawQuery) => {
  const normQuery = normalizeViText(rawQuery);
  if (!normQuery) return 1;

  const tokens = normQuery.split(' ').filter(Boolean);
  if (tokens.length === 0) return 1;

  const nameNorm = normalizeViText(dest.ten_dia_diem);
  const provinceNorm = normalizeViText(dest.tinh_thanh?.ten_tinh_thanh);
  const addressNorm = normalizeViText(dest.dia_chi);
  const categoryNorm = normalizeViText(
    (dest.dia_diem_danh_mucs || [])
      .map((item) => `${item.danh_muc?.ten_danh_muc || ''} ${item.danh_muc?.nhom_danh_muc?.ten_nhom || ''}`)
      .join(' ')
  );
  const shortDescNorm = normalizeViText(dest.mo_ta_ngan);
  const detailDescNorm = normalizeViText(dest.mo_ta_chi_tiet);
  const priceTag = Number(dest.gia_tham_quan) === 0 ? 'mien phi' : '';

  const primaryText = `${nameNorm} ${provinceNorm} ${addressNorm} ${categoryNorm} ${priceTag}`.trim();
  const primaryWords = primaryText.split(' ').filter(Boolean);
  const allWords = `${primaryText} ${shortDescNorm} ${detailDescNorm}`.split(' ').filter(Boolean);

  let score = 0;

  // 1. Điểm thưởng khớp nguyên cụm từ (phrase match)
  if (nameNorm === normQuery) score += 200;
  else if (nameNorm.startsWith(normQuery)) score += 150;
  else if (hasWholeWord(nameNorm, normQuery)) score += 120;

  if (hasWholeWord(provinceNorm, normQuery)) score += 95;
  if (hasWholeWord(addressNorm, normQuery)) score += 70;
  if (hasWholeWord(categoryNorm, normQuery)) score += 60;
  if (hasWholeWord(shortDescNorm, normQuery)) score += 25;
  if (hasWholeWord(detailDescNorm, normQuery)) score += 10;

  // 2. Chấm điểm từng từ khóa (hỗ trợ tìm kết hợp đa trường như "bien da nang", "chua hue")
  let matchedTokens = 0;
  let primaryMatchedTokens = 0;

  for (const token of tokens) {
    let tokenScore = 0;
    let matchedPrimary = false;

    if (hasWholeWord(nameNorm, token)) {
      tokenScore = Math.max(tokenScore, 40);
      matchedPrimary = true;
    } else if (hasWordPrefix(nameNorm, token)) {
      tokenScore = Math.max(tokenScore, 28);
      matchedPrimary = true;
    }

    if (hasWholeWord(provinceNorm, token)) {
      tokenScore = Math.max(tokenScore, 35);
      matchedPrimary = true;
    } else if (hasWordPrefix(provinceNorm, token)) {
      tokenScore = Math.max(tokenScore, 22);
      matchedPrimary = true;
    }

    if (hasWholeWord(addressNorm, token) || hasWordPrefix(addressNorm, token)) {
      tokenScore = Math.max(tokenScore, 24);
      matchedPrimary = true;
    }

    if (hasWholeWord(categoryNorm, token) || hasWordPrefix(categoryNorm, token)) {
      tokenScore = Math.max(tokenScore, 24);
      matchedPrimary = true;
    }

    if (priceTag && hasWholeWord(priceTag, token)) {
      tokenScore = Math.max(tokenScore, 20);
      matchedPrimary = true;
    }

    if (tokenScore === 0) {
      if (hasWholeWord(shortDescNorm, token) || hasWordPrefix(shortDescNorm, token)) {
        tokenScore = 10;
      } else if (hasWholeWord(detailDescNorm, token)) {
        tokenScore = 5;
      } else if (hasFuzzyWord(primaryWords, token)) {
        tokenScore = 16;
        matchedPrimary = true;
      }
    }

    if (tokenScore > 0) {
      matchedTokens += 1;
      if (matchedPrimary) primaryMatchedTokens += 1;
      score += tokenScore;
    }
  }

  // Yêu cầu tất cả các từ khóa đều phải khớp (trừ trường hợp từ khóa dài >= 3 từ cho phép khớp >= 70%)
  const minRequired = tokens.length <= 2 ? tokens.length : Math.ceil(tokens.length * 0.7);
  if (matchedTokens < minRequired) {
    return 0;
  }

  if (primaryMatchedTokens === tokens.length) {
    score += 35;
  }

  return score;
};
