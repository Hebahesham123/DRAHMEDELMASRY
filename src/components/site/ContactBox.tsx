export default function ContactBox({ title, text, button }: { title: string; text: string; button: string }) {
  return (
    <div className="dsn-item-post grid-item over-hidden p-30 mt-30 border-style">
      <div className="box-content text-center">
        <div className="post-content dsn-bg p-relative z-index-1 d-flex flex-column">
          <div className="post-title-info">
            <h5 className="post-title dsn-bg title-block title-color-cus">{title}</h5>
          </div>
          <p className="max-w750 mt-20">{text}</p>
          <div className="dsn-normal-btn  d-flex justify-content-center mt-20">
            <a className="dsn-btn dsn-border border-color-default background-section effect-ajax border-rdu move-circle" data-dsn="parallax" href="/contactus" data-dsn-text={button}>
              <span className="title-btn p-relative z-index-1">{button}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
