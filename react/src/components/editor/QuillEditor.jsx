import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, false] }],
  ['bold', 'italic', 'underline'],
  [{ list: 'ordered' }, { list: 'bullet' }],
  ['blockquote'],
  ['clean'],
];

const QuillEditor = forwardRef(function QuillEditor(
  { initialValue = '', onChange, placeholder = '', minHeight = '150px' },
  ref
) {
  // wrapperRef é o elemento estável — Quill vai criar toolbar + container dentro dele
  const wrapperRef = useRef(null);
  const quillRef = useRef(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    // Cria o elemento que o Quill vai usar como editor (filho do wrapper)
    const editorEl = document.createElement('div');
    wrapper.appendChild(editorEl);

    const quill = new Quill(editorEl, {
      theme: 'snow',
      placeholder,
      modules: { toolbar: TOOLBAR_OPTIONS },
    });

    quillRef.current = quill;

    if (initialValue) {
      quill.root.innerHTML = initialValue;
    }

    quill.on('text-change', () => {
      const html = quill.root.innerHTML;
      onChangeRef.current?.(html === '<p><br></p>' ? '' : html);
    });

    return () => {
      quillRef.current = null;
      // Remove tudo que o Quill inseriu dentro do wrapper (toolbar + container)
      wrapper.innerHTML = '';
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useImperativeHandle(ref, () => ({
    getContent: () => quillRef.current?.root.innerHTML || '',
    isEmpty: () => !quillRef.current || quillRef.current.getText().trim() === '',
    setContent: (html) => {
      if (quillRef.current) {
        quillRef.current.root.innerHTML = html || '';
      }
    },
  }));

  return (
    <div
      ref={wrapperRef}
      style={{ '--quill-min-height': minHeight }}
    />
  );
});

export default QuillEditor;
