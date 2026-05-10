import type { Metadata } from 'next'
import { Nav } from '@/components/layout/Nav'
import { Footer } from '@/components/layout/Footer'
import { LegalLayout } from '@/components/legal/LegalLayout'

export const metadata: Metadata = {
  title: 'Gizlilik Politikası',
}

export default function PrivacyPage() {
  return (
    <>
      <Nav />
      <main>
        <LegalLayout title="Gizlilik Politikası" updatedAt="9 Mayıs 2026">
          <p>
            <strong>Önemli:</strong> Bu metin, FitAI'ın yasal olarak yayınlanan son Gizlilik
            Politikası değildir. Avukat denetimi sonrası yayınlanacaktır. Kayıt sırasında ve
            uygulamayı kullanmaya başlamadan önce sana güncel sürüm gösterilecektir.
          </p>

          <h2>1. Kim olduğumuz</h2>
          <p>
            FitAI ("biz", "bizim", "Hizmet"), kullanıcılarına AI karakterleriyle sohbet imkânı sunan
            bir mobil ve web platformudur.
          </p>

          <h2>2. Hangi verileri topluyoruz</h2>
          <ul>
            <li>
              <strong>Hesap bilgileri:</strong> e-posta, ad, doğum tarihi, profil görseli.
            </li>
            <li>
              <strong>Sohbet içeriği:</strong> karakterlerle yaptığın konuşmalar, sesli mesajlar,
              paylaştığın görseller.
            </li>
            <li>
              <strong>Kullanım verileri:</strong> ekran görüntüleme süresi, etkileşim metrikleri,
              oturum bilgileri.
            </li>
            <li>
              <strong>Cihaz bilgileri:</strong> cihaz modeli, işletim sistemi, uygulama sürümü.
            </li>
            <li>
              <strong>Ödeme bilgileri:</strong> Ödemeler Apple ve Stripe tarafından işlenir; biz
              kart bilgilerini saklamayız.
            </li>
          </ul>

          <h2>3. Bu verileri nasıl kullanıyoruz</h2>
          <ul>
            <li>Hizmeti sağlamak ve kişiselleştirmek</li>
            <li>Karakterlerin seninle ilgili hatırlamaları gereken anıları korumak</li>
            <li>Güvenliği sağlamak ve dolandırıcılığı önlemek</li>
            <li>Yasal yükümlülükleri yerine getirmek</li>
          </ul>

          <h2>4. Sohbet gizliliği</h2>
          <p>
            Sohbetlerin senindir. <strong>Karakterin yaratıcısı bile mesajlarını okuyamaz.</strong>{' '}
            Mesajlarına yalnızca otomatik moderasyon sistemleri (yasa dışı içerik tespiti için) ve
            sen erişebilirsin.
          </p>

          <h2>5. Üçüncü taraflarla paylaşım</h2>
          <p>
            Verilerini satmıyoruz. Sınırlı durumlarda hizmet sağlayıcılarımızla (barındırma, ödeme
            işlemcileri, AI altyapı sağlayıcıları) paylaşıyoruz. Bunların listesi son sürümde
            belirtilecektir.
          </p>

          <h2>6. Verilerin korunması</h2>
          <p>
            Sohbet içeriklerin şifreli olarak saklanır. Yetkisiz erişimi önlemek için endüstri
            standardı güvenlik önlemleri uygularız.
          </p>

          <h2>7. Haklarınız</h2>
          <p>
            KVKK ve GDPR kapsamında: verilerine erişim, düzeltme, silme, dışa aktarma ve işlemeyi
            sınırlama haklarına sahipsin. Talep için{' '}
            <a href="mailto:privacy@fitai.com">privacy@fitai.com</a> adresine yazabilirsin.
          </p>

          <h2>8. Çocuklar</h2>
          <p>
            FitAI 18 yaş ve üzeri kullanıcılar içindir. 18 yaşından küçük olduğunu öğrendiğimizde
            hesap derhal silinir.
          </p>

          <h2>9. İletişim</h2>
          <p>
            Sorularınız için: <a href="mailto:privacy@fitai.com">privacy@fitai.com</a>
          </p>
        </LegalLayout>
      </main>
      <Footer />
    </>
  )
}
