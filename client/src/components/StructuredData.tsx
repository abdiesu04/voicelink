export function StructuredData() {
  const organizationData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://getvoztra.com/#organization",
    "name": "Voztra",
    "url": "https://getvoztra.com",
    "logo": "https://getvoztra.com/favicon.png",
    "description": "Real-time voice translation service breaking language barriers across 47 languages with natural tone preservation",
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "email": "support@getvoztra.com"
    }
  };

  const productData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": "https://getvoztra.com/#product",
    "name": "Voztra",
    "url": "https://getvoztra.com",
    "applicationCategory": "CommunicationApplication",
    "operatingSystem": "Web",
    "description": "Real-time voice translation across 47 languages with natural tone preservation",
    "offers": [
      {
        "@type": "Offer",
        "url": "https://getvoztra.com/pricing",
        "name": "Free Plan",
        "price": "0",
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock",
        "description": "60 minutes lifetime allocation"
      },
      {
        "@type": "Offer",
        "url": "https://getvoztra.com/pricing",
        "name": "Starter Plan",
        "price": "9.99",
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock",
        "description": "350 minutes per month"
      },
      {
        "@type": "Offer",
        "url": "https://getvoztra.com/pricing",
        "name": "Pro Plan",
        "price": "29.99",
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock",
        "description": "1200 minutes per month with priority support"
      }
    ],
    "featureList": [
      "Real-time voice translation",
      "47 languages supported",
      "Natural tone and emotion preservation",
      "Gender-specific voice options",
      "Instant communication",
      "No language barriers"
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productData) }}
      />
    </>
  );
}
