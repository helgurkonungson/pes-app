---
id: cb-data-tr
version: 1
title: Veri ve Elektronik Tablolar: Temeller
description: Tablo verileri nasıl yapılandırılır, nasıl temiz tutulur, formüllerle nasıl hesaplanır, nasıl aranır, özetlenir ve grafiklerde dürüstçe gösterilir. Excel, Google Sheets ve benzeri araçlarda çalışır.
goal: Elektronik tablolarla güvenle çalışmak ve verilerden sonuç çıkarmak
language: Turkish
minutes: 7
hue: 174
---

# data-01 | Veriler nasıl düzenlenir | Tablo verisi nedir
## Satırlar ve sütunlar
İş verilerinin çoğu **tablolarda** bulunur. İyi düzenlenmiş bir tabloda:
- her **satır** bir kayıttır (bir satış, bir müşteri, bir gün);
- her **sütun** o kaydın bir özelliğidir (tarih, tutar, şehir);
- ilk satırda sütun **başlıkları** bulunur.

Bu düzene "düzenli veri" (tidy data) denir. Formüller, filtreler, pivot tablolar ve her analiz aracı onunla çalışır.

## Veri türleri
Her sütunun bir türü vardır:
- **sayılar** — onlarla hesap yapabilirsiniz (toplam, adet);
- **metin** — isimler, etiketler, kategoriler;
- **tarihler ve saatler** — program içinde bunlar da sayıdır, bu yüzden çıkarabilir ve gruplayabilirsiniz;
- **mantıksal değerler** — DOĞRU/YANLIŞ (TRUE/FALSE).

Sık yapılan bir hata, metin olarak saklanan sayıdır (örneğin "1.200 USD"). Program bunu toplayamaz. Bunun yerine birimleri başlığa yazın: "Tutar, USD".

!key Bir satır bir kayıttır, bir sütun bir özelliktir, ilk satırda başlıklar bulunur.
!key Düzenli bir tablo formüllerle, filtrelerle ve pivot tablolarla çalışır.
!key Başlıca türler: sayılar, metin, tarihler, mantıksal değerler.
!key Bir hücrede sayı ile metni karıştırmayın: birimler başlığa yazılır.

?q:e Düzenli bir tabloda bir satır neyi temsil eder?
- "şehir" gibi bir özelliği
+ Bir satış gibi bir kaydı
- Tablo başlığını
- Tüm verilerin toplamını
= Satırlar kayıtlar, sütunlar özelliklerdir.

?q:m Bir hücrede "1.200 USD" olması neden kötü bir fikirdir?
- Çok uzun
+ Program onu metin sayar ve diğer tutarlarla toplayamaz
- Elektronik tablolarda dolar saklanamaz
- Hücre kırmızıya döner
= Birimleri başlığa yazın: "Tutar, USD".

?q:m "Sipariş tarihi" sütununun veri türü nedir?
- Metin
- Mantıksal
- Anlamsız bir sayı
+ Tarih — program içinde bir sayıdır, bu yüzden tarihler çıkarılabilir ve gruplanabilir
= Tarihler sayı olarak saklanır, bu da süreleri hesaplamanıza izin verir.

?q:h Bir tabloda "Ocak", "Şubat", "Mart" sütunları var ve satırlarda satış temsilcileri bulunuyor. Bu analiz için neden elverişsiz?
+ Bir özellik (ay) birkaç sütuna yayılmış; analiz için "Temsilci", "Ay", "Tutar" sütunlarının olması daha iyi
- Elverişsiz değil, bu ideal düzen
- Ay adları büyük harfle yazılamaz
- Çok az satır var
= Düzenli veride her özellik bir sütundur.

?r:m Bir tablonun ilk satırında ne olmalı?
+ Sütun başlıkları
- Toplamlar
- Boş bir satır
- Şirket adı
= Formüller, filtreler ve pivot tablolar başlıklara ihtiyaç duyar.

?r:e Düzenli bir tablodaki sütun nedir?
- Bir kayıt
+ Kayıtların bir özelliği
- Rastgele bir değerler kümesi
- Yorumlar için bir yer
= Örneğin "Şehir" veya "Tutar".

!open İşinizden veya hayatınızdan bir tablo alın (bir bütçe, satışlar, bir yapılacaklar listesi). Satırlarını, sütunlarını ve veri türlerini, ayrıca nelerin iyileştirilebileceğini anlatın.
!rubric Satırlar ve sütunlar anlatılmış
!rubric Veri türleri belirtilmiş
!rubric Bir iyileştirme önerilmiş
!model Harcama tablom: bir satır bir alışveriş, sütunlar tarih (tarih), kategori (metin), tutar (sayı), kart veya nakit (metin). İyileştirme: tutarlar şu anda "35$" şeklinde yazılı, bu yüzden "$" işaretini kaldırıp birimi "Tutar, USD" başlığına yazacağım ki toplanabilsin.

# data-02 | Veriler nasıl düzenlenir | Temiz veri
## Tipik dağınıklık
Dağınık veriler üzerinde yapılan analiz yanlış sonuçlara götürür. En yaygın sorunlar:
- **yinelenenler** — aynı kayıt iki kez;
- **fazladan boşluklar** ve farklı yazımlar: "İzmir", "izmir", "İzmir ";
- **farklı tarih biçimleri**: aynı sütunda 03/04/2025 ve 2025-04-03;
- **birleştirilmiş hücreler** — sıralamayı ve filtreleri bozarlar;
- **eksik değerler** ve "—", "yok" gibi yer tutucular ya da "veri yok" yerine 0;
- **tek sayfada birkaç tablo** ve verinin ortasında toplamlar.

## Nasıl temizlenir
- Yinelenenleri yerleşik komutla kaldırın (Veri → Yinelenenleri kaldır).
- **TRIM** işlevi fazladan boşlukları kaldırır; **UPPER/LOWER/PROPER** büyük-küçük harfi tutarlı hâle getirir.
- Yeni yazımlar ortaya çıkmasın diye kategoriler için **açılır listeler** (veri doğrulama) kullanın.
- Boş bir değer ile sıfır aynı şey değildir: 0 "sıfır" demektir, boş hücre "bilinmiyor" demektir.
- Özgün veriyi ayrı tutun ve bir kopyayı temizleyin.

!key Dağınık veri: yinelenenler, boşluklar, karışık biçimler, birleştirilmiş hücreler.
!key Sıfır ve boş değer farklı anlamlara gelir.
!key Açılır listeler tutarsız kategorileri önler.
!key Özgün veriyi saklayın ve bir kopyayı temizleyin.

?q:e Sıralamayı ve filtreleri en sık ne bozar?
- Sütun başlıkları
+ Birleştirilmiş hücreler
- Sayısal değerler
- Tek biçimdeki tarihler
= Birleştirilmiş hücreler satır ve sütun ızgarasını bozar.

?q:m "Şehir" sütununda "Ankara", "ankara" ve "Ankara " var. Şehre göre saydığınızda ne olur?
- Her şey doğru sayılır
+ Program bunları farklı şehirler olarak sayabilir
- Tablo fazla satırları siler
- Bir formül hatası görünür
= Büyük-küçük harfi eşitlemeniz ve boşlukları kaldırmanız gerekir.

?q:m "Gelir" sütununda boş hücre sıfırdan nasıl farklıdır?
+ Sıfır, gelir olmadığı anlamına gelir; boş hücre verinin eksik olduğu anlamına gelir
- Fark yoktur
- Boş hücre her zaman sıfır demektir
- Sıfır bir hata demektir
= Eksik değerleri sıfırla değiştirmek ortalamaları ve toplamları çarpıtır.

?q:h Satışları analiz etmeden önce yinelenen siparişler buldunuz. Doğru olan nedir?
- Yinelenenleri özgün dosyadan hemen silip özgün hâli saklamamak
+ Özgün dosyayı saklamak, yinelenenleri bir kopyada bulup kaldırmak ve kaç satırın silindiğini kontrol etmek
- Yinelenenleri bırakmak — pek önemli değiller
- Tutarı tekrar eden tüm satırları silmek
= Özgün dosya sizin güvenlik ağınızdır; aynı tutar mutlaka yinelenen olduğu anlamına gelmez.

?r:m TRIM işlevi ne yapar?
- Boş satırları kaldırır
+ Metindeki fazladan boşlukları kaldırır
- Metni sayıya dönüştürür
- Yinelenenleri kaldırır
= Değerleri tutarlı hâle getirmeye yardım eder.

?r:e Kategorilerin tutarsız yazımını nasıl önlersiniz?
+ Açılır liste kullanarak
- Büyük harfle yazarak
- Hücreleri birleştirerek
- Sütunu silerek
= Liste, girilebilecekleri sınırlar.

!open İş tablolarında karşılaştığınız (veya karşılaşabileceğiniz) üç veri sorununu ve bunları nasıl düzelteceğinizi anlatın.
!rubric Üç belirli sorun
!rubric Her biri için bir çözüm
!rubric Bir kopya üzerinde çalışmaktan veya sonucu kontrol etmekten söz edilmiş
!model 1) Farklı biçimlerdeki tarihler — hepsini tek bir tarih biçimine çevirip sıralamanın zamana göre gittiğini kontrol ederim. 2) Fazladan boşluklu ürün adları — TRIM uygularım. 3) Dışa aktarma sonrası yinelenen siparişler — bir kopyada "Yinelenenleri kaldır" ile siliyorum ve öncesi ile sonrasındaki satır sayısını karşılaştırıyorum.

# data-03 | Formüller | Formüller ve başvurular
## Bir formül nasıl çalışır
Bir formül **=** işaretiyle başlar. Örneğin `=B2*C2`, B2 ve C2 hücrelerindeki değerleri çarpar. Kaynak sayılar değişirse sonuç kendiliğinden yeniden hesaplanır — elektronik tabloların gücü budur.

Temel işlevler:
- **SUM** — toplam: `=SUM(D2:D100)`;
- **AVERAGE** — ortalama;
- **COUNT** — kaç hücrede sayı var; **COUNTA** — kaçı boş değil;
- **MIN / MAX**.

Excel'in yerelleştirilmiş sürümlerinde işlev adları çevrilmiş olabilir ve bazı bölgesel ayarlarda bağımsız değişkenler virgül yerine noktalı virgülle ayrılır: `=IF(A2>0;1;0)`.

## Göreli ve mutlak başvurular
Bir formülü aşağı kopyaladığınızda başvurular **kayar**: sonraki satırda `=B2*C2` olan formül `=B3*C3` olur. Bunlar **göreli** başvurulardır.

Bir başvuru yerinde kalmalıysa (örneğin F1 hücresindeki döviz kuru), onu dolar işaretleriyle kilitlersiniz: `=B2*$F$1`. Bu bir **mutlak** başvurudur. Excel'de F4 tuşu başvuru türünü değiştirir.

!key Bir formül "=" ile başlar ve veriler değişince yeniden hesaplanır.
!key SUM, AVERAGE, COUNT, MIN, MAX temel işlevlerdir.
!key Göreli başvurular, formül kopyalanınca kayar.
!key $F$1 bir mutlak başvurudur — kaymaz.

?q:e Bir formül hangi karakterle başlar?
- #
+ =
- $
- *
= Eşittir işareti, programa bir formülün geldiğini bildirir.

?q:m =B2*C2 formülü bir satır aşağı kopyalandı. Ne elde edersiniz?
- =B2*C2
+ =B3*C3
- =C2*D2
- Bir hata
= Göreli başvurular formülle birlikte kayar.

?q:m Dolar kuru F1 hücresinde. B2'deki tutarı çevirmek için hangi formül aşağı doğru doğru kopyalanır?
- =B2*F1
+ =B2*$F$1
- =$B$2*F1
- =B2+F1
= Kura yapılan başvuru dolar işaretleriyle kilitlenmelidir.

?q:h COUNT ile COUNTA nasıl farklıdır?
+ COUNT sayı içeren hücreleri sayar, COUNTA boş olmayan tüm hücreleri sayar
- Aynıdırlar
- COUNTA yalnızca boş hücreleri sayar
- COUNT değerleri toplar
= Aralıkta metin varsa sonuçlar farklı olur.

?r:m $F$1 içindeki dolar işaretleri ne anlama gelir?
- Hücrede para olduğu
+ Başvurunun mutlak olduğu ve kopyalanınca kaymadığı
- Hücrenin parolayla korunduğu
- Formülde bir hata olduğu
= Dolar işareti hem sütunu hem satırı kilitler.

?r:e Hangi işlev ortalamayı bulur?
- SUM
+ AVERAGE
- COUNT
- MAX
= AVERAGE, toplamı sayıların adedine böler.

!open "Fiyat" (B) ve "Adet" (C) sütunlarınız ve F1 hücresinde bir indirim oranınız var. 2. satırdaki indirimli toplam için aşağı kopyalanabilen bir formül yazın ve başvuru seçimlerinizi açıklayın.
!rubric Formül doğru
!rubric İndirim mutlak başvuruyla kilitlenmiş
!rubric B2 ve C2'nin neden göreli olduğu açıklanmış
!model =B2*C2*(1-$F$1). B2 ve C2 göreli — aşağı kopyalanınca her satır için B3, C3 vb. olurlar. İndirim oranı herkes için aynı, bu yüzden $F$1 kilitli ve kaymıyor.

# data-04 | Formüller | Koşullar: IF ve koşula göre sayma
## IF işlevi
**IF**, bir koşula göre sonuç seçer: `=IF(koşul, doğruysa_değer, yanlışsa_değer)`.

Örnek: `=IF(D2>=100000,"Büyük","Normal")`, 100.000 veya daha fazla olan siparişleri büyük olarak etiketler.

Koşullar karşılaştırmalardan oluşur: `>`, `<`, `>=`, `<=`, `=`, `<>` (eşit değil). Birkaç koşul **AND** ve **OR** ile birleştirilir: `=IF(AND(D2>0,E2="İzmir"),1,0)`.

## Koşula göre sayma ve toplama
- **COUNTIF** — kaç hücre bir koşulu karşılıyor: `=COUNTIF(E2:E100,"İzmir")`.
- **SUMIF** — koşula göre toplam: `=SUMIF(E2:E100,"İzmir",D2:D100)` — yalnızca İzmir'in geliri.
- Birkaç koşul için **COUNTIFS** ve **SUMIFS** vardır.

İç içe geçmiş uzun IF zincirlerini okumak zordur. Birçok seçenek varsa ayrı bir arama tablosu kurup onda aramak daha iyidir — bu bir sonraki ders.

!key IF(koşul, doğruysa, yanlışsa) koşula göre bir sonuç seçer.
!key AND / OR birkaç koşulu birleştirir.
!key COUNTIF ve SUMIF koşula göre sayar ve toplar.
!key Çok sayıda iç içe IF, bir arama tablosuna ihtiyaç olduğunun işaretidir.

?q:e =IF(5>3,"evet","hayır") ne döndürür?
+ "evet"
- "hayır"
- 5
- Bir hata
= 5>3 koşulu doğrudur, bu yüzden ikinci bağımsız değişken döndürülür.

?q:m E2:E100 aralığındaki İzmir siparişlerini hangi formül sayar?
- =SUM(E2:E100,"İzmir")
+ =COUNTIF(E2:E100,"İzmir")
- =IF(E2:E100="İzmir")
- =AVERAGE(E2:E100)
= COUNTIF, koşulu karşılayan hücreleri sayar.

?q:m Bir formülde "eşit değil" nasıl yazılır?
- !=
- ><
+ <>
- =/
= Elektronik tablolarda "eşit değil" <> olarak yazılır.

?q:h Yalnızca Mart ayı İzmir gelirine ihtiyacınız var; şehir E'de, ay F'de, gelir D'de. Hangi işlev en uygun?
- Tek koşullu SUMIF
- Toplamsız IF
+ İki koşullu SUMIFS
- COUNTIF
= SUMIFS aynı anda birkaç koşula göre toplar.

?r:m SUMIF ne yapar?
- Hücreleri sayar
+ Bir koşulu karşılayan değerleri toplar
- Maksimumu bulur
- Satırları koşula göre siler
= Örneğin yalnızca bir şehrin geliri.

?r:e İkisinin de doğru olması gereken iki koşulu nasıl birleştirirsiniz?
+ AND işleviyle
- OR işleviyle
- Bir dolar işaretiyle
- SUM işleviyle
= AND, yalnızca tüm koşullar sağlanırsa DOĞRU döndürür.

!open İşinizden veya günlük hayatınızdan IF veya SUMIF'in yardımcı olacağı bir görev düşünün ve formülü yazın.
!rubric Görev anlatılmış
!rubric Formül makul
!rubric Formülün ne döndürdüğü açıklanmış
!model Harcama tablomda kategori B'de, tutar C'de. Market alışverişine ne kadar gittiğini öğrenmek için =SUMIF(B2:B200,"Market",C2:C200) yazıyorum. Yalnızca kategorisi "Market" olan satırlardaki tutarları toplar.

# data-05 | Formüller | Değer arama: VLOOKUP ve XLOOKUP
## Neden arama yapılır
Veriler çoğu zaman farklı tablolarda bulunur: birinde siparişler ve ürün kodları, diğerinde fiyatların olduğu bir başvuru listesi. Arama işlevleri, bir anahtara göre doğru değeri getirir.

## VLOOKUP ve XLOOKUP
**VLOOKUP**, bir değeri bir aralığın ilk sütununda arar ve aynı satırdaki belirtilen sütundan değeri döndürür:
`=VLOOKUP(A2,Prices!A:C,3,FALSE)`

Son bağımsız değişken olan **FALSE** tam eşleşme anlamına gelir — neredeyse her zaman gerekir. Onsuz VLOOKUP "en yakın" değeri döndürüp sessizce yanlış sonuç verebilir.

VLOOKUP'ın sınırları: yalnızca ilk sütunda ve yalnızca sağa doğru arar, yeni bir sütun eklerseniz sütun numarası bozulur.

Yeni Excel sürümlerindeki ve Google Sheets'teki **XLOOKUP** daha kullanışlıdır: `=XLOOKUP(A2,Prices!A:A,Prices!C:C)` — nerede aranacağını ve neyin döndürüleceğini ayrı ayrı söylersiniz; tam eşleşme varsayılandır. Klasik alternatif **INDEX + MATCH** ikilisidir.

## Anahtar benzersiz olmalıdır
Aynı kod başvuru tablosunda iki kez geçerse işlev ilk eşleşmeyi döndürür — ve hatayı fark etmezsiniz. Anahtarların benzersizliğini kontrol edin.

!key Arama işlevleri, başka bir tablodan bir anahtara göre değer getirir.
!key VLOOKUP'ta FALSE (tam eşleşme) kullanın.
!key XLOOKUP daha kullanışlıdır: "nerede aranacak" ve "ne döndürülecek" ayrıdır.
!key Başvuru tablosundaki anahtar benzersiz olmalıdır.

?q:e VLOOKUP ne işe yarar?
- Bir sütunu toplamaya
+ Başka bir tabloda bir anahtara göre değer bulmaya
- Grafik oluşturmaya
- Yinelenenleri kaldırmaya
= VLOOKUP, bir başvuru tablosundan veri getirir.

?q:m VLOOKUP'ın son bağımsız değişkeni olarak FALSE ne anlama gelir?
- Formülün kapatıldığı
+ Anahtarın tam eşleşmesinin gerektiği
- Sonucun metin olacağı
- Aramanın aşağıdan yukarıya gideceği
= Tam eşleşme olmadan VLOOKUP yanlış bir değer döndürebilir.

?q:m XLOOKUP, VLOOKUP'tan nasıl daha kullanışlıdır?
+ Nerede aranacağını ve neyin döndürüleceğini ayrı belirtirsiniz ve sola da bakabilir
- Yalnızca metinle çalışır
- Daha hızlı yazılır
- Anahtara ihtiyaç duymaz
= Sütun numarası gerekmez, bu yüzden sütun eklemek hiçbir şeyi bozmaz.

?q:h VLOOKUP fiyatları döndürüyor ama bazıları yanlış. Başvuru tablosunda bazı kodların farklı fiyatlı iki satırı var. Ne oluyor?
- İşlev ortalama fiyatı seçer
+ İşlev bulduğu ilk eşleşmeyi alır, bu yüzden anahtar benzersiz olmalıdır
- İşlev bu kodlar için hata döndürür
- İşlev son eşleşmeyi alır
= Benzersiz olmayan anahtarlar sessiz hatalara yol açar.

?r:m Hangi işlev çifti VLOOKUP'ın klasik alternatifidir?
- SUM + COUNT
+ INDEX + MATCH
- IF + AND
- MIN + MAX
= MATCH satırı bulur, INDEX değeri döndürür.

?r:e Bir başvuru tablosundaki anahtar nasıl olmalıdır?
+ Benzersiz
- Uzun
- Her zaman bir sayı
- Büyük harflerle yazılmış
= Aksi hâlde arama, birkaç eşleşmenin ilkini döndürür.

!open Çalışan kodu içeren bir sipariş tablonuz ve ayrı bir "kod — ad — departman" başvuru tablonuz var. Her çalışanın departmanını siparişlere nasıl ekleyeceğinizi ve neyi kontrol edeceğinizi anlatın.
!rubric Bir arama işlevi belirtilmiş
!rubric Tam eşleşme belirtilmiş
!rubric Anahtar benzersizliğinin veya hataların kontrolünden söz edilmiş
!model Sipariş tablosuna =XLOOKUP(B2,Staff!A:A,Staff!C:C) ile bir "Departman" sütunu ekleyeceğim; burada B çalışan kodu. Öncesinde başvuru tablosundaki kodların tekrar etmediğini kontrol edeceğim, sonrasında da #N/A hatalarını arayacağım: bunlar başvuru tablosunda eksik olan kodlardır.

# data-06 | Analiz | Sıralama, filtreler ve pivot tablolar
## Sıralama ve filtreler
**Sıralama** satırları düzenler: gelire göre azalan, tarihe göre. Tablonun tamamını seçin; aksi hâlde tek bir sütunu sıralayıp satırlar arasındaki verileri karıştırabilirsiniz.

Bir **filtre**, bir koşulu karşılamayan satırları geçici olarak gizler — örneğin yalnızca bir bölgeyi gösterir. Veriler silinmez.

## Pivot tablolar
Bir **pivot tablo**, binlerce satırı bir dakikada kısa bir rapora dönüştürür. Alanları dört bölgeye sürüklersiniz:
- **Satırlar** — neye göre gruplanacak (örneğin satış temsilcisi);
- **Sütunlar** — ikinci bir boyut (örneğin ay);
- **Değerler** — ne hesaplanacak: toplam, adet, ortalama;
- **Filtreler** — raporu sınırlama (örneğin yalnızca 2025).

Bir pivot tablo yalnızca düzenli veride çalışır: ilk satırda başlıklar, ortada birleştirilmiş hücre veya boş satır yok. Kaynak veriler değiştikten sonra pivot tablo **yenilenmelidir**.

!key Tek bir sütunu değil, tablonun tamamını sıralayın.
!key Bir filtre satırları gizler ama silmez.
!key Bir pivot tabloda satırlar, sütunlar, değerler ve filtreler vardır.
!key Kaynak veriler değiştikten sonra pivot tabloyu yenileyin.

?q:e Bir filtre ne yapar?
- Fazla satırları kalıcı olarak siler
+ Bir koşulu karşılamayan satırları geçici olarak gizler
- Alfabetik sıralar
- Hücreleri birleştirir
= Gizli satırlar tabloda kalır.

?q:m Yalnızca seçilen tek bir sütunu sıralamak neden tehlikelidir?
+ Değerleri diğer sütunlara göre karışır ve kayıtlar "kopar"
- Sıralama çalışmaz
- Tablo küçülür
- Yalnızca tarihler için tehlikelidir
= Bir satır bütün bir kayıt olarak kalmalıdır.

?q:m Satış temsilcisine göre geliri ay ay görmek istiyorsunuz. Pivot tablonun "Değerler" alanına ne girer?
- Satış temsilcisi
- Ay
+ Gelir toplamı
- Bölge
= Değerler, hesaplanan şeydir.

?q:h Kaynak tabloya yeni satışlar eklediniz ama pivot tablo eski toplamları gösteriyor. Sorun ne?
- Pivot tablolar yeni veriyi işleyemez
+ Pivot tablonun yenilenmesi ve aralığının yeni satırları içermesi gerekir
- Pivotu silip raporu elle kurmalısınız
- Yeni satışlar yanlış girilmiş
= Bir pivot tablo, formüller gibi kendiliğinden yeniden hesaplanmaz.

?r:m Bir pivot tablonun dört bölgesi nedir?
+ Satırlar, sütunlar, değerler, filtreler
- Başlık, metin, altyazı, toplam
- Hücreler, sayfalar, çalışma kitapları, dosyalar
- Toplam, ortalama, minimum, maksimum
= Alanlar bu bölgelere yerleştirilir.

?r:e Bir pivot tablo ne tür veriye ihtiyaç duyar?
- Herhangi bir, birleştirilmiş hücreler olsa bile
+ Düzenli: ilk satırda başlıklar, birleştirilmiş hücre yok
- Yalnızca metin
- Yalnızca tek bir sütun
= Düzenli veri, her analizin temelidir.

!open Kendi verilerinizden bir pivot tabloyla kurabileceğiniz bir rapor anlatın: satırlara, sütunlara, değerlere ve filtreye ne girer ve hangi soruya yanıt verir.
!rubric Tüm bölgeler belirtilmiş
!rubric Raporun yanıtladığı soru belirtilmiş
!rubric Veriler gerçekçi
!model Veriler, yıllık harcamalarım. Satırlar — kategori, sütunlar — ay, değerler — harcama toplamı, filtre — yalnızca kart. Rapor, hangi aylarda ve hangi kategorilerde en çok harcadığım sorusunu yanıtlıyor.

# data-07 | Analiz | Ortalama, medyan ve yüzdeler
## Ortalama ve medyan
**Ortalama**, toplamın adede bölünmesidir. **Medyan**, her şey sıralandığında ortadaki değerdir. Verilerde **aykırı değerler** (çok büyük veya küçük değerler) olduğunda ortalama çok kayar ama medyan kaymaz.

Örnek: beş çalışan 50, 55, 60, 65 ve 500 bin kazanıyor. Ortalama 146 bin; oysa dördü 65 bin veya daha azını kazanıyor. Medyan 60 bin ve tipik bir çalışanı daha iyi anlatıyor. Elektronik tablolarda: **MEDIAN**.

## Yüzdeler ve yüzde puanları
- 200'den 250'ye artış **%25**'tir: (250 − 200) / 200.
- Dönüşüm oranı %2'den %3'e çıktıysa bu **1 yüzde puanlık** bir artıştır, ama göreli olarak **%50**'dir. Bunları karıştırmak raporlarda sık yapılan bir hatadır.
- Küçük bir tabanın yüzdesi yanıltıcıdır: "%100 artış", bir siparişin yerine 2 sipariş anlamına gelebilir.

!key Aykırı değerler olduğunda medyan, ortalamadan daha dayanıklıdır.
!key Yüzde değişim = (yeni − eski) / eski.
!key Yüzde puanı, yüzdelerin farkıdır; yüzdeyle karıştırmayın.
!key Tabana bakın: küçük bir sayının büyük yüzdesi pek bir şey ifade etmez.

?q:e Medyan nedir?
- Tüm değerlerin toplamı
+ Sıralanmış bir listenin ortadaki değeri
- En sık görülen değer
- Maksimum ile minimum arasındaki fark
= Değerlerin yarısı medyanın altında, yarısı üstündedir.

?q:m Maaşlar: 40, 45, 50, 55 ve 400 bin. Hangi ölçü tipik bir maaşı daha iyi anlatır?
- Ortalama — 118 bin
+ Medyan — 50 bin
- Maksimum — 400 bin
- Toplam — 590 bin
= 400 binlik aykırı değer ortalamayı çok yukarı çeker.

?q:m Gelir 160 binden 200 bine çıktı. Yüzde kaç arttı?
- %20
+ %25
- %40
- %80
= (200 − 160) / 160 = 0,25.

?q:h İade oranı %8'den %6'ya düştü. Değişimi doğru nasıl anlatırsınız?
- Göreli olarak %2
+ 2 yüzde puanı veya önceki düzeye göre %25
- %6
- 33 yüzde puanı
= 8 − 6 = 2 yp; 2 / 8 = %25.

?r:m Ortalama neden yanıltıcı olabilir?
+ Aykırı değerler onu çok kaydırır
- Her zaman medyandan düşüktür
- Elektronik tabloda hesaplanamaz
- Yalnızca tarihler için işe yarar
= Böyle durumlarda medyana bakın.

?r:e Yüzde değişim nasıl hesaplanır?
- Yeni eksi eski
+ (Yeni − eski) / eski
- Yeni / 100
- Eski / yeni
= Değişimi başlangıç değerine bölün.

!open Haberlerden veya bir iş raporundan yüzdeler içeren bir cümle bulup kontrol edin: yüzde ve yüzde puanı doğru kullanılmış mı, taban fazla küçük mü?
!rubric Bir cümle veya örnek verilmiş
!rubric Yüzde veya yp kontrol edilmiş
!rubric Taban değerlendirilmiş
!model Bir raporda "çevrimiçi satışların payı %5 arttı" yazıyor: önceden %20'ydi, şimdi %25. Doğrusu 5 yüzde puanı veya önceki paya göre %25. Taban iyi — ayda binlerce sipariş — dolayısıyla değişim anlamlı.

# data-08 | Analiz | Yalan söylemeyen grafikler
## Grafik seçimi
- **Çizgi** — zaman içindeki değişimler: aylık gelir.
- **Çubuk/sütun** — kategorileri karşılaştırma: bölgelere göre satışlar. Uzun etiketler yatay çubuklara daha iyi sığar.
- **Pasta grafik** — bir bütünün parçaları ve yalnızca az parça olduğunda (4–5'e kadar). Açıları karşılaştırmak zordur, bu yüzden çoğu zaman çubuklar daha iyidir.
- **Dağılım (saçılım)** — iki sayısal ölçü arasındaki ilişki: fiyat ve satış adedi.

## Dürüstlük
- Çubuklar **sıfırdan** başlamalıdır: kesilmiş bir eksen %3'lük artışı "sıçramaya" dönüştürür.
- Farklı uzunluktaki dönemleri söylemeden karşılaştırmayın.
- Eksenleri ve birimleri etiketleyin, kaynağı ve dönemi belirtin.
- Bir grafik — bir mesaj. Ana şeyi renkle vurgulayın, geri kalanı gri yapın.

## Kurs özeti
Düzenli tablo → temiz veri → formüller ve aramalar → pivot tablo → doğru yüzdeler → dürüst bir grafik. Bu, her meslekte veriyle çalışmanın temel döngüsüdür.

!key Zaman için çizgi, karşılaştırma için çubuk, birkaç parçanın payı için pasta.
!key Çubuklar sıfırdan başlar, yoksa grafik farkı abartır.
!key Eksenleri, birimleri, kaynağı ve dönemi etiketleyin.
!key Bir grafik — bir mesaj, ana şey renkle vurgulanmış.

?q:e Bir yıl boyunca aylık geliri hangi grafik en iyi gösterir?
- Bir pasta grafik
+ Bir çizgi grafik
- Tek sayılı bir tablo
- Etiketsiz bir dağılım grafiği
= Çizgi, zaman içindeki değişimleri iyi gösterir.

?q:m Pasta grafik ne zaman uygundur?
- 15 bölgeyi karşılaştırmak için
+ Az parça olduğunda, bir bütünün parçaları için
- Günlük eğilimler için
- İki ölçü arasındaki ilişki için
= Çok sayıda dilimi karşılaştırmak zordur.

?q:m Ekseni sıfırdan başlamayan bir çubuk grafiğin tehlikesi nedir?
+ Küçük bir fark çok büyük görünür
- Grafik çok genişler
- Etiketler kaybolur
- Yok, bu standarttır
= Bir çubuğun yüksekliği değeriyle orantılı olmalıdır.

?q:h Bir ürünün daha yüksek fiyatla daha kötü satılıp satılmadığını kontrol etmek istiyorsunuz. Hangi grafiği seçersiniz?
- Fiyat paylarının pasta grafiği
+ Fiyata karşı satış adedinin dağılım grafiği
- Yalnızca fiyatın çizgi grafiği
- Alfabetik sıradaki ürün adlarının çubukları
= Dağılım grafiği iki sayısal ölçü arasındaki ilişkiyi gösterir.

?r:m Bir grafikte her zaman nelerin etiketlenmesi gerekir?
+ Eksenler, birimler, kaynak ve dönem
- Yalnızca başlık
- Hiçbiri, her şey ortada
- Yalnızca arka plan rengi
= Bunlar olmadan bir grafiği yanlış okumak kolaydır.

?r:e Hangi kural bir grafiği anlaşılır kılmaya yardım eder?
- Mümkün olduğunca çok renk
+ Bir grafik — bir mesaj
- Her zaman 3D efekti eklemek
- Tüm etiketler küçük yazı tipiyle
= Ana şeyi vurgulayın ve geri kalanı soluklaştırın.

!open Verilerinizden yöneticiniz için hazırlayacağınız bir grafiği anlatın: hangi türden, eksenlerde ne var, neyi vurgulayacaksınız ve iletmesi gereken tek mesaj ne.
!rubric Grafik türü göreve uygun
!rubric Eksenler ve vurgu anlatılmış
!rubric Tek bir mesaj belirtilmiş
!model Yıl için aylık gelirin çizgi grafiğini göstereceğim: yatay eksende aylar, dikey eksende sıfırdan başlayan bin cinsinden gelir. Bu yılın çizgisi renkli, geçen yılınki gri. Mesaj: mayısta teslimatı başlattığımızdan beri gelir sürekli olarak geçen yılın üzerinde.
