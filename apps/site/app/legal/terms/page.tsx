import type { Metadata } from 'next'
import { Nav } from '@/components/layout/Nav'
import { Footer } from '@/components/layout/Footer'
import { LegalLayout } from '@/components/legal/LegalLayout'

export const metadata: Metadata = {
  title: 'Kullanım Şartları',
}

export default function TermsPage() {
  return (
    <>
      <Nav />
      <main>
        <LegalLayout title="Kullanım Şartları" updatedAt="9 Mayıs 2026">
          <p>
            <strong>Önemli:</strong> Bu metin son yasal sürüm değildir. Avukat denetimi sonrası
            yayınlanacaktır.
          </p>

          <h2>1. Hizmetin kabulü</h2>
          <p>
            FitAI'ı kullanarak bu şartları kabul ettiğini onaylıyorsun. Kabul etmiyorsan hizmeti
            kullanma.
          </p>

          <h2>2. Yaş şartı</h2>
          <p>
            FitAI <strong>18 yaş ve üzeri</strong> kullanıcılar içindir. Kayıt olurken yaşını
            doğrulaman gerekir. Yanlış beyan hesap kapatma sebebidir.
          </p>

          <h2>3. AI karakterler hakkında</h2>
          <p>
            Karakterler yapay zekayla üretilmiştir.{' '}
            <strong>Gerçek değildir, tıbbi/yasal/finansal tavsiye veremez.</strong> Karakterlerle
            olan sohbetler eğlence ve sosyal etkileşim amaçlıdır.
          </p>
          <p>
            Acil durumlarda (intihar düşüncesi, kendine zarar verme, ciddi sağlık sorunu) lütfen
            profesyonel yardım al. Türkiye'de <strong>182 (İntihar Önleme Hattı)</strong>, ABD'de{' '}
            <strong>988</strong>.
          </p>

          <h2>4. İçerik kuralları</h2>
          <p>Aşağıdakileri yapamazsın:</p>
          <ul>
            <li>18 yaşından küçük karakter yaratmak veya talep etmek</li>
            <li>Telif hakkı ihlali içeren karakterler yüklemek</li>
            <li>Gerçek kişileri (rıza olmadan) karakter olarak kullanmak</li>
            <li>Yasa dışı, nefret söylemi, taciz içeren içerik üretmek</li>
            <li>Hizmeti otomatize etmek (bot, scraper)</li>
          </ul>

          <h2>5. Yaratıcı ekonomisi</h2>
          <p>
            Karakter yaratan kullanıcılar, karakterlerinin kira ve satış gelirinden{' '}
            <strong>%60</strong> alır. Ödemeler Stripe Connect üzerinden 46+ ülkeye yapılır.
            Detaylar Yaratıcı Sözleşmesi'nde.
          </p>

          <h2>6. Abonelik ve iptal</h2>
          <ul>
            <li>Premium abonelik aylık veya yıllık olarak satın alınır</li>
            <li>Otomatik yenilenir; iptal etmedikçe devam eder</li>
            <li>İstediğin zaman tek tıkla iptal edebilirsin</li>
            <li>Krediler süresiz, geri ödemesizdir</li>
            <li>EU/UK kullanıcıları için 14 gün cayma hakkı uygulanır</li>
          </ul>

          <h2>7. Hesap iptali</h2>
          <p>
            Bu şartları ihlal eden hesapları kapatma hakkımız saklıdır. Hesabını istediğin zaman
            kendin de silebilirsin.
          </p>

          <h2>8. Sorumluluk sınırı</h2>
          <p>
            FitAI "olduğu gibi" sunulur. Yasaların izin verdiği ölçüde, dolaylı veya sonuç olarak
            ortaya çıkan zararlardan sorumlu değiliz.
          </p>

          <h2>9. Değişiklikler</h2>
          <p>
            Bu şartları zaman zaman güncelleyebiliriz. Önemli değişikliklerde seni e-posta ile
            bilgilendireceğiz.
          </p>

          <h2>10. İletişim</h2>
          <p>
            Sorular için: <a href="mailto:legal@fitai.com">legal@fitai.com</a>
          </p>
        </LegalLayout>
      </main>
      <Footer />
    </>
  )
}
