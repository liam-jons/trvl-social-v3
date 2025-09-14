import GlassCard from './GlassCard';

export default {
  title: 'Glassmorphic/GlassCard',
  component: GlassCard,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'gradient',
      values: [
        {
          name: 'gradient',
          value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        },
        {
          name: 'dark',
          value: '#1a1a1a',
        },
        {
          name: 'light',
          value: '#f3f4f6',
        },
      ],
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'light', 'dark', 'primary', 'secondary', 'accent'],
    },
    blur: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
    padding: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg', 'xl'],
    },
  },
};

export const Default = {
  args: {
    children: (
      <div>
        <h2 className="text-xl font-bold mb-2">Glass Card</h2>
        <p className="text-gray-600 dark:text-gray-300">
          This is a glassmorphic card component with backdrop blur effects.
        </p>
      </div>
    ),
  },
};

export const PrimaryVariant = {
  args: {
    variant: 'primary',
    children: (
      <div>
        <h2 className="text-xl font-bold mb-2">Primary Card</h2>
        <p className="text-gray-600 dark:text-gray-300">
          A card with primary color theming.
        </p>
      </div>
    ),
  },
};

export const SecondaryVariant = {
  args: {
    variant: 'secondary',
    children: (
      <div>
        <h2 className="text-xl font-bold mb-2">Secondary Card</h2>
        <p className="text-gray-600 dark:text-gray-300">
          A card with secondary color theming.
        </p>
      </div>
    ),
  },
};

export const AccentVariant = {
  args: {
    variant: 'accent',
    blur: 'lg',
    children: (
      <div>
        <h2 className="text-xl font-bold mb-2">Accent Card</h2>
        <p className="text-gray-600 dark:text-gray-300">
          A card with accent color and large blur.
        </p>
      </div>
    ),
  },
};

export const LightVariant = {
  args: {
    variant: 'light',
    blur: 'sm',
    children: (
      <div>
        <h2 className="text-xl font-bold mb-2">Light Card</h2>
        <p className="text-gray-600 dark:text-gray-300">
          A lighter variant with small blur effect.
        </p>
      </div>
    ),
  },
};

export const DarkVariant = {
  args: {
    variant: 'dark',
    blur: 'xl',
    children: (
      <div>
        <h2 className="text-xl font-bold mb-2">Dark Card</h2>
        <p className="text-gray-600 dark:text-gray-300">
          A darker variant with extra large blur.
        </p>
      </div>
    ),
  },
};

export const NoPadding = {
  args: {
    padding: 'none',
    children: (
      <div className="p-6">
        <h2 className="text-xl font-bold mb-2">Custom Padding</h2>
        <p className="text-gray-600 dark:text-gray-300">
          This card has no default padding, custom padding applied to content.
        </p>
      </div>
    ),
  },
};