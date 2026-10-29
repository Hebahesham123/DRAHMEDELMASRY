'use client';

import { useEffect, useRef, useState } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import type { Editor as TinyEditor } from 'tinymce';
import { MediaPicker } from './MediaPicker';
import { uploadFiles } from './MediaLibrary';
import { contentValueForKey } from '@/lib/admin/util';
import { fromStorageKey } from '@/lib/storage-key';
import { Icon } from './Icon';
import { Spinner } from './ui';

/**
 * Rich text editor (self-hosted TinyMCE from /tinymce) with an HTML code view.
 * The editor is uncontrolled: it only reports a value once the user really edits,
 * so opening and saving a page never rewrites the stored HTML.
 */
export default function HtmlEditor({
  value,
  onChange,
  dir,
  height = 520,
}: {
  value: string;
  onChange: (v: string) => void;
  dir: 'rtl' | 'ltr';
  height?: number;
}) {
  const [mode, setMode] = useState<'visual' | 'code'>('visual');
  const [ready, setReady] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const [picker, setPicker] = useState(false);
  const editorRef = useRef<TinyEditor | null>(null);
  const lastEmitted = useRef(value);
  const initial = useRef(value);

  // value changed from outside (code view, TOC generator, reset) → reload the visual editor
  useEffect(() => {
    if (value !== lastEmitted.current) {
      lastEmitted.current = value;
      initial.current = value;
      if (mode === 'visual') {
        setReady(false);
        setEditorKey((k) => k + 1);
      }
    }
  }, [value, mode]);

  const emit = (v: string) => {
    lastEmitted.current = v;
    onChange(v);
  };

  const switchMode = (m: 'visual' | 'code') => {
    if (m === mode) return;
    if (m === 'visual') {
      initial.current = value;
      setReady(false);
      setEditorKey((k) => k + 1);
    }
    setMode(m);
  };

  return (
    <div className="html-ed">
      <div className="html-ed-bar">
        <div className="seg">
          <button type="button" className={mode === 'visual' ? 'on' : ''} onClick={() => switchMode('visual')}>
            Visual
          </button>
          <button type="button" className={mode === 'code' ? 'on' : ''} onClick={() => switchMode('code')}>
            <Icon name="code" size={13} /> HTML code
          </button>
        </div>
        <div className="grow" />
        {mode === 'visual' && !ready && (
          <span className="small muted row-nowrap">
            <Spinner /> Loading editor…
          </span>
        )}
        <button type="button" className="btn btn-sm" onClick={() => setPicker(true)}>
          <Icon name="image" size={14} /> Insert image
        </button>
      </div>
      {mode === 'code' ? (
        <textarea className="textarea code" dir="ltr" spellCheck={false} value={value} onChange={(e) => emit(e.target.value)} style={{ height }} />
      ) : (
        <div style={{ minHeight: height }}>
          <Editor
            key={editorKey}
            tinymceScriptSrc="/tinymce/tinymce.min.js"
            licenseKey="gpl"
            initialValue={initial.current}
            onInit={(_e, editor) => {
              editorRef.current = editor;
              setReady(true);
            }}
            onEditorChange={(v, editor) => {
              // ignore the editor's own normalisation on load – only real edits count
              if (!editor.isDirty() && v !== lastEmitted.current) return;
              if (v !== lastEmitted.current) emit(v);
            }}
            init={{
              height,
              menubar: 'edit view insert format table tools',
              promotion: false,
              branding: false,
              plugins:
                'advlist autolink lists link image charmap preview anchor searchreplace visualblocks code fullscreen table directionality wordcount',
              toolbar:
                'undo redo | blocks | bold italic underline forecolor backcolor | alignleft aligncenter alignright alignjustify | ltr rtl | bullist numlist outdent indent | link medialib table | removeformat | visualblocks code fullscreen',
              directionality: dir,
              // keep the stored HTML exactly as it is (inline styles, <span id>, <font>, <style>, iframes …)
              valid_elements: '*[*]',
              extended_valid_elements: '*[*]',
              valid_children:
                '+body[style|script],+p[div|style],+div[style],+span[h1|h2|h3|h4|h5|h6|div|p|ul|ol|li|table|style|img|iframe|blockquote],+a[div|h1|h2|h3|h4|h5|h6|p|img|span],+strong[h1|h2|h3|h4|div|p|ul|ol],+b[h1|h2|h3|h4|div|p],+font[h1|h2|h3|h4|div|p|span]',
              verify_html: false,
              custom_elements: '~o:p',
              entity_encoding: 'raw',
              convert_urls: false,
              relative_urls: false,
              remove_script_host: false,
              allow_unsafe_link_target: true,
              allow_html_in_named_anchor: true,
              allow_conditional_comments: true,
              keep_styles: true,
              remove_trailing_brs: false,
              paste_data_images: false,
              image_advtab: true,
              link_default_target: '_self',
              block_formats: 'Paragraph=p; Heading 2=h2; Heading 3=h3; Heading 4=h4; Div=div; Preformatted=pre',
              content_style: `body{font-family:${dir === 'rtl' ? "Tahoma,'Segoe UI',Arial" : "system-ui,'Segoe UI',Arial"},sans-serif;font-size:15px;line-height:1.7;margin:14px 18px} img{max-width:100%;height:auto} iframe{max-width:100%}`,
              setup: (editor: TinyEditor) => {
                editor.ui.registry.addButton('medialib', {
                  icon: 'image',
                  tooltip: 'Insert image from the media library',
                  onAction: () => setPicker(true),
                });
              },
              images_upload_handler: async (blobInfo: { blob: () => Blob; filename: () => string }) => {
                const file = new File([blobInfo.blob()], blobInfo.filename(), { type: blobInfo.blob().type });
                const keys = await uploadFiles([file], () => {});
                if (!keys.length) throw new Error('Upload failed');
                return contentValueForKey(keys[0], fromStorageKey);
              },
            }}
          />
        </div>
      )}
      {picker && (
        <MediaPicker
          onClose={() => setPicker(false)}
          onPick={(v) => {
            const html = `<img src="${v.replace(/"/g, '&quot;')}" alt="" style="max-width:100%;height:auto;" />`;
            if (mode === 'visual' && editorRef.current) {
              editorRef.current.insertContent(html);
            } else {
              emit(value + '\n' + html);
            }
          }}
        />
      )}
    </div>
  );
}
