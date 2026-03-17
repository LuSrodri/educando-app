"use client"

import { useEffect, useState } from "react"
import { AFFILIATE_ADS, type AffiliateAd } from "@/lib/affiliate-ads"
import { ShoppingBag, ExternalLink } from "lucide-react"

interface AffiliateAdBannerProps {
  /** Optional fixed ad index (0-3). If omitted, picks randomly on mount. */
  adIndex?: number
}

export function AffiliateAdBanner({ adIndex }: AffiliateAdBannerProps) {
  const [ad, setAd] = useState<AffiliateAd | null>(null)

  useEffect(() => {
    if (adIndex !== undefined) {
      setAd(AFFILIATE_ADS[adIndex % AFFILIATE_ADS.length])
    } else {
      setAd(AFFILIATE_ADS[Math.floor(Math.random() * AFFILIATE_ADS.length)])
    }
  }, [adIndex])

  if (!ad) return null

  return (
    <div className="mt-6 rounded-xl border border-amber-100 bg-gradient-to-r from-amber-50/80 to-white overflow-hidden shadow-sm">
      {/* Header row */}
      <div className="flex items-center justify-between px-3 pt-2 pb-1.5 border-b border-amber-100/60">
        <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-amber-500/80">
          Parceiro
        </span>
        <img
          src="/ads/amazon-logo.webp"
          alt="Amazon"
          className="h-3 object-contain mx-2 my-1"
        />
      </div>

      {/* Ad content */}
      <a
        href={ad.affiliateUrl}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="flex items-center gap-3 p-3 group cursor-pointer"
        aria-label={`Anúncio: ${ad.name} — Ver na Amazon`}
      >
        {/* Product image */}
        <div className="w-14 h-14 shrink-0 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
          <img
            src={ad.imagePath}
            alt={ad.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-amber-600 font-semibold uppercase tracking-wider">{ad.category}</p>
          <p className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug">{ad.name}</p>
        </div>

        {/* CTA */}
        <div className="shrink-0">
          <div className="flex items-center gap-1.5 bg-amber-500 group-hover:bg-amber-600 text-white rounded-lg px-3 py-1.5 text-xs font-bold transition-colors duration-200 whitespace-nowrap">
            <ShoppingBag className="w-3 h-3" />
            <span className="hidden sm:inline">Ver oferta</span>
            <ExternalLink className="w-3 h-3 sm:hidden" />
          </div>
        </div>
      </a>
    </div>
  )
}
