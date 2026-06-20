'use client';

import { useRouter } from 'next/navigation';

export default function AksesCepatInformasi() {
  const router = useRouter();

  const cards = [
    {
      title: 'Tracer Studi Lulusan',
      desc: 'Lacak alumni & kelanjutan studi',
      icon: '🎓',
      gradient: 'from-blue-500 to-blue-700',
      href: '/formulir/tracer-studi',
      btnText: 'Isi Formulir',
    },
    {
      title: 'SNBP / SNBT',
      desc: 'Pendataan seleksi masuk PT',
      icon: '📋',
      gradient: 'from-purple-500 to-purple-700',
      href: '/formulir/snbp-snbt',
      btnText: 'Isi Formulir',
    },
    {
      title: 'Pemetaan Karir',
      desc: 'Minat & cita-cita siswa',
      icon: '🎯',
      gradient: 'from-rose-500 to-rose-700',
      href: '/formulir/pemetaan-karir',
      btnText: 'Isi Formulir',
    },
    {
      title: 'Seputar Sekolah',
      desc: 'Berita & informasi terbaru',
      icon: '📰',
      gradient: 'from-emerald-500 to-emerald-700',
      href: '/berita-sekolah',
      btnText: 'Lihat Berita',
    },
  ];

  const handleClick = (e, href) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(href);
  };

  return (
    <div className="bg-[#f5f5f5] py-8 px-4 md:px-8">
      <div className="bg-white rounded-3xl shadow-md p-6 md:p-8">
        <h2 className="text-2xl md:text-3xl font-extrabold text-[#1976D2] uppercase tracking-wide mb-6">
          Akses Cepat Informasi
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {cards.map((card) => (
            <div
              key={card.title}
              className={`relative rounded-2xl bg-gradient-to-br ${card.gradient} p-4 md:p-5 text-white overflow-hidden cursor-pointer group transition-all duration-300 hover:-translate-y-3 hover:shadow-2xl hover:shadow-black/20 active:scale-95`}
              onClick={(e) => handleClick(e, card.href)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleClick(e, card.href);
                }
              }}
            >
              {/* Decorative circles */}
              <div className="absolute -right-4 -top-4 w-20 md:w-24 h-20 md:h-24 bg-white/10 rounded-full transition-transform duration-300 group-hover:scale-150" />
              <div className="absolute -right-2 -bottom-6 w-14 md:w-16 h-14 md:h-16 bg-white/10 rounded-full transition-transform duration-300 group-hover:scale-150" />

              <div className="relative z-10">
                {/* Icon dengan animasi naik turun */}
                <span className="text-2xl md:text-3xl block mb-2 md:mb-3 inline-block animate-bounce-slow">
                  {card.icon}
                </span>
                <h3 className="font-bold text-xs md:text-sm mb-0.5">{card.title}</h3>
                <p className="text-[9px] md:text-[11px] text-white/80 mb-3 md:mb-4 leading-tight">{card.desc}</p>
                <span className="inline-block bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-[10px] md:text-xs font-semibold px-2.5 md:px-3 py-1 md:py-1.5 rounded-full transition-all">
                  {card.btnText} →
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-6px);
          }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }

        /* Supaya animasi tiap kartu tidak sinkron */
        .grid > :nth-child(1) .animate-bounce-slow {
          animation-delay: 0s;
        }
        .grid > :nth-child(2) .animate-bounce-slow {
          animation-delay: 0.3s;
        }
        .grid > :nth-child(3) .animate-bounce-slow {
          animation-delay: 0.6s;
        }
        .grid > :nth-child(4) .animate-bounce-slow {
          animation-delay: 0.9s;
        }
      `}</style>
    </div>
  );
}