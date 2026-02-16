"use client";
import { useState, useEffect, useRef } from "react";

// ═══ COLORS ═══
const C = { green: "#39746B", greenDk: "#2D5F58", greenLt: "#E8F5F0", gold: "#ECB11E", goldLt: "#FFF8E7", light: "#FFFDF7", dark: "#2D3436", gray: "#636E72" };

// ═══ LINKS ═══
const L = { wa: "https://wa.me/38269371111?text=Zdravo!%20Želim%20zakazati%20termin%20za%20šišanje%20u%20Grašku.", viber: "viber://chat?number=38269371111", ig: "https://www.instagram.com/djecijisalon", fb: "https://www.facebook.com/p/Dječiji-salon-Grašak-61559455795290/", tiktok: "https://www.tiktok.com/@djeciji.salon", maps: "https://www.google.com/maps/place/GRAŠAK/data=!4m2!3m1!1s0x0:0x1ae339b0be9d7c95", reviews: "https://www.google.com/maps/place/GRAŠAK/data=!4m2!3m1!1s0x0:0x1ae339b0be9d7c95", email: "mailto:grasaksalon@gmail.com", pinta: "http://www.pinta.co.me/", azetaIG: "https://www.instagram.com/azeta_biocg" };

// ═══ SVG ICONS ═══
const WA = ({s=24}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>;
const VB = ({s=24}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="12" fill="#7360F2"/><text x="12" y="17" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold" fontFamily="Arial,sans-serif">V</text></svg>;
const IG = ({s=24}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>;
const FB = ({s=24}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>;
const TK = ({s=24}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>;

// ═══ TRANSLATIONS ═══
const ME = {
  lang: "Latinica", flag: "🇲🇪",
  partners: "Naši partneri", pintaDesc: "Igračke i knjige za djecu", azetaDesc: "Organska kozmetika 0m+",
  nav: { services: "Usluge", about: "O nama", booking: "Zakaži", contact: "Kontakt", faq: "Pitanja" },
  hero: { badge: "🏆 Prvi dječiji salon u Crnoj Gori", title: "Bez suza. Bez straha.", sub: "Samo osmjesi i super frizure! 💇‍♂️✨", desc: "Više od 5000 srećne djece. Vaše je sljedeće.", cta: "Zakaži termin", cta2: "Pogledaj usluge" },
  stats: [["5000+","Šišanja"],["50+","⭐ Recenzija"],["3365+","Pratilaca"]],
  svc: {
    title: "Usluge i cjenovnik", sub: "Sve prilagođeno djeci — od stolica do kozmetike",
    tabs: ["Sve","Osnovno","Paketi","Dodatno"],
    items: [
      { n: "Kratko šišanje ✂️", d: "Mašinica i/ili makaze. Brzo, precizno.", p: "8€", t: "~15min", c: 1, pop: true },
      { n: "Srednje šišanje ✂️", d: "Mašinica i/ili makaze. Brzo, precizno.", p: "10€", t: "~20min", c: 1 },
      { n: "Dugo šišanje ✂️", d: "Mašinica i/ili makaze. Brzo, precizno.", p: "12€", t: "~30min", c: 1 },
      { n: "🌟 Prvo šišanje", d: "Šišanje + fotografija + diploma + pramen kose. AZETA BIO kozmetika (0m+).", p: "14€", t: "~30min", c: 2, pop: true, badge: "📸 + diploma" },
      { n: "Mali tim (2 djece)", d: "Kratko/srednje za dvoje. Ušteda za porodicu.", p: "14€", t: "~30min", c: 2 },
      { n: "Veseli paket (3 djece)", d: "Ušteda za porodicu.", p: "19€", t: "~40min", c: 2 },
      { n: "Mini društvo (4 djece)", d: "Četiri kratka/srednja. Najveća ušteda.", p: "24€", t: "~45min", c: 2 },
      { n: "Mini SPA tretman 🧴", d: "Šampon i masaža glave.", p: "6€", t: "~15min", c: 3 },
      { n: "Feniranje 💨", d: "Sušenje i oblikovanje fenom.", p: "7€", t: "~15min", c: 3 },
      { n: "Pribor za kosu 🎀", d: "Trake, ukosnice... po artiklu.", p: "3-6€", t: "", c: 3 },
    ],
    azeta: "🌿 Koristimo AZETA BIO — italijansku organsku kozmetiku za bebe i djecu (0m+). Bez parabena, sulfata, pesticida.",
    loyalty: { title: "💳 Kartica \"Veseli Grašak\"", desc: "15% popust na sve osnovne usluge. Za redovne posjetioce.", badge: "15% POPUSTA" }
  },
  about: {
    title: "O nama",
    p1: "Grašak je osnovan u oktobru 2023. kao prvi dječiji frizerski salon u Crnoj Gori. Prostor isključivo za djecu — stolice u obliku autića, crtaći na ekranima, edukativne igračke i knjige od naših drugara iz Pinta.co.me.",
    p2: "Koristimo isključivo AZETA BIO organsku kozmetiku — bezbjednu od prvog dana života. Strpljenje je naša najvažnija vještina.",
  },
  team: { title: "Naš tim", name: "Nikola", role: "Dječiji frizer", bio: "Radi sa djecom od prvog dana Graška. Strpljiv, pažljiv i uvijek sa osmjehom.", hire: "Pridruži se timu! 💚", hireDesc: "Tražimo frizere koji vole djecu.", hireCta: "Pošalji CV" },
  reviews: {
    title: "Šta kažu roditelji", sub: "Preko 50 recenzija sa najvišom ocjenom od srećnih porodica",
    items: [
      { name: "Mira Radovic", info: "Local Guide", text: "Divno, pažljivi prema djeci i veoma brzi. Razne aktivnosti koje privlače pažnju djece." },
      { name: "Miljana Bajcetic", info: "mama (11 mj)", text: "Svaka čast frizeru — na strpljenju, stručnosti i ljubaznosti! Toplo preporučujem." },
      { name: "Estefania Pia S.C.", info: "mama (1 god)", text: "Prvo šišanje za sina. Sve prilagođeno djeci. Definitivno se vraćamo." },
      { name: "Anastasiya P", info: "мама", text: "Dječiji salon sa muzičkim autićem, crtaćima i igračkama. Dijete oduševljeno." },
    ], cta: "Pogledajte sve recenzije →"
  },
  gallery: { title: "Galerija osmjeha", sub: "Svaki osmjeh je dokaz — šišanje ne mora biti stres." },
  faq: {
    title: "Često postavljena pitanja", sub: "Sve što roditelji pitaju — i odgovori koji smiruju.",
    items: [
      ["Od kog uzrasta?", "Od rođenja. Šišamo dok sjede u naručju mame ili tate."],
      ["Šta ako dijete plače?", "Potpuno normalno. Nikad ne forsiramo. Koristimo igračke, crtaće i pauze."],
      ["Koliko traje?", "15–30 min, zavisno od usluge. Nikad ne žurimo."],
      ["Mogu li otkazati?", "Da, besplatno do 2h ranije — poruka na WhatsApp."],
      ["Koristite li sigurne proizvode?", "AZETA BIO — organska kozmetika za bebe, bezbjedna od rođenja (0m+)."],
      ["Gdje se nalazite?", "Branka Deletića bb, New City — zgrade KIPS-a, iza Volija. Besplatan parking."],
    ]
  },
  booking: { title: "Zakažite termin", sub: "Brzo, jednostavno, bez čekanja.", fields: ["Ime roditelja","Ime djeteta","Uzrast djeteta"], svc: "Izaberite uslugu", date: "Datum", time: "Vrijeme", note: "Napomena (npr. Prva posjeta...)", submit: "Zakaži termin 📅", cancel: "🔒 Besplatno otkazivanje do 2h ranije" },
  contact: {
    title: "Kontakt i lokacija", sub: "Pitanje? Javite nam se — odgovaramo brzo.",
    addr: "Branka Deletića bb, Lamela \"A\", New City", addr2: "Zgrade KIPS-a, iza Volija · Podgorica",
    park: "🅿️ Besplatan parking", dir: "📍 Uputstvo do nas",
    hrs: "Radno vrijeme", hrsList: ["Utorak – Nedjelja: 11:00 – 21:00", "Ponedjeljak: Zatvoreno"],
  },
  footer: { rights: "© 2025 Grašak — Dječiji frizerski salon. Sva prava zadržana.", tag: "Prvi dječiji salon u Crnoj Gori 💚" },
  social: { title: "Pratite nas", follow: "Iz Graška" },
};

const EN = {
  lang: "English", flag: "🇬🇧",
  partners: "Our partners", pintaDesc: "Educational toys & books", azetaDesc: "Organic cosmetics 0m+",
  nav: { services: "Services", about: "About", booking: "Book Now", contact: "Contact", faq: "FAQ" },
  hero: { badge: "🏆 First kids salon in Montenegro", title: "No tears. No fear.", sub: "Just smiles and awesome haircuts! 💇‍♂️✨", desc: "Over 5,000 happy kids. Yours is next.", cta: "Book appointment", cta2: "View services" },
  stats: [["5000+","Haircuts"],["50+","⭐ Reviews"],["3365+","Followers"]],
  svc: {
    title: "Services & Pricing", sub: "Everything adapted for children", tabs: ["All","Basic","Packages","Extra"],
    items: [
      { n: "Short haircut ✂️", d: "Clippers and/or scissors. Quick, precise.", p: "€8", t: "~15min", c: 1, pop: true },
      { n: "Medium haircut ✂️", d: "Clippers and/or scissors. Quick, precise.", p: "€10", t: "~20min", c: 1 },
      { n: "Long haircut ✂️", d: "Clippers and/or scissors. Quick, precise.", p: "€12", t: "~30min", c: 1 },
      { n: "🌟 First Haircut", d: "Haircut + photo + diploma + lock of hair. AZETA BIO (0m+).", p: "€14", t: "~30min", c: 2, pop: true, badge: "📸 + diploma" },
      { n: "Little Team (2 kids)", d: "Short/medium for two kids.", p: "€14", t: "~30min", c: 2 },
      { n: "Happy Package (3 kids)", d: "Family savings.", p: "€19", t: "~40min", c: 2 },
      { n: "Mini Squad (4 kids)", d: "Four haircuts. Best deal.", p: "€24", t: "~45min", c: 2 },
      { n: "Mini SPA 🧴", d: "Shampoo and scalp massage.", p: "€6", t: "~15min", c: 3 },
      { n: "Blow-dry 💨", d: "Drying and styling.", p: "€7", t: "~15min", c: 3 },
      { n: "Hair accessories 🎀", d: "Bands, clips... per item.", p: "€3-6", t: "", c: 3 },
    ],
    azeta: "🌿 We use AZETA BIO — Italian organic cosmetics for babies and children (0m+).",
    loyalty: { title: "💳 \"Veseli Grašak\" Card", desc: "15% off all basic services. For regulars.", badge: "15% OFF" }
  },
  about: { title: "About Us", p1: "Founded October 2023 as Montenegro's first kids-only hair salon. Car-shaped chairs, cartoons, educational toys from Pinta.co.me.", p2: "We use AZETA BIO organic cosmetics — safe from birth. Patience is our most important skill." },
  team: { title: "Our Team", name: "Nikola", role: "Kids' Hairstylist", bio: "With kids since day one at Grašak. Patient, attentive, always smiling.", hire: "Join our team! 💚", hireDesc: "Looking for hairstylists who love kids.", hireCta: "Send CV" },
  reviews: { title: "What Parents Say", sub: "Over 50 top-rated reviews from happy families",
    items: [
      { name: "Mira Radovic", info: "Local Guide", text: "Wonderful, attentive to children and very fast." },
      { name: "Miljana Bajcetic", info: "mom (11 mo)", text: "Kudos for patience, expertise and kindness! Highly recommend." },
      { name: "Estefania Pia S.C.", info: "mom (1yr)", text: "First haircut for my son. Everything kid-friendly. We'll be back." },
      { name: "Anastasiya P", info: "mom", text: "Musical car seat, cartoons, toys. Our child loved it." },
    ], cta: "See all reviews →"
  },
  gallery: { title: "Smile Gallery", sub: "Proof that haircuts don't have to be stressful." },
  faq: { title: "Frequently Asked Questions", sub: "Everything parents ask.", items: [
    ["From what age?", "From birth. We cut while they sit in mom/dad's arms."],
    ["What if my child cries?", "Normal! We never force it. Toys, cartoons, breaks."],
    ["How long?", "15–30 min. We never rush your child."],
    ["Can I cancel?", "Free cancellation up to 2h before via WhatsApp."],
    ["Safe products?", "AZETA BIO — organic baby cosmetics, safe from birth (0m+)."],
    ["Where are you?", "Branka Deletića bb, New City — behind Voli, KIPS buildings. Free parking."],
  ]},
  booking: { title: "Book Appointment", sub: "Quick, simple, no waiting.", fields: ["Parent name","Child name","Child age"], svc: "Select service", date: "Date", time: "Time", note: "Note (e.g. First visit...)", submit: "Book appointment 📅", cancel: "🔒 Free cancellation up to 2h before" },
  contact: { title: "Contact & Location", sub: "Question? Reach out — we reply fast.",
    addr: "Branka Deletića bb, Lamela \"A\", New City", addr2: "KIPS buildings, behind Voli · Podgorica",
    park: "🅿️ Free parking", dir: "📍 Directions",
    hrs: "Opening hours", hrsList: ["Tuesday – Sunday: 11:00 – 21:00", "Monday: Closed"],
  },
  footer: { rights: "© 2025 Grašak — Kids' Hair Salon. All rights reserved.", tag: "First kids salon in Montenegro 💚" },
  social: { title: "Follow us", follow: "From Grašak" },
};

const RU = {
  lang: "Русский", flag: "🇷🇺",
  partners: "Наши партнёры", pintaDesc: "Игрушки и книги для детей", azetaDesc: "Органическая косметика 0м+",
  nav: { services: "Услуги", about: "О нас", booking: "Записаться", contact: "Контакт", faq: "Вопросы" },
  hero: { badge: "🏆 Первый детский салон в Черногории", title: "Без слёз. Без страха.", sub: "Только улыбки и стильные стрижки! 💇‍♂️✨", desc: "Более 5000 счастливых детей. Ваш — следующий.", cta: "Записаться", cta2: "Наши услуги" },
  stats: [["5000+","Стрижек"],["50+","⭐ Отзывов"],["3365+","Подписчиков"]],
  svc: {
    title: "Услуги и цены", sub: "Всё адаптировано для детей", tabs: ["Все","Базовые","Пакеты","Доп."],
    items: [
      { n: "Короткая стрижка ✂️", d: "Машинка и/или ножницы. Быстро, точно.", p: "8€", t: "~15мин", c: 1, pop: true },
      { n: "Средняя стрижка ✂️", d: "Машинка и/или ножницы. Быстро, точно.", p: "10€", t: "~20мин", c: 1 },
      { n: "Длинная стрижка ✂️", d: "Машинка и/или ножницы. Быстро, точно.", p: "12€", t: "~30мин", c: 1 },
      { n: "🌟 Первая стрижка", d: "Стрижка + фото + диплом + прядь. AZETA BIO (0м+).", p: "14€", t: "~30мин", c: 2, pop: true, badge: "📸 + диплом" },
      { n: "Малая команда (2)", d: "Для двоих детей.", p: "14€", t: "~30мин", c: 2 },
      { n: "Весёлый пакет (3)", d: "Экономия для семьи.", p: "19€", t: "~40мин", c: 2 },
      { n: "Мини-компания (4)", d: "Четыре стрижки. Лучшая цена.", p: "24€", t: "~45мин", c: 2 },
      { n: "Мини СПА 🧴", d: "Шампунь и массаж головы.", p: "6€", t: "~15мин", c: 3 },
      { n: "Укладка феном 💨", d: "Сушка и укладка.", p: "7€", t: "~15мин", c: 3 },
      { n: "Аксессуары для волос 🎀", d: "Ленты, заколки... за штуку.", p: "3-6€", t: "", c: 3 },
    ],
    azeta: "🌿 AZETA BIO — итальянская органическая косметика для детей (0м+).",
    loyalty: { title: "💳 Карта «Весёлый Грашак»", desc: "15% скидка на базовые услуги.", badge: "СКИДКА 15%" }
  },
  about: { title: "О нас", p1: "Грашак основан в октябре 2023 как первый детский салон в Черногории. Кресла-машинки, мультики, игрушки и книги от Pinta.co.me.", p2: "Используем AZETA BIO — безопасно с рождения. Терпение — наш главный навык." },
  team: { title: "Команда", name: "Никола", role: "Детский парикмахер", bio: "С детьми с первого дня Грашака. Терпеливый, внимательный.", hire: "В нашу команду! 💚", hireDesc: "Ищем парикмахеров, которые любят детей.", hireCta: "Отправить CV" },
  reviews: { title: "Отзывы родителей", sub: "Более 50 отзывов с высшей оценкой",
    items: [
      { name: "Мира", info: "Local Guide", text: "Замечательно, внимательны к детям и очень быстро." },
      { name: "Миляна", info: "мама (11 мес)", text: "Браво за терпение и профессионализм! Рекомендую." },
      { name: "Эстефания", info: "мама (1 год)", text: "Первая стрижка сына. Всё для детей. Вернёмся." },
      { name: "Анастасия", info: "мама", text: "Музыкальная машинка, мультики, игрушки. Ребёнок в восторге." },
    ], cta: "Все отзывы →"
  },
  gallery: { title: "Галерея улыбок", sub: "Стрижка — это не стресс." },
  faq: { title: "Частые вопросы", sub: "Всё, что спрашивают родители.", items: [
    ["С какого возраста?", "С рождения. Стрижём на руках у мамы или папы."],
    ["Что если ребёнок плачет?", "Нормально! Никогда не заставляем. Игрушки, мультики, паузы."],
    ["Сколько длится?", "15–30 мин. Никогда не торопим."],
    ["Можно отменить?", "Бесплатно за 2ч — сообщение в WhatsApp."],
    ["Безопасные продукты?", "AZETA BIO — органическая косметика (0м+)."],
    ["Где вы?", "Branka Deletića bb, New City — за Voli. Бесплатная парковка."],
  ]},
  booking: { title: "Записаться", sub: "Быстро, просто, без ожидания.", fields: ["Имя родителя","Имя ребёнка","Возраст"], svc: "Выберите услугу", date: "Дата", time: "Время", note: "Примечание...", submit: "Записаться 📅", cancel: "🔒 Бесплатная отмена за 2ч" },
  contact: { title: "Контакт и адрес", sub: "Вопрос? Пишите — ответим быстро.",
    addr: "Branka Deletića bb, Lamela \"A\", New City", addr2: "Здания KIPS, за Voli · Подгорица",
    park: "🅿️ Бесплатная парковка", dir: "📍 Как добраться",
    hrs: "Часы работы", hrsList: ["Вт – Вс: 11:00 – 21:00", "Понедельник: Выходной"],
  },
  footer: { rights: "© 2025 Грашак — Детский салон. Все права защищены.", tag: "Первый детский салон в Черногории 💚" },
  social: { title: "Мы в соцсетях", follow: "Из Грашака" },
};

const ES = {
  lang: "Español", flag: "🇪🇸",
  partners: "Nuestros socios", pintaDesc: "Juguetes y libros educativos", azetaDesc: "Cosmética orgánica 0m+",
  nav: { services: "Servicios", about: "Nosotros", booking: "Reservar", contact: "Contacto", faq: "Preguntas" },
  hero: { badge: "🏆 Primera peluquería infantil en Montenegro", title: "Sin lágrimas. Sin miedo.", sub: "¡Solo sonrisas y cortes con estilo! 💇‍♂️✨", desc: "Más de 5000 niños felices. El tuyo es el siguiente.", cta: "Reservar cita", cta2: "Ver servicios" },
  stats: [["5000+","Cortes"],["50+","⭐ Reseñas"],["3365+","Seguidores"]],
  svc: {
    title: "Servicios y precios", sub: "Todo adaptado para niños", tabs: ["Todo","Básico","Paquetes","Extra"],
    items: [
      { n: "Corte corto ✂️", d: "Máquina y/o tijeras. Rápido, preciso.", p: "8€", t: "~15min", c: 1, pop: true },
      { n: "Corte medio ✂️", d: "Máquina y/o tijeras. Rápido, preciso.", p: "10€", t: "~20min", c: 1 },
      { n: "Corte largo ✂️", d: "Máquina y/o tijeras. Rápido, preciso.", p: "12€", t: "~30min", c: 1 },
      { n: "🌟 Primer corte", d: "Corte + foto + diploma + mechón. AZETA BIO (0m+).", p: "14€", t: "~30min", c: 2, pop: true, badge: "📸 + diploma" },
      { n: "Equipo (2 niños)", d: "Corto/medio para dos.", p: "14€", t: "~30min", c: 2 },
      { n: "Paquete feliz (3 niños)", d: "Ahorro familiar.", p: "19€", t: "~40min", c: 2 },
      { n: "Mini grupo (4 niños)", d: "Cuatro cortes. Mejor precio.", p: "24€", t: "~45min", c: 2 },
      { n: "Mini SPA 🧴", d: "Champú y masaje capilar.", p: "6€", t: "~15min", c: 3 },
      { n: "Secado 💨", d: "Secado y peinado.", p: "7€", t: "~15min", c: 3 },
      { n: "Accesorios 🎀", d: "Cintas, horquillas... por pieza.", p: "3-6€", t: "", c: 3 },
    ],
    azeta: "🌿 Usamos AZETA BIO — cosmética orgánica italiana (0m+).",
    loyalty: { title: "💳 Tarjeta \"Veseli Grašak\"", desc: "15% de descuento en servicios básicos.", badge: "15% DESC." }
  },
  about: { title: "Sobre nosotros", p1: "Fundado en octubre 2023 como primera peluquería infantil de Montenegro. Sillas-coche, dibujos, juguetes de Pinta.co.me.", p2: "Usamos AZETA BIO — seguro desde el nacimiento. La paciencia es nuestra habilidad." },
  team: { title: "Equipo", name: "Nikola", role: "Peluquero infantil", bio: "Con los niños desde el primer día. Paciente y atento.", hire: "¡Únete! 💚", hireDesc: "Buscamos peluqueros que amen a los niños.", hireCta: "Enviar CV" },
  reviews: { title: "Opiniones", sub: "Más de 50 reseñas con la puntuación más alta",
    items: [
      { name: "Mira", info: "Local Guide", text: "Maravilloso, atentos con los niños y muy rápidos." },
      { name: "Miljana", info: "mamá (11m)", text: "¡Bravo por la paciencia y profesionalismo!" },
      { name: "Estefania", info: "mamá (1a)", text: "Primer corte de mi hijo. Todo adaptado. Volveremos." },
      { name: "Anastasiya", info: "mamá", text: "Coche musical, dibujos, juguetes. Nuestro hijo encantado." },
    ], cta: "Ver todas las reseñas →"
  },
  gallery: { title: "Galería de sonrisas", sub: "Un corte no tiene que ser estrés." },
  faq: { title: "Preguntas frecuentes", sub: "Todo lo que preguntan los padres.", items: [
    ["¿Desde qué edad?", "Desde el nacimiento. Cortamos en brazos de mamá/papá."],
    ["¿Si mi hijo llora?", "¡Normal! Nunca forzamos. Juguetes, dibujos, pausas."],
    ["¿Cuánto dura?", "15–30 min. Nunca apresuramos."],
    ["¿Puedo cancelar?", "Gratis hasta 2h antes por WhatsApp."],
    ["¿Productos seguros?", "AZETA BIO — cosmética orgánica (0m+)."],
    ["¿Dónde están?", "Branka Deletića bb, New City — detrás de Voli. Parking gratis."],
  ]},
  booking: { title: "Reservar cita", sub: "Rápido, simple, sin espera.", fields: ["Nombre del padre","Nombre del niño","Edad del niño"], svc: "Seleccionar servicio", date: "Fecha", time: "Hora", note: "Nota...", submit: "Reservar cita 📅", cancel: "🔒 Cancelación gratis hasta 2h antes" },
  contact: { title: "Contacto", sub: "¿Pregunta? Escríbenos — respondemos rápido.",
    addr: "Branka Deletića bb, Lamela \"A\", New City", addr2: "Edificios KIPS, detrás de Voli · Podgorica",
    park: "🅿️ Parking gratuito", dir: "📍 Cómo llegar",
    hrs: "Horario", hrsList: ["Martes – Domingo: 11:00 – 21:00", "Lunes: Cerrado"],
  },
  footer: { rights: "© 2025 Grašak — Peluquería infantil.", tag: "Primera peluquería infantil en Montenegro 💚" },
  social: { title: "Síguenos", follow: "Desde Grašak" },
};

const TR = {
  lang: "Türkçe", flag: "🇹🇷",
  partners: "Ortaklarımız", pintaDesc: "Eğitici oyuncak ve kitaplar", azetaDesc: "Organik kozmetik 0a+",
  nav: { services: "Hizmetler", about: "Hakkımızda", booking: "Randevu", contact: "İletişim", faq: "SSS" },
  hero: { badge: "🏆 Karadağ'ın ilk çocuk salonu", title: "Gözyaşı yok. Korku yok.", sub: "Sadece gülümsemeler ve şık saçlar! 💇‍♂️✨", desc: "5000'den fazla mutlu çocuk. Sıradaki sizsiniz.", cta: "Randevu al", cta2: "Hizmetleri gör" },
  stats: [["5000+","Saç kesimi"],["50+","⭐ Yorum"],["3365+","Takipçi"]],
  svc: {
    title: "Hizmetler ve fiyatlar", sub: "Her şey çocuklara uygun", tabs: ["Tümü","Temel","Paketler","Ekstra"],
    items: [
      { n: "Kısa kesim ✂️", d: "Makine ve/veya makas. Hızlı, hassas.", p: "8€", t: "~15dk", c: 1, pop: true },
      { n: "Orta kesim ✂️", d: "Makine ve/veya makas. Hızlı, hassas.", p: "10€", t: "~20dk", c: 1 },
      { n: "Uzun kesim ✂️", d: "Makine ve/veya makas. Hızlı, hassas.", p: "12€", t: "~30dk", c: 1 },
      { n: "🌟 İlk kesim", d: "Kesim + fotoğraf + diploma + saç tutamı. AZETA BIO (0a+).", p: "14€", t: "~30dk", c: 2, pop: true, badge: "📸 + diploma" },
      { n: "Küçük takım (2)", d: "İki çocuk için.", p: "14€", t: "~30dk", c: 2 },
      { n: "Mutlu paket (3)", d: "Aile tasarrufu.", p: "19€", t: "~40dk", c: 2 },
      { n: "Mini grup (4)", d: "Dört kesim. En iyi fiyat.", p: "24€", t: "~45dk", c: 2 },
      { n: "Mini SPA 🧴", d: "Şampuan ve kafa masajı.", p: "6€", t: "~15dk", c: 3 },
      { n: "Fön 💨", d: "Kurutma ve şekillendirme.", p: "7€", t: "~15dk", c: 3 },
      { n: "Saç aksesuarı 🎀", d: "Bant, toka... parça başı.", p: "3-6€", t: "", c: 3 },
    ],
    azeta: "🌿 AZETA BIO — İtalyan organik kozmetik (0a+).",
    loyalty: { title: "💳 \"Veseli Grašak\" Kart", desc: "Temel hizmetlerde %15 indirim.", badge: "%15 İNDİRİM" }
  },
  about: { title: "Hakkımızda", p1: "Ekim 2023'te Karadağ'ın ilk çocuk salonu. Araba koltuklar, çizgi filmler, oyuncaklar.", p2: "AZETA BIO — doğumdan itibaren güvenli. Sabır en önemli becerimiz." },
  team: { title: "Ekibimiz", name: "Nikola", role: "Çocuk kuaförü", bio: "İlk günden çocuklarla. Sabırlı ve dikkatli.", hire: "Ekibimize katıl! 💚", hireDesc: "Çocukları seven kuaförler arıyoruz.", hireCta: "CV Gönder" },
  reviews: { title: "Veliler ne diyor", sub: "50'den fazla en yüksek puanlı yorum",
    items: [
      { name: "Mira", info: "Local Guide", text: "Harika, çocuklara karşı dikkatli ve çok hızlı." },
      { name: "Miljana", info: "anne (11a)", text: "Sabır ve uzmanlık için bravo! Tavsiye ederim." },
      { name: "Estefania", info: "anne (1y)", text: "Oğlumun ilk kesimi. Her şey çocuklara uygun." },
      { name: "Anastasiya", info: "anne", text: "Müzikli araba, çizgi filmler. Çocuğumuz bayıldı." },
    ], cta: "Tüm yorumları gör →"
  },
  gallery: { title: "Gülümseme galerisi", sub: "Saç kesimi stres olmak zorunda değil." },
  faq: { title: "Sık sorulan sorular", sub: "Velilerin sorduğu her şey.", items: [
    ["Kaç yaşından?", "Doğumdan itibaren. Kucakta keseriz."],
    ["Çocuğum ağlarsa?", "Normal! Asla zorlamayız. Oyuncaklar, çizgi filmler."],
    ["Ne kadar sürer?", "15–30 dk. Asla acele etmeyiz."],
    ["İptal edebilir miyim?", "2 saat öncesine kadar WhatsApp'tan ücretsiz iptal."],
    ["Güvenli ürünler?", "AZETA BIO — organik kozmetik (0a+)."],
    ["Neredesiniz?", "Branka Deletića bb, New City — Voli arkası. Ücretsiz park."],
  ]},
  booking: { title: "Randevu al", sub: "Hızlı, basit, beklemesiz.", fields: ["Veli adı","Çocuk adı","Çocuk yaşı"], svc: "Hizmet seçin", date: "Tarih", time: "Saat", note: "Not...", submit: "Randevu al 📅", cancel: "🔒 2 saat öncesine kadar ücretsiz iptal" },
  contact: { title: "İletişim", sub: "Soru? Bize yazın — hızlı yanıtlarız.",
    addr: "Branka Deletića bb, Lamela \"A\", New City", addr2: "KIPS binaları, Voli arkası · Podgorica",
    park: "🅿️ Ücretsiz park", dir: "📍 Yol tarifi",
    hrs: "Çalışma saatleri", hrsList: ["Salı – Pazar: 11:00 – 21:00", "Pazartesi: Kapalı"],
  },
  footer: { rights: "© 2025 Grašak — Çocuk kuaförü.", tag: "Karadağ'ın ilk çocuk salonu 💚" },
  social: { title: "Bizi takip edin", follow: "Grašak'tan" },
};

// ═══ CYRILLIC TRANSLITERATION ═══
const lat2cyr = (s) => {
  const m = { 'Nj':'Њ','nj':'њ','Lj':'Љ','lj':'љ','Dž':'Џ','dž':'џ','A':'А','B':'Б','V':'В','G':'Г','D':'Д','Đ':'Ђ','đ':'ђ','E':'Е','Ž':'Ж','ž':'ж','Z':'З','z':'з','I':'И','J':'Ј','K':'К','L':'Л','M':'М','N':'Н','O':'О','P':'П','R':'Р','S':'С','T':'Т','Ć':'Ћ','ć':'ћ','U':'У','F':'Ф','H':'Х','C':'Ц','Č':'Ч','č':'ч','Š':'Ш','š':'ш','a':'а','b':'б','v':'в','g':'г','d':'д','e':'е','i':'и','j':'ј','k':'к','l':'л','m':'м','n':'н','o':'о','p':'п','r':'р','s':'с','t':'т','u':'у','f':'ф','h':'х','c':'ц' };
  let r = '';
  for (let i = 0; i < s.length; i++) {
    const d = s.substring(i, i+2);
    if (m[d]) { r += m[d]; i++; } else if (m[s[i]]) { r += m[s[i]]; } else { r += s[i]; }
  }
  return r;
};
const cyrObj = (o) => { if (typeof o === 'string') return lat2cyr(o); if (Array.isArray(o)) return o.map(cyrObj); if (typeof o === 'object' && o !== null) return Object.fromEntries(Object.entries(o).map(([k,v]) => [k, cyrObj(v)])); return o; };

const allLangs = { me: ME, cy: cyrObj(ME), en: EN, ru: RU, es: ES, tr: TR };
allLangs.cy.lang = "Ћирилица";
allLangs.cy.flag = "🇲🇪";
// Fixed Cyrillic for hero + about (not auto-transliterated)
allLangs.cy.hero = { badge: "🏆 Први дјечији салон у Црној Гори", title: "Без суза. Без страха.", sub: "Само осмијеси и супер фризуре! 💇‍♂️✨", desc: "Више од 5000 срећне дјеце. Ваше је сљедеће.", cta: "Закажи термин", cta2: "Погледај услуге" };
allLangs.cy.about = { title: "О нама", p1: "Грашак је основан у октобру 2023. као први дјечији фризерски салон у Црној Гори. Простор искључиво за дјецу — столице у облику аутића, цртаћи на екранима, едукативне играчке и књиге од наших другара из Pinta.co.me.", p2: "Користимо искључиво AZETA BIO органску козметику — безбједну од првог дана живота. Стрпљење је наша најважнија вјештина." };
allLangs.cy.partners = "Наши партнери";
allLangs.cy.pintaDesc = "Играчке и књиге за дјецу";
allLangs.cy.azetaDesc = "Органска козметика 0м+";

// ═══ MAIN COMPONENT ═══
export default function GrasakWebsite() {
  const [lang, setLang] = useState("me");
  const [langOpen, setLangOpen] = useState(false);
  const [mobMenu, setMobMenu] = useState(false);
  const [svcCat, setSvcCat] = useState(0);
  const [faqOpen, setFaqOpen] = useState(null);
  const [scrollY, setScrollY] = useState(0);
  const langRef = useRef(null);

  const t = allLangs[lang];

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const fn = (e) => { if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false); };
    document.addEventListener("click", fn);
    return () => document.removeEventListener("click", fn);
  }, []);

  const go = (id) => { document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }); setMobMenu(false); };

  const svcItems = svcCat === 0 ? t.svc.items : t.svc.items.filter(s => s.c === svcCat);

  const handleBooking = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const parts = [];
    for (const [k, v] of fd.entries()) { if (v) parts.push(`${k}: ${v}`); }
    const msg = encodeURIComponent("Zdravo! Želim zakazati termin:\n" + parts.join("\n"));
    window.open(`https://wa.me/38269371111?text=${msg}`, "_blank");
  };

  const Btn = ({ children, onClick, primary = true, style = {} }) => (
    <button onClick={onClick} style={{
      background: primary ? `linear-gradient(135deg, ${C.green}, ${C.greenDk})` : "white",
      color: primary ? "white" : C.green,
      border: primary ? "none" : `2px solid ${C.green}`,
      padding: primary ? "14px 32px" : "12px 28px",
      borderRadius: 50, fontFamily: "'Baloo 2', cursive", fontSize: 16, fontWeight: 700,
      cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8,
      boxShadow: primary ? "0 4px 15px rgba(57,116,107,0.35)" : "none",
      transition: "all 0.3s", textDecoration: "none", ...style
    }}>{children}</button>
  );

  const SocBtn = ({ href, bg, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{ width: 42, height: 42, borderRadius: 12, background: bg, display: "flex", alignItems: "center", justifyContent: "center", color: "white", transition: "all 0.3s", textDecoration: "none" }}>{children}</a>
  );

  const inputStyle = { width: "100%", padding: "12px 16px", borderRadius: 12, border: "2px solid #E0E0E0", fontFamily: "'Nunito', sans-serif", fontSize: 15, outline: "none", transition: "border 0.3s" };

  return (
    <>
      {/* ─── FLOATING BUTTONS ─── */}
      <a href={L.wa} target="_blank" rel="noopener noreferrer" className="float-btn" style={{ position:"fixed", bottom:80, right:24, zIndex:999, width:56, height:56, borderRadius:"50%", background:"#25D366", display:"flex", alignItems:"center", justifyContent:"center", color:"white", boxShadow:"0 4px 15px rgba(0,0,0,0.2)", textDecoration:"none" }}><WA s={28}/></a>
      <a href={L.viber} className="float-btn" style={{ position:"fixed", bottom:80, right:90, zIndex:999, width:56, height:56, borderRadius:"50%", background:"#7360F2", display:"flex", alignItems:"center", justifyContent:"center", color:"white", boxShadow:"0 4px 15px rgba(0,0,0,0.2)", textDecoration:"none", animationDelay:"0.5s" }}><VB s={28}/></a>

      {/* ─── MOBILE BOTTOM BAR ─── */}
      <div className="mob-bar">
        <a href={L.wa} target="_blank" rel="noopener noreferrer" style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"10px", borderRadius:12, background:"#25D366", color:"white", fontWeight:700, fontSize:14, fontFamily:"'Baloo 2', cursive", textDecoration:"none" }}><WA s={18}/> WhatsApp</a>
        <button onClick={() => go("booking")} style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"10px", borderRadius:12, background:`linear-gradient(135deg, ${C.green}, ${C.greenDk})`, color:"white", fontWeight:700, fontSize:14, fontFamily:"'Baloo 2', cursive", border:"none", cursor:"pointer" }}>📅 {t.nav.booking}</button>
      </div>

      {/* ─── NAV ─── */}
      <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:1000, padding: scrollY > 50 ? "8px 0" : "14px 0", background: scrollY > 50 ? "rgba(255,253,247,0.97)" : "transparent", backdropFilter: scrollY > 50 ? "blur(12px)" : "none", boxShadow: scrollY > 50 ? "0 2px 20px rgba(0,0,0,0.05)" : "none", transition: "all 0.3s" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", padding:"0 20px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }} onClick={() => go("hero")}>
            <img src="/images/logo.jpg" alt="Grašak" style={{ height: scrollY > 50 ? 36 : 42, width: scrollY > 50 ? 36 : 42, borderRadius:"50%", transition:"all 0.3s", objectFit:"cover" }} />
            <span style={{ fontFamily:"'Baloo 2', cursive", fontSize:24, fontWeight:800, color:C.green }}>Grašak</span>
          </div>
          <div className="desk" style={{ display:"flex", alignItems:"center", gap:20 }}>
            {Object.entries(t.nav).map(([id, label]) => (
              <a key={id} onClick={() => go(id)} style={{ color:C.gray, textDecoration:"none", fontWeight:600, cursor:"pointer", fontSize:14 }}>{label}</a>
            ))}
            <Btn onClick={() => go("booking")} style={{ padding:"8px 20px", fontSize:14 }}>📅 {t.nav.booking}</Btn>
            <div style={{ position:"relative" }} ref={langRef}>
              <button onClick={() => setLangOpen(!langOpen)} style={{ background:"none", border:"2px solid #E0E0E0", borderRadius:10, padding:"6px 12px", cursor:"pointer", fontSize:13, fontWeight:600, color:C.gray }}>{t.flag} ▾</button>
              {langOpen && <div style={{ position:"absolute", top:"100%", right:0, background:"white", borderRadius:12, boxShadow:"0 8px 30px rgba(0,0,0,0.12)", minWidth:150, marginTop:6, overflow:"hidden", zIndex:1001 }}>
                {Object.entries(allLangs).map(([k, v]) => (
                  <div key={k} onClick={() => { setLang(k); setLangOpen(false); }} style={{ padding:"10px 16px", cursor:"pointer", display:"flex", alignItems:"center", gap:8, fontSize:14, fontWeight: lang===k ? 700 : 400, background: lang===k ? C.greenLt : "white" }}>
                    {v.flag} {v.lang}
                  </div>
                ))}
              </div>}
            </div>
          </div>
          <button className="mob" onClick={() => setMobMenu(!mobMenu)} style={{ background:"none", border:"none", fontSize:28, cursor:"pointer" }}>☰</button>
        </div>
      </nav>

      {/* ─── MOBILE MENU ─── */}
      {mobMenu && <div style={{ position:"fixed", inset:0, background:"rgba(255,253,247,0.98)", zIndex:998, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:20, backdropFilter:"blur(20px)" }}>
        <button onClick={() => setMobMenu(false)} style={{ position:"absolute", top:16, right:20, background:"none", border:"none", fontSize:32, cursor:"pointer" }}>✕</button>
        {Object.entries(t.nav).map(([id, label]) => (
          <a key={id} onClick={() => go(id)} style={{ fontFamily:"'Baloo 2', cursive", fontSize:26, color:C.dark, textDecoration:"none", cursor:"pointer" }}>{label}</a>
        ))}
        <Btn onClick={() => go("booking")}>📅 {t.nav.booking}</Btn>
        <div style={{ display:"flex", gap:8, marginTop:12 }}>
          {Object.entries(allLangs).map(([k, v]) => (
            <button key={k} onClick={() => { setLang(k); setMobMenu(false); }} style={{ padding:"6px 12px", borderRadius:8, border: lang===k ? `2px solid ${C.green}` : "2px solid #ddd", background: lang===k ? C.greenLt : "white", cursor:"pointer", fontSize:13 }}>{v.flag}</button>
          ))}
        </div>
      </div>}

      {/* ═══ HERO ═══ */}
      <section id="hero" style={{ minHeight:"100vh", display:"flex", alignItems:"center", background:`linear-gradient(180deg, ${C.greenLt} 0%, ${C.light} 60%, #FFF8E7 100%)`, padding:"100px 20px 60px" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", width:"100%", display:"grid", gridTemplateColumns:"1fr 1fr", gap:40, alignItems:"center" }} className="grid2">
          <div className="fade-in">
            <div style={{ display:"inline-block", background:`linear-gradient(135deg, ${C.green}, ${C.greenDk})`, color:"white", padding:"6px 18px", borderRadius:50, fontSize:13, fontWeight:700, marginBottom:20 }}>{t.hero.badge}</div>
            <h1 style={{ fontFamily:"'Baloo 2', cursive", fontSize:48, fontWeight:800, lineHeight:1.1, marginBottom:8 }}>{t.hero.title}</h1>
            <p style={{ fontFamily:"'Baloo 2', cursive", fontSize:24, color:C.green, fontWeight:700, marginBottom:14 }}>{t.hero.sub}</p>
            <p style={{ color:C.gray, fontSize:17, marginBottom:28, lineHeight:1.6 }}>{t.hero.desc}</p>
            <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:40 }}>
              <Btn onClick={() => go("booking")}>{t.hero.cta}</Btn>
              <Btn primary={false} onClick={() => go("services")}>{t.hero.cta2}</Btn>
            </div>
            <div style={{ display:"flex", gap:28 }}>
              {t.stats.map(([v, l], i) => (
                <div key={i} style={{ textAlign:"center" }}>
                  <div style={{ fontFamily:"'Baloo 2', cursive", fontSize:26, fontWeight:800, color:C.green }}>{v}</div>
                  <div style={{ fontSize:12, color:C.gray, fontWeight:600 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ position:"relative" }}>
            <img src="/images/salon.jpg" alt="Grašak salon" style={{ width:"100%", borderRadius:20, boxShadow:"0 16px 50px rgba(0,0,0,0.1)" }} />
            <img src="/images/djecak.jpg" alt="Dijete u salonu" style={{ position:"absolute", bottom:-16, left:-16, width:130, height:130, borderRadius:16, objectFit:"cover", border:"3px solid white", boxShadow:"0 6px 20px rgba(0,0,0,0.15)" }} />
          </div>
        </div>
      </section>

      {/* ═══ PARTNERS TRUST STRIP ═══ */}
      <section style={{ padding:"28px 20px", background:"white", borderTop:"1px solid #f0f0f0", borderBottom:"1px solid #f0f0f0" }}>
        <div style={{ maxWidth:900, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"center", gap:40, flexWrap:"wrap" }}>
          <span style={{ fontSize:13, color:C.gray, fontWeight:600, textTransform:"uppercase", letterSpacing:1 }}>{t.partners || "Naši partneri"}</span>
          <a href={L.pinta} target="_blank" rel="noopener noreferrer" style={{ display:"flex", alignItems:"center", gap:10, textDecoration:"none", padding:"8px 20px", borderRadius:12, background:C.greenLt, border:`2px solid ${C.green}30`, transition:"all 0.3s" }}>
            <span style={{ fontSize:24 }}>🧩</span>
            <div>
              <div style={{ fontFamily:"'Baloo 2', cursive", fontSize:16, fontWeight:800, color:C.green }}>Pinta.co.me</div>
              <div style={{ fontSize:11, color:C.gray, fontWeight:500 }}>{t.pintaDesc || "Igračke i knjige za djecu"}</div>
            </div>
          </a>
          <a href={L.azetaIG} target="_blank" rel="noopener noreferrer" style={{ display:"flex", alignItems:"center", gap:10, textDecoration:"none", padding:"8px 20px", borderRadius:12, background:"#f0f7f0", border:"2px solid #c8e6c930", transition:"all 0.3s" }}>
            <span style={{ fontSize:24 }}>🌿</span>
            <div>
              <div style={{ fontFamily:"'Baloo 2', cursive", fontSize:16, fontWeight:800, color:"#2e7d32" }}>AZETA BIO</div>
              <div style={{ fontSize:11, color:C.gray, fontWeight:500 }}>{t.azetaDesc || "Organska kozmetika 0m+"}</div>
            </div>
          </a>
        </div>
      </section>

      {/* ═══ SERVICES ═══ */}
      <section id="services" style={{ padding:"70px 20px", background:`linear-gradient(180deg, #FFF8E7, ${C.light})` }}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>
          <h2 style={{ fontFamily:"'Baloo 2', cursive", fontSize:38, fontWeight:800, textAlign:"center", marginBottom:8 }}>{t.svc.title}</h2>
          <p style={{ textAlign:"center", color:C.gray, fontSize:16, marginBottom:36 }}>{t.svc.sub}</p>
          <div style={{ display:"flex", gap:8, justifyContent:"center", marginBottom:28, flexWrap:"wrap" }}>
            {t.svc.tabs.map((tab, i) => (
              <button key={i} onClick={() => setSvcCat(i)} style={{ padding:"8px 18px", borderRadius:50, border: svcCat===i ? `2px solid ${C.green}` : "2px solid #E0E0E0", background: svcCat===i ? C.green : "white", color: svcCat===i ? "white" : C.gray, fontFamily:"'Baloo 2', cursive", fontSize:14, fontWeight:600, cursor:"pointer", transition:"all 0.3s" }}>{tab}</button>
            ))}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(300px, 1fr))", gap:16 }}>
            {svcItems.map((s, i) => (
              <div key={i} style={{ background:"white", borderRadius:16, padding:20, boxShadow:"0 2px 12px rgba(0,0,0,0.05)", border: s.pop ? `2px solid ${C.green}` : "2px solid transparent", position:"relative", transition:"all 0.3s" }}>
                {s.pop && <div style={{ position:"absolute", top:-10, right:16, background:C.gold, color:"white", padding:"2px 12px", borderRadius:50, fontSize:11, fontWeight:700 }}>POPULAR</div>}
                {s.badge && <div style={{ position:"absolute", top:-10, left:16, background:C.green, color:"white", padding:"2px 10px", borderRadius:50, fontSize:11, fontWeight:700 }}>{s.badge}</div>}
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                  <h3 style={{ fontFamily:"'Baloo 2', cursive", fontSize:17, fontWeight:700 }}>{s.n}</h3>
                  <span style={{ fontFamily:"'Baloo 2', cursive", fontSize:22, fontWeight:800, color:C.green }}>{s.p}</span>
                </div>
                <p style={{ color:C.gray, fontSize:14, marginBottom:8, lineHeight:1.5 }}>{s.d}</p>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ fontSize:13, color:C.gray }}>⏱ {s.t}</span>
                  <button onClick={() => go("booking")} style={{ background:C.greenLt, color:C.green, border:"none", padding:"6px 14px", borderRadius:50, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Baloo 2', cursive" }}>📅 {t.nav.booking}</button>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop:32, display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }} className="grid2">
            <a href={L.azetaIG} target="_blank" rel="noopener noreferrer" style={{ background:C.greenLt, borderRadius:16, padding:20, textAlign:"center", textDecoration:"none", transition:"all 0.3s" }}>
              <span style={{ fontSize:28, display:"block", marginBottom:6 }}>🌿</span>
              <p style={{ color:C.green, fontWeight:700, fontSize:15, marginBottom:4 }}>AZETA BIO</p>
              <p style={{ color:C.gray, fontSize:12 }}>{t.azetaDesc}</p>
            </a>
            <a href={L.pinta} target="_blank" rel="noopener noreferrer" style={{ background:"#FFF3E0", borderRadius:16, padding:20, textAlign:"center", textDecoration:"none", transition:"all 0.3s" }}>
              <span style={{ fontSize:28, display:"block", marginBottom:6 }}>🧩</span>
              <p style={{ color:"#E65100", fontWeight:700, fontSize:15, marginBottom:4 }}>Pinta.co.me</p>
              <p style={{ color:C.gray, fontSize:12 }}>{t.pintaDesc}</p>
            </a>
          </div>
          <div style={{ marginTop:16, background:`linear-gradient(135deg, ${C.gold}15, ${C.gold}30)`, borderRadius:16, padding:20, display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
            <div><h3 style={{ fontFamily:"'Baloo 2', cursive", fontSize:18, fontWeight:700 }}>{t.svc.loyalty.title}</h3><p style={{ color:C.gray, fontSize:14 }}>{t.svc.loyalty.desc}</p></div>
            <div style={{ background:C.gold, color:"white", padding:"8px 20px", borderRadius:50, fontWeight:800, fontFamily:"'Baloo 2', cursive" }}>{t.svc.loyalty.badge}</div>
          </div>
        </div>
      </section>

      {/* ═══ ABOUT ═══ */}
      <section id="about" style={{ padding:"70px 20px" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", display:"grid", gridTemplateColumns:"1fr 1fr", gap:40, alignItems:"center" }} className="grid2">
          <div>
            <h2 style={{ fontFamily:"'Baloo 2', cursive", fontSize:38, fontWeight:800, marginBottom:16 }}>{t.about.title}</h2>
            <p style={{ color:C.gray, fontSize:16, lineHeight:1.7, marginBottom:16 }}>{t.about.p1}</p>
            <p style={{ color:C.gray, fontSize:16, lineHeight:1.7, marginBottom:20 }}>{t.about.p2}</p>
            {/* ── PARTNERS ── */}
            <p style={{ fontSize:13, fontWeight:600, color:C.gray, textTransform:"uppercase", letterSpacing:1.5, marginBottom:10 }}>{t.partners}</p>
            <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
              <a href={L.pinta} target="_blank" rel="noopener noreferrer" style={{ display:"flex", alignItems:"center", gap:12, background:C.greenLt, border:`2px solid ${C.green}30`, borderRadius:16, padding:"14px 22px", textDecoration:"none", transition:"all 0.3s", boxShadow:"0 2px 8px rgba(0,0,0,0.04)", flex:"1", minWidth:200 }}>
                <span style={{ fontSize:32 }}>🧩</span>
                <div>
                  <div style={{ fontFamily:"'Baloo 2', cursive", fontSize:17, fontWeight:700, color:C.dark }}>Pinta.co.me</div>
                  <div style={{ fontSize:12, color:C.gray }}>{t.pintaDesc}</div>
                </div>
                <span style={{ fontSize:14, color:C.green, fontWeight:700, marginLeft:"auto" }}>→</span>
              </a>
              <a href={L.azetaIG} target="_blank" rel="noopener noreferrer" style={{ display:"flex", alignItems:"center", gap:12, background:C.greenLt, border:`2px solid ${C.green}30`, borderRadius:16, padding:"14px 22px", textDecoration:"none", transition:"all 0.3s", boxShadow:"0 2px 8px rgba(0,0,0,0.04)", flex:"1", minWidth:200 }}>
                <span style={{ fontSize:32 }}>🌿</span>
                <div>
                  <div style={{ fontFamily:"'Baloo 2', cursive", fontSize:17, fontWeight:700, color:C.dark }}>AZETA BIO</div>
                  <div style={{ fontSize:12, color:C.gray }}>{t.azetaDesc}</div>
                </div>
                <span style={{ fontSize:14, color:C.green, fontWeight:700, marginLeft:"auto" }}>→</span>
              </a>
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <img src="/images/oprema.jpg" alt="Oprema salona" style={{ borderRadius:16, objectFit:"cover", width:"100%", height:180 }} />
            <img src="/images/prvo_sisanje.jpg" alt="Prvo šišanje" style={{ borderRadius:16, objectFit:"cover", width:"100%", height:180 }} />
            <img src="/images/tri_za_ustedu.jpg" alt="Porodični paketi" style={{ borderRadius:16, objectFit:"cover", width:"100%", height:180, gridColumn:"span 2" }} />
          </div>
        </div>
      </section>

      {/* ═══ TEAM ═══ */}
      <section style={{ padding:"50px 20px", background:C.greenLt }}>
        <div style={{ maxWidth:600, margin:"0 auto", textAlign:"center" }}>
          <h2 style={{ fontFamily:"'Baloo 2', cursive", fontSize:32, fontWeight:800, marginBottom:24 }}>{t.team.title}</h2>
          <img src="/images/nikola.jpg" alt="Nikola" style={{ width:120, height:120, borderRadius:"50%", objectFit:"cover", border:`3px solid ${C.green}`, marginBottom:12 }} />
          <h3 style={{ fontFamily:"'Baloo 2', cursive", fontSize:20, fontWeight:700 }}>{t.team.name}</h3>
          <p style={{ color:C.green, fontWeight:600, marginBottom:8 }}>{t.team.role}</p>
          <p style={{ color:C.gray, fontSize:15, marginBottom:24 }}>{t.team.bio}</p>
          <div style={{ background:"white", borderRadius:16, padding:20 }}>
            <h4 style={{ fontFamily:"'Baloo 2', cursive", fontSize:18, marginBottom:8 }}>{t.team.hire}</h4>
            <p style={{ color:C.gray, fontSize:14, marginBottom:12 }}>{t.team.hireDesc}</p>
            <a href="https://wa.me/38269371111?text=Zdravo!%20Zainteresovan/a%20sam%20za%20posao%20frizera%20u%20Grašku.%20Šaljem%20CV." target="_blank" rel="noopener" style={{ background:`linear-gradient(135deg, ${C.green}, ${C.greenDk})`, color:"white", padding:"10px 24px", borderRadius:50, fontWeight:700, fontFamily:"'Baloo 2', cursive", textDecoration:"none", fontSize:14, display:"inline-block" }}>{t.team.hireCta}</a>
          </div>
        </div>
      </section>

      {/* ═══ REVIEWS ═══ */}
      <section style={{ padding:"70px 20px" }}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>
          <h2 style={{ fontFamily:"'Baloo 2', cursive", fontSize:38, fontWeight:800, textAlign:"center", marginBottom:8 }}>{t.reviews.title}</h2>
          <p style={{ textAlign:"center", color:C.gray, fontSize:16, marginBottom:36 }}>{t.reviews.sub}</p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(260px, 1fr))", gap:16 }}>
            {t.reviews.items.map((r, i) => (
              <div key={i} style={{ background:"white", borderRadius:16, padding:20, boxShadow:"0 2px 12px rgba(0,0,0,0.05)", border:"1px solid #f0f0f0" }}>
                <div style={{ color:C.gold, fontSize:18, marginBottom:8 }}>★★★★★</div>
                <p style={{ color:C.dark, fontSize:15, lineHeight:1.6, marginBottom:12, fontStyle:"italic" }}>&ldquo;{r.text}&rdquo;</p>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:36, height:36, borderRadius:"50%", background:C.greenLt, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, color:C.green, fontFamily:"'Baloo 2', cursive" }}>{r.name[0]}</div>
                  <div><div style={{ fontWeight:700, fontSize:14 }}>{r.name}</div><div style={{ fontSize:12, color:C.gray }}>{r.info}</div></div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign:"center", marginTop:24 }}>
            <a href={L.reviews} target="_blank" rel="noopener noreferrer" style={{ color:C.green, fontWeight:700, fontSize:15, textDecoration:"none" }}>{t.reviews.cta}</a>
          </div>
        </div>
      </section>

      {/* ═══ GALLERY ═══ */}
      <section style={{ padding:"50px 20px", background:C.greenLt }}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>
          <h2 style={{ fontFamily:"'Baloo 2', cursive", fontSize:32, fontWeight:800, textAlign:"center", marginBottom:8 }}>{t.gallery.title}</h2>
          <p style={{ textAlign:"center", color:C.gray, fontSize:15, marginBottom:28 }}>{t.gallery.sub}</p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))", gap:12 }}>
            {["/images/salon.jpg","/images/zadovoljni.jpg","/images/oprema.jpg","/images/prvo_sisanje.jpg","/images/fb_cover.jpg","/images/tri_za_ustedu.jpg"].map((src, i) => (
              <img key={i} src={src} alt="Grašak galerija" style={{ borderRadius:12, objectFit:"cover", width:"100%", height:180 }} />
            ))}
          </div>
          <div style={{ display:"flex", gap:12, justifyContent:"center", marginTop:24, flexWrap:"wrap" }}>
            <SocBtn href={L.ig} bg="linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)"><IG s={20}/></SocBtn>
            <SocBtn href={L.fb} bg="#1877F2"><FB s={20}/></SocBtn>
            <SocBtn href={L.tiktok} bg="#010101"><TK s={20}/></SocBtn>
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section id="faq" style={{ padding:"70px 20px" }}>
        <div style={{ maxWidth:700, margin:"0 auto" }}>
          <h2 style={{ fontFamily:"'Baloo 2', cursive", fontSize:38, fontWeight:800, textAlign:"center", marginBottom:8 }}>{t.faq.title}</h2>
          <p style={{ textAlign:"center", color:C.gray, fontSize:16, marginBottom:36 }}>{t.faq.sub}</p>
          {t.faq.items.map(([q, a], i) => (
            <div key={i} style={{ marginBottom:8 }}>
              <button onClick={() => setFaqOpen(faqOpen === i ? null : i)} style={{ width:"100%", textAlign:"left", background:"white", border:"2px solid #f0f0f0", borderRadius: faqOpen===i ? "16px 16px 0 0" : 16, padding:"16px 20px", cursor:"pointer", fontFamily:"'Baloo 2', cursive", fontSize:16, fontWeight:600, display:"flex", justifyContent:"space-between", alignItems:"center", color:C.dark, transition:"all 0.3s" }}>
                {q} <span style={{ transform: faqOpen===i ? "rotate(180deg)" : "none", transition:"transform 0.3s", fontSize:20 }}>▾</span>
              </button>
              {faqOpen === i && <div style={{ background:"white", borderRadius:"0 0 16px 16px", border:"2px solid #f0f0f0", borderTop:"none", padding:"16px 20px" }}>
                <p style={{ color:C.gray, fontSize:15, lineHeight:1.6 }}>{a}</p>
              </div>}
            </div>
          ))}
        </div>
      </section>

      {/* ═══ BOOKING ═══ */}
      <section id="booking" style={{ padding:"70px 20px", background:`linear-gradient(180deg, ${C.greenLt}, ${C.light})` }}>
        <div style={{ maxWidth:600, margin:"0 auto" }}>
          <h2 style={{ fontFamily:"'Baloo 2', cursive", fontSize:38, fontWeight:800, textAlign:"center", marginBottom:8 }}>{t.booking.title}</h2>
          <p style={{ textAlign:"center", color:C.gray, fontSize:16, marginBottom:36 }}>{t.booking.sub}</p>
          <form onSubmit={handleBooking} style={{ background:"white", borderRadius:20, padding:32, boxShadow:"0 4px 20px rgba(0,0,0,0.06)" }}>
            <div style={{ display:"grid", gap:16 }}>
              {t.booking.fields.map((f, i) => (
                <div key={i}><label style={{ display:"block", fontSize:13, fontWeight:600, marginBottom:4, color:C.gray }}>{f}</label><input name={f} style={inputStyle} required /></div>
              ))}
              <div>
                <label style={{ display:"block", fontSize:13, fontWeight:600, marginBottom:4, color:C.gray }}>{t.booking.svc}</label>
                <select name="Usluga" style={{ ...inputStyle, cursor:"pointer" }} required>
                  <option value="">—</option>
                  {t.svc.items.map((s, i) => <option key={i} value={s.n}>{s.n} — {s.p}</option>)}
                </select>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div><label style={{ display:"block", fontSize:13, fontWeight:600, marginBottom:4, color:C.gray }}>{t.booking.date}</label><input name="Datum" type="date" style={inputStyle} required /></div>
                <div><label style={{ display:"block", fontSize:13, fontWeight:600, marginBottom:4, color:C.gray }}>{t.booking.time}</label>
                  <select name="Vrijeme" style={{ ...inputStyle, cursor:"pointer" }} required>
                    <option value="">—</option>
                    {Array.from({length:20}, (_, j) => { const h = 11 + Math.floor(j/2); const m = j%2 === 0 ? "00" : "30"; return `${h}:${m}`; }).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div><label style={{ display:"block", fontSize:13, fontWeight:600, marginBottom:4, color:C.gray }}>{t.booking.note}</label><textarea name="Napomena" rows={2} style={{ ...inputStyle, resize:"vertical" }}></textarea></div>
              <button type="submit" style={{ width:"100%", padding:"14px", borderRadius:50, border:"none", background:`linear-gradient(135deg, ${C.green}, ${C.greenDk})`, color:"white", fontFamily:"'Baloo 2', cursive", fontSize:18, fontWeight:700, cursor:"pointer", boxShadow:"0 4px 15px rgba(57,116,107,0.35)" }}>{t.booking.submit}</button>
            </div>
            <p style={{ textAlign:"center", marginTop:12, color:C.gray, fontSize:13 }}>{t.booking.cancel}</p>
          </form>
        </div>
      </section>

      {/* ═══ CONTACT ═══ */}
      <section id="contact" style={{ padding:"70px 20px" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", display:"grid", gridTemplateColumns:"1fr 1fr", gap:40 }} className="grid2">
          <div>
            <h2 style={{ fontFamily:"'Baloo 2', cursive", fontSize:38, fontWeight:800, marginBottom:8 }}>{t.contact.title}</h2>
            <p style={{ color:C.gray, fontSize:16, marginBottom:28 }}>{t.contact.sub}</p>
            <div style={{ marginBottom:20 }}>
              <div style={{ fontWeight:700, fontSize:16, marginBottom:4 }}>📍 {t.contact.addr}</div>
              <div style={{ color:C.gray, fontSize:14 }}>{t.contact.addr2}</div>
              <div style={{ color:C.green, fontWeight:600, fontSize:14, marginTop:4 }}>{t.contact.park}</div>
            </div>
            <div style={{ marginBottom:20 }}>
              <div style={{ fontWeight:700, fontSize:16, marginBottom:4 }}>📞 +382 69 371 111</div>
              <div style={{ fontSize:14, color:C.gray }}>grasaksalon@gmail.com</div>
            </div>
            <div style={{ marginBottom:20 }}>
              <div style={{ fontWeight:700, fontSize:16, marginBottom:8 }}>🕐 {t.contact.hrs}</div>
              {t.contact.hrsList.map((h, i) => <div key={i} style={{ fontSize:14, color: i===1 ? "#e74c3c" : C.gray, fontWeight: i===1 ? 600 : 400 }}>{h}</div>)}
            </div>
            <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
              <a href={L.wa} target="_blank" rel="noopener noreferrer" style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"10px 20px", borderRadius:50, background:"#25D366", color:"white", fontWeight:700, fontSize:14, fontFamily:"'Baloo 2', cursive", textDecoration:"none" }}><WA s={18}/> WhatsApp</a>
              <a href={L.viber} style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"10px 20px", borderRadius:50, background:"#7360F2", color:"white", fontWeight:700, fontSize:14, fontFamily:"'Baloo 2', cursive", textDecoration:"none" }}><VB s={18}/> Viber</a>
              <a href={L.maps} target="_blank" rel="noopener noreferrer" style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"10px 20px", borderRadius:50, background:C.green, color:"white", fontWeight:700, fontSize:14, fontFamily:"'Baloo 2', cursive", textDecoration:"none" }}>{t.contact.dir}</a>
            </div>
          </div>
          <div style={{ borderRadius:16, overflow:"hidden", minHeight:300, background:"#e0e0e0" }}>
            <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2955.6!2d19.263!3d42.441!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x1ae339b0be9d7c95!2sGRA%C5%A0AK!5e0!3m2!1sen!2sme!4v1700000000000!5m2!1sen!2sme" width="100%" height="100%" style={{ border:0, minHeight:300 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Grašak lokacija"></iframe>
          </div>
        </div>
      </section>

      {/* ═══ SOCIAL ═══ */}
      <section style={{ padding:"40px 20px", background:C.greenLt, textAlign:"center" }}>
        <h3 style={{ fontFamily:"'Baloo 2', cursive", fontSize:22, fontWeight:700, marginBottom:4 }}>{t.social.title}</h3>
        <p style={{ color:C.gray, fontSize:14, marginBottom:16 }}>@djecijisalon</p>
        <div style={{ display:"flex", gap:12, justifyContent:"center" }}>
          <SocBtn href={L.ig} bg="linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)"><IG s={22}/></SocBtn>
          <SocBtn href={L.fb} bg="#1877F2"><FB s={22}/></SocBtn>
          <SocBtn href={L.tiktok} bg="#010101"><TK s={22}/></SocBtn>
          <SocBtn href={L.wa} bg="#25D366"><WA s={22}/></SocBtn>
          <SocBtn href={L.viber} bg="#7360F2"><VB s={22}/></SocBtn>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer style={{ background:C.dark, color:"white", padding:"40px 20px", textAlign:"center" }}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, marginBottom:8 }}>
            <img src="/images/logo.jpg" alt="Grašak" style={{ height:40, width:40, borderRadius:"50%", objectFit:"cover" }} />
            <span style={{ fontFamily:"'Baloo 2', cursive", fontSize:24, fontWeight:800 }}>Grašak</span>
          </div>
          <p style={{ color:C.green, fontWeight:600, marginBottom:16 }}>{t.footer.tag}</p>
          <div style={{ display:"flex", gap:20, justifyContent:"center", marginBottom:24, flexWrap:"wrap" }}>
            {Object.entries(t.nav).map(([id, label]) => (
              <a key={id} onClick={() => go(id)} style={{ color:"rgba(255,255,255,0.7)", textDecoration:"none", fontSize:14, cursor:"pointer" }}>{label}</a>
            ))}
          </div>
          {/* ── PARTNERS IN FOOTER ── */}
          <div style={{ borderTop:"1px solid rgba(255,255,255,0.1)", paddingTop:24, marginBottom:20 }}>
            <p style={{ color:"rgba(255,255,255,0.5)", fontSize:12, fontWeight:600, textTransform:"uppercase", letterSpacing:2, marginBottom:14 }}>{t.partners}</p>
            <div style={{ display:"flex", gap:16, justifyContent:"center", flexWrap:"wrap" }}>
              <a href={L.pinta} target="_blank" rel="noopener noreferrer" style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:12, padding:"10px 20px", textDecoration:"none", transition:"all 0.3s" }}>
                <span style={{ fontSize:22 }}>🧩</span>
                <div style={{ textAlign:"left" }}>
                  <div style={{ color:"white", fontSize:14, fontWeight:700 }}>Pinta.co.me</div>
                  <div style={{ color:"rgba(255,255,255,0.5)", fontSize:11 }}>{t.pintaDesc}</div>
                </div>
              </a>
              <a href={L.azetaIG} target="_blank" rel="noopener noreferrer" style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:12, padding:"10px 20px", textDecoration:"none", transition:"all 0.3s" }}>
                <span style={{ fontSize:22 }}>🌿</span>
                <div style={{ textAlign:"left" }}>
                  <div style={{ color:"white", fontSize:14, fontWeight:700 }}>AZETA BIO</div>
                  <div style={{ color:"rgba(255,255,255,0.5)", fontSize:11 }}>{t.azetaDesc}</div>
                </div>
              </a>
            </div>
          </div>
          <p style={{ color:"rgba(255,255,255,0.4)", fontSize:12 }}>{t.footer.rights}</p>
        </div>
      </footer>

      {/* spacer for mobile bottom bar */}
      <div className="mob" style={{ height: 60 }}></div>
    </>
  );
}
