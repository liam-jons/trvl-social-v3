import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import CodeBlock from '@tiptap/extension-code-block';
import CharacterCount from '@tiptap/extension-character-count';
import { useCallback } from 'react';
import GlassCard from '../../ui/GlassCard';

const RichTextEditor = ({
  content = '',
  onChange,
  placeholder = 'Write your post...',
  limit = 5000,
  className = ''
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-500 hover:text-blue-600 underline'
        }
      }),
      CodeBlock.configure({
        HTMLAttributes: {
          class: 'bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm'
        }
      }),
      CharacterCount.configure({
        limit
      })
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    }
  });

  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  const percentage = editor.storage.characterCount.characters() / limit * 100;

  return (
    <GlassCard className={`overflow-hidden ${className}`} padding="none">
      {/* Toolbar */}
      <div className="border-b border-white/10 p-3">
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            className={`px-2 py-1 rounded text-sm font-medium transition-colors ${
              editor.isActive('bold')
                ? 'bg-blue-500 text-white'
                : 'bg-white/10 hover:bg-white/20 text-gray-700 dark:text-gray-300'
            }`}
          >
            B
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            className={`px-2 py-1 rounded text-sm italic transition-colors ${
              editor.isActive('italic')
                ? 'bg-blue-500 text-white'
                : 'bg-white/10 hover:bg-white/20 text-gray-700 dark:text-gray-300'
            }`}
          >
            I
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            disabled={!editor.can().chain().focus().toggleStrike().run()}
            className={`px-2 py-1 rounded text-sm transition-colors ${
              editor.isActive('strike')
                ? 'bg-blue-500 text-white'
                : 'bg-white/10 hover:bg-white/20 text-gray-700 dark:text-gray-300'
            }`}
          >
            <span className="line-through">S</span>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCode().run()}
            disabled={!editor.can().chain().focus().toggleCode().run()}
            className={`px-2 py-1 rounded text-sm font-mono transition-colors ${
              editor.isActive('code')
                ? 'bg-blue-500 text-white'
                : 'bg-white/10 hover:bg-white/20 text-gray-700 dark:text-gray-300'
            }`}
          >
            &lt;/&gt;
          </button>

          <div className="w-px bg-white/20 mx-1" />

          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`px-2 py-1 rounded text-sm font-bold transition-colors ${
              editor.isActive('heading', { level: 1 })
                ? 'bg-blue-500 text-white'
                : 'bg-white/10 hover:bg-white/20 text-gray-700 dark:text-gray-300'
            }`}
          >
            H1
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`px-2 py-1 rounded text-sm font-bold transition-colors ${
              editor.isActive('heading', { level: 2 })
                ? 'bg-blue-500 text-white'
                : 'bg-white/10 hover:bg-white/20 text-gray-700 dark:text-gray-300'
            }`}
          >
            H2
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`px-2 py-1 rounded text-sm font-bold transition-colors ${
              editor.isActive('heading', { level: 3 })
                ? 'bg-blue-500 text-white'
                : 'bg-white/10 hover:bg-white/20 text-gray-700 dark:text-gray-300'
            }`}
          >
            H3
          </button>

          <div className="w-px bg-white/20 mx-1" />

          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`px-2 py-1 rounded text-sm transition-colors ${
              editor.isActive('bulletList')
                ? 'bg-blue-500 text-white'
                : 'bg-white/10 hover:bg-white/20 text-gray-700 dark:text-gray-300'
            }`}
          >
            •
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`px-2 py-1 rounded text-sm transition-colors ${
              editor.isActive('orderedList')
                ? 'bg-blue-500 text-white'
                : 'bg-white/10 hover:bg-white/20 text-gray-700 dark:text-gray-300'
            }`}
          >
            1.
          </button>

          <div className="w-px bg-white/20 mx-1" />

          <button
            onClick={setLink}
            className={`px-2 py-1 rounded text-sm transition-colors ${
              editor.isActive('link')
                ? 'bg-blue-500 text-white'
                : 'bg-white/10 hover:bg-white/20 text-gray-700 dark:text-gray-300'
            }`}
          >
            🔗
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`px-2 py-1 rounded text-sm transition-colors ${
              editor.isActive('codeBlock')
                ? 'bg-blue-500 text-white'
                : 'bg-white/10 hover:bg-white/20 text-gray-700 dark:text-gray-300'
            }`}
          >
            { }
          </button>

          <div className="w-px bg-white/20 mx-1" />

          <button
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().chain().focus().undo().run()}
            className="px-2 py-1 rounded text-sm bg-white/10 hover:bg-white/20 text-gray-700 dark:text-gray-300 disabled:opacity-50"
          >
            ↶
          </button>
          <button
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().chain().focus().redo().run()}
            className="px-2 py-1 rounded text-sm bg-white/10 hover:bg-white/20 text-gray-700 dark:text-gray-300 disabled:opacity-50"
          >
            ↷
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="p-4">
        <EditorContent
          editor={editor}
          className="prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[200px]"
        />
      </div>

      {/* Character Count */}
      <div className="border-t border-white/10 p-3">
        <div className="flex justify-between items-center text-sm">
          <div className="text-gray-500 dark:text-gray-400">
            {editor.storage.characterCount.characters()}/{limit} characters
          </div>
          <div className="flex items-center gap-2">
            <div className="w-16 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  percentage > 90 ? 'bg-red-500' :
                  percentage > 75 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
            {percentage > 100 && (
              <span className="text-red-500 text-xs font-medium">
                Over limit
              </span>
            )}
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

export default RichTextEditor;