import type { Metadata } from 'next'
import { Nav } from '@/components/layout/Nav'
import { Footer } from '@/components/layout/Footer'
import { LegalLayout } from '@/components/legal/LegalLayout'

export const metadata: Metadata = {
  title: 'DMCA / Telif Hakkı',
}

export default function DMCAPage() {
  return (
    <>
      <Nav />
      <main>
        <LegalLayout title="DMCA / Telif Hakkı" updatedAt="9 Mayıs 2026">
          <p>
            FitAI, telif hakkı sahiplerinin haklarını ciddiye alır. Bir içeriğin telif hakkını ihlal
            ettiğini düşünüyorsan, aşağıdaki prosedürü kullanarak takedown talebi gönderebilirsin.
          </p>

          <h2>Takedown talebi</h2>
          <p>Aşağıdaki bilgileri içeren bir talep gönder:</p>
          <ul>
            <li>İhlal ettiği iddia edilen orijinal eserin tanımı</li>
            <li>İhlal eden içeriğin URL'si veya tanımlaması</li>
            <li>İletişim bilgilerin (ad, adres, telefon, e-posta)</li>
            <li>
              "İyi niyetli inancım, bu kullanımın telif hakkı sahibi tarafından
              yetkilendirilmediğidir" beyanı
            </li>
            <li>
              "Bu bilgilerin doğru olduğunu ve telif hakkı sahibi adına hareket etmeye yetkili
              olduğumu yemin ederim" beyanı
            </li>
            <li>Fiziksel veya elektronik imza</li>
          </ul>

          <h2>Nereye göndereyim?</h2>
          <p>
            <strong>E-posta:</strong> <a href="mailto:dmca@fitai.com">dmca@fitai.com</a>
          </p>
          <p>
            Talepler genellikle 24-72 saat içinde değerlendirilir. Geçerli taleplerde içerik
            kaldırılır ve içeriği yükleyen kullanıcı bilgilendirilir.
          </p>

          <h2>Karşı bildirim</h2>
          <p>
            Senin içeriğin yanlış bir DMCA talebi nedeniyle kaldırıldıysa, karşı bildirim
            gönderebilirsin. Aynı e-posta adresine yaz, "Karşı Bildirim" konulu.
          </p>

          <h2>Tekrar eden ihlaller</h2>
          <p>Birden fazla geçerli DMCA bildirimi alan kullanıcıların hesapları kapatılır.</p>
        </LegalLayout>
      </main>
      <Footer />
    </>
  )
}
