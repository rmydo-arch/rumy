# İş Gereksinimleri Dokümanı (BRD)

| | |
|---|---|
| **Ürün** | Konsept fotoğraf stüdyosu (geçici ad: kılık) |
| **Sürüm** | Taslak 1 |
| **Tarih** | 2026-11-08 |
| **Durum** | Onaylandı (2026-11-08) |
| **Tasarım** | [Onaylı prototip](https://claude.ai/artifact/75QdXcDqHHqWK13nLfbr3d) |

## 1. Özet

Sosyal medya kullanıcıları fotoğraflarını seçtikleri bir konsepte göre dönüştürüp paylaşır. Ürün, birçok konsepti aynı ekran şablonuyla taşıyacak şekilde kurulur. İlk sürümde yalnızca **Retro > 70'ler** çalışır, diğer konseptler "Yakında" kartı olarak görünür.

Bütçe sıfır olduğu için ilk sürümde görsel işleme kullanıcının cihazında, tarayıcıda çalışan bir motorla yapılır. Üretken yapay zekâ bu sürümde yoktur; motor değiştirilebilir bir katmanın arkasında durur ve model sonradan bu katmana bağlanır.

## 2. Amaç ve aşamalar

| Aşama | Hedef | İçerik |
|---|---|---|
| **1. Doğrulama (bu doküman)** | 70'ler dönüşümü ilgi görüyor ve paylaşılıyor mu? | Telefon öncelikli web, filtre motoru, sıfır maliyet |
| **2. Yapay zekâ** | Prompt ile gerçek düzenleme talebi var mı? | Motor katmanına model bağlanması, prompt alanı, üretim hakkı |
| **3. Ticari ürün** | Gelir | Ödeme sistemi, iOS ve ardından Android uygulamaları |

## 3. Hedef kullanıcı

Instagram ve TikTok'ta paylaşım yapan, 18–35 yaş arası, Türkiye'deki kullanıcılar. Arayüz dili Türkçedir. Kullanıcılar ağırlıklı olarak telefondan, fotoğraflarını galeriden seçerek kullanır.

## 4. Başarı ölçütleri

| Ölçüt | Tanım | Hedef |
|---|---|---|
| **Ana ölçüt** | Sonuç gören kullanıcılardan indiren veya paylaşanların oranı | Analizde belirlenecek |
| **İkincil ölçüt** | Sonuç gören kullanıcılardan "yapay zekâ gelince haber ver" düğmesine basanların oranı | Analizde belirlenecek |
| **Destek ölçütü** | Girişin istendiği adımda kayıt olmadan çıkanların oranı | İzlenecek |

## 5. Kapsam

### 5.1 İlk sürümde olanlar

- Herkesin girişsiz gezebildiği konsept galerisi: Retro rafı (50'ler, 60'lar, 70'ler, 80'ler, 90'lar, Y2K) ve diğer konseptler
- Çalışan tek konsept olarak 70'ler; diğerleri tıklanamayan "Yakında" kartları
- Telefonda galeriden, bilgisayarda klasörden fotoğraf seçme
- Tarayıcıda çalışan görsel motor: renk, gren, ışık sızıntısı, çerçeve, arka plan değiştirme, şablonlar (plak kapağı, afiş, dergi kapağı)
- Format seçimi: gönderi 4:5, kare 1:1, hikâye 9:16
- Önce/sonra karşılaştırması ve varyasyonlar
- İndirme ve paylaşma
- Google ile veya doğrulamalı e-posta + şifre ile giriş
- "Yapay zekâ gelince haber ver" talep toplama
- Kullanım ölçümü ve KVKK aydınlatma metni

### 5.2 İlk sürümde olmayanlar

| Özellik | Ne zaman |
|---|---|
| Saç, kıyafet veya yüz üzerinde üretken düzenleme | Aşama 2 |
| Serbest prompt ile düzenleme | Aşama 2 |
| Üretim hakkı ve kullanım limiti | Aşama 2 |
| Aksesuar ekleme, saç ve kıyafet rengi değiştirme | İlk sürüm verilerine göre |
| "Çalışmalarım" geçmişi ve bulut galerisi | Kullanıcı talebine göre |
| Davet sistemi | Sonraki aşamalar |
| Ödeme sistemi | Aşama 3 |
| Apple ile giriş | iOS sürümüyle |
| iOS ve Android uygulamaları | Aşama 3 |
| 70'ler dışındaki konseptlerin çalışması | Doğrulama sonrasında |

## 6. Fonksiyonel gereksinimler

### Galeri ve konsept yapısı

- **G-1:** Katalog Raf > Konsept > Stil hiyerarşisini izler.
- **G-2:** Yeni bir konsept, yeni ekran yazmadan yalnızca konsept tanımı eklenerek açılabilir.
- **G-3:** Konsept tanımı vurgu rengini, görselleri, stilleri, seçenekleri ve ekran metinlerini içerir.
- **G-4:** Canlı ve "Yakında" durumu konsept tanımından yönetilir.

### Fotoğraf seçimi

- **F-1:** JPG, PNG ve WEBP kabul edilir; üst sınır 20 MB'tır.
- **F-2:** Desteklenmeyen veya okunamayan dosyada kullanıcıya anlaşılır bir hata gösterilir.
- **F-3:** Ekranda yalnızca kendi fotoğraflarının veya izinli fotoğrafların yüklenmesi gerektiği belirtilir.
- **F-4:** Fotoğrafların cihazdan çıkmadığı kullanıcıya açıkça söylenir.

### Görsel motor

- **M-1:** Tüm işleme cihazda yapılır; fotoğraf ve sonuç sunucuya gönderilmez.
- **M-2:** Motor değiştirilebilir bir arayüzün arkasındadır; ekranlar motorun türüne bağlı değildir.
- **M-3:** Kişi arka plandan ayrılıp 70'ler sahnelerine yerleştirilebilir.
- **M-4:** Kesim başarısız olursa veya cihaz yetersizse kullanıcıya sade filtre sonucu sunulur ve durum açıklanır.

### Sonuç, indirme ve paylaşma

- **S-1:** Sonuç ekranında önce/sonra karşılaştırması ve varyasyonlar bulunur.
- **S-2:** Sonuç, seçilen formatta görsel dosyası olarak indirilebilir.
- **S-3:** Paylaşım, cihazın paylaşım menüsüyle yapılır; desteklenmiyorsa indirmeye yönlendirilir.
- **S-4:** İlk indirme veya paylaşma denemesinde giriş istenir.

### Hesap

- **H-1:** Galeri, fotoğraf seçimi ve sonuç görüntüleme girişsiz kullanılır.
- **H-2:** Giriş sonrasında kullanıcı sonucuna geri döner; Google yönlendirmesi sırasında da sonuç kaybolmaz.
- **H-3:** Sonucu korumak için kullanılan geçici veri yalnızca cihazda tutulur ve işlem bitince silinir.

### Talep toplama ve ölçüm

- **T-1:** "Haber ver" talebi hesap ile ilişkilendirilir; giriş yapmamış kullanıcıdan giriş istenir.
- **T-2:** Şu olaylar ölçülür: konsept açma, fotoğraf seçme, sonuç görme, giriş isteme, giriş tamamlama, indirme, paylaşma, haber ver.
- **T-3:** Ölçüm verisinde fotoğraf veya fotoğraftan türetilen yüz bilgisi bulunmaz.

## 7. Fonksiyonel olmayan gereksinimler

| Konu | Gereksinim |
|---|---|
| **Maliyet** | İlk sürüm ücretsiz hizmet katmanlarıyla çalışır. |
| **Cihaz** | Telefon öncelikli tasarım; hedef cihaz ve tarayıcı listesi analizde belirlenir. |
| **Performans** | Sonuç süresi hedefi orta seviye telefonda ölçülerek analizde belirlenir. |
| **Mimari** | Hesap ve talep işlemleri, iOS ve Android'in de kullanabileceği bir API üzerinden yapılır. |
| **Erişilebilirlik** | Dokunma hedefleri en az 44 px; metin kontrastı en az 4.5:1. |
| **Dil** | Türkçe; metinler sonradan çeviriye açık tutulur. |

## 8. Veri ve KVKK

| Veri | Nerede | Not |
|---|---|---|
| Fotoğraf ve sonuç | Yalnızca cihaz | Sunucuya gönderilmez |
| E-posta, ad, giriş bilgisi | Sunucu | Hesap için |
| Haber ver talebi | Sunucu | Hesapla ilişkili |
| Kullanım olayları | Sunucu veya ölçüm servisi | Fotoğraf içermez |

Aydınlatma metni, gizlilik politikası ve hesap silme yolu ilk sürümde bulunur. Hukuki metinlerin yayından önce bir uzman tarafından incelenmesi gerekir. Ölçüm servisi seçilirken yurt dışına veri aktarımı değerlendirilir.

## 9. Onaylı tasarımdan farklar

Tasarım tuvali bu kararlara göre güncellenecektir.

| Ekran | Değişiklik |
|---|---|
| **Giriş** | Açılış ekranı olmaktan çıkar, indirme veya paylaşma anında açılan adım olur. "Apple ile devam et" kaldırılır. |
| **Stil ve prompt** | Prompt alanı, yüz benzerliği ve saç, kıyafet, aksesuar seçenekleri gizlenir. Stil, sahne ve film dokusu seçimi kalır. |
| **Yıl kaydırıcısı** | Motorun etkileyebildiği özelliklere (renk tonu, tarih damgası) bağlanır. |
| **İşleme** | Metinler cihazda işlemeye göre kısalır. |
| **Sonuç** | "Şunu değiştir" alanı kaldırılır, "yapay zekâ gelince haber ver" eklenir. |
| **Fotoğraf seçimi** | "Fotoğrafların cihazından çıkmaz" bilgisi eklenir. |

## 10. Riskler

| Risk | Etki | Önlem |
|---|---|---|
| Filtre tabanlı sonuç, üretken yapay zekâ kadar etkileyici değil | Ana ölçüt düşük çıkar, fikir haksız yere elenebilir | İkincil ölçütle asıl ürüne talebi ayrıca ölçmek |
| Benzer filtre uygulamalarından ayrışamama | Düşük paylaşım | Plak kapağı, Yeşilçam gibi şablonlar ve yerel içerik |
| Telefonlarda kesim kalitesi veya hızı yetersiz | Kötü sonuç, terk | Geliştirmenin başında cihaz testi; sade filtreye geri dönüş |
| 24 stilin bir kısmı üretken model gerektiriyor | Beklenen sonuç verilemez | Stil listesi analizde motora göre daraltılır |
| Sahne görsellerinde lisans sorunu | Hukuki risk | Kendi üretimimiz veya serbest lisanslı içerik |
| Giriş adımında kullanıcı kaybı | İndirme oranı düşer | Destek ölçütüyle izleme |
| Ücretsiz hizmetlerin ticari kullanım koşulları | Aşama geçişinde taşıma ihtiyacı | Analizde koşulları kontrol etme |
| İleriki aşamaların ücretli gereksinimleri | Sıfır bütçe sürdürülemez | Alan adı, yapay zekâ ve Apple geliştirici hesabı aşama geçişinde yeniden değerlendirilir |

## 11. Analizde netleşecekler

1. Ana ve ikincil ölçütlerin sayısal hedefleri ve ilk kullanıcı sayısı
2. Ürünün kalıcı adı ve alan adı
3. 70'ler stil listesinin motorun yapabildiklerine göre son hâli
4. Sahne ve şablon görsellerinin kaynağı
5. Hedef cihaz, tarayıcı ve performans hedefleri
6. E-posta doğrulamasının zamanı (indirmeden önce mi, sonra mı)
7. Teknoloji seçimi, ücretsiz hizmetler ve kütüphane lisansları
