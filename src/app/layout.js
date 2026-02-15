import './globals.css';

export const metadata = {
  title: 'Grašak — Dječiji frizerski salon | Podgorica',
  description: 'Grašak je prvi dječiji frizerski salon u Crnoj Gori. Bez suza, bez straha — samo osmjesi i stylish frizure. Šišanje od 8€. Zakazivanje: +382 69 371 111.',
  keywords: 'dječiji frizer, kids haircut, Podgorica, salon za djecu, Montenegro, šišanje djece, first haircut, prvo šišanje',
  metadataBase: new URL('https://grasak.vercel.app'),
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Grašak — Prvi dječiji salon u Crnoj Gori',
    description: 'Bez suza. Bez straha. 5000+ srećne djece. Zakaži termin danas!',
    type: 'website',
    locale: 'sr_Latn_ME',
    siteName: 'Grašak',
    images: [{ url: '/images/salon.jpg', width: 400, height: 300, alt: 'Grašak dječiji salon' }],
  },
  twitter: { card: 'summary_large_image' },
  icons: { icon: '/favicon.png' },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HairSalon",
    "name": "Grašak — Dječiji frizerski salon",
    "image": "https://grasak.vercel.app/images/salon.jpg",
    "url": "https://grasak.vercel.app",
    "telephone": "+38269371111",
    "email": "grasaksalon@gmail.com",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Branka Deletića bb, Lamela A, New City",
      "addressLocality": "Podgorica",
      "addressCountry": "ME"
    },
    "geo": { "@type": "GeoCoordinates", "latitude": 42.441, "longitude": 19.263 },
    "openingHoursSpecification": [
      { "@type": "OpeningHoursSpecification", "dayOfWeek": ["Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"], "opens": "11:00", "closes": "21:00" }
    ],
    "priceRange": "€3-€24",
    "aggregateRating": { "@type": "AggregateRating", "ratingValue": "5.0", "reviewCount": "50" },
    "description": "Prvi dječiji frizerski salon u Crnoj Gori. Šišanje od 8€. AZETA BIO organska kozmetika. Stolice u obliku autića, crtaći i igračke."
  };

  return (
    <html lang="sr-Latn-ME">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700;800&family=Nunito:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
