---
id: cb-ai-tr
version: 1
title: Yapay Zekâ Okuryazarlığı
description: ChatGPT, Claude veya Gemini gibi sohbet botları nasıl çalışır, onlara ne zaman güvenebilirsiniz, istemler nasıl yazılır ve kendinize ve başkalarına zarar vermekten nasıl kaçınılır. Teknik jargon içermeyen sekiz kısa ders.
goal: Yapay zekâyı çalışmada ve işte güvenle ve emniyetle kullanmak
language: Turkish
minutes: 7
hue: 265
---

# ai-01 | YZ nasıl çalışır | Dil modeli nedir
## Bir sonraki kelimeyi tahmin eden sistem
ChatGPT, Claude veya Gemini gibi sohbet botları **büyük dil modelleri** üzerinde çalışır. Böyle bir model devasa miktarda metinle eğitilmiştir ve tek bir şeyi çok iyi yapar: bir metnin başını görünce devamında en olası olanı tahmin eder. Size yanıt verirken cevabı adım adım, küçük parçalardan — **token'lardan** (kelimeler veya kelime parçaları) — kurar.

Bu basit mekanizmadan olağanüstü yetenekler doğar: özetleme, çeviri, açıklama, kod yazma. Ama modelin "cevabı bir veri tabanında aramadığını" — makul bir devam yazdığını unutmayın.

## Modelin bilmedikleri
Bir modelin **bilgi kesim tarihi** vardır: bundan sonraki olaylar hakkında yalnızca web araması verilirse bulduklarını bilir. Hizmet bilerek saklamadıkça önceki sohbetlerinizi hatırlamaz. Ve kendi deneyimi yoktur — yalnızca metinlerdeki örüntüler vardır.

!key Bir dil modeli metnin bir sonraki parçasını — token'ı — tahmin eder.
!key Cevap bir veri tabanından alınmaz, oluşturulur.
!key Modelin bir bilgi kesim tarihi vardır; yeni olayları yalnızca arama yoluyla öğrenir.
!key Modelin yetenekleri kişisel deneyimden değil, metinlerdeki örüntülerden gelir.

?q:e Büyük bir dil modeli temelde ne yapar?
- Hazır bir cevabı veri tabanında arar
+ Metnin hangi parçasının büyük olasılıkla sonra geleceğini tahmin eder
- Cevapları gerçek zamanlı olarak web sitelerinden kopyalar
- Sizi bir insan uzmana bağlar
= Model metni adım adım, token token oluşturur.

?q:e Token nedir?
- Bir sohbet botuna girmek için kullanılan parola
+ Modelin üzerinde çalıştığı bir metin parçası — bir kelime veya kelimenin parçası
- Bir kripto para ödeme birimi
- Modelin tek bir yanıtı
= Model metni token'larla okur ve yazar.

?q:m Bir model dünün haberlerini neden bilmeyebilir?
+ Web araması yoksa bilgisi, eğitim verisinin kesim tarihiyle sınırlıdır
- Haberleri bilerek saklar
- Haberleri yapay zekâyla konuşmak yasaktır
- Model her dakika güncellenir ve yetişememiştir
= Arama olmadan model dünyayı yalnızca eğitildiği andaki hâliyle bilir.

?q:h Bir sohbet botu hakkında hangi ifade en doğrudur?
- Dünyayı deneyimli bir insan gibi anlar
- Kaynaklarını her zaman kelimesi kelimesine alıntılar
+ Metinlerdeki örüntülerden makul bir cevap oluşturur
- Her kullanıcının her sohbetini hatırlar
= Bu, modellerin hem güçlü yanlarını hem de hatalarını açıklar.

?r:m Model sorunuza cevabı nereden alır?
- Önceden kaydedilmiş cevaplardan
+ Metnin nasıl devam edeceğini tahmin ederek oluşturur
- Wikipedia'dan indirir
- Geliştiriciler elle sağlar
= Cevap üretilir, getirilmez.

?r:e Modelin son olaylar hakkındaki bilgisini ne sınırlar?
+ Bilgi kesim tarihi
- Ekran boyutu
- İstemin dili
- Günün saati
= Bu tarihten sonra model yalnızca arama yoluyla bulduklarını bilir.

!open Bir arkadaşınıza sohbet botunun nasıl çalıştığını ve neden sözüne körü körüne inanılmaması gerektiğini 3–4 cümleyle anlatın.
!rubric Bir sonraki metnin tahmin edilmesinden söz edilmiş
!rubric Cevabın oluşturulduğu açıklanmış
!rubric Kontrol etmeyle ilgili bir sonuç var
!model Sohbet botu, çok büyük miktarda metin okumuş ve hangi kelimelerin sonra gelmesi gerektiğini tahmin etmeyi öğrenmiş bir programdır. Bir soru sorduğunuzda cevabı bir başvuru kitabında aramaz — makul bir metin yazar. Bu yüzden yanıldığında bile kendinden emin konuşur ve önemli bilgilerin kontrol edilmesi gerekir.

# ai-02 | YZ nasıl çalışır | Halüsinasyonlar ve bilgi doğrulama
## Kendinden emin ama yanlış
Bazen model var olmayan bilgiler üretir: uydurma alıntılar, kitaplar, yasa maddeleri, bağlantılar, rakamlar. Bunlara **halüsinasyon** denir. Nedeni modelin çalışma biçimindedir: makul bir metin oluşturur ve makul olan her zaman doğru değildir. Bu özellikle nadir konularda, kesin sayılarda, tarihlerde ve kaynak göstermelerde sık görülür.

Tehlike, yanlış bir cevabın doğru bir cevap kadar kendinden emin görünmesidir.

## Nasıl kontrol edilir
- Önemli bilgileri birincil kaynakla kontrol edin: resmî bir site, bir belge, bir başvuru kaynağı.
- Modelden kaynak isteyin — ve onları açın. Var olmayan bir bağlantı bir uyarı işaretidir.
- Daha fazla sorgulayın: "ne kadar eminsin?", "karşı argümanlar neler?".
- Riskler (sağlık, para, hukuk, işiniz) arttıkça kontrol daha sıkı olmalıdır. Son kararı bir insan verir.

!key Halüsinasyon, kendinden emin biçimde sunulan uydurma bilgidir.
!key Hatalar en çok nadir konularda, sayılarda, tarihlerde ve bağlantılarda görülür.
!key Önemli bilgileri birincil kaynakla kontrol edin.
!key Riskler arttıkça kontrol sıkılaşır; kararı bir insan verir.

?q:e Model halüsinasyonu nedir?
- Cevap verirken oluşan bir ekran arızası
+ Kendinden emin biçimde sunulan uydurma bilgi
- Başka bir dilde verilen cevap
- Çok uzun bir cevap
= Örneğin var olmayan bir alıntı veya bağlantı.

?q:m Halüsinasyonlar en çok nerede görülür?
- Basit ifadelerin çevirisinde
+ Kesin rakamlarda, tarihlerde, alıntılarda ve kaynak göstermelerde
- Bir selamlamaya verilen cevaplarda
- Yazım hatalarını düzeltmede
= Bunlar, modelin makul biçimde "doldurduğu" ayrıntılardır.

?q:m Model bir araştırmaya bağlantı verdi. Mantıklı olan nedir?
- Raporunuzda hemen alıntılamak
+ Bağlantıyı açıp araştırmanın var olduğunu ve tam olarak bunu söylediğini kontrol etmek
- Aynı modele doğru olup olmadığını sorup cevabına inanmak
- Bağlantıyı silip sonucu tutmak
= Bağlantı birincil kaynakta kontrol edilmelidir.

?q:h Bir yakınınız için ilaç dozunu yapay zekâya soruyorsunuz. Doğru yaklaşım hangisi?
- Cevap kendinden emin görünüyorsa güvenmek
- İki sohbet botuna daha sorup ortalamasını almak
+ Cevabı bir ipucu olarak kullanıp bir doktora, eczacıya veya resmî prospektüse danışmak
- YZ aksini söylediyse prospektüsü yok saymak
= Riskler yüksekken, güvenilir bir kaynağa dayanarak bir insan karar verir.

?r:m Modeller neden halüsinasyon görür?
+ Makul metin oluştururlar ve makul olan her zaman doğru değildir
- Bilerek aldatmak için eğitilmişlerdir
- İnternet bağlantısı yavaş olduğu için
- Soru kibarca sorulduğu için
= Bu, modelin çalışma biçiminin kendisinden kaynaklanır.

?r:e Bir YZ cevabındaki önemli bilgilerle ne yapmalısınız?
- Ezberlemek
+ Birincil kaynakla kontrol etmek
- Arkadaşlara iletmek
- Hiçbir şey, YZ hata yapmaz
= Birincil kaynak, kontrolün ana yoludur.

!open Herhangi bir sohbet botuna mesleğinizden veya şehrinizden az bilinen bir bilgiyi sorun. Cevabı nasıl kontrol edeceksiniz? Adımları anlatın.
!rubric Somut kontrol adımları belirtilmiş
!rubric Birincil kaynaktan söz edilmiş
!rubric Kendinden emin bir tonun garanti olmadığı fark edilmiş
!model Yerel müzemizin hangi yıl kurulduğunu soracağım. Sonra müzenin resmî sitesini ve şehir rehberindeki sayfasını bulup yılı ve kurucunun adını karşılaştıracağım. Kaynaklar modelle çelişirse kaynaklara güvenirim: kendinden emin bir ton hiçbir şeyi garanti etmez.

# ai-03 | İyi istemler | İstem nasıl yazılır
## Dört unsur
Model aklınızdan geçeni okuyamaz: cevabın kalitesi büyük ölçüde isteme bağlıdır. İyi bir istem genellikle şunları içerir:
1. **Bağlam** — siz kimsiniz, ne için, zaten ne biliniyor.
2. **Görev** — tam olarak ne yapılacak: açıkla, kısalt, karşılaştır, bir şey bul.
3. **Biçim** — bir liste, bir tablo, bir mektup, 5 madde, en fazla 100 kelime.
4. **Kısıtlar ve ölçütler** — ton, hedef kitle, nelerden kaçınılacağı.

## Önce ve sonra
Zayıf: "Zaman yönetimi hakkında yaz."

Daha iyi: "5 tasarımcıdan oluşan bir ekibi yönetiyorum ve teslim tarihlerini sürekli kaçırıyoruz. Haftalık planlamaya dair her biri 2–3 cümlelik 5 somut uygulama öner; 'daha düzenli ol' gibi genel öğütler olmasın."

**Örnekler** de yardımcı olur: istediğiniz cevabın bir örneğini gösterin, model de üslubunu ve yapısını eşleştirir.

!key İyi bir istem: bağlam, görev, biçim, kısıtlar.
!key Görev ne kadar belirliyse cevap o kadar yararlıdır.
!key Biçimi ve uzunluğu açıkça belirtin.
!key İstenen cevabın bir örneği, modelin üslubu yakalamasına yardımcı olur.

?q:e Hangi istemin daha yararlı bir cevap vermesi olasıdır?
- "Bana özgeçmişlerden bahset"
+ "Bir bankaya başvuran junior analistim. Deneyim bölümü için her birinde sayılarla bir sonuç bulunan 3 güçlü madde öner"
- "Özgeçmiş"
- "Yardım"
= Bağlam, görev ve biçim içeriyor.

?q:m Bunlardan hangisi "biçim" unsurudur?
- "Matematik öğretmeniyim"
+ "Cevabı üç sütunlu bir tablo olarak ver"
- "Kesirlerin ne olduğunu açıkla"
- "Bunu yarınki ders için istiyorum"
= Biçim, cevabın nasıl görünmesi gerektiğidir.

?q:m Bir isteme neden istenen cevabın bir örneği eklenir?
- Model onu değiştirmeden kopyalasın diye
+ İhtiyacınız olan üslubu, yapıyı ve ayrıntı düzeyini göstermek için
- Bir örnek yalnızca modeli karıştırır
- Cevap daha kısa olsun diye
= Bir örnek, hedefi herhangi bir tanımdan daha kesin belirler.

?q:h Pazarlama hakkında fazla genel bir cevap aldınız. İstemde önce neyi değiştirmelisiniz?
- Aynı şeyi büyük harflerle yazmak
+ Bağlam eklemek: ürün, hedef kitle, bütçe ve neleri denediğiniz
- Daha hızlı cevap vermesini istemek
- İstemin dilini değiştirmek
= Genel bir cevap genellikle bağlamsız genel bir istemden gelir.

?r:m İyi bir istemi oluşturan dört unsur hangileridir?
+ Bağlam, görev, biçim, kısıtlar
- Selamlama, soru, teşekkür, imza
- Konu, anahtar kelimeler, hashtag'ler, emojiler
- Uzunluk, yazı tipi, renk, dil
= Bu unsurlar cevabı yararlı kılar.

?r:e İstem nedir?
- Modelin cevabı
+ Modele yazdığınız istek
- Modelin adı
- Bir ekran ayarı
= İstem, sizin isteğinizdir.

!open "Bir sunumda yardım et" gibi zayıf bir istemi, dört unsuru kullanarak kendi gerçek bir göreviniz için güçlü bir isteme dönüştürün.
!rubric Bağlam var
!rubric Görev belirli
!rubric Biçim ve kısıtlar belirtilmiş
!model Bir ürün yöneticisiyim ve cuma günü yönetime üç aylık sonuçları sunacağım: gelir %12 arttı ama müşteri kaybı da arttı. Her slayt için bir başlık ve 2–3 ana maddeyle 8 slaytlık bir taslak hazırla. İş tonu, jargon yok; müşteri kaybı konusunda ne yaptığımıza dair ayrı bir slayt olsun.

# ai-04 | İyi istemler | Diyalog ve yineleme
## İlk cevap bir taslaktır
En iyi sonuç nadiren ilk denemede gelir. Cevabı bir **taslak** olarak görün ve sohbet içinde geliştirin: "daha kısa", "daha basit, yeni başlayan biri için", "perakende sektöründen bir örnek ekle", "üçüncü maddeyi çıkar".

Yararlı teknikler:
- **Birkaç seçenek** isteyin: "bana 3 farklı başlık ver" — sonra seçin veya birleştirin.
- Modelden **size sorular sormasını** isteyin: "yazmadan önce neyin eksik olduğunu sor".
- **Eleştiri** isteyin: "bu planın zayıf noktalarını bul" veya "bir şüpheci ne itiraz ederdi?".

## Büyük görevleri parçalayın
Karmaşık bir görevi adım adım yapmak daha iyidir: önce yapı, sonra her bölüm, sonra bir kontrol. Bu, kaliteyi kontrol etmeyi ve rotayı zamanında düzeltmeyi kolaylaştırır.

Sohbet tıkanır ve model aynı hataları tekrarlarsa, bazen geliştirilmiş bir istemle yeni bir sohbet başlatmak daha hızlıdır.

!key İlk cevap bir taslaktır; sohbet içinde geliştirin.
!key Seçenekler, netleştirici sorular ve eleştiri isteyin.
!key Büyük görevleri adımlarla yapın: yapı → bölümler → kontrol.
!key Sohbet tıkanırsa daha iyi bir istemle yeniden başlayın.

?q:e Modelin ilk cevabına nasıl yaklaşmalısınız?
+ Geliştirilebilecek bir taslak olarak
- Nihai sonuç olarak
- Mükemmel değilse bir hata olarak
- Değiştirilemeyecek bir cevap olarak
= Sohbet içinde geliştirmek, işin olağan bir parçasıdır.

?q:m Hangi istek bir metindeki zayıf noktaları bulmaya yardım eder?
- "Daha iyi yap"
+ "Bir şüpheci bu plana ne itiraz ederdi?"
- "Aynısını yeniden yaz"
- "Teşekkürler, her şey iyi"
= Eleştiri istemek zayıflıkları ortaya çıkarır.

?q:m Modelden cevap vermeden önce size soru sormasını neden istersiniz?
- Zaman kazanmak için
+ Eksik bağlamı öğrenip daha kesin cevap vermesi için
- Nazik bir formalitedir
- Cevap daha kısa olsun diye
= Model, hangi bilgiye ihtiyacı olduğunu gösterir.

?q:h 10 sayfalık bir rapora ihtiyacınız var. Hangi yaklaşım daha güvenilir?
- Tüm raporu tek mesajda isteyip hemen göndermek
+ Önce yapıyı kararlaştırmak, sonra bölümleri tek tek yazdırmak ve sonunda kontrol etmek
- On farklı rapor isteyip birini rastgele seçmek
- Tek satırlık bir istem yazmak
= Adım adım çalışmak kalite üzerinde kontrol sağlar.

?r:m Model sohbette aynı hatayı tekrarlayıp duruyorsa ne yapmalısınız?
- Aynı isteği daha yüksek sesle tekrarlamak
+ Geliştirilmiş bir istemle yeni bir sohbet başlatmak
- Uygulamayı silmek
- Hatayı kabul etmek
= Taze bir bağlam çoğu zaman sorunu çözer.

?r:e Aralarından seçmek için birkaç fikri nasıl alırsınız?
+ Birkaç farklı seçenek isteyerek
- Tek bir mükemmel seçenek isteyerek
- Bağlamsız bir soru sorarak
- Hiçbir şey istemeyerek
= Seçenekler karşılaştırılabilir ve birleştirilebilir.

!open Gecikmiş bir sipariş için bir müşteriye özür e-postası hazırlamak üzere bir yapay zekâyla sohbeti nasıl yürüteceğinizi anlatın. Hangi adımları ve düzeltmeleri yaparsınız?
!rubric Bağlamlı bir ilk istem var
!rubric En az iki düzeltme var
!rubric Son bir insan kontrolü var
!model Önce bağlam vereceğim: sipariş bir tedarikçi yüzünden 5 gün gecikti, müşteri düzenli bir müşteri, ilişkiyi korumak istiyorum. E-postanın 2 sürümünü isteyeceğim. Sonra: "ikincisini daha kısa ve daha sıcak yap", "tazminat ekle — sonraki siparişte %10 indirim". Göndermeden önce sonunda tarihleri, tutarı ve müşterinin adını kendim kontrol edeceğim.

# ai-05 | Güvenlik ve sorumluluk | Veriler ve gizlilik
## Ne gönderiyorsunuz
Bir sohbet botuna yazdığınız her şey şirketin sunucularına gider. Hizmete ve plana bağlı olarak konuşmalar saklanabilir, kalite kontrolü için incelenebilir veya gelecekteki modelleri eğitmek için kullanılabilir. Bu özellikle **ücretsiz planlarda** yaygındır — koşulları okumaya değer.

## Neler gönderilmemeli
- parolalar, SMS kodları, banka kartı bilgileri;
- başkalarının rızası olmadan kişisel verileri: kimlik numaraları, adresler, tıbbi bilgiler;
- şirketin onaylı bir YZ hizmeti yoksa işvereninizin gizli belgeleri.

## Daha güvenli çalışma yolları
- Anonimleştirin: adları ve sayıları "Müşteri A", "X tutarı" ile değiştirin.
- Şirketinizin kurallarını öğrenin: birçoğu yalnızca YZ hizmetlerinin kurumsal sürümlerine izin verir.
- Hizmet ayarlarını kontrol edin: sohbetlerinizin eğitimde kullanılmasını çoğu zaman kapatabilirsiniz.

!key Bir sohbet botuna yazdığınız her şey şirketin sunucularına gider.
!key Ücretsiz planlar konuşmaları eğitim için daha sık kullanır — koşulları okuyun.
!key Parolaları, ödeme bilgilerini veya başkalarının kişisel verilerini göndermeyin.
!key Verileri anonimleştirin ve işvereninizin kurallarına uyun.

?q:e Bunlardan hangisi bir sohbet botuna asla gönderilmemelidir?
- Bir dilbilgisi sorusu
+ Bir ödemeyi onaylamak için gelen SMS kodu
- Bir kediye isim bulma isteği
- Kendi herkese açık paylaşımınızın metni
= SMS kodları ve parolalar kimseyle paylaşılmaz.

?q:m Bir müşteri şikâyetini analiz etmek için YZ'den yardım almak istiyorsunuz. Daha güvenli yol hangisi?
- Şikâyeti müşterinin telefonu ve adresiyle birlikte olduğu gibi yapıştırmak
+ Adı, iletişim bilgilerini ve sözleşme numarasını çıkarıp yerlerine yer tutucular koymak
- Müşterinin pasaportunun ekran görüntüsünü göndermek
- Müşteriden sohbet botuna kendisinin yazmasını istemek
= Anonimleştirme anlamı korur ve kişiyi korur.

?q:m Bir YZ hizmetinin ücretsiz planının koşulları neden okunmalı?
+ Ücretsiz plandaki konuşmalar modelleri eğitmek için kullanılabilir
- Ücretsiz plan, her yönüyle ücretliden her zaman daha tehlikelidir
- Koşullar yalnızca avukatlar içindir
- Tüm sorulara cevap içerirler
= Koşullar, verilerinize ne olacağını belirler.

?q:h Şirketinizin kurumsal bir YZ hizmeti var ama kişisel ücretsiz olanınız daha rahat. Dahili rakamlarla bir rapor hazırlıyorsunuz. Doğru olan nedir?
- Daha rahat olduğu için kişisel olanı kullanmak
+ Kuralların gerektirdiği gibi kurumsal hizmeti kullanmak
- Rakamları kişisel olana gönderip sonra sohbeti silmek
- Bir meslektaşınızdan sizin yerinize göndermesini istemek
= Şirketin gizli verileri yalnızca onaylı hizmetlere girer.

?r:m Verileri anonimleştirmek ne demektir?
- Tüm metni silmek
+ Adları, iletişim bilgilerini ve kesin rakamları yer tutucularla değiştirmek
- Metni başka bir dile çevirmek
- Metni yarıya kısaltmak
= Anlam kalır, kişisel ayrıntılar kalmaz.

?r:e Bir sohbet botuna yazdığınız metin nereye gider?
+ Hizmeti sağlayan şirketin sunucularına
- Hiçbir yere, telefonunuzda kalır
- Doğrudan polise
- Herkese açık olarak internete
= Bu yüzden ne gönderdiğiniz önemlidir.

!open YZ'nin size yardımcı olacağı gerçek bir iş veya çalışma görevi seçin. Göndermeden önce bu görevden hangi verileri çıkarmanız veya değiştirmeniz gerekir?
!rubric Görev anlatılmış
!rubric Belirli hassas veriler belirtilmiş
!rubric Anonimleştirme yolu önerilmiş
!model Görev, bir satış tablosunu satış temsilcilerine göre analiz edip düşüşün nedenlerini bulmak. Göndermeden önce temsilcilerin adlarını "Temsilci 1–5" ile değiştireceğim, müşteri adlarını çıkaracağım ve tutarları yuvarlayacağım. Yapıyı ve eğilimleri bırakacağım — analiz için bu yeter.

# ai-06 | Güvenlik ve sorumluluk | YZ nerede güçlü, nerede zayıf
## Güçlü yönler
YZ, metinle çalışmayı içeren ve sonucu kontrol etmesi kolay görevlerde iyidir:
- e-posta, paylaşım, plan taslakları;
- uzun metinleri özetleme ve kısaltma;
- karmaşık şeyleri basit sözlerle, örneklerle açıklama;
- beyin fırtınası: fikirler, isimler, seçenekler;
- çeviri ve üslup düzenleme;
- kod ve formüllerde yardım (kontrol ederek).

## Zayıf noktalar
- **Kesin hesaplamalar**: modeller hesap makinesi veya kod kullanmazsa aritmetikte hata yapabilir.
- Arama erişimi olmadan **son olaylar**.
- **Dar bilgiler**: nadir isimler, alıntılar, belge numaraları.
- **Riski yüksek kararlar**: teşhisler, hukuki ve finansal kararlar — yalnızca bir uzmanın kontrolüyle.

İyi bir kural: YZ'yi **sonucu kontrol etmenin işi sıfırdan yapmaktan daha kolay olduğu** yerde kullanın.

!key YZ taslaklarda, özetlerde, açıklamalarda, fikirlerde ve çeviride güçlüdür.
!key Zayıf noktalar: kesin hesaplamalar, son olaylar, nadir bilgiler.
!key Riski yüksek kararları bir kişi, bir uzmanla birlikte verir.
!key YZ'yi kontrol etmenin sıfırdan yapmaktan kolay olduğu yerde kullanın.

?q:e YZ özellikle hangi görevde iyidir?
+ Meslektaşlara e-posta taslağı yazmak
- Tıbbi teşhis koymak
- Bir sözleşmeyi imzalayıp imzalamamaya karar vermek
- Arama olmadan bugünkü kesin döviz kurunu almak
= Bir taslağı kontrol etmek ve düzeltmek kolaydır.

?q:m Bir modelin hesaplamaları neden iki kez kontrol edilmeli?
- Modeller her zaman yanlış hesaplar
+ Bir model hesap makinesi veya kod kullanmazsa aritmetikte hata yapabilir
- Sohbet botlarında hesaplama yapmak yasaktır
- Cevaplardaki sayılar her zaman yuvarlanır
= Bir dil modeli metni tahmin eder; hesaplamaz.

?q:m Hangi kural YZ kullanıp kullanmayacağınıza karar vermenize yardım eder?
- Her şey için YZ kullanın
- İşte asla YZ kullanmayın
+ Sonucu kontrol etmenin işi sıfırdan yapmaktan kolay olduğu yerde kullanın
- Yalnızca hafta sonları kullanın
= Bu zaman kazandırırken kontrolü sizde tutar.

?q:h Hangi görev, YZ'nin mantıklı kullanımına örnektir?
- YZ'ye hangi krediyi alacağınızı sorup hemen imzalamak
+ YZ'den uzun bir sözleşmeyi sade sözlerle anlatmasını isteyip tartışmalı maddeleri bir avukatla görüşmek
- Bir YZ cevabını kontrol etmeden bilimsel bir makaleye kopyalamak
- Bir tıbbi tedaviyi YZ'ye seçtirmek
= YZ anlamayı hızlandırır; karar bir kişide ve bir uzmanda kalır.

?r:m Bunlardan hangisi modellerin zayıf noktasıdır?
- Metni başka sözcüklerle ifade etme
+ Nadir bilgiler: kesin alıntılar, belge numaraları
- Beyin fırtınası
- Basit sözlerle açıklama
= Model dar bilgileri uydurabilir.

?r:e Riski yüksek kararları kim verir?
+ Gerekirse bir uzmanla birlikte bir kişi
- Model, eğer kendinden eminse
- En hızlı cevap veren
- Hiç kimse
= YZ bir asistandır, sorumlu taraf değil.

!open Haftanızdan üç görev sıralayın: biri YZ'ye devredilmeye değer, biri dikkatle kullanılacak, biri de kullanılmayacak. Nedenini açıklayın.
!rubric Farklı türlerde üç görev
!rubric Kontrol edilebilirliğe veya riske dayanan bir açıklama
!rubric Gerçekçi örnekler
!model YZ'ye devredeceğim: haftalık raporumun taslağı — verilerimle kolayca kontrol edebilirim. Dikkatle: bir ortağa e-posta çevirisi — şartları ve tonu kontrol edeceğim. Hiç: hangi adayı işe alacağıma karar vermek — risk yüksek ve kararı bir insan vermeli.

# ai-07 | Güvenlik ve sorumluluk | Önyargı, yazarlık, dürüstlük
## Önyargı
Modeller insan metinlerinden — kalıp yargılarıyla birlikte — öğrenir. Bu yüzden cevaplar önyargılı olabilir: örneğin bir mesleğe varsayılan olarak bir cinsiyet atamak veya ülkeleri klişelerle anlatmak. Bunu fark edin ve alternatif isteyin: "ya başka bir açıdan bakarsak?".

## Yazarlık ve dürüstlük
- **Açıklık**. Okulunuzun veya işvereninizin kuralları gerektiriyorsa YZ kullandığınızı söyleyin. Birçok üniversite ve yayıncının zaten böyle kuralları var.
- **Sorumluluk**. Yayımladığınız metinden, onu bir model yazmış olsa bile, siz sorumlusunuz.
- **Başkalarının hakları**. Bir model başkalarının metinlerinden parçaları yeniden üretebilir; onları kendinizinmiş gibi sunmayın ve alıntı olup olmadığını kontrol edin.
- **Deepfake'ler**. Gerçek kişilerin sahte fotoğraf, ses veya videolarını onların rızası olmadan oluşturmayın ve YZ'yi aldatmak için kullanmayın.

!key Modeller kalıp yargıları metinlerden devralır — önyargıya dikkat edin.
!key Kurallar gerektirdiğinde YZ kullandığınızı belirtin.
!key Yayımladığınız metinden model değil, siz sorumlusunuz.
!key YZ'yi aldatmak veya gerçek kişileri taklit etmek için kullanmayın.

?q:e Modellerdeki önyargı nereden gelir?
- Bilerek eklenir
+ Modeller insan metinlerinden, kalıp yargılar dahil, öğrenir
- Kötü bir internet bağlantısından
- Yalnızca insanlar önyargılı olabilir
= Veriler, toplumu tüm çarpıklıklarıyla yansıtır.

?q:m YZ ile yazılıp adınızla yayımlanan bir paylaşımdan kim sorumludur?
- Modeli geliştiren şirket
+ Paylaşımın yazarı olarak siz
- Hiç kimse
- Okuyucular
= Kim yayımlarsa yayından o sorumludur.

?q:m Üniversiteniz YZ kullanımını bildirmenizi şart koşuyor. YZ'den kompozisyonunuzun girişini kısaltmasını istediniz. Ne yapmalısınız?
+ Kuralların gerektirdiği şekilde bildirmek
- Değişiklikler küçük olduğu için söz etmemek
- Sohbet geçmişini silmek
- Gizlemek için metni başka bir YZ ile yeniden yazdırmak
= Dürüstlük ve kurallar kolaylığın önündedir.

?q:h YZ'nin hangi kullanımı kabul edilemez?
- Bir meslektaşın doğum günü mesajı için fikir istemek
- Zor bir konunun açıklamasını istemek
+ Bir tanıdığın "ağzından", arkadaşlarından para isteyen bir ses mesajı üretmek
- Dilbilgisi kontrolü istemek
= Bu, gerçek bir kişiyi taklit ederek aldatmaktır.

?r:m Bir modelin cevabındaki kalıp yargıya nasıl tepki vermelisiniz?
- Olgu olarak kabul etmek
+ Fark edip farklı bir bakış açısı istemek
- Uygulamayı hemen silmek
- Cevabı yorumsuz paylaşmak
= Cevaplara eleştirel yaklaşmak YZ okuryazarlığının bir parçasıdır.

?r:e Kuralların yasakladığı yerde bir modelin metnini tamamen kendinizinmiş gibi gösterebilir misiniz?
- Evet, kimse öğrenmezse
+ Hayır, kurallara uyun ve YZ kullandığınızı belirtin
- Evet, metin kısaysa
- Evet, çevirirseniz
= Dürüstlük kuralları YZ için de geçerlidir.

!open Çalışmada veya işte YZ'yi dürüstçe kullanmak için kendinize 3 kural yazın.
!rubric Üç somut kural
!rubric Sorumluluk ve açıklık kapsanmış
!rubric Kurallar uygulanabilir
!model 1) YZ'nin yazdığı her şeyi kontrol edip düzenlerim — yalnızca katıldığım şeyi imzalarım. 2) Kurs veya müşteri kuralları gerektiriyorsa YZ kullandığımı ve ne için kullandığımı söylerim. 3) Başkalarının kişisel verilerini yüklemem ve gerçek kişiler adına hiçbir şey oluşturmam.

# ai-08 | Güvenlik ve sorumluluk | YZ ile birlikte öğrenmek
## Bir yardımcı, yerine geçen değil
YZ öğrenmeyi hızlandırabilir — ya da sessizce onun yerini alabilir. Model problemleri sizin yerinize çözerse cevabı alırsınız ama beceriyi alamazsınız: hafıza ve anlayış yalnızca kendi çabanızla gelişir. İlk kursu hatırlayın: bilgiyi kalıcı kılan **hatırlamak ve açıklamaktır**.

## Öğrenmek için YZ nasıl kullanılır
- Ondan bir konuyu farklı şekillerde, hayatınızdan örneklerle **açıklamasını** isteyin.
- Ondan konuyla ilgili **size sorular sormasını** ve cevaplarınızı kontrol etmesini isteyin — bu geri çağırma pratiğidir.
- Hazır çözüm değil **ipucu** isteyin: "bana yönlendirici bir soru ver".
- Konuyu modele kendiniz anlatın ve hataları bulmasını isteyin — bu Feynman tekniğidir.
- Bilgileri kontrol edin: bir YZ açıklaması da hata içerebilir.

## Chompbook'ta YZ
Bir YZ bağlarsanız Chompbook kendi materyallerinizden dersler yazar ve yazılı cevaplarınızı kontrol eder. YZ dersleri etiketlidir ve dersin üstündeki bayrak bir hatayı bildirmenizi sağlar. YZ olmadan da uygulama çalışır — hazır kurslar ve kendi kaynaklarınızla.

!key YZ işi sizin yerinize yaparsa beceri gelişmez.
!key Hazır çözümler değil, açıklamalar, sorular ve ipuçları isteyin.
!key Konuyu modele kendiniz anlatın ve hataları bulmasını isteyin.
!key YZ açıklamaları da kontrol gerektirir.

?q:e Tüm çalışma görevlerinizi YZ'ye çözdürmek neden risklidir?
+ Cevapları alırsınız ama beceriyi almazsınız: anlayış kendi çabanızdan gelişir
- YZ bunları her zaman yanlış çözer
- Bu yasalara aykırıdır
- Çok pahalıdır
= Bilgi, sizin hatırlamanız ve açıklamanızla pekişir.

?q:m YZ'ye hangi istek hafızanızı en iyi çalıştırır?
- "Problemi benim yerime çöz"
+ "Bu konuda bana 5 soru sor ve cevaplarımı kontrol et"
- "Bir özet yaz, sonra okurum"
- "Bana sadece cevabı söyle"
= Bu, geri bildirimli bir geri çağırma pratiğidir.

?q:m Bir problemde takıldınız. Kopyalamak yerine öğrenmek için nasıl yardım istersiniz?
- "Bana tam çözümü ver"
+ "Cevabı vermeden bana yönlendirici bir soru ver"
- "Tüm benzer problemleri çöz"
- "Sadece sayıyı söyle"
= Bir ipucu, asıl işi size bırakır.

?q:h Feynman tekniğini YZ ile nasıl kullanabilirsiniz?
- YZ'den konuyu açıklamasını isteyip metnini ezberlemek
+ Konuyu modele kendi sözlerinizle açıklayıp hataları ve boşlukları bulmasını istemek
- YZ'den kompozisyonu sizin yerinize yazmasını istemek
- Farklı modellerin iki cevabını karşılaştırmak
= Siz açıklarsınız — model boşlukları görmenize yardım eder.

?r:m Bir YZ'nin size verdiği açıklamayla ne yapmalısınız?
- Kontrol etmeden kabul etmek
+ Temel bilgileri güvenilir bir kaynakla kontrol etmek
- Kelimesi kelimesine öğrenmek
- Kendi çalışmanız olarak sunmak
= Açıklamalar da hata içerebilir.

?r:e YZ'den hangi tür yardım öğrenmenizi bozmadan sürdürür?
+ Açıklamalar, sorular ve ipuçları
- Tüm ödevlere hazır cevaplar
- Ödevlerinizi sizin yerinize yazmak
- Sınavları sizin yerinize çözmek
= Asıl çaba sizde kalmalıdır.

!open Sizin yerinize işi yapmadan bir sınava veya iş görüşmesine hazırlanmanıza yardım edecek bir YZ istemi yazın.
!rubric Bağlam ve konu verilmiş
!rubric İstem sizin aktif katılımınızı gerektiriyor
!rubric Geri bildirim var
!model Bir veri analisti görüşmesine hazırlanıyorum. Bana SQL ve istatistik üzerine kolaydan zora doğru, her seferinde bir soru sor. Her cevaptan sonra neyin doğru olduğunu ve neyin eksik kaldığını söyle ve ancak ondan sonra bir sonraki soruyu sor. Ben istemedikçe örnek cevaplar gösterme.
