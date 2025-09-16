import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import CharacterCount from '@tiptap/extension-character-count';
import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  ListBulletIcon,
  NumberedListIcon,
  LinkIcon,
  CodeBracketIcon
} from '@heroicons/react/24/outline';
import GlassCard from '../../ui/GlassCard';

const ADVENTURE_TYPES = [
  { value: 'outdoor', label: 'Outdoor Adventure' },
  { value: 'cultural', label: 'Cultural Experience' },
  { value: 'wildlife', label: 'Wildlife & Nature' },
  { value: 'water', label: 'Water Sports' },
  { value: 'winter', label: 'Winter Activities' },
  { value: 'wellness', label: 'Wellness & Retreat' },
  { value: 'photography', label: 'Photography Tour' },
  { value: 'food', label: 'Food & Culinary' },
  { value: 'urban', label: 'Urban Exploration' },
  { value: 'luxury', label: 'Luxury Experience' }
];

const DIFFICULTY_LEVELS = [
  { value: 'easy', label: 'Easy', description: 'Suitable for beginners' },
  { value: 'moderate', label: 'Moderate', description: 'Some experience helpful' },
  { value: 'challenging', label: 'Challenging', description: 'Advanced skill level required' },
  { value: 'expert', label: 'Expert', description: 'Professional expertise needed' }
];

const BasicDetailsForm = ({ data, onChange }) => {
  // Rich text editor for description
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
      }),
      CharacterCount.configure({
        limit: 1000,
      }),
    ],
    content: data.description || '',
    onUpdate: ({ editor }) => {
      onChange({ description: editor.getHTML() });
    },
  });

  // Rich text editor for long description
  const longDescriptionEditor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
      }),
      CharacterCount.configure({
        limit: 3000,
      }),
    ],
    content: data.longDescription || '',
    onUpdate: ({ editor }) => {
      onChange({ longDescription: editor.getHTML() });
    },
  });

  const handleInputChange = (field, value) => {
    onChange({ [field]: value });
  };

  const MenuBar = ({ editor, characterLimit }) => {
    if (!editor) {
      return null;
    }

    const addLink = () => {
      const url = window.prompt('Enter URL:');
      if (url) {
        editor.chain().focus().setLink({ href: url }).run();
      }
    };

    return (
      <div className="flex items-center gap-2 p-3 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={`p-2 rounded transition-colors ${
            editor.isActive('bold')
              ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <BoldIcon className="h-4 w-4" />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={`p-2 rounded transition-colors ${
            editor.isActive('italic')
              ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <ItalicIcon className="h-4 w-4" />
        </button>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded transition-colors ${
            editor.isActive('bulletList')
              ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <ListBulletIcon className="h-4 w-4" />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded transition-colors ${
            editor.isActive('orderedList')
              ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <NumberedListIcon className="h-4 w-4" />
        </button>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

        <button
          onClick={addLink}
          className={`p-2 rounded transition-colors ${
            editor.isActive('link')
              ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <LinkIcon className="h-4 w-4" />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`p-2 rounded transition-colors ${
            editor.isActive('codeBlock')
              ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <CodeBracketIcon className="h-4 w-4" />
        </button>

        <div className="flex-1" />

        <span className="text-xs text-gray-500 dark:text-gray-400">
          {editor.storage.characterCount.characters()}/{characterLimit}
        </span>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Basic Adventure Details
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Provide essential information about your adventure experience.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Adventure Title */}
        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Adventure Title *
          </label>
          <input
            type="text"
            value={data.title || ''}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="Enter an engaging adventure title..."
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
            required
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Location *
          </label>
          <input
            type="text"
            value={data.location || ''}
            onChange={(e) => handleInputChange('location', e.target.value)}
            placeholder="City, Country"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
            required
          />
        </div>

        {/* Adventure Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Adventure Type *
          </label>
          <select
            value={data.adventureType || 'outdoor'}
            onChange={(e) => handleInputChange('adventureType', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
          >
            {ADVENTURE_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Duration *
          </label>
          <input
            type="text"
            value={data.duration || ''}
            onChange={(e) => handleInputChange('duration', e.target.value)}
            placeholder="e.g., 3 days, 2 weeks, 1 hour"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
            required
          />
        </div>

        {/* Difficulty Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Difficulty Level *
          </label>
          <select
            value={data.difficulty || 'moderate'}
            onChange={(e) => handleInputChange('difficulty', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
          >
            {DIFFICULTY_LEVELS.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label} - {level.description}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Group Size */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Min Group Size *
          </label>
          <input
            type="number"
            min="1"
            max="50"
            value={data.groupSizeMin || 2}
            onChange={(e) => handleInputChange('groupSizeMin', parseInt(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Max Group Size *
          </label>
          <input
            type="number"
            min="1"
            max="50"
            value={data.groupSizeMax || 12}
            onChange={(e) => handleInputChange('groupSizeMax', parseInt(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
          />
        </div>
      </div>

      {/* Short Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Short Description *
        </label>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          A brief, engaging overview that appears in search results and listings.
        </p>
        <GlassCard variant="light" padding="none" className="overflow-hidden">
          <MenuBar editor={editor} characterLimit={1000} />
          <EditorContent
            editor={editor}
            className="prose dark:prose-invert max-w-none p-4 min-h-[120px] focus-within:bg-white/50 dark:focus-within:bg-gray-800/50 transition-colors"
          />
        </GlassCard>
      </div>

      {/* Detailed Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Detailed Description
        </label>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          Provide comprehensive details about what participants can expect.
        </p>
        <GlassCard variant="light" padding="none" className="overflow-hidden">
          <MenuBar editor={longDescriptionEditor} characterLimit={3000} />
          <EditorContent
            editor={longDescriptionEditor}
            className="prose dark:prose-invert max-w-none p-4 min-h-[200px] focus-within:bg-white/50 dark:focus-within:bg-gray-800/50 transition-colors"
          />
        </GlassCard>
      </div>
    </div>
  );
};

export default BasicDetailsForm;