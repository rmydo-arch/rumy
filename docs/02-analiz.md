# Analiz Dokümanı

| | |
|---|---|
| **Kapsam** | Aşama 1: 70'ler konsepti, sıfır maliyetli doğrulama sürümü |
| **Girdi** | [BRD](01-brd.md), [onaylı tasarım](https://claude.ai/artifact/75QdXcDqHHqWK13nLfbr3d) |
| **Tarih** | 2026-11-08 |
| **Durum** | Onaylandı (2026-11-08) |

## 1. Özet kararlar

| Konu | Karar |
|---|---|
| Arayüz | React, TypeScript, Vite; statik tek sayfa uygulama |
| Görsel motor | WebGL2 ile cihazda işleme, MediaPipe ile kişi/arka plan ayrımı |
| Barındırma | Cloudflare Pages, `pages.dev` alt alan adı |
| Giriş | Firebase Authentication (Spark planı) |
| Veri | Cloud Firestore (Spark planı), yalnızca profil ve "haber ver" |
| Ölçüm | PostHog Cloud EU, çerezsiz, IP kaydı kapalı |
| Sunucu | İlk sürümde kendi sunucumuz yok |
| Aylık maliyet | 0 $ (kotalar içinde) |

**Geliştirmenin ilk işi bir doğrulama testidir (bölüm 12).** Telefonlarda kesim kalitesi yetersiz çıkarsa ürünün sahne stilleri değişir, bu yüzden ekran geliştirmesinden önce yapılır.

## 2. Sistem yapısı

```text
Telefon / bilgisayar tarayıcısı
├─ Arayüz (React)
│   ├─ Konsept kataloğu (veri dosyaları)
│   └─ Ekranlar: Galeri > Fotoğraf > Stil > İşleme > Sonuç
├─ Görsel motor (ImageEngine arayüzü)
│   ├─ Aşama 1: FilterEngine (MediaPipe + WebGL2)
│   └─ Aşama 2: AiEngine (eklenecek)
└─ Servis katmanı
    ├─ Firebase Authentication ──> hesap
    ├─ Cloud Firestore ──────────> profil, haber ver
    └─ PostHog Cloud EU ─────────> kullanım olayları

Fotoğraf ve sonuç bu sınırın dışına çıkmaz; yalnızca kullanıcı
indirince veya cihazın paylaşım menüsünü kullanınca dışarı aktarılır.
```

Önerilen klasör yapısı:

```text
src/
  concepts/   katalog verisi ve tip tanımları
  engine/     ImageEngine arayüzü, FilterEngine, shader ve kesim kodu
  features/   gallery, upload, editor, result, auth
  services/   auth, demand, analytics (dış servis erişimi sadece burada)
  ui/         ortak bileşenler ve tema
public/
  models/     MediaPipe modeli ve WASM dosyaları
  scenes/     sahne ve şablon SVG'leri
```

## 3. Değerlendirilen seçenekler

### Görüntü işleme

| Seçenek | Değerlendirme | Sonuç |
|---|---|---|
| **WebGL2 shader** | Önizleme ve dışa aktarma aynı kodla çalışır, telefonda hızlıdır | **Seçildi** |
| CSS `filter` | Prototipte kullanıldı, ama sonuç dosyası üretemez | Elendi |
| Canvas 2D `filter` | Safari desteği güvenilir görünmüyor | Elendi |
| Piksel piksel JavaScript | Her yerde çalışır ama yüksek çözünürlükte yavaştır | Yalnızca yedek |

### Giriş ve veri

| Seçenek | Değerlendirme | Sonuç |
|---|---|---|
| **Firebase** | Doğrulama e-postası alan adı gerektirmeden gönderilebiliyor, iOS ve Android SDK'ları var, proje uykuya geçmiyor | **Seçildi** |
| Supabase | Hazır e-posta servisi saatte yaklaşık 2 e-posta ile sınırlı; özel SMTP için alan adı gerekir. Düşük kullanımda proje 7 günde duraklıyor | Elendi |
| Kendi API'miz | Bu aşamada işi yok, işletme yükü getirir | Aşama 2'ye |

### Barındırma

| Seçenek | Değerlendirme | Sonuç |
|---|---|---|
| **Cloudflare Pages** | Statik dosya istekleri ücretsiz ve sınırsız; dosya sınırı 25 MiB, model dosyasına yeter | **Seçildi** |
| Firebase Hosting | Yaklaşık 16 MB'lık model, küçük trafik kotasını hızla tüketir | Elendi |
| Vercel Hobby | Yalnızca ticari olmayan kullanım | Elendi |

**BRD ile ilişki:** BRD "iOS ve Android'in de kullanabileceği API" istiyor. Aşama 1'de bu rolü Firebase SDK'ları ve güvenlik kuralları üstlenir. Yapay zekâ gelince üretim için ayrı bir sunucu API'si eklenir.

## 4. Konsept veri modeli

Yeni konsept, `src/concepts/` altına bir tanım eklenerek açılır (G-2, G-3, G-4).

```ts
type ConceptStatus = "live" | "soon";

interface Shelf { id: string; title: string; description: string; conceptIds: string[]; }

interface Concept {
  id: string;
  status: ConceptStatus;
  name: string;
  cardArt: string;
  theme: { accent: string; stage: string };
  copy: {
    uploadTitle: string;
    editTitle: string;
    cta: string;
    processingTitle: string;
    processingStages: string[];
    resultTitle: string;
  };
  yearRange?: { min: number; max: number; default: number };
  categories: { id: string; label: string }[];
  styles: Style[];
  options: OptionGroup[];
}

interface Style {
  id: string;
  categoryId: string;
  name: string;
  thumbnail: string;
  kind: "filter" | "scene" | "template";
  grade: GradeSettings;
  sceneAsset?: string;
  template?: TemplateSettings;
  frame?: "none" | "instant" | "super8" | "album";
  promptSeed?: string; // Aşama 2'de yapay zekâ için
}
```

"Yakında" kartları yalnızca `id`, `name`, `cardArt` ve `status: "soon"` alanlarına ihtiyaç duyar; diğer alanlar canlıya alınırken doldurulur. Bunun için kod tarafında ayrı bir kart tipi kullanılır.

## 5. Görsel motor

```ts
type EngineCapability = "grade" | "segment" | "prompt" | "identity";

interface ImageEngine {
  id: string;
  capabilities: ReadonlySet<EngineCapability>;
  prepare(photo: Blob): Promise<PreparedPhoto>;
  render(prepared: PreparedPhoto, request: RenderRequest): Promise<RenderResult>;
  dispose(prepared: PreparedPhoto): void;
}
```

Arayüz, prompt alanı gibi kontrolleri `capabilities` değerine göre gösterir. Aşama 2'de motor değişince ekranlar yeniden yazılmadan prompt alanı açılır (M-2).

**İşlem hattı:**

1. Dosya doğrulanır, yönü düzeltilir, uzun kenar üst sınıra indirilir.
2. `scene` stillerinde MediaPipe ile kişi maskesi çıkarılır.
3. Maske kenarları yumuşatılıp fotoğraf çözünürlüğüne büyütülür.
4. WebGL2 renk, gren, ışık sızıntısı ve vinyet uygular.
5. Sahne, kişi, çerçeve veya şablon katmanları birleştirilir.
6. Seçilen formatta JPEG üretilir.

**Bilinen sınırlar:**

- Çok sınıflı model 256×256 girdiyle çalışıyor; model kartındaki ortalama doğruluk (mIoU) yaklaşık 77. Saç kenarlarında kusur beklenir.
- Model kartındaki 512 sürümü daha doğru (mIoU yaklaşık 81), ancak tarayıcı paketindeki kullanılabilirliği testte doğrulanacak.
- Kesim kusurlarını gizlemek için sahneler gerçekçi fotoğraf değil, **kolaj ve afiş dilinde** çizilir. Bu aynı zamanda ürünün tasarım diliyle uyumludur.
- Kişi kesilemezse (M-4) sade filtre sonucu ve açıklama gösterilir.

**Model dosyaları** kendi alan adımızdan sunulur ve tarayıcıda önbelleğe alınır. İlk kullanımdaki indirme yalnızca sahne stili seçildiğinde başlar, filtre stilleri bunu beklemez.

## 6. 70'ler stil listesi

24 stilden, motorun vaadini yerine getirebildiği 12'si seçilmiştir.

| Kategori | Stil | Tür | Motorun yaptığı |
|---|---|---|---|
| Film ve albüm | Anlık Film | filter | Soluk renk, beyaz çerçeve, tarih damgası |
| | Sıcak Slayt Filmi | filter | Doygun renk, ince gren |
| | Super 8 Karesi | filter | Yoğun gren, ışık sızıntısı, film kenarı |
| | Aile Albümü | filter | Turuncu kayma, sararmış kâğıt |
| | Mahalle Fotoğrafçısı | filter | Elle boyanmış görünümlü renk, stüdyo paspartusu |
| Sahneler | Turuncu Salon | scene | Ahşap panelli salon çizimi |
| | Disko Gecesi | scene | Dans pisti, ayna top, renkli ışık |
| | Gazino Sahnesi | scene | Kadife perde, tek spot |
| Afiş ve kapak | Plak Kapağı | template | Kare kapak, şeritli grafik |
| | Yeşilçam Afişi | template | Boyalı afiş dokusu ve başlık alanı |
| | Arabesk Kaset | template | Kaset kapağı düzeni |
| | Punk Fanzini | template | Siyah beyaz fotokopi dokusu |

**Listeden çıkanlar:** Glam Rock, Funk ve Soul, Anadolu Rock, Çiçek Çocukları, Şehir Sokağı (saç veya kıyafet değişimi gerekir); Okul Yıllığı, Bohem Yaz, Moda Dergisi, Karavan Yolculuğu, Riviera Tatili, Retro Uzay, Eski İstanbul (ilk sürüm çizim yükünü sınırlamak için). İkinci gruptakiler kolayca sonradan eklenebilir.

**Kontroller:** Film dokusu seçenekleri (gren, ışık sızıntısı, soluk siyahlar, turuncu kayma, köşe kararması, tarih damgası), yıl (renk tonu ve damga), format ve üç varyasyon (Özgün, Solgun, Canlı).

**Şablon başlığı:** Afiş ve kapak stillerinde kullanıcı en fazla 30 karakterlik başlık yazabilir; başlık da cihazdan çıkmaz.

**Görseller:** Sahne ve şablonlar kendi hazırladığımız SVG çizimlerdir, dış görsel kullanılmaz. Yazı tipleri serbest lisanslı olmalıdır.

## 7. Ekran akışı ve giriş

```text
Galeri > 70'ler > Fotoğraf seç > Stil seç > Sonuç
                                              ├─ İndir / Paylaş ── giriş yoksa ──> Giriş > aynı sonuca dönüş
                                              └─ Haber ver ─────── giriş yoksa ──> Giriş > talep kaydı
```

**Google girişi** yalnızca açılır pencere ile yapılır; sayfa değişmediği için sonuç bellekte kalır (H-2) ve cihaza geçici veri yazmak gerekmez (H-3). Pencere engellenirse kullanıcıya yeniden deneme ve e-posta seçeneği sunulur.

**E-posta doğrulaması:** Kayıt sonrasında doğrulama e-postası gönderilir, ancak ilk indirme engellenmez. "Haber ver" kayıtları ise yalnızca e-postası doğrulanmış hesaplardan sayılır. Böylece giriş adımındaki kayıp azalır, talep listesi temiz kalır.

**Uygulama içi tarayıcı riski:** Instagram veya TikTok'tan açılan bağlantılar uygulamanın kendi tarayıcısında açılır. Google bu ortamlarda girişi genellikle engeller; dosya indirme de güvenilir olmayabilir. Bu ortam tespit edilirse:

- Google düğmesi gizlenir, e-posta ile giriş kalır,
- "Safari veya Chrome'da aç" yönlendirmesi gösterilir,
- durum ölçüm olayına eklenir.

Hedef kitle bu kanaldan geleceği için davranış gerçek cihazlarda test edilecektir.

## 8. Veri modeli ve güvenlik

```text
users/{uid}
  displayName, createdAt

demand/{uid}_{conceptId}
  uid, conceptId, createdAt
```

- Kullanıcı yalnızca kendi `users` belgesini okuyup yazabilir.
- `demand` belgesi yalnızca kendi `uid` değeriyle ve e-postası doğrulanmışsa oluşturulabilir.
- Fotoğraf, dosya adı veya yüz bilgisi hiçbir servise gönderilmez (M-1, T-3).
- Hesap silme hem Authentication kaydını hem kullanıcının belgelerini siler.
- İçerik güvenliği politikası (CSP) yalnızca kullanılan servislere izin verir.

**KVKK:** Firebase ve PostHog verileri Türkiye dışında işlenir. Yurt dışına aktarım koşulları, aydınlatma metni ve gerekirse açık rıza, yayından önce hukuk uzmanına sorulmalıdır. Çerezsiz ölçüm ve kapalı IP kaydı, işlenen veriyi azaltır ama bu değerlendirmeyi gereksiz kılmaz.

## 9. Ölçüm planı

| Olay | Özellikler |
|---|---|
| `concept_opened` | conceptId |
| `photo_selected` | fileType, boyut aralığı |
| `result_viewed` | styleId, kind, süre aralığı |
| `auth_prompted` | trigger (download, share, demand) |
| `auth_completed` | method |
| `download_completed` | styleId, format |
| `share_completed` | styleId, format |
| `demand_clicked` | conceptId |
| `segmentation_failed` | cihaz sınıfı |
| `in_app_browser_detected` | uygulama adı |

**Önerilen hedefler** (sektör verisine değil, karar verebilmek için konulmuş varsayımlara dayanır):

| Ölçüt | Hedef |
|---|---|
| Yorum için en az örneklem | Sonuç gören 200 kullanıcı |
| Ana ölçüt: indirme veya paylaşmayı tamamlama | En az %30 |
| İkincil ölçüt: haber ver tıklaması | En az %10 |
| Giriş adımında kayıp | %50'nin altında |

| Ana ölçüt | İkincil ölçüt | Yorum |
|---|---|---|
| Yüksek | Yüksek | Yapay zekâ aşamasına bütçe aramak mantıklı |
| Yüksek | Düşük | Filtre ürünü yeterli olabilir, stil çeşitliliğine yatırım yapılmalı |
| Düşük | Yüksek | Filtre yetmiyor, talep üretken düzenlemeye |
| Düşük | Düşük | Konsept, kanal veya hedef kitle yeniden düşünülmeli |

## 10. Cihaz ve performans hedefleri

| Konu | Hedef |
|---|---|
| Tarayıcılar | iOS Safari 16+, Android Chrome son iki sürüm, masaüstü Chrome/Safari/Edge son iki sürüm |
| Referans cihaz | 4 GB RAM orta seviye Android, iPhone 11 |
| Stil değiştirme | 1 saniyenin altında (önizleme) |
| İlk sahne sonucu | Model indirildikten sonra 5 saniyenin altında |
| Dışa aktarma | Uzun kenar 2048 px, testte iOS bellek sınırına göre doğrulanacak |

Bu değerler ilk tahminlerdir; doğrulama testinden sonra güncellenir.

## 11. Ücretsiz hizmetler

| Hizmet | Kota (yaklaşık) | Dikkat |
|---|---|---|
| Cloudflare Pages | Statik istekler sınırsız, ayda 500 derleme | Ticari kullanım koşulu yayından önce resmî metinden doğrulanacak |
| Firebase Authentication | Yaklaşık 50.000 aylık kullanıcı | Telefon doğrulaması ücretli, kullanılmıyor |
| Cloud Firestore | 1 GiB, günlük 50.000 okuma, 20.000 yazma | Yalnızca profil ve talep tutulur |
| PostHog Cloud EU | Ayda 1 milyon olay | Oturum kaydı kapalı tutulur |

Firebase Cloud Storage artık Spark planında yok; bu ürün için gerekli değil. Kotalar üçüncü taraf kaynaklarla çelişebildiği için kurulum sırasında resmî panellerden teyit edilecektir.

**Ad ve alan adı:** "kılık" geçici ad olarak kalır, `*.pages.dev` adresi kullanılır. Kalıcı ad için marka araştırması ve alan adı ödemesi Aşama 2'ye bırakılır.

## 12. Doğrulama testi (ilk iş)

Üretim koduna geçmeden önce, küçük ve atılabilir bir sayfa ile şu sorular cevaplanır:

| Soru | Geçme ölçütü |
|---|---|
| Çok sınıflı kesim gerçek selfie'lerde yeterli mi? | 20 izinli fotoğrafın en az 16'sında kesim kolaj sahnesinde kabul edilebilir |
| Referans telefonlarda süre ve bellek yeterli mi? | Bölüm 10 hedefleri; çökme yok |
| WebGL2 çıktısı dosyaya aktarılabiliyor mu? | iOS ve Android'de doğru JPEG, 2048 px veya belirlenen sınır |
| Paylaşım menüsü dosya gönderebiliyor mu? | iOS Safari ve Android Chrome'da çalışıyor |
| Instagram ve TikTok tarayıcılarında neler çalışıyor? | Fotoğraf seçme, indirme ve giriş davranışı belgelenmiş |

**Testi geçemezse:** Sahne stilleri çıkarılır, ilk sürüm filtre ve şablon stilleriyle devam eder. Karar kullanıcıya sunulur.

**Test ihtiyacı:** En az bir iPhone ve bir Android telefon ile 10–20 izinli fotoğraf.

## 13. Hata durumları

| Durum | Kullanıcıya gösterilen |
|---|---|
| Desteklenmeyen veya bozuk dosya | Neden ve desteklenen türler |
| Dosya 20 MB'tan büyük | Boyut uyarısı |
| Model indirilemedi | Tekrar dene veya filtre stili seç |
| Kişi bulunamadı | Sade filtre sonucu ve daha net fotoğraf önerisi |
| WebGL2 yok veya bellek yetersiz | Cihazın desteklemediği açıklaması, mümkünse düşük çözünürlük |
| Paylaşım desteklenmiyor | İndirmeye yönlendirme |
| Giriş açılır penceresi engellendi | Yeniden deneme ve e-posta seçeneği |
| Ağ yok | Galeri ve işleme çalışır; indirme için giriş ve talep kaydı bağlantı ister |

## 14. Test stratejisi

| Katman | Araç | Kapsam |
|---|---|---|
| Birim | Vitest | Katalog doğrulama, dosya kontrolleri, ayarlar, durum geçişleri |
| Motor | Vitest ve örnek görseller | Maske işleme, katman düzeni, çıktı boyutları |
| Güvenlik kuralları | Firebase Emulator | `users` ve `demand` izinleri |
| Uçtan uca | Playwright | Galeri > sonuç > giriş > indirme akışı |
| Gerçek cihaz | Elle kontrol listesi | iPhone, Android, uygulama içi tarayıcılar |

Ölçüm kodunun fotoğraf verisi göndermediği ayrıca test edilir.

## 15. Geliştirme sırası

1. Doğrulama testi ve karar
2. Proje kurulumu, tema, katalog yapısı
3. Galeri ve fotoğraf seçimi
4. Görsel motor: filtre stilleri
5. Stil ekranı ve sonuç
6. Dışa aktarma ve paylaşma
7. Sahne ve şablon stilleri
8. Firebase giriş ve talep toplama
9. Ölçüm
10. KVKK metinleri, hesap silme, güvenlik başlıkları
11. Gerçek cihaz testi ve yayın

Onaylı tasarım tuvali, BRD'nin 9. bölümündeki farklara göre 2. adımdan önce güncellenir.

## 16. Onaylanan kararlar

1. İlk stil listesi bölüm 6'daki 12 stildir.
2. Sayısal hedefler bölüm 9'daki gibidir.
3. E-posta doğrulaması ilk indirmeyi engellemez; talepler yalnızca doğrulanmış hesaplardan sayılır.
4. Afiş ve kapaklarda 30 karakterlik kullanıcı başlığı vardır.
5. Doğrulama testi için iPhone, Android telefon ve izinli fotoğraflar kullanıcı tarafından sağlanır.

## Kaynaklar

- [MediaPipe Image Segmenter](https://developers.google.com/edge/mediapipe/solutions/vision/image_segmenter)
- [Firebase fiyatlandırma planları](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans)
- [Supabase proje duraklatma](https://supabase.com/docs/guides/platform/free-project-pausing)
- [Cloudflare Pages limitleri](https://developers.cloudflare.com/pages/platform/limits)
- [Vercel Hobby planı](https://vercel.com/docs/plans/hobby-plan)
- [Canvas filter tarayıcı desteği](https://caniuse.com/mdn-api_canvasrenderingcontext2d_filter)
- [PostHog Cloud EU](https://posthog.com/blog/posthog-cloud-eu)
- [PostHog gizlilik kontrolleri](https://posthog.com/docs/product-analytics/privacy)
