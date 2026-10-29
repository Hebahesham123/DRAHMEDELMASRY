function Circle({ sized }: { sized?: boolean }) {
  return (
    <svg className="circle" xmlns="http://www.w3.org/2000/svg" {...(sized ? { width: 24, height: 24 } : {})} viewBox="0 0 24 24">
      <g className="circle-wrap" fill="none" strokeWidth="1" strokeLinejoin="round" strokeMiterlimit="10">
        <circle cx="12" cy="12" r="10.5"></circle>
      </g>
    </svg>
  );
}

/** Prev / pagination / next controls of the theme sliders. */
export default function SwiperNav({ className, type }: { className: string; type: 'progressbar' | 'bullets' }) {
  return (
    <div className={className}>
      <div className="swiper-prev">
        <div className="prev-container">
          <div className="container-inner">
            <div className="triangle"></div>
            <Circle />
          </div>
        </div>
      </div>
      <div className={type === 'bullets' ? 'swiper-pagination  mr-30 ml-30 heading-color' : 'swiper-pagination mr-30 ml-30 heading-color'} data-dsn-type={type}></div>
      <div className="swiper-next">
        <div className="next-container">
          <div className="container-inner">
            <div className="triangle"></div>
            <Circle sized />
          </div>
        </div>
      </div>
    </div>
  );
}
