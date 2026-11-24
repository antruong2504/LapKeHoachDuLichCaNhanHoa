import prisma from '../src/config/db.js';

async function testSearch() {
  console.log('--- TEST TÌM KIẾM KHÔNG DẤU TIẾNG VIỆT ---');
  const kw = 'ba na';
  const rawMatches = await prisma.$queryRawUnsafe(
    `SELECT id, ten_dia_diem FROM dia_diems 
     WHERE unaccent(ten_dia_diem) ILIKE unaccent($1) 
        OR unaccent(coalesce(dia_chi, '')) ILIKE unaccent($1)
        OR unaccent(coalesce(mo_ta_ngan, '')) ILIKE unaccent($1)`,
    `%${kw}%`
  );
  console.log(`Kết quả tìm "${kw}":`, rawMatches);

  const kw2 = 'hoi an';
  const rawMatches2 = await prisma.$queryRawUnsafe(
    `SELECT id, ten_dia_diem FROM dia_diems 
     WHERE unaccent(ten_dia_diem) ILIKE unaccent($1) 
        OR unaccent(coalesce(dia_chi, '')) ILIKE unaccent($1)`,
    `%${kw2}%`
  );
  console.log(`Kết quả tìm "${kw2}":`, rawMatches2);
  process.exit(0);
}

testSearch();
