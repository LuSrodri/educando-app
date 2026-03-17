"use client"

import type { AffiliateAd } from "@/lib/affiliate-ads"
import { ShoppingBag } from "lucide-react"

interface AffiliateAdCardProps {
  ad: AffiliateAd
}

export function AffiliateAdCard({ ad }: AffiliateAdCardProps) {
  return (
    <a
      href={ad.affiliateUrl}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="block group cursor-pointer"
      aria-label={`Anúncio: ${ad.name} — Ver na Amazon`}
    >
      <div className="relative overflow-hidden rounded-xl border border-amber-200 bg-white shadow-sm hover:shadow-md hover:border-amber-400 transition-all duration-300 h-full flex flex-col">
        {/* Ad label */}
        <div className="absolute top-2 left-2 z-10">
          <span className="text-[10px] font-semibold tracking-widest uppercase bg-white/90 text-amber-600 border border-amber-200 rounded-full px-2 py-0.5 backdrop-blur-sm">
            Anúncio
          </span>
        </div>

        {/* Product image */}
        <div className="relative aspect-[3/4] overflow-hidden bg-gray-50">
          <img
            src={ad.imagePath}
            alt={ad.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* Content */}
        <div className="p-3 flex flex-col gap-2 flex-1">
          <div>
            <p className="text-[10px] text-amber-600 font-semibold uppercase tracking-wider">{ad.category}</p>
            <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-snug mt-0.5">{ad.name}</p>
          </div>

          <div className="mt-auto">
            <div className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg px-2.5 py-1.5 text-xs font-bold transition-colors duration-200 justify-center">
              <ShoppingBag className="w-3 h-3 shrink-0" />
              <span>Ver na Amazon</span>
            </div>
            {/* Amazon logo */}
            <div className="flex justify-center mt-2">
              <img
                src="/ads/amazon-logo.webp"
                alt="Amazon"
                className="h-3.5 object-contain mx-2 my-1"
              />
            </div>
          </div>
        </div>
      </div>
    </a>
  )
}
