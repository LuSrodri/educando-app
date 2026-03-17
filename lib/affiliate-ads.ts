export interface AffiliateAd {
  id: string
  name: string
  shortName: string
  imagePath: string
  affiliateUrl: string
  category: string
}

export const AFFILIATE_ADS: AffiliateAd[] = [
  {
    id: "lava-loucas-brastemp",
    name: "Lava-louças Brastemp",
    shortName: "Lava-louças Brastemp",
    imagePath: "/ads/lava-loucas-brastemp.jpg",
    affiliateUrl: "https://amzn.to/3NitOtv",
    category: "Casa",
  },
  {
    id: "roomba-505",
    name: "Aspirador Roomba 505",
    shortName: "Roomba 505",
    imagePath: "/ads/roomba-505.jpg",
    affiliateUrl: "https://amzn.to/4bfbomG",
    category: "Casa",
  },
  {
    id: "samsung-a17",
    name: "Samsung Galaxy A17",
    shortName: "Samsung A17",
    imagePath: "/ads/samsung-a17.jpg",
    affiliateUrl: "https://amzn.to/4luDopG",
    category: "Smartphone",
  },
  {
    id: "stanley-aerolight",
    name: "Stanley Aerolight",
    shortName: "Stanley Aerolight",
    imagePath: "/ads/stanley-aerolight.jpg",
    affiliateUrl: "https://amzn.to/4lxdz8D",
    category: "Lifestyle",
  },
]

/** Returns a deterministically seeded random ad based on a seed value */
export function getRandomAd(seed?: number): AffiliateAd {
  const index = seed !== undefined
    ? seed % AFFILIATE_ADS.length
    : Math.floor(Math.random() * AFFILIATE_ADS.length)
  return AFFILIATE_ADS[index]
}

/** Returns a random number between min and max (inclusive) based on a seed */
export function seededInterval(seed: number, min: number, max: number): number {
  const range = max - min + 1
  return min + (seed % range)
}
