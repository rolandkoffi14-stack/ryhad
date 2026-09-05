import Image from "next/image";

export default function RootLoading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-xs select-none">
      <div className="flex flex-col items-center space-y-4">
        {/* Conteneur Logo avec spinner rotatif élégant */}
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-2xl border-2 border-slate-100 shadow-sm flex items-center justify-center bg-white p-2">
            <Image
              src="/images/logo.webp"
              alt="RyHaD Tic-Medic"
              width={48}
              height={48}
              className="w-full h-full object-contain rounded-xl"
            />
          </div>
          {/* Anneau de chargement rotatif bicolore */}
          <div className="absolute -inset-2 border-2 border-brand-blue/20 border-t-brand-blue border-r-brand-green rounded-3xl animate-spin" />
        </div>

        <div className="text-center space-y-1">
          <p className="text-xs font-extrabold text-slate-800 tracking-tight">
            RyHaD Tic-Medic
          </p>
          <p className="text-[11px] font-semibold text-slate-400 animate-pulse">
            Chargement en cours...
          </p>
        </div>
      </div>
    </div>
  );
}
