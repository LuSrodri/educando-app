import Script from "next/script"

const ADSTERRA_KEY = "bdd93ec92e5065d75c888880804c62b0"

export function AdsterraBanner() {
  return (
    <div className="container mx-auto flex justify-center px-4 py-6">
      <div id={`container-${ADSTERRA_KEY}`} />
      <Script
        id={`adsterra-${ADSTERRA_KEY}`}
        src={`https://pl29469931.effectivecpmnetwork.com/${ADSTERRA_KEY}/invoke.js`}
        strategy="afterInteractive"
        data-cfasync="false"
        async
      />
    </div>
  )
}
