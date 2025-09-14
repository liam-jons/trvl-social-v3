import { useState } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { GlassCard, GlassButton, GlassModal } from './components/ui';
import ThemeToggle from './components/ui/ThemeToggle';

function App() {
  const [modalOpen, setModalOpen] = useState(false);
  const [count, setCount] = useState(0);

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 transition-colors duration-500">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent"></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 py-8">
          <header className="mb-12">
            <GlassCard className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-gradient">
                Glassmorphic Design System
              </h1>
              <ThemeToggle />
            </GlassCard>
          </header>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <GlassCard>
              <h2 className="text-xl font-semibold mb-4">Default Glass Card</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                This is a glassmorphic card with backdrop blur and transparency effects.
              </p>
              <div className="flex gap-2">
                <GlassButton size="sm" onClick={() => setCount(count + 1)}>
                  Count: {count}
                </GlassButton>
                <GlassButton size="sm" variant="ghost" onClick={() => setCount(0)}>
                  Reset
                </GlassButton>
              </div>
            </GlassCard>

            <GlassCard variant="primary">
              <h2 className="text-xl font-semibold mb-4">Primary Card</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                A card with primary color theming.
              </p>
              <GlassButton variant="primary" onClick={() => setModalOpen(true)}>
                Open Modal
              </GlassButton>
            </GlassCard>

            <GlassCard variant="secondary">
              <h2 className="text-xl font-semibold mb-4">Secondary Card</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                A card with secondary color theming.
              </p>
              <GlassButton variant="secondary">
                Secondary Action
              </GlassButton>
            </GlassCard>

            <GlassCard variant="accent" blur="lg">
              <h2 className="text-xl font-semibold mb-4">Accent Card</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                A card with accent color and large blur.
              </p>
              <GlassButton variant="accent">
                Accent Action
              </GlassButton>
            </GlassCard>

            <GlassCard variant="light" blur="sm">
              <h2 className="text-xl font-semibold mb-4">Light Card</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                A lighter variant with small blur effect.
              </p>
              <div className="flex gap-2">
                <GlassButton size="lg">Large</GlassButton>
                <GlassButton size="md">Medium</GlassButton>
                <GlassButton size="sm">Small</GlassButton>
              </div>
            </GlassCard>

            <GlassCard variant="dark" blur="xl">
              <h2 className="text-xl font-semibold mb-4">Dark Card</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                A darker variant with extra large blur.
              </p>
              <GlassButton variant="danger">
                Danger Action
              </GlassButton>
            </GlassCard>
          </div>

          <div className="mt-12">
            <GlassCard padding="lg">
              <h2 className="text-2xl font-bold mb-6">Button Variants</h2>
              <div className="flex flex-wrap gap-4">
                <GlassButton variant="default">Default</GlassButton>
                <GlassButton variant="primary">Primary</GlassButton>
                <GlassButton variant="secondary">Secondary</GlassButton>
                <GlassButton variant="accent">Accent</GlassButton>
                <GlassButton variant="ghost">Ghost</GlassButton>
                <GlassButton variant="danger">Danger</GlassButton>
                <GlassButton disabled>Disabled</GlassButton>
              </div>
            </GlassCard>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <GlassCard className="text-center">
              <div className="text-3xl font-bold text-primary-500">320px</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Mobile</div>
            </GlassCard>
            <GlassCard className="text-center">
              <div className="text-3xl font-bold text-secondary-500">768px</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Tablet</div>
            </GlassCard>
            <GlassCard className="text-center">
              <div className="text-3xl font-bold text-accent-500">1024px</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Desktop</div>
            </GlassCard>
            <GlassCard className="text-center">
              <div className="text-3xl font-bold text-gradient">1440px</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Wide</div>
            </GlassCard>
          </div>
        </div>

        <GlassModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Glassmorphic Modal"
          size="md"
        >
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            This is a glassmorphic modal with backdrop blur effects. It supports
            different sizes and can be closed by clicking outside, pressing ESC,
            or clicking the close button.
          </p>
          <div className="flex gap-2 justify-end">
            <GlassButton variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </GlassButton>
            <GlassButton variant="primary" onClick={() => setModalOpen(false)}>
              Confirm
            </GlassButton>
          </div>
        </GlassModal>
      </div>
    </ThemeProvider>
  );
}

export default App;