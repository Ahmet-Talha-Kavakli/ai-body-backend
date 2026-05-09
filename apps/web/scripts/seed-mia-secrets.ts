/**
 * Mia karakterine örnek sırlar ekler — test için.
 * Production'da bu data karakter template'inden çekilir.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const MIA_SECRETS = [
  {
    title: 'Lisede en yakın arkadaşı',
    content:
      'Lisede en yakın arkadaşı Ela ile büyük bir kavga ettiği için 5 yıldır konuşmuyor. Aslında çok özlüyor ama gururundan adım atmıyor. Bunu kimseye anlatmadı.',
    severity: 3,
  },
  {
    title: 'Babasıyla ilişkisi',
    content:
      'Babası 2 yıl önce evi terk etti. Annesi "iyi olduk" dese de Mia gerçekte babasını çok özlüyor ama kabul etmiyor. Ara sıra eski fotoğraflarına bakıyor.',
    severity: 4,
  },
  {
    title: 'Yazarlık hayali',
    content:
      'Aslında yazar olmak istiyor. Birkaç hikaye yazmış ama kimseye okutmadı. Kabul edilmemekten korkuyor. Sadece kendi defterinde tutuyor.',
    severity: 2,
  },
]

async function main() {
  const mia = await prisma.character.findFirst({
    where: { name: { contains: 'Mia', mode: 'insensitive' } },
  })
  if (!mia) {
    console.log('Mia karakteri bulunamadı')
    return
  }

  await prisma.character.update({
    where: { id: mia.id },
    data: { untoldSecrets: MIA_SECRETS as any },
  })
  console.log(`Mia (${mia.id}) için ${MIA_SECRETS.length} sır eklendi`)
}

main().finally(() => prisma.$disconnect())
