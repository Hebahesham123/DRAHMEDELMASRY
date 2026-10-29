import { deferred } from '@/lib/defer';
import type { Lang } from '@/lib/types';

export interface FormTexts {
  form_title?: string;
  ph_name?: string;
  ph_email?: string;
  ph_phone?: string;
  ph_message?: string;
  submit?: string;
  messages?: { name?: string; email?: string; phone?: string; message?: string };
}

const SENT: Record<Lang, string> = {
  ar: 'تم إرسال رسالتك بنجاح، سنتواصل معك قريبًا.',
  en: 'Your message has been sent. We will contact you soon.',
};

export function validateScript(f: FormTexts) {
  const m = f.messages || {};
  const j = JSON.stringify;
  return `$("#contact-form").validate({ rules: { name: { required: true, placeholder: true }, phone: { required: true, placeholder: true }, email: { required: true, email: true, placeholder:true }, message: { required: true, minlength: 5, placeholder:true } }, messages: { name: {required:${j(m.name)},placeholder:${j(m.name)}}, email: { required: ${j(m.email)}, email: ${j(m.email)}, placeholder: ${j(m.email)} }, phone: { required: ${j(m.phone)}, placeholder:${j(m.phone)}}, message: { required: ${j(m.message)}, placeholder:${j(m.message)},minlength:${j(m.message)}} } });`;
}

/** The contact form exactly as on the old site. It posts to /Home/SendEmail (same address as before). */
export default function ContactForm({ f, lang, page }: { f: FormTexts; lang: Lang; page: string }) {
  return (
    <>
      <div className="dsn-form mt-20 form-box d-flex flex-column">
        <form id="contact-form" className="form w-100" method="post" action="/Home/SendEmail" data-toggle="validator">
          <input type="hidden" name="lang" value={lang} />
          <input type="hidden" name="page" value={page} />
          <div className="messages"></div>
          <div className="input__wrap controls">
            <div className="d-grid grid-md-2" data-dsn-gap="0px 30px">
              <div className="form-group dsn-up">
                <div className="entry-box">
                  <input id="form_name" type="text" name="name" placeholder={f.ph_name} />
                </div>
                <div className="help-block with-errors"></div>
              </div>
              <div className="form-group dsn-up">
                <div className="entry-box">
                  <input id="form_email" type="email" name="email" placeholder={f.ph_email} />
                </div>
                <div className="help-block with-errors"></div>
              </div>
              <div className="form-group dsn-up">
                <div className="entry-box">
                  <input id="form_phone" type="text" name="phone" placeholder={f.ph_phone} />
                </div>
                <div className="help-block with-errors"></div>
              </div>
            </div>
            <div className="form-group dsn-up">
              <div className="entry-box">
                <textarea id="form_message" className="form-control" name="message" rows={7} placeholder={f.ph_message}></textarea>
              </div>
              <div className="help-block with-errors"></div>
            </div>
            <div className="d-flex dsn-up">
              <div className="image-zoom move-circle border-color-default border-style border-rdu" data-dsn="parallax">
                <input type="submit" value={f.submit} />
              </div>
            </div>
          </div>
        </form>
      </div>
      <script
        type="text/javascript"
        dangerouslySetInnerHTML={{
          __html: deferred(
            validateScript(f) +
              `if (/[?&]sent=1/.test(location.search)) { var m = document.querySelector('#contact-form .messages'); if (m) { m.textContent = ${JSON.stringify(SENT[lang])}; m.className = 'messages alert alert-success'; } }`,
          ),
        }}
      />
    </>
  );
}
